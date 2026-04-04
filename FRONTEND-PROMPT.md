# Frontend Developer Prompt — Maia Computer Shell

> Build the desktop environment for an AI-powered operating system.

---

## What is Maia Computer?

Maia Computer is an AI-powered operating system built with Electron. Users install real web apps (Gmail, Slack, Sheets, WhatsApp) inside Maia. Each app runs in a sandboxed webview. AI has deep access to every app through DOM and network intelligence. The AI controls apps instantly — no screenshots, no delays.

**You are building the Shell** — the desktop environment. The dock, home screen, app windows, window management, Team Chat, Spotlight, Spaces, Settings. It looks like macOS with a dock at the bottom, app windows that snap, and AI built into everything.

## What the backend already provides

The backend (`@maia/os`) is built. It provides everything via **Electron IPC channels**. You call IPC from the renderer process — the backend handles the rest.

### How to call the backend

The preload script exposes `window.electronAPI`:

```typescript
// Send a command and get a result
const result = await window.electronAPI.invoke('app:list', {})
// result.apps = InstalledApp[]

// Listen for events from backend
window.electronAPI.on('chat:message', (event, data) => {
  // data.message = ChatMessage
})
```

### IPC Channels — Commands (Frontend → Backend)

```typescript
// App management
'app:install'      → { url, name, icon, manifestId? } → { appId }
'app:open'         → { appId }                        → { success }
'app:close'        → { appId }                        → { success }
'app:uninstall'    → { appId }                        → { success }
'app:list'         → {}                               → { apps: InstalledApp[] }
'app:setBounds'    → { appId, bounds: AppBounds }      → { success }

// AI Brain
'brain:execute'    → { appId, command }                → { success }
'brain:startTask'  → { description }                   → { taskId }
'brain:stop'       → {}                               → { success }
'brain:getStatus'  → {}                               → { running, step?, taskDescription? }

// Team Chat
'chat:send'        → { message }                       → { success }
'chat:getHistory'  → {}                               → { messages: ChatMessage[] }

// Spotlight Search
'spotlight:search' → { query }                         → { results: SearchResultGroup[] }

// Spaces
'spaces:list'      → {}                               → { spaces: Space[] }
'spaces:create'    → { name, aiContext? }              → { spaceId }
'spaces:switch'    → { spaceId }                       → { success }
'spaces:delete'    → { spaceId }                       → { success }

// Settings
'settings:get'     → {}                               → { settings }
'settings:update'  → { key, value }                    → { success }
```

### IPC Channels — Events (Backend → Frontend)

```typescript
'app:installed'       → { appId, name, icon }
'app:notification'    → { appId, count }           // badge update
'app:opened'          → { appId }
'app:closed'          → { appId }
'brain:thinking'      → { thought }
'brain:action'        → { action, appId }
'brain:planCreated'   → { steps: PlanStep[] }
'brain:planUpdated'   → { stepIndex, status }
'brain:taskCompleted' → { summary }
'brain:error'         → { message }
'chat:message'        → { message: ChatMessage }
'cost:update'         → { totalCost, budget }
```

### Shared Types

Install `@maia/shared` from the workspace:

```typescript
import type {
  InstalledApp, AppBounds, SnapZone, WindowState, Space,
  ChatMessage, PlanStep,
  IPCCommands, IPCResults, IPCEvents,
  SearchResultGroup,
} from '@maia/shared'

import {
  SNAP_ZONE, APP_CATEGORY,
  MESSAGE_INTENT, AGENT_PROFILES, USER_PROFILE,
} from '@maia/shared'
```

## Design Specs

**Read [UI-DESIGN.md](UI-DESIGN.md) carefully** — it has every visual detail: colors, typography, spacing, shadows, animations, component specs. Follow it exactly.

**Read [CLAUDE.md](CLAUDE.md)** — development rules: naming, LOC limits, code style, React rules.

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript | Language (strict mode) |
| React 18+ | UI components |
| Tailwind CSS | Styling |
| Zustand | State management |
| Framer Motion | Animations |
| Electron renderer | Runtime (has access to `window.electronAPI` via preload) |

