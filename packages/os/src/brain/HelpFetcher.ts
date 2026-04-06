import { pino } from 'pino'
import type { ProviderRegistry } from '../llm/ProviderRegistry'

const logger = pino({ name: 'help-fetcher' })

/**
 * HelpFetcher loads an app's official help page when the agent gets stuck.
 *
 * Instead of hardcoding all possible app behaviors in the manifest,
 * the agent can fetch real-time help from the app's documentation
 * when it encounters something it doesn't understand.
 *
 * The fetched content is summarized by the LLM into actionable
 * navigation instructions.
 */
export class HelpFetcher {
  private readonly llm: ProviderRegistry
  private readonly cache = new Map<string, { content: string; fetchedAt: number }>()
  private readonly cacheMaxAge = 1000 * 60 * 60 // 1 hour

  constructor(llm: ProviderRegistry) {
    this.llm = llm
  }

  /**
   * Fetch and summarize help content for a specific question.
   * Returns actionable instructions the agent can follow.
   */
  async getHelp(helpUrl: string, question: string): Promise<string> {
    const cacheKey = `${helpUrl}:${question}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < this.cacheMaxAge) {
      return cached.content
    }

    try {
      // Fetch the help page
      const response = await fetch(helpUrl, {
        headers: { 'User-Agent': 'MaiaComputer/1.0 (Help Fetcher)' },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        logger.warn({ helpUrl, status: response.status }, 'Help page fetch failed')
        return ''
      }

      const html = await response.text()

      // Extract text content (strip HTML)
      const text = this.extractText(html).substring(0, 8000)

      if (text.length < 100) return ''

      // Ask LLM to summarize the relevant parts
      const summary = await this.llm.sendMessage([
        {
          role: 'system',
          content: 'You read app help documentation and extract specific, actionable navigation instructions. Reply with bullet points — focus on what to click, where to type, keyboard shortcuts, and step-by-step workflows. Be concise and practical.',
        },
        {
          role: 'user',
          content: `I'm using an app and need help with: "${question}"\n\nHere's the app's help documentation:\n${text}\n\nExtract the specific navigation steps to answer my question. Focus on what to click, where to type, and keyboard shortcuts.`,
        },
      ], { model: 'gpt-4o-mini', maxTokens: 512, temperature: 0.2 })

      const result = summary.content.trim()

      // Cache the result
      this.cache.set(cacheKey, { content: result, fetchedAt: Date.now() })

      logger.info({ helpUrl, question, resultLength: result.length }, 'Fetched and summarized help')
      return result
    } catch (error) {
      logger.warn({ helpUrl, error }, 'Help fetch failed')
      return ''
    }
  }

  /** Strip HTML tags and extract readable text. */
  private extractText(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
  }
}
