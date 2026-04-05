import { useEffect, useRef, useState } from 'react'

import type { ChatMessage } from '@maia/shared'

import { AgentMessage } from './AgentMessage'
import { UserMessage } from './UserMessage'
import { formatDayLabel, isMessageContinuation, isSameCalendarDay } from './chatMeta'

interface MessageListProps {
  messages: ChatMessage[]
  onReply: (message: ChatMessage) => void
}

export function MessageList({ messages, onReply }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const messagesById = new Map(messages.map((message) => [message.id, message]))

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

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_28%)]"
      onScroll={handleScroll}
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-1 items-center justify-center px-8 py-12 text-center">
            <div className="max-w-md rounded-3xl border border-border bg-white/[0.03] px-8 py-10">
              <p className="text-lg font-semibold text-textPrimary">Team Chat is ready</p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                Ask Maia to take action, reply to agents when you want to redirect work, and keep the full task trail in one channel.
              </p>
            </div>
          </div>
        ) : messages.map((message, index) => {
          const previousMessage = messages[index - 1]
          const showDayDivider = !previousMessage || !isSameCalendarDay(previousMessage.timestamp, message.timestamp)
          const isContinuation = isMessageContinuation(previousMessage, message)
          const replyToMessage = message.replyToId ? messagesById.get(message.replyToId) : undefined
          const content = message.sender === 'user'
            ? (
                <UserMessage
                  isContinuation={isContinuation}
                  message={message}
                  onJumpToMessage={jumpToMessage}
                  onReply={onReply}
                  replyToMessage={replyToMessage}
                />
              )
            : (
                <AgentMessage
                  isContinuation={isContinuation}
                  message={message}
                  onJumpToMessage={jumpToMessage}
                  onReply={onReply}
                  replyToMessage={replyToMessage}
                />
              )

          return (
            <div key={message.id}>
              {showDayDivider ? (
                <div className="my-4 flex items-center gap-3 px-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-textMuted">
                    {formatDayLabel(message.timestamp)}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              ) : null}
              <div id={`chat-message-${message.id}`}>{content}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
