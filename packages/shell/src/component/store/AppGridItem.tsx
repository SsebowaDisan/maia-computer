import type { InstalledApp } from '@maia/shared'

interface AppGridItemProps {
  app: InstalledApp
  badgeCount?: number
  onClick: () => void
}

export function AppGridItem({ app, badgeCount = 0, onClick }: AppGridItemProps) {
  return (
    <button
      className="group relative flex w-24 flex-col items-center gap-3 rounded-2xl p-3 transition hover:bg-white/5"
      onClick={onClick}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-elevated text-3xl shadow-window transition group-hover:scale-105">
        <span>{app.icon}</span>
        {badgeCount > 0 ? (
          <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accentRed px-1 text-[11px] font-bold text-white">
            {badgeCount}
          </span>
        ) : null}
      </div>
      <div className="text-center">
        <p className="text-[11px] font-medium text-textPrimary">{app.name}</p>
      </div>
    </button>
  )
}
