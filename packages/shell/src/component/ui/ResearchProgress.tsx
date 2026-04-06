import type { ResearchSnapshot } from '../../lib/researchSignals'

import { ConfidenceBadge } from './ConfidenceBadge'

interface ResearchProgressProps {
  research: ResearchSnapshot
}

export function ResearchProgress({ research }: ResearchProgressProps) {
  if (!research.activity && research.pagesVisited === 0 && research.findingsCount === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-[#101217]/90 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textMuted">
            Research
          </p>
          {research.activity ? (
            <p className="mt-1 line-clamp-2 text-xs text-textSecondary">{research.activity}</p>
          ) : null}
        </div>
        <ConfidenceBadge confidence={research.confidence} label={research.confidenceLabel} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-textSecondary">
          Visited {research.pagesVisited} {research.pagesVisited === 1 ? 'page' : 'pages'}
        </span>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-textSecondary">
          Data from {research.sourceCount} {research.sourceCount === 1 ? 'source' : 'sources'}
        </span>
      </div>
      {research.findings.length > 0 ? (
        <p className="mt-3 text-xs text-textSecondary">
          Found: <span className="text-textPrimary">{research.findings.join(' | ')}</span>
        </p>
      ) : null}
    </div>
  )
}
