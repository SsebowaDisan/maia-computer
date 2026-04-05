import { useState, type PointerEvent } from 'react'

import type { AppBounds, SnapZone } from '@maia/shared'

import type { ShellWindow } from '../store/windowStore'
import {
  beginWindowDrag,
  beginWindowResize,
  type ResizeDirection,
} from '../windowInteraction'

interface UseWindowInteractionsOptions {
  onFocus: () => void
  onSnap: (zone: SnapZone) => void
  onUpdateBounds: (bounds: AppBounds) => void
  shellWindow: ShellWindow
}

export function useWindowInteractions({
  onFocus,
  onSnap,
  onUpdateBounds,
  shellWindow,
}: UseWindowInteractionsOptions) {
  const [snapPreview, setSnapPreview] = useState<AppBounds | null>(null)

  return {
    snapPreview,
    startDrag(event: PointerEvent<HTMLDivElement>) {
      if (event.button !== 0) {
        return
      }

      onFocus()
      beginWindowDrag(shellWindow.bounds, event.clientX, event.clientY, {
        onSnap,
        onUpdateBounds,
        setSnapPreview,
      })
    },
    startResize(direction: ResizeDirection, event: PointerEvent<HTMLDivElement>) {
      event.stopPropagation()
      onFocus()
      beginWindowResize(direction, shellWindow.bounds, event.clientX, event.clientY, onUpdateBounds)
    },
  }
}
