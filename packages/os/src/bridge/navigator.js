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

  var bridge = window.__maia_bridge || {}

  /**
   * Click an element by visible text (most reliable method).
   * Falls through a priority chain: text → aria-label → data-testid → selector.
   */
  function smartClick(target) {
    // 1. Try as CSS selector first (if it looks like one)
    if (target.startsWith('#') || target.startsWith('.') || target.startsWith('[')) {
      var bySelector = document.querySelector(target)
      if (bySelector) return dispatchClick(bySelector)
    }

    // 2. Text match — find element whose visible text contains the target
    //    Handle truncated titles: "Machine learning - Wiki..." matches "Machine learning - Wikipedia"
    var textTarget = target.toLowerCase().trim().replace(/\.{2,}$/, '') // strip trailing dots
    var candidates = document.querySelectorAll('a, button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], h1, h2, h3, h4, label, summary')
    var bestMatch = null
    var bestScore = 0
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i]
      if (el.offsetParent === null) continue
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
    return true
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

    // 1. Find ANY visible button/link with consent-related text
    var consentTexts = /^(i agree|agree|accept|accept all|allow|allow all|ok|got it|i understand|consent|continue|confirm|yes|i accept|agree and close|accept cookies|accept & close|agree & proceed)$/i
    var allButtons = document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]')
    for (var i = 0; i < allButtons.length; i++) {
      var btn = allButtons[i]
      if (btn.offsetParent === null) continue
      var btnText = (btn.textContent || btn.value || '').trim()
      if (consentTexts.test(btnText)) {
        // Check if it's inside a consent/cookie/dialog context
        var parent = btn.closest('[class*="cookie" i], [class*="consent" i], [class*="gdpr" i], [class*="privacy" i], [class*="banner" i], [class*="modal" i], [class*="overlay" i], [class*="popup" i], [role="dialog"], [role="alertdialog"], [id*="cookie" i], [id*="consent" i], [id*="gdpr" i]')
        if (parent || getComputedStyle(btn).zIndex > 100) {
          dispatchClick(btn)
          dismissed++
          break // One consent click is enough
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
  window.__maia_bridge = bridge
})()
