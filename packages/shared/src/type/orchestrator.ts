import type { SnapZone } from './apps'

export interface SubTask {
  id: string
  description: string
  agentId: string
  appId: string
  dependsOn: string[]
  status: SubTaskStatus
  result?: string
}

export const SUB_TASK_STATUS = {
  PENDING: 'pending',
  WAITING: 'waiting',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  USER_HANDLED: 'user_handled',
} as const

export type SubTaskStatus = typeof SUB_TASK_STATUS[keyof typeof SUB_TASK_STATUS]

export interface TheatreLayout {
  appId?: string
  windowId?: string
  snapZone: SnapZone
}

export interface AgentPersonalityConfig {
  tone: string
  quirks: string[]
  messageStyle: string
  priorities: string[]
  biases: string[]
  challengesTrigger: string[]
  speaksWhen: string[]
  staysQuiet: string[]
  deferenceTo: string[]
  challengesOften: string[]
}
