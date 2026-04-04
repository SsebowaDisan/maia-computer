import { AGENT_PROFILES } from '@maia/shared'

import type { ChatMessage } from '@maia/shared'

interface AgentMessageProps {
  message: ChatMessage
}

export function AgentMessage({ message }: AgentMessageProps) {
  const profile = AGENT_PROFILES[message.sender] ?? {
    name: message.sender,
    icon: '🤖',
    color: '#60A5FA',
  }

  return (
    <div className="flex gap-3">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ backgroundColor: `${profile.color}25`, color: profile.color }}
      >
        {profile.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold" style={{ color: profile.color }}>
            {profile.name}
          </span>
          <span className="text-xs text-textMuted">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
        <p className="mt-1 max-w-[85%] text-[15px] text-textPrimary">{message.message}</p>
      </div>
    </div>
  )
}
