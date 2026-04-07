import {
  AGENT_PROFILES,
  AGENT_ROLE,
  MESSAGE_INTENT,
  SUB_TASK_STATUS,
  type AppManifest,
  type ChatMessage,
  type InstalledApp,
  type SubTask,
} from '@maia/shared'
import { pino } from 'pino'
import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import { createAppAgent } from '../agent/AgentFactory'
import { ResearchLead } from '../agent/ResearchLead'
import type { AppAgent } from '../agent/AppAgent'
import type { WorkspaceRegistry } from '../app/WorkspaceRegistry'
import type { EventBus } from '../events/EventBus'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import type { MessageBus } from '../communication/MessageBus'
import { classifyIntentWithLLM } from '../communication/IntentClassifier'
import { buildPersonalityPrompt, buildResponsePrompt } from './AgentPersonality'
import { matchAgentsToTask } from './AgentCapabilities'

const logger = pino({ name: 'orchestrator' })

/**
 * Orchestrator — decomposes tasks, assigns App Agents, coordinates execution.
 *
 * For research tasks: delegates to ResearchLead (specialist agent coordinator).
 * For app-specific tasks: creates the right AppAgent via AgentFactory.
 * One agent per app at a time — no parallel conflicts.
 */
export class Orchestrator {
  private readonly intelligence: IntelligenceRouter
  private readonly eventBus: EventBus
  private readonly llm: ProviderRegistry
  private readonly messageBus: MessageBus
  private readonly installedApps: () => InstalledApp[]
  private readonly appManifests: AppManifest[]
  private readonly workspaces: WorkspaceRegistry
  private agents = new Map<string, AppAgent>()
  private subTasks: SubTask[] = []
  private taskId = ''
  private taskDescription = ''
  private running = false
  private clarificationAsked = false
  private waitingForClarification = false

  constructor(
    intelligence: IntelligenceRouter,
    eventBus: EventBus,
    llm: ProviderRegistry,
    messageBus: MessageBus,
    installedApps: () => InstalledApp[],
    appManifests: AppManifest[] = [],
    workspaces?: WorkspaceRegistry,
  ) {
    this.intelligence = intelligence
    this.eventBus = eventBus
    this.llm = llm
    this.messageBus = messageBus
    this.installedApps = installedApps
    this.appManifests = appManifests
    this.workspaces = workspaces ?? { isReady: () => false, waitForReady: async () => undefined, get: () => undefined, getAll: () => [], getReady: () => [], register: () => {}, markReady: () => {}, remove: () => {}, updateWebContentsId: () => {} } as unknown as WorkspaceRegistry
  }

  async start(description: string): Promise<string> {
    this.taskId = `task_${Date.now()}`
    this.taskDescription = description
    this.running = true

    const recentChat = this.messageBus.getHistory().getRecent(5)
      .map((m) => `${m.sender}: ${m.message}`)

    const apps = this.installedApps()
    const subTasks = await this.smartDecompose(description, apps, recentChat)

    if (subTasks.length === 0 || !this.running) return 'Task was stopped'
    this.subTasks = subTasks

    // Check if this is a research task — use ResearchLead
    const hasResearch = subTasks.some((st) => st.agentId === 'research')
    const browserApp = this.findBrowserApp(apps)

    if (hasResearch && browserApp) {
      return this.runWithResearchLead(description, subTasks, browserApp.id)
    }

    // Non-research: run agents directly
    if (subTasks.length === 1) {
      return this.runSingleAgent(subTasks[0]!)
    }
    return this.runMultiAgent(subTasks)
  }

  handleUserMessage(message: ChatMessage): void {
    if (!this.running || this.waitingForClarification) return
    void this.routeUserMessage(message)
  }

  stop(): void {
    this.running = false
    for (const agent of this.agents.values()) agent.stop()
    this.agents.clear()
  }

  getActiveAgentIds(): string[] { return Array.from(this.agents.keys()) }
  isRunning(): boolean { return this.running }

  // ── RESEARCH LEAD FLOW ────────────────────────────────────────

