import type { ChatMessage } from '@maia/shared'

import { ReplyPreview } from './ReplyPreview'
import { formatMessageTime, getSenderMeta } from './chatMeta'

interface UserMessageProps {
  isContinuation: boolean
  message: ChatMessage
  onJumpToMessage: (messageId: string) => void
  onReply: (message: ChatMessage) => void
  replyToMessage?: ChatMessage
}

export function UserMessage({
  isContinuation,
  message,
  onJumpToMessage,
  onReply,
  replyToMessage,
}: UserMessageProps) {
  const sender = getSenderMeta(message.sender)

  return (
    <div className="group flex gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/[0.03]">
      <div className="w-10 shrink-0">
        {isContinuation ? null : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-white/[0.05] text-sm font-semibold"
            style={{ color: sender.color }}
          >
            {sender.initials}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!isContinuation ? (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-white">You</span>
            <span className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 text-[11px] text-textMuted">
              Human
            </span>
            <span className="text-xs text-textMuted">{formatMessageTime(message.timestamp)}</span>
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
          <p className="min-w-0 whitespace-pre-wrap break-words text-[15px] leading-6 text-textPrimary">
            {message.message}
          </p>
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
