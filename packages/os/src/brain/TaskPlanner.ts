import type { PlanStep } from '@maia/shared'
import { PLAN_STEP_STATUS } from '@maia/shared'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import type { EventBus } from '../events/EventBus'

const PLAN_PROMPT = `break this task into steps for a computer that controls a web browser. it can type, click links, press keys, scroll, go back, and read page content. the browser is already open.

the agent should navigate like a real person doing research — search, click into pages, read, go back if needed, try another result.

<examples>
<example>
<task>weather in kampala</task>
<plan>[{"step":1,"description":"search google for weather kampala","output":"search results page"},{"step":2,"description":"read the weather data from the results or featured snippet","output":"weather info shared with team"}]</plan>
</example>
<example>
<task>who is the CEO of stripe</task>
<plan>[{"step":1,"description":"search google for CEO of stripe","output":"search results"},{"step":2,"description":"click the most relevant result to get details","output":"article page loaded"},{"step":3,"description":"read the CEO name and details from the article and share findings","output":"CEO info shared"}]</plan>
</example>
<example>
<task>compare notion vs coda pricing</task>
<plan>[{"step":1,"description":"search for notion pricing 2026","output":"search results"},{"step":2,"description":"click notion pricing page and read the plans","output":"notion pricing read"},{"step":3,"description":"go back and search for coda pricing 2026","output":"search results"},{"step":4,"description":"click coda pricing page and read the plans","output":"coda pricing read"},{"step":5,"description":"share comparison summary with the team","output":"comparison shared"}]</plan>
</example>
</examples>

keep plans short (2-4 steps for simple lookups, up to 5-6 for comparisons). respond with json array only.`

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
