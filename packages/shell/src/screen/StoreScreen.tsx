import { useState } from 'react'

import type { InstalledApp } from '@maia/shared'

import { AppStoreGrid } from '../component/store/AppStoreGrid'
import { Button } from '../component/ui/Button'
import { Input } from '../component/ui/Input'

interface StoreScreenProps {
  installedApps: InstalledApp[]
  onInstallApp: (app: Pick<InstalledApp, 'name' | 'icon' | 'url' | 'manifestId'>) => Promise<void>
  onOpenApp: (appId: string) => void
}

const APP_CATALOG = [
  { id: 'figma', name: 'Figma', icon: '🎨', url: 'https://figma.com' },
  { id: 'github', name: 'GitHub', icon: '🐙', url: 'https://github.com' },
  { id: 'linear', name: 'Linear', icon: '📈', url: 'https://linear.app' },
]

export function StoreScreen({ installedApps, onInstallApp, onOpenApp }: StoreScreenProps) {
  const [customUrl, setCustomUrl] = useState('')

  return (
    <div className="h-full overflow-y-auto bg-chrome px-6 py-5">
      <div className="rounded-xl border border-border bg-elevated p-5">
        <h2 className="text-lg font-semibold text-textPrimary">Install any web app</h2>
        <p className="mt-2 text-sm text-textSecondary">
          Enter any URL to install any web app inside Maia.
        </p>
        <div className="mt-4 flex gap-3">
          <Input
            onChange={(event) => {
              setCustomUrl(event.target.value)
            }}
            placeholder="https://"
            value={customUrl}
          />
          <Button
            variant="primary"
            onClick={() => {
              if (!customUrl.trim()) {
                return
              }

              void onInstallApp({
                name: new URL(customUrl).hostname.replace('www.', ''),
                icon: '🌐',
                url: customUrl,
                manifestId: 'custom',
              })
              setCustomUrl('')
            }}
          >
            Add URL
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <AppStoreGrid
          catalog={APP_CATALOG}
          installedAppIds={installedApps.map((app) => app.id)}
          onInstall={(app) => {
            void onInstallApp({
              name: app.name,
              icon: app.icon,
              url: app.url,
              manifestId: app.id,
            })
          }}
          onOpen={onOpenApp}
        />
      </div>
    </div>
  )
}
