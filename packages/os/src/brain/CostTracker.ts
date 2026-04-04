import { COST_DEFAULTS } from '@maia/shared'
import type { EventBus } from '../events/EventBus'

interface LLMCallRecord {
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: number
}

// Rough cost estimates per 1M tokens (USD)
const COST_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-opus-4-20250514': { input: 15, output: 75 },
  'gpt-4o': { input: 2.5, output: 10 },
}

export class CostTracker {
  private readonly calls: LLMCallRecord[] = []
  private readonly eventBus: EventBus
  private budgetLimit: number
  private warningEmitted = false
  private exceededEmitted = false

  constructor(eventBus: EventBus, budgetLimit?: number) {
    this.eventBus = eventBus
    this.budgetLimit = budgetLimit ?? COST_DEFAULTS.DEFAULT_TASK_BUDGET
  }

  recordCall(provider: string, model: string, inputTokens: number, outputTokens: number): void {
    const cost = this.estimateCost(model, inputTokens, outputTokens)

    const record: LLMCallRecord = {
      provider,
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: Date.now(),
    }

    this.calls.push(record)

    this.eventBus.publish({
      type: 'cost.llm_call',
      provider,
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: Date.now(),
    })

    this.checkBudget()
  }

  getTotalCost(): number {
    return this.calls.reduce((sum, call) => sum + call.cost, 0)
  }

  getTotalInputTokens(): number {
    return this.calls.reduce((sum, call) => sum + call.inputTokens, 0)
  }

  getTotalOutputTokens(): number {
    return this.calls.reduce((sum, call) => sum + call.outputTokens, 0)
  }

  getCallCount(): number {
    return this.calls.length
  }

  getBudgetLimit(): number {
    return this.budgetLimit
  }

  increaseBudget(): void {
    this.budgetLimit *= (1 + COST_DEFAULTS.BUDGET_INCREASE_ON_CONTINUE)
    this.exceededEmitted = false
  }

  isOverBudget(): boolean {
    return this.getTotalCost() >= this.budgetLimit
  }

  private estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const rates = COST_PER_MILLION_TOKENS[model]
    if (!rates) return 0

    const inputCost = (inputTokens / 1_000_000) * rates.input
    const outputCost = (outputTokens / 1_000_000) * rates.output
    return inputCost + outputCost
  }

  private checkBudget(): void {
    const totalCost = this.getTotalCost()
    const warningThreshold = this.budgetLimit * COST_DEFAULTS.BUDGET_WARNING_THRESHOLD

    if (totalCost >= warningThreshold && !this.warningEmitted) {
      this.warningEmitted = true
      this.eventBus.publish({
        type: 'cost.budget_warning',
        currentCost: totalCost,
        budgetLimit: this.budgetLimit,
        timestamp: Date.now(),
      })
    }

    if (totalCost >= this.budgetLimit && !this.exceededEmitted) {
      this.exceededEmitted = true
      this.eventBus.publish({
        type: 'cost.budget_exceeded',
        currentCost: totalCost,
        budgetLimit: this.budgetLimit,
        timestamp: Date.now(),
      })
    }
  }
}
