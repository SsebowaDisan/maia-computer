import { useEffect, useState } from 'react'

import type { InstalledApp } from '@maia/shared'

import { AppIcon } from '../component/ui/AppIcon'
import { Button } from '../component/ui/Button'
import { Input } from '../component/ui/Input'
import { useIPC } from '../hook/useIPC'

interface StoreScreenProps {
  installedApps: InstalledApp[]
  onInstallApp: (app: Pick<InstalledApp, 'name' | 'icon' | 'url' | 'manifestId'>) => Promise<void>
  onOpenApp: (appId: string) => void
}

interface ManifestApp {
  id: string
  name: string
  icon: string
  url: string
  category: string
  aiDescription: string
}

export function StoreScreen({ installedApps, onInstallApp, onOpenApp }: StoreScreenProps) {
  const { invoke } = useIPC()
  const [customUrl, setCustomUrl] = useState('')
  const [manifests, setManifests] = useState<ManifestApp[]>([])

  useEffect(() => {
    void invoke('appstore:getManifests', {}).then((result) => {
      setManifests(result as unknown as ManifestApp[])
    })
  }, [invoke])

  const installedManifestIds = new Set(installedApps.map((app) => app.manifestId))

  const findInstalledApp = (manifestId: string) =>
    installedApps.find((app) => app.manifestId === manifestId)

  return (
    <div className="h-full overflow-y-auto bg-chrome px-6 py-5">
      <div className="rounded-xl border border-border bg-elevated p-5">
        <h2 className="text-lg font-semibold text-textPrimary">Install any web app</h2>
        <p className="mt-2 text-sm text-textSecondary">
          Enter any URL to install it inside Maia. Works with any web app.
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
              const url = customUrl.trim()
              if (!url) return
              try {
                const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
                void onInstallApp({
                  name: hostname.replace('www.', ''),
                  icon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
                  url: url.startsWith('http') ? url : `https://${url}`,
                  manifestId: 'custom',
                })
                setCustomUrl('')
              } catch {
                // Invalid URL
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <h3 className="mb-4 mt-8 text-sm font-medium uppercase tracking-widest text-textSecondary">
        Available Apps
      </h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {manifests.map((app) => {
          const isInstalled = installedManifestIds.has(app.id)
          const installed = findInstalledApp(app.id)

          return (
            <div key={app.id} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-elevated p-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                <AppIcon icon={app.icon} size={36} />
              </div>
              <div>
                <p className="text-sm font-semibold text-textPrimary">{app.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-textMuted">{app.aiDescription}</p>
              </div>
              {isInstalled ? (
                <Button
                  className="border-accentGreen text-accentGreen"
                  onClick={() => {
                    if (installed) onOpenApp(installed.id)
                  }}
                >
                  Open
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    void onInstallApp({
                      name: app.name,
                      icon: app.icon,
                      url: app.url,
                      manifestId: app.id,
                    })
                  }}
                >
                  Install
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
