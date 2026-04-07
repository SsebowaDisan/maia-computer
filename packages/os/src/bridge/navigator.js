/**
 * Maia Smart Navigator — injected into every app's webview.
 *
 * Handles: text-based clicking, reactive wait, popup dismissal,
 * hover, find-text, expand hidden content.
 *
 * Extends window.__maia_bridge with navigation functions.
 */
;(function maiaNavigatorBridge() {
  'use strict'

  // Prevent "No Internet connection" banners from appearing.
  // Google and other sites detect brief offline states during bridge injection.
  // We override navigator.onLine and suppress the offline event.
  Object.defineProperty(navigator, 'onLine', { get: function() { return true }, configurable: true })
  window.addEventListener('offline', function(e) { e.stopImmediatePropagation() }, true)

  // Also dismiss any existing offline banners
  setTimeout(function() {
    var offlineBanners = document.querySelectorAll('[class*="offline" i], [id*="offline" i], [class*="no-internet" i]')
    for (var i = 0; i < offlineBanners.length; i++) {
      offlineBanners[i].style.display = 'none'
    }
  }, 1000)

  var bridge = window.__maia_bridge || {}

  /**
   * Click an element by visible text (most reliable method).
   * Falls through a priority chain: text → aria-label → data-testid → selector.
   */
  // Elements the agent must NEVER click — voice, microphone, lens, camera buttons
  var NEVER_CLICK_SELECTORS = '[aria-label*="voice" i], [aria-label*="microphone" i], [aria-label*="mic" i], [aria-label*="camera" i], [aria-label*="lens" i], [aria-label*="Search by" i], [aria-label*="Google apps" i], [data-text-ad="1"]'

  function isProtectedElement(el) {
    if (!el) return false
    if (el.matches(NEVER_CLICK_SELECTORS)) return true
    if (el.closest(NEVER_CLICK_SELECTORS)) return true
    if (el.closest('#tads, #bottomads')) return true
    return false
  }

  function smartClick(target) {
    // 1. Try as CSS selector first (if it looks like one)
    if (target.startsWith('#') || target.startsWith('.') || target.startsWith('[')) {
      var bySelector = document.querySelector(target)
      if (bySelector && !isProtectedElement(bySelector)) return dispatchClick(bySelector)
    }

    // 2. Text match — find element whose visible text contains the target
    var textTarget = target.toLowerCase().trim().replace(/\.{2,}$/, '')
    var candidates = document.querySelectorAll('a, button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], h1, h2, h3, h4, label, summary')
    var bestMatch = null
    var bestScore = 0
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i]
      if (el.offsetParent === null) continue
      // Never click protected elements (mic, voice, lens, ads)
      if (isProtectedElement(el)) continue
      var text = (el.textContent || '').trim().toLowerCase().replace(/\.{2,}$/, '')
      if (text === textTarget) return dispatchClick(el) // Exact match
      if (text.includes(textTarget) || textTarget.includes(text)) {
        // Partial match — score by overlap length
        var overlap = Math.min(text.length, textTarget.length)
        if (overlap > bestScore) { bestScore = overlap; bestMatch = el }
      }
      // Fuzzy: first N characters match (handles truncation)
      var minLen = Math.min(text.length, textTarget.length)
      if (minLen > 15 && text.substring(0, minLen) === textTarget.substring(0, minLen)) {
        if (minLen > bestScore) { bestScore = minLen; bestMatch = el }
      }
    }
    if (bestMatch && bestScore > 10) return dispatchClick(bestMatch)

    // 3. Aria-label match
    var byAria = document.querySelector('[aria-label*="' + target.replace(/"/g, '\\"') + '" i]')
    if (byAria) return dispatchClick(byAria)

    // 4. data-testid match
    var byTestId = document.querySelector('[data-testid*="' + target.replace(/"/g, '\\"') + '" i], [data-qa*="' + target.replace(/"/g, '\\"') + '" i]')
    if (byTestId) return dispatchClick(byTestId)

    // 5. Any element with cursor:pointer containing the text
    var allEls = document.querySelectorAll('*')
    for (var j = 0; j < allEls.length && j < 2000; j++) {
      var elem = allEls[j]
      if (elem.offsetParent === null) continue
      if (elem.children.length > 3) continue // Skip containers
      var elemText = (elem.textContent || '').trim().toLowerCase()
      if (elemText.length > 200) continue
      if (elemText.includes(textTarget)) {
        var style = getComputedStyle(elem)
        if (style.cursor === 'pointer') return dispatchClick(elem)
      }
    }

    // 6. Last resort — try original bridge click
    if (bridge.clickElement) return bridge.clickElement(target)
    return false
  }

  /** Dispatch full mouse event sequence for React compat. */
  function dispatchClick(el) {
    // Scroll the element into view first so the user can see what's being clicked
    var rect = el.getBoundingClientRect()
    var isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight

    if (!isInViewport) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Wait for smooth scroll to complete before clicking (350ms)
      return new Promise(function(resolve) {
        setTimeout(function() {
          fireClickEvents(el)
          resolve(true)
        }, 350)
      })
    }

    fireClickEvents(el)
    return true
  }

  function fireClickEvents(el) {
    var rect = el.getBoundingClientRect()
    var cx = rect.left + rect.width / 2
    var cy = rect.top + rect.height / 2
    var opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }

    el.dispatchEvent(new PointerEvent('pointerover', opts))
    el.dispatchEvent(new MouseEvent('mouseover', opts))
    el.dispatchEvent(new PointerEvent('pointerdown', opts))
    el.dispatchEvent(new MouseEvent('mousedown', opts))
    if (el.focus) el.focus()
    el.dispatchEvent(new PointerEvent('pointerup', opts))
    el.dispatchEvent(new MouseEvent('mouseup', opts))
    el.dispatchEvent(new MouseEvent('click', opts))
  }

  /** Hover over an element to reveal dropdowns, tooltips, previews. */
  function hoverElement(target) {
    var el = findElement(target)
    if (!el) return false
    var rect = el.getBoundingClientRect()
    var opts = { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
    el.dispatchEvent(new PointerEvent('pointerenter', opts))
    el.dispatchEvent(new MouseEvent('mouseenter', opts))
    el.dispatchEvent(new PointerEvent('pointerover', opts))
    el.dispatchEvent(new MouseEvent('mouseover', opts))
    return true
  }

  /** Find element by text or selector (shared helper). */
  function findElement(target) {
    // CSS selector
    if (target.startsWith('#') || target.startsWith('.') || target.startsWith('[')) {
      var bySelector = document.querySelector(target)
      if (bySelector) return bySelector
    }
    // Text match
    var textTarget = target.toLowerCase().trim()
    var candidates = document.querySelectorAll('a, button, [role="button"], [role="link"], [role="tab"], h1, h2, h3, h4, label, summary, input, textarea, select')
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].offsetParent === null) continue
      var text = (candidates[i].textContent || '').trim().toLowerCase()
      if (text === textTarget || text.includes(textTarget)) return candidates[i]
    }
    // Aria-label
    return document.querySelector('[aria-label*="' + target.replace(/"/g, '\\"') + '" i]')
  }

  /**
   * Reactive wait — watches for DOM/URL/network changes instead of fixed timers.
   * Resolves with the signal that fired first.
   */
  function waitForPageSettle(timeoutMs) {
    timeoutMs = timeoutMs || 10000
    return new Promise(function(resolve) {
      var settled = false
      var debounceTimer = null
      var originalUrl = location.href

      function done(signal) {
        if (settled) return
        settled = true
        observer.disconnect()
        clearInterval(urlCheck)
        resolve({ signal: signal, durationMs: Math.round(performance.now() - startTime) })
      }

      var startTime = performance.now()

      // 1. MutationObserver — watch for new content
      var observer = new MutationObserver(function(mutations) {
        var hasNewContent = mutations.some(function(m) { return m.addedNodes.length > 0 })
        if (!hasNewContent) return
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(function() { done('dom_changed') }, 400)
      })
      observer.observe(document.body, { childList: true, subtree: true })

      // 2. URL change detection
      var urlCheck = setInterval(function() {
        if (location.href !== originalUrl) done('url_changed')
      }, 50)

      // 3. Listen for transition/animation end
      document.addEventListener('transitionend', function onTransEnd() {
        document.removeEventListener('transitionend', onTransEnd)
        if (!settled) setTimeout(function() { done('transition_end') }, 100)
      }, { once: true })

      // 4. Timeout fallback
      setTimeout(function() { done('timeout') }, timeoutMs)

      // 5. Quick resolve if page is already idle (no pending resources)
      if (document.readyState === 'complete') {
        setTimeout(function() { if (!settled) done('dom_changed') }, 500)
      }
    })
  }

  /** Dismiss all detected popups, cookie banners, and overlays on the page. */
  function dismissObstacles() {
    var dismissed = 0

    // 1. Find ANY visible button with consent-related text
    var consentTexts = /^(i agree|agree|accept|accept all|allow|allow all|ok|got it|i understand|consent|continue|confirm|yes|i accept|agree and close|accept cookies|accept & close|agree & proceed|tout accepter|accepter|alles accepteren|alle akzeptieren|akkoord)$/i
    var allButtons = document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]')
    for (var i = 0; i < allButtons.length; i++) {
      var btn = allButtons[i]
      if (btn.offsetParent === null) continue
      var btnText = (btn.textContent || btn.value || '').trim()
      if (consentTexts.test(btnText)) {
        // Check if inside a consent/cookie/dialog context
        var parent = btn.closest('[class*="cookie" i], [class*="consent" i], [class*="gdpr" i], [class*="privacy" i], [class*="banner" i], [class*="modal" i], [class*="overlay" i], [class*="popup" i], [role="dialog"], [role="alertdialog"], [id*="cookie" i], [id*="consent" i], [id*="gdpr" i]')
        if (parent || parseInt(getComputedStyle(btn).zIndex || '0') > 100) {
          fireClickEvents(btn)
          dismissed++
          break
        }
        // Aggressive fallback: if the page has very few buttons and one says "Accept all", click it
        if (!parent && btnText.toLowerCase().includes('accept')) {
          var visibleButtons = Array.from(allButtons).filter(function(b) { return b.offsetParent !== null })
          if (visibleButtons.length <= 5) {
            fireClickEvents(btn)
            dismissed++
            break
          }
        }
      }
    }

    // 1b. If nothing matched above, look for ANY button containing "accept" or "agree" anywhere on page
    if (dismissed === 0) {
      for (var a = 0; a < allButtons.length; a++) {
        var abtn = allButtons[a]
        if (abtn.offsetParent === null) continue
        var atext = (abtn.textContent || abtn.value || '').trim().toLowerCase()
        if ((atext.includes('accept') || atext.includes('agree') || atext.includes('consent')) && atext.length < 30) {
          // Check if it looks like a consent button (fixed/sticky position, high z-index, or in a banner)
          var astyle = getComputedStyle(abtn)
          var aparent = abtn.closest('[style*="fixed"], [style*="sticky"], [class*="banner" i], [class*="cookie" i]')
          if (aparent || astyle.position === 'fixed' || parseInt(astyle.zIndex || '0') > 50) {
            fireClickEvents(abtn)
            dismissed++
            break
          }
        }
      }
    }

    // 2. If no consent button found, try close/dismiss buttons on dialogs
    if (dismissed === 0) {
      var closeTexts = /^(close|x|×|✕|dismiss|no thanks|not now|maybe later|skip|cancel|reject|reject all|decline|i do not agree)$/i
      document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button, [class*="modal" i] button, [class*="overlay" i] button').forEach(function(el) {
        if (dismissed > 0) return
        if (el.offsetParent === null) return
        var text = (el.textContent || '').trim()
        var ariaLabel = (el.getAttribute('aria-label') || '').trim()
        if (closeTexts.test(text) || closeTexts.test(ariaLabel) || ariaLabel.toLowerCase().includes('close')) {
          dispatchClick(el)
          dismissed++
        }
      })
    }

    // 3. Try clicking any high z-index close button (X buttons)
    if (dismissed === 0) {
      document.querySelectorAll('button, [role="button"]').forEach(function(el) {
        if (dismissed > 0) return
        if (el.offsetParent === null) return
        var style = getComputedStyle(el)
        if (parseInt(style.zIndex) < 500) return
        var text = (el.textContent || '').trim()
        var ariaLabel = (el.getAttribute('aria-label') || '')
        if (text.length <= 2 || /close/i.test(ariaLabel)) {
          dispatchClick(el)
          dismissed++
        }
      })
    }

    // 4. Press Escape as last resort
    if (dismissed === 0) {
      var hasOverlay = document.querySelector('[role="dialog"], [class*="modal" i]:not([style*="display: none"]), [class*="overlay" i]:not([style*="display: none"])')
      if (hasOverlay && hasOverlay.offsetParent !== null) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        dismissed++
      }
    }

    return dismissed
  }

  /** Ctrl+F equivalent — find text on page and scroll to it. */
  function findTextOnPage(query) {
    var lowerQuery = query.toLowerCase()
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    var node
    while ((node = walker.nextNode())) {
      var parent = node.parentElement
      if (!parent || parent.offsetParent === null) continue
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue
      if ((node.textContent || '').toLowerCase().includes(lowerQuery)) {
        parent.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Highlight via CSS Highlight API if available
        if (typeof CSS !== 'undefined' && CSS.highlights) {
          CSS.highlights.delete('maia-find')
          var idx = node.textContent.toLowerCase().indexOf(lowerQuery)
          var range = new Range()
          range.setStart(node, idx)
          range.setEnd(node, idx + query.length)
          CSS.highlights.set('maia-find', new Highlight(range))
        }
        return true
      }
    }
    return false
  }

  /** Expand collapsed/hidden content — "Show more", accordions, etc. */
  function expandContent() {
    var expanded = 0
    // Click "Show more" / "Load more" / "See all" buttons
    document.querySelectorAll('button, a, [role="button"]').forEach(function(el) {
      if (el.offsetParent === null) return
      var text = (el.textContent || '').trim().toLowerCase()
      if (text.match(/^(show more|load more|see more|see all|view all|read more|expand|show all)$/i)) {
        dispatchClick(el)
        expanded++
      }
    })
    // Expand collapsed accordions
    document.querySelectorAll('[aria-expanded="false"]').forEach(function(el) {
      if (el.offsetParent === null) return
      dispatchClick(el)
      expanded++
    })
    return expanded
  }

  /** Type text character by character with variable speed. */
  function typeCharByChar(selector, text, minDelay, maxDelay) {
    minDelay = minDelay || 50
    maxDelay = maxDelay || 100
    var el = findElement(selector) || document.querySelector(selector)
    if (!el) return Promise.resolve(false)

    el.focus()
    el.dispatchEvent(new FocusEvent('focus', { bubbles: true }))

    // Clear existing value
    if ('value' in el && el.value) {
      el.select()
      document.execCommand('delete')
    } else if (el.getAttribute('contenteditable') === 'true') {
      el.textContent = ''
    }

    return new Promise(function(resolve) {
      var i = 0
      function typeNext() {
        if (i >= text.length) return resolve(true)
        var char = text[i]
        document.execCommand('insertText', false, char)
        i++
        var delay = minDelay + Math.random() * (maxDelay - minDelay)
        // Thinking pause before capitals and numbers
        if (i < text.length && /[A-Z0-9]/.test(text[i])) delay += 80 + Math.random() * 120
        setTimeout(typeNext, delay)
      }
      typeNext()
    })
  }

  /** Check if an element is an ad or sponsored content. */
  function isAdElement(el) {
    if (!el) return false
    // Check for common ad indicators
    var text = (el.textContent || '').toLowerCase()
    var classes = (el.className || '').toLowerCase()
    var parent = el.closest('[data-text-ad], [id="tads"], [class*="sponsor"], [class*="advert"], [aria-label*="sponsor" i], [aria-label*="advert" i]')
    if (parent) return true
    if (classes.match(/\b(ad|ads|advert|sponsor|promoted)\b/)) return true
    // Check link for tracking params
    var href = el.getAttribute('href') || ''
    if (href.match(/[?&](gclid|gad_source|msclkid|fbclid)=/)) return true
    return false
  }

  /**
   * Get RICH search results from a Google search page.
   * Captures everything: titles, URLs, snippets, knowledge panel, People Also Ask, sitelinks.
   * The agent sees the FULL picture, not just link titles.
   */
  function getSearchResults() {
    var results = { organic: [], knowledgePanel: null, peopleAlsoAsk: [], aiOverview: null }

    // 1. Organic search results — using verified 2025/2026 selectors from manifest
    // Primary container: .tF2Cxc, fallbacks: .g, a:has(h3)
    var resultContainers = document.querySelectorAll('.tF2Cxc, .g')
    var seen = new Set()
    for (var i = 0; i < resultContainers.length && i < 15; i++) {
      var container = resultContainers[i]

      // Skip ads — verified selectors
      if (container.closest('#tads, #bottomads, [data-text-ad="1"]')) continue

      // Title: h3 (verified stable)
      var titleEl = container.querySelector('h3')
      if (!titleEl) continue

      // Link: .yuRUbf a (verified), fallback: a:has(h3), then any a[href]
      var linkEl = container.querySelector('.yuRUbf a') || container.querySelector('a:has(h3)') || container.querySelector('a[href]')
      if (!linkEl) continue

      var href = linkEl.href
      if (!href || href.includes('google.com/search') || seen.has(href)) continue
      seen.add(href)

      // Snippet: [data-sncf] (verified 2026), fallback: .VwiC3b
      var snippetEl = container.querySelector('[data-sncf]') || container.querySelector('.VwiC3b')

      // Sitelinks: all additional a[href] within container that aren't the title
      var sitelinks = []
      var allLinks = container.querySelectorAll('a[href]')
      for (var s = 0; s < allLinks.length && s < 8; s++) {
        if (allLinks[s] !== linkEl && allLinks[s].textContent.trim().length > 1) {
          sitelinks.push(allLinks[s].textContent.trim())
        }
      }

      var rect = container.getBoundingClientRect()
      results.organic.push({
        position: results.organic.length + 1,
        title: titleEl.textContent.trim(),
        url: href,
        displayUrl: href.replace(/^https?:\/\/(www\.)?/, '').split('/').slice(0, 2).join('/'),
        snippet: snippetEl ? snippetEl.textContent.trim().substring(0, 300) : '',
        sitelinks: sitelinks.slice(0, 4),
        date: null,
        visible: rect.top < window.innerHeight && rect.bottom > 0,
      })
    }

    // If .tF2Cxc/.g found nothing, try structure-based fallback: any a containing h3
    if (results.organic.length === 0) {
      var fallbackLinks = document.querySelectorAll('a:has(h3)')
      for (var fb = 0; fb < fallbackLinks.length && fb < 15; fb++) {
        var fbLink = fallbackLinks[fb]
        if (fbLink.closest('#tads, #bottomads, [data-text-ad="1"]')) continue
        var fbHref = fbLink.href
        if (!fbHref || fbHref.includes('google.com/search') || seen.has(fbHref)) continue
        seen.add(fbHref)
        var fbTitle = fbLink.querySelector('h3')
        var fbRect = fbLink.getBoundingClientRect()
        results.organic.push({
          position: results.organic.length + 1,
          title: fbTitle ? fbTitle.textContent.trim() : fbLink.textContent.trim().substring(0, 100),
          url: fbHref,
          displayUrl: fbHref.replace(/^https?:\/\/(www\.)?/, '').split('/').slice(0, 2).join('/'),
          snippet: '',
          sitelinks: [],
          date: null,
          visible: fbRect.top < window.innerHeight && fbRect.bottom > 0,
        })
      }
    }

    // 2. Knowledge Panel — verified selectors: .kp-wholepage, data-attrid, .kno-rdesc
    var kpEl = document.querySelector('.kp-wholepage, #rhs .kp-wholepage')
    if (kpEl) {
      var kpTitle = ''
      var kpTitleEl = kpEl.querySelector('[data-attrid="title"]') || kpEl.querySelector('h2')
      if (kpTitleEl) kpTitle = kpTitleEl.textContent.trim()

      var kpFacts = {}
      // Verified: data-attrid starting with kc:/ or ss:/ contain facts
      var factEls = kpEl.querySelectorAll('div[data-attrid^="kc:/"], div[data-attrid^="ss:/"]')
      for (var f = 0; f < factEls.length && f < 15; f++) {
        var factText = factEls[f].textContent.trim()
        var colonIdx = factText.indexOf(':')
        if (colonIdx > 0 && colonIdx < 40) {
          kpFacts[factText.substring(0, colonIdx).trim()] = factText.substring(colonIdx + 1).trim()
        }
      }

      // Description: .kno-rdesc span (verified)
      var kpDescEl = kpEl.querySelector('.kno-rdesc span')
      var kpDescription = kpDescEl ? kpDescEl.textContent.trim().substring(0, 500) : ''

      if (kpTitle || Object.keys(kpFacts).length > 0 || kpDescription) {
        results.knowledgePanel = { title: kpTitle, facts: kpFacts, description: kpDescription }
      }
    }

    // 3. People Also Ask — verified: [data-sgrd='true'], [aria-expanded], [jsname='Cpkphb']
    var paaEls = document.querySelectorAll('[data-sgrd="true"] [role="heading"], [aria-expanded] [role="heading"], [jsname="Cpkphb"]')
    for (var p = 0; p < paaEls.length && p < 5; p++) {
      results.peopleAlsoAsk.push(paaEls[p].textContent.trim())
    }

    // 4. AI Overview (visible preview text — NOT clicking "Show more")
    var aiEl = document.querySelector('[data-attrid="wa:/description"], .kp-blk .kno-rdesc, .wDYxhc')
    if (aiEl) {
      var aiText = aiEl.textContent.trim().substring(0, 600)
      if (aiText.length > 50) {
        results.aiOverview = aiText
      }
    }

    return results
  }

  /** Get all links on the page — filtered to exclude UI controls, ads, and junk. */
  function getLinks() {
    var links = []
    // Elements to skip: voice/mic/lens buttons, Google UI elements
    var skipSelectors = [
      '[aria-label*="voice" i]', '[aria-label*="microphone" i]', '[aria-label*="mic" i]',
      '[aria-label*="camera" i]', '[aria-label*="lens" i]', '[aria-label*="image" i]',
      '[aria-label*="Search by" i]', '[aria-label*="Google apps" i]',
      '#tads', '#bottomads', '[data-text-ad="1"]',
      'footer', '[role="navigation"]', '[role="banner"]',
    ].join(', ')

    var elements = document.querySelectorAll('a[href]')
    for (var i = 0; i < elements.length && i < 200; i++) {
      var el = elements[i]
      if (!el || el.offsetParent === null) continue

      // Skip UI controls (mic, lens, voice, apps grid, etc.)
      if (el.closest(skipSelectors) || el.matches(skipSelectors)) continue

      // Skip elements that are just icons (no real text)
      var text = (el.textContent || '').trim()
      if (text.length < 3 || text.length > 200) continue

      // Skip non-navigable links
      var href = el.href || ''
      if (!href || href === '#' || href.startsWith('javascript:')) continue

      // Skip Google internal UI links
      if (href.includes('accounts.google') || href.includes('support.google') || href.includes('policies.google')) continue

      var rect = el.getBoundingClientRect()
      var visible = rect.top >= 0 && rect.bottom <= window.innerHeight && rect.top < window.innerHeight
      links.push({ text: text, href: href, visible: visible })
    }
    return links
  }

  /**
   * Get page structure — headings, TOC links, sections.
   * Used by ChromeAgent to navigate directly to relevant sections.
   */
  function getPageStructure() {
    var structure = { headings: [], tocLinks: [], type: 'unknown' }

    // Detect page type
    var url = location.href
    if (url.includes('wikipedia.org')) structure.type = 'wikipedia'
    else if (url.includes('worldbank.org')) structure.type = 'worldbank'
    else if (url.includes('/search')) structure.type = 'search_results'
    else structure.type = 'article'

    // Get all headings with positions
    var headings = document.querySelectorAll('h1, h2, h3, h4')
    for (var i = 0; i < headings.length && i < 30; i++) {
      var h = headings[i]
      if (h.offsetParent === null) continue
      var text = h.textContent.trim()
      if (text.length < 2 || text.length > 100) continue
      structure.headings.push({
        level: parseInt(h.tagName.charAt(1)),
        text: text,
        top: Math.round(h.getBoundingClientRect().top + window.scrollY),
      })
    }

    // Get TOC links (Wikipedia, docs with table of contents)
    var tocEls = document.querySelectorAll('#toc a, .toc a, [class*="table-of-contents"] a, nav[role="navigation"] a')
    for (var t = 0; t < tocEls.length && t < 20; t++) {
      var tocText = tocEls[t].textContent.trim()
      if (tocText.length > 2) {
        structure.tocLinks.push(tocText)
      }
    }

    return structure
  }

  /** Get readable text content from the page — used by agents for extraction. */
  function getPageText(maxLength) {
    maxLength = maxLength || 5000
    var parts = []
    var contentEls = document.querySelectorAll('main p, main li, main h1, main h2, main h3, main h4, article p, article li, article h1, article h2, article h3, [role="main"] p, [role="main"] li')
    if (contentEls.length === 0) {
      contentEls = document.querySelectorAll('p, li, h1, h2, h3, h4, td, th, blockquote, figcaption')
    }
    var totalLength = 0
    for (var i = 0; i < contentEls.length; i++) {
      var text = (contentEls[i].textContent || '').trim()
      if (text.length < 10) continue
      if (totalLength + text.length > maxLength) break
      var tag = contentEls[i].tagName.toLowerCase()
      if (/^h[1-6]$/.test(tag)) {
        parts.push('\n## ' + text)
      } else {
        parts.push(text)
      }
      totalLength += text.length
    }
    return parts.join('\n')
  }

  /** Clear an input field — used by agents before typing. */
  function clearInput(selector) {
    var el = document.querySelector(selector)
    if (!el) return false
    var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
    if (setter && setter.set) {
      setter.set.call(el, '')
    } else {
      var inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
      if (inputSetter && inputSetter.set) {
        inputSetter.set.call(el, '')
      } else {
        el.value = ''
      }
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.focus()
    return true
  }

  // Expose
  bridge.smartClick = smartClick
  bridge.hoverElement = hoverElement
  bridge.findElement = findElement
  bridge.waitForPageSettle = waitForPageSettle
  bridge.dismissObstacles = dismissObstacles
  bridge.findTextOnPage = findTextOnPage
  bridge.expandContent = expandContent
  bridge.typeCharByChar = typeCharByChar
  bridge.isAdElement = isAdElement
  bridge.dispatchClick = dispatchClick
  bridge.getSearchResults = getSearchResults
  bridge.getPageStructure = getPageStructure
  bridge.getLinks = getLinks
  bridge.getPageText = getPageText
  bridge.clearInput = clearInput
  window.__maia_bridge = bridge
})()