  private async runWithResearchLead(description: string, subTasks: SubTask[], browserAppId: string): Promise<string> {
    this.emitTheatreArrange(browserAppId)

    const cleanDesc = description.replace(/\. DO NOT ask.*$/i, '').trim()
    this.postMessage('computer', `${cleanDesc} — research team will work on this`)

    // ResearchLead coordinates the research
    const lead = new ResearchLead({
      intelligence: this.intelligence,
      llm: this.llm,
      eventBus: this.eventBus,
      messageBus: this.messageBus,
      workspaces: this.workspaces,
      installedApps: this.installedApps,
      appManifests: this.appManifests,
      taskId: this.taskId,
    })

    const researchResult = await lead.lead(description, browserAppId)

    // If there are non-research sub-tasks (e.g., write report in Docs), run them next
    const nonResearchTasks = subTasks.filter((st) => st.agentId !== 'research')
    for (const st of nonResearchTasks) {
      if (!this.running) break
      this.emitTheatreArrange(st.appId)

      const agent = await this.createAgent(st)
      const result = await agent.execute({
        description: st.description,
        context: description,
        researchFindings: researchResult.content ?? researchResult.findings,
      })

      st.status = SUB_TASK_STATUS.COMPLETED
      st.result = result.content ?? 'done'
    }

    this.running = false
    return researchResult.content ?? 'research complete'
  }

  // ── SINGLE AGENT FLOW ─────────────────────────────────────────

  private async runSingleAgent(subTask: SubTask): Promise<string> {
    const agent = await this.createAgent(subTask)
    this.emitTheatreArrange(subTask.appId)

    const cleanDesc = this.taskDescription.replace(/\. DO NOT ask.*$/i, '').trim()
    this.postMessage('computer', `user wants to ${cleanDesc}`)

    this.eventBus.publish({
      type: 'orchestrator.agent_started',
      agentId: subTask.agentId, appId: subTask.appId,
      description: subTask.description, timestamp: Date.now(),
    })

    const result = await agent.execute({
      description: subTask.description,
      context: this.taskDescription,
    })

    this.agents.delete(subTask.agentId)
    this.running = false
    return result.content ?? result.findings ?? 'done'
  }

  // ── MULTI AGENT FLOW ──────────────────────────────────────────

  private async runMultiAgent(subTasks: SubTask[]): Promise<string> {
    this.emitTheatreArrangeFirst(subTasks)

    const cleanDesc = this.taskDescription.replace(/\. DO NOT ask.*$/i, '').trim()
    const agentNames = [...new Set(subTasks.map((st) => st.agentId))].join(' and ')
    this.postMessage('computer', `${cleanDesc} — ${agentNames} will work on this`)
    await this.sleep(400)

    // One agent per app — sequential on same app
    const runningApps = new Set<string>()

    const startReady = () => {
      for (const st of subTasks) {
        if (st.status !== SUB_TASK_STATUS.PENDING) continue
        if (runningApps.has(st.appId)) continue

        const depsComplete = st.dependsOn.every((depId) => {
          const dep = subTasks.find((d) => d.id === depId)
          return dep?.status === SUB_TASK_STATUS.COMPLETED
        })
        const depsFailed = st.dependsOn.some((depId) => {
          const dep = subTasks.find((d) => d.id === depId)
          return dep?.status === SUB_TASK_STATUS.FAILED
        })

        if (depsFailed) {
          st.status = SUB_TASK_STATUS.FAILED
          st.result = 'dependency failed'
          continue
        }

        if (depsComplete) {
          st.status = SUB_TASK_STATUS.RUNNING
          runningApps.add(st.appId)
          void this.runAgent(st, subTasks).finally(() => runningApps.delete(st.appId))
        }
      }
    }

    startReady()

    while (this.running && subTasks.some((st) =>
      st.status !== SUB_TASK_STATUS.COMPLETED &&
      st.status !== SUB_TASK_STATUS.FAILED &&
      st.status !== SUB_TASK_STATUS.USER_HANDLED,
    )) {
      await this.sleep(500)
      startReady()
    }

    this.running = false
    return subTasks.map((st) => `${st.agentId}: ${st.result ?? st.status}`).join('. ')
  }

  private async runAgent(subTask: SubTask, allSubTasks: SubTask[]): Promise<void> {
    const agent = await this.createAgent(subTask)
    this.emitTheatreArrange(subTask.appId)

    this.eventBus.publish({
      type: 'orchestrator.agent_started',
      agentId: subTask.agentId, appId: subTask.appId,
      description: subTask.description, timestamp: Date.now(),
    })

    const depContext = allSubTasks
      .filter((st) => subTask.dependsOn.includes(st.id) && st.result)
      .map((st) => st.result).join('\n\n')

    try {
      const result = await agent.execute({
        description: subTask.description,
        context: this.taskDescription,
        researchFindings: depContext || undefined,
      })
      subTask.status = SUB_TASK_STATUS.COMPLETED
      subTask.result = result.content ?? result.findings ?? 'done'
    } catch {
      subTask.status = SUB_TASK_STATUS.FAILED
      subTask.result = 'agent failed'
    } finally {
      this.agents.delete(subTask.agentId)
    }
  }

