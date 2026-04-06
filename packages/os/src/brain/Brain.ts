import { PLAN_STEP_STATUS, QUESTION_SEVERITY, type PlanStep, type PendingQuestion, type CursorIntent, type AppNavigation } from '@maia/shared'
import { pino } from 'pino'
import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import type { EventBus } from '../events/EventBus'
import type { MessageBus } from '../communication/MessageBus'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import { TaskPlanner } from './TaskPlanner'
import { ActionDecider } from './ActionDecider'
import { ResearchMemory } from './ResearchMemory'
import { NavigationMemory } from './NavigationMemory'
import { HelpFetcher } from './HelpFetcher'
import { SelfHealer } from './SelfHealer'
import { CostTracker } from './CostTracker'
import { buildPersonalityPrompt, getQuestionWaitSeconds } from './AgentPersonality'

const logger = pino({ name: 'brain' })

export interface BrainConfig {
  taskId: string
  appId: string
  agentId?: string
  budgetLimit?: number
  messageBus?: MessageBus
  appNavigation?: AppNavigation
  appName?: string
  helpUrl?: string
  navigationMemory?: NavigationMemory
}

export class Brain {
  private readonly intelligence: IntelligenceRouter
  private readonly eventBus: EventBus
  private readonly llm: ProviderRegistry
  private readonly planner: TaskPlanner
  private readonly decider: ActionDecider
  private readonly healer: SelfHealer
  private readonly costTracker: CostTracker
  private readonly personalityPrompt: string
  private readonly messageBus: MessageBus | undefined
  private readonly appNavigationContext: string
  private readonly navMemory: NavigationMemory
  private readonly helpFetcher: HelpFetcher
  private readonly helpUrl: string | undefined
  private helpContext = ''
  private readonly research: ResearchMemory
  private plan: PlanStep[] = []
  private currentStep = 0
  private stepActionCount = 0
  private readonly maxActionsPerStep = 15
  private recentActions: string[] = []
  private chatContext: string[] = []
  private running = false
  private paused = false
  private pendingQuestion: PendingQuestion | undefined
  private readonly taskId: string
  private readonly appId: string
  private readonly agentId: string
  private noActionCount = 0
  private scrollCount = 0
  private readonly maxScrollsPerStep = 5
  private lastPageUrl = ''
  private lastTeamMessage = ''

  constructor(
    intelligence: IntelligenceRouter,
    eventBus: EventBus,
    llm: ProviderRegistry,
    config: BrainConfig,
  ) {
    this.intelligence = intelligence
    this.eventBus = eventBus
    this.llm = llm
    this.planner = new TaskPlanner(llm, eventBus)
    this.decider = new ActionDecider(llm)
    this.healer = new SelfHealer(llm)
    this.costTracker = new CostTracker(eventBus, config.budgetLimit)
    this.taskId = config.taskId
    this.appId = config.appId
    this.agentId = config.agentId ?? 'computer'
    this.personalityPrompt = buildPersonalityPrompt(this.agentId)
    this.messageBus = config.messageBus
    this.appNavigationContext = this.formatNavigation(config.appName, config.appNavigation)
    this.navMemory = config.navigationMemory ?? new NavigationMemory()
    this.helpFetcher = new HelpFetcher(llm)
    this.helpUrl = config.helpUrl
    this.research = new ResearchMemory('')
  }

  async run(taskDescription: string): Promise<string> {
    this.running = true
    // Initialize research memory with the task
    Object.assign(this.research, new ResearchMemory(taskDescription))

    logger.info({ taskId: this.taskId, agent: this.agentId, task: taskDescription }, 'Brain starting task')

    this.eventBus.publish({
      type: 'session.task_started',
      taskId: this.taskId,
      description: taskDescription,
      timestamp: Date.now(),
    })

    this.plan = await this.planner.createPlan(taskDescription)

    while (this.currentStep < this.plan.length && this.running) {
      if (this.paused) {
        await this.sleep(500)
        continue
      }

      if (this.costTracker.isOverBudget()) {
        this.paused = true
        continue
      }

      if (this.pendingQuestion && !this.pendingQuestion.resolved) {
        const elapsed = Date.now() - this.pendingQuestion.askedAt
        const waitMs = this.pendingQuestion.waitSeconds * 1000
        if (elapsed < waitMs) {
          await this.sleep(500)
          continue
        }
        const defaultAction = this.pendingQuestion.defaultAction
        this.pendingQuestion.resolved = true
        this.pendingQuestion.resolution = defaultAction
        this.chatContext.push(`Decision: ${defaultAction}`)
        this.publishChatMessage(`no reply — going with ${defaultAction}`)
      }

      await this.executeStep(taskDescription)
    }

    const summary = this.running ? 'all done' : 'stopped'

    this.eventBus.publish({
      type: 'session.task_completed',
      taskId: this.taskId,
      summary,
      timestamp: Date.now(),
    })

    this.running = false
    return summary
  }

