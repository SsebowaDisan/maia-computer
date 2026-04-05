import {
  AGENT_PROFILES,
  MESSAGE_INTENT,
  SUB_TASK_STATUS,
  type ChatMessage,
  type InstalledApp,
  type SubTask,
} from '@maia/shared'
import { pino } from 'pino'
import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import type { EventBus } from '../events/EventBus'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import type { MessageBus } from '../communication/MessageBus'
import { classifyIntentWithLLM } from '../communication/IntentClassifier'
import { buildDiscussionPrompt, buildResponsePrompt, buildPersonalityPrompt } from './AgentPersonality'
import { Brain } from './Brain'

const logger = pino({ name: 'orchestrator' })
const MAX_AGENTS = 3
const DISCUSSION_WINDOW_MS = 10_000

export class Orchestrator {
  private readonly intelligence: IntelligenceRouter
  private readonly eventBus: EventBus
  private readonly llm: ProviderRegistry
  private readonly messageBus: MessageBus
  private readonly installedApps: () => InstalledApp[]
  private agents = new Map<string, Brain>()
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
  ) {
    this.intelligence = intelligence
    this.eventBus = eventBus
    this.llm = llm
    this.messageBus = messageBus
    this.installedApps = installedApps

    this.eventBus.subscribePattern('orchestrator.*', (event) => {
      if (event.type === 'orchestrator.discussion_started') {
        const e = event as { agentId: string; question: string }
        void this.triggerDiscussion(e.agentId, e.question)
      }
    })
  }

  async start(description: string): Promise<string> {
    this.taskId = `task_${Date.now()}`
    this.taskDescription = description
    this.running = true

    // Get recent chat for context (helps resolve "which book" after "I was looking at books")
    const recentChat = this.messageBus.getHistory().getRecent(5)
      .map((m) => `${m.sender}: ${m.message}`)

    const apps = this.installedApps()
    const subTasks = await this.smartDecompose(description, apps, recentChat)

    if (subTasks.length === 0 || !this.running) return 'Task was stopped'

    this.subTasks = subTasks

    if (subTasks.length === 1) {
      return this.runSingleAgent(subTasks[0]!)
    }

    return this.runMultiAgent(subTasks)
  }

  handleUserMessage(message: ChatMessage): void {
    if (!this.running) return
    // Don't route messages while waiting for clarification — the polling loop handles it
    if (this.waitingForClarification) return

    void this.routeUserMessage(message)
  }

  stop(): void {
    this.running = false
    for (const agent of this.agents.values()) {
      agent.stop()
    }
    this.agents.clear()
  }

  getActiveAgentIds(): string[] {
    return Array.from(this.agents.keys())
  }

  isRunning(): boolean {
    return this.running
  }

  /**
   * Smart decompose: tries to plan, asks ONE clarification if needed, then forces proceed.
   * Fully async — start() awaits the entire flow including user reply.
   */
  private async smartDecompose(
    description: string,
    apps: InstalledApp[],
    recentChat: string[] = [],
  ): Promise<SubTask[]> {
    const appList = apps.map((a) => `${a.id}: ${a.name} (${a.url})`).join('\n')
    const agentList = Object.values(AGENT_PROFILES).map((a) => `${a.id}: ${a.role} — expertise: ${a.expertise.join(', ')}`).join('\n')
    const chatContext = recentChat.length > 0
      ? `\nrecent team chat (may provide context):\n${recentChat.join('\n')}`
      : ''

    // First attempt — may return sub-tasks or clarification
    const response = await this.llm.sendMessage([
      {
        role: 'system',
        content: `you are maia's task planner. decide if you can act on this or need to ask one question.

available apps:\n${appList}\navailable agents:\n${agentList}

ONLY ask for clarification if the request is truly impossible to act on. if you can google it and get a reasonable answer, just proceed.

proceed (search it):
- "weather in kampala" → search "weather kampala"
- "who is the cto" → search "current CTO" (might get multiple results, that's fine)
- "married serena gomez" → search "who is serena gomez married to"
- "which country has the most beautiful women" → search it
- "who is the richest" → search "richest person in the world"
- "who is the president" → search "current president" (will get results)
- "check the news" → open news site

ask (genuinely can't act):
- "send it" → send WHAT to WHO?
- "book a flight" → where to? when?
- "email john" → which john? say what?
- "delete the file" → which file?

when in doubt, just search it. asking too many questions is worse than searching something slightly wrong.

if you must ask, respond: {"needsClarification": true, "question": "casual 5-word question"}
otherwise respond: [{"id":"st_1","description":"search for X","agentId":"research","appId":"...","dependsOn":[]}]

json only.`,
      },
      { role: 'user', content: `${description}${chatContext}` },
    ], { maxTokens: 1024, temperature: 0.4 })

    // Check if clarification needed
    const clarifyMatch = response.content.match(/\{[^[\]]*"needsClarification"\s*:\s*true[^[\]]*\}/)
    if (clarifyMatch && !this.clarificationAsked) {
      try {
        const parsed = JSON.parse(clarifyMatch[0]) as { question: string; agentId?: string }
        this.clarificationAsked = true
        this.waitingForClarification = true
        const agentId = parsed.agentId ?? 'research'
        const questionAsked = parsed.question

        this.postAgentResponse(agentId, questionAsked)

        // Wait for user reply (up to 45s)
        const startTime = Date.now()
        while (Date.now() - startTime < 45_000 && this.running) {
          const recent = this.messageBus.getHistory().getRecent(3)
          const userReply = recent.find((m) => m.sender === 'user' && m.timestamp > startTime)

          if (userReply) {
            this.waitingForClarification = false
            const answer = userReply.message.trim()
            const isConfirmation = /^(yes|yeah|yep|sure|ok|correct|right|exactly|yea|ya)\.?$/i.test(answer)

            // Build a clear, natural task description from question + answer
            let clarifiedTask: string
            if (isConfirmation) {
              // User confirmed the agent's interpretation — use the question directly
              clarifiedTask = questionAsked.replace(/\?$/, '').replace(/^are you asking /i, '').replace(/^do you mean /i, '').replace(/^do you want /i, '')
            } else {
              // User gave specific info — build a natural description
              clarifiedTask = `${description} ${answer}`
            }

            this.taskDescription = clarifiedTask
            this.postAgentResponse(agentId, `on it — searching for "${clarifiedTask}"`)

            // Build sub-task directly — no more LLM calls, no more questions
            const defaultApp = apps[0]?.id ?? 'chrome'
            return [{
              id: 'st_1',
              description: `search and report: ${clarifiedTask}. DO NOT ask any more questions — the user already clarified. just search, read the results, and share what you find.`,
              agentId,
              appId: defaultApp,
              dependsOn: [],
              status: SUB_TASK_STATUS.PENDING,
            }]
          }
          await this.sleep(500)
        }

        // Timeout
        this.waitingForClarification = false
        this.postAgentResponse(agentId, 'no worries, let me know when you want to try again')
        this.running = false
        return []
      } catch {
        this.waitingForClarification = false
      }
    }

    // Parse as sub-tasks
    return this.parseSubTasks(response.content)
  }

  /** Decompose without allowing clarification — force the LLM to produce sub-tasks. */
  private async forceDecompose(description: string, apps: InstalledApp[]): Promise<SubTask[]> {
    const appList = apps.map((a) => `${a.id}: ${a.name} (${a.url})`).join('\n')
    const agentList = Object.values(AGENT_PROFILES).map((a) => `${a.id}: ${a.role} — expertise: ${a.expertise.join(', ')}`).join('\n')

    const response = await this.llm.sendMessage([
      {
        role: 'system',
        content: `decompose this task into sub-tasks. do NOT ask for clarification — just do your best with the info given.

available apps:\n${appList}\n\navailable agents:\n${agentList}

respond with a json array only:
[{"id": "st_1", "description": "...", "agentId": "research", "appId": "app_...", "dependsOn": []}]`,
      },
      { role: 'user', content: description },
    ], { maxTokens: 1024, temperature: 0.4 })

    const jsonMatch = response.content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return [{
        id: 'st_1',
        description,
        agentId: 'research',
        appId: apps[0]?.id ?? 'chrome',
        dependsOn: [],
        status: SUB_TASK_STATUS.PENDING,
      }]
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        id: string; description: string; agentId: string; appId: string; dependsOn: string[]
      }>
      return parsed.map((raw) => ({ ...raw, status: SUB_TASK_STATUS.PENDING }))
    } catch {
      return [{
        id: 'st_1',
        description,
        agentId: 'research',
        appId: apps[0]?.id ?? 'chrome',
        dependsOn: [],
        status: SUB_TASK_STATUS.PENDING,
      }]
    }
  }

  private async runSingleAgent(subTask: SubTask): Promise<string> {
    const brain = this.createAgent(subTask)
    this.emitTheatreArrange(subTask.appId)

    // Team conversation: computer relays what the user wants, agent acknowledges
    const cleanDesc = this.taskDescription
      .replace(/^search (for |and report: )?/i, '')
      .replace(/\. DO NOT ask.*$/i, '')
      .trim()
    this.postAgentResponse('computer', `user wants to know ${cleanDesc}`)

    await this.sleep(500)

    // Agent acknowledges naturally — use LLM for a real response
    try {
      const ackResponse = await this.llm.sendMessage([
        { role: 'system', content: `you are ${subTask.agentId}, a teammate. the user just asked something and you've been assigned to look it up. write a one-sentence casual acknowledgment (like texting a coworker). examples: "okay — let me look into this and get back to you", "on it, give me a sec", "sure thing, checking now". lowercase, casual, short.` },
        { role: 'user', content: cleanDesc },
      ], { maxTokens: 60, temperature: 0.7 })
      this.postAgentResponse(subTask.agentId, ackResponse.content.trim().replace(/^["']|["']$/g, ''))
    } catch {
      this.postAgentResponse(subTask.agentId, 'okay — let me look into this')
    }

    this.eventBus.publish({
      type: 'orchestrator.agent_started',
      agentId: subTask.agentId,
      appId: subTask.appId,
      description: subTask.description,
      timestamp: Date.now(),
    })

    const summary = await brain.run(subTask.description)
    this.agents.delete(subTask.agentId)
    this.running = false
    return summary
  }

  private async runMultiAgent(subTasks: SubTask[]): Promise<string> {
    // Emit theatre layout with all app windows + chat
    this.emitTheatreArrangeMulti(subTasks)

    // Announce the team split
    const cleanDesc = this.taskDescription.replace(/\. DO NOT ask.*$/i, '').trim()
    const agentNames = [...new Set(subTasks.map((st) => st.agentId))].join(' and ')
    this.postAgentResponse('computer', `user wants to ${cleanDesc} — ${agentNames} will work on this`)
    await this.sleep(400)

    // Start agents whose dependencies are met
    const startReady = () => {
      for (const st of subTasks) {
        if (st.status !== SUB_TASK_STATUS.PENDING) continue
        const depsComplete = st.dependsOn.every((depId) => {
          const dep = subTasks.find((d) => d.id === depId)
          return dep?.status === SUB_TASK_STATUS.COMPLETED
        })
        if (depsComplete) {
          st.status = SUB_TASK_STATUS.RUNNING
          void this.runAgent(st, subTasks)
        }
      }
    }

    startReady()

    // Wait for all sub-tasks to complete
    while (this.running && subTasks.some((st) => st.status !== SUB_TASK_STATUS.COMPLETED && st.status !== SUB_TASK_STATUS.FAILED && st.status !== SUB_TASK_STATUS.USER_HANDLED)) {
      await this.sleep(500)
      startReady()
    }

    this.running = false
    const summaries = subTasks.map((st) => `${st.agentId}: ${st.result ?? st.status}`).join('. ')
    return `Task completed. ${summaries}`
  }

  private async runAgent(subTask: SubTask, allSubTasks: SubTask[]): Promise<void> {
    const brain = this.createAgent(subTask)

    this.eventBus.publish({
      type: 'orchestrator.agent_started',
      agentId: subTask.agentId,
      appId: subTask.appId,
      description: subTask.description,
      timestamp: Date.now(),
    })

    // Focus theatre on this agent's app
    this.eventBus.publish({
      type: 'orchestrator.theatre_focus',
      appId: subTask.appId,
      timestamp: Date.now(),
    })

    // Inject context from completed dependencies
    const depContext = allSubTasks
      .filter((st) => subTask.dependsOn.includes(st.id) && st.result)
      .map((st) => `${st.agentId} completed: ${st.result}`)
      .join('\n')

    const fullDescription = depContext
      ? `${subTask.description}\n\nContext from other agents:\n${depContext}`
      : subTask.description

    try {
      const summary = await brain.run(fullDescription)
      subTask.status = SUB_TASK_STATUS.COMPLETED
      subTask.result = summary

      this.eventBus.publish({
        type: 'orchestrator.agent_completed',
        agentId: subTask.agentId,
        summary,
        timestamp: Date.now(),
      })
    } catch {
      subTask.status = SUB_TASK_STATUS.FAILED
    } finally {
      this.agents.delete(subTask.agentId)
    }
  }

  private createAgent(subTask: SubTask): Brain {
    const brain = new Brain(this.intelligence, this.eventBus, this.llm, {
      taskId: this.taskId,
      appId: subTask.appId,
      agentId: subTask.agentId,
    })

    this.agents.set(subTask.agentId, brain)
    return brain
  }

  private async routeUserMessage(message: ChatMessage): Promise<void> {
    const intent = await classifyIntentWithLLM(message.message, this.llm)

    // Feed to all active agents' chat context
    for (const agent of this.agents.values()) {
      agent.addChatMessage(`User: ${message.message}`)
    }

    switch (intent) {
      case MESSAGE_INTENT.REDIRECT: {
        this.stop()
        void this.start(message.message)
        break
      }
      case MESSAGE_INTENT.TAKEOVER: {
        // Find which agent to pause based on context
        const targetAgent = this.findRelevantAgent(message.message)
        if (targetAgent) {
          targetAgent.pause()
          const st = this.subTasks.find((s) => s.agentId === targetAgent.getAgentId())
          if (st) st.status = SUB_TASK_STATUS.USER_HANDLED
          this.postAgentResponse(targetAgent.getAgentId(), 'all yours! I\'ll be here if you need me.')
        }
        break
      }
      case MESSAGE_INTENT.HANDOFF: {
        for (const agent of this.agents.values()) {
          if (!agent.isRunning()) {
            agent.resume()
          }
        }
        break
      }
      case MESSAGE_INTENT.AGREEMENT: {
        // Resolve any pending question
        for (const agent of this.agents.values()) {
          if (agent.getPendingQuestion() && !agent.getPendingQuestion()?.resolved) {
            agent.resolveQuestion(message.message)
            break
          }
        }
        break
      }
      case MESSAGE_INTENT.QUESTION: {
        const targetAgent = this.findRelevantAgent(message.message)
        if (targetAgent) {
          void this.generateAgentResponse(targetAgent.getAgentId(), message.message)
        }
        break
      }
      case MESSAGE_INTENT.CHALLENGE: {
        // Route to the agent whose last message is being challenged
        const lastActiveAgent = Array.from(this.agents.values()).at(-1)
        if (lastActiveAgent) {
          void this.generateAgentResponse(lastActiveAgent.getAgentId(), message.message)
        }
        break
      }
      case MESSAGE_INTENT.INSTRUCTION: {
        if (/\b(stop|cancel|abort)\b/i.test(message.message)) {
          this.stop()
          break
        }
        // Forward instruction to the most relevant agent for context
        const instructionAgent = this.findRelevantAgent(message.message)
        if (instructionAgent) {
          instructionAgent.addChatMessage(`User instruction: ${message.message}`)
          void this.generateAgentResponse(instructionAgent.getAgentId(), message.message)
        }
        break
      }
      case MESSAGE_INTENT.CASUAL: {
        // Casual messages still get a response from an active agent
        const casualAgent = Array.from(this.agents.values())[0]
        if (casualAgent) {
          void this.generateAgentResponse(casualAgent.getAgentId(), message.message)
        }
        break
      }
      case MESSAGE_INTENT.CONTEXT: {
        // Context messages feed into all agents and get acknowledged
        const contextAgent = this.findRelevantAgent(message.message)
        if (contextAgent) {
          void this.generateAgentResponse(contextAgent.getAgentId(), message.message)
        }
        break
      }
      default: {
        // Any unhandled intent still gets forwarded to an active agent
        const defaultAgent = Array.from(this.agents.values())[0]
        if (defaultAgent) {
          void this.generateAgentResponse(defaultAgent.getAgentId(), message.message)
        }
        break
      }
    }
  }

  private async triggerDiscussion(askingAgentId: string, question: string): Promise<void> {
    const chatContext = this.messageBus.getHistory().getRecent(10).map(
      (m) => `${m.sender}: ${m.message}`,
    )

    // Ask other active agents if they have input
    for (const [agentId, agent] of this.agents) {
      if (agentId === askingAgentId) continue

      const discussPrompt = buildDiscussionPrompt(agentId, question, askingAgentId, chatContext)
      const personality = buildPersonalityPrompt(agentId)

      try {
        const response = await this.llm.sendMessage([
          { role: 'system', content: personality },
          { role: 'user', content: discussPrompt },
        ], { maxTokens: 256, temperature: 0.5 })

        const text = response.content.trim()
        if (text && text !== 'SKIP') {
          this.postAgentResponse(agentId, text)
          agent.addChatMessage(`${agentId}: ${text}`)
        }
      } catch {
        // Agent couldn't contribute, that's fine
      }
    }

    // After discussion window, resolve the asking agent's question
    await this.sleep(DISCUSSION_WINDOW_MS)
    const askingAgent = this.agents.get(askingAgentId)
    const pending = askingAgent?.getPendingQuestion()
    if (pending && !pending.resolved) {
      // Use default — discussion didn't resolve it
      askingAgent?.resolveQuestion(pending.defaultAction)
      this.postAgentResponse(askingAgentId, `no reply — going with ${pending.defaultAction}`)
    }
  }

  private async generateAgentResponse(agentId: string, userMessage: string): Promise<void> {
    const chatContext = this.messageBus.getHistory().getRecent(8).map(
      (m) => `${m.sender}: ${m.message}`,
    )

    const responsePrompt = buildResponsePrompt(agentId, chatContext, userMessage)
    const personality = buildPersonalityPrompt(agentId)

    try {
      const response = await this.llm.sendMessage([
        { role: 'system', content: personality },
        { role: 'user', content: responsePrompt },
      ], { maxTokens: 256, temperature: 0.5 })

      this.postAgentResponse(agentId, response.content.trim())
    } catch {
      this.postAgentResponse(agentId, 'sorry, had trouble thinking about that. Can you rephrase?')
    }
  }

  private postAgentResponse(agentId: string, message: string): void {
    this.messageBus.send({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender: agentId,
      receiver: 'all',
      intent: MESSAGE_INTENT.UPDATE,
      message,
      context: { taskId: this.taskId },
      timestamp: Date.now(),
    })
  }

  private findRelevantAgent(message: string): Brain | undefined {
    // Simple heuristic: check if message mentions an agent's expertise
    const lowerMessage = message.toLowerCase()
    for (const [agentId, agent] of this.agents) {
      const profile = AGENT_PROFILES[agentId]
      if (profile?.expertise.some((e) => lowerMessage.includes(e))) {
        return agent
      }
    }
    return Array.from(this.agents.values())[0]
  }

  private emitTheatreArrange(appId: string): void {
    this.eventBus.publish({
      type: 'orchestrator.theatre_arrange',
      layout: [
        { appId, snapZone: 'left' },
        { windowId: 'team-chat', snapZone: 'right' },
      ],
      focusAppId: appId,
      timestamp: Date.now(),
    })
  }

  private emitTheatreArrangeMulti(subTasks: SubTask[]): void {
    const uniqueAppIds = [...new Set(subTasks.map((st) => st.appId))]
    const layout: Array<{ appId?: string; windowId?: string; snapZone: string }> = []

    if (uniqueAppIds.length === 1) {
      layout.push({ appId: uniqueAppIds[0], snapZone: 'left' })
    } else if (uniqueAppIds.length === 2) {
      layout.push({ appId: uniqueAppIds[0], snapZone: 'top-left' })
      layout.push({ appId: uniqueAppIds[1], snapZone: 'bottom-left' })
    } else {
      layout.push({ appId: uniqueAppIds[0], snapZone: 'left' })
    }

    layout.push({ windowId: 'team-chat', snapZone: 'right' })

    this.eventBus.publish({
      type: 'orchestrator.theatre_arrange',
      layout,
      focusAppId: uniqueAppIds[0],
      timestamp: Date.now(),
    })
  }

  private parseSubTasks(content: string): SubTask[] {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return [{
        id: 'st_1',
        description: this.taskDescription,
        agentId: 'research',
        appId: this.installedApps()[0]?.id ?? 'chrome',
        dependsOn: [],
        status: SUB_TASK_STATUS.PENDING,
      }]
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        id: string
        description: string
        agentId: string
        appId: string
        dependsOn: string[]
      }>

      return parsed.map((raw) => ({
        ...raw,
        status: SUB_TASK_STATUS.PENDING,
      }))
    } catch {
      return [{
        id: 'st_1',
        description: this.taskDescription,
        agentId: 'research',
        appId: this.installedApps()[0]?.id ?? 'chrome',
        dependsOn: [],
        status: SUB_TASK_STATUS.PENDING,
      }]
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
