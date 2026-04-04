import type { PlanStep } from './events'

export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  PAUSED: 'paused',
  TAKEOVER: 'takeover',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS]

export interface Task {
  id: string
  description: string
  status: TaskStatus
  plan: PlanStep[]
  currentStep: number
  sessionId: string
  createdAt: number
  completedAt?: number
  summary?: string
  cost: TaskCost
}

export interface TaskCost {
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  budgetLimit: number
  callCount: number
}

export const CONTROL_LEVEL = {
  FULL_AUTO: 1,
  NOTIFY: 2,
  APPROVE_MAJOR: 3,
  APPROVE_ALL: 4,
  COLLABORATIVE: 5,
  STEP_BY_STEP: 6,
} as const

export type ControlLevel = typeof CONTROL_LEVEL[keyof typeof CONTROL_LEVEL]
