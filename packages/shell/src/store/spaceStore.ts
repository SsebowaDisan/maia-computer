import { create } from 'zustand'

import type { Space } from '@maia/shared'

interface SpaceStoreState {
  activeSpaceId: string
  spaces: Space[]
  setSpaces: (spaces: Space[]) => void
  setActiveSpaceId: (spaceId: string) => void
}

export const useSpaceStore = create<SpaceStoreState>((set) => ({
  activeSpaceId: 'work',
  spaces: [],
  setSpaces: (spaces) => {
    set({ spaces })
  },
  setActiveSpaceId: (spaceId) => {
    set({ activeSpaceId: spaceId })
  },
}))
