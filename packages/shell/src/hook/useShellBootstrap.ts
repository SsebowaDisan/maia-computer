import { useEffect } from 'react'

import { useIPC } from './useIPC'
import { useAppStore } from '../store/appStore'
import { useSettingsStore } from '../store/settingsStore'

export function useShellBootstrap(activeSpaceId: string) {
  const { invoke, on } = useIPC()
  const setInstalledApps = useAppStore((state) => state.setInstalledApps)
  const setAppsLoading = useAppStore((state) => state.setLoading)
  const setSettings = useSettingsStore((state) => state.setSettings)

  useEffect(() => {
    setAppsLoading(true)
    void invoke('app:list', {}).then((result) => {
      setInstalledApps(result.apps)
      setAppsLoading(false)
    })
  }, [activeSpaceId, invoke, setAppsLoading, setInstalledApps])

  useEffect(() => {
    void invoke('settings:get', {}).then((result) => {
      setSettings(result.settings)
    })

    // Re-fetch app list when a new app is installed
    const unsubscribeInstalled = on('app:installed', () => {
      void invoke('app:list', {}).then((result) => {
        setInstalledApps(result.apps)
      })
    })

    return () => {
      unsubscribeInstalled()
    }
  }, [invoke, on, setInstalledApps, setSettings])
}
