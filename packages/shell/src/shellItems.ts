import type { InstalledApp } from '@maia/shared'

export interface DockItem {
  id: string
  label: string
  icon: string
}

export const BUILTIN_ITEMS: DockItem[] = [
  { id: 'team-chat', label: 'Team Chat', icon: '💬' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'store', label: 'App Store', icon: '⊞' },
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

  const itemsLeft = recentIds
    .map((itemId) => dockItemMap.get(itemId))
    .filter((item) => item && !pinnedIds.includes(item.id))
    .filter(isDockItem)

  const itemsRight = [
    ...pinnedIds.map((itemId) => dockItemMap.get(itemId)),
    ...BUILTIN_ITEMS.filter((item) => !pinnedIds.includes(item.id)),
  ]
    .filter(isDockItem)
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)

  return { itemsLeft, itemsRight }
}
