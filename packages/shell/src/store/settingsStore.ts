import { create } from 'zustand'

interface SettingsStoreState {
  settings: Record<string, unknown>
  setSettings: (settings: Record<string, unknown>) => void
  updateSetting: (key: string, value: unknown) => void
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: {},
  setSettings: (settings) => {
    set({ settings })
  },
  updateSetting: (key, value) => {
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    }))
  },
}))