## What to Build

### Package Setup

```
packages/shell/
  ├── src/
  │   ├── App.tsx                    # Root — renders current screen
  │   │
  │   ├── screen/
  │   │   ├── HomeScreen.tsx         # App grid + command input
  │   │   ├── StoreScreen.tsx        # App Store browser
  │   │   └── SettingsScreen.tsx     # Settings panels
  │   │
  │   ├── component/
  │   │   ├── dock/
  │   │   │   ├── Dock.tsx           # Auto-hide dock container
  │   │   │   ├── DockIcon.tsx       # App icon + badge + running dot
  │   │   │   ├── DockDivider.tsx    # Vertical separator
  │   │   │   └── DockTooltip.tsx    # Name tooltip on hover
  │   │   │
  │   │   ├── window/
  │   │   │   ├── AppWindow.tsx      # Window frame: title bar + content + command bar
  │   │   │   ├── TitleBar.tsx       # Icon, name, minimize/maximize/close
  │   │   │   ├── CommandBar.tsx     # AI command input per app
  │   │   │   └── SnapPreview.tsx    # Blue glow when dragging to snap zone
  │   │   │
  │   │   ├── chat/
  │   │   │   ├── ChatApp.tsx        # Full Team Chat window
  │   │   │   ├── MessageList.tsx
  │   │   │   ├── AgentMessage.tsx
  │   │   │   ├── UserMessage.tsx
  │   │   │   ├── ChatInput.tsx
  │   │   │   └── ChatHeader.tsx
  │   │   │
  │   │   ├── spotlight/
  │   │   │   ├── Spotlight.tsx      # Overlay container
  │   │   │   ├── SpotlightInput.tsx
  │   │   │   └── SpotlightResults.tsx
  │   │   │
  │   │   ├── store/                 # App Store components
  │   │   │   ├── AppStoreGrid.tsx
  │   │   │   ├── AppCard.tsx
  │   │   │   └── AppGridItem.tsx
  │   │   │
  │   │   ├── spaces/
  │   │   │   ├── SpacesBar.tsx
  │   │   │   └── SpaceTab.tsx
  │   │   │
  │   │   ├── pip/
  │   │   │   └── PictureInPicture.tsx
  │   │   │
  │   │   ├── notification/
  │   │   │   └── Toast.tsx
  │   │   │
  │   │   └── ui/
  │   │       ├── Button.tsx
  │   │       ├── Input.tsx
  │   │       └── Spinner.tsx
  │   │
  │   ├── hook/
  │   │   ├── useIPC.ts             # Electron IPC wrapper
  │   │   ├── useDock.ts            # Auto-hide, hover detection
  │   │   ├── useWindowManager.ts   # Snap, resize, position tracking
  │   │   ├── useChat.ts            # Messages + send
  │   │   ├── useSpotlight.ts       # Search + results
  │   │   ├── useSpaces.ts          # Space switching
  │   │   └── useNotifications.ts   # Toast queue
  │   │
  │   ├── store/
  │   │   ├── appStore.ts           # Installed apps, running apps
  │   │   ├── dockStore.ts          # Recent, pinned, badges
  │   │   ├── windowStore.ts        # Window positions, sizes, snap states
  │   │   ├── chatStore.ts          # Messages, unread count
  │   │   ├── spotlightStore.ts     # Query, results
  │   │   ├── spaceStore.ts         # Active space, space list
  │   │   ├── taskStore.ts          # Active task, brain state
  │   │   └── settingsStore.ts      # User preferences
  │   │
  │   └── style/
  │       ├── globals.css           # Tailwind base, dark theme, fonts
  │       ├── colors.ts             # Color constants
  │       └── animations.ts         # Timing constants
```

## Build Order (Priority)

