import { SNAP_ZONE, type AppBounds, type SnapZone } from '@maia/shared'

export const TITLE_BAR_HEIGHT = 38
export const COMMAND_BAR_HEIGHT = 44
export const SPACES_BAR_HEIGHT = 32
export const DOCK_HEIGHT = 76
export const DESKTOP_PADDING = 24
export const MIN_WINDOW_WIDTH = 400
export const MIN_WINDOW_HEIGHT = 300

export interface ViewportBounds {
  width: number
  height: number
}

export function getViewportBounds(): ViewportBounds {
  if (typeof window === 'undefined') {
    return { width: 1440, height: 900 }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

export function getWorkspaceBounds(viewport: ViewportBounds): AppBounds {
  return {
    x: DESKTOP_PADDING,
    y: SPACES_BAR_HEIGHT + DESKTOP_PADDING,
    width: viewport.width - DESKTOP_PADDING * 2,
    height: viewport.height - SPACES_BAR_HEIGHT - DOCK_HEIGHT - DESKTOP_PADDING * 2,
  }
}

export function getDefaultWindowBounds(index: number, viewport: ViewportBounds): AppBounds {
  const workspace = getWorkspaceBounds(viewport)
  const width = Math.min(1080, workspace.width - 48)
  const height = Math.min(760, workspace.height - 48)
  const offset = index * 24

  return clampBounds({
    x: workspace.x + Math.max((workspace.width - width) / 2, 0) + offset,
    y: workspace.y + 40 + offset,
    width,
    height,
  }, viewport)
}

export function clampBounds(bounds: AppBounds, viewport: ViewportBounds): AppBounds {
  const workspace = getWorkspaceBounds(viewport)
  const width = Math.max(MIN_WINDOW_WIDTH, Math.min(bounds.width, workspace.width))
  const height = Math.max(MIN_WINDOW_HEIGHT, Math.min(bounds.height, workspace.height))

  return {
    x: Math.min(Math.max(bounds.x, workspace.x), workspace.x + workspace.width - width),
    y: Math.min(Math.max(bounds.y, workspace.y), workspace.y + workspace.height - height),
    width,
    height,
  }
}

export function getSnapZoneForPoint(
  pointX: number,
  pointY: number,
  viewport: ViewportBounds,
): SnapZone {
  const threshold = 20
  const isLeft = pointX <= threshold
  const isRight = pointX >= viewport.width - threshold
  const isTop = pointY <= SPACES_BAR_HEIGHT + threshold
  const isBottom = pointY >= viewport.height - DOCK_HEIGHT - threshold

  if (isTop && pointX > viewport.width * 0.35 && pointX < viewport.width * 0.65) {
    return SNAP_ZONE.MAXIMIZED
  }

  if (isLeft && isTop) {
    return SNAP_ZONE.TOP_LEFT
  }

  if (isRight && isTop) {
    return SNAP_ZONE.TOP_RIGHT
  }

  if (isLeft && isBottom) {
    return SNAP_ZONE.BOTTOM_LEFT
  }

  if (isRight && isBottom) {
    return SNAP_ZONE.BOTTOM_RIGHT
  }

  if (isLeft) {
    return SNAP_ZONE.LEFT
  }

  if (isRight) {
    return SNAP_ZONE.RIGHT
  }

  return SNAP_ZONE.NONE
}

export function getSnapBounds(zone: SnapZone, viewport: ViewportBounds): AppBounds {
  const workspace = getWorkspaceBounds(viewport)
  const halfWidth = workspace.width / 2
  const halfHeight = workspace.height / 2

  switch (zone) {
    case SNAP_ZONE.LEFT:
      return { x: workspace.x, y: workspace.y, width: halfWidth, height: workspace.height }
    case SNAP_ZONE.RIGHT:
      return {
        x: workspace.x + halfWidth,
        y: workspace.y,
        width: halfWidth,
        height: workspace.height,
      }
    case SNAP_ZONE.TOP_LEFT:
      return { x: workspace.x, y: workspace.y, width: halfWidth, height: halfHeight }
    case SNAP_ZONE.TOP_RIGHT:
      return {
        x: workspace.x + halfWidth,
        y: workspace.y,
        width: halfWidth,
        height: halfHeight,
      }
    case SNAP_ZONE.BOTTOM_LEFT:
      return {
        x: workspace.x,
        y: workspace.y + halfHeight,
        width: halfWidth,
        height: halfHeight,
      }
    case SNAP_ZONE.BOTTOM_RIGHT:
      return {
        x: workspace.x + halfWidth,
        y: workspace.y + halfHeight,
        width: halfWidth,
        height: halfHeight,
      }
    case SNAP_ZONE.MAXIMIZED:
      return workspace
    default:
      return workspace
  }
}
