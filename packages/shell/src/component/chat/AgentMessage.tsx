import type { ChatMessage } from '@maia/shared'

import { parseComparisonGroup, inferConfidence, isResearchTimelineMessage } from '../../lib/researchSignals'
import { ReplyPreview } from './ReplyPreview'
import { ComparisonGroup } from './ComparisonGroup'
import { formatMessageTime, getSenderMeta } from './chatMeta'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'

interface AgentMessageProps {
  isContinuation: boolean
  message: ChatMessage
  onJumpToMessage: (messageId: string) => void
  onReply: (message: ChatMessage) => void
  replyToMessage?: ChatMessage
}

export function AgentMessage({
  isContinuation,
  message,
  onJumpToMessage,
  onReply,
  replyToMessage,
}: AgentMessageProps) {
  const profile = getSenderMeta(message.sender)
  const comparisonGroup = parseComparisonGroup(message.message)
  const confidence = inferConfidence(message.message)
  const showConfidence = comparisonGroup || /\bconfidence|checked \d+ (?:sites?|sources?)|cross-reference|cross reference|pretty confident|just started|checking more/i.test(message.message)
  const isTimelineRow = isContinuation && isResearchTimelineMessage(message.message)

  return (
    <div className={`group flex gap-3 rounded-2xl px-3 transition hover:bg-white/[0.03] ${isTimelineRow ? 'py-1' : 'py-2'}`}>
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
                {isTimelineRow ? `-> ${message.message}` : message.message}
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
    </div>
  )
}