```
1.  useIPC.ts + stores              — wire up communication with backend
2.  Dock                            — auto-hide, icons, badges, tooltips, magnification
3.  HomeScreen                      — app grid with badges, command input
4.  AppWindow + TitleBar            — window frame with controls
5.  CommandBar                      — AI command input per app
6.  Window Manager (snap/resize)    — drag to edges, keyboard shortcuts
7.  App Store                       — browse, install, custom URL
8.  Team Chat app                   — full app, messages, agents, user
9.  Spotlight AI                    — Cmd+Space, search, grouped results
10. Spaces                          — top bar, switching
11. Settings                        — sections, controls
12. Picture-in-Picture              — floating mini window
13. Notifications (toasts)          — top-right, slide in
14. Polish + animations             — match UI-DESIGN.md exactly
```

## Key Details Per Component

### Dock (most important — the user's home)

- Auto-hide: hidden when an app is open. Appears when mouse hits bottom 4px.
- Slide up 300ms ease-out. Slide down 200ms ease-in after 500ms delay.
- Background: #111111 at 90% opacity, blur(20px), 16px top border-radius.
- Left: recently used apps (max 7). Right: pinned + ⚙️ + ⊞.
- Icons: 48px, scale to 56px on hover (magnification). 12px rounded.
- Badge: 18px red circle, white number, top-right of icon.
- Running dot: 4px white circle below icon.
- Right-click: context menu (Pin/Unpin/Close/Info).

### App Window

- Title bar: 38px, #111111, draggable. Icon + name + ─ □ ✕ buttons.
- Content: placeholder div — the real BrowserView is positioned behind it by the backend. When the window moves/resizes, call `app:setBounds` via IPC so the backend repositions the BrowserView.
- Command bar: 44px at bottom. "Tell Maia:" + input. Enter sends via `brain:execute`.
- Window border: 1px #222222, 8px top radius, shadow.
- Min size: 400×300. Resizable from all edges.

### Window Snapping

- Drag to left edge → left 50%. Right edge → right 50%.
- Corners → 25% quadrants. Top center → maximize.
- Show blue preview (4px #3B82F6 border + 5% fill) when within 20px of edge.
- Snap animation: 250ms ease-out.
- Cmd+Left/Right → snap. Cmd+Up → maximize. Cmd+Down → restore.

### Team Chat App

- Opens from dock like any other app. Gets its own window.
- Typical layout: snap Chat to right 30%, main app to left 70%.
- Header: task name + active agents (colored icons).
- Messages: agent messages left-aligned (28px colored circle + name), user messages right-aligned (#1A2A3A bg).
- @mentions in agent color, bold.
- Input: 48px, Enter to send via `chat:send`.
- Listen to `chat:message` events for incoming messages.

### Spotlight AI

- Cmd+Space: overlay with 60% black bg, centered 600px search box.
- Input: 24px font, search icon left.
- Results: grouped by app (icon + name header, results indented).
- On type: debounce 300ms → `spotlight:search` IPC.
- Click result: open that app and navigate to the item.
- Dismiss: Esc or click outside.

### BrowserView Positioning (CRITICAL)

The frontend does NOT render the actual web app content. The backend creates Electron BrowserViews (one per app) and positions them on the screen. The frontend:

1. Renders the window frame (title bar + command bar)
2. Tells the backend where the content area is: `app:setBounds { appId, x, y, width, height }`
3. The backend positions the BrowserView exactly at those coordinates

This means: when a window moves, resizes, or snaps — you MUST call `app:setBounds` with the new content area bounds. The BrowserView will appear between the title bar and command bar.

## Rules (from CLAUDE.md)

- TypeScript strict, no `any`, no `@ts-ignore`
- Named exports only
- Singular folder names: `component/`, `hook/`, `store/`
- No barrel/index.ts files
- Components max 150 LOC, hooks max 100 LOC
- Tailwind only, all colors from UI-DESIGN.md
- Framer Motion for animations
- Zustand for state management
- pnpm as package manager

---

*The backend is ready. The types are shared. The design is specified. Build the desktop environment.*
