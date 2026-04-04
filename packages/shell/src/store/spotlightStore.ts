import { create } from 'zustand'

import type { SearchResultGroup } from '@maia/shared'

interface SpotlightStoreState {
  isOpen: boolean
  query: string
  results: SearchResultGroup[]
  setOpen: (isOpen: boolean) => void
  setQuery: (query: string) => void
  setResults: (results: SearchResultGroup[]) => void
}

export const useSpotlightStore = create<SpotlightStoreState>((set) => ({
  isOpen: false,
  query: '',
  results: [],
  setOpen: (isOpen) => {
    set({ isOpen })
  },
  setQuery: (query) => {
    set({ query })
  },
  setResults: (results) => {
    set({ results })
  },
}))