  // ── AGENT CREATION ────────────────────────────────────────────

  private async createAgent(subTask: SubTask): Promise<AppAgent> {
    const app = this.installedApps().find((a) => a.id === subTask.appId)

    if (!this.workspaces.isReady(subTask.appId)) {
      this.emitTheatreArrange(subTask.appId)
      await this.workspaces.waitForReady(subTask.appId, 20_000)
    }

    // Find the manifest for this app
    const manifest = app ? this.appManifests.find((m) => m.id === app.manifestId) : undefined

    const agent = createAppAgent(app?.url ?? '', {
      intelligence: this.intelligence,
      llm: this.llm,
      eventBus: this.eventBus,
      appId: subTask.appId,
      taskId: this.taskId,
      agentId: subTask.agentId,
      messageBus: this.messageBus,
      manifest,
    })

    this.agents.set(subTask.agentId, agent)
    return agent
  }

  // ── TASK DECOMPOSITION ────────────────────────────────────────

  private async smartDecompose(description: string, apps: InstalledApp[], recentChat: string[] = []): Promise<SubTask[]> {
    const browserApp = this.findBrowserApp(apps)
    const appList = apps.map((a) => {
      const label = a === browserApp ? ' ← USE THIS FOR WEB SEARCHES' : ''
      return `"${a.name}" (${a.url})${label}`
    }).join('\n')
    const agentList = Object.values(AGENT_PROFILES)
      .map((a) => `${a.id}: ${a.role} — domains: ${a.capability.domains.join(', ')}`)
      .join('\n')
    const chatContext = recentChat.length > 0
      ? `\nrecent team chat:\n${recentChat.join('\n')}` : ''

    const response = await this.llm.sendMessage([
      {
        role: 'system',
        content: `you are maia's task planner. break the user's request into sub-tasks.

installed apps (use these NAMES in appId):\n${appList}\navailable agents:\n${agentList}

RULES:
1. each agent controls ONE app. multi-app tasks need SEPARATE sub-tasks with dependencies.
2. for web research, use "${browserApp?.name ?? 'Web Browser'}" as appId and "research" as agentId.
3. for writing documents, use the docs app. for sending emails, use gmail.
4. ONLY ask for clarification if truly impossible to act on.

respond with JSON array: [{"id":"st_1","description":"what to do","agentId":"agent","appId":"app name","dependsOn":[]}]
json only.`,
      },
      { role: 'user', content: `${description}${chatContext}` },
    ], { maxTokens: 1024, temperature: 0.3 })

    return this.parseSubTasks(response.content)
  }

  // ── USER MESSAGE ROUTING ──────────────────────────────────────

  private async routeUserMessage(message: ChatMessage): Promise<void> {
    const intent = await classifyIntentWithLLM(message.message, this.llm)

    switch (intent) {
      case MESSAGE_INTENT.REDIRECT:
        this.stop()
        void this.start(message.message)
        break
      case MESSAGE_INTENT.TAKEOVER:
        for (const [agentId, agent] of this.agents) {
          agent.stop()
          this.postMessage(agentId, 'all yours!')
          break
        }
        break
      case MESSAGE_INTENT.INSTRUCTION: {
        if (/\b(stop|cancel|abort)\b/i.test(message.message)) {
          this.stop()
          break
        }
        const instrId = this.findRelevantAgentId(message.message) ?? Array.from(this.agents.keys())[0]
        if (instrId) void this.generateAgentResponse(instrId, message.message)
        break
      }
      default: {
        const anyId = this.findRelevantAgentId(message.message) ?? Array.from(this.agents.keys())[0]
        if (anyId) void this.generateAgentResponse(anyId, message.message)
        break
      }
    }
  }

  private async generateAgentResponse(agentId: string, userMessage: string): Promise<void> {
    const chatContext = this.messageBus.getHistory().getRecent(8)
      .map((m) => `${m.sender}: ${m.message}`)
    const personality = buildPersonalityPrompt(agentId)
    const prompt = buildResponsePrompt(agentId, chatContext, userMessage)

    try {
      const response = await this.llm.sendMessage(
        [{ role: 'system', content: personality }, { role: 'user', content: prompt }],
        { model: 'gpt-4o-mini', maxTokens: 256, temperature: 0.5 },
      )
      this.postMessage(agentId, response.content.trim())
    } catch {
      this.postMessage(agentId, 'sorry, had trouble thinking about that')
    }
  }

