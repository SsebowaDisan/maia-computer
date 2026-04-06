import { getSenderMeta } from './chatMeta'

interface ChatHeaderProps {
  activeAgentIds: string[]
  activeTask: string
  messageCount: number
}

export function ChatHeader({ activeAgentIds, activeTask, messageCount }: ChatHeaderProps) {
  return (
    <div className="border-b border-border bg-[#0d1015]/95 px-6 pb-4 pt-5 backdrop-blur">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-elevated text-lg font-semibold text-white">
              #
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-textPrimary">Team Chat</h2>
              <p className="text-sm text-textSecondary">
                Coordinate Maia agents, keep execution visible, and reply inline when direction changes.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs font-medium text-textSecondary">
              {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </span>
            {activeTask ? (
              <>
                <span className="rounded-full border border-accentBlue/20 bg-accentBlue/10 px-3 py-1 text-xs font-medium text-accentBlue">
                  Active task
                </span>
                <span className="max-w-[36rem] truncate rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-textPrimary">
                  {activeTask}
                </span>
              </>
            ) : (
              <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-textSecondary">
                No task running
              </span>
            )}
          </div>
        </div>
        <div className="w-full max-w-[320px] shrink-0 xl:text-right">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-textMuted">
              {activeAgentIds.length > 0 ? `${activeAgentIds.length} agents live` : 'No agents active'}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {activeAgentIds.length > 0 ? activeAgentIds.map((agentId) => {
              const agent = getSenderMeta(agentId)
              return (
                <div
                  key={agentId}
                  className="flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-3 py-2"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: agent.color }} />
                  <span className="text-sm font-medium text-textPrimary">{agent.name}</span>
                </div>
              )
            }) : (
              <div className="rounded-full border border-border bg-white/[0.03] px-3 py-2 text-sm text-textSecondary">
                Waiting for Maia to spin up specialists
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
