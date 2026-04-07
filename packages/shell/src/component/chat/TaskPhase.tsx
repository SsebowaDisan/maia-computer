import type { TaskPhase } from '../../store/taskStore'

interface TaskPhaseProps {
  phase: TaskPhase
}

interface PhaseVisual {
  className: string
  icon: string
  label: string
  pulse?: string
}

function getPhaseVisual(phase: TaskPhase): PhaseVisual {
  switch (phase) {
    case 'planning':
      return {
        className: 'border-[#3B82F633] bg-[#3B82F61A] text-[#60A5FA]',
        icon: '🧠',
        label: 'Planning...',
        pulse: 'bg-[#3B82F6]',
      }
    case 'bidding':
      return {
        className: 'border-[#EAB30833] bg-[#EAB3081A] text-[#EAB308]',
        icon: '🎯',
        label: 'Assigning agents...',
        pulse: 'bg-[#EAB308]',
      }
    case 'executing':
      return {
        className: 'border-[#22C55E33] bg-[#22C55E1A] text-[#22C55E]',
        icon: '⚡',
        label: 'Working...',
        pulse: 'bg-[#22C55E]',
      }
    case 'synthesizing':
      return {
        className: 'border-[#3B82F633] bg-[#3B82F61A] text-[#60A5FA]',
        icon: '📝',
        label: 'Synthesizing answer...',
        pulse: 'bg-[#3B82F6]',
      }
    case 'done':
      return {
        className: 'border-[#22C55E33] bg-[#22C55E1A] text-[#22C55E]',
        icon: '✅',
        label: 'Complete',
      }
    case 'failed':
      return {
        className: 'border-[#EF444433] bg-[#EF44441A] text-[#EF4444]',
        icon: '❌',
        label: 'Failed',
      }
    case 'idle':
    default:
      return {
        className: 'border-border bg-white/[0.03] text-textSecondary',
        icon: '•',
        label: 'Idle',
      }
  }
}

export function TaskPhaseBadge({ phase }: TaskPhaseProps) {
  const visual = getPhaseVisual(phase)

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${visual.className}`}>
      {visual.pulse ? <span className={`h-2 w-2 rounded-full animate-pulse ${visual.pulse}`} /> : null}
      <span>{visual.icon}</span>
      <span>{visual.label}</span>
    </span>
  )
}
