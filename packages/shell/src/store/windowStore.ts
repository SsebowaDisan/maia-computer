import { create } from 'zustand'

import { SNAP_ZONE, type AppBounds, type SnapZone } from '@maia/shared'

export interface ShellWindow {
  id: string
  kind: 'app' | 'chat' | 'settings' | 'store'
  title: string
  icon: string
  appId?: string
  bounds: AppBounds
  snapZone: SnapZone
  isMaximized: boolean
  isMinimized: boolean
  zIndex: number
}

interface WindowStoreState {
  windows: ShellWindow[]
  setWindows: (windows: ShellWindow[]) => void
  upsertWindow: (window: ShellWindow) => void
  focusWindow: (windowId: string) => void
  closeWindow: (windowId: string) => void
  updateBounds: (windowId: string, bounds: AppBounds) => void
  updateSnapZone: (windowId: string, snapZone: SnapZone, bounds: AppBounds) => void
  toggleMinimized: (windowId: string) => void
}

function getNextZIndex(windows: ShellWindow[]): number {
  return Math.max(0, ...windows.map((window) => window.zIndex)) + 1
}

export const useWindowStore = create<WindowStoreState>((set) => ({
  windows: [],
  setWindows: (windows) => {
    set({ windows })
  },
  upsertWindow: (nextWindow) => {
    set((state) => {
      const existingWindow = state.windows.find((window) => window.id === nextWindow.id)
      const zIndex = getNextZIndex(state.windows)

      if (!existingWindow) {
        return {
          windows: [...state.windows, { ...nextWindow, zIndex }],
        }
      }

      return {
        windows: state.windows.map((window) => (
          window.id === nextWindow.id
            ? { ...window, ...nextWindow, isMinimized: false, zIndex }
            : window
        )),
      }
    })
  },
  focusWindow: (windowId) => {
    set((state) => ({
      windows: state.windows.map((window) => (
        window.id === windowId
          ? { ...window, isMinimized: false, zIndex: getNextZIndex(state.windows) }
          : window
      )),
    }))
  },
  closeWindow: (windowId) => {
    set((state) => ({
      windows: state.windows.filter((window) => window.id !== windowId),
    }))
  },
  updateBounds: (windowId, bounds) => {
    set((state) => ({
      windows: state.windows.map((window) => (
        window.id === windowId
          ? { ...window, bounds, isMaximized: false, snapZone: SNAP_ZONE.NONE }
          : window
      )),
    }))
  },
  updateSnapZone: (windowId, snapZone, bounds) => {
    set((state) => ({
      windows: state.windows.map((window) => (
        window.id === windowId
          ? {
              ...window,
              bounds,
              snapZone,
              isMaximized: snapZone === SNAP_ZONE.MAXIMIZED,
            }
          : window
      )),
    }))
  },
  toggleMinimized: (windowId) => {
    set((state) => ({
      windows: state.windows.map((window) => (
        window.id === windowId ? { ...window, isMinimized: !window.isMinimized } : window
      )),
    }))
  },
}))
