import { pino } from 'pino'
import type { LLMProvider, LLMMessage, LLMOptions, LLMResponse } from './LLMProvider'

const logger = pino({ name: 'provider-registry' })

const MAX_CONSECUTIVE_FAILURES = 3
const FALLBACK_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export class ProviderRegistry {
  private primary: LLMProvider | undefined
  private fallback: LLMProvider | undefined
  private consecutiveFailures = 0
  private usingFallback = false
  private fallbackStartedAt = 0

  setPrimary(provider: LLMProvider): void {
    this.primary = provider
    logger.info({ provider: provider.name }, 'Primary LLM provider set')
  }

  setFallback(provider: LLMProvider): void {
    this.fallback = provider
    logger.info({ provider: provider.name }, 'Fallback LLM provider set')
  }

  async sendMessage(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    this.checkFallbackExpiry()
    const provider = this.getActiveProvider()

    try {
      const response = await provider.sendMessage(messages, options)
      this.onSuccess()
      return response
    } catch (error) {
      return this.handleFailure(error, messages, options, 'sendMessage')
    }
  }

  async sendMessageWithVision(
    messages: LLMMessage[],
    screenshotBase64: string,
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    this.checkFallbackExpiry()
    const provider = this.getActiveProvider()

    try {
      const response = await provider.sendMessageWithVision(messages, screenshotBase64, options)
      this.onSuccess()
      return response
    } catch (error) {
      return this.handleFailureWithVision(error, messages, screenshotBase64, options)
    }
  }

  getActiveProviderName(): string {
    return this.getActiveProvider().name
  }

  private getActiveProvider(): LLMProvider {
    if (this.usingFallback && this.fallback) {
      return this.fallback
    }
    if (!this.primary) {
      throw new Error('No LLM provider configured. Call setPrimary() first.')
    }
    return this.primary
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0
  }

  private async handleFailure(
    error: unknown,
    messages: LLMMessage[],
    options: LLMOptions | undefined,
    method: string,
  ): Promise<LLMResponse> {
    this.consecutiveFailures++
    logger.warn({ error, failures: this.consecutiveFailures }, `LLM ${method} failed`)

    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && this.fallback && !this.usingFallback) {
      this.switchToFallback()
      return this.fallback!.sendMessage(messages, options)
    }

    throw error
  }

  private async handleFailureWithVision(
    error: unknown,
    messages: LLMMessage[],
    screenshot: string,
    options: LLMOptions | undefined,
  ): Promise<LLMResponse> {
    this.consecutiveFailures++
    logger.warn({ error, failures: this.consecutiveFailures }, 'LLM vision call failed')

    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && this.fallback && !this.usingFallback) {
      this.switchToFallback()
      return this.fallback!.sendMessageWithVision(messages, screenshot, options)
    }

    throw error
  }

  private switchToFallback(): void {
    this.usingFallback = true
    this.fallbackStartedAt = Date.now()
    this.consecutiveFailures = 0
    logger.info({ fallback: this.fallback!.name }, 'Switched to fallback provider')
  }

  private checkFallbackExpiry(): void {
    if (this.usingFallback && Date.now() - this.fallbackStartedAt > FALLBACK_DURATION_MS) {
      this.usingFallback = false
      this.consecutiveFailures = 0
      logger.info('Fallback period expired, trying primary again')
    }
  }
}
