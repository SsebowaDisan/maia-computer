import { pino } from 'pino'
import type { WebContainerAPI } from '../app/WebContainer'
import type { NetworkBrain } from './NetworkBrain'
import type {
  ScrapedPage,
  PageType,
  PageContentItem,
  PageObstacle,
  ScrollState,
  ActiveStates,
  PageMetadata,
  PageSection,
} from '@maia/shared'

const logger = pino({ name: 'page-scraper' })

/**
 * PageScraper combines DOM scraping, network data, and page metadata
 * into a structured model the Brain can reason about.
 *
 * It calls scraper.js (injected in the webview) for DOM extraction
 * and merges with NetworkBrain data for a complete picture.
 */
export class PageScraper {
  private readonly containers: WebContainerAPI
  private readonly network: NetworkBrain

  constructor(containers: WebContainerAPI, network: NetworkBrain) {
    this.containers = containers
    this.network = network
  }

  async scrapePage(appId: string): Promise<ScrapedPage> {
    try {
      const raw = await this.containers.executeJavaScript(
        appId,
        'window.__maia_bridge && window.__maia_bridge.scrapePage ? JSON.stringify(window.__maia_bridge.scrapePage()) : null',
      ) as string | undefined

      if (!raw) return this.emptyPage(appId)

      const scraped = JSON.parse(raw) as ScrapedPage

      // Enrich with network data — structured API responses may have
      // better data than DOM scraping (exact prices, availability, etc.)
      this.enrichWithNetworkData(appId, scraped)

      return scraped
    } catch (error) {
      logger.warn({ appId, error }, 'Page scrape failed')
      return this.emptyPage(appId)
    }
  }

  async dismissObstacles(appId: string): Promise<number> {
    try {
      const result = await this.containers.executeJavaScript(
        appId,
        'window.__maia_bridge && window.__maia_bridge.dismissObstacles ? window.__maia_bridge.dismissObstacles() : 0',
      ) as number
      if (result > 0) {
        logger.info({ appId, dismissed: result }, 'Dismissed obstacles')
      }
      return result
    } catch {
      return 0
    }
  }

  async getScrollState(appId: string): Promise<ScrollState> {
    try {
      const raw = await this.containers.executeJavaScript(
        appId,
        'window.__maia_bridge && window.__maia_bridge.getScrollState ? JSON.stringify(window.__maia_bridge.getScrollState()) : null',
      ) as string | undefined

      if (!raw) return { viewportTop: 0, viewportBottom: 100, totalHeight: 0, hasMoreBelow: false, hasMoreAbove: false, lazyLoadTrigger: 'none' }
      return JSON.parse(raw) as ScrollState
    } catch {
      return { viewportTop: 0, viewportBottom: 100, totalHeight: 0, hasMoreBelow: false, hasMoreAbove: false, lazyLoadTrigger: 'none' }
    }
  }

  /** Build a text description from the scraped page for the LLM. */
  formatForLLM(scraped: ScrapedPage, maxLength: number = 4000): string {
    const parts: string[] = []

    parts.push(`Page: ${scraped.title}`)
    parts.push(`URL: ${scraped.url}`)
    parts.push(`Type: ${scraped.pageType}`)

    // Metadata
    if (scraped.metadata.datePublished) {
      parts.push(`Published: ${scraped.metadata.datePublished}`)
    }

    // JSON-LD structured data (gold — machine-readable)
    if (scraped.metadata.jsonLd.length > 0) {
      parts.push('')
      parts.push('Structured data (from page metadata):')
      parts.push(JSON.stringify(scraped.metadata.jsonLd).substring(0, 500))
    }

    // Sections
    if (scraped.sections.length > 0) {
      parts.push('')
      parts.push('Page structure:')
      for (const section of scraped.sections) {
        parts.push(`  [${section.type}] ${section.text.substring(0, 100)}`)
      }
    }

    // Content items (the main value)
    if (scraped.content.length > 0) {
      parts.push('')
      parts.push(`Content (${scraped.content.length} items):`)
      for (const item of scraped.content.slice(0, 15)) {
        const itemParts = [`  - ${item.title || item.type}`]
        if (item.price) itemParts.push(`price: ${item.price}`)
        if (item.rating) itemParts.push(`rating: ${item.rating}`)
        if (item.reviewCount) itemParts.push(`${item.reviewCount} reviews`)
        if (item.location) itemParts.push(`location: ${item.location}`)
        if (item.text) itemParts.push(`"${item.text.substring(0, 150)}"`)
        if (item.link) itemParts.push(`link: ${item.link}`)
        parts.push(itemParts.join(' | '))
      }
    }

    // Scroll state
    parts.push('')
    parts.push(`Scroll: viewing ${scraped.scrollState.viewportTop}%-${scraped.scrollState.viewportBottom}% of page`)
    if (scraped.scrollState.hasMoreBelow) parts.push('  More content below — scroll to see it')

    // Obstacles
    if (scraped.obstacles.length > 0) {
      parts.push('')
      parts.push('Obstacles detected: ' + scraped.obstacles.map((o) => o.type).join(', '))
    }

    // Active states
    if (scraped.activeStates.selectedTab) {
      parts.push(`Active tab: ${scraped.activeStates.selectedTab}`)
    }

    const result = parts.join('\n')
    return result.length > maxLength ? result.substring(0, maxLength) + '\n[truncated]' : result
  }

  private enrichWithNetworkData(appId: string, scraped: ScrapedPage): void {
    const networkData = this.network.getAppData(appId)
    if (networkData.recentRequests.length === 0) return

    // Look for structured data in API responses that matches page content
    for (const req of networkData.recentRequests.slice(-5)) {
      if (typeof req.body !== 'object' || !req.body) continue
      const bodyStr = JSON.stringify(req.body)

      // If API response contains price/rating data, add to metadata
      if (bodyStr.includes('"price"') || bodyStr.includes('"rate"') || bodyStr.includes('"rating"')) {
        scraped.metadata.jsonLd.push({
          '@source': 'network_brain',
          '@url': req.url,
          data: req.body,
        })
        break // One enrichment is enough
      }
    }
  }

  private emptyPage(appId: string): ScrapedPage {
    return {
      pageType: 'unknown' as PageType,
      url: '',
      title: '',
      metadata: { description: '', language: 'unknown', datePublished: undefined, canonical: undefined, jsonLd: [], openGraph: {} },
      sections: [],
      content: [],
      scrollState: { viewportTop: 0, viewportBottom: 100, totalHeight: 0, hasMoreBelow: false, hasMoreAbove: false, lazyLoadTrigger: 'none' },
      activeStates: { selectedTab: undefined, openDropdown: undefined, checkedItems: [], expandedSections: [], focusedElement: undefined },
      interactiveElements: [],
      obstacles: [],
    }
  }
}
