# Maia Computer — UI & Layout Specification

> It looks like macOS. It works like a superpower.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Visual Language](#2-visual-language)
3. [Screen Map](#3-screen-map)
4. [Home Screen](#4-home-screen)
5. [Dock](#5-dock)
6. [App Window](#6-app-window)
7. [Window Management (Split Screen)](#7-window-management-split-screen)
8. [Command Bar](#8-command-bar)
9. [Team Chat App](#9-team-chat-app)
10. [App Store](#10-app-store)
11. [Spotlight AI](#11-spotlight-ai)
12. [Spaces](#12-spaces)
13. [Settings](#13-settings)
14. [Picture-in-Picture](#14-picture-in-picture)
15. [Notifications](#15-notifications)
16. [Animations & Transitions](#16-animations--transitions)
17. [Responsive & Accessibility](#17-responsive--accessibility)

---

## 1. Design Philosophy

Maia looks like a real operating system — familiar, clean, professional. Users should feel at home immediately. No learning curve. If you've used macOS or Windows, you know how to use Maia.

### The 7 Rules

| # | Rule | What it means |
|---|---|---|
| 1 | **Feels like an OS** | Dock, windows, app icons, split screen — not a web app, not a chatbot |
| 2 | **Real apps, not toys** | The real Gmail, the real Slack — no simplified versions |
| 3 | **AI is ambient** | Command bar is quiet. Chat is an app you choose to open. AI doesn't interrupt unless needed. |
| 4 | **Dark by default** | Dark theme throughout. Apps render their own themes inside webviews. |
| 5 | **Density matters** | Users are productive. Don't waste space. Support split screen. |
| 6 | **The dock is home** | Always accessible. All apps. Notifications. Settings. Store. |
| 7 | **Conversation is natural** | Team Chat is Slack for your AI team. Not buttons. Not modals. Conversation. |

---

## 2. Visual Language

### Color System

```
OS Chrome (window frames, dock, title bars):
  Background:         #0A0A0A (near-black)
  Surface:            #111111 (panels, dock background)
  Surface elevated:   #1A1A1A (input fields, cards, hover states)
  Border:             #222222 (dividers, window borders)
  Border hover:       #333333 (interactive borders)

Text:
  Primary:            #FFFFFF
  Secondary:          #888888 (timestamps, labels, hints)
  Muted:              #555555 (placeholders, disabled)

Accent:
  Blue:               #3B82F6 (active, focus, links, snap indicators)
  Green:              #22C55E (success, running indicators)
  Yellow:             #EAB308 (warnings)
  Red:                #EF4444 (errors, close button, notification badges)

Agent Colors:
  Research:           #60A5FA
  Analyst:            #A78BFA
  Travel:             #34D399
  Calendar:           #FBBF24
  Budget:             #F87171
  Email:              #38BDF8
  Policy:             #FB923C
  User:               #E5E5E5
```

### Typography

```
Font family:          SF Pro Display / Inter / system sans-serif

Window title:         13px, weight 500
App content:          Controlled by the web app itself (Maia doesn't override)
Command bar input:    14px, weight 400
Command bar label:    12px, weight 500, #888888
Chat messages:        15px, weight 400
Chat agent name:      14px, weight 600, agent color
Chat timestamp:       12px, weight 400, #555555
Dock app label:       11px, weight 500
Spotlight input:      24px, weight 300
Spotlight results:    14px, weight 400
Home screen title:    36px, weight 300
Settings labels:      14px, weight 400
```

### Spacing

```
Base unit:            8px
Window padding:       0px (app content goes edge to edge)
Title bar height:     38px
Command bar height:   44px
Dock height:          64px (icons) + 12px (padding) = 76px total
Dock icon size:       48px (56px on hover)
Dock icon gap:        8px
Dock badge size:      18px circle
Dock running dot:     4px circle
Spotlight width:      600px (centered)
Snap indicator:       4px blue border on target zone
Window border-radius: 8px (top corners only)
```

### Shadows

```
Window:               0 8px 32px rgba(0, 0, 0, 0.5)
Dock:                 0 -4px 24px rgba(0, 0, 0, 0.5)
Spotlight overlay:    0 8px 48px rgba(0, 0, 0, 0.7)
Tooltip:              0 2px 8px rgba(0, 0, 0, 0.3)
Snap preview:         0 0 0 4px rgba(59, 130, 246, 0.5) (blue glow)
```

---

## 3. Screen Map

```
┌─────────────────────────────────────┐
│                                     │
│  HOME SCREEN (no apps open)         │
│  App grid + command input + dock    │
│                                     │
│  User opens an app ↓                │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  APP VIEW                           │
│  One or more app windows            │
│  Can be split 2-way, 3-way, 4-way  │
│  Dock at bottom (auto-hide)         │
│  Command bar per app window         │
│                                     │
│  Overlays:                          │
│  ├── Spotlight AI (Cmd+Space)       │
│  ├── App Store (from dock)          │
│  ├── Settings (from dock)           │
│  └── Picture-in-Picture (floating)  │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Home Screen

Shown when no app is open, or when the user clicks the desktop background.

```
┌──────────────────────────────────────────────────────────────────┐
│  [● Work]  [○ Personal]  [○ Side Project]           ⚙️  👤 User │
│                                                                  │
│                                                                  │
│                                                                  │
│     ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐          │
│     │ 📧     │   │ 💬     │   │ 📊     │   │ 🌐     │          │
│     │ Gmail  │   │WhatsApp│   │ Sheets │   │ Chrome │          │
│     │ 3 new  │   │ 5 msgs │   │        │   │        │          │
│     └────────┘   └────────┘   └────────┘   └────────┘          │
│                                                                  │
│     ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐          │
│     │ 💬     │   │ 📝     │   │ 📅     │   │ 💬     │          │
│     │ Slack  │   │ Notion │   │Calendar│   │  Chat  │          │
│     │ 2 new  │   │        │   │ 1 event│   │        │          │
│     └────────┘   └────────┘   └────────┘   └────────┘          │
│                                                                  │
│                                                                  │
│     ┌──────────────────────────────────────────────────────┐    │
│     │ 💬 Tell Maia what to do...                           │    │
│     └──────────────────────────────────────────────────────┘    │
│                                                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [📧 ·][💬 5][📊][🌐][💬 2][📝][📅 1][💬]  │  [⚙️] [⊞ Apps]    │
└──────────────────────────────────────────────────────────────────┘
```

### Specifications

| Element | Details |
|---|---|
| Background | #0A0A0A |
| Spaces bar | Top, full width, 32px height, #111111 bg |
| App grid | Centered, 4 columns (responsive), 96px per icon + label |
| App icon | 64px, rounded 16px, app's real favicon or custom icon |
| App label | 11px, #FFFFFF, centered below icon |
| App badge | Top-right of icon, red circle with white text |
| Command input | Centered below grid, 560px wide, 48px height, #1A1A1A bg, 12px radius |
| Input placeholder | "Tell Maia what to do..." in #555555 |
| Click app icon | Opens that app in a window |
| Enter in input | Sends command to AI, opens Team Chat if not open |

---

## 5. Dock

The dock is the primary navigation. Always accessible at the bottom. Auto-hides when an app is open. Appears on hover.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  ┃  ┌────┐ ┌────┐ ┌────┐ │
│  │ 📧 │ │ 💬 │ │ 📊 │ │ 🌐 │ │ 💬 │  ┃  │ 📅 │ │ ⚙️ │ │ ⊞  │ │
│  │Mail│ │WApp│ │Shts│ │Chrm│ │Chat│  ┃  │Cal │ │Set │ │Apps│ │
│  │ ·  │ │ 5  │ │    │ │ ·  │ │ 3  │  ┃  │    │ │    │ │    │ │
│  └────┘ └────┘ └────┘ └────┘ └────┘  ┃  └────┘ └────┘ └────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|---|---|
| Position | Bottom of screen, centered horizontally |
| Background | #111111 at 90% opacity, backdrop-filter: blur(20px) |
| Border | 1px #222222 top, border-radius 16px top corners |
| Shadow | 0 -4px 24px rgba(0, 0, 0, 0.5) |
| Height | 76px total (64px icons + 12px padding) |
| Padding | 8px |
| Auto-hide | Hidden by default when an app is open |
| Hover trigger | 4px invisible strip at bottom edge of screen |
| Slide up | 300ms ease-out |
| Slide down | 200ms ease-in, 500ms delay after mouse leaves |
| Left section | Recently used apps (max 7, auto-sorted by last use) |
| Divider | 1px #333333, 40px tall, 8px margin |
| Right section | Pinned apps + ⚙️ Settings + ⊞ App Store (always last two) |
| Icon size | 48px (56px on hover, 150ms ease-out scale) |
| Icon radius | 12px |
| Icon gap | 8px |
| Label | 11px, #888888, centered below icon, visible on hover |
| Badge | 18px red (#EF4444) circle, white 11px bold number, top-right |
| Running dot | 4px white circle, centered 4px below icon |
| Click | Opens app or brings to front |
| Right-click | Context menu: Pin / Unpin / Close / App Info |

---

## 6. App Window

Each app runs in its own window.

```
┌──────────────────────────────────────────────────────────────────┐
│  📧 Gmail                                          ─    □    ✕  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    REAL APP CONTENT                               │
│                    (webview — the actual Gmail)                   │
│                    Maia doesn't style this.                       │
│                    The app renders itself.                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  💬 Tell Maia: "Reply to John saying I'll be there at 3"        │
└──────────────────────────────────────────────────────────────────┘
```

### Title Bar

| Property | Value |
|---|---|
| Height | 38px |
| Background | #111111 |
| App icon | 16px, 12px from left |
| App name | 13px, weight 500, #FFFFFF, 8px after icon |
| Window controls | Right side: ─ (minimize), □ (maximize), ✕ (close) |
| Close hover | Red bg (#EF4444) |
| Maximize hover | Green bg (#22C55E) |
| Minimize hover | Yellow bg (#EAB308) |
| Draggable | Entire title bar, moves window |
| Double-click | Toggle maximize / restore |

### Window Frame

| Property | Value |
|---|---|
| Border | 1px #222222 |
| Border-radius | 8px top corners, 0px bottom |
| Shadow | 0 8px 32px rgba(0, 0, 0, 0.5) |
| Min size | 400px × 300px |
| Resizable | All edges and corners |

---

## 7. Window Management (Split Screen)

### Snap Zones

```
┌──────────────┬──────────────┐    ┌──────┬──────┐
│              │              │    │ TL25 │ TR25 │
│   Left 50%  │  Right 50%   │    ├──────┼──────┤
│              │              │    │ BL25 │ BR25 │
└──────────────┴──────────────┘    └──────┴──────┘

┌────────┬────────┬────────┐
│  33%   │  33%   │  33%   │
└────────┴────────┴────────┘
```

### Snap Preview

| Property | Value |
|---|---|
| Indicator | 4px #3B82F6 border around target zone |
| Fill | #3B82F6 at 5% opacity |
| Trigger | Window dragged within 20px of screen edge |
| Animation | Fade in 100ms |

### Snap Animation

Window slides and resizes to fill zone in 250ms ease-out.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Cmd+Left | Snap left 50% |
| Cmd+Right | Snap right 50% |
| Cmd+Up | Maximize |
| Cmd+Down | Restore/minimize |

### Common Layouts

**App + Chat (most common):** 65-70% app, 30-35% Team Chat

**Two apps:** 50/50 side by side

**Three apps:** 33/33/33 or one large + two small

**Four apps:** Quadrant grid (25% each)

---

## 8. Command Bar

Bottom of every app window. AI commands in the context of the current app.

```
┌──────────────────────────────────────────────────────────────────┐
│  💬 Tell Maia: "Reply to John saying I'll be there at 3"        │
└──────────────────────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Height | 44px |
| Background | #111111 |
| Border-top | 1px #222222 |
| Icon | 💬 14px, 12px left padding |
| Label | "Tell Maia:" — 12px, weight 500, #888888 |
| Input | 14px, #FFFFFF |
| Focus | Bottom 2px #3B82F6 border |
| Submit | Enter to send, Shift+Enter for newline |
| Toggle | Cmd+/ to show/hide |

---

## 9. Team Chat App

Full app in the dock. Opens in its own window. Snaps alongside other apps. Team Chat is where agents collaborate — debating, challenging, correcting, and arriving at answers together while the user watches.

### Layout — Agent Collaboration View

```
┌──────────────────────────────────────────────────────────────────┐
│  💬 Team Chat                                      ─    □    ✕  │
├──────────────────────────────────────────────────────────────────┤
│  Active: "Plan team trip to Tokyo"                               │
│  Agents: ✈️ Travel (working)  💰 Budget (watching)  📅 Calendar   │
│  ─────────────────────────────────────────────────               │
│                                                                  │
│  ✈️ Travel                                            2:31 PM    │
│  Found a flight to Tokyo for $750 on ANA, departing Tuesday      │
│                                                                  │
│  💰 Budget                                            2:31 PM    │
│  That's under the $800 limit but there's no return flight cost   │
│  yet. What's the round trip total?                               │
│                                                                  │
│  ✈️ Travel                                            2:31 PM    │
│  Round trip is $1,400                                            │
│                                                                  │
│  💰 Budget                                            2:32 PM    │
│  That's over budget. The limit was $800 total, not one-way.      │
│  Can you find something cheaper?                                 │
│                                                                  │
│  📊 Analyst                                           2:32 PM    │
│  I looked at historical prices for this route — $1,400 is        │
│  actually average. Budget carriers like Zipair run $600 RT       │
│                                                                  │
│  ✈️ Travel                                            2:32 PM    │
│  Good call. Searching Zipair now                                 │
│                                                                  │
│  📋 Policy                                            2:32 PM    │
│  Flagging — company policy requires 14-day advance booking.      │
│  Is Tuesday more than 14 days out?                               │
│                                                                  │
│  👤 You                                               2:33 PM    │
│  Good catch. Make it the week after.                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Type a message...                                        │    │
│  └──────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│  💬 Tell Maia: ...                                               │
└──────────────────────────────────────────────────────────────────┘
```

### Header — 56px

| Property | Value |
|---|---|
| Background | #111111 |
| Border-bottom | 1px #222222 |
| Task name | 14px, weight 500, #FFFFFF |
| Agent list | 12px, weight 400, each name in agent color |
| Agent status | Inline label after name: `(working)`, `(watching)`, `(done)` in #555555 |

### Messages

| Element | Style |
|---|---|
| Agent icon | 28px circle, agent color bg |
| Agent name | 14px, weight 600, agent color |
| Timestamp | 12px, #555555, right-aligned |
| Message text | 15px, weight 400, #FFFFFF, max-width 85% |
| User message | Right-aligned, #1A2A3A bg, 12px radius |
| @Mention | Bold, agent color |
| Message gap | 12px between different senders, 4px same sender |

### Agent-to-Agent Interactions

Messages between agents have visual cues that show the conversation flow:

| Interaction | Visual treatment |
|---|---|
| Challenge | Left border: 2px in challenging agent's color. Shows who is pushing back. |
| Agreement | Subtle checkmark icon (✓) before the message text, in #22C55E |
| Correction | Left border: 2px #EAB308 (yellow). The agent is fixing a factual error. |
| Flag/warning | Left border: 2px #EF4444 (red). Proactive warning from an observer agent. |
| Recommendation | Left border: 2px #3B82F6 (blue). Agent is suggesting a course of action. |
| Normal update | No border. Standard message styling. |

### Debate Thread Grouping

When agents debate (2-3 rapid exchanges), messages are visually grouped:

```
┌─ Debate ─────────────────────────────────────────────────────┐
│  ✈️ Travel: Round trip is $1,400                              │
│  ┃                                                           │
│  💰 Budget: That's over budget. The limit was $800 total.    │
│  ┃                                                           │
│  📊 Analyst: Historical average is $1,400. Try Zipair $600   │
│  ┃                                                           │
│  ✈️ Travel: Good call. Searching Zipair now                   │
└──────────────────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Group detection | Messages from 2+ agents within 30 seconds on the same topic |
| Group container | #0F0F0F bg, 1px #1A1A1A border, 8px radius, 8px left padding |
| Thread line | 2px #333333 vertical line connecting debate messages |
| Gap within group | 4px between messages |
| Gap between groups | 16px |

### Proactive Agent Messages

When an agent jumps in unprompted (spotted something relevant), the message has a subtle entry animation:

| Property | Value |
|---|---|
| Entry animation | Slide in from left, 200ms ease-out + gentle fade-in |
| Visual cue | Small "jumped in" label: 10px, #555555, italic, above the message |
| Label text | "saw something relevant" or "checking the numbers" — context-specific |
| Label fade | Fades out after 3 seconds, message remains |

### Research Timeline (Grouped Progress)

When an agent sends multiple rapid updates during research, group them:

```
🔍 Research                                            2:31 PM
  → Searching "best hotels brussels 2026"
  → Reading booking.com... (found 3 hotels)
  → Reading tripadvisor.com... (cross-referencing)
  → Done — 3 sources, high confidence
```

| Property | Value |
|---|---|
| Group trigger | 3+ messages from same agent within 30 seconds |
| First message | Full agent header (icon, name, timestamp) |
| Subsequent | Indented 20px, "→" prefix in #555555, no header |
| Spacing | 4px within group, 12px between groups |

### User Authority Visual

When the user sends a message, agents' subsequent responses show deference:

| Scenario | Visual |
|---|---|
| User overrides agent concern | Agent's response starts with compliance, no debate border |
| User asks a question | Relevant agent's response highlighted with subtle #1A1A1A bg |
| User redirects task | System message: "Task updated" in #555555, centered, 12px |

### Input — 48px, #1A1A1A, 12px radius, 1px #333333 border, focus: #3B82F6

---

## 10. App Store

Full window from ⊞ dock icon.

### Featured Card

| Property | Value |
|---|---|
| Background | #1A1A1A |
| Border | 1px #222222 |
| Border-radius | 12px |
| Icon | 40px |
| Name | 16px, weight 600 |
| Description | 13px, #888888 |
| Install button | #3B82F6 bg, white text, 8px radius |
| Installed | Button → "Open" (green) or "Uninstall" (gray) |

### Custom URL | "Enter any URL to install any web app" + [Add URL] button

---

## 11. Spotlight AI

Cmd+Space overlay.

| Property | Value |
|---|---|
| Overlay | #000000 at 60% opacity |
| Search box | 600px, centered, 56px height, #1A1A1A, 16px radius |
| Input | 24px, weight 300, #FFFFFF |
| Results | Below search, same width, #1A1A1A, grouped by app |
| Result hover | #222222 bg |
| Animation | Overlay fade 150ms, search scale 90%→100% in 200ms |
| Dismiss | Esc or click outside |

---

## 12. Spaces

Top bar. Click to switch contexts.

```
[● Work]  [○ Personal]  [○ Side Project]  [+ New]
```

| Property | Value |
|---|---|
| Height | 32px |
| Background | #0A0A0A |
| Active | ● white dot, white text, weight 500 |
| Inactive | ○ gray dot, #888888 text |
| Switch | 200ms crossfade |

---

## 13. Settings (Phase 2 — minimal for now)

Full app window. Left sidebar for sections, right pane for controls.

Sections: General, AI, Apps, Spaces, Privacy, About.

> **Note:** Settings is currently a stub. Full implementation in Phase 2.

---

## 14. Picture-in-Picture (Phase 2)

| Property | Value |
|---|---|
| Size | 280px × 180px, resizable |
| Position | Bottom-right, draggable |
| Border | 1px #333333, 8px radius |
| Shadow | 0 8px 24px rgba(0, 0, 0, 0.5) |
| Opacity | 90% |
| Always on top | Yes |
| Controls | [Expand] [Close] |

---

## 15. Notifications

### Dock Badge — 18px red circle, white number, top-right of icon

### Toast — Top-right, 360px wide, #1A1A1A, 12px radius, auto-dismiss 5s, slide from right 300ms

---

## 16. Animations & Transitions

| Element | Duration | Easing |
|---|---|---|
| Hover states | 100-150ms | ease-out |
| Dock slide up | 300ms | ease-out |
| Dock slide down | 200ms | ease-in (500ms delay) |
| Window snap | 250ms | ease-out |
| Spotlight appear | 200ms | scale + fade |
| Space switch | 200ms | crossfade |
| Toast appear | 300ms | slide from right |
| Badge bounce | 200ms | spring overshoot |
| PiP appear | 300ms | scale + fade |
| Dock icon hover | 150ms | ease-out scale |

---

## 17. Responsive & Accessibility

### Minimum: 1024px × 768px

### Keyboard

| Shortcut | Action |
|---|---|
| Cmd+Space | Spotlight AI |
| Cmd+/ | Toggle command bar |
| Cmd+, | Settings |
| Cmd+Left/Right | Snap window |
| Cmd+Up/Down | Maximize/restore |
| Cmd+W | Close window |
| Cmd+Tab | Switch apps |
| Cmd+1-9 | Open app by dock position |
| Ctrl+Left/Right | Switch spaces |

### Accessibility

- All elements focusable with Tab
- 2px #3B82F6 focus outline
- `role="toolbar"` on dock
- `role="log"` on chat
- `role="search"` on spotlight
- `role="alert"` on toasts
- `prefers-reduced-motion`: all animations 0ms

---

*When in doubt, look at macOS — then make it smarter.*
