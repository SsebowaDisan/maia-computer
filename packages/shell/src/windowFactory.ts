import type { ShellWindow } from './store/windowStore'

import { getDefaultWindowBounds, getViewportBounds, getWorkspaceBounds } from './windowLayout'

export function getBuiltinWindow(kind: ShellWindow['kind'], windows: ShellWindow[]): ShellWindow {
  const viewport = getViewportBounds()
  const workspace = getWorkspaceBounds(viewport)

  if (kind === 'chat' && windows.some((window) => window.kind === 'app')) {
    return {
      id: 'team-chat',
      kind: 'chat',
      title: 'Team Chat',
      icon: '💬',
      bounds: {
        x: workspace.x + workspace.width * 0.68,
        y: workspace.y,
        width: workspace.width * 0.32,
        height: workspace.height,
      },
      snapZone: 'none',
      isMaximized: false,
      isMinimized: false,
      zIndex: 1,
    }
  }

  const title = kind === 'store' ? 'App Store' : kind === 'settings' ? 'Settings' : 'Team Chat'
  const icon = kind === 'store' ? '⊞' : kind === 'settings' ? '⚙️' : '💬'

  return {
    id: kind === 'chat' ? 'team-chat' : kind,
    kind,
    title,
    icon,
    bounds: getDefaultWindowBounds(windows.length, viewport),
    snapZone: 'none',
    isMaximized: false,
    isMinimized: false,
    zIndex: 1,
  }
}
