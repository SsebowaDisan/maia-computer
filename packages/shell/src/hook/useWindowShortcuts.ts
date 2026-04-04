import { useEffect } from 'react'

import { type ShellWindow } from '../store/windowStore'
import { getDefaultWindowBounds, getSnapBounds, getViewportBounds } from '../windowLayout'

interface UseWindowShortcutsOptions {
  updateBounds: (windowId: string, bounds: ShellWindow['bounds']) => void
  updateSnapZone: (
    windowId: string,
    snapZone: ShellWindow['snapZone'],
    bounds: ShellWindow['bounds'],
  ) => void
  windows: ShellWindow[]
}

export function useWindowShortcuts({
  updateBounds,
  updateSnapZone,
  windows,
}: UseWindowShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey) {
        return
      }

      const topWindow = [...windows]
        .filter((window) => !window.isMinimized)
        .sort((left, right) => right.zIndex - left.zIndex)[0]

      if (!topWindow) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        updateSnapZone(topWindow.id, 'left', getSnapBounds('left', getViewportBounds()))
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        updateSnapZone(topWindow.id, 'right', getSnapBounds('right', getViewportBounds()))
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        updateSnapZone(topWindow.id, 'maximized', getSnapBounds('maximized', getViewportBounds()))
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        updateBounds(topWindow.id, getDefaultWindowBounds(windows.length, getViewportBounds()))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [updateBounds, updateSnapZone, windows])
}