  // ── HELPERS ───────────────────────────────────────────────────

  private postMessage(sender: string, message: string): void {
    this.messageBus.send({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender, receiver: 'all', intent: MESSAGE_INTENT.UPDATE,
      message, context: { taskId: this.taskId }, timestamp: Date.now(),
    })
  }

  private findRelevantAgentId(message: string): string | undefined {
    const lower = message.toLowerCase()
    let best: { id: string; score: number } | undefined
    for (const [agentId] of this.agents) {
      const profile = AGENT_PROFILES[agentId]
      if (!profile) continue
      let score = 0
      for (const d of profile.capability.domains) { if (lower.includes(d)) score += 2 }
      for (const v of profile.capability.verbs) { if (lower.includes(v)) score += 1 }
      if (!best || score > best.score) best = { id: agentId, score }
    }
    return best?.score ? best.id : Array.from(this.agents.keys())[0]
  }

  private findBrowserApp(apps: InstalledApp[]): InstalledApp | undefined {
    return apps.find((a) =>
      a.url?.includes('google.com/webhp') || a.url?.includes('google.com/search')
      || a.name?.toLowerCase().includes('chrome') || a.name?.toLowerCase().includes('browser')
      || a.url === 'https://www.google.com',
    )
  }

  private emitTheatreArrange(appId: string): void {
    this.eventBus.publish({
      type: 'orchestrator.theatre_arrange',
      layout: [{ appId, snapZone: 'left' }, { windowId: 'team-chat', snapZone: 'right' }],
      focusAppId: appId, timestamp: Date.now(),
    })
  }

  private emitTheatreArrangeFirst(subTasks: SubTask[]): void {
    const first = subTasks.find((st) => st.status === SUB_TASK_STATUS.PENDING)
    if (first) this.emitTheatreArrange(first.appId)
  }

  private parseSubTasks(content: string): SubTask[] {
    const apps = this.installedApps()
    const fallbackAppId = this.findBrowserApp(apps)?.id ?? apps[0]?.id ?? 'chrome'

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return [{ id: 'st_1', description: this.taskDescription, agentId: 'research',
        appId: fallbackAppId, dependsOn: [], status: SUB_TASK_STATUS.PENDING, role: AGENT_ROLE.PRIMARY }]
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        id: string; description: string; agentId: string; appId: string; dependsOn: string[]
      }>
      const validAgentIds = new Set(Object.keys(AGENT_PROFILES))
      return parsed.map((raw) => ({
        ...raw,
        agentId: validAgentIds.has(raw.agentId) ? raw.agentId : 'research',
        appId: this.resolveAppId(raw.appId, apps) ?? fallbackAppId,
        status: SUB_TASK_STATUS.PENDING,
        role: AGENT_ROLE.PRIMARY,
      }))
    } catch {
      return [{ id: 'st_1', description: this.taskDescription, agentId: 'research',
        appId: fallbackAppId, dependsOn: [], status: SUB_TASK_STATUS.PENDING, role: AGENT_ROLE.PRIMARY }]
    }
  }

  private resolveAppId(appNameOrId: string, apps: InstalledApp[]): string | undefined {
    const direct = apps.find((a) => a.id === appNameOrId)
    if (direct) return direct.id
    const nameMatch = apps.find((a) => a.name.toLowerCase() === appNameOrId.toLowerCase())
    if (nameMatch) return nameMatch.id
    const partial = apps.find((a) =>
      a.name.toLowerCase().includes(appNameOrId.toLowerCase())
      || appNameOrId.toLowerCase().includes(a.name.toLowerCase()),
    )
    if (partial) return partial.id
    // Aliases
    const aliases: Record<string, string[]> = {
      chrome: ['browser', 'web browser', 'google', 'search'],
      'google docs': ['docs', 'document'],
      'google sheets': ['sheets', 'spreadsheet'],
      gmail: ['email', 'mail'],
    }
    const lower = appNameOrId.toLowerCase()
    for (const [canonical, alts] of Object.entries(aliases)) {
      if (alts.includes(lower) || canonical === lower) {
        return apps.find((a) => alts.some((alt) => a.name.toLowerCase().includes(alt)) || a.name.toLowerCase().includes(canonical))?.id
      }
    }
    return undefined
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
