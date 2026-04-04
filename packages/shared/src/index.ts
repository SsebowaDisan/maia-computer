// Types — Apps
export type {
  AppManifest,
  AppCategory,
  InstalledApp,
  AppBadge,
  AppBounds,
  SnapZone,
  WindowState,
  Space,
} from './type/apps'

export { APP_CATEGORY, SNAP_ZONE } from './type/apps'

// Types — Events
export type {
  MaiaEvent,
  BrainEvent,
  AppEvent,
  CommunicationEvent,
  SessionEvent,
  CostEvent,
  PlanStep,
  StageContract,
  PlanStepStatus,
} from './type/events'

export { PLAN_STEP_STATUS } from './type/events'

// Types — Actions
export type {
  ActionCommand,
  ActionResult,
  KeyModifier,
} from './type/actions'

export { KEY_MODIFIER } from './type/actions'

// Types — Messages
export type {
  ChatMessage,
  MessageIntent,
  MessagePriority,
  MessageContext,
  MessageAttachments,
} from './type/messages'

export {
  MESSAGE_INTENT,
  MESSAGE_PRIORITY,
  getMessagePriority,
} from './type/messages'

// Types — Task
export type {
  Task,
  TaskStatus,
  TaskCost,
  ControlLevel,
} from './type/task'

export { TASK_STATUS, CONTROL_LEVEL } from './type/task'

// Types — IPC
export type {
  IPCCommands,
  IPCResults,
  IPCEvents,
  SearchResult,
  SearchResultGroup,
} from './type/ipc'

// Constants
export type { AgentProfile } from './constant/agents'
export { AGENT_PROFILES, USER_PROFILE } from './constant/agents'
export { ACTION_TIMING, BRAIN_TIMING, STREAM_TIMING, WEBSOCKET_TIMING, COST_DEFAULTS } from './constant/timing'
