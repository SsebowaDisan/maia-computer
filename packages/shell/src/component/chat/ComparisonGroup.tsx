import type { ComparisonGroupData } from '../../lib/researchSignals'

import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { ComparisonCard } from './ComparisonCard'

interface ComparisonGroupProps {
  group: ComparisonGroupData
}

export function ComparisonGroup({ group }: ComparisonGroupProps) {
  return (
    <div className="mt-2 rounded-2xl border border-border bg-[#121417]/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textMuted">
            Comparison
          </p>
          {group.intro ? (
            <p className="mt-1 text-sm text-textSecondary">{group.intro}</p>
          ) : null}
        </div>
        <ConfidenceBadge confidence={group.confidence} />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {group.items.map((item) => (
          <ComparisonCard key={`${item.name}-${item.price}`} item={item} />
        ))}
      </div>
    </div>
  )
}
