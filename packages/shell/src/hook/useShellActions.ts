import type { InstalledApp } from '@maia/shared'

import { useIPC } from './useIPC'
import { useAppStore } from '../store/appStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTaskStore } from '../store/taskStore'

interface UseShellActionsOptions {
  installedApps: InstalledApp[]
  openAppWindow: (app: InstalledApp) => Promise<void>
  openBuiltinWindow: (kind: 'chat' | 'settings' | 'store') => void
}

export function useShellActions({
  installedApps,
  openAppWindow,
  openBuiltinWindow,
}: UseShellActionsOptions) {
  const { invoke } = useIPC()
  const setInstalledApps = useAppStore((state) => state.setInstalledApps)
  const updateSetting = useSettingsStore((state) => state.updateSetting)
  const setStatus = useTaskStore((state) => state.setStatus)

  const openDockItem = (itemId: string) => {
    const targetApp = installedApps.find((app) => app.id === itemId)
    if (targetApp) {
      void openAppWindow(targetApp)
      return
    }

    if (itemId === 'team-chat') {
      openBuiltinWindow('chat')
      return
    }

    if (itemId === 'settings') {
      openBuiltinWindow('settings')
      return
    }

    openBuiltinWindow('store')
  }

  const handleInstallApp = async (app: Pick<InstalledApp, 'name' | 'icon' | 'url' | 'manifestId'>) => {
    await invoke('app:install', app)
    const result = await invoke('app:list', {})
    setInstalledApps(result.apps)
  }

  const handleStartTask = async (description: string) => {
    await invoke('brain:startTask', { description })
    setStatus(true, description)
    openBuiltinWindow('chat')
  }

  const handleUpdateSetting = async (key: string, value: unknown) => {
    await invoke('settings:update', { key, value })
    updateSetting(key, value)
  }

  return {
    handleInstallApp,
    handleStartTask,
    handleUpdateSetting,
    openDockItem,
    async runCommand(appId: string | undefined, command: string) {
      if (appId) {
        await invoke('brain:execute', { appId, command })
        return
      }

      await handleStartTask(command)
    },
  }
}
