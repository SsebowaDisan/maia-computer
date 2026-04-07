import type { AppManifest, InstalledApp, AppBounds, AppBadge, SnapZone, Space } from './apps'
import type { ChatMessage } from './messages'
import type { PlanStep } from './events'
import type { SharedTaskState } from './orchestrator'

export interface TheatreLayoutItem {
  appId?: string
  windowId?: string
  snapZone: SnapZone
}

export interface SharedStateEventPayload {
  type: string
  state: SharedTaskState
  timestamp: number
}

// ── Frontend → Backend (commands) ──────────────────────────────

export interface IPCCommands {
  'app:install': { url: string; name: string; icon: string; manifestId?: string }
  'app:open': { appId: string }
  'app:close': { appId: string }
  'app:uninstall': { appId: string }
  'app:list': Record<string, never>
  'app:setBounds': { appId: string; bounds: AppBounds }
  'brain:execute': { appId: string; command: string }
  'brain:startTask': { description: string }
  'brain:stop': Record<string, never>
  'brain:getStatus': Record<string, never>
  'chat:send': { message: string; replyToId?: string }
  'chat:getHistory': Record<string, never>
  'spotlight:search': { query: string }
  'spaces:list': Record<string, never>
  'spaces:create': { name: string; aiContext?: string }
  'spaces:switch': { spaceId: string }
  'spaces:delete': { spaceId: string }
  'settings:get': Record<string, never>
  'settings:update': { key: string; value: unknown }
  'appstore:getManifests': Record<string, never>
}

// ── Frontend → Backend (return types) ──────────────────────────

export interface IPCResults {
  'app:install': { appId: string }
  'app:open': { success: boolean }
  'app:close': { success: boolean }
  'app:uninstall': { success: boolean }
  'app:list': { apps: InstalledApp[] }
  'app:setBounds': { success: boolean }
  'brain:execute': { success: boolean }
  'brain:startTask': { taskId: string }
  'brain:stop': { success: boolean }
  'brain:getStatus': { running: boolean; step?: number; taskDescription?: string }
  'chat:send': { success: boolean }
  'chat:getHistory': { messages: ChatMessage[] }
  'spotlight:search': { results: SearchResultGroup[] }
  'spaces:list': { spaces: Space[] }
  'spaces:create': { spaceId: string }
  'spaces:switch': { success: boolean }
  'spaces:delete': { success: boolean }
  'settings:get': { settings: Record<string, unknown> }
  'settings:update': { success: boolean }
  'appstore:getManifests': AppManifest[]
}

// ── Backend → Frontend (events) ────────────────────────────────

export interface IPCEvents {
  'app:installed': { appId: string; name: string; icon: string }
  'app:notification': AppBadge
  'app:opened': { appId: string }
  'app:closed': { appId: string }
  'brain:thinking': { thought: string }
  'brain:action': { action: unknown; appId: string }
  'brain:planCreated': { steps: PlanStep[] }
  'brain:planUpdated': { stepIndex: number; status: string }
  'brain:taskCompleted': { summary: string }
  'brain:error': { message: string }
  'brain:agentStarted': { agentId: string; appId: string; description: string }
  'brain:agentCompleted': { agentId: string; summary: string }
  'chat:message': { message: ChatMessage }
  'cost:update': { totalCost: number; budget: number }
  'theatre:arrange': { layout: TheatreLayoutItem[]; focusAppId?: string }
  'theatre:focus': { appId: string }
  'orchestrator.shared_state.agent_registered': SharedStateEventPayload
  'orchestrator.shared_state.agent_status_changed': SharedStateEventPayload
  'orchestrator.shared_state.finding_added': SharedStateEventPayload
  'orchestrator.shared_state.decision_made': SharedStateEventPayload
  'orchestrator.shared_state.task_status_changed': SharedStateEventPayload
}

// ── Search ─────────────────────────────────────────────────────

export interface SearchResult {
  title: string
  subtitle: string
  appId: string
  appName: string
  appIcon: string
}

export interface SearchResultGroup {
  appId: string
  appName: string
  appIcon: string
  results: SearchResult[]
}
