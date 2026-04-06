import type { InstalledApp, ChatMessage } from '@maia/shared'

import { AppWindow } from './AppWindow'
import { WindowContent } from './WindowContent'
import { type ShellWindow } from '../../store/windowStore'
import { getDefaultWindowBounds, getViewportBounds } from '../../windowLayout'

interface WindowLayerProps {
  installedApps: InstalledApp[]
  messages: ChatMessage[]
  onCloseWindow: (windowId: string) => void
  onCommand: (window: ShellWindow, command: string) => void
  onFocusWindow: (windowId: string) => void
  onInstallApp: (app: Pick<InstalledApp, 'name' | 'icon' | 'url' | 'manifestId'>) => Promise<void>
  onMinimizeWindow: (windowId: string) => void
  onOpenItem: (itemId: string) => void
  onSendMessage: (message: string, replyToId?: string) => Promise<void>
  onSnapWindow: (windowId: string, zone: ShellWindow['snapZone']) => void
  onToggleMaximize: (window: ShellWindow) => void
  onUpdateBounds: (windowId: string, bounds: ShellWindow['bounds']) => void
  onUpdateSetting: (key: string, value: unknown) => Promise<void>
  settings: Record<string, unknown>
  windows: ShellWindow[]
}

export function WindowLayer({
  installedApps,
  messages,
  onCloseWindow,
  onCommand,
  onFocusWindow,
  onInstallApp,
  onMinimizeWindow,
  onOpenItem,
  onSendMessage,
  onSnapWindow,
  onToggleMaximize,
  onUpdateBounds,
  onUpdateSetting,
  settings,
  windows,
}: WindowLayerProps) {
  return (
    <>
      {[...windows].sort((left, right) => left.zIndex - right.zIndex).map((window) => (
        <AppWindow
          key={window.id}
          onClose={() => {
            onCloseWindow(window.id)
          }}
          onCommand={(command) => {
            onCommand(window, command)
          }}
          onFocus={() => {
            onFocusWindow(window.id)
          }}
          onMinimize={() => {
            onMinimizeWindow(window.id)
          }}
          onSnap={(zone) => {
            onSnapWindow(window.id, zone)
          }}
          onToggleMaximize={() => {
            if (window.isMaximized) {
              onUpdateBounds(window.id, getDefaultWindowBounds(0, getViewportBounds()))
              return
            }

            onToggleMaximize(window)
          }}
          onUpdateBounds={(bounds) => {
            onUpdateBounds(window.id, bounds)
          }}
          window={window}
        >
          <WindowContent
            installedApps={installedApps}
            messages={messages}
            onInstallApp={onInstallApp}
            onOpenItem={onOpenItem}
            onSendMessage={onSendMessage}
            onUpdateSetting={onUpdateSetting}
            settings={settings}
            window={window}
          />
        </AppWindow>
      ))}
    </>
  )
}
