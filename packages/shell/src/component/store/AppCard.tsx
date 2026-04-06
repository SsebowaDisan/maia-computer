import type { InstalledApp } from '@maia/shared'

import { AppIcon } from '../ui/AppIcon'
import { Button } from '../ui/Button'

interface AppCardProps {
  app: Pick<InstalledApp, 'id' | 'name' | 'icon' | 'url'>
  isInstalled: boolean
  onInstall: () => void
  onOpen: () => void
}

export function AppCard({ app, isInstalled, onInstall, onOpen }: AppCardProps) {
  return (
    <div className="rounded-xl border border-border bg-elevated p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-2xl">
            <AppIcon icon={app.icon} size={28} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-textPrimary">{app.name}</h3>
            <p className="mt-1 text-sm text-textSecondary">{app.url}</p>
          </div>
        </div>
        {isInstalled ? (
          <Button className="border-accentGreen text-accentGreen" onClick={onOpen}>
            Open
          </Button>
        ) : (
          <Button variant="primary" onClick={onInstall}>
            Install
          </Button>
        )}
      </div>
    </div>
  )
}
