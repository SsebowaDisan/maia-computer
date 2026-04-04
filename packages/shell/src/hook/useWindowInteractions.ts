import { useEffect, useRef, useState, type PointerEvent } from 'react'

import type { AppBounds, SnapZone } from '@maia/shared'

import type { ShellWindow } from '../store/windowStore'
import { useContentBounds } from './useContentBounds'
import {
  beginWindowDrag,
  beginWindowResize,
  RESIZE_HANDLES,
  type ResizeDirection,
} from '../windowInteraction'

interface UseWindowInteractionsOptions {
  onFocus: () => void
  onReportContentBounds: (bounds: AppBounds) => void
  onSnap: (zone: SnapZone) => void
  onUpdateBounds: (bounds: AppBounds) => void
  shellWindow: ShellWindow
}

export function useWindowInteractions({
  onFocus,
  onReportContentBounds,
  onSnap,
  onUpdateBounds,
  shellWindow,
}: UseWindowInteractionsOptions) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [snapPreview, setSnapPreview] = useState<AppBounds | null>(null)

  useContentBounds({
    contentElement: contentRef.current,
    enabled: shellWindow.kind === 'app',
    onReportContentBounds,
  })

  return {
    contentRef,
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
