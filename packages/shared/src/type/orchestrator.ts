import type { SnapZone } from './apps'

export interface SubTask {
  id: string
  description: string
  agentId: string
  appId: string
  dependsOn: string[]
  status: SubTaskStatus
  result?: string
  role: AgentRole
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

export const AGENT_ROLE = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  OBSERVER: 'observer',
} as const

export type AgentRole = typeof AGENT_ROLE[keyof typeof AGENT_ROLE]

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

// --- Capability-based routing ---

export interface AgentCapability {
  domains: string[]
  verbs: string[]
  apps: string[]
  complexity: 'single-step' | 'multi-step' | 'analytical'
}

// --- Agent bidding ---

export interface AgentBid {
  agentId: string
  confidence: number
  reasoning: string
  estimatedComplexity: 'single-step' | 'multi-step' | 'analytical'
  relevantApps: string[]
}

// --- Shared task state ---

export interface AgentState {
  agentId: string
  role: AgentRole
  status: 'idle' | 'working' | 'watching' | 'done' | 'failed'
  findings: AgentFinding[]
  lastUpdate: number
}

export interface AgentFinding {
  source: string
  url?: string
  data: string
  timestamp: number
}

export interface SharedDecision {
  question: string
  decidedBy: string
  answer: string
  timestamp: number
}

export interface SharedTaskState {
  taskId: string
  description: string
  status: 'planning' | 'bidding' | 'executing' | 'synthesizing' | 'done' | 'failed'
  agents: Record<string, AgentState>
  decisions: SharedDecision[]
  lastUpdate: number
}

// --- Debate tracking ---

export interface DebateExchange {
  agentId: string
  message: string
  intent: 'challenge' | 'correction' | 'agreement' | 'flag' | 'recommendation'
  timestamp: number
}

export interface DebateRound {
  id: string
  trigger: string
  triggerAgentId: string
  exchanges: DebateExchange[]
  status: 'active' | 'converged' | 'deadlocked' | 'user_resolved'
  resolution?: string
  startedAt: number
}
