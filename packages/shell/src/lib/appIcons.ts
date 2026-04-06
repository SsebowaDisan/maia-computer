import type { InstalledApp } from '@maia/shared'

const VSCODE_ICON_PATH = './icon/vscode.svg'

interface ResolveAppIconOptions {
  appId?: string
  icon: string
  manifestId?: string
  name?: string
  url?: string
}

export function resolveAppIcon({
  appId,
  icon,
  manifestId,
  name,
  url,
}: ResolveAppIconOptions): string {
  if (
    manifestId === 'vscode-web'
    || appId === 'vscode-web'
    || name === 'VS Code Web'
    || url?.includes('vscode.dev')
    || icon.includes('vscode.dev')
  ) {
    return VSCODE_ICON_PATH
  }

  return icon
}

export function normalizeInstalledApp(app: InstalledApp): InstalledApp {
  return {
    ...app,
    icon: resolveAppIcon({
      appId: app.id,
      icon: app.icon,
      manifestId: app.manifestId,
      name: app.name,
      url: app.url,
    }),
  }
}
