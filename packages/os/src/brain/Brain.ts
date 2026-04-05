import { PLAN_STEP_STATUS, QUESTION_SEVERITY, type PlanStep, type PendingQuestion } from '@maia/shared'
import { pino } from 'pino'
import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import type { EventBus } from '../events/EventBus'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import { TaskPlanner } from './TaskPlanner'
import { ActionDecider } from './ActionDecider'
import { SelfHealer } from './SelfHealer'
import { CostTracker } from './CostTracker'
import { buildPersonalityPrompt, getQuestionWaitSeconds } from './AgentPersonality'

const logger = pino({ name: 'brain' })

export interface BrainConfig {
  taskId: string
  appId: string
  agentId?: string
  budgetLimit?: number
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
  private lastPageDescription = ''
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
  }

  async run(taskDescription: string): Promise<string> {
    this.running = true
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

      // Check if we have a pending question that needs handling
      if (this.pendingQuestion && !this.pendingQuestion.resolved) {
        const elapsed = Date.now() - this.pendingQuestion.askedAt
        const waitMs = this.pendingQuestion.waitSeconds * 1000
        if (elapsed < waitMs) {
          await this.sleep(500)
          continue
        }
        // Timeout — use default and move on
        const defaultAction = this.pendingQuestion.defaultAction
        this.pendingQuestion.resolved = true
        this.pendingQuestion.resolution = defaultAction
        this.chatContext.push(`Decision: ${defaultAction}`)
        this.publishChatMessage(`no reply — going with ${defaultAction}`)
      }

      await this.executeStep(taskDescription)
    }

    // The agent already shared findings via teamMessage — completion is just a signal
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
    if (this.chatContext.length > 10) {
      this.chatContext.shift()
    }

    // Check if this message resolves a pending question
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

  getPendingQuestion(): PendingQuestion | undefined {
    return this.pendingQuestion
  }

  pause(): void { this.paused = true }
  resume(): void { this.paused = false }
  stop(): void { this.running = false }
  isRunning(): boolean { return this.running }
  getPlan(): PlanStep[] { return this.plan }
  getCurrentStep(): number { return this.currentStep }
  getCostTracker(): CostTracker { return this.costTracker }
  getAgentId(): string { return this.agentId }
  getAppId(): string { return this.appId }

  private async executeStep(taskDescription: string): Promise<void> {
    const step = this.plan[this.currentStep]
    if (!step) return

    this.planner.updateStepStatus(this.plan, this.currentStep, PLAN_STEP_STATUS.IN_PROGRESS)

    this.eventBus.publish({
      type: 'brain.thinking',
      thought: `Working on: ${step.description}`,
      timestamp: Date.now(),
    })

    // Wait for page to stabilize before reading state
    await this.waitForPageReady()

    const appState = await this.intelligence.getAppState(this.appId)
    logger.info({ pageLength: appState.pageDescription.length, hasText: appState.pageDescription.includes('Visible page text') }, 'Page state read')

    let decision
    try {
      decision = await this.decider.decide(
        appState.pageDescription,
        appState.networkSummary,
        taskDescription,
        this.plan,
        this.currentStep,
        this.recentActions,
        this.chatContext,
        this.personalityPrompt,
        this.agentId,
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
      hasTeamMsg: !!decision.teamMessage,
      hasHighlights: !!decision.highlights,
    }, 'LLM decision')

    if (decision.thinking) {
      this.eventBus.publish({
        type: 'brain.thinking',
        thought: decision.thinking,
        timestamp: Date.now(),
      })
    }

    // Highlight what the LLM found important on the page
    if (decision.highlights && decision.highlights.length > 0) {
      await this.intelligence.highlightKeywords(this.appId, decision.highlights)
    }

    // Post team message to chat — skip if it's essentially the same as the last one
    if (decision.teamMessage) {
      const isDuplicate = this.isSimilarMessage(decision.teamMessage, this.lastTeamMessage)
      if (!isDuplicate) {
        this.lastTeamMessage = decision.teamMessage
        this.publishChatMessage(decision.teamMessage)
      }
    }

    // Handle questions the agent wants to ask
    if (decision.question) {
      this.askQuestion(decision.question, decision.questionSeverity ?? QUESTION_SEVERITY.MEDIUM, decision.questionDefault ?? 'proceed')
      return
    }

    if (decision.action) {
      this.noActionCount = 0

      this.eventBus.publish({
        type: 'brain.decision',
        action: decision.action,
        reasoning: decision.thinking,
        timestamp: Date.now(),
      })

      const success = await this.intelligence.act(
        this.appId,
        decision.action.type as 'click' | 'type' | 'scroll' | 'press_key' | 'go_back',
        decision.action.target,
        decision.action.value,
      )

      const actionDesc = decision.action.value
        ? `${decision.action.type}(${decision.action.target}, "${decision.action.value}")`
        : `${decision.action.type}(${decision.action.target})`
      this.recentActions.push(actionDesc)

      // Wait for the action to take effect — varies by type
      const waitTimes: Record<string, number> = {
        press_key: 3000,  // page load after Enter/submit
        click: 2000,      // page navigation + load
        go_back: 2000,    // page load after back
        type: 800,        // autocomplete, validation
        scroll: 600,      // scroll animation to finish
      }
      const waitTime = waitTimes[decision.action.type] ?? 1000
      await this.sleep(waitTime)

      // Popup dismissal removed — was causing crash loops

      if (!success && this.healer.canRetry(this.currentStep)) {
        this.healer.recordAttempt(this.currentStep)
        return
      }

      this.stepActionCount++
      return
    }

    // No action returned — detect if stuck in a loop
    this.noActionCount++
    const pageChanged = appState.pageDescription !== this.lastPageDescription
    this.lastPageDescription = appState.pageDescription

    const tooManyActions = this.stepActionCount >= this.maxActionsPerStep
    if (decision.stepComplete || tooManyActions) {
      this.noActionCount = 0
      this.planner.updateStepStatus(this.plan, this.currentStep, PLAN_STEP_STATUS.COMPLETED)
      this.healer.resetAttempts(this.currentStep)
      this.currentStep++
      this.stepActionCount = 0
      return
    }

    // Stuck detection: no action returned 3+ times on same page
    if (this.noActionCount >= 3 && !pageChanged) {
      logger.warn({ step: this.currentStep, noActionCount: this.noActionCount }, 'Stuck — no action on same page, advancing step')
      this.publishChatMessage('moving on — couldn\'t make more progress on this step')
      this.noActionCount = 0
      this.planner.updateStepStatus(this.plan, this.currentStep, PLAN_STEP_STATUS.COMPLETED)
      this.healer.resetAttempts(this.currentStep)
      this.currentStep++
      this.stepActionCount = 0
      return
    }

    // Page changed but no action — wait and let the LLM re-evaluate
    await this.sleep(1000)
  }

  private async waitForPageReady(): Promise<void> {
    // Poll page loading state — wait for it to finish, up to 5 seconds
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

  private handleQuestionTimeout(): void {
    if (!this.pendingQuestion) return

    // Emit event for orchestrator to trigger team discussion
    this.eventBus.publish({
      type: 'orchestrator.discussion_started',
      questionId: this.pendingQuestion.id,
      agentId: this.agentId,
      question: this.pendingQuestion.question,
      timestamp: Date.now(),
    })

    // For LOW severity, just use default after discussion window
    if (this.pendingQuestion.severity === 'low') {
      this.pendingQuestion.resolved = true
      this.pendingQuestion.resolution = this.pendingQuestion.defaultAction
    }
  }

  private publishChatMessage(message: string): void {
    this.eventBus.publish({
      type: 'message.sent',
      message: {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sender: this.agentId,
        receiver: 'all',
        intent: 'update',
        message,
        context: { taskId: this.taskId, step: this.plan[this.currentStep]?.description },
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    })
  }

  /** Check if two messages convey the same info (prevents double-posting). */
  private isSimilarMessage(a: string, b: string): boolean {
    if (!b) return false
    // Strip all punctuation before comparing
    const strip = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
    if (strip(a) === strip(b)) return true

    const filler = new Set([
      'the', 'is', 'are', 'was', 'were', 'been', 'be',
      'with', 'and', 'that', 'this', 'from', 'for', 'has', 'have', 'had',
      'its', 'but', 'not', 'can', 'our', 'his', 'her', 'who', 'which',
      'should', 'might', 'would', 'could', 'also', 'into', 'over',
      'however', 'current', 'currently', 'results', 'suggest',
      'information', 'specifically', 'particularly', 'recognized',
      'hes', 'shes', 'thats', 'been', 'leading', 'enhanced',
    ])
    const extractKeys = (s: string) =>
      strip(s).split(' ').filter((w) => w.length > 2 && !filler.has(w))

    const keysA = extractKeys(a)
    const keysB = new Set(extractKeys(b))
    if (keysA.length === 0) return false
    const overlap = keysA.filter((w) => keysB.has(w)).length
    return overlap / Math.min(keysA.length, keysB.size) > 0.4
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
