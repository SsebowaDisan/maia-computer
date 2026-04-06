/**
 * Maia Visual Performer — injected into every app's webview.
 *
 * Handles: curved cursor movement, element glow, progressive
 * highlighting, content extraction pulse, scan speed variation.
 *
 * Extends window.__maia_bridge with visual performance functions.
 */
;(function maiaPerformerBridge() {
  'use strict'

  var bridge = window.__maia_bridge || {}

  /** Inject performer styles (once per page). */
  function injectPerformerStyles() {
    if (document.getElementById('maia-perf-styles')) return
    var s = document.createElement('style')
    s.id = 'maia-perf-styles'
    s.textContent = [
      '@keyframes maia-glow-pulse{0%{box-shadow:0 0 0 0 rgba(59,130,246,0.4)}50%{box-shadow:0 0 0 6px rgba(59,130,246,0.15)}100%{box-shadow:0 0 0 0 rgba(59,130,246,0)}}',
      '@keyframes maia-extract-pulse{0%{box-shadow:0 0 0 0 rgba(59,130,246,0.6)}100%{box-shadow:0 0 8px 4px rgba(59,130,246,0)}}',
      '@keyframes maia-ripple-burst{to{width:50px;height:50px;opacity:0}}',
      '.maia-glow{outline:2px solid rgba(59,130,246,0.6);outline-offset:2px;animation:maia-glow-pulse 300ms ease-out;border-radius:4px}',
      '.maia-extract{animation:maia-extract-pulse 400ms ease-out}',
      '::highlight(maia-found){background-color:rgba(250,204,21,0.35)}',
      '::highlight(maia-find){background-color:rgba(59,130,246,0.3)}',
      '#maia-cursor{position:fixed;z-index:2147483647;pointer-events:none;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.85) 0%,rgba(59,130,246,0.2) 70%,transparent 100%);box-shadow:0 0 10px rgba(59,130,246,0.4);transform:translate(-50%,-50%);opacity:0;transition:opacity 0.15s}',
      '#maia-scan{position:fixed;left:0;right:0;height:3px;top:0;z-index:2147483646;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(59,130,246,0.15) 10%,rgba(59,130,246,0.6) 50%,rgba(59,130,246,0.15) 90%,transparent 100%);box-shadow:0 0 15px rgba(59,130,246,0.3);opacity:0}',
    ].join('\n')
    document.head.appendChild(s)
  }

  /** Ensure cursor element exists. */
  function ensureCursor() {
    injectPerformerStyles()
    var c = document.getElementById('maia-cursor')
    if (c) return c
    c = document.createElement('div')
    c.id = 'maia-cursor'
    document.body.appendChild(c)
    return c
  }

  /** Cubic bezier ease-in-out. */
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * Move cursor along a curved path with overshoot and settle.
   * Intent controls speed: direct=fast, scanning=slow, decisive=medium.
   */
  function curvedMoveTo(x, y, intent) {
    var cursor = ensureCursor()
    var startX = parseFloat(cursor.style.left) || window.innerWidth / 2
    var startY = parseFloat(cursor.style.top) || window.innerHeight / 2
    cursor.style.opacity = '1'

    var dist = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2))

    // Duration varies by intent
    var speeds = { direct: 0.6, scanning: 1.5, decisive: 0.9, skipping: 0.4, reading: 1.2, returning: 0.5 }
    var speedFactor = speeds[intent] || 1
    var duration = Math.max(150, Math.min(600, dist * speedFactor))

    // Curve control point — offset perpendicular to the line for arc
    var midX = (startX + x) / 2
    var midY = (startY + y) / 2
    var perpX = -(y - startY) * 0.08
    var perpY = (x - startX) * 0.08
    var ctrlX = midX + perpX
    var ctrlY = midY + perpY

    // Overshoot amount (2-5px past target)
    var overshoot = intent === 'direct' ? 3 : intent === 'scanning' ? 1 : 2
    var overX = x + (x - startX) / dist * overshoot
    var overY = y + (y - startY) / dist * overshoot

    return new Promise(function(resolve) {
      var t0 = performance.now()
      function frame(now) {
        var t = Math.min((now - t0) / duration, 1)
        var e = easeInOut(t)

        // Quadratic bezier for the arc
        var px, py
        if (t < 0.85) {
          // Main movement along curve
          var bt = t / 0.85
          var be = easeInOut(bt)
          px = (1 - be) * (1 - be) * startX + 2 * (1 - be) * be * ctrlX + be * be * overX
          py = (1 - be) * (1 - be) * startY + 2 * (1 - be) * be * ctrlY + be * be * overY
        } else {
          // Settle back from overshoot to target
          var st = (t - 0.85) / 0.15
          px = overX + (x - overX) * easeInOut(st)
          py = overY + (y - overY) * easeInOut(st)
        }

        cursor.style.left = px + 'px'
        cursor.style.top = py + 'px'
        if (t < 1) requestAnimationFrame(frame)
        else resolve()
      }
      requestAnimationFrame(frame)
    })
  }

  /** Show glow outline on element before clicking (300ms). */
  function glowElement(selector) {
    var el = bridge.findElement ? bridge.findElement(selector) : document.querySelector(selector)
    if (!el) return Promise.resolve()
    injectPerformerStyles()

    el.classList.add('maia-glow')
    return new Promise(function(resolve) {
      setTimeout(function() {
        el.classList.remove('maia-glow')
        resolve()
      }, 300)
    })
  }

  /** Show extraction pulse when data is captured. */
  function extractionPulse(selector) {
    var el = bridge.findElement ? bridge.findElement(selector) : document.querySelector(selector)
    if (!el) return
    injectPerformerStyles()
    el.classList.add('maia-extract')
    setTimeout(function() { el.classList.remove('maia-extract') }, 500)
  }

  /** Click ripple at current cursor position. */
  function clickRipple() {
    injectPerformerStyles()
    var cursor = document.getElementById('maia-cursor')
    if (!cursor) return
    var x = parseFloat(cursor.style.left) || 0
    var y = parseFloat(cursor.style.top) || 0
    var r = document.createElement('div')
    r.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;width:0;height:0;border-radius:50%;transform:translate(-50%,-50%);background:rgba(59,130,246,0.3);animation:maia-ripple-burst 400ms ease-out forwards;left:' + x + 'px;top:' + y + 'px;'
    document.body.appendChild(r)
    setTimeout(function() { r.remove() }, 500)
  }

  /** Hide the cursor. */
  function hideCursor() {
    var c = document.getElementById('maia-cursor')
    if (c) c.style.opacity = '0'
  }

  /**
   * Variable-speed scan line that slows on content and speeds on whitespace.
   * Returns when scan completes.
   */
  function smartScanPage(durationMs) {
    injectPerformerStyles()
    durationMs = durationMs || 800
    var scanLine = document.getElementById('maia-scan')
    if (!scanLine) {
      scanLine = document.createElement('div')
      scanLine.id = 'maia-scan'
      document.body.appendChild(scanLine)
    }
    scanLine.style.opacity = '1'

    // Precompute content density for speed variation
    var viewH = window.innerHeight
    var densityMap = []
    for (var pct = 0; pct <= 100; pct += 5) {
      var y = (pct / 100) * viewH
      var el = document.elementFromPoint(viewH / 2, y)
      var hasContent = el && el.tagName !== 'BODY' && el.tagName !== 'HTML' && el.textContent && el.textContent.trim().length > 20
      densityMap.push(hasContent ? 0.6 : 1.4) // Slow on content, fast on empty
    }

    return new Promise(function(resolve) {
      var t0 = performance.now()
      function frame(now) {
        var elapsed = now - t0
        var t = Math.min(elapsed / durationMs, 1)
        // Adjust speed based on content density at current position
        var densityIdx = Math.min(Math.floor(t * densityMap.length), densityMap.length - 1)
        var speedMod = densityMap[densityIdx] || 1
        var adjustedT = easeInOut(t) * speedMod
        var clampedT = Math.min(adjustedT, 1)

        scanLine.style.top = (clampedT * viewH) + 'px'
        if (t < 1) requestAnimationFrame(frame)
        else {
          scanLine.style.opacity = '0'
          resolve()
        }
      }
      requestAnimationFrame(frame)
    })
  }

  /**
   * Progressive highlighting — highlights appear one at a time
   * with a delay between each, synced with reading speed.
   */
  function progressiveHighlight(keywords, delayBetween) {
    delayBetween = delayBetween || 400
    injectPerformerStyles()
    if (typeof CSS === 'undefined' || !CSS.highlights) return Promise.resolve(0)

    CSS.highlights.delete('maia-found')
    if (!keywords || keywords.length === 0) return Promise.resolve(0)

    // Find all ranges for all keywords
    var allRanges = []
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    var node
    while ((node = walker.nextNode())) {
      var parent = node.parentElement
      if (!parent || parent.offsetParent === null) continue
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue
      var text = node.textContent.toLowerCase()
      for (var k = 0; k < keywords.length; k++) {
        var kwLower = keywords[k].toLowerCase()
        var pos = 0
        while ((pos = text.indexOf(kwLower, pos)) !== -1) {
          var range = new Range()
          range.setStart(node, pos)
          range.setEnd(node, pos + keywords[k].length)
          allRanges.push({ range: range, keyword: keywords[k] })
          pos += keywords[k].length
        }
      }
    }

    // Sort by vertical position
    allRanges.sort(function(a, b) {
      var rectA = a.range.getBoundingClientRect()
      var rectB = b.range.getBoundingClientRect()
      return rectA.top - rectB.top
    })

    // Add highlights progressively
    return new Promise(function(resolve) {
      var ranges = []
      var i = 0
      function addNext() {
        if (i >= allRanges.length) return resolve(allRanges.length)
        ranges.push(allRanges[i].range)
        CSS.highlights.delete('maia-found')
        CSS.highlights.set('maia-found', new Highlight.apply(null, ranges))
        i++
        setTimeout(addNext, delayBetween)
      }
      addNext()
    })
  }

  /** Gaze simulation — cursor drifts over a list of elements before settling. */
  function gazeOverElements(selectors, pauseMs) {
    pauseMs = pauseMs || 300
    var i = 0
    function gazeNext() {
      if (i >= selectors.length) return Promise.resolve()
      var el = bridge.findElement ? bridge.findElement(selectors[i]) : document.querySelector(selectors[i])
      i++
      if (!el || el.offsetParent === null) return gazeNext()
      var rect = el.getBoundingClientRect()
      return curvedMoveTo(rect.left + rect.width / 2, rect.top + rect.height / 2, 'scanning').then(function() {
        return new Promise(function(resolve) { setTimeout(resolve, pauseMs) })
      }).then(gazeNext)
    }
    return gazeNext()
  }

  // Expose
  bridge.curvedMoveTo = curvedMoveTo
  bridge.glowElement = glowElement
  bridge.extractionPulse = extractionPulse
  bridge.smartClickRipple = clickRipple
  bridge.smartHideCursor = hideCursor
  bridge.smartScanPage = smartScanPage
  bridge.progressiveHighlight = progressiveHighlight
  bridge.gazeOverElements = gazeOverElements
  window.__maia_bridge = bridge
})()
