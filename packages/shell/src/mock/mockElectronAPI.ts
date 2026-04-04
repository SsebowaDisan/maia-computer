import {
  MESSAGE_INTENT,
  PLAN_STEP_STATUS,
  type ChatMessage,
  type IPCCommands,
  type IPCEvents,
  type IPCResults,
  type InstalledApp,
  type SearchResultGroup,
  type Space,
} from '@maia/shared'

import type { ElectronAPI } from '../electron'

type EventListener<TKey extends keyof IPCEvents> = (
  event: unknown,
  payload: IPCEvents[TKey],
) => void

type AnyEventListener = (event: unknown, payload: IPCEvents[keyof IPCEvents]) => void

const installedApps: InstalledApp[] = [
  {
    id: 'gmail',
    manifestId: 'google.gmail',
    name: 'Gmail',
    icon: '📧',
    url: 'https://mail.google.com',
    spaceId: 'work',
    installedAt: Date.now() - 86400000,
    lastOpenedAt: Date.now() - 3600000,
  },
  {
    id: 'slack',
    manifestId: 'slack',
    name: 'Slack',
    icon: '💬',
    url: 'https://app.slack.com',
    spaceId: 'work',
    installedAt: Date.now() - 86400000 * 2,
    lastOpenedAt: Date.now() - 2400000,
  },
  {
    id: 'sheets',
    manifestId: 'google.sheets',
    name: 'Sheets',
    icon: '📊',
    url: 'https://docs.google.com/spreadsheets',
    spaceId: 'work',
    installedAt: Date.now() - 86400000 * 3,
    lastOpenedAt: Date.now() - 7200000,
  },
  {
    id: 'notion',
    manifestId: 'notion',
    name: 'Notion',
    icon: '📝',
    url: 'https://notion.so',
    spaceId: 'work',
    installedAt: Date.now() - 86400000 * 4,
    lastOpenedAt: Date.now() - 1800000,
  },
  {
    id: 'calendar',
    manifestId: 'google.calendar',
    name: 'Calendar',
    icon: '📅',
    url: 'https://calendar.google.com',
    spaceId: 'work',
    installedAt: Date.now() - 86400000 * 5,
    lastOpenedAt: Date.now() - 3200000,
  },
  {
    id: 'whatsapp',
    manifestId: 'whatsapp',
    name: 'WhatsApp',
    icon: '🟢',
    url: 'https://web.whatsapp.com',
    spaceId: 'personal',
    installedAt: Date.now() - 86400000 * 6,
    lastOpenedAt: Date.now() - 1200000,
  },
]

const spaces: Space[] = [
  { id: 'work', name: 'Work', aiContext: 'Company tools and comms', appIds: ['gmail', 'slack', 'sheets', 'notion', 'calendar'] },
  { id: 'personal', name: 'Personal', aiContext: 'Personal messages and life admin', appIds: ['whatsapp'] },
  { id: 'side-project', name: 'Side Project', aiContext: 'Product design and planning', appIds: [] },
]

const messages: ChatMessage[] = [
  {
    id: 'message-1',
    sender: 'research',
    receiver: 'user',
    intent: MESSAGE_INTENT.UPDATE,
    message: 'Gmail, Slack, and Calendar are active in Work space.',
    context: { taskId: 'boot-sequence', step: 'status' },
    timestamp: Date.now() - 180000,
  },
  {
    id: 'message-2',
    sender: 'analyst',
    receiver: 'user',
    intent: MESSAGE_INTENT.ANSWER,
    message: 'Spotlight index is warm. Search should return instantly.',
    context: { taskId: 'boot-sequence', step: 'status' },
    timestamp: Date.now() - 120000,
  },
]

const appBadges = new Map<string, number>([
  ['gmail', 3],
  ['slack', 5],
  ['calendar', 1],
  ['whatsapp', 7],
])

const listeners = new Map<keyof IPCEvents, Set<AnyEventListener>>()

let activeSpaceId = 'work'
let settings: Record<string, unknown> = {
  autoHideDock: true,
  accentColor: 'blue',
  commandBarVisible: true,
}
let brainStatus = {
  running: false,
  step: 0,
  taskDescription: '',
}

function emit<TKey extends keyof IPCEvents>(channel: TKey, payload: IPCEvents[TKey]): void {
  listeners.get(channel)?.forEach((listener) => {
    listener({}, payload)
  })
}

function buildSearchResults(query: string): SearchResultGroup[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return []
  }

  return installedApps
    .filter((app) => app.name.toLowerCase().includes(normalizedQuery))
    .map((app) => ({
      appId: app.id,
      appName: app.name,
      appIcon: app.icon,
      results: [
        {
          title: `Open ${app.name}`,
          subtitle: `Launch ${app.name} in ${activeSpaceId}`,
          appId: app.id,
          appName: app.name,
          appIcon: app.icon,
        },
      ],
    }))
}

function createMessage(sender: string, message: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    sender,
    receiver: 'user',
    intent: MESSAGE_INTENT.UPDATE,
    message,
    context: { taskId: brainStatus.taskDescription || 'team-chat', step: 'reply' },
    timestamp: Date.now(),
  }
}

