import { useEffect, useRef } from 'react'

import type { SnapZone } from '@maia/shared'

import { useIPC } from './useIPC'
import { useChatStore } from '../store/chatStore'
import { useTaskStore } from '../store/taskStore'
import { type ShellWindow, useWindowStore } from '../store/windowStore'
import { getSnapBounds, getViewportBounds } from '../windowLayout'
import { getBuiltinWindow } from '../windowFactory'

export function useBrainEvents() {
  const { invoke, on } = useIPC()
  const setThought = useTaskStore((state) => state.setThought)
  const setPlan = useTaskStore((state) => state.setPlan)
  const updatePlanStep = useTaskStore((state) => state.updatePlanStep)
  const setStatus = useTaskStore((state) => state.setStatus)
  const addAgent = useTaskStore((state) => state.addAgent)
  const removeAgent = useTaskStore((state) => state.removeAgent)
  const addMessage = useChatStore((state) => state.addMessage)
  const upsertWindow = useWindowStore((state) => state.upsertWindow)
  const focusWindow = useWindowStore((state) => state.focusWindow)
  const updateSnapZone = useWindowStore((state) => state.updateSnapZone)
  const windows = useWindowStore((state) => state.windows)

  // Use a ref for windows to avoid infinite effect re-runs
  const windowsRef = useRef<ShellWindow[]>(windows)
  windowsRef.current = windows

  useEffect(() => {
    const unsubs = [
      on('brain:thinking', (_, payload) => {
        setThought(payload.thought)
      }),

      on('brain:planCreated', (_, payload) => {
        setPlan(payload.steps)
      }),

      on('brain:planUpdated', (_, payload) => {
        updatePlanStep(payload.stepIndex, payload.status as 'pending' | 'in_progress' | 'completed' | 'failed')
      }),

      on('brain:taskCompleted', (_, payload) => {
        setStatus(false, '')
        setThought('')
        addMessage({
          id: `done_${Date.now()}`,
          sender: 'computer',
          receiver: 'user',
          intent: 'update',
          message: payload.summary,
          context: { taskId: 'active' },
          timestamp: Date.now(),
        })
      }),

      on('brain:error', (_, payload) => {
        setThought('')
        addMessage({
          id: `err_${Date.now()}`,
          sender: 'computer',
          receiver: 'user',
          intent: 'update',
          message: `Something went wrong: ${payload.message}`,
          context: { taskId: 'active' },
          timestamp: Date.now(),
        })
      }),

      on('brain:agentStarted', (_, payload) => {
        addAgent(payload.agentId)
        void invoke('app:open', { appId: payload.appId })
      }),

      on('brain:agentCompleted', (_, payload) => {
        removeAgent(payload.agentId)
      }),

      on('theatre:arrange', (_, payload) => {
        const viewport = getViewportBounds()

        for (const item of payload.layout) {
          if (item.windowId === 'team-chat') {
            const chatWindow = getBuiltinWindow('chat', windowsRef.current)
            upsertWindow(chatWindow)
            updateSnapZone('team-chat', item.snapZone as SnapZone, getSnapBounds(item.snapZone as SnapZone, viewport))
          } else if (item.appId) {
            // Find the installed app to get its name/icon for the shell window
            void invoke('app:list', {}).then((result) => {
              const app = result.apps.find((a: { id: string }) => a.id === item.appId)
              if (app) {
                upsertWindow({
                  id: app.id,
                  kind: 'app',
                  title: app.name,
                  icon: app.icon,
                  appId: app.id,
                  bounds: getSnapBounds(item.snapZone as SnapZone, viewport),
                  snapZone: item.snapZone as SnapZone,
                  isMaximized: false,
                  isMinimized: false,
                  zIndex: 1,
                })
              }
              void invoke('app:open', { appId: item.appId! })
            })
          }
        }

        if (payload.focusAppId) {
          focusWindow(payload.focusAppId)
        }
      }),

      on('theatre:focus', (_, payload) => {
        focusWindow(payload.appId)
      }),
    ]

    return () => {
      for (const unsub of unsubs) {
        unsub()
      }
    }
  }, [addAgent, addMessage, focusWindow, invoke, on, removeAgent, setPlan, setStatus, setThought, updatePlanStep, updateSnapZone, upsertWindow])
}
