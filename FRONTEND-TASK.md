# Frontend Task: Intelligence Upgrade UI

> The backend intelligence layer has been upgraded. The frontend needs to display the new capabilities — research progress, live comparisons, visual feedback, and smarter brain status.

---

## What Changed in the Backend

The backend now sends richer events and data through IPC. Here's what's new:

### 1. Research Memory Events

The Brain now maintains a `ResearchMemory` that persists across page navigations. When the agent visits a site, extracts data, and moves on — it remembers everything. The frontend needs to display this research progress.

**New event data in `brain:thinking` and `message.sent`:**
- Agent messages now include research findings (hotel names, prices, ratings)
- Agent messages include confidence levels (`low`, `medium`, `high`)
- Agent messages include back-navigation reasoning ("this page was mostly ads")

### 2. Live Comparison Tables in Team Chat

When the agent researches across multiple sites, it sends structured comparison data in team messages. The chat should render these as formatted comparison tables, not just plain text.

**Example message the backend sends:**
```
ok checked 3 sites, here's what i found:

🏆 Hotel Amigo — €210/night
   9.1 on Booking, ranked #3 on TripAdvisor, 2847 reviews
   right on Grand Place, luxury 5-star

💰 NH Collection — €168/night  
   8.7 rating, near Central Station, great breakfast
   best value pick

🎨 Hotel Bloom — €145/night
   cheapest, artsy vibe, further from center
```

**What to build:** Detect messages with this pattern (emoji headers + structured lines) and render them as styled comparison cards instead of plain text. Each item should be a card with the name, price, rating, and a brief description.

### 3. Brain Status Enhancement

The Brain Status overlay should show:
- **Current research progress**: "Checked 2 of 3 sources" or "Comparing prices across sites"
- **Confidence indicator**: A small badge (low/medium/high) showing how confident the agent is
- **Research memory summary**: "Found: Hotel Amigo €210, NH Collection €168" — a compact list of findings so far

### 4. Enhanced Agent Messages

Agent messages in Team Chat now have more personality and context:
- Messages explaining **why** the agent is going back: "this page is mostly ads, going back"
- Messages expressing **confidence**: "pretty confident in this one" vs "only found one source, let me verify"
- Messages showing **research progress**: "checking booking.com first" → "now heading to tripadvisor" → "ok here's my recommendation"

No new message types — just richer content in existing `message.sent` events.

---

## What to Build

### Task 1: Research Progress Indicator

**Location:** Brain Status overlay (the status bar that shows when the agent is working)

**What to show:**
- Number of pages visited: "Visited 3 pages"
- Number of sources with findings: "Data from 2 sources"  
- Confidence badge: colored dot — red (low), yellow (medium), green (high)
- Compact findings list: "Hotel Amigo €210 | NH Collection €168"

**Data source:** Listen for `brain:thinking` events. The `thought` field now includes research context. Also use `cost:update` events for spend tracking.

**Design:**
- Small, non-intrusive — sits below the existing "🧠 Working on: ..." text
- Dark background matching OS chrome (#111111)
- Text: #888888 for labels, #FFFFFF for values
- Confidence dot: 8px circle, colored by confidence level

### Task 2: Comparison Cards in Chat

**Location:** Team Chat message area (ChatApp)

**When:** An agent message contains structured comparison data (detect by pattern: lines starting with emoji + name + — + price)

**Render as:**
- Horizontal cards (or vertical stack on narrow width)
- Each card: name (bold), price (accent color), rating, brief notes
- Winner card has a subtle gold/blue border
- Rest have standard #222222 border

**Design:**
- Card background: #1A1A1A
- Card border: 1px #222222 (winner: 1px #3B82F6)
- Card padding: 12px
- Card border-radius: 8px
- Name: 14px weight 600 #FFFFFF
- Price: 14px weight 500 #22C55E (green for value)
- Rating: 13px #888888
- Notes: 12px #888888 italic
- Cards gap: 8px

### Task 3: Confidence Badge Component

**A reusable badge** that shows research confidence:

```
[● high confidence]    — green dot + "high confidence" 
[● checking more...]   — yellow dot + "checking more..."
[● just started]       — red dot + "just started"
```

**Usage:** In Brain Status overlay and optionally next to the final research message in chat.

**Design:**
- Inline flex, gap 6px
- Dot: 6px circle
- Text: 11px weight 500
- Colors: green (#22C55E) for high, yellow (#EAB308) for medium, red (#EF4444) for low

### Task 4: Research Timeline in Chat

As the agent browses, the chat shows a compact timeline of what it's doing:

```
🔍 Research
  → Searching "best hotels brussels 2026"
  → Reading booking.com... (found 3 hotels)
  → Reading tripadvisor.com... (cross-referencing)
  → Done — 3 sources, high confidence
```

This is NOT a new component — it's how existing agent messages should be grouped. When multiple messages from the same agent arrive in quick succession during research, group them under a single header with the timeline style.

**Design:**
- Messages within 30 seconds of each other from the same agent = grouped
- First message gets the full agent header (icon, name, timestamp)
- Subsequent messages in the group: indented with "→" prefix, no header
- Compact spacing: 4px between grouped messages (vs 12px between groups)

---

## Files to Modify

| File | What to change |
|---|---|
| `packages/shell/src/component/chat/AgentMessage.tsx` | Detect comparison patterns, render as cards. Group rapid messages into timeline. |
| `packages/shell/src/component/chat/MessageList.tsx` | Group messages from same agent within 30s window |
| `packages/shell/src/component/window/CommandBar.tsx` | Show research progress + confidence badge in brain status area |
| `packages/shell/src/store/chatStore.ts` | May need a `groupedMessages` selector |
| `packages/shell/src/store/taskStore.ts` | Add research state: findings count, sources count, confidence |

## New Components to Create

| Component | Purpose |
|---|---|
| `ComparisonCard.tsx` | Single comparison item (name, price, rating, notes) |
| `ComparisonGroup.tsx` | Group of comparison cards rendered from an agent message |
| `ConfidenceBadge.tsx` | Reusable confidence indicator (dot + label) |
| `ResearchProgress.tsx` | Compact research progress shown in brain status overlay |

---

## New Shared Types Available

The following types are now exported from `@maia/shared` (already built):

```typescript
// Page scraping
type ScrapedPage, PageType, PageSection, PageContentItem, ScrollState

// Research memory
type ResearchMemoryState, ResearchFinding, ResearchDataItem, VisitedPage

// Visual performance
type CursorIntent, VisualAction, GlowConfig, HighlightConfig

// Smart navigation
type SmartAction, WaitResult, WaitSignal
```

You probably won't need most of these on the frontend — they're mainly used by the backend. The frontend just needs to render the richer messages and events that the backend now sends.

---

## What NOT to Build

- **Don't touch the webview/BrowserView rendering** — all visual effects (cursor, glow, highlights, scan line) happen inside the webview via injected bridge scripts. The frontend doesn't need to render any of that.
- **Don't add new IPC channels** — all data flows through existing events (`brain:thinking`, `message.sent`, `cost:update`). The content is just richer now.
- **Don't add loading skeletons** — keep the simple spinner.
- **Don't add analytics/tracking** — not needed.

---

## Priority Order

1. **Comparison Cards** — highest visual impact, users see research results
2. **Research Timeline grouping** — makes the chat feel intelligent
3. **Confidence Badge** — small but shows intelligence
4. **Research Progress indicator** — nice to have for brain status

---

*The backend is done and compiles clean. All visual effects inside app webviews are handled by the bridge scripts. Your job is making the Theatre UI (chat, brain status) display the smarter agent's output beautifully.*
