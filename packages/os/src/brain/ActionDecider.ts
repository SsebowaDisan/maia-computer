import type { PlanStep } from '@maia/shared'
import type { ProviderRegistry } from '../llm/ProviderRegistry'

const DECIDE_PROMPT = `You are an AI controlling apps inside Maia Computer — an AI-powered operating system.
You receive a TEXT description of the current app state (interactive elements, their labels, positions, values).
You do NOT receive screenshots. You read the DOM structure directly.

Available actions:
- click(target) — click an element by its selector or label
- type(target, value) — type text into an input element
- scroll(target) — scroll to make an element visible
- press_key(key) — press Enter, Tab, Escape, etc.

The target is the element's selector string from the element list.

Rules:
- Pick the element that best matches what you need to interact with
- After typing in a search field, ALWAYS press Enter to submit
- Set step_complete to true when the step's expected output has been achieved
- Never repeat the same action more than twice

Respond with valid JSON only:
{
  "thinking": "what I see and what I need to do",
  "action": { "type": "click", "target": "#search-input" },
  "step_complete": false,
  "message": null
}

Action examples:
{ "type": "click", "target": ".compose-btn" }
{ "type": "type", "target": "#search", "value": "weather in New York" }
{ "type": "press_key", "target": "Enter" }
{ "type": "scroll", "target": ".email-row:nth-child(5)" }
`

export interface DOMAction {
  type: 'click' | 'type' | 'scroll' | 'press_key'
  target: string
  value?: string
}

export interface DecisionResult {
  thinking: string
  action: DOMAction | undefined
  stepComplete: boolean
  message: string | undefined
}

export class ActionDecider {
  private readonly llm: ProviderRegistry

  constructor(llm: ProviderRegistry) {
    this.llm = llm
  }

  async decide(
    pageDescription: string,
    networkSummary: string,
    taskDescription: string,
    plan: PlanStep[],
    currentStep: number,
    recentActions: string[],
    chatContext: string[],
  ): Promise<DecisionResult> {
    const planText = plan.map((s) =>
      `  ${s.status === 'completed' ? '✅' : s.status === 'in_progress' ? '🔄' : '○'} Step ${s.step}: ${s.description} (expect: ${s.contract.output})`,
    ).join('\n')

    const userPrompt = `Task: ${taskDescription}

Plan:
${planText}

Current step: ${currentStep + 1}

App state (DOM):
${pageDescription}

Network data:
${networkSummary || 'None'}

Recent actions: ${recentActions.slice(-5).join(', ') || 'none'}
Chat: ${chatContext.slice(-3).join(' | ') || 'none'}

What is the next action?`

    const response = await this.llm.sendMessage(
      [
        { role: 'system', content: DECIDE_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 1024, temperature: 0.3 },
    )

    return this.parseDecision(response.content)
  }

  private parseDecision(content: string): DecisionResult {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        thinking: content,
        action: undefined,
        stepComplete: false,
        message: 'I had trouble understanding the app state.',
      }
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      thinking?: string
      action?: DOMAction | null
      step_complete?: boolean
      message?: string | null
    }

    return {
      thinking: parsed.thinking ?? '',
      action: parsed.action ?? undefined,
      stepComplete: parsed.step_complete ?? false,
      message: parsed.message ?? undefined,
    }
  }
}
