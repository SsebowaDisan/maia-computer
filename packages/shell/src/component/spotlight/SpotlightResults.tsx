import type { SearchResultGroup } from '@maia/shared'

interface SpotlightResultsProps {
  onSelect: (appId: string) => void
  results: SearchResultGroup[]
}

export function SpotlightResults({ onSelect, results }: SpotlightResultsProps) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-elevated">
      {results.length === 0 ? (
        <div className="px-5 py-4 text-sm text-textSecondary">No results yet.</div>
      ) : (
        results.map((group) => (
          <div key={group.appId} className="border-b border-border last:border-b-0">
            <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-textSecondary">
              <span>{group.appIcon}</span>
              <span>{group.appName}</span>
            </div>
            {group.results.map((result) => (
              <button
                key={result.title}
                className="flex w-full items-start gap-3 px-8 py-3 text-left transition hover:bg-white/5"
                onClick={() => {
                  onSelect(result.appId)
                }}
              >
                <span className="pt-1 text-lg">{result.appIcon}</span>
                <span>
                  <span className="block text-sm text-textPrimary">{result.title}</span>
                  <span className="block text-xs text-textSecondary">{result.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
