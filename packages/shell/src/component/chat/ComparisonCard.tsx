import type { ComparisonItem } from '../../lib/researchSignals'

interface ComparisonCardProps {
  item: ComparisonItem
}

export function ComparisonCard({ item }: ComparisonCardProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        item.winner ? 'border-accentBlue bg-accentBlue/5' : 'border-border bg-[#1A1A1A]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {item.emoji} {item.name}
          </p>
          <p className="mt-1 text-sm font-medium text-accentGreen">{item.price}</p>
        </div>
        {item.rating ? (
          <span className="shrink-0 text-[13px] text-textSecondary">{item.rating}</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs italic text-textSecondary">{item.description}</p>
      {item.meta.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.meta.map((part) => (
            <span
              key={part}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] text-textMuted"
            >
              {part}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
