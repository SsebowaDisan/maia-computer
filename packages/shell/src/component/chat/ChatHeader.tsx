import type { AgentTaskStatus, TaskPhase } from '../../store/taskStore'

import { AgentStatusBadge } from './AgentStatusBadge'
import { TaskPhaseBadge } from './TaskPhase'

interface ChatHeaderProps {
  activeAgentIds: string[]
  activeTask: string
  agentStatuses: Record<string, AgentTaskStatus>
  messageCount: number
  taskPhase: TaskPhase
}

function getStatusRank(status: AgentTaskStatus): number {
  switch (status) {
    case 'working':
      return 0
    case 'watching':
      return 1
    case 'idle':
      return 2
    case 'done':
      return 3
    case 'failed':
      return 4
    default:
      return 5
  }
}

export function ChatHeader({
  activeAgentIds,
  activeTask,
  agentStatuses,
  messageCount,
  taskPhase,
}: ChatHeaderProps) {
  const combinedAgentIds = [...new Set([...activeAgentIds, ...Object.keys(agentStatuses)])]
    .sort((left, right) => {
      const leftStatus = agentStatuses[left] ?? 'idle'
      const rightStatus = agentStatuses[right] ?? 'idle'
      return getStatusRank(leftStatus) - getStatusRank(rightStatus)
    })
  const hasTaskContext = taskPhase !== 'idle' || Boolean(activeTask)

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
            {hasTaskContext ? <TaskPhaseBadge phase={taskPhase} /> : null}
            {activeTask ? (
              <span className="max-w-[36rem] truncate rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-textPrimary">
                {activeTask}
              </span>
            ) : (
              <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-textSecondary">
                No task running
              </span>
            )}
          </div>
        </div>
        <div className="w-full max-w-[360px] shrink-0 xl:text-right">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-textMuted">
              {combinedAgentIds.length > 0 ? `${combinedAgentIds.length} agents live` : 'No agents active'}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {combinedAgentIds.length > 0 ? combinedAgentIds.map((agentId) => (
              <AgentStatusBadge
                key={agentId}
                agentId={agentId}
                status={agentStatuses[agentId] ?? 'idle'}
              />
            )) : (
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
