import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import type { EventBus } from '../events/EventBus'
import type { MessageBus } from '../communication/MessageBus'
import { ResearchMemory } from '../brain/ResearchMemory'
import { pino } from 'pino'

const logger = pino({ name: 'app-agent' })

export interface AgentTask {
  description: string
  context?: string
  researchFindings?: string
}

export interface AgentResult {
  success: boolean
  findings?: string
  content?: string
  error?: string
}

export abstract class AppAgent {
  readonly intelligence: IntelligenceRouter
  protected readonly llm: ProviderRegistry
  protected readonly eventBus: EventBus
  readonly appId: string
  protected readonly taskId: string
  protected readonly agentId: string
  protected readonly messageBus?: MessageBus
  protected research: ResearchMemory
  protected running = true

  constructor(config: {
    intelligence: IntelligenceRouter
    llm: ProviderRegistry
    eventBus: EventBus
    appId: string
    taskId: string
    agentId: string
    messageBus?: MessageBus
  }) {
    this.intelligence = config.intelligence
    this.llm = config.llm
    this.eventBus = config.eventBus
    this.appId = config.appId
    this.taskId = config.taskId
    this.agentId = config.agentId
    this.messageBus = config.messageBus
    this.research = new ResearchMemory('')
  }

  abstract execute(task: AgentTask): Promise<AgentResult>

  stop(): void { this.running = false }
  getResearch(): ResearchMemory { return this.research }

  // ── Visual actions — user always sees what's happening ──────

  /** Click with full visual performance — scroll into view, cursor move, glow, click, ripple. */
  protected async visualClick(target: string): Promise<boolean> {
    // Scroll the target into view first so user sees it
    await this.scrollToElement(target)
    await this.sleep(300)

    // Full visual click — cursor moves, element glows, click happens, ripple
    const success = await this.intelligence.clickWithVisuals(this.appId, target)
    await this.sleep(300)
    return success
  }

  /** Click with retry — try text, then partial text, then scroll and retry. */
  protected async visualClickWithRetry(target: string): Promise<boolean> {
    // Attempt 1: full visual click
    let success = await this.visualClick(target)
    if (success) return true

    // Attempt 2: try partial text (first 40 chars — handles truncation)
    if (target.length > 40) {
      success = await this.visualClick(target.slice(0, 40))
      if (success) return true
    }

    // Attempt 3: scroll down once and retry
    await this.scrollDown()
    success = await this.visualClick(target)
    if (success) return true

    logger.warn({ target: target.slice(0, 50) }, 'Click failed after retries')
    return false
  }

  /** Scroll to make a target element visible. */
  protected async scrollToElement(target: string): Promise<void> {
    const dom = this.intelligence.getDOMBrain()
    await dom.executeInPage(
      this.appId,
      `(function() {
        var el = document.querySelector('a[href]');
        var all = document.querySelectorAll('a, button, [role="button"]');
        for (var i = 0; i < all.length; i++) {
          if (all[i].textContent && all[i].textContent.trim().toLowerCase().includes(${JSON.stringify(target.toLowerCase().slice(0, 40))})) {
            all[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
      })()`,
    )
    await this.sleep(400)
  }

  /** Scroll down one viewport with visual smoothness. */
  protected async scrollDown(): Promise<void> {
    await this.intelligence.act(this.appId, 'scroll', 'down')
    await this.sleep(600)
  }

  /** Scroll up one viewport. */
  protected async scrollUp(): Promise<void> {
    await this.intelligence.act(this.appId, 'scroll', 'up')
    await this.sleep(600)
  }

  /** Type text into an element — user sees character by character. */
  protected async type(target: string, text: string): Promise<void> {
    await this.intelligence.act(this.appId, 'type', target, text)
    await this.sleep(200)
  }

  /** Press a key. */
  protected async pressKey(key: string): Promise<void> {
    await this.intelligence.act(this.appId, 'press_key', key)
    await this.sleep(200)
  }

  /** Navigate to a URL. */
  protected async navigate(url: string): Promise<void> {
    await this.intelligence.act(this.appId, 'navigate', url)
    await this.sleep(1500)
    await this.waitForPage()
  }

  /** Go back to previous page. */
  protected async goBack(): Promise<void> {
    await this.intelligence.act(this.appId, 'go_back', '')
    await this.sleep(1500)
    await this.waitForPage()
    await this.sleep(500)
  }

  /** Highlight text on the page — shows user what the agent noticed. */
  protected async highlight(keywords: string[]): Promise<void> {
    if (keywords.length > 0) {
      await this.intelligence.highlightKeywords(this.appId, keywords)
    }
  }

  /** Scan the page with visual animation — shows user the agent is reading. */
  protected async scanPage(): Promise<void> {
    await this.intelligence.scanPage(this.appId)
  }

  /** Show extraction pulse — visual feedback when data is captured. */
  protected async showExtraction(label: string): Promise<void> {
    await this.intelligence.extractionPulse(this.appId, label)
  }

  // ── Non-visual utilities ────────────────────────────────────

  /** Wait for page to finish loading. */
  protected async waitForPage(): Promise<void> {
    for (let i = 0; i < 15; i++) {
      try {
        const loading = await this.intelligence.isPageLoading(this.appId)
        if (!loading) return
      } catch { return }
      await this.sleep(500)
    }
  }

