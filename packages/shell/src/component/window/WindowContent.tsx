import type { InstalledApp, ChatMessage } from '@maia/shared'

import { AppWebView } from './AppWebView'
import { ChatApp } from '../chat/ChatApp'
import { SettingsScreen } from '../../screen/SettingsScreen'
import { StoreScreen } from '../../screen/StoreScreen'
import { type ShellWindow } from '../../store/windowStore'

interface WindowContentProps {
  activeAgentIds: string[]
  installedApps: InstalledApp[]
  messages: ChatMessage[]
  onInstallApp: (app: Pick<InstalledApp, 'name' | 'icon' | 'url' | 'manifestId'>) => Promise<void>
  onOpenItem: (itemId: string) => void
  onSendMessage: (message: string, replyToId?: string) => Promise<void>
  onUpdateSetting: (key: string, value: unknown) => Promise<void>
  settings: Record<string, unknown>
  taskDescription: string
  window: ShellWindow
}

function AppPlaceholder({ appId }: { appId: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,#0f1218_0%,#090909_100%)] px-8 text-center">
      <div className="max-w-md rounded-2xl border border-border bg-surface/70 p-6 backdrop-blur">
        <p className="text-sm font-medium text-textPrimary">BrowserView content area</p>
        <p className="mt-2 text-sm text-textSecondary">
          Maia is reporting live bounds for <span className="text-textPrimary">{appId}</span>. The real web
          app will be positioned here by the Electron main process.
        </p>
      </div>
    </div>
  )
}

export function WindowContent({
  activeAgentIds,
  installedApps,
  messages,
  onInstallApp,
  onOpenItem,
  onSendMessage,
  onUpdateSetting,
  settings,
  taskDescription,
  window,
}: WindowContentProps) {
  if (window.kind === 'chat') {
    return <ChatApp activeAgentIds={activeAgentIds} activeTask={taskDescription} messages={messages} onSendMessage={onSendMessage} />
  }

  if (window.kind === 'store') {
    return <StoreScreen installedApps={installedApps} onInstallApp={onInstallApp} onOpenApp={onOpenItem} />
  }

  if (window.kind === 'settings') {
    return <SettingsScreen onUpdateSetting={onUpdateSetting} settings={settings} />
  }

  const installedApp = installedApps.find((app) => app.id === window.appId)

  if (installedApp) {
    return <AppWebView app={installedApp} />
  }

  return <AppPlaceholder appId={window.appId ?? window.title} />
}
