// Types — Apps
export type {
  AppManifest,
  AppNavigation,
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
  OrchestratorEvent,
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
  QuestionSeverity,
  PendingQuestion,
} from './type/messages'

export {
  MESSAGE_INTENT,
  MESSAGE_PRIORITY,
  QUESTION_SEVERITY,
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
  TheatreLayoutItem,
  SearchResult,
  SearchResultGroup,
} from './type/ipc'

// Types — Orchestrator
export type {
  SubTask,
  SubTaskStatus,
  TheatreLayout,
  AgentPersonalityConfig,
} from './type/orchestrator'

export { SUB_TASK_STATUS } from './type/orchestrator'

// Types — Intelligence (Page Scraper, Research Memory, Smart Navigation, Visual Performance)
export type {
  PageType,
  PageMetadata,
  PageSection,
  PageContentItem,
  ScrollState,
  ActiveStates,
  ScrapedElement,
  ScrapedPage,
  ObstacleType,
  PageObstacle,
  SourceCredibility,
  ResearchFinding,
  ResearchDataItem,
  VisitedPage,
  ResearchMemoryState,
  SmartAction,
  WaitSignal,
  WaitResult,
  CursorIntent,
  CursorMove,
  TypingConfig,
  GlowConfig,
  HighlightConfig,
  VisualAction,
  SmartDecisionResult,
} from './type/intelligence'

export {
  PAGE_TYPE,
  OBSTACLE_TYPE,
  SOURCE_CREDIBILITY,
  WAIT_SIGNAL,
  CURSOR_INTENT,
} from './type/intelligence'

// Constants
export type { AgentProfile } from './constant/agents'
export { AGENT_PROFILES, USER_PROFILE } from './constant/agents'
export { ACTION_TIMING, BRAIN_TIMING, STREAM_TIMING, WEBSOCKET_TIMING, COST_DEFAULTS } from './constant/timing'