  addChatMessage(message: string): void {
    this.chatContext.push(message)
    if (this.chatContext.length > 10) this.chatContext.shift()

    if (this.pendingQuestion && !this.pendingQuestion.resolved) {
      this.pendingQuestion.resolved = true
      this.pendingQuestion.resolution = message
    }
  }

  resolveQuestion(resolution: string): void {
    if (this.pendingQuestion) {
      this.pendingQuestion.resolved = true
      this.pendingQuestion.resolution = resolution
    }
  }

  getPendingQuestion(): PendingQuestion | undefined { return this.pendingQuestion }
  pause(): void { this.paused = true }
  resume(): void { this.paused = false }
  stop(): void { this.running = false }
  isRunning(): boolean { return this.running }
  getPlan(): PlanStep[] { return this.plan }
  getCurrentStep(): number { return this.currentStep }
  getCostTracker(): CostTracker { return this.costTracker }
  getAgentId(): string { return this.agentId }
  getAppId(): string { return this.appId }
  getResearchMemory(): ResearchMemory { return this.research }

  private async executeStep(taskDescription: string): Promise<void> {
    const step = this.plan[this.currentStep]
    if (!step) return

    this.planner.updateStepStatus(this.plan, this.currentStep, PLAN_STEP_STATUS.IN_PROGRESS)

    this.eventBus.publish({
      type: 'brain.thinking',
      thought: `Working on: ${step.description}`,
      timestamp: Date.now(),
    })

    // Wait for page to stabilize
    await this.waitForPageReady()

    // Scan the page visually (scan line animation)
    await this.intelligence.scanPage(this.appId)

    // Read the page state
    const appState = await this.intelligence.getAppState(this.appId)

    // Track page visit in research memory
    const currentUrl = appState.scrapedPage?.url ?? ''
    if (currentUrl && currentUrl !== this.lastPageUrl) {
      this.lastPageUrl = currentUrl
      this.research.addPageVisit(
        currentUrl,
        appState.scrapedPage?.title ?? '',
        true, // Will update to false if agent goes back
      )
    }

    // Get decision from LLM
    let decision
    try {
      // Build extra context for the LLM
      const scrollWarning = this.scrollCount >= this.maxScrollsPerStep - 1
        ? '\nYou have scrolled many times on this page. Consider extracting what you found, clicking a link, or going back.'
        : ''

      // Get navigation lessons for current domain
      const currentDomain = appState.scrapedPage?.url
        ? new URL(appState.scrapedPage.url).hostname.replace('www.', '')
        : ''
      const navLessons = this.navMemory.formatForLLM(currentDomain)
      const helpSection = this.helpContext ? `\nHelp from official documentation:\n${this.helpContext}` : ''

      decision = await this.decider.decide(
        appState.pageDescription + scrollWarning + navLessons + helpSection,
        appState.networkSummary,
        taskDescription,
        this.plan,
        this.currentStep,
        this.recentActions,
        this.chatContext,
        this.personalityPrompt,
        this.agentId,
        this.research.formatForLLM(),
        this.appNavigationContext,
      )
    } catch (error) {
      logger.warn({ error, step: this.currentStep }, 'Decision failed, retrying')
      await this.sleep(1000)
      return
    }

    logger.info({
      hasAction: !!decision.action,
      actionType: decision.action?.type,
      stepComplete: decision.stepComplete,
      hasResearchUpdate: !!decision.researchUpdate,
      confidence: decision.confidence,
    }, 'LLM decision')

    if (decision.thinking) {
      this.eventBus.publish({ type: 'brain.thinking', thought: decision.thinking, timestamp: Date.now() })
    }

    // Update research memory with findings
    if (decision.researchUpdate && decision.researchUpdate.length > 0 && currentUrl) {
      const hostname = new URL(currentUrl).hostname.replace('www.', '')
      this.research.addFinding(
        hostname,
        currentUrl,
        decision.researchUpdate,
        appState.scrapedPage?.pageType ?? 'unknown',
      )

      // Show extraction pulse for visual feedback
      await this.intelligence.extractionPulse(this.appId, decision.researchUpdate[0]?.name ?? '')
    }

    // Highlight important text on the page (progressive)
    if (decision.highlights && decision.highlights.length > 0) {
      await this.intelligence.highlightKeywords(this.appId, decision.highlights)
    }

    // Post team message
    if (decision.teamMessage) {
      const isDuplicate = this.isSimilarMessage(decision.teamMessage, this.lastTeamMessage)
      if (!isDuplicate) {
        this.lastTeamMessage = decision.teamMessage
        this.publishChatMessage(decision.teamMessage)
      }
    }

    // Handle questions
    if (decision.question) {
      this.askQuestion(decision.question, decision.questionSeverity ?? QUESTION_SEVERITY.MEDIUM, decision.questionDefault ?? 'proceed')
      return
    }

    // Execute action with visual performance
    if (decision.action) {
      this.noActionCount = 0

      this.eventBus.publish({
        type: 'brain.decision',
        action: decision.action,
        reasoning: decision.thinking,
        timestamp: Date.now(),
      })

      // Visual: move cursor to target with intent, glow before clicking
      const intent = (decision.visual?.intent ?? 'decisive') as CursorIntent
      const shouldGlow = decision.visual?.glow ?? (decision.action.type === 'click')

      if (decision.action.target && decision.action.type !== 'press_key') {
        await this.intelligence.performVisuals(this.appId, decision.action.target, intent, shouldGlow)
      }

      // Execute the action
      const success = await this.intelligence.act(
        this.appId,
        decision.action.type,
        decision.action.target,
        decision.action.value,
      )

      // Click ripple after click
      if (decision.action.type === 'click') {
        await this.intelligence.clickWithVisuals(this.appId, decision.action.target)
      }

      // Track the action
      const actionDesc = decision.action.value
        ? `${decision.action.type}(${decision.action.target}, "${decision.action.value}")`
        : `${decision.action.type}(${decision.action.target})`
      this.recentActions.push(actionDesc)

      // Track scroll count — prevent infinite scroll loops
      if (decision.action.type === 'scroll') {
        this.scrollCount++
        if (this.scrollCount >= this.maxScrollsPerStep) {
          logger.warn({ scrollCount: this.scrollCount }, 'Max scrolls reached — agent should read content or move on')
        }
      } else {
        this.scrollCount = 0 // Reset on non-scroll action
      }

      // Block duplicate searches — if agent tries to search the same thing again, skip it
      if (decision.action.type === 'type' && decision.action.value) {
        const newQuery = decision.action.value.toLowerCase().trim()
        const alreadySearched = this.research.getState().searchesTriedSoFar.some(
          (prev) => prev.toLowerCase().trim() === newQuery
            || newQuery.includes(prev.toLowerCase().trim())
            || prev.toLowerCase().trim().includes(newQuery),
        )
        if (alreadySearched) {
          logger.warn({ query: decision.action.value }, 'Blocked duplicate search — already searched this')
          this.publishChatMessage(`already searched for that — moving on`)
          this.stepActionCount++
          return
        }
        this.research.addSearch(decision.action.value)
      }

      // If going back, mark previous page as not useful and learn from the failure
      if (decision.action.type === 'go_back' && decision.backReason) {
        const visited = this.research.getState().pagesVisited
        const lastVisited = visited[visited.length - 1]
        if (lastVisited) {
          lastVisited.useful = false
          lastVisited.reason = decision.backReason
          // Learn this for future tasks
          this.navMemory.learnFromFailure(lastVisited.url, 'visited page', decision.backReason)
        }
      }

      // If a click failed, learn from it
      if (decision.action.type === 'click' && !success) {
        const currentUrl = appState.scrapedPage?.url ?? ''
        this.navMemory.learnFromFailure(currentUrl, `click("${decision.action.target}")`, 'element not found or click failed')
      }

      // Wait for the action to take effect
      // Navigation actions (press_key Enter, click, go_back, navigate) destroy
      // the JS context, so we can't use reactive MutationObserver — poll readyState instead
      const isNavigationAction = decision.action.type === 'press_key'
        || decision.action.type === 'go_back'
        || decision.action.type === 'navigate'
        || decision.action.type === 'click'

      if (isNavigationAction) {
        // Give the navigation time to start, then poll for page ready
        await this.sleep(1000)
        await this.waitForPageReady()
        // Extra settle time for JS frameworks to hydrate
        await this.sleep(500)
        logger.info('Page settled after navigation action')
      } else {
        // Non-navigation actions (type, scroll, hover): use reactive wait
        try {
          const waitResult = await this.intelligence.waitForPageSettle(this.appId)
          logger.info({ signal: waitResult.signal, durationMs: waitResult.durationMs }, 'Page settled')
        } catch {
          await this.sleep(500)
        }
      }

      if (!success && this.healer.canRetry(this.currentStep)) {
        this.healer.recordAttempt(this.currentStep)
        return
      }

      this.stepActionCount++
      return
    }

    // No action returned — check for stuck
    this.noActionCount++

    // If stuck and we have a help URL, fetch help from official docs
    if (this.noActionCount === 2 && this.helpUrl && !this.helpContext) {
      const step = this.plan[this.currentStep]
      const question = step?.description ?? taskDescription
      logger.info({ helpUrl: this.helpUrl, question }, 'Fetching help — agent seems stuck')
      try {
        this.helpContext = await this.helpFetcher.getHelp(this.helpUrl, question)
        if (this.helpContext) {
          logger.info({ helpLength: this.helpContext.length }, 'Got help from official docs')
        }
      } catch {
        // Non-critical
      }
    }

    const tooManyActions = this.stepActionCount >= this.maxActionsPerStep
    if (decision.stepComplete || tooManyActions) {
      this.noActionCount = 0
      this.scrollCount = 0
      this.planner.updateStepStatus(this.plan, this.currentStep, PLAN_STEP_STATUS.COMPLETED)
      this.healer.resetAttempts(this.currentStep)
      this.currentStep++
      this.stepActionCount = 0
      return
    }

    if (this.noActionCount >= 3) {
      logger.warn({ step: this.currentStep, noActionCount: this.noActionCount }, 'Stuck — advancing step')
      this.publishChatMessage('moving on — couldn\'t make more progress on this step')
      this.noActionCount = 0
      this.scrollCount = 0
      this.planner.updateStepStatus(this.plan, this.currentStep, PLAN_STEP_STATUS.COMPLETED)
      this.healer.resetAttempts(this.currentStep)
      this.currentStep++
      this.stepActionCount = 0
      return
    }

    await this.sleep(1000)
  }

