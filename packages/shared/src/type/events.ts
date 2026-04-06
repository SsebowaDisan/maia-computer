import type { ChatMessage } from './messages'

export interface BrainAction {
  type: string
  target?: string
  value?: string
}

export type BrainEvent =
  | { type: 'brain.thinking'; thought: string; timestamp: number }
  | { type: 'brain.plan_created'; steps: PlanStep[]; timestamp: number }
  | { type: 'brain.plan_updated'; stepIndex: number; status: PlanStepStatus; timestamp: number }
  | { type: 'brain.decision'; action: BrainAction; reasoning: string; timestamp: number }
  | { type: 'brain.error'; message: string; timestamp: number }

export type AppEvent =
  | { type: 'app.opened'; appId: string; name: string; timestamp: number }
  | { type: 'app.closed'; appId: string; timestamp: number }
  | { type: 'app.navigated'; appId: string; url: string; timestamp: number }
  | { type: 'app.action'; appId: string; action: string; target: string; timestamp: number }

export type CommunicationEvent =
  | { type: 'message.sent'; message: ChatMessage; timestamp: number }
  | { type: 'message.received'; message: ChatMessage; timestamp: number }

export type SessionEvent =
  | { type: 'session.task_started'; taskId: string; description: string; timestamp: number }
  | { type: 'session.task_completed'; taskId: string; summary: string; timestamp: number }
  | { type: 'session.error'; message: string; timestamp: number }

export type CostEvent =
  | { type: 'cost.llm_call'; provider: string; model: string; inputTokens: number; outputTokens: number; cost: number; timestamp: number }
  | { type: 'cost.budget_warning'; currentCost: number; budgetLimit: number; timestamp: number }
  | { type: 'cost.budget_exceeded'; currentCost: number; budgetLimit: number; timestamp: number }

export type OrchestratorEvent =
  | { type: 'orchestrator.agent_started'; agentId: string; appId: string; description: string; timestamp: number }
  | { type: 'orchestrator.agent_completed'; agentId: string; summary: string; timestamp: number }
  | { type: 'orchestrator.discussion_started'; questionId: string; agentId: string; question: string; timestamp: number }
  | { type: 'orchestrator.theatre_arrange'; layout: unknown[]; focusAppId?: string; timestamp: number }
  | { type: 'orchestrator.theatre_focus'; appId: string; timestamp: number }

export type MaiaEvent =
  | BrainEvent
  | AppEvent
  | CommunicationEvent
  | SessionEvent
  | CostEvent
  | OrchestratorEvent

export interface PlanStep {
  step: number
  description: string
  status: PlanStepStatus
  contract: StageContract
}

export interface StageContract {
  input?: string
  output: string
}

export const PLAN_STEP_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type PlanStepStatus = typeof PLAN_STEP_STATUS[keyof typeof PLAN_STEP_STATUS]

export type { ActionCommand } from './actions'
export type { ChatMessage } from './messages'
