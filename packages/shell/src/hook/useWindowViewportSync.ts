import { useEffect, useRef } from 'react'

import { SNAP_ZONE } from '@maia/shared'

import { type ShellWindow } from '../store/windowStore'
import { clampBounds, getSnapBounds, getViewportBounds, scaleBoundsToViewport } from '../windowLayout'

interface UseWindowViewportSyncOptions {
  updateBounds: (windowId: string, bounds: ShellWindow['bounds']) => void
  updateSnapZone: (
    windowId: string,
    snapZone: ShellWindow['snapZone'],
    bounds: ShellWindow['bounds'],
  ) => void
  windows: ShellWindow[]
}

function boundsChanged(left: ShellWindow['bounds'], right: ShellWindow['bounds']): boolean {
  return left.x !== right.x
    || left.y !== right.y
    || left.width !== right.width
    || left.height !== right.height
}

export function useWindowViewportSync({
  updateBounds,
  updateSnapZone,
  windows,
}: UseWindowViewportSyncOptions) {
  const previousViewportRef = useRef(getViewportBounds())
  const windowsRef = useRef(windows)
  windowsRef.current = windows

  useEffect(() => {
    const handleResize = () => {
      const nextViewport = getViewportBounds()
      const previousViewport = previousViewportRef.current

      if (
        previousViewport.width === nextViewport.width
        && previousViewport.height === nextViewport.height
      ) {
        return
      }

      for (const window of windowsRef.current) {
        if (window.snapZone !== SNAP_ZONE.NONE || window.isMaximized) {
          const zone = window.isMaximized ? SNAP_ZONE.MAXIMIZED : window.snapZone
          const nextBounds = getSnapBounds(zone, nextViewport)

          if (boundsChanged(window.bounds, nextBounds)) {
            updateSnapZone(window.id, zone, nextBounds)
          }
          continue
        }

        const nextBounds = scaleBoundsToViewport(window.bounds, previousViewport, nextViewport)
        const clampedBounds = clampBounds(nextBounds, nextViewport)

        if (boundsChanged(window.bounds, clampedBounds)) {
          updateBounds(window.id, clampedBounds)
        }
      }

      previousViewportRef.current = nextViewport
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateBounds, updateSnapZone])
}
