# Maia Computer — Development Roadmap

> Backend builds the brain. Frontend builds the body.

---

## Table of Contents

1. [Architecture Split](#1-architecture-split)
2. [Project Structure](#2-project-structure)
3. [Backend Roadmap (OS Core)](#3-backend-roadmap-os-core)
4. [Frontend Roadmap (Shell/Theatre)](#4-frontend-roadmap-shelltheatre)
5. [Integration Points](#5-integration-points)
6. [Milestone Checkpoints](#6-milestone-checkpoints)
7. [Risk Areas](#7-risk-areas)

---

## 1. Architecture Split

```
┌──────────────────────────────────────────────────────────────────┐
│                     ELECTRON APP                                 │
│                                                                  │
│  ┌─ Main Process (BACKEND) ─────────────────────────────────┐   │
│  │  TypeScript / Node.js                                    │   │
│  │                                                          │   │
│  │  @maia/os — the brain and intelligence                   │   │
│  │  • WebContainer management (BrowserView sandboxes)       │   │
│  │  • Network Brain (HTTP proxy, traffic interception)      │   │
│  │  • DOM Brain (bridge injection, element reading)         │   │
│  │  • Vision Brain (screenshot fallback)                    │   │
│  │  • AI Brain (LLM reasoning loop)                         │   │
│  │  • Orchestrator (multi-agent coordination)               │   │
│  │  • App Registry (SQLite — installed apps, sessions)      │   │
│  │  • Event Bus (all events flow through here)              │   │
│  │  • Recording System (task history, evidence)             │   │
│  │  • LLM Provider (OpenAI / Claude / pluggable)            │   │
│  │  • Cost Tracker (budget guardrails)                      │   │
│  │  • Memory (learned patterns, preferences)                │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                     Electron IPC                                 │
│                             │                                    │
│  ┌─ Renderer Process (FRONTEND) ────────────────────────────┐   │
│  │  TypeScript / React / Tailwind                           │   │
│  │                                                          │   │
│  │  @maia/shell — the desktop environment                   │   │
│  │  • Home Screen (app grid, command input)                 │   │
│  │  • Dock (auto-hide, icons, badges, magnification)        │   │
│  │  • Window Manager (snap, resize, minimize, maximize)     │   │
│  │  • App Store (browse, install, manage)                   │   │
│  │  • Team Chat App (agent conversations)                   │   │
│  │  • Spotlight AI (Cmd+Space search)                       │   │
│  │  • Spaces (context switching)                            │   │
│  │  • Settings                                              │   │
│  │  • Command Bar (per-app AI input)                        │   │
│  │  • Notifications (toasts, badges)                        │   │
│  │  • Picture-in-Picture                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Communication: Electron IPC

Backend and frontend talk via Electron IPC. The backend exposes a set of **channels** that the frontend calls:

```
Frontend → Backend (commands):
  app:install          { url, name, icon }
  app:open             { appId }
  app:close            { appId }
  app:uninstall        { appId }
  app:list             {} → InstalledApp[]
  brain:execute        { appId, command }
  brain:startTask      { description }
  brain:stop           {}
  chat:send            { message }
  chat:getHistory      {} → ChatMessage[]
  spotlight:search     { query } → SearchResult[]
  spaces:switch        { spaceId }
  spaces:list          {} → Space[]
  settings:get         {} → Settings
  settings:update      { key, value }

Backend → Frontend (events):
  app:installed        { appId, name, icon }
  app:notification     { appId, count }
  brain:thinking       { thought }
  brain:action         { action, appId }
  brain:taskCompleted  { summary }
  chat:message         { message }
  cost:update          { totalCost, budget }
  event:batch          MaiaEvent[]
```

---

## 2. Project Structure

```
maia-computer/
│
├── packages/
│   ├── os/                        # BACKEND — Electron main process
│   │   ├── src/
│   │   │   ├── app/               # App management
│   │   │   │   ├── WebContainer.ts        # Sandboxed BrowserView per app
│   │   │   │   ├── AppRegistry.ts         # SQLite — installed apps DB
│   │   │   │   ├── AppLifecycle.ts        # Install, open, close, uninstall
│   │   │   │   ├── SessionStore.ts        # Encrypted cookie/session persistence
│   │   │   │   └── AppManifest.ts         # Parse YAML manifests
│   │   │   │
│   │   │   ├── kernel/            # Intelligence Layer
│   │   │   │   ├── NetworkBrain.ts        # HTTP proxy + traffic analysis + prefetch intelligence
│   │   │   │   ├── DOMBrain.ts            # Bridge injection + element access + advanced DOM
│   │   │   │   ├── VisionBrain.ts         # Screenshot + LLM fallback
│   │   │   │   ├── PageScraper.ts         # Full page comprehension — structure, content, metadata
│   │   │   │   ├── IntelligenceRouter.ts  # Routes to fastest brain
│   │   │   │   ├── ProxyServer.ts         # Local HTTP/HTTPS proxy
│   │   │   │   ├── TrafficParser.ts       # Parse API responses to structured data
│   │   │   │   ├── SearchIndex.ts         # Cross-app search index (for Spotlight)
│   │   │   │   └── Memory.ts             # Learned patterns + preferences
│   │   │   │
│   │   │   ├── brain/             # AI reasoning
│   │   │   │   ├── Brain.ts               # Adaptive reasoning loop with research memory
│   │   │   │   ├── ResearchMemory.ts      # Cross-page findings scratchpad
│   │   │   │   ├── TaskPlanner.ts         # Break task into steps (flexible, not rigid)
│   │   │   │   ├── ActionDecider.ts       # Decide next action + visual behavior
│   │   │   │   ├── SelfHealer.ts          # Detect failures, adapt, retry
│   │   │   │   ├── Orchestrator.ts        # Multi-agent task decomposition
│   │   │   │   └── AgentPersonality.ts    # Role, priorities, style per agent
│   │   │   │
│   │   │   ├── llm/               # LLM providers
│   │   │   │   ├── LLMProvider.ts         # Provider interface
│   │   │   │   ├── OpenAIAdapter.ts       # OpenAI GPT-4o
│   │   │   │   ├── ClaudeAdapter.ts       # Anthropic Claude
│   │   │   │   ├── ProviderRegistry.ts    # Switch + fallback
│   │   │   │   └── CostTracker.ts         # Token counting + budget
│   │   │   │
│   │   │   ├── events/            # Event system
│   │   │   │   ├── EventBus.ts            # Pub/sub for all events
│   │   │   │   ├── EventTypes.ts          # Type definitions
│   │   │   │   └── EventLogger.ts         # Persist events to disk
│   │   │   │
│   │   │   ├── communication/     # Team chat backend
│   │   │   │   ├── MessageBus.ts          # Route messages between agents + user
│   │   │   │   ├── MessageHistory.ts      # Conversation persistence
│   │   │   │   └── IntentClassifier.ts    # Classify user messages
│   │   │   │
│   │   │   ├── recording/         # Task recording + evidence
│   │   │   │   ├── Recorder.ts            # Record events + screenshots
│   │   │   │   └── VerifiedRegistry.ts    # Tag data with source + proof
│   │   │   │
│   │   │   ├── bridge/            # Injected into web apps
│   │   │   │   ├── bridge.js              # Core DOM reader + AI command receiver
│   │   │   │   ├── scraper.js             # Page scraper — full content extraction
│   │   │   │   ├── navigator.js           # Smart click, reactive wait, popup dismiss
│   │   │   │   └── performer.js           # Visual performance — cursor, typing, glow, highlights
│   │   │   │
│   │   │   └── ipc/               # Electron IPC handlers
│   │   │       ├── AppHandlers.ts         # app:install, app:open, etc.
│   │   │       ├── BrainHandlers.ts       # brain:execute, brain:startTask
│   │   │       ├── ChatHandlers.ts        # chat:send, chat:getHistory
│   │   │       ├── SpotlightHandlers.ts   # spotlight:search
│   │   │       └── SettingsHandlers.ts    # settings:get, settings:update
│   │   │
│   │   ├── manifests/             # App manifest YAML files
│   │   │   ├── google.gmail.yml
│   │   │   ├── google.sheets.yml
│   │   │   ├── google.calendar.yml
│   │   │   ├── slack.yml
│   │   │   ├── whatsapp.yml
│   │   │   ├── notion.yml
│   │   │   ├── github.yml
│   │   │   ├── figma.yml
│   │   │   ├── chrome.yml
│   │   │   └── linear.yml
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shell/                     # FRONTEND — Electron renderer process
│   │   ├── src/
│   │   │   ├── App.tsx                    # Root component
│   │   │   │
│   │   │   ├── screen/
│   │   │   │   ├── HomeScreen.tsx         # App grid + command input
│   │   │   │   ├── StoreScreen.tsx        # App Store browser
│   │   │   │   └── SettingsScreen.tsx     # Settings panels
│   │   │   │
│   │   │   ├── component/
│   │   │   │   ├── dock/
│   │   │   │   │   ├── Dock.tsx           # Main dock container
│   │   │   │   │   ├── DockIcon.tsx       # App icon + badge + dot
│   │   │   │   │   ├── DockDivider.tsx    # Vertical separator
│   │   │   │   │   └── DockTooltip.tsx    # Name tooltip on hover
│   │   │   │   │
│   │   │   │   ├── window/
│   │   │   │   │   ├── AppWindow.tsx      # Window frame (title bar + content + command bar)
│   │   │   │   │   ├── TitleBar.tsx       # App icon, name, window controls
│   │   │   │   │   ├── CommandBar.tsx     # AI command input per app
│   │   │   │   │   └── SnapPreview.tsx    # Blue glow preview when dragging
│   │   │   │   │
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatApp.tsx        # Full Team Chat window
│   │   │   │   │   ├── MessageList.tsx    # Scrollable message area
│   │   │   │   │   ├── AgentMessage.tsx   # Agent message with icon + color
│   │   │   │   │   ├── UserMessage.tsx    # User message (right-aligned)
│   │   │   │   │   ├── ChatInput.tsx      # Message input field
│   │   │   │   │   └── ChatHeader.tsx     # Active task + agent list
│   │   │   │   │
│   │   │   │   ├── spotlight/
│   │   │   │   │   ├── Spotlight.tsx      # Overlay container
│   │   │   │   │   ├── SpotlightInput.tsx # Search input
│   │   │   │   │   └── SpotlightResults.tsx # Grouped results
│   │   │   │   │
│   │   │   │   ├── store/
│   │   │   │   │   ├── AppStoreGrid.tsx   # Category grid of apps
│   │   │   │   │   ├── AppCard.tsx        # Featured app card
│   │   │   │   │   └── AppGridItem.tsx    # Small app icon in grid
│   │   │   │   │
│   │   │   │   ├── spaces/
│   │   │   │   │   ├── SpacesBar.tsx      # Top bar with space tabs
│   │   │   │   │   └── SpaceTab.tsx       # Individual space tab
│   │   │   │   │
│   │   │   │   ├── pip/
│   │   │   │   │   └── PictureInPicture.tsx # Floating mini window
│   │   │   │   │
│   │   │   │   ├── notification/
│   │   │   │   │   └── Toast.tsx          # Toast notification
│   │   │   │   │
│   │   │   │   └── ui/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       └── Spinner.tsx
│   │   │   │
│   │   │   ├── hook/
│   │   │   │   ├── useIPC.ts             # Electron IPC communication
│   │   │   │   ├── useDock.ts            # Auto-hide, hover detection
│   │   │   │   ├── useWindowManager.ts   # Snap, resize, position tracking
│   │   │   │   ├── useChat.ts            # Chat state + message sending
│   │   │   │   ├── useSpotlight.ts       # Search state + results
│   │   │   │   ├── useSpaces.ts          # Space switching
│   │   │   │   └── useNotifications.ts   # Toast queue
│   │   │   │
│   │   │   ├── store/
│   │   │   │   ├── appStore.ts           # Installed apps, running apps
│   │   │   │   ├── dockStore.ts          # Recent, pinned, badges
│   │   │   │   ├── windowStore.ts        # Window positions, sizes, snap states
│   │   │   │   ├── chatStore.ts          # Messages, unread count
│   │   │   │   ├── spotlightStore.ts     # Search query, results
│   │   │   │   ├── spaceStore.ts         # Active space, space list
│   │   │   │   ├── taskStore.ts          # Active task, brain state
│   │   │   │   └── settingsStore.ts      # User preferences
│   │   │   │
│   │   │   └── style/
│   │   │       ├── globals.css           # Tailwind base, dark theme
│   │   │       ├── colors.ts             # Color constants from UI-DESIGN.md
│   │   │       └── animations.ts         # Timing constants
│   │   │
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   ├── shared/                    # Shared types between backend + frontend
│   │   ├── src/
│   │   │   ├── type/
│   │   │   │   ├── events.ts             # MaiaEvent types
│   │   │   │   ├── messages.ts           # ChatMessage types
│   │   │   │   ├── apps.ts              # InstalledApp, AppManifest types
│   │   │   │   ├── actions.ts           # ActionCommand types
│   │   │   │   ├── task.ts              # Task, PlanStep types
│   │   │   │   └── ipc.ts              # IPC channel types + payloads
│   │   │   │
│   │   │   └── constant/
│   │   │       ├── agents.ts            # Agent profiles, colors, icons
│   │   │       └── timing.ts            # Action timing, animation timing
│   │   │
│   │   └── package.json
│   │
│   └── main/                      # Electron entry point
│       ├── main.ts                # Creates BrowserWindow, loads shell, inits OS
│       ├── preload.ts             # Exposes IPC to renderer securely
│       └── package.json
│
├── ARCHITECTURE.md
├── UI-DESIGN.md
├── ROADMAP.md
├── CLAUDE.md
├── package.json                   # Workspace root
├── turbo.json
└── electron-builder.yml           # Build config for macOS/Windows distribution
```

---

## 3. Backend Roadmap (OS Core)

Everything the backend builds. The frontend developer doesn't need to worry about these — they just call IPC channels.

### B1. Project Setup

| Task | Details |
|---|---|
| Init `@maia/os` package | TypeScript, Node.js, Electron main process compatible |
| Init `@maia/shared` package | Shared types for IPC, events, messages, apps |
| Init `@maia/main` package | Electron entry point, creates window, loads shell |
| Install dependencies | `better-sqlite3`, `openai`, `sharp`, `pino`, `zod`, `dotenv` |
| Set up preload script | Secure IPC bridge between main and renderer |
| Electron dev scripts | `dev` starts Electron with hot reload |

### B2. App Management

| Task | Details |
|---|---|
| `AppManifest.ts` | Parse YAML manifests, validate schema with Zod |
| `AppRegistry.ts` | SQLite database — installed apps table (id, name, url, icon, spaceId, installedAt) |
| `SessionStore.ts` | Encrypt and persist cookies/sessions per app using Node.js crypto |
| `WebContainer.ts` | Create isolated Electron BrowserView per app. Own cookie partition. Own proxy config. Inject bridge script on page load. |
| `AppLifecycle.ts` | Install (create container + load URL + wait for login). Open (show BrowserView). Close (hide, keep alive). Uninstall (destroy + delete data). |
| Write 10 manifests | Gmail, Sheets, Calendar, Slack, WhatsApp, Notion, GitHub, Figma, Chrome, Linear |

**IPC channels exposed:**
```
app:install    → creates WebContainer, returns appId
app:open       → shows BrowserView, positions in window
app:close      → hides BrowserView
app:uninstall  → destroys container, deletes session
app:list       → returns all installed apps
app:badges     → returns notification counts per app
```

### B3. Network Brain

| Task | Details |
|---|---|
| `ProxyServer.ts` | Local HTTP/HTTPS proxy on random port. Transparent pass-through. Reads but doesn't modify traffic. |
| `TrafficParser.ts` | Parse JSON responses from intercepted API calls. Extract structured data (emails, messages, spreadsheet cells, events, etc.) |
| `NetworkBrain.ts` | Main class. Starts proxy. Routes each WebContainer through proxy. Stores latest data per app. Provides `getAppData(appId)` API. |
| `APIPatternStore.ts` | Learn and remember API patterns per app. After seeing Gmail's API 10 times, know exactly which endpoints return emails. |

**IPC channels exposed:**
```
network:getAppData   → returns structured data from app's API traffic
network:getTraffic   → returns raw recent traffic for an app (debugging)
```

### B4. DOM Brain

| Task | Details |
|---|---|
| `bridge.js` | JavaScript injected into every webview via `webContents.executeJavaScript()` on page load. Reads all interactive elements (role, label, text, position, value). Listens for commands from main process. Executes click, type, scroll via DOM. |
| `DOMBrain.ts` | Main class. Injects bridge into each WebContainer. Provides `getElements(appId)`, `clickElement(appId, selector)`, `typeInElement(appId, selector, text)`, `scrollTo(appId, selector)`. |

**Bridge script returns:**
```json
[
  { "role": "textbox", "label": "Search mail", "selector": "#search", "position": { "x": 400, "y": 50 }, "value": "" },
  { "role": "button", "label": "Compose", "selector": ".compose-btn", "position": { "x": 80, "y": 120 } },
  { "role": "listitem", "text": "CEO - Need Q3 numbers", "selector": ".email-row:nth-child(1)", "position": { "x": 600, "y": 200 } }
]
```

**IPC channels exposed:**
```
dom:getElements      → returns interactive elements for an app
dom:click            → clicks an element in an app
dom:type             → types text into an element
dom:scrollTo         → scrolls to an element
dom:getValue         → reads an element's current value
```

### B5. Intelligence Router

| Task | Details |
|---|---|
| `IntelligenceRouter.ts` | Decides which brain to use for each query. Network Brain first (fastest). DOM Brain second. Vision Brain last (screenshot fallback). |
| `VisionBrain.ts` | Takes screenshot of a BrowserView via `webContents.capturePage()`. Resizes with sharp. Sends to LLM with vision. Used < 5% of the time. |

**IPC channels exposed:**
```
intelligence:query   → asks a question about an app, routes to best brain
intelligence:act     → performs an action in an app, routes to best brain
```

### B5b. Page Scraper

| Task | Details |
|---|---|
| `scraper.js` | New bridge script that reads full page content — headings, text, tables, lists, prices, ratings, images (alt text). Organized by semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`). |
| JSON-LD / Schema.org extraction | Read `<script type="application/ld+json">` for structured data — hotel prices, product info, article metadata. Machine-readable data already on the page. |
| Meta tag reading | Extract `<meta description>`, Open Graph tags, `<link rel="canonical">`, publication dates |
| Page type detection | Classify page as `search_results`, `listing`, `article`, `product`, `form`, `dashboard`, `media`, `error` based on URL patterns + DOM structure |
| Scroll state | Report viewport position, total page height, whether more content exists below the fold |
| Active states | Report selected tabs, open dropdowns, checked checkboxes, expanded accordions |
| `PageScraper.ts` | Backend class that calls `scraper.js` in webview, combines with Network Brain data, returns structured page model |

### B5c. Smart Navigator

| Task | Details |
|---|---|
| `navigator.js` | New bridge script for advanced navigation actions |
| Text-based clicking | Click elements by visible text content, not just CSS selector. Priority chain: text → aria-label → data-testid → role+context → CSS selector |
| Reactive wait system | MutationObserver + PerformanceObserver + URL change detection. Replaces all fixed wait times. Agent moves at page speed. |
| Popup dismissal | Auto-detect and dismiss cookie banners, newsletter popups, chat widgets, GDPR overlays. Runs before every action. |
| Hover support | `hoverElement(target)` — trigger mouseover/mouseenter events to reveal dropdown menus, tooltips, preview cards |
| Navigate to URL | `navigate(url)` action — go directly to a URL without searching |
| Find text on page | `findText(query)` — Ctrl+F equivalent, jump to specific content |
| Content discovery | Detect "Show more" buttons, collapsed sections, pagination, lazy-load triggers. Expand hidden content proactively. |
| Filter/sort usage | Detect filter controls on listing pages. Apply filters strategically. |
| Ad detection | Identify sponsored content via "Sponsored" labels, ad containers, tracking URL parameters. Skip automatically. |
| Smart search | Query refinement (add year, use search operators), direct URL construction for known sites |

### B5d. Visual Performer

| Task | Details |
|---|---|
| `performer.js` | New bridge script for visual performance animations |
| Curved cursor movement | Cubic bezier curves with acceleration, slight arc, micro-overshoot, settle. Variable duration by distance. |
| Variable speed by intent | Fast+direct (known target), slow+drifting (scanning), medium+decisive (chosen), quick flick (going back) |
| Gaze simulation | Cursor drifts over search results before clicking chosen one |
| Character-by-character typing | 50-100ms per char, variable speed, thinking pauses before proper nouns |
| Element glow | 300ms blue outline on target element before click (recognition phase) |
| Progressive highlighting | Highlights appear as scan line passes over them, synced with reading |
| Content extraction animation | Brief blue pulse when data is captured for Research Memory |
| Scroll with purpose | Variable speed: slow on content, fast on headers, pause on interesting items |

### B5e. Research Memory

| Task | Details |
|---|---|
| `ResearchMemory.ts` | Scratchpad that persists across page navigations within a task |
| Findings storage | Store extracted data per source: { source, url, data[], credibility, timestamp } |
| Search history | Track searches tried so far, pages visited, which were useful |
| Cross-reference | Compare findings across sources (same hotel on Booking vs TripAdvisor) |
| Confidence tracking | Track confidence level based on source diversity and data consistency |
| ActionDecider integration | Full Research Memory included in LLM prompt so agent knows what it already found |
| Live comparison output | Structured comparison data sent to Team Chat as research progresses |

### B6. LLM Integration

| Task | Details |
|---|---|
| `LLMProvider.ts` | Interface: `sendMessage(messages, options) → response` |
| `OpenAIAdapter.ts` | GPT-4o implementation. Text + vision support. |
| `ClaudeAdapter.ts` | Claude implementation (future). |
| `ProviderRegistry.ts` | Primary + fallback. Auto-switch on failure. |
| `CostTracker.ts` | Tracks tokens + cost per task. Budget guardrails. Auto-pause at threshold. |

**IPC channels exposed:**
```
settings:setLLMProvider   → switch provider
settings:setAPIKey        → store API key securely
cost:getTaskCost          → returns cost for current task
cost:getBudget            → returns budget limit + current spend
```

### B7. Brain (Reasoning Loop)

| Task | Details |
|---|---|
| `Brain.ts` | Main loop: receive task → plan → execute steps → verify → complete. Uses IntelligenceRouter for reading app state. Uses DOM Brain for acting. Uses LLM for reasoning (TEXT, not vision). |
| `TaskPlanner.ts` | Break user task into steps with contracts. One LLM call. |
| `ActionDecider.ts` | Given app state (as text), decide next action. One LLM call. |
| `SelfHealer.ts` | Detect failures, try different approach, max 3 retries. |

**Key: Brain receives TEXT, not screenshots:**
```
Instead of: [500KB screenshot of Gmail]
Brain gets:  "Gmail inbox. 15 emails. First from CEO: 'Need Q3 numbers'. 
             Search input at (400,50). Compose button at (80,120)."

This is 10x cheaper and 5x faster than vision.
```

**IPC channels exposed:**
```
brain:execute        → execute a command in the context of an app
brain:startTask      → start a multi-step task
brain:stop           → stop current task
brain:getStatus      → is brain running? what step?
```

### B8. Team Chat Backend

| Task | Details |
|---|---|
| `MessageBus.ts` | Routes messages between agents, orchestrator, and user |
| `MessageHistory.ts` | Stores all messages in SQLite |
| `IntentClassifier.ts` | Classifies user messages: question, instruction, approval |

**IPC channels exposed:**
```
chat:send            → user sends a message
chat:getHistory      → get all messages for current task
chat:onMessage       → event: new message from agent
```

### B9. Orchestrator (Multi-Agent)

| Task | Details |
|---|---|
| `Orchestrator.ts` | Decomposes complex tasks. Spawns multiple Brain instances. Each Brain controls a different app. |
| `AgentPersonality.ts` | Defines role, priorities, communication style per agent. |

### B10. Event Bus + Recording

| Task | Details |
|---|---|
| `EventBus.ts` | Pub/sub for all system events. |
| `EventLogger.ts` | Writes events to NDJSON files per task. |
| `Recorder.ts` | Captures events + screenshots for replay. |
| `VerifiedRegistry.ts` | Tags extracted data with source + proof. |

### B11. Search Index (for Spotlight)

| Task | Details |
|---|---|
| `SearchIndex.ts` | Indexes data from Network Brain across all apps. Keyword + semantic search. Returns results grouped by app. |

**IPC channels exposed:**
```
spotlight:search     → search across all apps, returns grouped results
```

### B12. Spaces Backend

| Task | Details |
|---|---|
| Spaces table in SQLite | id, name, context, apps[] |
| Switch logic | When switching space, hide current WebContainers, show the new space's WebContainers |

**IPC channels exposed:**
```
spaces:list          → returns all spaces
spaces:create        → create a new space
spaces:switch        → activate a space (hides/shows apps)
spaces:delete        → delete a space
```

---

## 4. Frontend Roadmap (Shell/Theatre)

Everything the frontend builds. Uses Electron IPC to communicate with the backend. No direct access to Node.js APIs, BrowserViews, or LLM.

### F1. Project Setup

| Task | Details |
|---|---|
| Init `@maia/shell` package | React + Tailwind + Zustand + Framer Motion |
| Set up Tailwind config | All colors, spacing, typography from UI-DESIGN.md |
| Set up `useIPC` hook | Wrapper around `window.electronAPI` (exposed via preload) |
| Create Zustand stores | appStore, dockStore, windowStore, chatStore, spotlightStore, spaceStore, taskStore, settingsStore |
| Global styles | Dark theme, fonts, scrollbar |

### F2. Dock

| Task | Details |
|---|---|
| `Dock.tsx` | Auto-hide container. Appears on hover at bottom 4px of screen. Slides up 300ms. Slides down 200ms after 500ms delay. Background: #111111 at 90% opacity + blur. |
| `DockIcon.tsx` | 48px icon, 56px on hover (150ms scale). Badge (red circle, white number). Running dot (4px white circle). Right-click context menu. |
| `DockDivider.tsx` | 1px #333333 vertical line, 40px tall. |
| `DockTooltip.tsx` | App name on hover, above the icon. |
| `useDock.ts` | Hook: auto-hide logic, mouse position tracking, hover zone detection. |
| `dockStore.ts` | State: recentApps[], pinnedApps[], badges{}, runningApps[]. |

**Dock layout:**
```
[Recent apps (max 7)] │ [Pinned apps] [⚙️ Settings] [⊞ App Store]
```

### F3. Home Screen

| Task | Details |
|---|---|
| `HomeScreen.tsx` | App grid (4 columns) + command input + spaces bar. Shows when no app is open. |
| App grid | Installed apps as 64px icons with labels and badges. Click opens app via IPC. |
| Command input | 560px wide, centered. "Tell Maia what to do..." placeholder. Enter sends via IPC `brain:startTask`. |
| Spaces bar | Top of screen, 32px. Shows space tabs. |

### F4. App Window

| Task | Details |
|---|---|
| `AppWindow.tsx` | Window frame that wraps each open app. Title bar + content area + command bar. |
| `TitleBar.tsx` | 38px. App icon + name + minimize/maximize/close buttons. Draggable. Double-click to maximize/restore. |
| `CommandBar.tsx` | 44px at bottom. "Tell Maia:" label + input. Enter sends via IPC `brain:execute { appId, command }`. Toggle with Cmd+/. |
| Content area | Placeholder — the actual BrowserView is positioned by the backend's WindowManager behind this React window frame. The frontend tells the backend where to position the BrowserView via IPC. |

### F5. Window Manager

| Task | Details |
|---|---|
| `useWindowManager.ts` | Tracks all open windows: positions, sizes, snap states. Handles drag-to-snap with preview zones. |
| `SnapPreview.tsx` | Blue border + 5% opacity fill showing where window will snap. Appears when dragging within 20px of edge. |
| `windowStore.ts` | State per window: { id, appId, x, y, width, height, snapZone, isMaximized }. |
| Snap zones | Left 50%, Right 50%, TL/TR/BL/BR 25%, Top = maximize. |
| Keyboard shortcuts | Cmd+Left/Right (snap), Cmd+Up (maximize), Cmd+Down (restore). |
| IPC: position BrowserView | When window moves/resizes, send new bounds to backend so it repositions the actual BrowserView. `app:setBounds { appId, x, y, width, height }` |

### F6. App Store

| Task | Details |
|---|---|
| `StoreScreen.tsx` | Full window. Search bar + featured apps + category grids + custom URL input. |
| `AppCard.tsx` | Featured app card: icon, name, description, AI capabilities, [Install] button. |
| `AppGridItem.tsx` | Small icon + name in category grid. |
| Install flow | Click Install → IPC `app:install` → backend creates container → app loads → user signs in → IPC `app:installed` event → icon appears in dock + home. |

### F7. Team Chat App

| Task | Details |
|---|---|
| `ChatApp.tsx` | Full app window. Header (task + agents) + message list + input. |
| `ChatHeader.tsx` | Active task name + agent list with colored icons. |
| `MessageList.tsx` | Scrollable messages. Auto-scroll on new message (unless user scrolled up). |
| `AgentMessage.tsx` | Left-aligned. 28px colored circle icon + name + timestamp + message. |
| `UserMessage.tsx` | Right-aligned. #1A2A3A bg, 12px radius. |
| `ChatInput.tsx` | 48px, Enter to send, Shift+Enter for newline. IPC `chat:send`. |
| `chatStore.ts` | messages[], unreadCount. Listen to IPC `chat:message` events. |

### F8. Spotlight AI

| Task | Details |
|---|---|
| `Spotlight.tsx` | Cmd+Space overlay. 60% black overlay + centered search box + results. |
| `SpotlightInput.tsx` | 600px wide, 56px tall, 24px font. |
| `SpotlightResults.tsx` | Grouped by app (Gmail results, Sheets results, etc.). Click navigates to item. |
| `useSpotlight.ts` | Debounce search input → IPC `spotlight:search` → display results. |
| Dismiss | Esc or click outside. |

### F9. Spaces

| Task | Details |
|---|---|
| `SpacesBar.tsx` | Top bar, 32px. Shows space tabs. Click to switch. |
| `SpaceTab.tsx` | Active: white dot + white text. Inactive: gray dot + gray text. |
| `useSpaces.ts` | IPC `spaces:switch` on click. |

### F10. Settings

| Task | Details |
|---|---|
| `SettingsScreen.tsx` | Left sidebar (sections) + right pane (controls). |
| Sections | General, AI, Apps, Spaces, Privacy, About. |
| IPC | Read: `settings:get`. Write: `settings:update`. |

### F11. Picture-in-Picture

| Task | Details |
|---|---|
| `PictureInPicture.tsx` | 280px × 180px floating window. Always on top. Draggable. Shows mini view of AI-controlled app. [Expand] [Close] buttons. |

### F12. Notifications

| Task | Details |
|---|---|
| `Toast.tsx` | Top-right, 360px wide. Slide in from right 300ms. Auto-dismiss 5s. Click opens relevant app. |
| Badge updates | Listen to IPC `app:notification` events → update dockStore badges. |

### F13. Polish & Animations

| Task | Details |
|---|---|
| All animations match UI-DESIGN.md | Dock slide, window snap, spotlight scale, toast slide, badge bounce |
| Keyboard shortcuts | Cmd+Space, Cmd+/, Cmd+Tab, Cmd+W, Cmd+Left/Right/Up/Down, Ctrl+Left/Right |
| Reduced motion | `prefers-reduced-motion: reduce` → all animations 0ms |
| Focus indicators | 2px #3B82F6 outline on all focusable elements |

---

## 5. Integration Points

Where backend and frontend must align:

| Feature | Backend provides | Frontend calls |
|---|---|---|
| App list | `app:list` → InstalledApp[] | dockStore, HomeScreen |
| Install app | `app:install` → creates container | StoreScreen [Install] button |
| Open app | `app:open` → shows BrowserView | DockIcon click, HomeScreen click |
| Position app | `app:setBounds` → moves BrowserView | useWindowManager on drag/resize/snap |
| AI command | `brain:execute` → runs action | CommandBar Enter key |
| Start task | `brain:startTask` → starts Brain loop | HomeScreen command input |
| Chat messages | `chat:message` event → new message | chatStore listener |
| Brain thinking | `brain:thinking` event → thought text | CommandBar "🧠 Working..." |
| Spotlight search | `spotlight:search` → grouped results | SpotlightResults display |
| App badges | `app:notification` event → count | dockStore badge update |
| Space switch | `spaces:switch` → hides/shows apps | SpacesBar click |
| Cost tracking | `cost:update` event → current cost | Settings / task indicator |

---

## 6. Milestone Checkpoints

| Milestone | Backend step | Frontend step | What works |
|---|---|---|---|
| M1 | B1 | F1-F3 | Electron launches. Dark theme. Dock. Home screen. |
| M2 | B2 | F4-F6 | Install Gmail. Sign in. Stays logged in. App window with title bar. |
| M3 | B3-B5 | — | Network + DOM Brain read Gmail data instantly. No screenshots. |
| M3b | B5b-B5e | — | **Intelligence Upgrade.** Page Scraper reads full pages. Research Memory persists across navigations. Smart Navigator clicks by text, waits reactively, dismisses popups. Visual Performer shows human-like cursor, typing, highlights. Agent browses like a smart human. |
| M4 | B6-B7 | F4 (command bar) | "Reply to John" works in Gmail via command bar. |
| M5 | B8-B9 | F7 | Agents talk in Team Chat. User participates. |
| M6 | — | F5, F8-F9 | Window snapping. Spotlight search. Spaces. |
| M7 | B10-B12 | F10-F13 | Recording. Settings. Polish. **Ship it.** |

---

## 7. Risk Areas

| Risk | Impact | Mitigation |
|---|---|---|
| Web apps block embedded browsers | Some detect Electron webview | Standard Chrome user-agent. Most work fine. Test top 50 apps. |
| Cookie persistence | Sessions expire | Electron session persistence. Encrypted storage. Refresh tokens. |
| Network proxy adds latency | Slow app loading | Minimal proxy — read only, pass-through. Skip non-JSON responses. |
| DOM bridge breaks on UI changes | Elements not found | Read generic attributes (role, aria-label, text) not CSS classes. |
| LLM cost | Many calls per task | Text input (not vision) = 10x cheaper. Budget guardrails. |
| BrowserView positioning | Window frame and webview misaligned | Backend positions BrowserView based on frontend-reported bounds via IPC. |
| Electron bundle size | Large download | ~150MB is standard (VS Code, Slack, Discord are similar). |

---

*Backend builds the brain. Frontend builds the body. They talk via IPC. Ship at M7.*
