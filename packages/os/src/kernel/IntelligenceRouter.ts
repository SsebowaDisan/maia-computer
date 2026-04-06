import { pino } from 'pino'
import type { NetworkBrain } from './NetworkBrain'
import type { DOMBrain } from './DOMBrain'
import type { VisionBrain } from './VisionBrain'
import type { PageScraper } from './PageScraper'
import type { ScrapedPage, WaitResult, CursorIntent } from '@maia/shared'

const logger = pino({ name: 'intelligence-router' })

export interface AppState {
  appId: string
  pageDescription: string
  networkSummary: string
  scrapedPage: ScrapedPage | undefined
  source: 'dom' | 'network' | 'vision'
}

/**
 * IntelligenceRouter decides which brain to use for each query.
 * Priority: Page Scraper (richest) → DOM Brain → Vision Brain (fallback).
 * Network Brain data is always included when available.
 */
export class IntelligenceRouter {
  private readonly network: NetworkBrain
  private readonly dom: DOMBrain
  private readonly vision: VisionBrain
  private readonly scraper: PageScraper
  private dismissedOnUrl = ''

  constructor(network: NetworkBrain, dom: DOMBrain, vision: VisionBrain, scraper: PageScraper) {
    this.network = network
    this.dom = dom
    this.vision = vision
    this.scraper = scraper
  }

  async getAppState(appId: string): Promise<AppState> {
    const networkSummary = this.network.getAppSummary(appId)

    // Try Page Scraper first — richest data
    const scrapedPage = await this.scraper.scrapePage(appId)

    // Dismiss obstacles once per new page URL (not on every action)
    if (scrapedPage.url && scrapedPage.url !== this.dismissedOnUrl) {
      this.dismissedOnUrl = scrapedPage.url
      const isGoogleHome = scrapedPage.url.includes('google.com/webhp') || /google\.[a-z.]+\/?$/.test(scrapedPage.url)
      if (!isGoogleHome && scrapedPage.obstacles.length > 0) {
        await this.scraper.dismissObstacles(appId)
      }
    }
    if (scrapedPage.pageType !== 'unknown' && scrapedPage.content.length > 0) {
      const pageDescription = this.scraper.formatForLLM(scrapedPage)
      return { appId, pageDescription, networkSummary, scrapedPage, source: 'dom' }
    }

    // Fall back to DOM Brain basic description
    const pageDescription = await this.dom.getPageDescription(appId)
    if (pageDescription.includes('Interactive elements')) {
      return { appId, pageDescription, networkSummary, scrapedPage, source: 'dom' }
    }

    // Network-only
    if (networkSummary !== 'No recent API activity.') {
      return { appId, pageDescription, networkSummary, scrapedPage, source: 'network' }
    }

    // Fallback to vision (screenshot)
    logger.info({ appId }, 'Falling back to vision brain')
    const visionDescription = await this.vision.describeScreen(appId)
    return { appId, pageDescription: visionDescription, networkSummary: '', scrapedPage: undefined, source: 'vision' }
  }

  // ── Actions ──────────────────────────────────────────────────

  async act(
    appId: string,
    action: string,
    target: string,
    value?: string,
  ): Promise<boolean> {
    // Note: obstacle dismissal is handled in getAppState (once per page load),
    // NOT here on every action — that was causing the Google Apps menu bug

    switch (action) {
      case 'click':
        return this.dom.smartClick(appId, target)
      case 'type':
        return this.dom.typeInElement(appId, target, value ?? '')
      case 'scroll':
        return this.dom.scrollToElement(appId, target)
      case 'hover':
        return this.dom.hoverElement(appId, target)
      case 'press_key':
        return this.dom.pressKey(appId, target)
      case 'go_back':
        return this.dom.goBack(appId)
      case 'navigate':
        return this.dom.navigate(appId, target)
      case 'find_text':
        return this.dom.findTextOnPage(appId, target)
      case 'expand':
        return (await this.dom.expandContent(appId)) > 0
      default:
        return false
    }
  }

  // ── Visual Performance ───────────────────────────────────────

  async performVisuals(
    appId: string,
    target: string | undefined,
    intent: CursorIntent,
    glow: boolean,
  ): Promise<void> {
    if (target) {
      await this.dom.curvedMoveTo(appId, target, intent)
      if (glow) await this.dom.glowElement(appId, target)
    }
  }

  async clickWithVisuals(appId: string, target: string): Promise<boolean> {
    // Move cursor → glow → click → ripple
    await this.dom.curvedMoveTo(appId, target, 'decisive')
    await this.dom.glowElement(appId, target)
    const success = await this.dom.smartClick(appId, target)
    await this.dom.clickRipple(appId)
    return success
  }

  async scanPage(appId: string): Promise<void> {
    await this.dom.smartScanPage(appId)
  }

  async highlightKeywords(appId: string, keywords: string[]): Promise<void> {
    await this.dom.progressiveHighlight(appId, keywords)
  }

  async extractionPulse(appId: string, target: string): Promise<void> {
    await this.dom.extractionPulse(appId, target)
  }

  // ── Reactive Wait ────────────────────────────────────────────

  async waitForPageSettle(appId: string): Promise<WaitResult> {
    return this.dom.waitForPageSettle(appId)
  }

  async isPageLoading(appId: string): Promise<boolean> {
    try {
      return await this.dom.isPageLoading(appId)
    } catch {
      return false
    }
  }
}
