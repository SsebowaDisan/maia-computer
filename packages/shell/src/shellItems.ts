import type { InstalledApp } from '@maia/shared'

export interface DockItem {
  id: string
  label: string
  icon: string
}

export const SYSTEM_ICON_PATHS = {
  teamChat: './icon/team-chat.svg',
  settings: './icon/settings.svg',
  store: './icon/app-store.svg',
} as const

export const BUILTIN_ITEMS: DockItem[] = [
  { id: 'team-chat', label: 'Team Chat', icon: SYSTEM_ICON_PATHS.teamChat },
  { id: 'settings', label: 'Settings', icon: SYSTEM_ICON_PATHS.settings },
  { id: 'store', label: 'App Store', icon: SYSTEM_ICON_PATHS.store },
]

function isDockItem(item: DockItem | undefined): item is DockItem {
  return Boolean(item)
}

export function buildDockSections(
  apps: InstalledApp[],
  pinnedIds: string[],
  recentIds: string[],
) {
  const dockItemMap = new Map<string, DockItem>([
    ...apps.map((app) => [app.id, { id: app.id, label: app.name, icon: app.icon }] as const),
    ...BUILTIN_ITEMS.map((item) => [item.id, item] as const),
  ])

  // Left section: all installed apps (sorted by recent use, then install date)
  const recentOrder = new Map(recentIds.map((id, i) => [id, i]))
  const sortedApps = [...apps].sort((a, b) => {
    const aRecent = recentOrder.get(a.id) ?? Infinity
    const bRecent = recentOrder.get(b.id) ?? Infinity
    if (aRecent !== bRecent) return aRecent - bRecent
    return b.installedAt - a.installedAt
  })

  const itemsLeft = sortedApps
    .map((app) => dockItemMap.get(app.id))
    .filter(isDockItem)

  // Right section: built-in items (Team Chat, Settings, App Store)
  const itemsRight = BUILTIN_ITEMS

  return { itemsLeft, itemsRight }
}
