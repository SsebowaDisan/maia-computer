import { create } from 'zustand'

import type { PlanStep, PlanStepStatus } from '@maia/shared'

interface TaskStoreState {
  running: boolean
  taskDescription: string
  thought: string
  plan: PlanStep[]
  setStatus: (running: boolean, taskDescription: string) => void
  setThought: (thought: string) => void
  setPlan: (plan: PlanStep[]) => void
  updatePlanStep: (stepIndex: number, status: PlanStepStatus) => void
}

export const useTaskStore = create<TaskStoreState>((set) => ({
  running: false,
  taskDescription: '',
  thought: '',
  plan: [],
  setStatus: (running, taskDescription) => {
    set({ running, taskDescription })
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
}))
