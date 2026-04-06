import { create } from 'zustand'

import type { InstalledApp } from '@maia/shared'

import { normalizeInstalledApp } from '../lib/appIcons'

interface AppStoreState {
  installedApps: InstalledApp[]
  isLoading: boolean
  setInstalledApps: (apps: InstalledApp[]) => void
  setLoading: (isLoading: boolean) => void
}

export const useAppStore = create<AppStoreState>((set) => ({
  installedApps: [],
  isLoading: false,
  setInstalledApps: (apps) => {
    set({ installedApps: apps.map(normalizeInstalledApp) })
  },
  setLoading: (isLoading) => {
    set({ isLoading })
  },
}))
