import type { AppBounds, SnapZone } from '@maia/shared'

import { clampBounds, getSnapBounds, getSnapZoneForPoint, getViewportBounds, MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH } from './windowLayout'

export type ResizeDirection = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export const RESIZE_HANDLES: Array<{ direction: ResizeDirection; className: string }> = [
  { direction: 'top', className: 'left-2 right-2 top-0 h-1 cursor-n-resize' },
  { direction: 'right', className: 'bottom-2 right-0 top-2 w-1 cursor-e-resize' },
  { direction: 'bottom', className: 'bottom-0 left-2 right-2 h-1 cursor-s-resize' },
  { direction: 'left', className: 'bottom-2 left-0 top-2 w-1 cursor-w-resize' },
  { direction: 'top-left', className: 'left-0 top-0 h-3 w-3 cursor-nw-resize' },
  { direction: 'top-right', className: 'right-0 top-0 h-3 w-3 cursor-ne-resize' },
  { direction: 'bottom-left', className: 'bottom-0 left-0 h-3 w-3 cursor-sw-resize' },
  { direction: 'bottom-right', className: 'bottom-0 right-0 h-3 w-3 cursor-se-resize' },
]

function resizeBounds(bounds: AppBounds, deltaX: number, deltaY: number, direction: ResizeDirection) {
  const nextBounds = { ...bounds }
  if (direction.includes('right')) nextBounds.width = Math.max(MIN_WINDOW_WIDTH, bounds.width + deltaX)
  if (direction.includes('left')) {
    nextBounds.x = bounds.x + deltaX
    nextBounds.width = Math.max(MIN_WINDOW_WIDTH, bounds.width - deltaX)
  }
  if (direction.includes('bottom')) nextBounds.height = Math.max(MIN_WINDOW_HEIGHT, bounds.height + deltaY)
  if (direction.includes('top')) {
    nextBounds.y = bounds.y + deltaY
    nextBounds.height = Math.max(MIN_WINDOW_HEIGHT, bounds.height - deltaY)
  }
  return clampBounds(nextBounds, getViewportBounds())
}

interface DragOptions {
  onSnap: (zone: SnapZone) => void
  onUpdateBounds: (bounds: AppBounds) => void
  setSnapPreview: (bounds: AppBounds | null) => void
}

export function beginWindowDrag(
  startBounds: AppBounds,
  startX: number,
  startY: number,
  { onSnap, onUpdateBounds, setSnapPreview }: DragOptions,
) {
  const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
    const nextBounds = clampBounds({
      ...startBounds,
      x: startBounds.x + moveEvent.clientX - startX,
      y: startBounds.y + moveEvent.clientY - startY,
    }, getViewportBounds())
    onUpdateBounds(nextBounds)
    const zone = getSnapZoneForPoint(moveEvent.clientX, moveEvent.clientY, getViewportBounds())
    setSnapPreview(zone === 'none' ? null : getSnapBounds(zone, getViewportBounds()))
  }

  const handlePointerUp = (upEvent: globalThis.PointerEvent) => {
    const zone = getSnapZoneForPoint(upEvent.clientX, upEvent.clientY, getViewportBounds())
    if (zone !== 'none') onSnap(zone)
    setSnapPreview(null)
    globalThis.window.removeEventListener('pointermove', handlePointerMove)
    globalThis.window.removeEventListener('pointerup', handlePointerUp)
  }
  globalThis.window.addEventListener('pointermove', handlePointerMove)
  globalThis.window.addEventListener('pointerup', handlePointerUp)
}

export function beginWindowResize(
  direction: ResizeDirection,
  startBounds: AppBounds,
  startX: number,
  startY: number,
  onUpdateBounds: (bounds: AppBounds) => void,
) {
  const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
    onUpdateBounds(resizeBounds(
      startBounds,
      moveEvent.clientX - startX,
      moveEvent.clientY - startY,
      direction,
    ))
  }

  const handlePointerUp = () => {
    globalThis.window.removeEventListener('pointermove', handlePointerMove)
    globalThis.window.removeEventListener('pointerup', handlePointerUp)
  }
  globalThis.window.addEventListener('pointermove', handlePointerMove)
  globalThis.window.addEventListener('pointerup', handlePointerUp)
}
