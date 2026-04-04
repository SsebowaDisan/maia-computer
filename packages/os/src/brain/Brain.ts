import { PLAN_STEP_STATUS, type PlanStep } from '@maia/shared'
import { pino } from 'pino'
import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import type { EventBus } from '../events/EventBus'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import { TaskPlanner } from './TaskPlanner'
import { ActionDecider } from './ActionDecider'
import { SelfHealer } from './SelfHealer'
import { CostTracker } from './CostTracker'

const logger = pino({ name: 'brain' })

export interface BrainConfig {
  taskId: string
  appId: string
  budgetLimit?: number
}

export class Brain {
  private readonly intelligence: IntelligenceRouter
  private readonly eventBus: EventBus
  private readonly planner: TaskPlanner
  private readonly decider: ActionDecider
  private readonly healer: SelfHealer
  private readonly costTracker: CostTracker
  private plan: PlanStep[] = []
  private currentStep = 0
  private stepActionCount = 0
  private readonly maxActionsPerStep = 15
  private recentActions: string[] = []
  private chatContext: string[] = []
  private running = false
  private paused = false
  private readonly taskId: string
  private readonly appId: string

  constructor(
    intelligence: IntelligenceRouter,
    eventBus: EventBus,
    llm: ProviderRegistry,
    config: BrainConfig,
  ) {
    this.intelligence = intelligence
    this.eventBus = eventBus
    this.planner = new TaskPlanner(llm, eventBus)
    this.decider = new ActionDecider(llm)
    this.healer = new SelfHealer(llm)
    this.costTracker = new CostTracker(eventBus, config.budgetLimit)
    this.taskId = config.taskId
    this.appId = config.appId
  }

  async run(taskDescription: string): Promise<string> {
    this.running = true
    logger.info({ taskId: this.taskId, task: taskDescription }, 'Brain starting task')

    this.eventBus.publish({
      type: 'session.task_started',
      taskId: this.taskId,
      description: taskDescription,
      timestamp: Date.now(),
    })

    // Create plan
    this.plan = await this.planner.createPlan(taskDescription)

    // Execute plan step by step
    while (this.currentStep < this.plan.length && this.running) {
      if (this.paused) {
        await this.sleep(500)
        continue
      }

      if (this.costTracker.isOverBudget()) {
        this.paused = true
        continue
      }

      await this.executeStep(taskDescription)
    }

    const summary = this.running
      ? `Task completed: ${taskDescription}`
      : 'Task was stopped'

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
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  stop(): void {
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  getPlan(): PlanStep[] {
    return this.plan
  }

  getCurrentStep(): number {
    return this.currentStep
  }

  getCostTracker(): CostTracker {
    return this.costTracker
  }

  private async executeStep(taskDescription: string): Promise<void> {
    const step = this.plan[this.currentStep]
    if (!step) return

    this.planner.updateStepStatus(this.plan, this.currentStep, PLAN_STEP_STATUS.IN_PROGRESS)

    this.eventBus.publish({
      type: 'brain.thinking',
      thought: `Working on: ${step.description}`,
      timestamp: Date.now(),
    })

    // Get app state from Intelligence Layer (TEXT, not screenshots)
    const appState = await this.intelligence.getAppState(this.appId)

    // Decide next action based on text description of the app
    const decision = await this.decider.decide(
      appState.pageDescription,
      appState.networkSummary,
      taskDescription,
      this.plan,
      this.currentStep,
      this.recentActions,
      this.chatContext,
    )

    if (decision.thinking) {
      this.eventBus.publish({
        type: 'brain.thinking',
        thought: decision.thinking,
        timestamp: Date.now(),
      })
    }

    if (decision.message) {
      this.eventBus.publish({
        type: 'message.sent',
        message: {
          id: `msg_${Date.now()}`,
          sender: 'computer',
          receiver: 'user',
          intent: 'update',
          message: decision.message,
          context: { taskId: this.taskId, step: step.description },
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      })
    }

    // Execute action via Intelligence Layer
    if (decision.action) {
      this.eventBus.publish({
        type: 'brain.decision',
        action: decision.action,
        reasoning: decision.thinking,
        timestamp: Date.now(),
      })

      const success = await this.intelligence.act(
        this.appId,
        decision.action.type as 'click' | 'type' | 'scroll',
        decision.action.target,
        decision.action.value,
      )

      this.recentActions.push(`${decision.action.type}: ${decision.action.target}`)

      // Wait for app to react
      await this.sleep(1000)

      if (!success && this.healer.canRetry(this.currentStep)) {
        const attempt = this.healer.recordAttempt(this.currentStep)
        logger.warn({ step: this.currentStep, attempt }, 'Action failed, retrying')
        return
      }

      this.stepActionCount++
      return // Let next iteration take fresh app state
    }

    // No action — step is done or needs user input
    const tooManyActions = this.stepActionCount >= this.maxActionsPerStep
    if (decision.stepComplete || tooManyActions) {
      this.planner.updateStepStatus(this.plan, this.currentStep, PLAN_STEP_STATUS.COMPLETED)
      this.healer.resetAttempts(this.currentStep)
      this.currentStep++
      this.stepActionCount = 0
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
