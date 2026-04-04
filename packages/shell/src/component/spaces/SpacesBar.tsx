import type { Space } from '@maia/shared'

import { SpaceTab } from './SpaceTab'

interface SpacesBarProps {
  activeSpaceId: string
  onSwitchSpace: (spaceId: string) => void
  spaces: Space[]
}

export function SpacesBar({ activeSpaceId, onSwitchSpace, spaces }: SpacesBarProps) {
  return (
    <div className="flex h-8 items-center justify-between border-b border-border bg-chrome px-5">
      <div className="flex items-center gap-1">
        {spaces.map((space) => (
          <SpaceTab
            key={space.id}
            isActive={space.id === activeSpaceId}
            onClick={() => {
              onSwitchSpace(space.id)
            }}
            space={space}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-textSecondary">
        <span>⚙️</span>
        <span>👤 User</span>
      </div>
    </div>
  )
}