export const mockElectronAPI: ElectronAPI = {
  async invoke<TKey extends keyof IPCCommands>(
    channel: TKey,
    payload: IPCCommands[TKey],
  ): Promise<IPCResults[TKey]> {
    switch (channel) {
      case 'app:list':
        return {
          apps: installedApps.filter((app) => app.spaceId === activeSpaceId),
        } as IPCResults[TKey]
      case 'app:install': {
        const request = payload as IPCCommands['app:install']
        const appId = request.name.toLowerCase().replace(/\s+/g, '-')
        installedApps.push({
          id: appId,
          manifestId: request.manifestId ?? appId,
          name: request.name,
          icon: request.icon,
          url: request.url,
          spaceId: activeSpaceId,
          installedAt: Date.now(),
          lastOpenedAt: Date.now(),
        })
        emit('app:installed', { appId, name: request.name, icon: request.icon })
        return { appId } as IPCResults[TKey]
      }
      case 'app:uninstall':
        return { success: true } as IPCResults[TKey]
      case 'app:open':
        emit('app:opened', { appId: (payload as IPCCommands['app:open']).appId })
        return { success: true } as IPCResults[TKey]
      case 'app:close':
        emit('app:closed', { appId: (payload as IPCCommands['app:close']).appId })
        return { success: true } as IPCResults[TKey]
      case 'app:setBounds':
        return { success: true } as IPCResults[TKey]
      case 'brain:execute':
        {
          const request = payload as IPCCommands['brain:execute']
          emit('brain:thinking', { thought: `Reading ${request.appId} and planning next step.` })
        emit('brain:action', {
          action: { type: 'command.execute', target: request.appId, value: request.command },
          appId: request.appId,
        })
        window.setTimeout(() => {
          emit('brain:taskCompleted', { summary: `Executed command in ${request.appId}.` })
        }, 600)
        return { success: true } as IPCResults[TKey]
        }
      case 'brain:startTask': {
        const request = payload as IPCCommands['brain:startTask']
        const taskId = crypto.randomUUID()
        brainStatus = { running: true, step: 1, taskDescription: request.description }
        emit('brain:planCreated', {
          steps: [
            {
              step: 1,
              description: 'Read app context',
              status: PLAN_STEP_STATUS.IN_PROGRESS,
              contract: { output: 'Current app state' },
            },
            {
              step: 2,
              description: 'Execute requested action',
              status: PLAN_STEP_STATUS.PENDING,
              contract: { input: 'Current app state', output: 'Completed result' },
            },
          ],
        })
        return { taskId } as IPCResults[TKey]
      }
      case 'brain:stop':
        brainStatus = { running: false, step: 0, taskDescription: '' }
        return { success: true } as IPCResults[TKey]
      case 'brain:getStatus':
        return brainStatus as IPCResults[TKey]
      case 'chat:getHistory':
        return { messages } as IPCResults[TKey]
      case 'chat:send': {
        const request = payload as IPCCommands['chat:send']
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'user',
          receiver: 'team',
          intent: MESSAGE_INTENT.INSTRUCTION,
          message: request.message,
          context: { taskId: brainStatus.taskDescription || 'team-chat' },
          timestamp: Date.now(),
        }
        messages.push(userMessage)
        emit('chat:message', { message: userMessage })
        window.setTimeout(() => {
          const reply = createMessage('research', 'Plan captured. I am checking the fastest path.')
          messages.push(reply)
          emit('chat:message', { message: reply })
        }, 400)
        return { success: true } as IPCResults[TKey]
      }
      case 'spotlight:search':
        return {
          results: buildSearchResults((payload as IPCCommands['spotlight:search']).query),
        } as IPCResults[TKey]
      case 'spaces:list':
        return { spaces } as IPCResults[TKey]
      case 'spaces:create': {
        const request = payload as IPCCommands['spaces:create']
        const spaceId = request.name.toLowerCase().replace(/\s+/g, '-')
        spaces.push({
          id: spaceId,
          name: request.name,
          aiContext: request.aiContext ?? '',
          appIds: [],
        })
        return { spaceId } as IPCResults[TKey]
      }
      case 'spaces:switch':
        activeSpaceId = (payload as IPCCommands['spaces:switch']).spaceId
        return { success: true } as IPCResults[TKey]
      case 'spaces:delete':
        return { success: true } as IPCResults[TKey]
      case 'settings:get':
        return { settings } as IPCResults[TKey]
      case 'settings:update':
        {
          const request = payload as IPCCommands['settings:update']
          settings = {
            ...settings,
            [request.key]: request.value,
          }
          return { success: true } as IPCResults[TKey]
        }
      default:
        throw new Error(`Unhandled IPC channel: ${String(channel)}`)
    }
  },
  on<TKey extends keyof IPCEvents>(
    channel: TKey,
    listener: (event: unknown, payload: IPCEvents[TKey]) => void,
  ): () => void {
    const currentListeners = listeners.get(channel) ?? new Set<AnyEventListener>()
    currentListeners.add(listener as unknown as AnyEventListener)
    listeners.set(channel, currentListeners)

    if (channel === 'app:notification') {
      appBadges.forEach((count, appId) => {
        listener({}, { appId, count } as IPCEvents[TKey])
      })
    }

    return () => {
      currentListeners.delete(listener as unknown as AnyEventListener)
    }
  },
}
