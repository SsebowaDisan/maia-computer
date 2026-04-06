import type { ChatMessage } from '@maia/shared'

import { getSenderMeta } from './chatMeta'

interface ReplyPreviewProps {
  message: ChatMessage
  onClear?: () => void
  onSelect?: () => void
  variant?: 'composer' | 'inline'
}

export function ReplyPreview({
  message,
  onClear,
  onSelect,
  variant = 'inline',
}: ReplyPreviewProps) {
  const sender = getSenderMeta(message.sender)
  const content = (
    <div
      className={`flex min-w-0 items-start gap-3 rounded-xl border border-border/80 bg-white/[0.03] text-left ${
        variant === 'composer' ? 'px-3 py-2.5' : 'px-3 py-2'
      }`}
    >
      <span className="mt-0.5 h-8 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: sender.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: sender.color }}>
            {sender.name}
          </span>
          {variant === 'composer' ? (
            <span className="text-[11px] text-textMuted">Replying inline</span>
          ) : null}
        </div>
        <p className="truncate text-sm text-textSecondary">{message.message}</p>
      </div>
      {onClear ? (
        <button
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-textSecondary transition hover:bg-white/8 hover:text-textPrimary"
          onClick={onClear}
          type="button"
        >
          Cancel
        </button>
      ) : null}
    </div>
  )

  if (!onSelect) {
    return content
  }

  return (
    <button
      className="w-full rounded-xl transition hover:bg-white/[0.02]"
      onClick={onSelect}
      type="button"
    >
      {content}
    </button>
  )
}
