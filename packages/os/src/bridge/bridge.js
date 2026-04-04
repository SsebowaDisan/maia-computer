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
   * Click an element by selector.
   */
  function clickElement(selector) {
    const el = document.querySelector(selector)
    if (!el) return false
    el.click()
    return true
  }

  /**
   * Type text into an element.
   */
  function typeInElement(selector, text) {
    const el = document.querySelector(selector)
    if (!el) return false

    el.focus()

    // Clear existing value
    if ('value' in el) {
      el.value = ''
    }

    // Use execCommand for contenteditable, native input events for inputs
    if (el.getAttribute('contenteditable') === 'true') {
      el.textContent = text
    } else if ('value' in el) {
      el.value = text
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }

    return true
  }

  /**
   * Scroll to an element.
   */
  function scrollToElement(selector) {
    const el = document.querySelector(selector)
    if (!el) return false
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return true
  }

  // Expose functions to Electron's main process via contextBridge
  if (typeof window !== 'undefined') {
    window.__maia_bridge = {
      getElements,
      clickElement,
      typeInElement,
      scrollToElement,
    }
  }
})()
