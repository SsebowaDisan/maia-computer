import { pino } from 'pino'
import type { NetworkBrain } from './NetworkBrain'
import type { DOMBrain } from './DOMBrain'
import type { VisionBrain } from './VisionBrain'

const logger = pino({ name: 'intelligence-router' })

export interface AppState {
  appId: string
  pageDescription: string
  networkSummary: string
  source: 'dom' | 'network' | 'vision'
}

/**
 * IntelligenceRouter decides which brain to use for each query.
 * Priority: Network Brain (fastest) → DOM Brain (fast) → Vision Brain (fallback)
 */
export class IntelligenceRouter {
  private readonly network: NetworkBrain
  private readonly dom: DOMBrain
  private readonly vision: VisionBrain

  constructor(network: NetworkBrain, dom: DOMBrain, vision: VisionBrain) {
    this.network = network
    this.dom = dom
    this.vision = vision
  }

  async getAppState(appId: string): Promise<AppState> {
    // Try DOM Brain first — gives us structured element data
    const pageDescription = await this.dom.getPageDescription(appId)

    // Also get Network Brain data — gives us API-level understanding
    const networkSummary = this.network.getAppSummary(appId)

    // If DOM returned useful data, use it
    if (pageDescription.includes('Interactive elements')) {
      return {
        appId,
        pageDescription,
        networkSummary,
        source: 'dom',
      }
    }

    // If network has data, use that
    if (networkSummary !== 'No recent API activity.') {
      return {
        appId,
        pageDescription,
        networkSummary,
        source: 'network',
      }
    }

    // Fallback to vision (screenshot)
    logger.info({ appId }, 'Falling back to vision brain')
    const visionDescription = await this.vision.describeScreen(appId)

    return {
      appId,
      pageDescription: visionDescription,
      networkSummary: '',
      source: 'vision',
    }
  }

  async scanPage(appId: string): Promise<void> {
    await this.dom.scanPageOnce(appId)
  }

  async highlightKeywords(appId: string, keywords: string[]): Promise<void> {
    await this.dom.highlightKeywords(appId, keywords)
  }

  async isPageLoading(appId: string): Promise<boolean> {
    try {
      return await this.dom.isPageLoading(appId)
    } catch {
      return false
    }
  }

  async act(
    appId: string,
    action: 'click' | 'type' | 'scroll' | 'press_key' | 'go_back',
    target: string,
    value?: string,
  ): Promise<boolean> {
    switch (action) {
      case 'click':
        return this.dom.clickElement(appId, target)
      case 'type':
        return this.dom.typeInElement(appId, target, value ?? '')
      case 'scroll':
        return this.dom.scrollToElement(appId, target)
      case 'press_key':
        return this.dom.pressKey(appId, target)
      case 'go_back':
        return this.dom.goBack(appId)
      default:
        return false
    }
  }
}
