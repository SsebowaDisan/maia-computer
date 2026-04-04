import type { InstalledApp, SnapZone } from '@maia/shared'

import { useIPC } from './useIPC'
import { useWindowShortcuts } from './useWindowShortcuts'
import { useDockStore } from '../store/dockStore'
import { type ShellWindow, useWindowStore } from '../store/windowStore'
import { clampBounds, getDefaultWindowBounds, getSnapBounds, getViewportBounds } from '../windowLayout'
import { getBuiltinWindow } from '../windowFactory'

export function useWindowManager() {
  const { invoke } = useIPC()
  const windows = useWindowStore((state) => state.windows)
  const upsertWindow = useWindowStore((state) => state.upsertWindow)
  const focusWindow = useWindowStore((state) => state.focusWindow)
  const closeWindowState = useWindowStore((state) => state.closeWindow)
  const updateBounds = useWindowStore((state) => state.updateBounds)
  const updateSnapZone = useWindowStore((state) => state.updateSnapZone)
  const toggleMinimized = useWindowStore((state) => state.toggleMinimized)
  const registerLaunch = useDockStore((state) => state.registerLaunch)

  useWindowShortcuts({ updateBounds, updateSnapZone, windows })

  return {
    windows,
    focusWindow,
    toggleMinimized,
    updateWindowBounds(windowId: string, bounds: ShellWindow['bounds']) {
      updateBounds(windowId, clampBounds(bounds, getViewportBounds()))
    },
    snapWindow(windowId: string, zone: SnapZone) {
      updateSnapZone(windowId, zone, getSnapBounds(zone, getViewportBounds()))
    },
    async openAppWindow(app: InstalledApp) {
      registerLaunch(app.id)
      upsertWindow({
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
      })
      await invoke('app:open', { appId: app.id })
    },
    openBuiltinWindow(kind: 'chat' | 'settings' | 'store') {
      registerLaunch(kind === 'chat' ? 'team-chat' : kind)
      upsertWindow(getBuiltinWindow(kind, windows))
    },
    async closeWindow(windowId: string) {
      const targetWindow = windows.find((window) => window.id === windowId)
      closeWindowState(windowId)

      if (targetWindow?.kind === 'app' && targetWindow.appId) {
        await invoke('app:close', { appId: targetWindow.appId })
      }
    },
    async reportContentBounds(appId: string, bounds: ShellWindow['bounds']) {
      await invoke('app:setBounds', { appId, bounds })
    },
  }
}
