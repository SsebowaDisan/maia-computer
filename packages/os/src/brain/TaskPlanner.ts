import type { PlanStep } from '@maia/shared'
import { PLAN_STEP_STATUS } from '@maia/shared'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import type { EventBus } from '../events/EventBus'

const PLAN_PROMPT = `Break this task into clear sequential steps for a computer that can browse the web.
Be specific about what websites to use.
For each step, define the expected output that proves it succeeded.

Respond with valid JSON only — an array of objects with these fields:
- step (number)
- description (string)
- output (string: the expected result that proves this step worked)

Example:
[
  { "step": 1, "description": "Navigate to Google Flights", "output": "Google Flights page loaded with search form visible" }
]`

export class TaskPlanner {
  private readonly llm: ProviderRegistry
  private readonly eventBus: EventBus

  constructor(llm: ProviderRegistry, eventBus: EventBus) {
    this.llm = llm
    this.eventBus = eventBus
  }

  async createPlan(taskDescription: string): Promise<PlanStep[]> {
    const response = await this.llm.sendMessage([
      { role: 'system', content: PLAN_PROMPT },
      { role: 'user', content: taskDescription },
    ], { maxTokens: 2048, temperature: 0.5 })

    const rawSteps = this.parseSteps(response.content)

    const plan: PlanStep[] = rawSteps.map((raw) => ({
      step: raw.step,
      description: raw.description,
      status: PLAN_STEP_STATUS.PENDING,
      contract: {
        output: raw.output,
      },
    }))

    this.eventBus.publish({
      type: 'brain.plan_created',
      steps: plan,
      timestamp: Date.now(),
    })

    return plan
  }

  updateStepStatus(plan: PlanStep[], stepIndex: number, status: PlanStep['status']): void {
    const step = plan[stepIndex]
    if (step) {
      step.status = status
      this.eventBus.publish({
        type: 'brain.plan_updated',
        stepIndex,
        status,
        timestamp: Date.now(),
      })
    }
  }

  private parseSteps(content: string): Array<{ step: number; description: string; output: string }> {
    // Extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to parse plan: no JSON array found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      step: number
      description: string
      output: string
    }>

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Failed to parse plan: empty or invalid array')
    }

    return parsed
  }
}
