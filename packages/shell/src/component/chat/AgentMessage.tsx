import { motion } from 'framer-motion'
import { useEffect, useState, type CSSProperties } from 'react'

import { MESSAGE_INTENT, type ChatMessage, type MessageIntent } from '@maia/shared'

import { parseComparisonGroup, inferConfidence, isResearchTimelineMessage } from '../../lib/researchSignals'
import { useTaskStore } from '../../store/taskStore'
import { ReplyPreview } from './ReplyPreview'
import { ComparisonGroup } from './ComparisonGroup'
import { formatMessageTime, getSenderMeta } from './chatMeta'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'

interface AgentMessageProps {
  compact?: boolean
  isContinuation: boolean
  message: ChatMessage
  onJumpToMessage: (messageId: string) => void
  onReply: (message: ChatMessage) => void
  replyToMessage?: ChatMessage
}

const PROACTIVE_INTENTS = new Set<MessageIntent>([
  'flag',
  'correction',
  'recommendation',
])

function getIntentBorderStyle(intent: MessageIntent, senderColor: string): CSSProperties | undefined {
  switch (intent) {
    case 'challenge':
      return { borderLeftWidth: '2px', borderLeftColor: senderColor }
    case 'correction':
      return { borderLeftWidth: '2px', borderLeftColor: '#EAB308' }
    case 'flag':
      return { borderLeftWidth: '2px', borderLeftColor: '#EF4444' }
    case 'recommendation':
      return { borderLeftWidth: '2px', borderLeftColor: '#3B82F6' }
    default:
      return undefined
  }
}

export function AgentMessage({
  compact = false,
  isContinuation,
  message,
  onJumpToMessage,
  onReply,
  replyToMessage,
}: AgentMessageProps) {
  const primaryAgentIds = useTaskStore((state) => state.primaryAgentIds)
  const profile = getSenderMeta(message.sender)
  const comparisonGroup = parseComparisonGroup(message.message)
  const confidence = inferConfidence(message.message)
  const showConfidence = comparisonGroup || /\bconfidence|checked \d+ (?:sites?|sources?)|cross-reference|cross reference|pretty confident|just started|checking more/i.test(message.message)
  const isTimelineRow = isContinuation && isResearchTimelineMessage(message.message)
  const isProactiveMessage = PROACTIVE_INTENTS.has(message.intent)
    && !primaryAgentIds.includes(message.sender)
    && message.sender !== 'computer'
    && message.sender !== 'user'
  const [showProactiveLabel, setShowProactiveLabel] = useState(isProactiveMessage)
  const [fadingProactiveLabel, setFadingProactiveLabel] = useState(false)
  const intentBorderStyle = getIntentBorderStyle(message.intent, profile.color)
  const rowPadding = compact || isTimelineRow ? 'py-1' : 'py-2'
  const displayText = isTimelineRow ? `-> ${message.message}` : message.message

  useEffect(() => {
    if (!isProactiveMessage) {
      setShowProactiveLabel(false)
      setFadingProactiveLabel(false)
      return
    }

    setShowProactiveLabel(true)
    setFadingProactiveLabel(false)

    const fadeTimeout = window.setTimeout(() => {
      setFadingProactiveLabel(true)
    }, 2500)
    const hideTimeout = window.setTimeout(() => {
      setShowProactiveLabel(false)
    }, 3000)

    return () => {
      window.clearTimeout(fadeTimeout)
      window.clearTimeout(hideTimeout)
    }
  }, [isProactiveMessage])

  return (
    <motion.div
      animate={isProactiveMessage ? { opacity: 1, x: 0 } : undefined}
      className={`group flex gap-3 rounded-2xl px-3 transition hover:bg-white/[0.03] ${rowPadding}`}
      initial={isProactiveMessage ? { opacity: 0, x: -16 } : false}
      style={intentBorderStyle}
      transition={isProactiveMessage ? { duration: 0.2, ease: 'easeOut' } : undefined}
    >
      <div className="w-10 shrink-0">
        {isContinuation ? null : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-sm font-semibold"
            style={{ backgroundColor: `${profile.color}1A`, color: profile.color }}
          >
            {profile.initials}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {showProactiveLabel ? (
          <span className={`mb-1 block text-[10px] italic text-[#555555] transition-opacity duration-300 ${fadingProactiveLabel ? 'opacity-0' : 'opacity-100'}`}>
            jumped in
          </span>
        ) : null}
        {!isContinuation ? (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: profile.color }}>
              {profile.name}
            </span>
            {profile.role ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-textMuted">
                {profile.role}
              </span>
            ) : null}
            <span className="text-xs text-textMuted">{formatMessageTime(message.timestamp)}</span>
            {showConfidence ? <ConfidenceBadge confidence={confidence} /> : null}
          </div>
        ) : null}
        {replyToMessage ? (
          <div className="mb-2 max-w-2xl">
            <ReplyPreview
              message={replyToMessage}
              onSelect={() => {
                onJumpToMessage(replyToMessage.id)
              }}
            />
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {comparisonGroup ? (
              <ComparisonGroup group={comparisonGroup} />
            ) : (
              <p className="min-w-0 whitespace-pre-wrap break-words text-[15px] leading-6 text-textPrimary">
                {message.intent === MESSAGE_INTENT.AGREEMENT ? (
                  <span className="mr-1 text-[#22C55E]">✓</span>
                ) : null}
                {displayText}
              </p>
            )}
          </div>
          <button
            className="shrink-0 rounded-full border border-border bg-[#10131a] px-3 py-1.5 text-xs font-medium text-textSecondary opacity-0 transition hover:border-borderHover hover:text-textPrimary focus:opacity-100 group-hover:opacity-100"
            onClick={() => {
              onReply(message)
            }}
            type="button"
          >
            Reply
          </button>
        </div>
      </div>
    </motion.div>
  )
}