  private async waitForPageReady(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      try {
        const loading = await this.intelligence.isPageLoading(this.appId)
        if (!loading) return
      } catch {
        return
      }
      await this.sleep(500)
    }
  }

  private askQuestion(question: string, severity: string, defaultAction: string): void {
    const waitSeconds = getQuestionWaitSeconds(severity)

    this.pendingQuestion = {
      id: `q_${Date.now()}`,
      agentId: this.agentId,
      question,
      severity: severity as PendingQuestion['severity'],
      defaultAction,
      waitSeconds,
      askedAt: Date.now(),
      resolved: false,
    }

    const timeLabel = waitSeconds <= 15 ? 'in a sec' : `in about ${waitSeconds} seconds`
    const defaultNote = severity === 'critical'
      ? 'need your ok on this one'
      : `going with ${defaultAction} ${timeLabel} if I don't hear back`

    this.publishChatMessage(`${question} ${defaultNote}`)
  }

  private publishChatMessage(message: string): void {
    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender: this.agentId,
      receiver: 'all',
      intent: 'update' as const,
      message,
      context: { taskId: this.taskId, step: this.plan[this.currentStep]?.description },
      timestamp: Date.now(),
    }

    // Use MessageBus when available (stores in history + publishes event)
    // Falls back to EventBus direct publish
    if (this.messageBus) {
      this.messageBus.send(chatMessage)
    } else {
      this.eventBus.publish({ type: 'message.sent', message: chatMessage, timestamp: Date.now() })
    }
  }

  private isSimilarMessage(a: string, b: string): boolean {
    if (!b) return false
    const strip = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
    if (strip(a) === strip(b)) return true

    const filler = new Set([
      'the', 'is', 'are', 'was', 'were', 'been', 'be',
      'with', 'and', 'that', 'this', 'from', 'for', 'has', 'have', 'had',
      'its', 'but', 'not', 'can', 'our', 'his', 'her', 'who', 'which',
      'should', 'might', 'would', 'could', 'also', 'into', 'over',
    ])
    const extractKeys = (s: string) =>
      strip(s).split(' ').filter((w) => w.length > 2 && !filler.has(w))

    const keysA = extractKeys(a)
    const keysB = new Set(extractKeys(b))
    if (keysA.length === 0) return false
    const overlap = keysA.filter((w) => keysB.has(w)).length
    return overlap / Math.min(keysA.length, keysB.size) > 0.4
  }

  private formatNavigation(appName: string | undefined, nav: AppNavigation | undefined): string {
    if (!nav) return ''

    const parts: string[] = [`\nApp navigation guide for ${appName ?? 'this app'}:`]
    for (const [key, value] of Object.entries(nav)) {
      if (Array.isArray(value)) {
        parts.push(`  ${key}:`)
        for (const item of value) {
          parts.push(`    - ${item}`)
        }
      } else if (typeof value === 'object' && value !== null) {
        parts.push(`  ${key}:`)
        for (const [k, v] of Object.entries(value)) {
          parts.push(`    ${k}: ${v}`)
        }
      } else if (value) {
        parts.push(`  ${key}: ${value}`)
      }
    }
    return parts.join('\n')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
