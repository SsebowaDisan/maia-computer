import { BRAIN_TIMING } from '@maia/shared'
import { pino } from 'pino'
import type { ProviderRegistry } from '../llm/ProviderRegistry'

const logger = pino({ name: 'self-healer' })

const DIAGNOSE_PROMPT = `You are analyzing a failed action on a web page.

The computer tried to perform an action but the result doesn't match what was expected.

Based on the screenshot, diagnose what went wrong and suggest a recovery strategy.

Respond with valid JSON:
{
  "diagnosis": "what went wrong (one sentence)",
  "strategy": "click_different_element" | "close_popup" | "scroll_to_find" | "navigate_back" | "ask_user",
  "details": "specific instructions for recovery"
}`

export interface HealingResult {
  diagnosis: string
  strategy: 'click_different_element' | 'close_popup' | 'scroll_to_find' | 'navigate_back' | 'ask_user'
  details: string
}

export class SelfHealer {
  private readonly llm: ProviderRegistry
  private attemptCounts = new Map<number, number>()

  constructor(llm: ProviderRegistry) {
    this.llm = llm
  }

  canRetry(stepIndex: number): boolean {
    const attempts = this.attemptCounts.get(stepIndex) ?? 0
    return attempts < BRAIN_TIMING.SELF_HEAL_MAX_RETRIES
  }

  recordAttempt(stepIndex: number): number {
    const current = this.attemptCounts.get(stepIndex) ?? 0
    const next = current + 1
    this.attemptCounts.set(stepIndex, next)
    return next
  }

  getAttemptCount(stepIndex: number): number {
    return this.attemptCounts.get(stepIndex) ?? 0
  }

  resetAttempts(stepIndex: number): void {
    this.attemptCounts.delete(stepIndex)
  }

  async diagnose(
    screenshotBase64: string,
    expectedOutput: string,
    lastAction: string,
  ): Promise<HealingResult> {
    const userPrompt = `Expected result: ${expectedOutput}
Last action performed: ${lastAction}
The screenshot shows the current state. What went wrong?`

    const response = await this.llm.sendMessageWithVision(
      [
        { role: 'system', content: DIAGNOSE_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      screenshotBase64,
      { maxTokens: 512, temperature: 0.3 },
    )

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      return JSON.parse(jsonMatch[0]) as HealingResult
    } catch {
      logger.warn('Failed to parse healing response, defaulting to ask_user')
      return {
        diagnosis: 'Unable to determine what went wrong',
        strategy: 'ask_user',
        details: 'Please check the current state and advise',
      }
    }
  }
}
