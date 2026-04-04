# Maia Computer — Architecture

> An AI-powered operating system where every app runs with intelligence built in.

---

## Table of Contents

1. [Vision](#1-vision)
2. [Core Principles](#2-core-principles)
3. [System Overview](#3-system-overview)
4. [The 10 Core Features](#4-the-10-core-features)
5. [Intelligence Layer (The Kernel)](#5-intelligence-layer-the-kernel)
6. [App System](#6-app-system)
7. [Brain & Orchestrator](#7-brain--orchestrator)
8. [Theatre (The Desktop Environment)](#8-theatre-the-desktop-environment)
9. [Team Communication](#9-team-communication)
10. [Tech Stack](#10-tech-stack)
11. [Product Phases](#11-product-phases)
12. [Key Differentiators](#12-key-differentiators)

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

### 4.4 Ghost Mode

AI works while the user is away. Set tasks that run in the background.

**Examples:**
- "Monitor my email. If anything urgent from the CEO, WhatsApp me."
- "Keep checking this product page. Notify me when the price drops below $500."
- "Every hour, check Slack for messages in #urgent and summarize them."

Ghost Mode respects the user's approval level. It will never send emails or make purchases without permission (unless explicitly authorized).

### 4.5 Time Travel

Maia records the state of every app continuously — DOM snapshots, network data, screenshots. Users can rewind any app to any point in time.

**Examples:**
- "What did that email from Sarah say yesterday? I deleted it."
- "Undo what I did in Sheets 30 minutes ago."
- "Show me what Slack #general looked like last Friday."
- "When did I last edit this Notion page?"

### 4.6 Spaces

Separate desktops for different contexts. Each space has its own apps, accounts, AI personality, and context.

**Default spaces:**
- Work — work email, work Slack, company tools
- Personal — personal email, WhatsApp, social media

Users can create custom spaces: "Side Project", "Job Search", "Wedding Planning"

Switching spaces changes everything — different apps, different accounts, different AI context. Like having multiple computers in one.

### 4.7 Workflows

Users build automations by doing things normally. Maia watches, learns, and offers to replay.

**How it works:**
1. User does a multi-step task manually (across multiple apps)
2. Maia detects the pattern: "You've done this 3 times. Save as a workflow?"
3. User names it: "Monthly Invoice Processing"
4. Next time: "Run Monthly Invoice Processing" → Maia does it all in seconds

No code. No flow builders. No configuration. Just use your apps normally and Maia learns.

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

The Intelligence Layer is what makes Maia an OS, not just a browser. Every app's input/output passes through it. The AI can read and act on everything.

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

### 5.3 Vision Brain (Fallback)

```
Used only when Network + DOM brains can't handle it:
  - CAPTCHAs (image recognition needed)
  - Complex visual layouts (charts, graphs, images)
  - Verification ("did the task actually complete?")
  - Canvas-based apps (no DOM to read)
```

**Speed:** 3-5 seconds per action (screenshot + LLM vision). Used for less than 5% of actions.

### 5.4 Memory Brain

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
| Network Brain | 1-5ms | Free (local) | Reading app data, replaying API calls |
| DOM Brain | 5-50ms | Free (local) | Clicking, typing, reading page content |
| Memory Brain | 1ms | Free (local) | Recall patterns, preferences |
| Vision Brain | 3-5 seconds | ~$0.01 | CAPTCHAs, verification, complex visuals |
| LLM Reasoning | 500ms-2s | ~$0.003 | Deciding WHAT to do (not HOW) |

**95% of actions use Network + DOM Brain (instant, free). LLM is used for thinking, not seeing.**

---

## 6. App System

### 6.1 App Container (Sandboxed WebContainer)

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

### 6.2 App Manifest

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

### 6.3 App Lifecycle

```
Install:   Create container → load URL → user signs in → persist session → register
Open:      Activate container → show window → resume session → connect intelligence
Close:     Hide window → keep container alive (for Ghost Mode and notifications)
Uninstall: Destroy container → delete session data → remove from registry
```

### 6.4 Cross-App Data Flow (App Fusion)

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

## 7. Brain & Orchestrator

### 7.1 Brain

The Brain is the AI reasoning engine. It decides WHAT to do. The Intelligence Layer handles HOW to do it.

```
User: "Find the cheapest flight to Tokyo and email it to my boss"

Brain (one LLM call):
  Plan:
    1. Open Chrome, navigate to Google Flights
    2. Search NYC → Tokyo in March
    3. Read the results (via Network Brain — instant)
    4. Find the cheapest option
    5. Open Gmail
    6. Compose email to boss with the flight details
    7. Send

Each step uses DOM/Network Brain for execution (instant).
Total LLM calls: 2-3 (planning + verification)
Total time: 15-30 seconds for a task that would take a human 5 minutes
```

**Key difference from other agents:** The Brain calls the LLM for THINKING (text-based, cheap, fast). It does NOT call the LLM for SEEING (vision-based, expensive, slow). The Intelligence Layer provides structured text data instead of screenshots.

### 7.2 Orchestrator (Phase 2)

For complex tasks, the Orchestrator decomposes the task and coordinates multiple parallel operations.

```
User: "Plan a team offsite in Tokyo"

Orchestrator:
  Parallel task 1: Search flights (in Chrome)
  Parallel task 2: Check team calendars (in Calendar)
  Parallel task 3: Check budget (in Sheets)
  
  All three run simultaneously in separate app windows.
  User can watch via Picture-in-Picture.
  Results are combined and presented in the chat sidebar.
```

### 7.3 LLM Provider Abstraction

Provider-agnostic. Start with OpenAI, swap providers without changing code.

```
Supported: OpenAI (GPT-4o), Anthropic (Claude), local models (future)
Fallback: If primary fails 3 times, auto-switch to secondary
Cost tracking: Every call logged with token count and cost
Budget guardrails: Auto-pause at 80% of budget, hard stop at 100%
```

### 7.4 Self-Healing

When an action fails, the Brain doesn't retry blindly:

```
1. Detect: action didn't produce expected result
2. Diagnose: what went wrong (element missing? page changed? popup?)
3. Adapt: try a different approach
4. Retry: max 3 attempts with different strategies
5. Escalate: ask user if all retries fail
```

---

## 8. Theatre (The Desktop Environment)

Theatre is the desktop environment of Maia Computer. It includes the home screen, app windows with split-screen support, dock, spotlight, spaces, and command bar. The Team Chat is a full app — not a sidebar.

### 8.1 Home Screen

The default view when no app is open. Shows installed apps and the command input.

### 8.2 App Windows

Each open app gets a window with:
- Title bar (app icon, name, window controls: minimize, maximize, close)
- App content (the real web app in a webview, sandboxed)
- Command bar at the bottom (type commands for this specific app)

### 8.3 Window Management (Split Screen)

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

### 8.4 Team Chat (Full App)

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

### 8.5 Dock

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

### 8.6 Spotlight AI

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

### 8.7 Spaces

Top bar shows available spaces. Click to switch. Each space has its own apps, sessions, and AI context.

```
┌──────────────────────────────────────────────────────────────────┐
│  [● Work]  [○ Personal]  [○ Side Project]  [+ New Space]        │
├──────────────────────────────────────────────────────────────────┤
```

Switching spaces changes: which apps are visible, which accounts are active, what the AI knows about the context.

### 8.8 Picture-in-Picture

When AI is working in one app and the user is working in another, a small floating window shows the AI's activity. User can glance, expand, or dismiss.

### 8.9 Command Bar

Present at the bottom of every app window. The user types natural language commands specific to the current app:

```
In Gmail:   💬 "Reply to John saying I'll be there at 3"
In Sheets:  💬 "Add a total row at the bottom"
In Chrome:  💬 "Find the cheapest flight to Tokyo"
In Chat:    💬 "Book the ANA flight, use my Amex"
```

---

## 9. Team Communication

### 9.1 Chat Sidebar

The chat sidebar shows all AI activity — what it's thinking, what it's doing, what it needs. The user and AI communicate here like teammates.

### 9.2 Message Structure

```
{
  sender: "computer" | "user" | agent_id,
  receiver: "user" | "all" | agent_id,
  intent: "question" | "update" | "approval_request" | "challenge" | ...,
  message: "Found $487 flight on ANA. Book it?",
  context: { app: "chrome", task: "flight-search" },
  timestamp: ...
}
```

### 9.3 Agent Personalities (Phase 2)

In multi-agent mode, different agents have different roles and priorities. They discuss, challenge each other, and collaborate — visible in the chat sidebar.

### 9.4 Graduated Human Control

| Level | Name | Behavior |
|---|---|---|
| 1 | Full auto | AI works independently |
| 2 | Notify | AI notifies on key decisions |
| 3 | Approve major | AI pauses for major decisions (default) |
| 4 | Approve all | AI pauses for every decision |
| 5 | Collaborative | User actively participates |
| 6 | Step-by-step | User approves every action |

---

## 10. Tech Stack

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

## 11. Product Phases

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
- App Fusion (drag data between apps)
- Ghost Mode (AI works while you're away)
- Time Travel (rewind any app to any point)
- Spaces (Work, Personal, custom contexts)
- Workflows (learn from user behavior, replay automatically)
- Picture-in-Picture (watch AI work while you work)
- Orchestrator (multi-task parallel execution)
- Agent personalities + team chat
- Memory Brain (learned patterns, preferences)
- Vision Brain fallback (screenshots only when needed)

**Goal:** Power users. Enterprise interest. "My computer is smarter than yours."

### Phase 3 — The Platform

Open it up.

**Build:**
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

## 12. Key Differentiators

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
