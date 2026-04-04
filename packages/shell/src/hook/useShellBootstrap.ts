import { useEffect } from 'react'

import type { PlanStepStatus } from '@maia/shared'

import { useIPC } from './useIPC'
import { useAppStore } from '../store/appStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTaskStore } from '../store/taskStore'

export function useShellBootstrap(activeSpaceId: string) {
  const { invoke, on } = useIPC()
  const setInstalledApps = useAppStore((state) => state.setInstalledApps)
  const setAppsLoading = useAppStore((state) => state.setLoading)
  const setSettings = useSettingsStore((state) => state.setSettings)
  const setPlan = useTaskStore((state) => state.setPlan)
  const setStatus = useTaskStore((state) => state.setStatus)
  const setThought = useTaskStore((state) => state.setThought)
  const updatePlanStep = useTaskStore((state) => state.updatePlanStep)

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
    void invoke('brain:getStatus', {}).then((result) => {
      setStatus(result.running, result.taskDescription ?? '')
    })

    const unsubscribeInstalled = on('app:installed', () => {
      void invoke('app:list', {}).then((result) => {
        setInstalledApps(result.apps)
      })
    })
    const unsubscribeThinking = on('brain:thinking', (_, payload) => {
      setThought(payload.thought)
    })
    const unsubscribePlan = on('brain:planCreated', (_, payload) => {
      setPlan(payload.steps)
    })
    const unsubscribePlanUpdated = on('brain:planUpdated', (_, payload) => {
      updatePlanStep(payload.stepIndex, payload.status as PlanStepStatus)
    })
    const unsubscribeCompleted = on('brain:taskCompleted', () => {
      setStatus(false, '')
    })

    return () => {
      unsubscribeInstalled()
      unsubscribeThinking()
      unsubscribePlan()
      unsubscribePlanUpdated()
      unsubscribeCompleted()
    }
  }, [invoke, on, setInstalledApps, setPlan, setSettings, setStatus, setThought, updatePlanStep])
}
