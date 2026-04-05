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

    // Get page content — structured for search results, article content for other pages
    let visibleText = ''
    try {
      visibleText = await this.containers.executeJavaScript(appId, `
        (function() {
          var url = window.location.href;

          // Google search results — extract structured results
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
              // Also grab the featured snippet / knowledge panel
              var featured = document.querySelector('[data-attrid], .kp-header, .Z0LcW, .IZ6rdc, .hgKElc');
              var featuredText = featured ? 'Featured answer: ' + featured.textContent.trim().substring(0, 300) + '\\n\\n' : '';
              return featuredText + 'Search results:\\n' + results.join('\\n');
            }
          }

          // Article/content page — extract only meaningful content (headings + paragraphs)
          var main = document.querySelector('article, main, [role="main"], .post-content, .article-body, .mw-parser-output, #content, .content');
          if (!main) main = document.body;
          var sections = [];
          // Only select content elements — NOT spans/divs which match everything
          var els = main.querySelectorAll('h1, h2, h3, h4, p, li, blockquote, figcaption, dt, dd');
          for (var i = 0; i < els.length && sections.length < 40; i++) {
            var el = els[i];
            if (el.offsetParent === null) continue;
            // Skip nav/footer/aside content
            if (el.closest('nav, footer, aside, header, [role="navigation"], [role="banner"]')) continue;
            var tag = el.tagName;
            var t = el.textContent.trim();
            if (t.length < 10) continue;
            if (['H1','H2','H3','H4'].includes(tag)) {
              sections.push('## ' + t.substring(0, 120));
            } else if (t.length > 20) {
              sections.push(t.substring(0, 300));
            }
          }
          if (sections.length > 3) return sections.join('\\n');

          // Fallback: walk text nodes for pages without semantic markup
          var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
          var texts = [];
          var node;
          while ((node = walker.nextNode()) && texts.length < 80) {
            var t2 = node.textContent.trim();
            if (t2.length > 10 && t2.length < 300) {
              var parent = node.parentElement;
              if (parent && parent.offsetParent !== null && !['SCRIPT','STYLE','NOSCRIPT','NAV','FOOTER'].includes(parent.tagName)) {
                if (!parent.closest('nav, footer, aside, header')) {
                  texts.push(t2);
                }
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

    const parts = [
      `Page: ${title}`,
      `URL: ${url}`,
    ]

    if (elements.length > 0) {
      parts.push(`Interactive elements (${elements.length} total, showing first 30):`)
      parts.push(...elementDescriptions)
    }

    if (visibleText) {
      const isSearchPage = url.includes('google.com/search') || url.includes('bing.com/search')
      const textLimit = isSearchPage ? 2000 : 4000
      parts.push('')
      parts.push('Visible page text:')
      parts.push(visibleText.substring(0, textLimit))
    }

    return parts.join('\n')
  }

  async isPageLoading(appId: string): Promise<boolean> {
    try {
      const result = await this.containers.executeJavaScript(appId,
        'document.readyState !== "complete"',
      ) as boolean
      return result
    } catch {
      return false
    }
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
      const success = await this.containers.scrollToElement(appId, selector)

      this.eventBus.publish({
        type: 'app.action',
        appId,
        action: 'scroll',
        target: selector,
        timestamp: Date.now(),
      })

      return success
    } catch (error) {
      logger.warn({ appId, selector, error }, 'Failed to scroll to element')
      return false
    }
  }

  async goBack(appId: string): Promise<boolean> {
    try {
      await this.containers.executeJavaScript(appId, 'window.history.back()')
      this.eventBus.publish({ type: 'app.action', appId, action: 'go_back', target: '', timestamp: Date.now() })
      return true
    } catch (error) {
      logger.warn({ appId, error }, 'Failed to go back')
      return false
    }
  }

  private lastScannedUrl = ''

  /** Move virtual cursor to an element. */
  async moveCursorTo(appId: string, selector: string): Promise<void> {
    try {
      const safeSelector = selector.replace(/'/g, "\\'").replace(/\n/g, ' ')
      await this.containers.executeJavaScript(appId, `
        (function() {
          try {
            var target = document.querySelector('${safeSelector}');
            if (!target) {
              var all = document.querySelectorAll('a,button,h3');
              for (var i = 0; i < all.length; i++) {
                if (all[i].textContent && all[i].textContent.trim().indexOf('${safeSelector}') !== -1) {
                  target = all[i]; break;
                }
              }
            }
            if (!target) return false;
            var cursor = document.getElementById('maia-cursor');
            if (!cursor) {
              var s = document.createElement('style');
              s.id = 'maia-cursor-style';
              s.textContent = '#maia-cursor{position:fixed;z-index:2147483647;pointer-events:none;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.85),rgba(59,130,246,0.2) 70%,transparent);box-shadow:0 0 10px rgba(59,130,246,0.4);transform:translate(-50%,-50%);opacity:0;}';
              document.head.appendChild(s);
              cursor = document.createElement('div');
              cursor.id = 'maia-cursor';
              document.body.appendChild(cursor);
            }
            var rect = target.getBoundingClientRect();
            cursor.style.left = (rect.left + rect.width/2) + 'px';
            cursor.style.top = (rect.top + rect.height/2) + 'px';
            cursor.style.opacity = '1';
            setTimeout(function() { cursor.style.opacity = '0'; }, 1500);
            return true;
          } catch(e) { return false; }
        })()
      `)
    } catch {
      // Non-critical
    }
  }

  /** Fire a ripple burst at the cursor's current position. */
  async clickRipple(appId: string): Promise<void> {
    try {
      await this.containers.executeJavaScript(appId, `
        (function() {
          try {
            var cursor = document.getElementById('maia-cursor');
            if (!cursor) return false;
            var x = parseFloat(cursor.style.left) || 0;
            var y = parseFloat(cursor.style.top) || 0;
            if (!document.getElementById('maia-ripple-style')) {
              var s = document.createElement('style');
              s.id = 'maia-ripple-style';
              s.textContent = '@keyframes maia-ripple{to{width:50px;height:50px;opacity:0;}}';
              document.head.appendChild(s);
            }
            var r = document.createElement('div');
            r.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;width:0;height:0;border-radius:50%;transform:translate(-50%,-50%);background:rgba(59,130,246,0.3);animation:maia-ripple 400ms ease-out forwards;left:'+x+'px;top:'+y+'px;';
            document.body.appendChild(r);
            setTimeout(function(){r.remove()}, 500);
            return true;
          } catch(e) { return false; }
        })()
      `)
    } catch {
      // Non-critical
    }
  }

  /** Run the scan line once per new page URL. */
  async scanPageOnce(appId: string): Promise<void> {
    try {
      const url = await this.containers.getURL(appId)
      if (url === this.lastScannedUrl) return
      this.lastScannedUrl = url

      await this.containers.executeJavaScript(appId, `
        (function() {
          var s = document.createElement('style');
          s.textContent = '#maia-scan{position:fixed;left:0;right:0;height:3px;top:0;z-index:2147483646;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(59,130,246,0.15) 10%,rgba(59,130,246,0.6) 50%,rgba(59,130,246,0.15) 90%,transparent 100%);box-shadow:0 0 15px rgba(59,130,246,0.3);opacity:0;}';
          document.head.appendChild(s);
          var line = document.createElement('div');
          line.id = 'maia-scan';
          document.body.appendChild(line);
          line.style.opacity = '1';
          var t0 = performance.now();
          function frame(now) {
            var t = Math.min((now - t0) / 800, 1);
            var e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
            line.style.top = (e * window.innerHeight) + 'px';
            if (t < 1) requestAnimationFrame(frame);
            else { line.style.opacity = '0'; setTimeout(function(){line.remove()}, 300); }
          }
          requestAnimationFrame(frame);
        })()
      `)
    } catch {
      // Non-critical
    }
  }

  /** Highlight exact phrases on the page (LLM-chosen). */
  async highlightKeywords(appId: string, keywords: string[]): Promise<void> {
    try {
      await this.containers.executeJavaScript(appId, `
        (function() {
          if (typeof CSS === 'undefined' || !CSS.highlights) return 0;
          CSS.highlights.delete('maia-found');
          var s = document.querySelector('#maia-hl-style');
          if (!s) { s = document.createElement('style'); s.id = 'maia-hl-style'; s.textContent = '::highlight(maia-found){background-color:rgba(250,204,21,0.35);}'; document.head.appendChild(s); }
          var keywords = ${JSON.stringify(keywords)};
          var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          var ranges = [];
          var node;
          while ((node = walker.nextNode())) {
            var parent = node.parentElement;
            if (!parent || parent.offsetParent === null) continue;
            if (['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName)) continue;
            var text = node.textContent;
            for (var k = 0; k < keywords.length; k++) {
              var idx = text.toLowerCase().indexOf(keywords[k].toLowerCase());
              while (idx !== -1) {
                var range = new Range();
                range.setStart(node, idx);
                range.setEnd(node, idx + keywords[k].length);
                ranges.push(range);
                idx = text.toLowerCase().indexOf(keywords[k].toLowerCase(), idx + keywords[k].length);
              }
            }
          }
          if (ranges.length > 0) CSS.highlights.set('maia-found', new Highlight(...ranges));
          return ranges.length;
        })()
      `)
    } catch {
      // Non-critical
    }
  }

  async pressKey(appId: string, key: string): Promise<boolean> {
    try {
      const result = await this.containers.executeJavaScript(appId, `
        (function() {
          var el = document.activeElement || document.body;
          var keyMap = { 'Enter': 13, 'Tab': 9, 'Escape': 27 };
          var keyCode = keyMap['${key}'] || 0;
          el.dispatchEvent(new KeyboardEvent('keydown', { key: '${key}', code: '${key}', keyCode: keyCode, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keypress', { key: '${key}', code: '${key}', keyCode: keyCode, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keyup', { key: '${key}', code: '${key}', keyCode: keyCode, bubbles: true }));
          if ('${key}' === 'Enter') {
            var form = el.closest('form');
            if (form) { form.submit(); return 'form-submitted'; }
          }
          return 'key-dispatched';
        })()
      `) as string
      console.log('[ACTION] pressKey', key, ':', result)

      this.eventBus.publish({
        type: 'app.action',
        appId,
        action: 'press_key',
        target: key,
        timestamp: Date.now(),
      })

      return true
    } catch (error) {
      logger.warn({ appId, key, error }, 'Failed to press key')
      return false
    }
  }
}
