import type { InstalledApp, SnapZone } from '@maia/shared'

import { useIPC } from './useIPC'
import { useWindowShortcuts } from './useWindowShortcuts'
import { useWindowViewportSync } from './useWindowViewportSync'
import { useDockStore } from '../store/dockStore'
import { type ShellWindow, useWindowStore } from '../store/windowStore'
import { clampBounds, getAppContentBounds, getDefaultWindowBounds, getGridPlacements, getSnapBounds, getViewportBounds } from '../windowLayout'
import { getBuiltinWindow } from '../windowFactory'

export function useWindowManager() {
  const { invoke } = useIPC()
  const windows = useWindowStore((state) => state.windows)
  const upsertWindow = useWindowStore((state) => state.upsertWindow)
  const focusWindow = useWindowStore((state) => state.focusWindow)
  const closeWindowState = useWindowStore((state) => state.closeWindow)
  const updateBounds = useWindowStore((state) => state.updateBounds)
  const updateSnapZone = useWindowStore((state) => state.updateSnapZone)
  const toggleMinimizedState = useWindowStore((state) => state.toggleMinimized)
  const registerLaunch = useDockStore((state) => state.registerLaunch)

  useWindowShortcuts({ updateBounds, updateSnapZone, windows })
  useWindowViewportSync({ updateBounds, updateSnapZone, windows })

  const syncVisibleAppBounds = async () => {
    const nextWindows = useWindowStore.getState().windows

    await Promise.all(
      nextWindows
        .filter((window) => window.kind === 'app' && window.appId && !window.isMinimized)
        .map((window) => invoke('app:setBounds', {
          appId: window.appId!,
          bounds: getAppContentBounds(window.bounds),
        })),
    )
  }

  const arrangeVisibleWindows = () => {
    const visibleWindows = useWindowStore.getState().windows
      .filter((window) => !window.isMinimized)

    const placements = getGridPlacements(visibleWindows.length, getViewportBounds())

    visibleWindows.forEach((window, index) => {
      const placement = placements[index]

      if (!placement) {
        return
      }

      if (placement.snapZone === 'none') {
        updateBounds(window.id, placement.bounds)
        return
      }

      updateSnapZone(window.id, placement.snapZone, placement.bounds)
    })
  }

  return {
    windows,
    focusWindow,
    async toggleMinimized(windowId: string) {
      toggleMinimizedState(windowId)
      arrangeVisibleWindows()
      await syncVisibleAppBounds()
    },
    updateWindowBounds(windowId: string, bounds: ShellWindow['bounds']) {
      updateBounds(windowId, clampBounds(bounds, getViewportBounds()))
    },
    snapWindow(windowId: string, zone: SnapZone) {
      updateSnapZone(windowId, zone, getSnapBounds(zone, getViewportBounds()))
    },
    async openAppWindow(app: InstalledApp) {
      registerLaunch(app.id)
      const nextWindow: ShellWindow = {
        id: app.id,
        kind: 'app',
        title: app.name,
        icon: app.icon,
        appId: app.id,
        bounds: getDefaultWindowBounds(windows.length, getViewportBounds()),
        snapZone: 'none',
        isMaximized: false,
        isMinimized: false,
        zIndex: 1,
      }

      upsertWindow(nextWindow)
      arrangeVisibleWindows()

      const currentWindow = useWindowStore.getState().windows.find((window) => window.id === app.id) ?? nextWindow

      await invoke('app:open', { appId: app.id })
      await invoke('app:setBounds', {
        appId: app.id,
        bounds: getAppContentBounds(currentWindow.bounds),
      })
      await syncVisibleAppBounds()
    },
    async openBuiltinWindow(kind: 'chat' | 'settings' | 'store') {
      registerLaunch(kind === 'chat' ? 'team-chat' : kind)
      upsertWindow({
        ...getBuiltinWindow(kind, windows),
      })
      arrangeVisibleWindows()
      await syncVisibleAppBounds()
    },
    async closeWindow(windowId: string) {
      const targetWindow = windows.find((window) => window.id === windowId)
      closeWindowState(windowId)
      arrangeVisibleWindows()

      if (targetWindow?.kind === 'app' && targetWindow.appId) {
        await invoke('app:close', { appId: targetWindow.appId })
      }

      await syncVisibleAppBounds()
    },
    async reportContentBounds(appId: string, bounds: ShellWindow['bounds']) {
      await invoke('app:setBounds', { appId, bounds })
    },
  }
}
