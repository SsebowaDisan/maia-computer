import type { AgentTaskStatus } from '../../store/taskStore'

import { getSenderMeta } from './chatMeta'

interface AgentStatusBadgeProps {
  agentId: string
  status: AgentTaskStatus
}

interface StatusVisual {
  dotClassName?: string
  labelClassName: string
  labelText: string
  marker?: string
}

function getStatusVisual(status: AgentTaskStatus): StatusVisual {
  switch (status) {
    case 'working':
      return {
        dotClassName: 'h-2.5 w-2.5 rounded-full bg-[#22C55E] animate-pulse',
        labelClassName: 'text-[#22C55E]',
        labelText: '(working)',
      }
    case 'watching':
      return {
        dotClassName: 'h-2.5 w-2.5 rounded-full bg-[#EAB308]',
        labelClassName: 'text-[#EAB308]',
        labelText: '(watching)',
      }
    case 'done':
      return {
        labelClassName: 'text-[#555555]',
        labelText: '(done)',
        marker: '✓',
      }
    case 'failed':
      return {
        dotClassName: 'h-2.5 w-2.5 rounded-full bg-[#EF4444]',
        labelClassName: 'text-[#EF4444]',
        labelText: '(failed)',
      }
    case 'idle':
    default:
      return {
        dotClassName: 'h-2.5 w-2.5 rounded-full bg-[#555555]',
        labelClassName: 'text-[#555555]',
        labelText: '(idle)',
      }
  }
}

export function AgentStatusBadge({ agentId, status }: AgentStatusBadgeProps) {
  const agent = getSenderMeta(agentId)
  const visual = getStatusVisual(status)

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-3 py-2">
      {visual.marker ? (
        <span className={`text-sm font-semibold ${visual.labelClassName}`}>{visual.marker}</span>
      ) : (
        <span className={visual.dotClassName} />
      )}
      <span className="text-sm font-medium text-textPrimary">{agent.name}</span>
      <span className={`text-xs font-medium ${visual.labelClassName}`}>{visual.labelText}</span>
    </div>
  )
}
