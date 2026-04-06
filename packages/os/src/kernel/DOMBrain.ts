import { pino } from 'pino'
import type { WebContainerAPI, DOMElement } from '../app/WebContainer'
import type { EventBus } from '../events/EventBus'
import type { WaitResult, CursorIntent } from '@maia/shared'

const logger = pino({ name: 'dom-brain' })

/**
 * DOMBrain reads and controls app UI through the DOM.
 *
 * It uses the bridge scripts (bridge.js, scraper.js, navigator.js,
 * performer.js) injected into each app's webview.
 *
 * Capabilities:
 * - Read interactive elements (buttons, inputs, links)
 * - Smart click by text, aria-label, or selector
 * - Reactive wait (no fixed timers)
 * - Visual performance (cursor, glow, highlights)
 * - Popup/obstacle dismissal
 * - Hover for dropdown menus
 */
export class DOMBrain {
  private readonly containers: WebContainerAPI
  private readonly eventBus: EventBus
  private lastScannedUrl = ''

  constructor(containers: WebContainerAPI, eventBus: EventBus) {
    this.containers = containers
    this.eventBus = eventBus
  }

  // ── Element Reading ──────────────────────────────────────────

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

    let visibleText = ''
    try {
      visibleText = await this.containers.executeJavaScript(appId, `
        (function() {
          var url = window.location.href;
          if (url.includes('google.com/search') || url.includes('google.') && url.includes('/search')) {
            var results = [];
            document.querySelectorAll('div.g, div[data-hveid]').forEach(function(el, i) {
              if (i >= 10) return;
              var title = el.querySelector('h3');
              var snippet = el.querySelector('[data-sncf], .VwiC3b, [style*="-webkit-line-clamp"]');
              var link = el.querySelector('a[href]');
              if (title && link) {
                results.push((i+1) + '. ' + title.textContent.trim() + '\\n   ' + (snippet ? snippet.textContent.trim().substring(0, 150) : '') + '\\n   link: ' + link.href);
              }
            });
            if (results.length > 0) {
              var featured = document.querySelector('[data-attrid], .kp-header, .Z0LcW, .IZ6rdc, .hgKElc');
              var featuredText = featured ? 'Featured answer: ' + featured.textContent.trim().substring(0, 300) + '\\n\\n' : '';
              return featuredText + 'Search results:\\n' + results.join('\\n');
            }
          }
          var main = document.querySelector('article, main, [role="main"], .post-content, .article-body, .mw-parser-output, #content, .content');
          if (!main) main = document.body;
          var sections = [];
          var els = main.querySelectorAll('h1, h2, h3, h4, p, li, blockquote, figcaption, dt, dd');
          for (var i = 0; i < els.length && sections.length < 40; i++) {
            var el = els[i];
            if (el.offsetParent === null) continue;
            if (el.closest('nav, footer, aside, header, [role="navigation"], [role="banner"]')) continue;
            var tag = el.tagName;
            var t = el.textContent.trim();
            if (t.length < 10) continue;
            if (['H1','H2','H3','H4'].includes(tag)) { sections.push('## ' + t.substring(0, 120)); }
            else if (t.length > 20) { sections.push(t.substring(0, 300)); }
          }
          if (sections.length > 3) return sections.join('\\n');
          var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
          var texts = [];
          var node;
          while ((node = walker.nextNode()) && texts.length < 80) {
            var t2 = node.textContent.trim();
            if (t2.length > 10 && t2.length < 300) {
              var parent = node.parentElement;
              if (parent && parent.offsetParent !== null && !['SCRIPT','STYLE','NOSCRIPT','NAV','FOOTER'].includes(parent.tagName)) {
                if (!parent.closest('nav, footer, aside, header')) { texts.push(t2); }
              }
            }
          }
          return texts.join('\\n');
        })()
      `) as string ?? ''
    } catch {
      // Vision fallback will cover this
    }

    if (elements.length === 0 && !visibleText) {
      return `Page: ${title} (${url}). No interactive elements found.`
    }

    const elementDescriptions = elements.slice(0, 30).map((el, i) => {
      const value = el.value ? `, value: "${el.value}"` : ''
      const text = el.text ? `, text: "${el.text.substring(0, 50)}"` : ''
      return `  ${i + 1}. [${el.role}] "${el.label}"${text}${value} — at (${el.position.x}, ${el.position.y})`
    })

