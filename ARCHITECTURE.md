# Maia Computer — Architecture

> An AI-powered operating system where every app runs with intelligence built in.

---

## Table of Contents

1. [Vision](#1-vision)
2. [Core Principles](#2-core-principles)
3. [System Overview](#3-system-overview)
4. [Core Features](#4-the-10-core-features)
5. [Intelligence Layer — Brain Vision System](#5-intelligence-layer-the-kernel)
6. [Smart Navigation System](#6-smart-navigation-system)
7. [Visual Performance System](#7-visual-performance-system)
8. [App System](#8-app-system)
9. [Brain, App Agents & Orchestrator](#9-brain-app-agents--orchestrator)
10. [Theatre (The Desktop Environment)](#10-theatre-the-desktop-environment)
11. [Team Communication](#11-team-communication)
12. [Tech Stack](#12-tech-stack)
13. [Product Phases](#13-product-phases)
14. [Key Differentiators](#14-key-differentiators)

---

## 1. Vision

### What is Maia Computer?

Maia Computer is an AI-powered operating system. Users install it on their Mac or Windows. They install real apps inside it — Gmail, Slack, Sheets, WhatsApp, Chrome, VS Code — anything with a web version. Every app runs with AI built into every layer. The AI sees everything, controls everything, learns everything, and gets smarter over time.

### What it is NOT

- It is not a chatbot
- It is not a browser extension
- It is not an automation tool
- It is not a screenshot-based agent (too slow)
- It is not a wrapper around existing apps (too shallow)

### What it IS

- A real operating system — dock, home screen, app windows, app store
- Every installed app is AI-powered by default
- Apps talk to each other through AI (App Fusion)
- AI works while you're away (Ghost Mode)
- Every action is recordable and rewindable (Time Travel)
- Gets smarter the more you use it
- Your computer, but with a brain

### How it differs from everything else

```
macOS / Windows:       OS with apps. No AI.
ChromeOS:              Browser as OS. No AI.
Anthropic Computer Use: AI that uses a computer via screenshots. Slow.
OpenAI Operator:       AI that uses a browser via screenshots. Slow.
Zapier / Make:         Pre-built automation. No intelligence. Rigid.

Maia Computer:         OS where AI IS the computer.
                       Real apps. Deep access. Instant control.
                       Gets smarter over time.
```

---

## 2. Core Principles

### 2.1 Real Apps, Not Skins

Users install real apps — not replicas, not skins, not simplified versions. Gmail inside Maia IS Gmail. Slack inside Maia IS Slack. The real web app runs in a managed webview. The user sees the real thing.

### 2.2 Speed Through Intelligence, Not Screenshots

Other AI agents take screenshots and send them to a vision model (3-5 seconds per action). Maia reads app data directly through Network Intelligence (API traffic interception) and DOM Intelligence (element access). This is 100-1000x faster.

```
Screenshot approach:  Screenshot → LLM vision → coordinates → click = 3-5 seconds
Maia approach:        Read DOM/network → LLM text reasoning → DOM action = 50-500ms
```

### 2.3 The Computer Gets Smarter

Maia learns API patterns, remembers user preferences, records workflows. The longer you use it, the faster and smarter it becomes.

### 2.4 Everything is Connected

Apps don't live in silos. Through App Fusion, data flows between apps naturally. Drag an email into a spreadsheet. Search across all apps at once. AI orchestrates cross-app workflows automatically.

### 2.5 The User is Always in Control

Maia never does anything irreversible without asking. The user can pause, redirect, undo, or take over at any time. Ghost Mode runs tasks in the background but always respects approval rules.

---

## 3. System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      MAIA COMPUTER (Electron)                    │
│                                                                  │
│  ┌─ Theatre (Desktop Environment) ──────────────────────────┐   │
│  │                                                          │   │
│  │  ┌─ Spaces ────────────────────────────────────────────┐ │   │
│  │  │ [● Work]  [○ Personal]  [○ Side Project]            │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌─ App Windows ───────────────────────────────────────┐ │   │
│  │  │                                                    │ │   │
│  │  │  Real Gmail  │  Real Slack  │  Real Sheets          │ │   │
│  │  │  (webview)   │  (webview)   │  (webview)            │ │   │
│  │  │              │              │                        │ │   │
│  │  │  Each app has a command bar at the bottom            │ │   │
│  │  │  AI has full DOM + network access to every app       │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌─ Spotlight AI (Cmd+Space) ─────────────────────────┐ │   │
│  │  │ Universal search across all installed apps          │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌─ Dock (auto-hide, appears on hover) ───────────────┐ │   │
│  │  │ [Recent apps...] │ [Pinned] [⚙️ Settings] [⊞ Store] │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ Intelligence Layer (The Kernel) ────────────────────────┐   │
│  │                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Network  │ │   DOM    │ │  Vision  │ │  Memory  │   │   │
│  │  │  Brain   │ │  Brain   │ │  Brain   │ │  Brain   │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                                          │   │
│  │  Every app's I/O passes through the Intelligence Layer   │   │
│  │  AI can READ everything and ACT on everything            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ AI Engine ──────────────────────────────────────────────┐   │
│  │  Brain (LLM reasoning) + Orchestrator (multi-task)       │   │
│  │  LLM Provider (OpenAI / Claude / pluggable)              │   │
│  │  Cost tracking + budget guardrails                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ System Services ────────────────────────────────────────┐   │
│  │  Event Bus │ Recording │ Workflows │ Team Communication  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. The 10 Core Features

### 4.1 App Store

Users install real apps inside Maia. Each "install" creates a sandboxed webview that loads the real web app. User signs in once. Session persists. App appears on the home screen and dock.

**How install works:**
1. User clicks "Install Gmail" in the App Store
2. Maia creates an isolated webview container for gmail.com
3. User signs in with their real Google account
4. Session/cookies are encrypted and persisted to disk
5. Maia injects the Intelligence Bridge script into the page
6. Gmail icon appears on home screen and dock
7. AI now has deep access to Gmail — can read, compose, search, organize

**Supported app types:**
- Web apps (95% of modern apps) — Gmail, Slack, Sheets, Notion, WhatsApp Web, etc.
- Native apps (future) — VS Code, Excel, wrapped via accessibility APIs
- Maia-native apps (future) — apps built specifically for Maia

**Custom apps:** User can enter any URL to install any web app. Maia works with every website.

### 4.2 Intelligence Layer

Every installed app connects to the Intelligence Layer. This is the kernel of the OS — the thing that makes apps AI-powered.

**Network Brain:** Intercepts all HTTP traffic from every app. Reads API requests and responses as structured data. Learns API patterns over time. Can replay API calls to act instantly.

**DOM Brain:** Injected script reads every page's UI structure — buttons, inputs, text, links, with labels and positions. Can click, type, scroll via direct DOM manipulation. No screenshots needed.

**Vision Brain:** Fallback for complex visual content. Takes screenshots and sends to LLM. Used for CAPTCHAs, image analysis, verification. Less than 5% of actions.

**Memory Brain:** Remembers learned API patterns, user preferences, app state history. Gets smarter the more you use it.

### 4.3 App Fusion

Apps talk to each other through AI. No API integrations needed. No Zapier. The AI reads both apps and connects them.

**Examples:**
- Drag an email from Gmail → drop on Sheets → AI extracts data and fills cells
- Drag a Slack message → drop on Calendar → AI creates an event from the message
- Drag a Sheets chart → drop on Slack → AI posts the chart to the channel
- AI automatically: "You got an invoice email. Want me to add it to your budget spreadsheet?"

### 4.4 Spaces

Separate desktops for different contexts. Each space has its own apps, accounts, AI personality, and context.

**Default spaces:**
- Work — work email, work Slack, company tools
- Personal — personal email, WhatsApp, social media

Users can create custom spaces: "Side Project", "Job Search", "Wedding Planning"

Switching spaces changes everything — different apps, different accounts, different AI context. Like having multiple computers in one.

### 4.8 Spotlight AI

Universal search across all installed apps. One search bar. Results from every app.

**Activated with:** Cmd+Space (like macOS Spotlight)

**Searches across:** Gmail (emails), Slack (messages), Sheets (data), Calendar (events), Notion (pages), Chrome (history), and every other installed app.

**AI-powered:** Not just keyword matching. "Find the budget number Sarah mentioned last week" → AI understands the intent and searches semantically.

### 4.9 Picture-in-Picture

When AI is working on a task, a small floating window shows what it's doing. The user continues their own work in a different app.

**Example:** User is writing a document in Notion. AI is simultaneously researching competitors in Chrome. A small PiP window in the corner shows the Chrome tab being operated. User can glance at it, expand it, or ignore it.

### 4.10 Team Spaces (Phase 3)

Share a Maia space with your team. Shared apps, shared AI brain, shared workflows.

**Example:** "Q3 Planning" space shared with Sarah, Mark, and CFO. Everyone can give commands to the shared AI. Changes are visible to all in real-time.

---

## 5. Intelligence Layer (The Kernel)

The Intelligence Layer is what makes Maia an OS, not just a browser. It's designed as a **vision system** — the page lives inside the Brain. The Brain doesn't "scan" or "query" the page. It maintains continuous awareness of everything on every page, like how human eyes are always connected to the brain.

### 5.0 Architecture: Brain-Page Fusion

The key insight: the Brain and the browser are not separate systems that communicate. They are ONE system. The page is the Brain's visual field.

```
┌─ Intelligence Layer ────────────────────────────────────────────────┐
│                                                                      │
│  ┌─ Page Nerve (lives in each webview) ──────────────────────────┐  │
│  │  Continuous signals — not snapshots:                           │  │
│  │  • IntersectionObserver: element visibility                    │  │
│  │  • MutationObserver: DOM changes                               │  │
│  │  • Scroll events: viewport position                            │  │
│  │  Every element announces itself to the Awareness Field         │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                              │ live element events                   │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │  Awareness Field (always current, never queried)               │  │
│  │                                                                │  │
│  │  Elements scored by relevance to current goal:                 │  │
│  │    ★★★ 0.95  "Uganda - Wikipedia" [in viewport]               │  │
│  │    ★★★ 0.90  "Uganda - BBC News" [in viewport]                │  │
│  │    ★★☆ 0.60  "Uganda Travel" [below fold]                     │  │
│  │                                                                │  │
│  │  Obstacles: auto-dismissed before Brain notices                │  │
│  │  Page state: type, scroll %, loading status                    │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                              │ awareness (instant read)              │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │  Brain (three-speed decision maker)                            │  │
│  │                                                                │  │
│  │  ⚡ INSTANT (<10ms): scroll, dismiss, wait — no LLM           │  │
│  │  🔄 FAST (<100ms): pick result by credibility — rules only    │  │
│  │  🧠 SLOW (~1-2s): extract content, synthesize — LLM call     │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                              │ intentions (not actions)              │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │  Performance Layer (for the USER's eyes, not the Brain's)      │  │
│  │  Cursor movement, element glow, typing animation, scroll      │  │
│  │  All visual — the Brain decided before animations start        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Supporting subsystems:                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Network  │ │   DOM    │ │  Vision  │ │  Memory  │              │
│  │  Brain   │ │  Brain   │ │  Brain   │ │  Brain   │              │
│  │(API data)│ │(elements)│ │(fallback)│ │(learning)│              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**How it differs from every other AI agent:**

```
Anthropic Computer Use:  Screenshot → LLM → act   = 3-5s per action (blind between shots)
OpenAI Operator:         Screenshot → LLM → act   = 3-5s per action (same approach)
Current AI agents:       Scrape → text dump → LLM = 1-2s per action (stale data)

Maia:                    Continuous awareness → instant mechanical actions,
                         LLM only for judgment = <100ms for most actions
```

### 5.1 Network Brain

```
Every app makes HTTP requests (API calls).
Network Brain intercepts ALL of them.

Gmail sends: GET /api/messages
Network Brain: "User has 15 unread emails. Latest from CEO: 'Need Q3 numbers'"

Slack sends: POST /api/chat.postMessage
Network Brain: "Message sent to #general by user"

Google Flights responds: { flights: [{ airline: "ANA", price: 487 }] }
Network Brain: "Found 12 flight results. Cheapest: ANA $487 direct"
```

**How it works:**
1. Maia runs a local proxy server
2. Each app's webview routes traffic through the proxy
3. Proxy reads request/response data (structured JSON)
4. Data is indexed and made available to the AI Brain
5. Brain can also REPLAY API calls to act directly (without clicking)

**Speed:** Reading API responses = 1-5ms. No screenshots. No vision model.

**Learning:** Network Brain remembers API patterns per app. After a week of use, it knows exactly how Gmail's API works, how Slack's API works, etc. It gets faster over time.

**Prefetch Intelligence:** Network Brain doesn't just read responses after page load — it watches prefetch requests to predict what's behind a link before the agent clicks it. If a search results page pre-loads hotel prices via API, the agent knows "this link leads to a $210 hotel" without visiting the page.

### 5.2 DOM Brain

```
Every web app has a DOM (Document Object Model).
DOM Brain reads the structure of every page.

Gmail page:
  - [input] "Search mail" — position: (400, 50)
  - [button] "Compose" — position: (80, 120)
  - [list] 15 email rows, first: "CEO - Need Q3 numbers" — position: (600, 200)
  - [link] "Inbox (3)" — position: (80, 180)

DOM Brain can:
  - Click any element by reference (not coordinates)
  - Type into any input field
  - Read text content of any element
  - Scroll to any element
  - Watch for changes (mutation observer)
```

**How it works:**
1. Maia injects a bridge script into every app's webview
2. Bridge script creates a structured map of interactive elements
3. Map is sent to the AI Brain as TEXT (not images)
4. Brain decides which element to interact with
5. Bridge script executes the action via DOM manipulation

**Speed:** Reading DOM = 5-50ms. Acting via DOM = 1-10ms. No screenshots.

**Advanced DOM capabilities (beyond basic element reading):**

| Capability | How | What it unlocks |
|---|---|---|
| CSS computed style reading | `getComputedStyle()` — `cursor:pointer` = clickable, `overflow:auto` = scrollable | Finds interactive elements that lack semantic HTML (e.g., `<div onclick>`) |
| Event listener introspection | Detect attached event handlers on any element | Discovers all interactive elements, even generic `<div>` with click handlers |
| Shadow DOM piercing | Recursively traverse shadow roots | Reads content inside Google, YouTube, and modern web components |
| iframe content access | Access iframe document when same-origin or via Electron privileges | Reads booking widgets, maps, embedded review sections |
| Intersection Observer | Track which elements are in the visible viewport | Knows exactly what the agent can "see" vs what's below the fold |
| MutationObserver | Watch for DOM changes in real-time | Detects when an action completed (new content appeared, loading finished) — replaces fixed wait times |
| CSS transition/animation events | Listen for `transitionend`, `animationend` | Knows when visual transitions finish — moves at page speed, not timer speed |
| Performance Observer | Largest Contentful Paint, resource timing | Knows precisely when a page is truly done rendering |

### 5.3 Vision Brain (Fallback)

```
Used only when Network + DOM brains can't handle it:
  - CAPTCHAs (image recognition needed)
  - Complex visual layouts (charts, graphs, images)
  - Verification ("did the task actually complete?")
  - Canvas-based apps (no DOM to read)
```

**Speed:** 3-5 seconds per action (screenshot + LLM vision). Used for less than 5% of actions.

### 5.4 Page Scraper

The Page Scraper is the agent's eyes. It combines data from Network Brain, DOM Brain, and page metadata to build a **structured model** of every page the agent visits. This is not just a list of interactive elements — it's a full comprehension of what the page says, what it contains, and how it's organized.

**What the Page Scraper reads:**

```
Page Scraper output for a Booking.com hotel listing:

{
  pageType: "listing",
  url: "https://booking.com/searchresults?city=Brussels",
  title: "Brussels Hotels — Booking.com",

  metadata: {
    description: "Book hotels in Brussels...",
    language: "en",
    datePublished: null,
    jsonLd: [{ "@type": "Hotel", "name": "Hotel Amigo", "priceRange": "€€€" }]
  },

  structure: {
    header:  { text: "Brussels: 342 properties found", hasSearch: true },
    filters: { options: ["Stars", "Price", "Rating"], activeFilters: ["4+ stars"] },
    sidebar: { type: "map", content: "Map showing hotel locations" },
    main:    { type: "results", itemCount: 25 },
    pagination: { current: 1, total: 14, nextUrl: "...&offset=25" }
  },

  content: [
    {
      type: "hotel_listing",
      title: "Hotel Amigo",
      price: "€210/night",
      rating: "9.1 — Wonderful",
      reviewCount: 2847,
      location: "Grand Place, Brussels Center",
      amenities: ["Free WiFi", "Spa", "Restaurant"],
      image: "Luxury hotel exterior with Grand Place view",
      link: "/hotel/be/amigo.html"
    },
    {
      type: "hotel_listing",
      title: "NH Collection Brussels Centre",
      price: "€168/night",
      rating: "8.7 — Excellent",
      ...
    }
  ],

  scrollState: {
    viewportTop: 0,
    viewportBottom: 45,
    totalHeight: 100,
    hasMoreBelow: true,
    lazyLoadTrigger: "scroll"
  },

  interactiveElements: [
    { role: "searchbox", label: "Destination", selector: "#ss", value: "Brussels" },
    { role: "button", label: "Search", selector: ".sb-searchbox__button" },
    { role: "link", text: "Hotel Amigo", href: "/hotel/be/amigo.html" },
    ...
  ]
}
```

**How the Page Scraper works:**

| Data source | What it provides |
|---|---|
| **DOM structure** | Headings, paragraphs, lists, tables, forms — organized by semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) |
| **Schema.org / JSON-LD** | Machine-readable structured data — product prices, hotel ratings, article authors, event dates. Already on the page, just nobody reads it. |
| **Open Graph / meta tags** | Page description, type, language, publication date |
| **Network Brain** | API responses with structured data (prices, availability, search results as JSON) |
| **CSS computed styles** | Which elements are clickable (`cursor:pointer`), scrollable (`overflow:auto`), hidden (`display:none`), fixed (`position:fixed`) |
| **Intersection Observer** | Which elements are currently visible in the viewport |
| **Link hrefs** | Where every link leads — parsed for structure (e.g., `/hotel/be/amigo` = hotel page, Belgium, Amigo) |
| **Image alt text / captions** | What images represent |
| **Tab order** | Logical flow of interactive elements |
| **Active states** | Selected tabs, open dropdowns, checked checkboxes, expanded accordions (`aria-expanded`) |

**Page type detection:**

The scraper classifies every page into a type so the Brain knows how to behave:

| Page type | How detected | Agent behavior |
|---|---|---|
| `search_results` | URL contains `search`, `q=`, `/results`; content is a list of links with snippets | Scan results, pick best, click through |
| `listing` | Repeating card/row structure with prices, ratings; filter sidebar | Read listings, use filters, compare items |
| `article` | Long-form text with headings; `<article>` tag; Schema.org Article type | Read content, extract key facts, highlight important text |
| `product` | Single item with price, images, buy button; Schema.org Product type | Extract product details, compare with research memory |
| `form` | Multiple input fields, submit button; `<form>` element | Identify form type (search, login, checkout), fill systematically |
| `dashboard` | Multiple widgets, charts, stats; navigation tabs | Read visible data, switch tabs if needed |
| `media` | Video, audio, image gallery; `<video>`, `<canvas>` | Fall back to Vision Brain |
| `error` | 404/500 status, error message text | Go back, try different approach |

### 5.5 Research Memory

Research Memory is the agent's scratchpad. It persists across page navigations so the agent can compare information gathered from different websites.

**The problem it solves:**

```
WITHOUT Research Memory:
  Agent visits booking.com → finds Hotel Amigo €210
  Agent navigates to tripadvisor.com → forgets everything about booking.com
  Agent cannot compare. Agent cannot cross-reference. Agent cannot research.

WITH Research Memory:
  Agent visits booking.com → stores: { source: "booking.com", hotel: "Hotel Amigo", price: "€210", rating: 9.1 }
  Agent visits tripadvisor.com → reads scratchpad: "I already found Hotel Amigo at €210 on Booking"
  Agent compares, cross-references, builds a recommendation across sources
```

**Research Memory structure:**

```
ResearchMemory {
  task: "Find best hotels in Brussels"

  findings: [
    {
      source: "booking.com",
      url: "https://booking.com/searchresults?city=Brussels",
      visitedAt: 1712419200000,
      data: [
        { name: "Hotel Amigo", price: "€210/night", rating: "9.1", location: "Grand Place", notes: "luxury, top-rated" },
        { name: "NH Collection", price: "€168/night", rating: "8.7", location: "Central Station", notes: "good value" },
      ],
      credibility: "high",
      pageType: "listing"
    },
    {
      source: "tripadvisor.com",
      url: "https://tripadvisor.com/Hotels-Brussels",
      visitedAt: 1712419260000,
      data: [
        { name: "Hotel Amigo", ranking: "#3 in Brussels", reviewCount: 2847, sentiment: "mostly positive" },
      ],
      credibility: "high",
      pageType: "listing"
    }
  ],

  searchesTriedSoFar: [
    "best hotels brussels",
    "luxury hotels brussels city center"
  ],

  pagesVisited: [
    { url: "google.com/search?q=best+hotels+brussels", useful: true },
    { url: "randomtravelblog.com/brussels", useful: false, reason: "outdated, 2019" },
    { url: "booking.com/searchresults?city=Brussels", useful: true },
    { url: "tripadvisor.com/Hotels-Brussels", useful: true },
  ],

  openQuestions: [
    "What dates is the user traveling?",
    "What's the budget?"
  ],

  confidence: "medium — found good options but haven't checked availability or specific dates"
}
```

**How the Brain uses Research Memory:**

Every time the ActionDecider makes a decision, it receives the full Research Memory in its prompt:

```
What you know so far:
- booking.com: Hotel Amigo €210 (9.1), NH Collection €168 (8.7), Hotel Bloom €145 (8.3)
- tripadvisor.com: Hotel Amigo ranked #3, 2847 reviews
- Searches tried: "best hotels brussels", "luxury hotels brussels center"
- Pages visited: 4 (2 useful, 1 outdated blog skipped, 1 Google results)

What you see on this page: [page scraper output]
The user wants: "find best hotels in Brussels"

What should you do next?
```

The Brain can now reason: "I have pricing from Booking and rankings from TripAdvisor. I should cross-reference — do the TripAdvisor rankings match the Booking ratings? Let me also check if there's a better deal on Hotels.com before giving my recommendation."

**Source credibility ranking:**

| Source type | Credibility | Example |
|---|---|---|
| First-party booking site | High | booking.com, hotels.com, expedia.com |
| Major review platform | High | tripadvisor.com, yelp.com, google reviews |
| Official business website | High | hotelamigo.com |
| News / established media | Medium | nytimes.com, bbc.com travel section |
| Blog / affiliate site | Low | "top10brusselshotels.com", listicle blogs |
| Forum / social | Low-Medium | reddit.com, quora.com (useful for real opinions) |
| Outdated content (>1 year) | Deprioritized | Any page with old publication date |

### 5.6 Memory Brain

```
Remembers everything:
  - Learned API patterns per app (Network Brain gets faster)
  - User preferences ("user prefers window seats")
  - App state history (for Time Travel)
  - Workflow patterns (for auto-suggesting Workflows)
  - Frequently used commands
  - Cross-app data relationships

Storage: Encrypted SQLite database on the user's machine
Privacy: Nothing leaves the machine unless the user explicitly shares it
```

### Intelligence Speed Comparison

| Method | Speed | Cost per action | Used for |
|---|---|---|---|
| Network Brain | 1-5ms | Free (local) | Reading app data, replaying API calls, prefetch intelligence |
| DOM Brain | 5-50ms | Free (local) | Clicking, typing, reading page content, state detection |
| Page Scraper | 50-100ms | Free (local) | Full page comprehension — structure, content, metadata, data |
| Research Memory | 1ms | Free (local) | Cross-page comparison, findings persistence, confidence tracking |
| Memory Brain | 1ms | Free (local) | Recall patterns, preferences |
| Vision Brain | 3-5 seconds | ~$0.01 | CAPTCHAs, verification, complex visuals |
| LLM Reasoning | 500ms-2s | ~$0.003 | Deciding WHAT to do (not HOW) |

**95% of actions use Network + DOM + Page Scraper (instant, free). LLM is used for thinking, not seeing.**

---

## 6. Smart Navigation System

The Smart Navigator controls how the agent moves through web pages — clicking, scrolling, typing, hovering, going back, opening tabs. Every action is designed to be reliable, adaptive, and visually impressive.

### 6.1 Action Types

The agent's full action vocabulary:

| Action | Description | When used |
|---|---|---|
| `click(target)` | Click an element by text, selector, or aria-label | Navigating links, pressing buttons, selecting items |
| `type(target, text)` | Type text character-by-character into an input | Search boxes, forms, chat inputs |
| `scroll(direction/target)` | Scroll the page or a specific container | Exploring content below the fold, reaching elements |
| `hover(target)` | Hover over an element to reveal hidden content | Dropdown menus, tooltips, preview cards |
| `press_key(key)` | Press a keyboard key | Enter to submit, Escape to close, Tab to move focus |
| `go_back()` | Navigate to the previous page | Leaving unhelpful pages, returning to search results |
| `navigate(url)` | Go directly to a URL | Direct site access (booking.com), skipping Google |
| `find_text(query)` | Ctrl+F equivalent — jump to text on the page | Finding specific content on long pages |
| `open_tab(url)` | Open a link in a background tab for later review | Opening multiple search results to compare |
| `switch_tab(index)` | Switch to a different open tab | Reviewing tabs opened earlier |
| `dismiss_popup()` | Close cookie banners, modals, newsletter popups | Clearing obstacles before interacting |
| `use_filter(name, value)` | Apply a filter or sort option on listing pages | Narrowing results by price, rating, distance |
| `expand(target)` | Click "Show more", expand accordion, open collapsed section | Revealing hidden content |
| `select_option(target, value)` | Choose from a dropdown/select element | Forms, filter dropdowns |
| `right_click(target)` | Open context menu on an element | Accessing secondary actions |
| `drag(source, destination)` | Drag an element to another location | App Fusion, reordering, file uploads |

### 6.2 Smart Click System

Clicking is the most common action and the most fragile. The current system relies on CSS selectors that break constantly. The Smart Click System uses a priority chain:

```
Click priority (try each, fall through to next):

1. Text match       → Find element whose visible text matches the target
                       "Click 'Hotel Amigo'" → finds the link/button with that text
                       Most reliable. Text rarely changes between page loads.

2. Aria-label match → Find element with matching aria-label attribute
                       "Click the search button" → finds [aria-label="Search"]
                       Stable across UI redesigns.

3. data-testid      → Find element with matching data-testid or data-qa
                       Most stable for apps that use testing attributes.

4. Role + context   → Find element by ARIA role near specific text
                       "Click the button near 'Check availability'"
                       Handles cases where the button itself has no text.

5. CSS selector     → Direct CSS selector as last resort
                       Only used when the LLM returns a specific selector.
                       Most fragile — breaks on CSS class changes.

6. Position fallback → Click at coordinates relative to a known landmark
                       Emergency fallback. Used < 1% of actions.
```

**Text-based clicking example:**

```
LLM says: click("Hotel Amigo")

Bridge.js:
  1. querySelectorAll('a, button, [role="button"], [role="link"]')
  2. For each: does .textContent.trim() contain "Hotel Amigo"?
  3. Found: <a href="/hotel/amigo">Hotel Amigo — Luxury 5-Star</a>
  4. Click it with full event sequence

Much more reliable than: click(".sr-card__name > a.hotel-name-link:nth-child(1)")
```

### 6.3 Reactive Wait System

No more fixed wait times. The agent waits for the page to respond, not for a timer.

```
CURRENT (fixed timers):
  click() → wait 2000ms → read page → maybe it loaded, maybe not

NEW (reactive):
  click() → start watching for:
    ├── URL changed? (navigation)
    ├── MutationObserver: new elements added to DOM? (content loaded)
    ├── Network requests completed? (API responses finished)
    ├── Performance Observer: LCP fired? (main content rendered)
    ├── CSS transitions ended? (animations finished)
    └── aria-busy changed to false? (loading indicator removed)
  → First signal that matches = page is ready
  → Maximum wait: 10 seconds (timeout fallback)
  → Average wait: 200-800ms (much faster than fixed 2000ms)
```

**How it works in bridge.js:**

```javascript
// After every action, bridge.js watches for completion:
function waitForPageSettle() {
  return new Promise(resolve => {
    let settled = false

    // Watch for DOM mutations (new content)
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.addedNodes.length > 0)) {
        debounce(() => { settled = true; resolve('dom_changed') }, 300)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    // Watch for network idle
    const perfObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          settled = true; resolve('lcp_fired')
        }
      }
    })
    perfObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // Watch for URL change (navigation)
    const originalUrl = location.href
    const urlCheck = setInterval(() => {
      if (location.href !== originalUrl) { settled = true; resolve('url_changed') }
    }, 50)

    // Timeout fallback
    setTimeout(() => { if (!settled) resolve('timeout') }, 10000)
  })
}
```

### 6.4 Popup & Obstacle Dismissal

Before the agent can interact with a page, it often needs to dismiss obstacles:

| Obstacle | Detection | Dismissal |
|---|---|---|
| Cookie consent banner | Elements with text "Accept", "Cookie", "Consent"; `z-index > 1000` | Click "Accept" or "Accept all" button |
| Newsletter popup | `role="dialog"` or modal overlay appearing after delay | Click close button (✕), or press Escape |
| Login wall | Form with email/password fields blocking content | Go back, try a different source |
| Chat widget | Fixed-position element in bottom-right, typically iframe | Click minimize/close |
| Notification prompt | Browser permission dialog | Dismiss via Electron API |
| GDPR overlay | Full-screen overlay with privacy text | Click "Accept" or "Reject all" |
| Paywall | Content truncated with "Subscribe to read more" | Go back, try a different source |

The agent dismisses obstacles automatically before attempting any other action on the page.

### 6.5 Smart Search Behavior

When the agent needs to search, it doesn't just type the user's words into Google:

**Query refinement:**
```
User says: "find best hotels in brussels"

Agent's search strategy:
  Search 1: "best hotels brussels 2026" (add year for fresh results)
  Search 2: "brussels hotels booking.com" (target reliable source)
  Search 3: "brussels boutique hotels city center" (refine based on findings)
```

**Search operator usage:**
- `site:booking.com hotels brussels` — search within a specific site
- `"Hotel Amigo" brussels reviews` — exact match for cross-referencing
- `hotels brussels -pinterest -tiktok` — exclude noise sites

**Direct navigation:**
For well-known sites, skip Google entirely:
- User says "check booking.com" → `navigate("https://booking.com")`
- User says "search on tripadvisor" → `navigate("https://tripadvisor.com/Hotels-Brussels")`

**Search results intelligence:**
- Read titles AND snippets before clicking (snippets often contain the answer)
- Skip ads — detect "Sponsored" labels, ad containers, tracking URLs
- Prioritize first-party results over aggregators
- Check URLs before clicking — `/hotel/` = detail page, `/search` = listing page

### 6.6 Content Discovery

The agent proactively discovers hidden content:

| Pattern | Detection | Action |
|---|---|---|
| Below the fold | Intersection Observer: more content exists below viewport | Scroll down to see it |
| Lazy loading | Scroll triggers new content (infinite scroll) | Scroll to trigger, then read |
| "Show more" buttons | Button/link with text "Show more", "Load more", "See all" | Click to expand |
| Collapsed sections | `aria-expanded="false"`, accordion patterns, `+` icons | Click to expand |
| Tabbed content | `role="tab"`, tab panels with hidden sections | Click tabs to see each section |
| Pagination | Page numbers, "Next" button, `rel="next"` | Navigate to additional pages if needed |
| Dropdown menus | `aria-haspopup="true"`, hover-triggered content | Hover to reveal options |
| Filters not applied | Filter controls with default values | Apply relevant filters to narrow results |

### 6.7 Form Intelligence

When the agent encounters forms, it understands them as a unit — not individual fields:

**Form type recognition:**

| Form type | Detection | Behavior |
|---|---|---|
| Search form | Single text input + submit; `role="search"` | Type query, press Enter |
| Login form | Email/username + password + submit | Detect login wall, go back if not authorized |
| Multi-step form | Multiple pages/sections; progress indicator; "Next" button | Fill current section, advance, fill next |
| Filter form | Checkboxes, dropdowns, range sliders; no submit (auto-apply) | Select relevant filters, wait for results to update |
| Checkout form | Payment fields, `autocomplete="cc-number"` | Requires user approval before filling |
| Contact form | Name, email, message fields | Fill if instructed by user |

**Form field mapping:**
The agent reads `autocomplete` attributes and `<label>` elements to understand what each field expects:
- `autocomplete="email"` → email address
- `autocomplete="given-name"` → first name
- `<label for="checkin">Check-in date</label>` → date picker for arrival

### 6.8 Navigation History

The agent maintains a navigation history within each task — not just URLs visited, but what was found and whether it was useful:

```
Navigation history for "find best hotels in Brussels":

  1. google.com/search?q=best+hotels+brussels+2026
     → useful: yes (found booking.com and tripadvisor links)
     → extracted: nothing yet, just identified promising results

  2. booking.com/searchresults?city=Brussels
     → useful: yes
     → extracted: Hotel Amigo €210 (9.1), NH Collection €168 (8.7), Hotel Bloom €145 (8.3)

  3. randomtravelblog.com/brussels-hotels
     → useful: no (outdated content from 2019, affiliate links)
     → action: went back after 3 seconds

  4. tripadvisor.com/Hotels-Brussels
     → useful: yes
     → extracted: Hotel Amigo ranked #3, 2847 reviews, mostly positive

  Current: Deciding whether to check one more source or synthesize findings
```

This history feeds into the ActionDecider so the agent never revisits useless pages and always knows where it's been.

---

## 7. Visual Performance System

The Visual Performance System controls how the agent's actions look to the user. Every click, scroll, type, and pause is animated to look like a smart human working. This is not cosmetic — the visual behavior IS the intelligence made visible.

### 7.1 Cursor Movement

The cursor moves in human-like curves, not straight lines:

```
Straight (robotic):     A ───────────────────→ B

Human (Maia):           A ~~→ ~~~→ ~~~~→ ~~→ B
                          (accelerate, slight arc, overshoot, settle)
```

**Cursor movement uses cubic bezier curves with:**
- Acceleration from rest (slow start)
- Slight arc (not perfectly straight — humans don't move in straight lines)
- Micro-overshoot at the target (2-4px past, then correct back)
- Variable speed based on distance (short = 200ms, medium = 350ms, long = 500ms)

### 7.2 Variable Speed by Intent

The cursor speed changes based on what the agent is doing:

| Intent | Speed | Behavior |
|---|---|---|
| Going to a known target (search box, back button) | Fast, direct | The agent knows exactly where to go |
| Scanning search results | Slow, drifting downward | Reading each result, pausing on promising ones |
| Choosing a result to click | Medium, decisive | Made a decision, moving with purpose |
| Skipping an ad | Quick veer away | Briefly moves toward it, then deliberately avoids it |
| Reading article content | Slow horizontal tracking | Following the text like eyes reading |
| Going back (disappointed) | Quick flick to back button | "This page wasn't useful" |

### 7.3 Gaze Simulation

Before clicking a search result, the cursor drifts over the results list — pausing on each one briefly:

```
Search results:
  1. Hotel Amigo — Booking.com          ← cursor pauses 400ms (reading)
  2. Brussels Hotels — TripAdvisor       ← cursor pauses 300ms (reading)
  3. 10 Best Hotels — Random Blog        ← cursor passes quickly (skipping)
  4. NH Collection — Booking.com         ← cursor pauses 200ms (noting)
  ↓
  Cursor moves decisively to result #1   ← chose the best one
```

The user sees: "it considered all the options and picked the best one."

### 7.4 Typing Animation

Typing appears character-by-character at variable speed:

```
"best hotels in brussels"

b [70ms] e [55ms] s [80ms] t [60ms]   [50ms]
h [65ms] o [75ms] t [55ms] e [60ms] l [70ms] s [55ms]   [50ms]
i [60ms] n [50ms]   [pause 180ms — thinking]
b [70ms] r [60ms] u [80ms] s [55ms] s [65ms] e [70ms] l [55ms] s [60ms]
```

**Typing personality:**
- Variable per-character delay (50-100ms, randomized)
- Slightly longer pauses before proper nouns and numbers
- Occasional 150-250ms thinking pause mid-word
- Speed increases for common words ("the", "in", "of")

### 7.5 Element Glow

Before clicking any element, it gets a subtle blue glow for 300ms:

```
Timeline of a click:
  0ms:     Cursor arrives at element
  0-300ms: Element gets 2px blue (#3B82F6) outline glow (recognition)
  300ms:   Click event dispatched
  300-700ms: Ripple animation expands from click point (confirmation)
  700ms:   Done — page reaction begins
```

Two distinct visual phases: **recognition** (I see this element) → **action** (I'm clicking it). The user sees intentionality, not random clicking.

### 7.6 Progressive Highlighting

When the agent finds important information on a page, highlights appear progressively as the scan line passes over them — like watching someone use a highlighter:

```
Timeline on a hotel listing page:
  0ms:      Scan line starts at top of page
  800ms:    Scan line reaches "€210/night" → price glows yellow
  1200ms:   Scan line reaches "9.1 Wonderful" → rating glows yellow
  1600ms:   Scan line reaches "Grand Place" → location glows yellow
  2000ms:   Scan line reaches bottom, fades out
  
  Three key facts highlighted — user sees exactly what the agent noticed
```

### 7.7 Scroll With Purpose

Scrolling behavior changes based on what the agent is looking for:

| Scroll type | Behavior |
|---|---|
| Exploring | Smooth, medium speed, pauses when passing interesting content |
| Searching for specific content | Fast scroll, stops abruptly when target found |
| Reading a page top-to-bottom | Slow, steady, follows the scan line |
| Skipping to a section | Quick scroll, then slow approach to target |
| Scrolling back up | Quick — "wait, I need to re-read that" |

### 7.8 Content Extraction Animation

When the agent captures a piece of data for Research Memory, show a brief visual:

```
Agent reads: "€210/night"
  → Text briefly pulses with a soft blue glow (200ms)
  → Small "captured" indicator appears (floating ↑ icon)
  → Fades after 500ms
  → Team chat shows: "got it — Hotel Amigo €210/night"
```

### 7.9 Live Comparison Tables

As the agent visits multiple sources, the team chat builds a comparison in real-time:

```
🔍 Research
checking booking.com...

  Hotel Amigo     ★ 9.1  €210/night  📍 Grand Place
  NH Collection   ★ 8.7  €168/night  📍 Central Station

🔍 Research
now checking tripadvisor for reviews...

  Hotel Amigo     ★ 9.1  €210/night  📍 Grand Place    #3 on TripAdvisor
  NH Collection   ★ 8.7  €168/night  📍 Central Station
  Hotel Bloom     ★ 8.3  €145/night  📍 Botanical Garden

🔍 Research
ok here's my recommendation across 3 sites:

  🏆 Hotel Amigo — €210/night
     9.1 on Booking, ranked #3 on TripAdvisor, 2847 reviews
     right on Grand Place, luxury 5-star. only downside: no pool

  💰 NH Collection — €168/night
     8.7 rating, near Central Station, great breakfast included
     best value pick

  🎨 Hotel Bloom — €145/night
     cheapest option, modern artsy design, slightly further from center

want me to check availability for specific dates?
```

### 7.10 Confidence Signals

The agent expresses confidence in its findings through team chat:

```
High confidence:
  "booking.com and tripadvisor both agree Hotel Amigo is top-rated
   and the price is consistent across sites — pretty confident in this one"

Low confidence:
  "only found this hotel on one blog, let me verify on a proper booking site"

Research incomplete:
  "checked 2 sites so far, want me to look at one more before deciding?"
```

### 7.11 Back Navigation With Reasoning

When the agent goes back, the team chat explains why:

```
"this page is mostly ads and affiliate links, going back to try tripadvisor"
"outdated — last updated 2019, let me find something more recent"
"paywall — can't read the full article, trying another source"
```

The user sees the agent making intelligent decisions, not just randomly clicking around.

---

## 8. App System

### 8.1 App Container (Sandboxed WebContainer)

Each installed app runs in its own **isolated sandbox** — a separate Electron BrowserView with its own process, storage, and network.

```
WebContainer (Sandbox):
  - Isolated webview (separate OS process)
  - Dedicated cookie/session storage (encrypted on disk, per-app)
  - Dedicated network proxy (traffic intercepted separately per app)
  - Injected bridge script (DOM Brain connection)
  - Persistent login (user signs in once, stays logged in across restarts)
  - Notification forwarding (app notifications → Maia dock badges)

Sandbox rules:
  - Gmail sandbox CANNOT access Slack's cookies or data
  - Slack sandbox CANNOT read Gmail's DOM
  - Apps are isolated from EACH OTHER
  - Only the Intelligence Layer bridges data between apps (App Fusion)
  - Uninstalling an app deletes ALL of its sandbox data
  - Each sandbox has its own memory/CPU limits
```

**Why sandbox matters:**
- **Security** — a malicious website can't steal data from other apps
- **Stability** — one app crashing doesn't kill others
- **Privacy** — each app's data is encrypted separately on disk
- **Clean** — uninstalling an app removes everything, no leftover data

### 8.2 App Manifest

Every app in the Maia App Store has a manifest:

```yaml
name: Gmail
id: google.gmail
icon: gmail.png
type: web
url: https://mail.google.com
category: productivity

intelligence:
  network: true
  dom: true

capabilities:
  - read_emails
  - compose_email
  - search_emails
  - manage_labels
  - read_contacts

ai_description: >
  Read, compose, search, and organize emails.
  Extract data from emails. Reply automatically.
```

### 8.3 App Lifecycle

```
Install:   Create container → load URL → user signs in → persist session → register
Open:      Activate container → show window → resume session → connect intelligence
Close:     Hide window → keep container alive (for Ghost Mode and notifications)
Uninstall: Destroy container → delete session data → remove from registry
```

### 8.4 Cross-App Data Flow (App Fusion)

```
Source App (e.g., Gmail)
     │
     │ User drags an email (or AI reads it)
     │
     ▼
Intelligence Layer
     │
     │ Extracts structured data:
     │ { from: "vendor@acme.com", subject: "Invoice #4521", amount: "$2,400" }
     │
     ▼
Target App (e.g., Sheets)
     │
     │ Writes data via DOM Brain or Network Brain:
     │ Row 15: ["Acme Corp", "$2,400", "Invoice #4521", "2026-04-04"]
     │
     Done — user sees the data appear in Sheets
```

---

## 9. Brain, App Agents & Orchestrator

### 9.1 Design Philosophy: App Agents

Every other AI agent works like this: one brain controls the browser, making every decision — what to click, when to scroll, what to type. The brain micromanages every keystroke. This fails because the LLM forgets steps, makes 8+ sequential decisions where each can fail, and has no real understanding of the app it's controlling.

Maia inverts this with **App Agents** — specialized agents that know their app inside out, like hiring an expert:

```
Other agents:
  Brain → "click textarea[name=q]" → "type Uganda" → "press Enter" →
          "scroll down" → "click Wikipedia link" → ...
  
  8+ LLM decisions per source. Each one can fail. Brain micromanages.

Maia:
  Brain → "Research Uganda from 5 credible sources"
  ChromeAgent → "I know Google. I'll handle the searching, scrolling,
                 clicking, reading. Here are the findings from 5 sources."
  
  1 Brain decision. Agent handles everything else with built-in skills.
```

**The key principle: the Brain is the strategist, the Agent is the skilled worker.**

- **Brain** (Orchestrator): WHAT to do and WHY — "research Uganda", "write a report", "download as PDF"
- **App Agent**: HOW to use the app — searching, scrolling, clicking, typing, navigating. Born knowing its app. No LLM needed for mechanical operations.

Like a real company:
- CEO (Orchestrator) doesn't tell employees which keys to press
- Manager (Brain) gives the task: "get info from 5 sources"
- Employee (ChromeAgent) knows Google, handles everything, returns results

### 9.2 App Agent Architecture

Each app gets its own agent class with hardcoded, deterministic skills:

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                            │
│  Decomposes task → assigns sub-tasks → coordinates agents    │
└──────────────────────┬──────────────────────────────────────┘
                       │ sub-tasks
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ChromeAgent  │ │  DocsAgent   │ │  GmailAgent  │
│              │ │              │ │              │
│ Skills:      │ │ Skills:      │ │ Skills:      │
│ • search     │ │ • createDoc  │ │ • compose    │
│ • pickResult │ │ • nameDoc    │ │ • fillTo     │
│ • readPage   │ │ • writeText  │ │ • fillSubject│
│ • extract    │ │ • addHeading │ │ • writeBody  │
│ • goBack     │ │ • downloadPDF│ │ • send       │
│              │ │              │ │              │
│ Knows Google │ │ Knows Docs   │ │ Knows Gmail  │
│ inside out   │ │ inside out   │ │ inside out   │
└──────────────┘ └──────────────┘ └──────────────┘
```

**What makes App Agents different from action-by-action Brain control:**

| | Brain (old) | App Agent (new) |
|---|---|---|
| Who decides to scroll? | LLM (often forgets) | Agent code (always scrolls) |
| Who presses Enter after search? | LLM (often forgets) | Agent code (always presses) |
| Who dismisses popups? | LLM (often misses) | Agent code (always dismisses) |
| Who picks search results? | LLM (scans raw page dump) | Agent (pre-filters, scores credibility, LLM picks from clean list) |
| Who reads page content? | LLM (often skips scrolling) | Agent (scrolls through, captures text, LLM extracts meaning) |
| LLM calls per source | 8-10 (one per keystroke) | 2 (extract content + assess completeness) |

### 9.3 App Agent Skills

Each agent has deterministic skills — code that executes without LLM involvement:

**ChromeAgent (Google Search):**
```
search(query)     → clear box, type query, press Enter, wait for results,
                    scroll to results — all deterministic, can't fail
pickResult()      → read all links, filter visited, score credibility,
                    present top 5 to LLM → LLM picks one number
clickResult(link) → scroll to element, click, wait for page, dismiss popups
readPage()        → scroll through content (3-5 scrolls), capture text
extract()         → [LLM] extract key facts from captured text
goBack()          → navigate back, scroll past seen results
```

**DocsAgent (Google Docs):**
```
createDoc()       → click "Blank document", wait for editor to load
nameDoc(title)    → click title field, type name, press Enter
writeHeading(text, level) → select heading style, type text
writeParagraph(text)      → type in document body
downloadPDF()     → File menu → Download → PDF Document
```

**GmailAgent (Gmail):**
```
compose()         → click Compose button, wait for compose window
fillTo(email)     → click To field, type email
fillSubject(text) → click Subject field, type text
writeBody(text)   → click body area, type content
send()            → click Send button
searchInbox(q)    → click search bar, type query, press Enter
```

Skills are:
- **Deterministic** — no LLM, can't forget steps
- **Tested** — each skill is a function that always executes the same steps
- **App-specific** — written using knowledge from the app's manifest (navigation guide + rules)
- **Composable** — the Brain chains skills: `search → pickResult → readPage → extract → goBack`

### 9.4 When the LLM IS Needed

The App Agent handles mechanics. The LLM handles judgment:

| Decision | Who decides | Why |
|---|---|---|
| How to search Google | Agent (code) | Same steps every time |
| WHAT to search for | Brain (LLM) | Requires understanding the task |
| How to scroll results | Agent (code) | Same steps every time |
| WHICH result to click | Brain (LLM) | Requires evaluating relevance |
| How to read a page | Agent (code) | Scroll + capture |
| WHAT facts to extract | Brain (LLM) | Requires comprehension |
| How to go back | Agent (code) | Always the same |
| WHETHER to continue or stop | Brain (LLM) | Requires assessing completeness |
| How to write in Docs | Agent (code) | Same steps every time |
| WHAT to write | Brain (LLM) | Requires synthesis |

**The rule: if a human expert would do it the same way every time, it's agent code. If it requires thinking, it's LLM.**

### 9.5 AgentFactory

When the Orchestrator assigns a sub-task to an app, the AgentFactory creates the right agent:

```
AgentFactory.create(appId, appUrl) →
  google.com     → ChromeAgent
  docs.google    → DocsAgent
  mail.google    → GmailAgent
  sheets.google  → SheetsAgent
  slack.com      → SlackAgent
  notion.so      → NotionAgent
  unknown URL    → GenericAgent (reads manifest, uses basic skills)
```

Custom apps installed by the user get a **GenericAgent** that:
- Reads the app's manifest (auto-generated by ManifestGenerator if custom)
- Has basic skills: click by text, type in inputs, scroll, go back
- Doesn't have app-specific skills but can still operate

### 9.6 Example: Full Task Flow

```
User: "Research Uganda and write the report in Google Docs, download the PDF"

Orchestrator:
  Sub-task 1: "Research Uganda from 5 credible sources" → Web Browser
  Sub-task 2: "Write structured report" → Google Docs (depends on 1)
  Sub-task 3: "Download as PDF" → Google Docs (depends on 2)

Sub-task 1 → AgentFactory creates ChromeAgent:
  ChromeAgent.search("Uganda 2026")              ← deterministic skill
  ChromeAgent.pickResult()                         ← LLM picks from scored list
  ChromeAgent.clickResult("Uganda - Wikipedia")    ← deterministic skill
  ChromeAgent.readPage()                           ← deterministic skill  
  ChromeAgent.extract()                            ← LLM extracts facts
  ChromeAgent.goBack()                             ← deterministic skill
  ... repeats 4 more times ...
  → Returns: research findings from 5 sources

Sub-task 2 → AgentFactory creates DocsAgent:
  DocsAgent.createDoc()                            ← deterministic skill
  DocsAgent.nameDoc("Uganda Research Report")      ← deterministic skill
  DocsAgent.writeHeading("Introduction", 1)        ← deterministic skill
  DocsAgent.writeParagraph(synthesized content)     ← LLM writes the content
  DocsAgent.writeHeading("Economy", 1)             ← deterministic skill
  DocsAgent.writeParagraph(economy content)         ← LLM writes the content
  ... continues for each section ...

Sub-task 3 → AgentFactory creates DocsAgent:
  DocsAgent.downloadPDF()                          ← deterministic skill
  → Done
```

Total LLM calls: ~12 (5 extractions + 1 result pick per source + synthesis)
Total deterministic actions: ~60 (all handled by agent code, zero failures)

### 9.7 Orchestrator

The Orchestrator decomposes tasks, assigns the right App Agent to each sub-task, and coordinates sequential/parallel execution. One agent per app at a time — no two agents can control the same browser simultaneously.

#### 9.7.1 Capability-Aware Routing

Each specialist agent declares structured capabilities. The Orchestrator matches task semantics to capabilities:

```
Agent Capabilities (declared per agent):

  travel:
    domains: [flights, hotels, transportation, visas, itineraries]
    verbs: [book, search, compare, reserve, cancel]
    apps: [google.flights, booking.com, expedia, airbnb]
    complexity: multi-step

  budget:
    domains: [expenses, costs, pricing, budgets, invoices]
    verbs: [track, compare, calculate, approve, report]
    apps: [google.sheets, airtable, quickbooks]
    complexity: analytical

  email:
    domains: [email, communication, drafts, replies, follow-ups]
    verbs: [compose, reply, forward, search, organize]
    apps: [google.gmail, outlook]
    complexity: single-step

  ...etc for all 7 agents
```

**How routing works:**
1. Task arrives: "Book a flight to Tokyo under $800"
2. Orchestrator sends task + all agent capabilities to LLM
3. LLM returns ranked agent matches with reasoning
4. Top match becomes primary agent
5. Secondary matches get observer roles (can jump in)

No keyword substring matching. No defaulting to "research" for everything. The LLM understands that "budget for this flight" needs travel (primary) AND budget (observer).

#### 9.2.3 Agent Bidding System

For complex tasks, agents bid on sub-tasks:

```
Orchestrator broadcasts: "Plan a team trip to Tokyo — flights, hotels, budget"

  Travel agent bids:  confidence 0.95 — "I handle flights and hotels"
  Budget agent bids:  confidence 0.90 — "I handle cost tracking and limits"
  Calendar agent bids: confidence 0.80 — "I can check team availability"
  Research agent bids: confidence 0.40 — "I can search for general info"
  Policy agent bids:  confidence 0.70 — "I can check travel policy compliance"

Orchestrator assigns:
  Primary:    Travel (flights + hotels)
  Secondary:  Budget (cost validation)
  Supporting: Calendar (availability check)
  Observer:   Policy (compliance watch — speaks up if needed)
  Skipped:    Research (not needed, specialists cover it)
```

Bids include:
- **Confidence score** (0-1): how well the agent can handle this
- **Reasoning**: why the agent thinks it's a good fit
- **Estimated complexity**: simple / multi-step / analytical
- **Relevant apps**: which apps the agent would use

#### 9.2.4 Adaptive Plans

Plans are living documents, not rigid scripts. After each step, the Brain re-evaluates:

```
Initial plan:
  Step 1: Search Google Flights for Tokyo      [completed]
  Step 2: Compare top 3 results                [completed]
  Step 3: Check hotel options                  [in progress]

After step 2, Brain discovers: "All flights are over $800"

Re-evaluated plan:
  Step 1: Search Google Flights for Tokyo      [completed]
  Step 2: Compare top 3 results                [completed]
  Step 2b: Search budget carriers (Zipair, Peach) ← NEW
  Step 2c: Check flexible dates (±3 days) ← NEW
  Step 3: Check hotel options                  [pending — moved]

The plan adapts to reality. The agent doesn't blindly follow step 3
when step 2 revealed a problem.
```

**Re-evaluation triggers:**
- Step completed — "Given what I just learned, is this plan still right?"
- Unexpected finding — "This changes my approach"
- Agent challenge — "Budget agent says we're over limit, need to adjust"
- User intervention — "User said skip hotels, just flights"

#### 9.2.5 Shared State Between Agents

Agents are not isolated. They share a live research state:

```
Shared Task State:
  task: "Plan team trip to Tokyo"
  status: in_progress

  agents:
    travel:   { status: working, findings: ["ANA $620", "JAL $750"] }
    budget:   { status: watching, alert: "Q2 budget 73% spent, $840 remaining" }
    calendar: { status: done, findings: "March 17-24 works for all 8 people" }
    policy:   { status: observing, flag: "14-day advance booking required" }

  shared_findings:
    - { source: "google.flights", data: [...], agent: "travel" }
    - { source: "company.sheets", data: [...], agent: "budget" }

  decisions:
    - { question: "Economy or business?", decided_by: "user", answer: "economy" }
    - { question: "Include hotel?", decided_by: "travel", answer: "yes, user confirmed" }
```

Every agent can read every other agent's findings. When travel finds a $620 flight, budget immediately knows and can validate it against the remaining budget. No agent works in a vacuum.

#### 9.2.6 Orchestrator Lifecycle

```
1. DECOMPOSE
   Task arrives → LLM decomposes into sub-tasks with dependencies

2. BID
   Sub-tasks broadcast to agents → agents return confidence bids

3. ASSIGN
   Orchestrator picks winners → primary + secondary + observers

4. EXECUTE
   Agents run in parallel (respecting dependencies)
   Shared state updates in real-time
   Team chat shows all activity

5. COLLABORATE
   Agents react to each other's findings
   Debates happen naturally in team chat
   Orchestrator watches for convergence or deadlock

6. SYNTHESIZE
   All findings merged → final answer composed from Research Memory
   Presented in team chat with structured comparison

7. DELIVER
   User gets the answer + the reasoning + the team's debate history
```

#### 9.2.7 Failure Recovery

```
Sub-task fails:
  1. Mark sub-task as failed (not silently stuck)
  2. Notify dependent sub-tasks — they re-plan or skip
  3. Failing agent explains in team chat: "Couldn't load Google Flights, trying Skyscanner"
  4. If retry fails: Orchestrator reassigns to a different agent or asks user

Agent deadlock (going in circles):
  1. Orchestrator detects 3+ consecutive no-progress iterations
  2. Posts in team chat: "Travel is stuck on the booking page. Anyone have ideas?"
  3. Other agents can suggest approaches
  4. If no resolution: escalate to user

Team deadlock (agents disagree, no convergence):
  1. Orchestrator detects 3+ rounds of back-and-forth with no agreement
  2. Posts: "Team's split on this one. @User, want to weigh in?"
  3. User decides, agents fall in line
```

### 9.3 LLM Provider Abstraction

Provider-agnostic. Start with OpenAI, swap providers without changing code.

```
Supported: OpenAI (GPT-4o), Anthropic (Claude), local models (future)
Fallback: If primary fails 3 times, auto-switch to secondary
Cost tracking: Every call logged with token count and cost
Budget guardrails: Auto-pause at 80% of budget, hard stop at 100%
```

### 9.4 Adaptive Browsing Loop

The Brain operates in an adaptive research loop:

```
LOOP:
  1. What do I know? (read Research Memory + shared state)
  2. What do I see? (read Page Scraper output)
  3. What does my team know? (read other agents' findings)
  4. What do I still need? (compare knowledge vs user's goal)
  5. Should I re-evaluate the plan? (check if findings changed assumptions)
  6. What should I do next? (choose from full action vocabulary)
     → Search with better terms?
     → Click into a result to read more?
     → Go back because this page is useless?
     → Scroll down to see more options?
     → Use filters to narrow results?
     → Challenge another agent's finding?
     → I have enough — synthesize and share findings?
  7. Do it → observe result → share update in team chat → back to step 1
UNTIL: confident enough to answer, or user intervenes
```

The TaskPlanner creates an initial plan for structure, but the Brain can deviate and re-evaluate at any time. The plan is a guide, not a script.

**Decision factors:**
- Research Memory completeness — "Do I have enough data to compare?"
- Source diversity — "I've only checked one site, should I verify elsewhere?"
- Confidence level — "All sources agree → high confidence → ready to report"
- Team state — "Budget agent flagged a problem, I need to adjust"
- Time spent — "I've been researching for 30 seconds, should I wrap up?"
- User patience — "The user is watching, I should share progress updates"

### 9.5 Personality-Driven Behavior

Agent personality doesn't just affect chat tone — it drives browsing behavior. Each agent's expertise shapes HOW it interacts with apps:

```
Budget agent browsing a hotel listing:
  → Clicks "Price" sort first
  → Reads cost columns before reviews
  → Flags anything over budget immediately
  → Ignores amenities unless cost-relevant

Travel agent browsing the same listing:
  → Reads location and transport links first
  → Checks distance to conference venue
  → Reads reviews about comfort and service
  → Notes check-in/check-out flexibility

Analyst agent browsing the same listing:
  → Looks for data tables and statistics
  → Compares ratings across multiple dimensions
  → Builds structured comparison from raw data
  → Exports findings to a spreadsheet format
```

The personality config feeds into the ActionDecider prompt, not just the chat prompt. The navigation guide + agent expertise = behavioral specialization.

### 9.6 Self-Healing

When an action fails, the Brain doesn't retry blindly:

```
1. Detect: action didn't produce expected result
2. Diagnose: what went wrong (element missing? page changed? popup?)
3. Adapt: try a different approach
4. Retry: max 3 attempts with different strategies
5. Share: tell the team what happened and what you're trying
6. Escalate: ask user if all retries fail
```

---

## 10. Theatre (The Desktop Environment)

Theatre is the desktop environment of Maia Computer. It includes the home screen, app windows with split-screen support, dock, spotlight, spaces, and command bar. The Team Chat is a full app — not a sidebar.

### 10.1 Home Screen

The default view when no app is open. Shows installed apps and the command input.

### 10.2 App Windows

Each open app gets a window with:
- Title bar (app icon, name, window controls: minimize, maximize, close)
- App content (the real web app in a webview, sandboxed)
- Command bar at the bottom (type commands for this specific app)

### 10.3 Window Management (Split Screen)

Apps snap into position like Windows/macOS split view. Multiple apps run side-by-side. Users drag windows to edges or use keyboard shortcuts.

**Snap zones:**

```
┌──────────────┬──────────────┐    ┌──────┬──────┐
│              │              │    │      │      │
│   Left 50%  │  Right 50%   │    │ TL25 │ TR25 │
│              │              │    │      │      │
│              │              │    ├──────┼──────┤
│              │              │    │      │      │
│              │              │    │ BL25 │ BR25 │
└──────────────┴──────────────┘    └──────┴──────┘

  2-way split (50/50)              4-way split (quadrants)

┌────────┬────────┬────────┐
│        │        │        │
│  33%   │  33%   │  33%   │
│        │        │        │
│        │        │        │
└────────┴────────┴────────┘

  3-way split (thirds)
```

**Keyboard shortcuts:**

| Shortcut | Action |
|---|---|
| Cmd+Left | Snap window to left 50% |
| Cmd+Right | Snap window to right 50% |
| Cmd+Up | Maximize window to 100% |
| Cmd+Down | Restore/minimize window |

**Drag behavior:**

| Drag to | Result |
|---|---|
| Left edge | Snap left 50% |
| Right edge | Snap right 50% |
| Top-left corner | Snap top-left 25% |
| Top-right corner | Snap top-right 25% |
| Bottom-left corner | Snap bottom-left 25% |
| Bottom-right corner | Snap bottom-right 25% |
| Top edge center | Maximize |
| Double-click title bar | Toggle maximize/restore |

### 10.4 Team Chat (Full App)

Team Chat is a full app — it has its own icon in the dock, its own window, and can be snapped alongside other apps. It is NOT a sidebar.

```
┌────┐
│ 💬 │  ← Team Chat in the dock, like any other app
│Chat│
│ 3  │  ← 3 unread messages from agents
└────┘
```

**What's in the Team Chat app:**
- Active task description at the top
- Active agents listed (Research, Budget, Calendar, etc.)
- Messages from agents (with icons, colors, timestamps)
- Messages from the user
- Agents @mention each other and the user
- Agents challenge each other, ask questions, agree/disagree
- User participates as an equal teammate
- Input field at the bottom

**Typical split:** User works in Gmail (left 70%) with Team Chat snapped right (30%). Agents discuss in the chat while the user reads emails.

### 10.5 Dock

macOS-style dock at the bottom. Auto-hides — appears when the user hovers at the bottom edge.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  ┃  ┌────┐ ┌────┐ ┌────┐ │
│  │ 📧 │ │ 💬 │ │ 📊 │ │ 🌐 │ │ 💬 │  ┃  │ 📅 │ │ ⚙️ │ │ ⊞  │ │
│  │Mail│ │WApp│ │Shts│ │Chrm│ │Chat│  ┃  │Cal │ │Set │ │Apps│ │
│  │ ·  │ │ 5  │ │    │ │    │ │ 3  │  ┃  │    │ │    │ │    │ │
│  └────┘ └────┘ └────┘ └────┘ └────┘  ┃  └────┘ └────┘ └────┘ │
│                                       ┃                         │
│  Recently Used                        ┃  Pinned    Settings App │
│                                       ┃                   Store │
└─────────────────────────────────────────────────────────────────┘
```

**Dock layout:**
- Left section: recently used apps (auto-sorted by last use, max 7)
- Divider: thin vertical line
- Right section: user-pinned apps + ⚙️ Settings + ⊞ App Store (always last two)

**Dock behaviors:**
- Auto-hide by default (appears on hover at bottom edge)
- Hover trigger: invisible 4px strip at bottom of screen
- Slide up: 300ms ease-out
- Slide down: 200ms ease-in, after 500ms delay when mouse leaves
- Icon size: 48px, scales to 56px on hover (magnification)
- Badge: red circle with white number (notification count)
- Running dot: 4px white circle below icon for open apps
- Right-click: Pin / Unpin / Close / App Info
- Drag icons to reorder pinned section

### 10.6 Spotlight AI

Cmd+Space opens a universal search bar overlay. Searches across all installed apps using the Intelligence Layer.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│           ┌──────────────────────────────────────────┐           │
│           │ 🔍 budget Q3                             │           │
│           └──────────────────────────────────────────┘           │
│                                                                  │
│           From Gmail:                                            │
│             📧 "Q3 Budget Approved" — Sarah, yesterday           │
│                                                                  │
│           From Sheets:                                           │
│             📊 "Q3 Budget Tracker" — edited 2 hours ago          │
│                                                                  │
│           From Slack:                                            │
│             💬 "#finance: budget is locked" — Mark, 3 days ago   │
│                                                                  │
│           From Calendar:                                         │
│             📅 "Budget Review" — tomorrow at 2pm                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 10.7 Spaces

Top bar shows available spaces. Click to switch. Each space has its own apps, sessions, and AI context.

```
┌──────────────────────────────────────────────────────────────────┐
│  [● Work]  [○ Personal]  [○ Side Project]  [+ New Space]        │
├──────────────────────────────────────────────────────────────────┤
```

Switching spaces changes: which apps are visible, which accounts are active, what the AI knows about the context.

### 10.8 Picture-in-Picture

When AI is working in one app and the user is working in another, a small floating window shows the AI's activity. User can glance, expand, or dismiss.

### 10.9 Command Bar

Present at the bottom of every app window. The user types natural language commands specific to the current app:

```
In Gmail:   💬 "Reply to John saying I'll be there at 3"
In Sheets:  💬 "Add a total row at the bottom"
In Chrome:  💬 "Find the cheapest flight to Tokyo"
In Chat:    💬 "Book the ANA flight, use my Amex"
```

---

## 11. Team Communication

### 11.1 Multi-Brain Page Vision

When any agent visits a web page, ALL agents see it simultaneously through the shared Awareness Field. Each agent notices different things based on their expertise:

```
Research agent visits World Bank page about Uganda:

  Research sees: "GDP growth 5.3%, population 48M, capital Kampala"
  Budget sees:   "aid dependency 40%, debt-to-GDP 48% — fiscal risk"
  Policy sees:   "governance indicators declining since 2020"
  Analyst sees:  "GDP numbers don't match IMF data from last week"

Four perspectives. One page visit. Richer extraction.
The debate starts DURING the reading, not after.
```

This means fewer page visits but deeper understanding. One visit to the World Bank page extracts economic data (Research), flags fiscal risks (Budget), notes governance concerns (Policy), and catches data inconsistencies (Analyst) — all at once.

### 11.2 Team Chat — The Coordination Mechanism

Team Chat is not a log. It is the **actual decision-making process**. Agents think out loud, challenge each other, share findings, and arrive at better answers through debate. The user watches their team work — and can jump in at any moment.

```
The user gives a task. Then watches:

  Travel agent:  "Found a flight to Tokyo for $750 on ANA, departing Tuesday"
  Budget agent:  "That's under the $800 limit but there's no return flight cost yet.
                  What's the round trip total?"
  Travel agent:  "Round trip is $1,400"
  Budget agent:  "That's over budget. The limit was $800 total, not one-way.
                  Can you find something cheaper?"
  Analyst agent: "I looked at historical prices — $1,400 is average for this route.
                  Budget carriers like Zipair run $600 round trip"
  Travel agent:  "Good call. Searching Zipair now"
  Policy agent:  "Flagging — company policy requires 14-day advance booking.
                  Is Tuesday more than 14 days out?"

That's a real team. Each agent reacts, challenges, adds context.
```

### 11.2 Proactive Agent Participation

Agents don't wait to be addressed. They **jump in when they spot something relevant** to their expertise. This is the core "wow" factor — nobody asked budget, policy, or calendar to speak, they just did.

**Proactive triggers (per agent):**

| Agent | Jumps in when... |
|---|---|
| Budget | A price is mentioned, a purchase is being made, spending exceeds thresholds |
| Policy | A rule might be violated, compliance is relevant, approvals are needed |
| Calendar | A date/time is mentioned, scheduling conflicts exist, timezone issues |
| Travel | Transportation or accommodation is discussed, logistics matter |
| Email | Communication needs to happen, follow-ups are mentioned |
| Analyst | Data needs interpretation, comparisons are being made, numbers don't add up |
| Research | Facts need verification, more sources are needed, claims are unsubstantiated |

**When agents stay quiet:**

Each agent also has `staysQuiet` rules — they don't chime in on everything:
- Budget stays quiet during pure research phases (no costs involved yet)
- Calendar stays quiet when no dates are being discussed
- Policy stays quiet unless a rule is actually at risk

The balance: agents feel alive and helpful, not noisy and annoying.

### 11.3 Agent Debates

Agents disagree. This is a feature, not a bug. Disagreements surface problems that a single agent would miss.

**Debate rules:**

| Rule | Details |
|---|---|
| Max rounds | 2-3 exchanges per debate. Sharp, not circular. |
| Tone | Direct, not corporate. "That's over budget" not "I respectfully disagree with the cost assessment" |
| Evidence required | Agents back claims with data. "Zipair runs $600" not just "find something cheaper" |
| Personality-driven | Budget challenges on price. Policy challenges on compliance. Analyst challenges on data accuracy. |
| Resolution | Agents converge naturally, or Orchestrator escalates to user |

**Debate flow:**

```
1. Agent A makes a claim or decision
2. Agent B spots an issue from their expertise → challenges
3. Agent A responds with data or adjusts
4. Either:
   a. Convergence: agents agree → acting agent proceeds
   b. Deadlock: 3 rounds, no agreement → Orchestrator asks user
```

**What makes debates feel real:**

- `challengesOften` — Budget challenges Travel on price. Policy challenges everyone on rules.
- `challengesTrigger` — each agent has specific things that trigger a challenge
- `deferenceTo` — Budget defers to Travel on logistics. Travel defers to Budget on cost.
- Agents use each other's names: "Good call @Analyst" or "That's not right @Travel"

### 11.4 Message Structure

```typescript
{
  sender: 'computer' | 'user' | AgentId,
  receiver: 'user' | 'all' | AgentId,
  intent: MessageIntent,
  message: string,
  context: {
    app: string,
    task: string,
    replyTo?: string,          // message ID this is responding to
    findings?: ResearchFinding, // structured data being shared
    confidence?: 'low' | 'medium' | 'high',
  },
  timestamp: number,
}
```

**Message intents:**

| Intent | Used for | Example |
|---|---|---|
| `update` | Sharing progress or findings | "Found 3 flights under $700" |
| `question` | Asking the user or another agent | "What dates are you flexible on?" |
| `challenge` | Disagreeing with another agent's finding | "That price doesn't include taxes" |
| `recommendation` | Suggesting a course of action | "I'd go with the Zipair option" |
| `correction` | Fixing another agent's mistake | "Actually, that hotel is 4-star, not 5" |
| `approval_request` | Needs user sign-off before proceeding | "Ready to book. Confirm?" |
| `agreement` | Endorsing another agent's finding | "Budget checks out, proceed" |
| `flag` | Proactive warning from an observer agent | "Heads up — this needs manager approval" |
| `casual` | Natural team banter | "Your call. Noted for the expense report" |

### 11.5 User Authority Model

The user is the boss. Default mode: **observer who can become manager at any moment.**

```
Default: User watches the team work. Chat scrolls with agent discussions.
         User sees them think, disagree, correct. Feels like having a team.

Intervention: The moment the user types, everything shifts.
              User messages have AUTHORITY — agents voice concerns but comply.

  User:   "Skip the policy stuff, I already got approval"
  Policy: "Got it, noted"
  Travel: "Proceeding with booking"

  User:   "Actually, make it business class"
  Budget: "That'll blow the Q2 budget by about $1,200"
  User:   "I know. Do it anyway"
  Budget: "Your call. Noted for the expense report"
  Travel: "Searching business class options"
```

**Authority levels — what the user can do:**

| Action | Effect |
|---|---|
| Type a message | All agents see it, relevant agents respond |
| Direct an agent ("@Travel check Zipair") | That agent prioritizes the instruction |
| Override a concern ("do it anyway") | Agents comply but note their objection |
| Redirect ("forget hotels, just flights") | Orchestrator kills hotel sub-tasks, agents adjust |
| Pause ("hold on, let me think") | All agents pause, wait for user |
| Take over ("I'll do this part myself") | Active agent yields control of the app |

### 11.6 Discussion Resolution

How team discussions end — without feeling robotic:

| Scenario | Resolution |
|---|---|
| **Convergence** | Agents stop disagreeing. Acting agent proceeds: "Alright, booking the $180 hotel" |
| **Deadlock** | 3 rounds of back-and-forth. Orchestrator: "Team's split on this. @User, want to weigh in?" |
| **User decides** | User types a decision. All agents comply. No more debate on that point. |
| **Time-based** | No response from user in 30s on low-severity question → agent proceeds with default action |
| **Authority cascade** | If the question is high-severity (money, irreversible), wait up to 2 minutes for user |

The user never sees "Discussion concluded" or "Debate resolved." Agents just naturally move on — like real teammates.

### 11.7 Graduated Human Control

| Level | Name | Behavior |
|---|---|---|
| 1 | Full auto | AI works independently, team debates internally |
| 2 | Notify | AI notifies on key decisions, user sees debate summary |
| 3 | Approve major | AI pauses for major decisions — user watches team work (default) |
| 4 | Approve all | AI pauses for every decision, full team visibility |
| 5 | Collaborative | User actively participates as an equal teammate |
| 6 | Step-by-step | User approves every action, agents explain each step |

---

## 12. Tech Stack

### Desktop App

| Component | Technology | Purpose |
|---|---|---|
| App framework | Electron | Cross-platform desktop app |
| App containers | Electron BrowserView | Isolated webviews per app |
| UI framework | React + Tailwind CSS | Theatre desktop environment |
| State management | Zustand | UI state |
| Network proxy | Built-in HTTP proxy | Intercept app API traffic |
| DOM bridge | Injected JavaScript | Read/control app UI |
| LLM | OpenAI / Claude (pluggable) | AI reasoning |
| Database | SQLite (better-sqlite3) | App registry, memory, history |
| Encryption | Node.js crypto | Session data, credentials |
| File storage | Local filesystem | Recordings, screenshots |

### Why Electron

Electron gives us everything we need:
- BrowserView for running real web apps in isolated containers
- Full Node.js access for native APIs, file system, networking
- Chromium engine for rendering (the apps are web apps)
- Cross-platform (macOS + Windows + Linux) from one codebase
- Mature ecosystem, proven at scale (VS Code, Slack, Discord)

---

## 13. Product Phases

### Phase 1 — The Computer (MVP)

Ship a working OS that people download and use.

**Build:**
- Electron app shell with Theatre desktop environment
- Home screen with app grid
- Dock (auto-hide, recently used, pinned, settings, app store)
- App Store with 10+ pre-defined web app manifests
- WebContainer (sandboxed webview per app with persistent sessions)
- Network Brain (HTTP traffic interception)
- DOM Brain (injected bridge script)
- AI Brain (LLM reasoning with text input, not screenshots)
- Command bar in every app window
- Chat sidebar
- Spotlight AI (Cmd+Space universal search)
- Cost tracking + budget guardrails

**Demo:**
- Install Gmail, open it, say "Reply to John saying I'll be there at 3" → done in 3 seconds
- Install Sheets, say "Create a budget tracker" → AI builds spreadsheet instantly
- Cmd+Space: "budget" → results from Gmail, Sheets, Slack all at once

**Goal:** Record viral videos. Launch product. Users download and install.

### Phase 2 — The Intelligence

Make it smarter and more powerful.

**Build:**
- Brain Vision System (Page Nerve + Awareness Field + three-speed decisions)
- Living Goals (goals that evolve with knowledge and declare completion)
- Predictive Browsing (Brain predicts sources before search results load)
- Intention-based Actions (Brain speaks in goals, system resolves mechanics)
- Multi-Brain Vision (all agents see every page simultaneously)
- Learning Web (sites get smarter with every visit)
- App Fusion (drag data between apps)
- Ghost Mode (AI works while you're away)
- Workflows (learn from user behavior, replay automatically)
- Picture-in-Picture (watch AI work while you work)
- Memory Brain (learned patterns, preferences)

**Goal:** Power users. Enterprise interest. "My computer is smarter than yours."

### Phase 3 — The Platform

Open it up.

**Build:**
- Time Travel (rewind any app to any point using recorded state)
- Team Spaces (shared workspaces)
- Maia App SDK (developers build Maia-native apps)
- App Store marketplace (community-contributed manifests)
- Plugin system (extend any app's AI capabilities)
- Enterprise features (SSO, audit logs, compliance)
- Mobile companion (monitor and chat from phone)

**Goal:** Ecosystem. Network effects. Moat.

### Phase 4 — The Standard

**Build:**
- Native app support (wrap desktop apps via accessibility APIs)
- Local LLM support (offline mode, full privacy)
- Maia-to-Maia networking (computers collaborate across users)
- App store revenue sharing
- Maia for Teams (enterprise product)

**Goal:** Maia becomes how people use computers.

---

## 14. Key Differentiators

### What exists today vs. what Maia builds

| Capability | Market today | Maia |
|---|---|---|
| AI controls apps | Screenshots, 3-5s per action | Network + DOM, 50ms per action |
| Real apps or skins? | Skins/replicas or headless | Real apps in webviews |
| Works with any web app | Needs pre-built integrations | Yes — install any URL |
| Apps talk to each other | Zapier (rigid, pre-built) | App Fusion (AI-powered, any app) |
| AI works in background | No product does this | Ghost Mode |
| Rewind app state | No product does this | Time Travel |
| Separate contexts | Browser profiles (manual) | Spaces (one-click switch) |
| Learn automations | Requires configuration | Workflows (learn by watching) |
| Search all apps | No product does this | Spotlight AI |
| Gets smarter over time | No | Memory Brain learns patterns |
| Runs locally (privacy) | Most require cloud | Everything on user's machine |
| Cost per action | $0.01-0.03 (vision tokens) | $0.001-0.003 (text tokens) |

### The one-line pitch

> "Install your apps. Maia does the rest."

---

*This document is the source of truth for the Maia Computer architecture. All implementation decisions must align with the vision and structures defined here.*
