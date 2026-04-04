import { AGENT_PROFILES } from '@maia/shared'

interface ChatHeaderProps {
  activeTask: string
}

export function ChatHeader({ activeTask }: ChatHeaderProps) {
  const activeAgents = ['research', 'analyst', 'calendar'] as const

  return (
    <div className="border-b border-border bg-surface px-5 py-4">
      <p className="text-sm text-textSecondary">
        Active: <span className="text-textPrimary">{activeTask || 'No active task'}</span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {activeAgents.map((agentId) => {
          const profile = AGENT_PROFILES[agentId] ?? {
            color: '#888888',
            icon: '•',
            name: agentId,
          }
          return (
            <div key={agentId} className="flex items-center gap-2 text-sm">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
                style={{ backgroundColor: `${profile.color}25`, color: profile.color }}
              >
                {profile.icon}
              </span>
              <span style={{ color: profile.color }}>{profile.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
