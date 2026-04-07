import { useEffect, useRef } from 'react'

import type { IPCEvents, SnapZone } from '@maia/shared'

import { useIPC } from './useIPC'
import { useChatStore } from '../store/chatStore'
import { useTaskStore } from '../store/taskStore'
import { type ShellWindow, useWindowStore } from '../store/windowStore'
import { getSnapBounds, getViewportBounds } from '../windowLayout'
import { getBuiltinWindow } from '../windowFactory'

type SharedStateSnapshot = {
  status: 'planning' | 'bidding' | 'executing' | 'synthesizing' | 'done' | 'failed'
  agents: Record<string, {
    agentId: string
    role: 'primary' | 'secondary' | 'observer'
    status: 'idle' | 'working' | 'watching' | 'done' | 'failed'
  }>
}

type SharedStatePayload = {
  state: SharedStateSnapshot
}

export function useBrainEvents() {
  const { invoke, on } = useIPC()
  const setThought = useTaskStore((state) => state.setThought)
  const setPlan = useTaskStore((state) => state.setPlan)
  const updatePlanStep = useTaskStore((state) => state.updatePlanStep)
  const setStatus = useTaskStore((state) => state.setStatus)
  const setTaskPhase = useTaskStore((state) => state.setTaskPhase)
  const setAgentStatus = useTaskStore((state) => state.setAgentStatus)
  const setPrimaryAgentIds = useTaskStore((state) => state.setPrimaryAgentIds)
  const rebuildResearch = useTaskStore((state) => state.rebuildResearch)
  const resetResearch = useTaskStore((state) => state.resetResearch)
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
    const syncSharedTaskState = (state: SharedStateSnapshot) => {
      setTaskPhase(state.status)

      const primaryIds = Object.values(state.agents)
        .filter((agent) => agent.role === 'primary')
        .map((agent) => agent.agentId)

      setPrimaryAgentIds(primaryIds)

      for (const [agentId, agent] of Object.entries(state.agents)) {
        addAgent(agentId)
        setAgentStatus(agentId, agent.status)
      }
    }

    const onSharedState = (
      channel: string,
      listener: (state: SharedStateSnapshot) => void,
    ) => on(channel as keyof IPCEvents, (_, payload) => {
      const sharedPayload = payload as unknown as SharedStatePayload
      if (sharedPayload.state) {
        listener(sharedPayload.state)
      }
    })

    const unsubs = [
      on('brain:thinking', (_, payload) => {
        setThought(payload.thought)
        rebuildResearch(useChatStore.getState().messages, payload.thought)
      }),

      on('brain:planCreated', (_, payload) => {
        setPlan(payload.steps)
      }),

      on('brain:planUpdated', (_, payload) => {
        updatePlanStep(payload.stepIndex, payload.status as 'pending' | 'in_progress' | 'completed' | 'failed')
      }),

      on('brain:taskCompleted', (_, payload) => {
        setTaskPhase('done')
        setStatus(false, useTaskStore.getState().taskDescription)
        setThought('')
        resetResearch()
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
        setTaskPhase('failed')
        setStatus(false, useTaskStore.getState().taskDescription)
        setThought('')
        resetResearch()
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
        setAgentStatus(payload.agentId, 'working')
        setPrimaryAgentIds([
          ...useTaskStore.getState().primaryAgentIds,
          payload.agentId,
        ])
        setTaskPhase('executing')
        void invoke('app:open', { appId: payload.appId })
      }),

      on('brain:agentCompleted', (_, payload) => {
        removeAgent(payload.agentId)
        setAgentStatus(payload.agentId, 'done')
      }),

      onSharedState('orchestrator.shared_state.agent_registered', (state) => {
        syncSharedTaskState(state)
      }),

      onSharedState('orchestrator.shared_state.agent_status_changed', (state) => {
        syncSharedTaskState(state)
      }),

      onSharedState('orchestrator.shared_state.task_status_changed', (state) => {
        syncSharedTaskState(state)
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
  }, [addAgent, addMessage, focusWindow, invoke, on, rebuildResearch, removeAgent, resetResearch, setAgentStatus, setPlan, setPrimaryAgentIds, setStatus, setTaskPhase, setThought, updatePlanStep, updateSnapZone, upsertWindow])
}
