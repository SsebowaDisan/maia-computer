import { create } from 'zustand'

import type { ChatMessage, PlanStep, PlanStepStatus } from '@maia/shared'

import { buildResearchSnapshot, emptyResearchSnapshot, type ResearchSnapshot } from '../lib/researchSignals'

export type TaskPhase =
  | 'idle'
  | 'planning'
  | 'bidding'
  | 'executing'
  | 'synthesizing'
  | 'done'
  | 'failed'

export type AgentTaskStatus = 'idle' | 'working' | 'watching' | 'done' | 'failed'

interface TaskStoreState {
  running: boolean
  taskDescription: string
  taskPhase: TaskPhase
  agentStatuses: Record<string, AgentTaskStatus>
  primaryAgentIds: string[]
  thought: string
  plan: PlanStep[]
  activeAgentIds: string[]
  research: ResearchSnapshot
  setStatus: (running: boolean, taskDescription: string) => void
  setTaskPhase: (phase: TaskPhase) => void
  setAgentStatus: (agentId: string, status: AgentTaskStatus) => void
  setPrimaryAgentIds: (ids: string[]) => void
  setThought: (thought: string) => void
  setPlan: (plan: PlanStep[]) => void
  updatePlanStep: (stepIndex: number, status: PlanStepStatus) => void
  addAgent: (agentId: string) => void
  removeAgent: (agentId: string) => void
  clearAgents: () => void
  rebuildResearch: (messages: ChatMessage[], thought?: string) => void
  resetResearch: () => void
}

export const useTaskStore = create<TaskStoreState>((set) => ({
  running: false,
  taskDescription: '',
  taskPhase: 'idle',
  agentStatuses: {},
  primaryAgentIds: [],
  thought: '',
  plan: [],
  activeAgentIds: [],
  research: emptyResearchSnapshot(),
  setStatus: (running, taskDescription) => {
    set((state) => {
      if (running) {
        return {
          running: true,
          taskDescription,
          taskPhase: 'planning' as const,
          activeAgentIds: [],
          agentStatuses: {},
          primaryAgentIds: [],
          research: emptyResearchSnapshot(),
        }
      }

      return {
        running: false,
        taskDescription: taskDescription || state.taskDescription,
        activeAgentIds: [],
        research: emptyResearchSnapshot(),
      }
    })
  },
  setTaskPhase: (taskPhase) => {
    set({ taskPhase })
  },
  setAgentStatus: (agentId, status) => {
    set((state) => ({
      agentStatuses: {
        ...state.agentStatuses,
        [agentId]: status,
      },
    }))
  },
  setPrimaryAgentIds: (ids) => {
    set({ primaryAgentIds: [...new Set(ids)] })
  },
  setThought: (thought) => {
    set({ thought })
  },
  setPlan: (plan) => {
    set({ plan })
  },
  updatePlanStep: (stepIndex, status) => {
    set((state) => ({
      plan: state.plan.map((step, index) => (
        index === stepIndex ? { ...step, status } : step
      )),
    }))
  },
  addAgent: (agentId) => {
    set((state) => ({
      activeAgentIds: state.activeAgentIds.includes(agentId)
        ? state.activeAgentIds
        : [...state.activeAgentIds, agentId],
    }))
  },
  removeAgent: (agentId) => {
    set((state) => ({
      activeAgentIds: state.activeAgentIds.filter((id) => id !== agentId),
    }))
  },
  clearAgents: () => {
    set({ activeAgentIds: [] })
  },
  rebuildResearch: (messages, thought) => {
    set((state) => ({
      research: buildResearchSnapshot(messages, thought ?? state.thought),
    }))
  },
  resetResearch: () => {
    set({ research: emptyResearchSnapshot() })
  },
}))
