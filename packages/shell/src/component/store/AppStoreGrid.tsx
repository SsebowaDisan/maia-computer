import type { InstalledApp } from '@maia/shared'

import { AppCard } from './AppCard'

interface AppStoreGridProps {
  catalog: Array<Pick<InstalledApp, 'id' | 'name' | 'icon' | 'url'>>
  installedAppIds: string[]
  onInstall: (app: Pick<InstalledApp, 'id' | 'name' | 'icon' | 'url'>) => void
  onOpen: (appId: string) => void
}

export function AppStoreGrid({
  catalog,
  installedAppIds,
  onInstall,
  onOpen,
}: AppStoreGridProps) {
  return (
    <div className="grid gap-4">
      {catalog.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          isInstalled={installedAppIds.includes(app.id)}
          onInstall={() => {
            onInstall(app)
          }}
          onOpen={() => {
            onOpen(app.id)
          }}
        />
      ))}
    </div>
  )
}
