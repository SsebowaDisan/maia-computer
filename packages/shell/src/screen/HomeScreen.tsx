import type { InstalledApp } from '@maia/shared'

import { useState } from 'react'

import { AppGridItem } from '../component/store/AppGridItem'
import { Input } from '../component/ui/Input'

interface HomeScreenProps {
  apps: InstalledApp[]
  badges: Record<string, number>
  onOpenApp: (app: InstalledApp) => void
  onSubmitTask: (description: string) => Promise<void>
}

export function HomeScreen({ apps, badges, onOpenApp, onSubmitTask }: HomeScreenProps) {
  const [description, setDescription] = useState('')

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 pb-24">
      <div className="grid max-w-5xl grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-8">
        {apps.map((app) => (
          <AppGridItem
            key={app.id}
            app={app}
            badgeCount={badges[app.id]}
            onClick={() => {
              onOpenApp(app)
            }}
          />
        ))}
      </div>
      <form
        className="mt-14 w-full max-w-[560px]"
        onSubmit={(event) => {
          event.preventDefault()
          const nextDescription = description.trim()
          if (!nextDescription) {
            return
          }

          void onSubmitTask(nextDescription)
          setDescription('')
        }}
      >
        <Input
          className="h-12 rounded-xl text-base"
          onChange={(event) => {
            setDescription(event.target.value)
          }}
          placeholder="Tell Maia what to do..."
          value={description}
        />
      </form>
    </div>
  )
}
