/**
 * Maia Bridge Script — injected into every app's webview.
 *
 * This script reads the DOM and provides structured element data
 * to the DOMBrain. It also receives commands to click, type, and scroll.
 *
 * Communication happens via Electron's contextBridge / ipcRenderer.
 */
(function maiaBridge() {
  'use strict'

  /**
   * Get all interactive elements on the page with their properties.
   */
  function getElements() {
    const elements = []
    const interactiveSelectors = [
      'a[href]',
      'button',
      'input',
      'textarea',
      'select',
      '[role="button"]',
      '[role="link"]',
      '[role="textbox"]',
      '[role="searchbox"]',
      '[role="tab"]',
      '[role="menuitem"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[contenteditable="true"]',
    ]

    const allElements = document.querySelectorAll(interactiveSelectors.join(','))

    for (const el of allElements) {
      // Skip hidden elements
      if (el.offsetParent === null && el.tagName !== 'BODY' && el.tagName !== 'HTML') continue
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue

      // Build a unique selector
      const selector = buildSelector(el)

      elements.push({
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        label: el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title') || '',
        text: (el.textContent || '').trim().substring(0, 100),
        selector: selector,
        position: {
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
        },
        size: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        value: el.value || undefined,
        tagName: el.tagName.toLowerCase(),
      })
    }

    return elements
  }

  /**
   * Build a CSS selector for an element.
   */
  function buildSelector(el) {
    if (el.id) return '#' + el.id

    const parts = []
    let current = el
    let depth = 0

    while (current && current !== document.body && depth < 5) {
      let selector = current.tagName.toLowerCase()

      if (current.id) {
        return '#' + current.id + (parts.length ? ' > ' + parts.reverse().join(' > ') : '')
      }

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c.length < 30).slice(0, 2)
        if (classes.length > 0) {
          selector += '.' + classes.join('.')
        }
      }

      // Add nth-child if needed for uniqueness
      const parent = current.parentElement
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName)
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1
          selector += ':nth-child(' + index + ')'
        }
      }

      parts.push(selector)
      current = current.parentElement
      depth++
    }

    return parts.reverse().join(' > ')
  }

  /**
   * Click an element with full mouse event sequence for React/modern app compat.
   */
  function clickElement(selector) {
    const el = document.querySelector(selector)
    if (!el) return false

    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }

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

  /**
   * Type text into an element using execCommand for React compatibility.
   */
  function typeInElement(selector, text) {
    const el = document.querySelector(selector)
    if (!el) return false

    el.focus()
    el.dispatchEvent(new FocusEvent('focus', { bubbles: true }))

    // Clear existing value
    if ('value' in el && el.value) {
      el.select()
      document.execCommand('delete')
    } else if (el.getAttribute('contenteditable') === 'true') {
      el.textContent = ''
    }

    // insertText fires proper InputEvent for React controlled inputs
    if (document.execCommand('insertText', false, text)) {
      return true
    }

    // Fallback: native setter + InputEvent
    const proto = Object.getPrototypeOf(el)
    const desc = Object.getOwnPropertyDescriptor(proto, 'value')
    if (desc && desc.set) {
      desc.set.call(el, text)
    } else {
      el.value = text
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }

  /**
   * Human-like scrolling — varies speed, adds micro-pauses, and moves the cursor.
   * Feels like a real person scanning the page.
   */
  function scrollToElement(selector) {
    function humanScroll(totalDelta) {
      return new Promise(function(resolve) {
        // Split into 2-3 natural "flick" gestures with pauses between
        const totalAbs = Math.abs(totalDelta)
        const direction = totalDelta > 0 ? 1 : -1
        const flicks = totalAbs > 400 ? 3 : totalAbs > 200 ? 2 : 1
        const flickSize = totalAbs / flicks
        let flicksDone = 0

        function doFlick() {
          const thisFlick = flickSize * (0.8 + Math.random() * 0.4) * direction
          const steps = Math.floor(6 + Math.random() * 4)
          let done = 0
          let step = 0

          function tick() {
            step++
            const t = step / steps
            // Fast start, slow end — like a finger flick
            const ease = 1 - Math.pow(1 - t, 3)
            const target = thisFlick * ease
            window.scrollBy(0, target - done)
            done = target
            if (step < steps) {
              setTimeout(tick, 16 + Math.random() * 8)
            } else {
              flicksDone++
              if (flicksDone < flicks) {
                // Micro-pause between flicks — like a human scanning and deciding to scroll more
                setTimeout(doFlick, 120 + Math.random() * 200)
              } else {
                resolve(true)
              }
            }
          }
          tick()
        }
        doFlick()
      })
    }

    if (selector === 'down' || selector === 'body') {
      humanScroll(window.innerHeight * (0.5 + Math.random() * 0.3))
      return true
    }
    if (selector === 'up') {
      humanScroll(-(window.innerHeight * (0.5 + Math.random() * 0.3)))
      return true
    }

    const el = document.querySelector(selector)
    if (!el) return false
    const rect = el.getBoundingClientRect()
    const targetY = rect.top - window.innerHeight / 2 + rect.height / 2
    if (Math.abs(targetY) < 10) return true
    humanScroll(targetY)
    return true
  }

  // ── Visual Interaction System ──────────────────────────────────

  /** Inject global styles for all visual effects (once per page). */
  function injectStyles() {
    if (document.getElementById('maia-fx-styles')) return
    const style = document.createElement('style')
    style.id = 'maia-fx-styles'
    style.textContent = `
      @keyframes maia-ripple { to { width: 50px; height: 50px; opacity: 0; } }
      @keyframes maia-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); } 50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); } }
      ::highlight(maia-found) { background-color: rgba(250,204,21,0.3); }
      #maia-cursor { position:fixed; z-index:2147483647; pointer-events:none; width:20px; height:20px; border-radius:50%; background:radial-gradient(circle,rgba(59,130,246,0.9) 0%,rgba(59,130,246,0.3) 60%,transparent 70%); box-shadow:0 0 12px rgba(59,130,246,0.5); transform:translate(-50%,-50%); opacity:0; }
      #maia-scan { position:fixed; left:0; right:0; height:3px; top:0; z-index:2147483646; pointer-events:none; background:linear-gradient(90deg,transparent 0%,rgba(59,130,246,0.15) 10%,rgba(59,130,246,0.6) 50%,rgba(59,130,246,0.15) 90%,transparent 100%); box-shadow:0 0 15px rgba(59,130,246,0.3); opacity:0; }
    `
    document.head.appendChild(style)
  }

  /** Create cursor element (once per page). */
  function ensureCursor() {
    if (document.getElementById('maia-cursor')) return document.getElementById('maia-cursor')
    const c = document.createElement('div')
    c.id = 'maia-cursor'
    document.body.appendChild(c)
    return c
  }

  /** Ease-in-out cubic. */
  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /** Move virtual cursor smoothly to (x,y) over durationMs. */
  function moveCursorTo(x, y, durationMs) {
    injectStyles()
    const cursor = ensureCursor()
    const startX = parseFloat(cursor.style.left) || window.innerWidth / 2
    const startY = parseFloat(cursor.style.top) || window.innerHeight / 2
    cursor.style.opacity = '1'

    return new Promise(function(resolve) {
      const t0 = performance.now()
      function frame(now) {
        const t = Math.min((now - t0) / durationMs, 1)
        const e = ease(t)
        cursor.style.left = (startX + (x - startX) * e) + 'px'
        cursor.style.top = (startY + (y - startY) * e) + 'px'
        if (t < 1) requestAnimationFrame(frame)
        else resolve()
      }
      requestAnimationFrame(frame)
    })
  }

  /** Show a ripple burst at the current cursor position. */
  function clickRipple() {
    const cursor = ensureCursor()
    const x = parseFloat(cursor.style.left) || 0
    const y = parseFloat(cursor.style.top) || 0
    const ripple = document.createElement('div')
    ripple.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;width:0;height:0;border-radius:50%;transform:translate(-50%,-50%);background:rgba(59,130,246,0.3);animation:maia-ripple 400ms ease-out forwards;left:' + x + 'px;top:' + y + 'px;'
    document.body.appendChild(ripple)
    setTimeout(function() { ripple.remove() }, 500)
  }

  /** Hide the virtual cursor. */
  function hideCursor() {
    const cursor = document.getElementById('maia-cursor')
    if (cursor) cursor.style.opacity = '0'
  }

  /** Sweep a scan line down the page (reading animation). */
  function scanPage(durationMs) {
    injectStyles()
    let scanLine = document.getElementById('maia-scan')
    if (!scanLine) {
      scanLine = document.createElement('div')
      scanLine.id = 'maia-scan'
      document.body.appendChild(scanLine)
    }
    scanLine.style.opacity = '1'

    return new Promise(function(resolve) {
      const t0 = performance.now()
      function frame(now) {
        const t = Math.min((now - t0) / durationMs, 1)
        scanLine.style.top = (ease(t) * window.innerHeight) + 'px'
        if (t < 1) requestAnimationFrame(frame)
        else {
          scanLine.style.opacity = '0'
          resolve()
        }
      }
      requestAnimationFrame(frame)
    })
  }

  /** Highlight keywords on the page using CSS Custom Highlight API. */
  function highlightKeywords(keywords) {
    injectStyles()
    if (typeof CSS === 'undefined' || !CSS.highlights) return 0

    CSS.highlights.delete('maia-found')
    if (!keywords || keywords.length === 0) return 0

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const ranges = []
    let node
    while ((node = walker.nextNode())) {
      const parent = node.parentElement
      if (!parent || parent.offsetParent === null) continue
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue
      const text = node.textContent.toLowerCase()
      for (const kw of keywords) {
        let pos = 0
        const kwLower = kw.toLowerCase()
        while ((pos = text.indexOf(kwLower, pos)) !== -1) {
          const range = new Range()
          range.setStart(node, pos)
          range.setEnd(node, pos + kw.length)
          ranges.push(range)
          pos += kw.length
        }
      }
    }

    if (ranges.length > 0) {
      const hl = new Highlight(...ranges)
      CSS.highlights.set('maia-found', hl)
    }
    return ranges.length
  }

  /** Clear all keyword highlights. */
  function clearHighlights() {
    if (typeof CSS !== 'undefined' && CSS.highlights) {
      CSS.highlights.delete('maia-found')
    }
  }

  // Expose functions to Electron's main process via contextBridge
  if (typeof window !== 'undefined') {
    window.__maia_bridge = {
      getElements,
      clickElement,
      typeInElement,
      scrollToElement,
      // Visual interaction system
      moveCursorTo,
      clickRipple,
      hideCursor,
      scanPage,
      highlightKeywords,
      clearHighlights,
    }
  }
})()
