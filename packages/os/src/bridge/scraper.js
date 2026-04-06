/**
 * Maia Page Scraper — injected into every app's webview.
 *
 * Reads the full page content and returns a structured model:
 * page type, metadata, sections, content items, scroll state,
 * obstacles, and active UI states.
 *
 * Extends window.__maia_bridge with scraping functions.
 */
;(function maiaScraperBridge() {
  'use strict'

  var bridge = window.__maia_bridge || {}

  /** Detect page type from URL and DOM structure. */
  function detectPageType() {
    var url = location.href
    var doc = document

    // Error pages
    if (document.title.match(/404|not found|error|500/i)) return 'error'

    // Search results
    if (url.match(/[?&](q|query|search|keyword)=/i) || url.includes('/search')) return 'search_results'

    // Forms — dominant form element
    var forms = doc.querySelectorAll('form input, form textarea, form select')
    if (forms.length >= 3) {
      var mainContent = doc.querySelector('main, [role="main"], article')
      var formParent = forms[0] && forms[0].closest('form')
      if (formParent && mainContent && mainContent.contains(formParent)) return 'form'
    }

    // Product — Schema.org or buy/cart buttons
    var ldScripts = doc.querySelectorAll('script[type="application/ld+json"]')
    for (var i = 0; i < ldScripts.length; i++) {
      try {
        var ld = JSON.parse(ldScripts[i].textContent || '')
        var ldType = ld['@type'] || (Array.isArray(ld['@graph']) && ld['@graph'][0] && ld['@graph'][0]['@type'])
        if (ldType === 'Product' || ldType === 'Hotel' || ldType === 'Restaurant') return 'product'
      } catch (e) { /* skip */ }
    }

    // Listing — repeating card structure with prices or ratings
    var cards = doc.querySelectorAll('[class*="card"], [class*="result"], [class*="listing"], [class*="item"]')
    if (cards.length >= 5) return 'listing'

    // Media — video or canvas dominant
    if (doc.querySelector('video[src], canvas') && !doc.querySelector('article')) return 'media'

    // Article — long text content
    if (doc.querySelector('article, [itemtype*="Article"]')) return 'article'
    var paragraphs = doc.querySelectorAll('main p, [role="main"] p, article p')
    if (paragraphs.length >= 4) return 'article'

    // Dashboard — multiple widget-like sections
    if (doc.querySelectorAll('[class*="widget"], [class*="panel"], [class*="stat"]').length >= 3) return 'dashboard'

    return 'unknown'
  }

  /** Extract JSON-LD structured data from the page. */
  function extractJsonLd() {
    var results = []
    var scripts = document.querySelectorAll('script[type="application/ld+json"]')
    for (var i = 0; i < scripts.length; i++) {
      try {
        var data = JSON.parse(scripts[i].textContent || '')
        results.push(data)
      } catch (e) { /* skip malformed */ }
    }
    return results
  }

  /** Extract meta tags and Open Graph data. */
  function extractMetadata() {
    var getMeta = function(name) {
      var el = document.querySelector('meta[name="' + name + '"], meta[property="' + name + '"]')
      return el ? el.getAttribute('content') || '' : ''
    }

    var og = {}
    document.querySelectorAll('meta[property^="og:"]').forEach(function(el) {
      var prop = el.getAttribute('property') || ''
      og[prop.replace('og:', '')] = el.getAttribute('content') || ''
    })

    // Find publication date
    var datePublished
    var timeEl = document.querySelector('time[datetime]')
    if (timeEl) datePublished = timeEl.getAttribute('datetime')
    if (!datePublished) datePublished = getMeta('article:published_time') || getMeta('date') || undefined

    return {
      description: getMeta('description'),
      language: document.documentElement.lang || 'unknown',
      datePublished: datePublished,
      canonical: (document.querySelector('link[rel="canonical"]') || {}).href || undefined,
      jsonLd: extractJsonLd(),
      openGraph: og,
    }
  }

  /** Get current scroll state. */
  function getScrollState() {
    var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
    var viewH = window.innerHeight
    var scrollTop = window.scrollY
    var pctTop = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0
    var pctBottom = docHeight > 0 ? Math.round(((scrollTop + viewH) / docHeight) * 100) : 100

    // Detect lazy load triggers
    var hasInfiniteScroll = !!document.querySelector('[class*="infinite"], [class*="load-more"], [data-infinite]')
    var hasShowMore = !!document.querySelector('button, a').length && Array.from(document.querySelectorAll('button, a')).some(function(el) {
      return /show more|load more|see all|view all/i.test(el.textContent || '')
    })

    return {
      viewportTop: pctTop,
      viewportBottom: Math.min(pctBottom, 100),
      totalHeight: docHeight,
      hasMoreBelow: pctBottom < 95,
      hasMoreAbove: pctTop > 5,
      lazyLoadTrigger: hasShowMore ? 'button' : hasInfiniteScroll ? 'scroll' : 'none',
    }
  }

  /** Get active UI states. */
  function getActiveStates() {
    var selectedTab
    var tabEl = document.querySelector('[role="tab"][aria-selected="true"]')
    if (tabEl) selectedTab = (tabEl.textContent || '').trim()

    var openDropdown
    var ddEl = document.querySelector('[aria-expanded="true"][role="combobox"], [aria-expanded="true"][role="listbox"]')
    if (ddEl) openDropdown = (ddEl.getAttribute('aria-label') || ddEl.textContent || '').trim().substring(0, 50)

    var checkedItems = []
    document.querySelectorAll('[role="checkbox"][aria-checked="true"], input[type="checkbox"]:checked').forEach(function(el) {
      var label = el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].textContent) || ''
      if (label) checkedItems.push(label.trim().substring(0, 50))
    })

    var expandedSections = []
    document.querySelectorAll('[aria-expanded="true"]').forEach(function(el) {
      var text = (el.textContent || '').trim().substring(0, 50)
      if (text && el.getAttribute('role') !== 'combobox') expandedSections.push(text)
    })

    var focusedElement
    if (document.activeElement && document.activeElement !== document.body) {
      focusedElement = document.activeElement.getAttribute('aria-label') || document.activeElement.tagName.toLowerCase()
    }

    return { selectedTab: selectedTab, openDropdown: openDropdown, checkedItems: checkedItems, expandedSections: expandedSections, focusedElement: focusedElement }
  }

  /** Detect obstacles (popups, banners, overlays). */
  function detectObstacles() {
    var obstacles = []

    // Cookie/GDPR banners
    var cookieSelectors = '[class*="cookie"], [class*="consent"], [id*="cookie"], [id*="consent"], [id*="gdpr"], [class*="gdpr"]'
    document.querySelectorAll(cookieSelectors).forEach(function(el) {
      if (el.offsetParent === null) return
      var rect = el.getBoundingClientRect()
      if (rect.height < 20) return
      var acceptBtn = el.querySelector('button, [role="button"]')
      var btnText = acceptBtn ? (acceptBtn.textContent || '').trim().toLowerCase() : ''
      if (btnText.match(/accept|agree|ok|got it|allow/)) {
        obstacles.push({ type: 'cookie_banner', selector: buildQuickSelector(acceptBtn || el), dismissAction: 'click_accept', dismissTarget: buildQuickSelector(acceptBtn) })
      }
    })

    // Modal dialogs / overlays
    document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="popup"], [class*="overlay"]').forEach(function(el) {
      if (el.offsetParent === null) return
      var style = getComputedStyle(el)
      if (parseInt(style.zIndex) < 100) return
      var closeBtn = el.querySelector('[aria-label*="close" i], [class*="close"], button')
      if (closeBtn) {
        obstacles.push({ type: 'newsletter_popup', selector: buildQuickSelector(el), dismissAction: 'click_close', dismissTarget: buildQuickSelector(closeBtn) })
      }
    })

    return obstacles
  }

  /** Quick selector builder for obstacle elements. */
  function buildQuickSelector(el) {
    if (!el) return ''
    if (el.id) return '#' + el.id
    var ariaLabel = el.getAttribute('aria-label')
    if (ariaLabel) return '[aria-label="' + ariaLabel.replace(/"/g, '\\"') + '"]'
    return bridge.buildSelector ? bridge.buildSelector(el) : el.tagName.toLowerCase()
  }

  /** Extract structured content items from listing/search pages. */
  function extractContentItems(pageType) {
    var items = []
    if (pageType === 'search_results') {
      items = extractSearchResults()
    } else if (pageType === 'listing' || pageType === 'product') {
      items = extractListingItems()
    } else if (pageType === 'article') {
      items = extractArticleContent()
    }
    return items.slice(0, 20)
  }

  /** Extract Google/Bing search results. */
  function extractSearchResults() {
    var results = []
    // Google
    document.querySelectorAll('div.g, div[data-hveid]').forEach(function(el, i) {
      if (i >= 15) return
      var titleEl = el.querySelector('h3')
      var linkEl = el.querySelector('a[href]')
      var snippetEl = el.querySelector('[data-sncf], .VwiC3b, [style*="-webkit-line-clamp"]')
      if (!titleEl || !linkEl) return
      var isAd = !!el.closest('[data-text-ad], [id="tads"]')
      results.push({
        type: isAd ? 'ad' : 'search_result',
        title: titleEl.textContent.trim(),
        text: snippetEl ? snippetEl.textContent.trim().substring(0, 200) : '',
        link: linkEl.href,
        price: undefined, rating: undefined, reviewCount: undefined,
        location: undefined, image: undefined, amenities: [], metadata: { rank: String(i + 1), isAd: String(isAd) },
      })
    })
    // Featured snippet
    var featured = document.querySelector('[data-attrid], .kp-header, .Z0LcW, .IZ6rdc, .hgKElc')
    if (featured) {
      results.unshift({
        type: 'featured_snippet',
        title: 'Featured Answer',
        text: featured.textContent.trim().substring(0, 400),
        link: undefined, price: undefined, rating: undefined,
        reviewCount: undefined, location: undefined, image: undefined,
        amenities: [], metadata: {},
      })
    }
    return results
  }

  /** Extract items from listing pages (hotels, products, etc). */
  function extractListingItems() {
    var items = []
    // Find repeating card elements
    var cardSelectors = '[class*="property-card"], [class*="hotel-card"], [class*="sr-card"], [class*="product"], [class*="listing"], [data-testid*="card"], [data-testid*="result"]'
    var cards = document.querySelectorAll(cardSelectors)
    if (cards.length < 3) {
      // Fallback: find any repeating sibling structure
      cards = document.querySelectorAll('main li, [role="main"] li, .results > div, .list > div')
    }

    cards.forEach(function(card, i) {
      if (i >= 20) return
      var titleEl = card.querySelector('h2, h3, h4, [class*="title"], [class*="name"]')
      if (!titleEl) return
      var priceEl = card.querySelector('[class*="price"], [data-testid*="price"]')
      var ratingEl = card.querySelector('[class*="rating"], [class*="score"], [aria-label*="rating" i], [aria-label*="score" i]')
      var reviewEl = card.querySelector('[class*="review"], [class*="count"]')
      var locationEl = card.querySelector('[class*="location"], [class*="address"], [class*="distance"]')
      var linkEl = card.querySelector('a[href]')
      var imgEl = card.querySelector('img')

      items.push({
        type: 'listing_item',
        title: titleEl.textContent.trim().substring(0, 100),
        text: '',
        price: priceEl ? priceEl.textContent.trim().substring(0, 30) : undefined,
        rating: ratingEl ? (ratingEl.getAttribute('aria-label') || ratingEl.textContent || '').trim().substring(0, 30) : undefined,
        reviewCount: reviewEl ? parseInt((reviewEl.textContent || '').replace(/[^0-9]/g, '')) || undefined : undefined,
        location: locationEl ? locationEl.textContent.trim().substring(0, 60) : undefined,
        link: linkEl ? linkEl.href : undefined,
        image: imgEl ? (imgEl.alt || '').trim().substring(0, 80) : undefined,
        amenities: [],
        metadata: {},
      })
    })
    return items
  }

  /** Extract article content as structured sections. */
  function extractArticleContent() {
    var items = []
    var main = document.querySelector('article, main, [role="main"], .post-content, .article-body, .mw-parser-output')
    if (!main) main = document.body
    var els = main.querySelectorAll('h1, h2, h3, h4, p, li, blockquote, table')

    var currentSection = { type: 'article_section', title: '', text: '', price: undefined, rating: undefined, reviewCount: undefined, location: undefined, link: undefined, image: undefined, amenities: [], metadata: {} }

    for (var i = 0; i < els.length && items.length < 20; i++) {
      var el = els[i]
      if (el.offsetParent === null) continue
      if (el.closest('nav, footer, aside, header, [role="navigation"], [role="banner"]')) continue
      var tag = el.tagName
      var t = el.textContent.trim()
      if (t.length < 5) continue

      if (['H1', 'H2', 'H3', 'H4'].includes(tag)) {
        if (currentSection.text) items.push(currentSection)
        currentSection = { type: 'article_section', title: t.substring(0, 120), text: '', price: undefined, rating: undefined, reviewCount: undefined, location: undefined, link: undefined, image: undefined, amenities: [], metadata: {} }
      } else if (tag === 'TABLE') {
        items.push({ type: 'table', title: '', text: extractTableText(el), price: undefined, rating: undefined, reviewCount: undefined, location: undefined, link: undefined, image: undefined, amenities: [], metadata: {} })
      } else {
        currentSection.text += (currentSection.text ? '\n' : '') + t.substring(0, 300)
      }
    }
    if (currentSection.text) items.push(currentSection)
    return items
  }

  /** Extract table content as readable text. */
  function extractTableText(table) {
    var rows = []
    table.querySelectorAll('tr').forEach(function(tr, i) {
      if (i >= 15) return
      var cells = []
      tr.querySelectorAll('th, td').forEach(function(cell) {
        cells.push(cell.textContent.trim().substring(0, 50))
      })
      if (cells.length > 0) rows.push(cells.join(' | '))
    })
    return rows.join('\n')
  }

  /** Extract page sections by semantic landmarks. */
  function extractSections() {
    var sections = []
    var landmarks = [
      { selector: 'header, [role="banner"]', type: 'header' },
      { selector: 'nav, [role="navigation"]', type: 'nav' },
      { selector: 'main, [role="main"]', type: 'main' },
      { selector: 'aside, [role="complementary"]', type: 'sidebar' },
      { selector: 'footer, [role="contentinfo"]', type: 'footer' },
    ]

    landmarks.forEach(function(lm) {
      var el = document.querySelector(lm.selector)
      if (!el || el.offsetParent === null) return
      var text = el.textContent.trim().substring(0, 200)
      var hasSearch = !!el.querySelector('input[type="search"], [role="search"], input[type="text"]')
      sections.push({ type: lm.type, text: text, items: [], hasSearch: hasSearch })
    })

    // Detect filter sidebar
    var filterEl = document.querySelector('[class*="filter"], [class*="facet"], [data-testid*="filter"]')
    if (filterEl && filterEl.offsetParent !== null) {
      var options = []
      filterEl.querySelectorAll('label, [role="checkbox"], button').forEach(function(f) {
        var t = (f.textContent || '').trim().substring(0, 30)
        if (t) options.push(t)
      })
      sections.push({ type: 'filters', text: 'Filters: ' + options.slice(0, 10).join(', '), items: [] })
    }

    // Detect pagination
    var pagEl = document.querySelector('[class*="pagination"], [role="navigation"][aria-label*="page" i], nav:has(a[href*="page"])')
    if (pagEl) {
      var current = pagEl.querySelector('[aria-current="page"], .active, [class*="current"]')
      var allPages = pagEl.querySelectorAll('a[href]')
      sections.push({ type: 'pagination', text: 'Page ' + (current ? current.textContent.trim() : '1') + ' of ~' + allPages.length, items: [] })
    }

    return sections
  }

  /** Main scrape function — returns full structured page model. */
  function scrapePage() {
    var pageType = detectPageType()
    return {
      pageType: pageType,
      url: location.href,
      title: document.title,
      metadata: extractMetadata(),
      sections: extractSections(),
      content: extractContentItems(pageType),
      scrollState: getScrollState(),
      activeStates: getActiveStates(),
      obstacles: detectObstacles(),
    }
  }

  // Expose
  bridge.scrapePage = scrapePage
  bridge.detectPageType = detectPageType
  bridge.extractJsonLd = extractJsonLd
  bridge.extractMetadata = extractMetadata
  bridge.getScrollState = getScrollState
  bridge.detectObstacles = detectObstacles
  window.__maia_bridge = bridge
})()
