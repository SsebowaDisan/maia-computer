import { create } from 'zustand'

import type { ChatMessage, PlanStep, PlanStepStatus } from '@maia/shared'

import { buildResearchSnapshot, emptyResearchSnapshot, type ResearchSnapshot } from '../lib/researchSignals'

interface TaskStoreState {
  running: boolean
  taskDescription: string
  thought: string
  plan: PlanStep[]
  activeAgentIds: string[]
  research: ResearchSnapshot
  setStatus: (running: boolean, taskDescription: string) => void
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
  thought: '',
  plan: [],
  activeAgentIds: [],
  research: emptyResearchSnapshot(),
  setStatus: (running, taskDescription) => {
    set({ running, taskDescription })
    if (!running) {
      set({ activeAgentIds: [], research: emptyResearchSnapshot() })
    }
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
