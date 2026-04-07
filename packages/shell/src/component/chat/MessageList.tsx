import { useEffect, useRef, useState } from 'react'

import { MESSAGE_INTENT, type ChatMessage } from '@maia/shared'

import { AgentMessage } from './AgentMessage'
import { DebateThread } from './DebateThread'
import { UserMessage } from './UserMessage'
import { formatDayLabel, isMessageContinuation, isSameCalendarDay } from './chatMeta'

interface MessageListProps {
  messages: ChatMessage[]
  onReply: (message: ChatMessage) => void
}

interface IndexedMessage {
  index: number
  message: ChatMessage
}

interface SingleRenderItem {
  kind: 'single'
  item: IndexedMessage
}

interface DebateRenderItem {
  kind: 'debate'
  items: IndexedMessage[]
}

type RenderItem = SingleRenderItem | DebateRenderItem

const DEBATE_WINDOW_MS = 30_000
const DEBATE_INTENTS = new Set([
  MESSAGE_INTENT.CHALLENGE,
  'correction',
  'flag',
  'recommendation',
])

function buildRenderItems(messages: ChatMessage[]): RenderItem[] {
  const items: RenderItem[] = []
  let index = 0

  while (index < messages.length) {
    const message = messages[index]
    if (!message) {
      break
    }

    if (message.sender === 'user') {
      items.push({
        kind: 'single',
        item: { index, message },
      })
      index += 1
      continue
    }

    const run: IndexedMessage[] = [{ index, message }]
    let cursor = index + 1

    while (cursor < messages.length) {
      const previous = messages[cursor - 1]
      const current = messages[cursor]
      if (!previous || !current) {
        break
      }

      if (current.sender === 'user') {
        break
      }

      if (!isSameCalendarDay(previous.timestamp, current.timestamp)) {
        break
      }

      if (current.timestamp - previous.timestamp > DEBATE_WINDOW_MS) {
        break
      }

      run.push({ index: cursor, message: current })
      cursor += 1
    }

    const uniqueAgents = new Set(run.map((entry) => entry.message.sender))
    const hasDebateSignal = run.some((entry) => DEBATE_INTENTS.has(entry.message.intent))
    const isDebate = run.length >= 2 && uniqueAgents.size >= 2 && hasDebateSignal

    if (isDebate) {
      items.push({ kind: 'debate', items: run })
    } else {
      for (const entry of run) {
        items.push({ kind: 'single', item: entry })
      }
    }

    index = cursor
  }

  return items
}

export function MessageList({ messages, onReply }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const messagesById = new Map(messages.map((message) => [message.id, message]))
  const renderItems = buildRenderItems(messages)

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [autoScroll, messages])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setAutoScroll(isNearBottom)
  }

  const jumpToMessage = (messageId: string) => {
    const element = document.getElementById(`chat-message-${messageId}`)
    if (!element) {
      return
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.animate(
      [
        { backgroundColor: 'rgba(59, 130, 246, 0.18)' },
        { backgroundColor: 'rgba(59, 130, 246, 0.06)' },
        { backgroundColor: 'rgba(59, 130, 246, 0)' },
      ],
      { duration: 900, easing: 'ease-out' },
    )
  }

  const renderMessage = (entry: IndexedMessage, compact: boolean, allowDayDivider = true) => {
    const previousMessage = messages[entry.index - 1]
    const showDayDivider = allowDayDivider
      && (!previousMessage || !isSameCalendarDay(previousMessage.timestamp, entry.message.timestamp))
    const isContinuation = isMessageContinuation(previousMessage, entry.message)
    const replyToMessage = entry.message.replyToId ? messagesById.get(entry.message.replyToId) : undefined

    const content = entry.message.sender === 'user'
      ? (
          <UserMessage
            isContinuation={isContinuation}
            message={entry.message}
            onJumpToMessage={jumpToMessage}
            onReply={onReply}
            replyToMessage={replyToMessage}
          />
        )
      : (
          <AgentMessage
            compact={compact}
            isContinuation={isContinuation}
            message={entry.message}
            onJumpToMessage={jumpToMessage}
            onReply={onReply}
            replyToMessage={replyToMessage}
          />
        )

    return (
      <div key={entry.message.id}>
        {showDayDivider ? (
          <div className="my-4 flex items-center gap-3 px-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-textMuted">
              {formatDayLabel(entry.message.timestamp)}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}
        <div id={`chat-message-${entry.message.id}`}>{content}</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_28%)]"
      onScroll={handleScroll}
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-1 items-center justify-center px-8 py-12 text-center">
            <div className="max-w-md rounded-3xl border border-border bg-white/[0.03] px-8 py-10">
              <p className="text-lg font-semibold text-textPrimary">Team Chat is ready</p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                Ask Maia to take action, reply to agents when you want to redirect work, and keep the full task trail in one channel.
              </p>
            </div>
          </div>
        ) : renderItems.map((item) => {
          if (item.kind === 'single') {
            return renderMessage(item.item, false)
          }

          return (
            <div key={`debate-${item.items[0]?.message.id ?? 'group'}`}>
              {item.items[0] ? (() => {
                const first = item.items[0]
                const previousMessage = messages[first.index - 1]
                const showDayDivider = !previousMessage || !isSameCalendarDay(previousMessage.timestamp, first.message.timestamp)
                if (!showDayDivider) {
                  return null
                }
                return (
                  <div className="my-4 flex items-center gap-3 px-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-textMuted">
                      {formatDayLabel(first.message.timestamp)}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )
              })() : null}
              <DebateThread>
                {item.items.map((entry) => renderMessage(entry, true, false))}
              </DebateThread>
            </div>
          )
        })}
      </div>
    </div>
  )
}
