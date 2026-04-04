import { pino } from 'pino'
import type { WebContainerAPI, DOMElement } from '../app/WebContainer'
import type { EventBus } from '../events/EventBus'

const logger = pino({ name: 'dom-brain' })

/**
 * DOMBrain reads and controls app UI through the DOM.
 *
 * It uses the WebContainerAPI to:
 * 1. Inject a bridge script into each app's webview
 * 2. Query interactive elements (buttons, inputs, links)
 * 3. Perform actions (click, type, scroll)
 *
 * This is faster and more reliable than screenshot-based approaches
 * because it reads structured data (element roles, labels, positions)
 * instead of analyzing pixels.
 */
export class DOMBrain {
  private readonly containers: WebContainerAPI
  private readonly eventBus: EventBus

  constructor(containers: WebContainerAPI, eventBus: EventBus) {
    this.containers = containers
    this.eventBus = eventBus
  }

  async getElements(appId: string): Promise<DOMElement[]> {
    try {
      return await this.containers.getElements(appId)
    } catch (error) {
      logger.warn({ appId, error }, 'Failed to get DOM elements')
      return []
    }
  }

  async getPageDescription(appId: string): Promise<string> {
    const elements = await this.getElements(appId)
    const title = await this.containers.getTitle(appId)
    const url = await this.containers.getURL(appId)

    if (elements.length === 0) {
      return `Page: ${title} (${url}). No interactive elements found.`
    }

    const elementDescriptions = elements.slice(0, 30).map((el, i) => {
      const value = el.value ? `, value: "${el.value}"` : ''
      const text = el.text ? `, text: "${el.text.substring(0, 50)}"` : ''
      return `  ${i + 1}. [${el.role}] "${el.label}"${text}${value} — at (${el.position.x}, ${el.position.y})`
    })

    return [
      `Page: ${title}`,
      `URL: ${url}`,
      `Interactive elements (${elements.length} total, showing first 30):`,
      ...elementDescriptions,
    ].join('\n')
  }

  async clickElement(appId: string, selector: string): Promise<boolean> {
    try {
      const success = await this.containers.clickElement(appId, selector)

      this.eventBus.publish({
        type: 'app.action',
        appId,
        action: 'click',
        target: selector,
        timestamp: Date.now(),
      })

      return success
    } catch (error) {
      logger.warn({ appId, selector, error }, 'Failed to click element')
      return false
    }
  }

  async typeInElement(appId: string, selector: string, text: string): Promise<boolean> {
    try {
      const success = await this.containers.typeInElement(appId, selector, text)

      this.eventBus.publish({
        type: 'app.action',
        appId,
        action: 'type',
        target: `${selector}: "${text}"`,
        timestamp: Date.now(),
      })

      return success
    } catch (error) {
      logger.warn({ appId, selector, error }, 'Failed to type in element')
      return false
    }
  }

  async scrollToElement(appId: string, selector: string): Promise<boolean> {
    try {
      return await this.containers.scrollToElement(appId, selector)
    } catch (error) {
      logger.warn({ appId, selector, error }, 'Failed to scroll to element')
      return false
    }
  }
}