    const parts = [`Page: ${title}`, `URL: ${url}`]
    if (elements.length > 0) {
      parts.push(`Interactive elements (${elements.length} total, showing first 30):`)
      parts.push(...elementDescriptions)
    }
    if (visibleText) {
      const isSearchPage = url.includes('google.com/search') || url.includes('bing.com/search')
      const textLimit = isSearchPage ? 2000 : 4000
      parts.push('', 'Visible page text:', visibleText.substring(0, textLimit))
    }
    return parts.join('\n')
  }

  async isPageLoading(appId: string): Promise<boolean> {
    try {
      return await this.containers.executeJavaScript(appId, 'document.readyState !== "complete"') as boolean
    } catch {
      return false
    }
  }

  // ── Smart Navigation Actions ─────────────────────────────────

  async smartClick(appId: string, target: string): Promise<boolean> {
    try {
      const success = await this.containers.executeJavaScript(
        appId,
        `window.__maia_bridge && window.__maia_bridge.smartClick ? window.__maia_bridge.smartClick(${JSON.stringify(target)}) : false`,
      ) as boolean

      this.publishAction(appId, 'click', target)
      return success
    } catch (error) {
      logger.warn({ appId, target, error }, 'Smart click failed')
      return false
    }
  }

  async clickElement(appId: string, selector: string): Promise<boolean> {
    return this.smartClick(appId, selector)
  }

  async hoverElement(appId: string, target: string): Promise<boolean> {
    try {
      return await this.containers.executeJavaScript(
        appId,
        `window.__maia_bridge && window.__maia_bridge.hoverElement ? window.__maia_bridge.hoverElement(${JSON.stringify(target)}) : false`,
      ) as boolean
    } catch {
      return false
    }
  }

  async typeInElement(appId: string, selector: string, text: string): Promise<boolean> {
    try {
      // Use character-by-character typing for human-like behavior
      const success = await this.containers.executeJavaScript(
        appId,
        `window.__maia_bridge && window.__maia_bridge.typeCharByChar ? window.__maia_bridge.typeCharByChar(${JSON.stringify(selector)}, ${JSON.stringify(text)}, 50, 100) : false`,
      ) as boolean

      this.publishAction(appId, 'type', `${selector}: "${text}"`)
      return success
    } catch (error) {
      logger.warn({ appId, selector, error }, 'Failed to type in element')
      return false
    }
  }

  async scrollToElement(appId: string, selector: string): Promise<boolean> {
    try {
      const success = await this.containers.scrollToElement(appId, selector)
      this.publishAction(appId, 'scroll', selector)
      return success
    } catch (error) {
      logger.warn({ appId, selector, error }, 'Failed to scroll')
      return false
    }
  }

  async goBack(appId: string): Promise<boolean> {
    try {
      await this.containers.executeJavaScript(appId, 'window.history.back()')
      this.publishAction(appId, 'go_back', '')
      return true
    } catch (error) {
      logger.warn({ appId, error }, 'Failed to go back')
      return false
    }
  }

  async navigate(appId: string, url: string): Promise<boolean> {
    try {
      await this.containers.navigate(appId, url)
      this.publishAction(appId, 'navigate', url)
      return true
    } catch (error) {
      logger.warn({ appId, url, error }, 'Failed to navigate')
      return false
    }
  }

  async pressKey(appId: string, key: string): Promise<boolean> {
    try {
      // Use native OS-level key events (trusted by all sites including Google)
      const success = await this.containers.sendNativeKeyPress(appId, key)
      this.publishAction(appId, 'press_key', key)
      return success
    } catch (error) {
      logger.warn({ appId, key, error }, 'Failed to press key')
      return false
    }
  }

  async findTextOnPage(appId: string, query: string): Promise<boolean> {
    try {
      return await this.containers.executeJavaScript(
        appId,
        `window.__maia_bridge && window.__maia_bridge.findTextOnPage ? window.__maia_bridge.findTextOnPage(${JSON.stringify(query)}) : false`,
      ) as boolean
    } catch {
      return false
    }
  }

  async expandContent(appId: string): Promise<number> {
    try {
      return await this.containers.executeJavaScript(
        appId,
        'window.__maia_bridge && window.__maia_bridge.expandContent ? window.__maia_bridge.expandContent() : 0',
      ) as number
    } catch {
      return 0
    }
  }

  // ── Reactive Wait ────────────────────────────────────────────

  async waitForPageSettle(appId: string, timeoutMs: number = 10000): Promise<WaitResult> {
    try {
      const raw = await this.containers.executeJavaScript(
        appId,
        `window.__maia_bridge && window.__maia_bridge.waitForPageSettle ? window.__maia_bridge.waitForPageSettle(${timeoutMs}).then(JSON.stringify) : JSON.stringify({signal:'timeout',durationMs:0})`,
      ) as string
      return JSON.parse(raw) as WaitResult
    } catch {
      return { signal: 'timeout', durationMs: 0 }
    }
  }

  // ── Visual Performance ───────────────────────────────────────

  async curvedMoveTo(appId: string, target: string, intent: CursorIntent): Promise<void> {
    try {
      // Find element position first, then move cursor there
      await this.containers.executeJavaScript(appId, `
        (function() {
          var b = window.__maia_bridge;
          if (!b || !b.curvedMoveTo) return;
          var el = b.findElement ? b.findElement(${JSON.stringify(target)}) : document.querySelector(${JSON.stringify(target)});
          if (!el) return;
          var rect = el.getBoundingClientRect();
          return b.curvedMoveTo(rect.left + rect.width/2, rect.top + rect.height/2, ${JSON.stringify(intent)});
        })()
      `)
    } catch {
      // Non-critical visual
    }
  }

  async glowElement(appId: string, target: string): Promise<void> {
    try {
      await this.containers.executeJavaScript(
        appId,
        `window.__maia_bridge && window.__maia_bridge.glowElement ? window.__maia_bridge.glowElement(${JSON.stringify(target)}) : null`,
      )
    } catch {
      // Non-critical
    }
  }

  async clickRipple(appId: string): Promise<void> {
    try {
      await this.containers.executeJavaScript(
        appId,
        'window.__maia_bridge && window.__maia_bridge.smartClickRipple ? window.__maia_bridge.smartClickRipple() : null',
      )
    } catch {
      // Non-critical
    }
  }

  async extractionPulse(appId: string, target: string): Promise<void> {
    try {
      await this.containers.executeJavaScript(
        appId,
        `window.__maia_bridge && window.__maia_bridge.extractionPulse ? window.__maia_bridge.extractionPulse(${JSON.stringify(target)}) : null`,
      )
    } catch {
      // Non-critical
    }
  }

  async smartScanPage(appId: string): Promise<void> {
    try {
      const url = await this.containers.getURL(appId)
      if (url === this.lastScannedUrl) return
      this.lastScannedUrl = url

      await this.containers.executeJavaScript(
        appId,
        'window.__maia_bridge && window.__maia_bridge.smartScanPage ? window.__maia_bridge.smartScanPage(800) : null',
      )
    } catch {
      // Non-critical
    }
  }

  async progressiveHighlight(appId: string, keywords: string[]): Promise<void> {
    try {
      await this.containers.executeJavaScript(
        appId,
        `window.__maia_bridge && window.__maia_bridge.progressiveHighlight ? window.__maia_bridge.progressiveHighlight(${JSON.stringify(keywords)}, 300) : null`,
      )
    } catch {
      // Non-critical
    }
  }

  async hideCursor(appId: string): Promise<void> {
    try {
      await this.containers.executeJavaScript(
        appId,
        'window.__maia_bridge && window.__maia_bridge.smartHideCursor ? window.__maia_bridge.smartHideCursor() : null',
      )
    } catch {
      // Non-critical
    }
  }

  // ── Legacy Visual Methods (kept for compatibility) ───────────

  async moveCursorTo(appId: string, selector: string): Promise<void> {
    await this.curvedMoveTo(appId, selector, 'direct')
  }

  async scanPageOnce(appId: string): Promise<void> {
    await this.smartScanPage(appId)
  }

  async highlightKeywords(appId: string, keywords: string[]): Promise<void> {
    await this.progressiveHighlight(appId, keywords)
  }

  // ── Private Helpers ──────────────────────────────────────────

  private publishAction(appId: string, action: string, target: string): void {
    this.eventBus.publish({
      type: 'app.action',
      appId,
      action,
      target,
      timestamp: Date.now(),
    })
  }
}
