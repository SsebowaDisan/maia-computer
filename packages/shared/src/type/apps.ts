export interface AppManifest {
  name: string
  id: string
  icon: string
  url: string
  category: AppCategory
  aiDescription: string
}

export const APP_CATEGORY = {
  PRODUCTIVITY: 'productivity',
  COMMUNICATION: 'communication',
  DEVELOPER: 'developer',
  FINANCE: 'finance',
  SOCIAL: 'social',
  MEDIA: 'media',
  OTHER: 'other',
} as const

export type AppCategory = typeof APP_CATEGORY[keyof typeof APP_CATEGORY]

export interface InstalledApp {
  id: string
  manifestId: string
  name: string
  icon: string
  url: string
  spaceId: string
  installedAt: number
  lastOpenedAt: number
}

export interface AppBadge {
  appId: string
  count: number
}

export interface AppBounds {
  x: number
  y: number
  width: number
  height: number
}

export const SNAP_ZONE = {
  NONE: 'none',
  LEFT: 'left',
  RIGHT: 'right',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  MAXIMIZED: 'maximized',
} as const

export type SnapZone = typeof SNAP_ZONE[keyof typeof SNAP_ZONE]

export interface WindowState {
  appId: string
  bounds: AppBounds
  snapZone: SnapZone
  isMaximized: boolean
  isMinimized: boolean
}

export interface Space {
  id: string
  name: string
  aiContext: string
  appIds: string[]
}
