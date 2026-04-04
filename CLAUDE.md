# Maia Computer — Development Rules

> These rules are non-negotiable. Every line of code, every commit, every decision must follow them.

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Language & Runtime](#2-language--runtime)
3. [File & Folder Rules](#3-file--folder-rules)
4. [Naming Conventions](#4-naming-conventions)
5. [Code Style](#5-code-style)
6. [Lines of Code (LOC) Rules](#6-lines-of-code-loc-rules)
7. [TypeScript Rules](#7-typescript-rules)
8. [React & Frontend Rules](#8-react--frontend-rules)
9. [State Management Rules](#9-state-management-rules)
10. [Styling Rules](#10-styling-rules)
11. [Backend Rules](#11-backend-rules)
12. [API & Communication Rules](#12-api--communication-rules)
13. [Error Handling Rules](#13-error-handling-rules)
14. [Testing Rules](#14-testing-rules)
15. [Git & Version Control Rules](#15-git--version-control-rules)
16. [Documentation Rules](#16-documentation-rules)
17. [Performance Rules](#17-performance-rules)
18. [Security Rules](#18-security-rules)
19. [Dependency Rules](#19-dependency-rules)
20. [Architecture Rules](#20-architecture-rules)
21. [Browser Engine Rules](#21-browser-engine-rules)
22. [Code Review Checklist](#22-code-review-checklist)

---

## 1. Project Identity

- The project is called **Maia Computer**
- The desktop environment is called **Theatre**
- The product name in code is `maia`
- Maia is an **AI-powered operating system** — not a browser, not an agent, not a chatbot
- Package names use `@maia/` scope: `@maia/os`, `@maia/shell`, `@maia/shared`
- Apps run as real web apps inside sandboxed Electron BrowserViews
- AI controls apps via Network Brain (API interception) and DOM Brain (element access) — NOT screenshots
- Team Chat is a full app in the dock, not a sidebar
- Never reference competing products in code or comments
- Never use Playwright, Puppeteer, or CDP for browser control
- Never use screenshots as the primary method of reading app state

---

## 2. Language & Runtime

| Rule | Value |
|---|---|
| Language | TypeScript — strict mode, everywhere, no exceptions |
| Backend runtime | Node.js (LTS version) |
| Frontend framework | React 18+ with Next.js 14+ (App Router) |
| Module system | ES Modules (`import/export`) — no CommonJS (`require`) |
| Target | ES2022 |
| Package manager | pnpm (not npm, not yarn) |
| Monorepo tool | Turborepo |

---

## 3. File & Folder Rules

### File naming

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase `.tsx` | `ChatPanel.tsx`, `BrowserStream.tsx` |
| Hooks | camelCase starting with `use` `.ts` | `useWebSocket.ts`, `useDivider.ts` |
| Stores (Zustand) | camelCase ending with `Store` `.ts` | `chatStore.ts`, `taskStore.ts` |
| Utilities/helpers | camelCase `.ts` | `webrtc.ts`, `coordinates.ts` |
| Types/interfaces | camelCase `.ts` | `events.ts`, `messages.ts` |
| Constants | camelCase `.ts` | `colors.ts`, `timing.ts` |
| Backend classes | PascalCase `.ts` | `BrowserManager.ts`, `ActionEngine.ts` |
| Tests | Same name + `.test.ts` | `BrowserManager.test.ts` |
| Config files | lowercase with dots | `tsconfig.json`, `tailwind.config.ts` |

### Folder naming

- Always lowercase
- Always singular: `hook/` not `hooks/`, `store/` not `stores/`, `component/` not `components/`
- Exception: `node_modules`, `packages` (ecosystem conventions)

### Folder structure rules

- **Maximum 3 levels deep** from `src/`. If you need a 4th level, you're over-organizing.
- **One component per file.** No file exports more than one React component.
- **Co-locate related files.** A component's hook, styles, and types live near the component, not in a distant folder.
- **No `index.ts` barrel files.** Import directly from the file: `import { Chat } from './ChatPanel'` not `import { Chat } from './chat'`. Barrel files hide dependencies and slow down builds.

### File creation rules

- **Never create a file unless it's needed right now.** No placeholder files. No empty scaffolding.
- **Never create a file with only types.** Types live in the file that uses them, unless shared across 3+ files.
- **Delete unused files immediately.** Dead files are worse than no files.

---

## 4. Naming Conventions

### Variables and functions

| Type | Convention | Example |
|---|---|---|
| Local variables | camelCase | `messageCount`, `isConnected` |
| Functions | camelCase, verb-first | `sendMessage()`, `handleClick()`, `parseEvent()` |
| Boolean variables | `is`/`has`/`can`/`should` prefix | `isLoading`, `hasMessages`, `canTakeOver` |
| Event handlers | `handle` + event | `handleMouseMove`, `handleSubmit` |
| Callbacks/props | `on` + event | `onMessage`, `onClick`, `onDividerDrag` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_FPS` |
| Enum values | SCREAMING_SNAKE_CASE | `MessageIntent.APPROVAL_REQUEST` |

### Classes

| Type | Convention | Example |
|---|---|---|
| Classes | PascalCase, noun | `BrowserManager`, `ActionEngine` |
| Abstract classes | `Base` prefix | `BaseConnector` |
| Interfaces | PascalCase, no `I` prefix | `ConnectorAction`, not `IConnectorAction` |
| Type aliases | PascalCase | `ChatMessage`, `BrowserEvent` |
| Generics | Single uppercase letter or descriptive | `T`, `TEvent`, `TState` |

### React specific

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `ChatPanel`, `BrowserStream` |
| Props types | Component name + `Props` | `ChatPanelProps`, `ToastProps` |
| Hooks | `use` + descriptive noun | `useWebSocket`, `useDivider` |
| Context | descriptive + `Context` | `TheatreContext` |
| Stores | descriptive + `Store` | `chatStore`, `taskStore` |

### Backend specific

| Type | Convention | Example |
|---|---|---|
| Event types | dot.separated.lowercase | `action.click`, `brain.thinking`, `session.takeover_start` |
| Connector IDs | lowercase, no spaces | `sheets`, `gmail`, `browser` |
| API endpoints | `/api/kebab-case` | `/api/start-task`, `/api/send-message` |
| WebSocket events | snake_case | `start_stream`, `user_input`, `agent_message` |
| Environment vars | SCREAMING_SNAKE_CASE, `MAIA_` prefix | `MAIA_LLM_API_KEY`, `MAIA_CDP_PORT` |

### Naming philosophy

- **Names are documentation.** A good name eliminates the need for a comment.
- **Be specific.** `data` is bad. `flightSearchResults` is good.
- **Don't abbreviate.** `msg` → `message`. `btn` → `button`. `ws` → `webSocket`. Exception: universally understood abbreviations (`url`, `id`, `api`, `css`).
- **Don't encode types in names.** `messageArray` → `messages`. `isLoadingBoolean` → `isLoading`.
- **Function names describe what they do, not how.** `getFlightPrice()` not `parseJsonAndExtractPriceField()`.

---

## 5. Code Style

### Formatting

| Rule | Value |
|---|---|
| Indentation | 2 spaces (not tabs) |
| Semicolons | No semicolons (rely on ASI) |
| Quotes | Single quotes for strings: `'hello'` |
| Template literals | Use backticks only when interpolating: `` `Hello ${name}` `` |
| Trailing commas | Always (in arrays, objects, function params) |
| Bracket spacing | Yes: `{ key: value }` not `{key: value}` |
| Arrow functions | Parens always: `(x) => x` not `x => x` |
| Object shorthand | Always: `{ name, age }` not `{ name: name, age: age }` |
| Destructuring | Prefer: `const { name } = user` over `const name = user.name` |
| Line length | 100 characters max. Break long lines. |
| Blank lines | One blank line between functions/methods. No consecutive blank lines. |
| EOF | Always end files with a single newline |

### Linting

- ESLint with `@typescript-eslint` rules
- Prettier for formatting (runs on save)
- No `// eslint-disable` comments. If a rule is wrong, fix the rule in config, not in code.
- No `@ts-ignore` or `@ts-expect-error`. Fix the type instead.
- No `any` type. Ever. Use `unknown` if the type is truly unknown, then narrow it.

### Import ordering

```typescript
// 1. Node built-ins
import { readFile } from 'node:fs/promises'

// 2. External packages
import { z } from 'zod'
import { create } from 'zustand'

// 3. Internal packages (@maia/*)
import { ChatMessage } from '@maia/shared'

// 4. Local imports (relative paths)
import { BrowserManager } from './BrowserManager'

// Blank line between each group
```

---

## 6. Lines of Code (LOC) Rules

### File size limits

| File type | Max LOC | Action if exceeded |
|---|---|---|
| React component | 150 lines | Split into smaller components |
| Custom hook | 100 lines | Extract sub-hooks or utility functions |
| Backend class | 200 lines | Split responsibilities into separate classes |
| Utility file | 100 lines | Group into more specific utility files |
| Type definitions | 100 lines | Split into domain-specific type files |
| Test file | 300 lines | Split into focused test suites |
| Store (Zustand) | 80 lines | Split into slices |

### Function size limits

| Function type | Max LOC | Action if exceeded |
|---|---|---|
| Regular function | 30 lines | Extract helper functions |
| React component render | 50 lines (JSX) | Extract sub-components |
| Event handler | 20 lines | Extract logic into functions |
| Utility function | 20 lines | Break into smaller steps |

### Rules of thumb

- **If you need to scroll to read a function, it's too long.**
- **If a file has more than 5 imports from the same project, it's doing too much.**
- **If you're passing more than 4 props to a component, consider restructuring.**
- **If a function has more than 3 parameters, use an options object.**
- **If a class has more than 8 methods, split it.**
- **If a switch statement has more than 5 cases, use a lookup object/map.**

---

## 7. TypeScript Rules

### Strict mode — non-negotiable

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Type rules

| Rule | Example |
|---|---|
| **No `any`. Ever.** | Use `unknown`, generics, or proper types |
| **No type assertions** (`as`) unless interfacing with untyped external code | `const el = document.getElementById('x') as HTMLInputElement` is okay for DOM |
| **Prefer `interface` for objects** that may be extended | `interface ChatMessage { ... }` |
| **Prefer `type` for unions, intersections, and computed types** | `type Intent = 'question' \| 'answer'` |
| **Use `const` assertions for literal types** | `const INTENTS = ['question', 'answer'] as const` |
| **Use discriminated unions** for event/message types | `type Event = { type: 'click', x: number } \| { type: 'type', text: string }` |
| **Return types on exported functions** | Always explicit: `function parse(input: string): ParseResult` |
| **No return types on internal/private functions** | Let TypeScript infer them |
| **Use `satisfies` over `as`** when validating shape | `const config = { ... } satisfies Config` |
| **Use `readonly` for arrays/objects that shouldn't be mutated** | `readonly messages: ChatMessage[]` |

### Null handling

| Rule | Details |
|---|---|
| **No `null`.** Use `undefined` for absence. | `null` only when an external API forces it (DOM, JSON parsing) |
| **Optional chaining** over null checks | `user?.name` not `user && user.name` |
| **Nullish coalescing** over logical OR | `value ?? 'default'` not `value \|\| 'default'` |
| **Non-null assertion (`!`)** — never use | If you "know" it's not null, prove it to TypeScript |

### Enum rules

- **No `enum` keyword.** Use `as const` objects instead.

```typescript
// Bad
enum Intent {
  Question = 'question',
  Answer = 'answer',
}

// Good
const INTENT = {
  QUESTION: 'question',
  ANSWER: 'answer',
} as const

type Intent = typeof INTENT[keyof typeof INTENT]
```

Why: `const` objects are simpler, tree-shakeable, and don't generate runtime code.

---

## 8. React & Frontend Rules

### Component rules

| Rule | Details |
|---|---|
| **Functional components only** | No class components. Ever. |
| **No default exports** | Always named exports: `export function ChatPanel()` not `export default function ChatPanel()` |
| **Props are destructured in parameters** | `function Chat({ messages, onSend }: ChatProps)` |
| **No inline styles** | Use Tailwind classes. Exception: dynamic values (cursor position, divider height) |
| **No nested component definitions** | Don't define a component inside another component |
| **Single responsibility** | One component does one thing. If it does two things, split it. |
| **No prop drilling beyond 2 levels** | Use Zustand store or React context |
| **No `useEffect` for derived state** | Use `useMemo` or compute inline |
| **No `useEffect` for event handling** | Use event handlers directly |

### Hook rules

| Rule | Details |
|---|---|
| **Custom hooks for reusable logic** | If 2+ components share logic, extract to a hook |
| **Hooks don't return JSX** | Hooks return data/functions. Components return JSX. |
| **Dependencies must be explicit** | No `// eslint-disable-next-line react-hooks/exhaustive-deps` |
| **Clean up subscriptions** | WebSocket, timers, event listeners — always clean up in return function |

### Rendering rules

| Rule | Details |
|---|---|
| **No unnecessary re-renders** | Use `React.memo` only when profiling shows a problem, not preemptively |
| **Keys must be stable and unique** | Never use array index as key for dynamic lists |
| **Conditional rendering** | `{condition && <Component />}` or ternary. No `if/else` blocks in JSX. |
| **List rendering** | `.map()` with explicit key. No `.forEach()` for rendering. |

### What NOT to add

- No loading skeletons (we have a simple spinner)
- No error boundaries wrapping everything (only at route level)
- No analytics/tracking code until explicitly requested
- No internationalization/i18n until explicitly requested
- No dark/light mode toggle (always dark, per UI-DESIGN.md)

---

## 9. State Management Rules

### Zustand rules

| Rule | Details |
|---|---|
| **One store per domain** | `chatStore`, `taskStore`, `browserStore` — not one giant store |
| **Stores are flat** | No deeply nested state. If nesting is needed, split into another store. |
| **Actions live in the store** | `chatStore.sendMessage()` not a separate action file |
| **Selectors for derived state** | `const unreadCount = useChatStore((s) => s.messages.filter(m => !m.read).length)` |
| **No store-to-store dependencies** | Stores don't import other stores. Use events or middleware if needed. |

### What goes in stores vs local state

| State type | Where |
|---|---|
| **Chat messages, unread count** | `chatStore` (shared across components) |
| **Divider position, panel sizes** | `theatreStore` (layout state) |
| **Current task, plan steps** | `taskStore` (task state) |
| **Browser connection status** | `browserStore` (connection state) |
| **Input field value** | Local `useState` (only this component cares) |
| **Hover/focus states** | Local `useState` or CSS (ephemeral) |
| **Animation states** | Local `useState` or `framer-motion` (transient) |

### No state for what can be computed

```typescript
// Bad — derived state stored separately
const [messages, setMessages] = useState([])
const [unreadCount, setUnreadCount] = useState(0)  // derived from messages!

// Good — compute it
const messages = useChatStore((s) => s.messages)
const unreadCount = messages.filter((m) => !m.read).length
```

---

## 10. Styling Rules

### Tailwind CSS

| Rule | Details |
|---|---|
| **Tailwind for all styling** | No CSS modules. No styled-components. No Emotion. |
| **Custom theme values from UI-DESIGN.md** | All colors, spacing, fonts defined in `tailwind.config.ts` |
| **No arbitrary values** unless dynamic | `bg-[#1A1A1A]` only if it's in the design spec and added to theme |
| **Responsive: mobile-first** | Default styles are mobile. Use `md:`, `lg:` for larger screens. |
| **No `!important`** | If you need it, your CSS structure is wrong |

### Custom CSS (exceptions only)

Custom CSS is allowed only for:
- Animations that Tailwind can't express (complex keyframes)
- WebRTC video element sizing
- Dynamic values from JavaScript (cursor position, divider height)

When custom CSS is needed, use CSS custom properties (variables):

```css
.divider {
  top: var(--divider-position);
}
```

### Color usage

- **Never hardcode hex colors in components.** Always use Tailwind theme or CSS variables.
- **Every color used must exist in UI-DESIGN.md.** If it doesn't exist, don't use it.
- **Agent colors are defined once** in `@maia/shared` constants and consumed everywhere.

---

## 11. Backend Rules

### Class design

| Rule | Details |
|---|---|
| **One class, one responsibility** | `MouseController` does mouse. `KeyboardController` does keyboard. Not `InputController` doing both. |
| **Constructor does setup only** | No async work in constructors. Use `async init()` or factory methods. |
| **Methods are verbs** | `navigate()`, `sendMessage()`, `captureScreenshot()` |
| **Private by default** | Only expose what other modules need. Use `private` for everything else. |
| **No static methods** on classes that have state | Use module-level functions instead |

### Async rules

| Rule | Details |
|---|---|
| **Always `async/await`** | No raw `.then()` chains |
| **Always handle promise rejections** | `try/catch` or let it propagate to the caller |
| **No fire-and-forget promises** | If you call an async function, `await` it or handle the promise |
| **Use `Promise.all` for independent async work** | Don't `await` sequentially when operations are independent |
| **Timeouts on all external calls** | LLM calls: 30s. CDP commands: 10s. Network requests: 15s. |

### CDP rules

| Rule | Details |
|---|---|
| **No Playwright. No Puppeteer. No CDP.** | Desktop app uses native OS APIs. No headless browsers. |
| **One CDP command at a time for input** | Mouse and keyboard events must be sequential to avoid race conditions |
| **Always wait for confirmation** | After `Page.navigate`, wait for `Page.loadEventFired` |
| **Screenshot before every Brain decision** | The Brain must see the current state, never a stale one |
| **Log every CDP command** | Every command sent and response received goes to the EventBus |

### LLM rules

| Rule | Details |
|---|---|
| **Prompts are not hardcoded strings** | Store prompt templates in dedicated files. Use template functions. |
| **Never put user data in system prompts** | User data goes in user messages. System prompt is static. |
| **Always set max_tokens** | Prevent runaway responses. Actions: 1024 tokens. Plans: 2048 tokens. |
| **Always set temperature** | Actions: 0.3. Plans: 0.5. Never above 0.7. |
| **Log token usage** | Every LLM call logs input tokens, output tokens, and cost. |
| **Graceful degradation** | If LLM call fails, retry once. If retry fails, pause and ask user. |

---

## 12. API & Communication Rules

### WebSocket messages

Every WebSocket message follows this structure:

```typescript
{
  type: string,        // event type (snake_case)
  payload: object,     // event data
  timestamp: number,   // Unix ms
  sessionId: string,   // which session
}
```

- **No raw strings on WebSocket.** Always JSON.
- **Always include timestamp and sessionId.**
- **Type field is required.** Unknown types are logged and ignored.

### Event naming

| Format | Example |
|---|---|
| `domain.action` | `browser.navigate`, `action.click`, `brain.thinking` |
| Past tense for completed events | `task.completed`, `message.sent` |
| Present tense for ongoing | `brain.thinking`, `action.typing` |

### HTTP API (minimal — most communication is WebSocket)

| Rule | Details |
|---|---|
| RESTful | `POST /api/task` to create, `GET /api/task/:id` to read |
| JSON only | No XML, no form data |
| Status codes | 200 success, 201 created, 400 bad request, 401 unauthorized, 500 server error |
| Validation | Zod schemas for all request bodies |

---

## 13. Error Handling Rules

### Philosophy

- **Errors are expected.** Pages fail to load. CDP disconnects. LLM calls timeout. Plan for it.
- **Handle at the right level.** Don't catch an error just to rethrow it. Catch it where you can actually do something about it.
- **Never swallow errors.** No empty `catch` blocks. At minimum, log the error.

### Error handling by layer

| Layer | Strategy |
|---|---|
| **CDP/Browser** | Retry once. If fails, report to Brain. Brain decides: retry, skip, or ask user. |
| **LLM** | Retry once with same input. If fails, retry with simplified input. If still fails, pause and ask user. |
| **WebSocket** | Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s). Buffer events during reconnect. |
| **WebRTC** | If stream drops, fall back to screenshot-based display. Auto-renegotiate. |
| **Connectors** | Auth errors: re-authenticate. Rate limits: back off and retry. Other: log and report to user. |
| **Frontend rendering** | React error boundary at route level only. Component errors show inline fallback, not full-page error. |

### Error logging

```typescript
// Every error log must include:
logger.error({
  message: 'What happened in plain English',
  error: originalError,           // the actual error object
  context: {                      // what was the system doing
    component: 'BrowserManager',
    action: 'navigate',
    url: 'https://...',
    sessionId: '...',
  },
})
```

### User-facing errors

- **Never show stack traces to the user.**
- **Never show raw error messages from external services.**
- User sees: a simple message in the chat from the agent explaining what went wrong and what it's doing about it.

```
// Bad (shown to user):
"TypeError: Cannot read property 'querySelector' of null at line 342"

// Good (shown to user):
"The page didn't load correctly. I'm trying again."
```

---

## 14. Testing Rules

### What to test

| Must test | Don't test |
|---|---|
| Brain decision logic | React component rendering (unless complex) |
| Action Engine timing and sequencing | CSS styling |
| CDP command generation | Third-party library internals |
| Event routing logic | Simple getters/setters |
| Message intent classification | Zustand store basic operations |
| Coordinate mapping (video → browser) | One-liner utility functions |
| Connector actions | Static configuration |

### Testing framework

| Tool | Purpose |
|---|---|
| Vitest | Unit + integration tests |
| React Testing Library | Component interaction tests (when needed) |
| Mock Service Worker (MSW) | Mock external APIs (LLM, Google Sheets) |

### Test file rules

| Rule | Details |
|---|---|
| **Test file location** | Same directory as source file: `BrowserManager.ts` → `BrowserManager.test.ts` |
| **Test naming** | `describe('BrowserManager')` → `it('navigates to URL and waits for load')` |
| **One assertion per test** preferred | Keep tests focused. Multiple assertions only if they're testing the same behavior. |
| **No test interdependence** | Every test must pass when run alone |
| **Mock external dependencies** | LLM calls, CDP, Google APIs — always mocked in unit tests |
| **Integration tests hit real services** | Separate test suite, runs against real Chromium in Docker |

### Test naming convention

```typescript
describe('MouseController', () => {
  it('moves cursor smoothly from origin to target', () => { ... })
  it('applies ease-in-out easing to movement', () => { ... })
  it('calculates duration based on distance', () => { ... })
  it('emits mouse_move events during movement', () => { ... })
})
```

Pattern: `it('[verb] [expected behavior]')`

---

## 15. Git & Version Control Rules

### Branch naming

| Type | Format | Example |
|---|---|---|
| Feature | `feature/short-description` | `feature/browser-engine` |
| Fix | `fix/short-description` | `fix/cursor-position-mapping` |
| Refactor | `refactor/short-description` | `refactor/event-types` |
| Chore | `chore/short-description` | `chore/update-dependencies` |

### Commit messages

Format: `type: short description`

```
feat: add CDP connection with auto-reconnect
fix: cursor position offset on resized video
refactor: extract mouse easing into separate module
chore: update tailwind config with design colors
docs: add connector development guide
test: add Brain decision loop tests
```

| Type | When |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `chore` | Build, deps, config changes |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting, no code change |

### Commit rules

- **One logical change per commit.** Don't mix a feature + a fix + a refactor in one commit.
- **Commit compiles.** Every commit must pass `tsc --noEmit` and lint.
- **Commit messages are imperative.** "add feature" not "added feature" or "adding feature."
- **No WIP commits** on shared branches. Squash before merging.
- **Never commit:** `.env` files, `node_modules`, build output, OS files (`.DS_Store`), secrets/keys.

### PR rules

- **PRs map to roadmap steps.** One PR per build step (or sub-step if the step is large).
- **PR title matches commit format:** `feat: Browser Engine with CDP connection`
- **PR description includes:** what changed, why, what to test, which roadmap step.
- **No PR over 500 lines changed.** Split large changes into sequential PRs.

---

## 16. Documentation Rules

### Code comments

| Rule | Details |
|---|---|
| **No obvious comments** | `// increment counter` above `counter++` — delete this |
| **Comment the "why", never the "what"** | `// CDP requires sequential input events to prevent race conditions` ✅ |
| **No commented-out code** | Delete it. Git has history. |
| **No TODO comments** without an issue link | `// TODO: fix this` ❌ — `// TODO(#42): handle reconnection` ✅ |
| **JSDoc on exported functions/classes** | Brief description + param/return types |
| **No JSDoc on internal functions** | TypeScript types are the documentation |

### JSDoc style

```typescript
/**
 * Moves the cursor smoothly from current position to target coordinates.
 * Uses cubic bezier easing for human-like motion.
 */
export async function moveTo(x: number, y: number): Promise<void> {
```

Short. One or two sentences. No `@param` tags — TypeScript handles that.

### Documentation files

- `ARCHITECTURE.md` — system architecture (already exists)
- `UI-DESIGN.md` — UI specifications (already exists)
- `ROADMAP.md` — build plan (already exists)
- `CLAUDE.md` — this file, development rules
- No other docs unless explicitly needed. Code is the documentation.

---

## 17. Performance Rules

### Frontend performance

| Rule | Target |
|---|---|
| **First paint** | Under 1 second |
| **WebRTC stream start** | Under 2 seconds from page load |
| **Animation frame rate** | 60fps for UI animations |
| **Browser stream frame rate** | 30fps target |
| **Stream latency** | Under 200ms |
| **Bundle size** | Under 200KB initial JS (gzipped) |
| **No layout thrashing** | Batch DOM reads and writes |
| **Lazy load skins** | Connector skins load only when activated |

### Backend performance

| Rule | Target |
|---|---|
| **Action execution** | Under 50ms per CDP command (excluding intentional delays) |
| **Brain loop iteration** | Under 5 seconds (screenshot + LLM + action) |
| **Event routing** | Under 1ms per event |
| **WebSocket message latency** | Under 10ms server-side processing |
| **Memory per session** | Under 256MB (excluding browser) |
| **Browser memory** | Under 512MB per instance |

### What NOT to optimize

- **Don't optimize before measuring.** Profile first, then fix.
- **Don't cache LLM responses.** Each screenshot is unique. Caching is unreliable.
- **Don't reduce intentional delays.** The 50ms typing speed and 300ms cursor movement are features, not bugs. They're what makes actions visible.

---

## 18. Security Rules

### Authentication & secrets

| Rule | Details |
|---|---|
| **API keys in environment variables only** | Never in code, never in git |
| **`.env` in `.gitignore`** | Always. Non-negotiable. |
| **OAuth tokens encrypted at rest** | User's Google/Slack tokens stored encrypted |
| **Session tokens expire** | 24-hour max session lifetime |
| **No secrets in logs** | Sanitize logs before writing |

### Browser isolation

| Rule | Details |
|---|---|
| **Docker container per session** | Users cannot see each other's browsers |
| **No host filesystem access** from browser container | Mount only what's needed |
| **Network isolation** | Browser containers can't access the host network directly |
| **Resource limits** | CPU and memory capped per container |

### Input validation

| Rule | Details |
|---|---|
| **Validate all user input** | Use Zod schemas for WebSocket messages and API requests |
| **Sanitize URLs** | Before passing to `Page.navigate`, validate URL format |
| **No user input in CDP commands** without sanitization | Prevent injection via crafted inputs |
| **Rate limit** | Max 60 WebSocket messages per minute per user |

### XSS prevention

- **No `dangerouslySetInnerHTML`** unless rendering trusted markdown
- **No inline `<script>` tags**
- **Content Security Policy** headers on Theatre frontend
- **Agent messages are text only** — no HTML rendering in chat

---

## 19. Dependency Rules

### Adding dependencies

Before adding any dependency, ask:
1. **Can we do this in under 50 lines ourselves?** If yes, don't add a dependency.
2. **Is it actively maintained?** Check last commit date, open issues, download count.
3. **What's the bundle size impact?** Use bundlephobia.com. Over 50KB gzipped? Think twice.
4. **Does it have types?** No `@types/` package needed = better. No types at all = don't use it.

### Approved dependencies

**OS core (`@maia/os`):**
- `openai` — OpenAI API (primary LLM)
- `@anthropic-ai/sdk` — Claude API (fallback LLM)
- `better-sqlite3` — local database (app registry, memory, history)
- `zod` — validation
- `pino` — logging
- `dotenv` — env vars
- `sharp` — image processing (screenshot resizing for vision fallback)

**Desktop shell (`@maia/shell`):**
- `electron` — desktop app framework (BrowserView for app sandboxes)
- `react`, `react-dom` — Theatre UI
- `zustand` — state management
- `framer-motion` — animations
- `tailwindcss` — styling

**Shared:**
- `typescript` — language
- `vitest` — testing
- `eslint` — linting
- `prettier` — formatting
- `turbo` — monorepo orchestration

### Banned patterns

- **No jQuery**
- **No Lodash** (use native JS methods)
- **No Moment.js** (use native `Date` or `Intl`)
- **No Axios** (use native `fetch`)
- **No Redux** (use Zustand)
- **No CSS-in-JS** (use Tailwind)
- **No Playwright, Puppeteer, Selenium** (use native desktop control)
- **No CDP** (desktop app controls the real screen, not a headless browser)
- **No Express** (use Fastify if HTTP is needed — faster, TypeScript-first)

---

## 20. Architecture Rules

### Separation of concerns

```
Brain                → decides WHAT to do         (never touches DOM/network directly)
Intelligence Layer   → reads and acts on apps     (never makes decisions)
  Network Brain      → reads API traffic          (never modifies requests)
  DOM Brain          → reads/controls UI elements (never reasons about tasks)
  Vision Brain       → screenshot fallback        (never used as primary)
WebContainer         → sandboxes each app         (never shares data between apps)
Event Bus            → delivers events            (never modifies events)
Theatre (Shell)      → displays the OS UI         (never controls apps directly)
```

No layer reaches into another layer's responsibility. Communication is through defined interfaces and events.

### Dependency direction

```
Theatre (Shell) → Electron IPC → OS Core
                                    ↓
                              Event Bus
                                ↓     ↓
                            Brain   Intelligence Layer
                              ↓       ↓         ↓
                            LLM   Network    DOM Brain
                                   Brain
                                     ↓
                                WebContainers (sandboxed apps)
```

Dependencies flow downward. Lower layers never import from higher layers. Communication upward is through events.

### New feature checklist

Before building any new feature, verify:

1. **Does it emit events?** Every state change must flow through the Event Stream.
2. **Is it visible in Theatre?** If the computer does something, the user must be able to see it.
3. **Can the user intervene?** If the feature involves an action, the user must be able to pause, redirect, or override.
4. **Is it in the chat?** If it involves a decision, it should be communicated in the team chat.
5. **Does it follow the roadmap?** Don't build Phase 2 features during Phase 1.

---

## 21. Desktop Engine Rules

### Desktop control rules

| Rule | Details |
|---|---|
| **No Playwright. No Puppeteer. No CDP.** | Desktop app uses native OS APIs for mouse, keyboard, and screen control. |
| **No headless browsers.** | The user's real screen is the interface. No hidden automation. |
| **Sequential input events** | Mouse and keyboard events are sent one at a time, in order. Never parallel. |
| **Intentional delays are mandatory** | Every action has human-like timing. This is not optional. |
| **Screenshot before every decision** | The Brain never acts on stale state. |
| **All native API errors are recoverable** | Permission denied, screen lock, app switch — all must be handled gracefully. |
| **Respect user's desktop** | Never close user's apps. Never delete files. Never change system settings without asking. |

### Timing rules (non-negotiable)

These delays make actions visible to the user. They are features, not performance bugs.

| Action | Timing |
|---|---|
| Mouse movement | 300-500ms depending on distance (ease-in-out) |
| Between mouse move and click | 50ms pause |
| Click press + release | 50ms hold |
| Typing per character | 50-80ms (randomized) |
| Scroll animation | 300-600ms (proportional to distance) |
| Post-click delay | 200ms (wait for page/app reaction) |
| Post-type delay | 150ms (wait for autocomplete/validation) |
| Post-scroll delay | 100ms (wait for content to settle) |
| Post-action screenshot wait | 500ms (let the screen settle before next screenshot) |

### Screen capture rules

| Rule | Details |
|---|---|
| **PNG format** for Brain analysis | Full quality, accurate colors |
| **Capture the real screen** | Use native screenshot APIs, not browser-specific tools |
| **Resolution** | Capture at actual screen resolution, resize for LLM if needed |
| **No streaming needed** | User watches their own screen — screenshots are only for the Brain |

### Desktop permissions

| Permission | When to ask |
|---|---|
| Screen recording | On first launch (required for screenshots) |
| Accessibility | On first launch (required for mouse/keyboard control) |
| Notifications | On first launch (for task completion alerts) |

---

## 22. Code Review Checklist

Every PR must pass this checklist before merging:

### Correctness
- [ ] Does it work? Has it been tested manually?
- [ ] Does it handle errors gracefully?
- [ ] Are edge cases covered?

### Rules compliance
- [ ] No `any` types
- [ ] No Playwright/Puppeteer/CDP (desktop control only)
- [ ] No `@ts-ignore`
- [ ] No commented-out code
- [ ] File LOC within limits
- [ ] Function LOC within limits
- [ ] Naming conventions followed

### Architecture
- [ ] Events emitted for all state changes
- [ ] No cross-layer imports
- [ ] No new dependencies without justification
- [ ] Changes are visible in Theatre (if applicable)

### Quality
- [ ] No unnecessary abstractions
- [ ] No premature optimization
- [ ] No code duplication (within reason)
- [ ] Tests added for new logic

### Security
- [ ] No secrets in code
- [ ] User input validated
- [ ] No XSS vectors

### UI (if frontend change)
- [ ] Matches UI-DESIGN.md specifications
- [ ] Animations match timing specs
- [ ] Works on mobile viewport
- [ ] Accessible (keyboard nav, screen reader labels)

---

*These rules exist to keep the codebase clean, consistent, and fast-moving. Follow them. When in doubt, choose the simpler option.*
