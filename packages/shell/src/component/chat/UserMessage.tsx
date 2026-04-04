import type { ChatMessage } from '@maia/shared'

interface UserMessageProps {
  message: ChatMessage
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="ml-auto max-w-[85%] rounded-xl bg-[#1A2A3A] px-4 py-3 text-[15px] text-textPrimary">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">You</span>
        <span className="text-xs text-textMuted">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      </div>
      <p className="mt-1">{message.message}</p>
    </div>
  )
}
