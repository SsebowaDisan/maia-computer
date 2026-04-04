import { create } from 'zustand'

interface DockStoreState {
  pinnedIds: string[]
  recentIds: string[]
  badges: Record<string, number>
  pinItem: (itemId: string) => void
  unpinItem: (itemId: string) => void
  registerLaunch: (itemId: string) => void
  setBadge: (itemId: string, count: number) => void
}

const DEFAULT_PINNED_IDS = ['gmail', 'slack', 'calendar', 'team-chat']

export const useDockStore = create<DockStoreState>((set) => ({
  pinnedIds: DEFAULT_PINNED_IDS,
  recentIds: [],
  badges: {},
  pinItem: (itemId) => {
    set((state) => ({
      pinnedIds: state.pinnedIds.includes(itemId) ? state.pinnedIds : [...state.pinnedIds, itemId],
    }))
  },
  unpinItem: (itemId) => {
    set((state) => ({
      pinnedIds: state.pinnedIds.filter((id) => id !== itemId),
    }))
  },
  registerLaunch: (itemId) => {
    set((state) => ({
      recentIds: [itemId, ...state.recentIds.filter((id) => id !== itemId)].slice(0, 7),
    }))
  },
  setBadge: (itemId, count) => {
    set((state) => ({
      badges: {
        ...state.badges,
        [itemId]: count,
      },
    }))
  },
}))
