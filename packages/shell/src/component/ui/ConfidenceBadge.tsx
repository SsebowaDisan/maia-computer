import type { ResearchConfidence } from '../../lib/researchSignals'

interface ConfidenceBadgeProps {
  confidence: ResearchConfidence
  label?: string
}

const CONFIDENCE_STYLES: Record<ResearchConfidence, { dot: string; text: string }> = {
  high: { dot: '#22C55E', text: '#86EFAC' },
  medium: { dot: '#EAB308', text: '#FDE68A' },
  low: { dot: '#EF4444', text: '#FCA5A5' },
}

export function ConfidenceBadge({ confidence, label }: ConfidenceBadgeProps) {
  const style = CONFIDENCE_STYLES[confidence]

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
      <span style={{ color: style.text }}>{label ?? `${confidence} confidence`}</span>
    </span>
  )
}