  /** Wait for bridge to be injected and ready. */
  protected async waitForBridge(maxRetries = 10): Promise<boolean> {
    const dom = this.intelligence.getDOMBrain()
    for (let i = 0; i < maxRetries; i++) {
      const ready = await dom.executeInPage<boolean>(
        this.appId,
        `typeof window.__maia_bridge !== 'undefined' && typeof window.__maia_bridge.getLinks === 'function'`,
      )
      if (ready) return true
      await this.sleep(500)
    }
    return false
  }

  /** Dismiss cookie banners, popups, overlays. */
  protected async dismissPopups(): Promise<void> {
    try {
      await this.intelligence.dismissObstacles(this.appId)
      await this.sleep(800)
      await this.intelligence.dismissObstacles(this.appId)
    } catch { /* non-critical */ }
  }

  /** Get rich search results — titles, URLs, snippets, knowledge panel, PAA. */
  protected async getSearchResults(): Promise<SearchResults> {
    const dom = this.intelligence.getDOMBrain()
    return await dom.executeInPage<SearchResults>(
      this.appId,
      `window.__maia_bridge && window.__maia_bridge.getSearchResults ? window.__maia_bridge.getSearchResults() : { organic: [], knowledgePanel: null, peopleAlsoAsk: [], aiOverview: null }`,
    ) ?? { organic: [], knowledgePanel: null, peopleAlsoAsk: [], aiOverview: null }
  }

  /** Get page structure — headings, TOC, page type. */
  protected async getPageStructure(): Promise<PageStructure> {
    const dom = this.intelligence.getDOMBrain()
    return await dom.executeInPage<PageStructure>(
      this.appId,
      `window.__maia_bridge && window.__maia_bridge.getPageStructure ? window.__maia_bridge.getPageStructure() : { headings: [], tocLinks: [], type: 'unknown' }`,
    ) ?? { headings: [], tocLinks: [], type: 'unknown' }
  }

  /** Scroll to a specific heading/section on the page. */
  protected async scrollToSection(headingText: string): Promise<void> {
    const dom = this.intelligence.getDOMBrain()
    await dom.executeInPage(
      this.appId,
      `(function() {
        var headings = document.querySelectorAll('h1, h2, h3, h4');
        for (var i = 0; i < headings.length; i++) {
          if (headings[i].textContent.trim().toLowerCase().includes(${JSON.stringify(headingText.toLowerCase())})) {
            headings[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
      })()`,
    )
    await this.sleep(500)
  }

  /** Get all links on the page. */
  protected async getLinks(): Promise<Array<{ text: string; href: string; visible: boolean }>> {
    const dom = this.intelligence.getDOMBrain()
    return await dom.executeInPage<Array<{ text: string; href: string; visible: boolean }>>(
      this.appId,
      `window.__maia_bridge && window.__maia_bridge.getLinks ? window.__maia_bridge.getLinks() : []`,
    ) ?? []
  }

  /** Get readable page text. */
  protected async getPageText(maxLength = 5000): Promise<string> {
    const dom = this.intelligence.getDOMBrain()
    return await dom.executeInPage<string>(
      this.appId,
      `window.__maia_bridge && window.__maia_bridge.getPageText ? window.__maia_bridge.getPageText(${maxLength}) : document.body.innerText.substring(0, ${maxLength})`,
    ) ?? ''
  }

  /** Clear an input field. */
  protected async clearInput(selector: string): Promise<void> {
    const dom = this.intelligence.getDOMBrain()
    await dom.executeInPage(
      this.appId,
      `window.__maia_bridge && window.__maia_bridge.clearInput && window.__maia_bridge.clearInput('${selector}')`,
    )
    await this.sleep(100)
  }

  /** Check if page has more content below. */
  protected async hasMoreBelow(): Promise<boolean> {
    const dom = this.intelligence.getDOMBrain()
    return await dom.executeInPage<boolean>(
      this.appId,
      `(window.scrollY + window.innerHeight) < (document.documentElement.scrollHeight - 100)`,
    ) ?? false
  }

  /** Get current page URL. */
  protected async getCurrentUrl(): Promise<string> {
    const dom = this.intelligence.getDOMBrain()
    return await dom.executeInPage<string>(this.appId, 'location.href') ?? ''
  }

  /** Post a message to team chat. */
  protected chat(message: string): void {
    if (!this.messageBus) return
    this.messageBus.send({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender: this.agentId,
      receiver: 'all',
      intent: 'update' as const,
      message,
      context: { taskId: this.taskId },
      timestamp: Date.now(),
    })
  }

  /** Ask the LLM. */
  protected async askLLM(system: string, user: string, maxTokens = 1024): Promise<string> {
    const response = await this.llm.sendMessage(
      [{ role: 'system', content: system }, { role: 'user', content: user }],
      { maxTokens, temperature: 0.3 },
    )
    return response.content.trim()
  }

  /** Parse JSON from LLM response. */
  protected parseJSON<T>(content: string): T | undefined {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return undefined
    try { return JSON.parse(match[0]) as T } catch { return undefined }
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ── Types for rich page data ──────────────────────────────────

export interface SearchResult {
  position: number
  title: string
  url: string
  displayUrl: string
  snippet: string
  sitelinks: string[]
  date: string | null
  visible: boolean
}

export interface SearchResults {
  organic: SearchResult[]
  knowledgePanel: { title: string; facts: Record<string, string>; description: string } | null
  peopleAlsoAsk: string[]
  aiOverview: string | null
}

export interface PageStructure {
  headings: Array<{ level: number; text: string; top: number }>
  tocLinks: string[]
  type: string
}
