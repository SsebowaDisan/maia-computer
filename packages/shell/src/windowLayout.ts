import { SNAP_ZONE, type AppBounds, type SnapZone } from '@maia/shared'

export const TITLE_BAR_HEIGHT = 38
export const COMMAND_BAR_HEIGHT = 44
export const SPACES_BAR_HEIGHT = 32
export const DOCK_HEIGHT = 76
export const DESKTOP_PADDING = 24
export const MIN_WINDOW_WIDTH = 400
export const MIN_WINDOW_HEIGHT = 300
const WINDOW_BORDER_WIDTH = 1

export interface ViewportBounds {
  width: number
  height: number
}

export function normalizeBounds(bounds: AppBounds): AppBounds {
  const x = Math.floor(bounds.x)
  const y = Math.floor(bounds.y)
  const right = Math.ceil(bounds.x + bounds.width)
  const bottom = Math.ceil(bounds.y + bounds.height)

  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y),
  }
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
  return normalizeBounds({
    x: DESKTOP_PADDING,
    y: SPACES_BAR_HEIGHT + DESKTOP_PADDING,
    width: viewport.width - DESKTOP_PADDING * 2,
    height: viewport.height - SPACES_BAR_HEIGHT - DOCK_HEIGHT - DESKTOP_PADDING * 2,
  })
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

export function getAppContentBounds(windowBounds: AppBounds): AppBounds {
  return normalizeBounds({
    x: windowBounds.x + WINDOW_BORDER_WIDTH,
    y: windowBounds.y + TITLE_BAR_HEIGHT + WINDOW_BORDER_WIDTH,
    width: Math.max(1, windowBounds.width - WINDOW_BORDER_WIDTH * 2),
    height: Math.max(1, windowBounds.height - TITLE_BAR_HEIGHT - COMMAND_BAR_HEIGHT - WINDOW_BORDER_WIDTH * 2),
  })
}

export function clampBounds(bounds: AppBounds, viewport: ViewportBounds): AppBounds {
  const workspace = getWorkspaceBounds(viewport)
  const width = Math.max(MIN_WINDOW_WIDTH, Math.min(bounds.width, workspace.width))
  const height = Math.max(MIN_WINDOW_HEIGHT, Math.min(bounds.height, workspace.height))

  return normalizeBounds({
    x: Math.min(Math.max(bounds.x, workspace.x), workspace.x + workspace.width - width),
    y: Math.min(Math.max(bounds.y, workspace.y), workspace.y + workspace.height - height),
    width,
    height,
  })
}

export function scaleBoundsToViewport(
  bounds: AppBounds,
  fromViewport: ViewportBounds,
  toViewport: ViewportBounds,
): AppBounds {
  const fromWorkspace = getWorkspaceBounds(fromViewport)
  const toWorkspace = getWorkspaceBounds(toViewport)
  const widthRatio = fromWorkspace.width === 0 ? 1 : toWorkspace.width / fromWorkspace.width
  const heightRatio = fromWorkspace.height === 0 ? 1 : toWorkspace.height / fromWorkspace.height

  return clampBounds({
    x: toWorkspace.x + (bounds.x - fromWorkspace.x) * widthRatio,
    y: toWorkspace.y + (bounds.y - fromWorkspace.y) * heightRatio,
    width: bounds.width * widthRatio,
    height: bounds.height * heightRatio,
  }, toViewport)
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
      return normalizeBounds({ x: workspace.x, y: workspace.y, width: halfWidth, height: workspace.height })
    case SNAP_ZONE.RIGHT:
      return normalizeBounds({
        x: workspace.x + halfWidth,
        y: workspace.y,
        width: halfWidth,
        height: workspace.height,
      })
    case SNAP_ZONE.TOP_LEFT:
      return normalizeBounds({ x: workspace.x, y: workspace.y, width: halfWidth, height: halfHeight })
    case SNAP_ZONE.TOP_RIGHT:
      return normalizeBounds({
        x: workspace.x + halfWidth,
        y: workspace.y,
        width: halfWidth,
        height: halfHeight,
      })
    case SNAP_ZONE.BOTTOM_LEFT:
      return normalizeBounds({
        x: workspace.x,
        y: workspace.y + halfHeight,
        width: halfWidth,
        height: halfHeight,
      })
    case SNAP_ZONE.BOTTOM_RIGHT:
      return normalizeBounds({
        x: workspace.x + halfWidth,
        y: workspace.y + halfHeight,
        width: halfWidth,
        height: halfHeight,
      })
    case SNAP_ZONE.MAXIMIZED:
      return workspace
    default:
      return workspace
  }
}

export interface GridPlacement {
  bounds: AppBounds
  snapZone: SnapZone
}

export function getGridPlacements(count: number, viewport: ViewportBounds): GridPlacement[] {
  if (count <= 0) {
    return []
  }

  if (count === 1) {
    return [{ bounds: getDefaultWindowBounds(0, viewport), snapZone: SNAP_ZONE.NONE }]
  }

  if (count === 2) {
    return [
      { bounds: getSnapBounds(SNAP_ZONE.LEFT, viewport), snapZone: SNAP_ZONE.LEFT },
      { bounds: getSnapBounds(SNAP_ZONE.RIGHT, viewport), snapZone: SNAP_ZONE.RIGHT },
    ]
  }

  if (count === 3) {
    return [
      { bounds: getSnapBounds(SNAP_ZONE.LEFT, viewport), snapZone: SNAP_ZONE.LEFT },
      { bounds: getSnapBounds(SNAP_ZONE.TOP_RIGHT, viewport), snapZone: SNAP_ZONE.TOP_RIGHT },
      { bounds: getSnapBounds(SNAP_ZONE.BOTTOM_RIGHT, viewport), snapZone: SNAP_ZONE.BOTTOM_RIGHT },
    ]
  }

  if (count === 4) {
    return [
      { bounds: getSnapBounds(SNAP_ZONE.TOP_LEFT, viewport), snapZone: SNAP_ZONE.TOP_LEFT },
      { bounds: getSnapBounds(SNAP_ZONE.TOP_RIGHT, viewport), snapZone: SNAP_ZONE.TOP_RIGHT },
      { bounds: getSnapBounds(SNAP_ZONE.BOTTOM_LEFT, viewport), snapZone: SNAP_ZONE.BOTTOM_LEFT },
      { bounds: getSnapBounds(SNAP_ZONE.BOTTOM_RIGHT, viewport), snapZone: SNAP_ZONE.BOTTOM_RIGHT },
    ]
  }

  const workspace = getWorkspaceBounds(viewport)
  const columns = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / columns)
  const cellWidth = workspace.width / columns
  const cellHeight = workspace.height / rows

  return Array.from({ length: count }, (_unused, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)

    return {
      bounds: normalizeBounds({
        x: workspace.x + cellWidth * column,
        y: workspace.y + cellHeight * row,
        width: cellWidth,
        height: cellHeight,
      }),
      snapZone: SNAP_ZONE.NONE,
    }
  })
}
