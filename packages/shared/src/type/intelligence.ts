// ── Page Scraper Types ───────────────────────────────────────────

export const PAGE_TYPE = {
  SEARCH_RESULTS: 'search_results',
  LISTING: 'listing',
  ARTICLE: 'article',
  PRODUCT: 'product',
  FORM: 'form',
  DASHBOARD: 'dashboard',
  MEDIA: 'media',
  ERROR: 'error',
  UNKNOWN: 'unknown',
} as const

export type PageType = typeof PAGE_TYPE[keyof typeof PAGE_TYPE]

export interface PageMetadata {
  description: string
  language: string
  datePublished: string | undefined
  canonical: string | undefined
  jsonLd: unknown[]
  openGraph: Record<string, string>
}

export interface PageSection {
  type: 'header' | 'nav' | 'main' | 'sidebar' | 'footer' | 'filters' | 'pagination' | 'form' | 'results' | 'content'
  text: string
  items: PageContentItem[]
}

export interface PageContentItem {
  type: string
  title: string
  text: string
  price: string | undefined
  rating: string | undefined
  reviewCount: number | undefined
  location: string | undefined
  link: string | undefined
  image: string | undefined
  amenities: string[]
  metadata: Record<string, string>
}

export interface ScrollState {
  viewportTop: number
  viewportBottom: number
  totalHeight: number
  hasMoreBelow: boolean
  hasMoreAbove: boolean
  lazyLoadTrigger: 'scroll' | 'button' | 'none'
}

export interface ActiveStates {
  selectedTab: string | undefined
  openDropdown: string | undefined
  checkedItems: string[]
  expandedSections: string[]
  focusedElement: string | undefined
}

export interface ScrapedElement {
  role: string
  label: string
  text: string
  selector: string
  href: string | undefined
  position: { x: number; y: number }
  size: { width: number; height: number }
  value: string | undefined
  tagName: string
  isVisible: boolean
  isDisabled: boolean
  ariaExpanded: boolean | undefined
  ariaBusy: boolean | undefined
  hasClickHandler: boolean
}

export interface ScrapedPage {
  pageType: PageType
  url: string
  title: string
  metadata: PageMetadata
  sections: PageSection[]
  content: PageContentItem[]
  scrollState: ScrollState
  activeStates: ActiveStates
  interactiveElements: ScrapedElement[]
  obstacles: PageObstacle[]
}

// ── Page Obstacles ──────────────────────────────────────────────

export const OBSTACLE_TYPE = {
  COOKIE_BANNER: 'cookie_banner',
  NEWSLETTER_POPUP: 'newsletter_popup',
  LOGIN_WALL: 'login_wall',
  CHAT_WIDGET: 'chat_widget',
  NOTIFICATION_PROMPT: 'notification_prompt',
  GDPR_OVERLAY: 'gdpr_overlay',
  PAYWALL: 'paywall',
  AD_OVERLAY: 'ad_overlay',
} as const

export type ObstacleType = typeof OBSTACLE_TYPE[keyof typeof OBSTACLE_TYPE]

export interface PageObstacle {
  type: ObstacleType
  selector: string
  dismissAction: 'click_accept' | 'click_close' | 'press_escape' | 'go_back' | 'ignore'
  dismissTarget: string | undefined
}

// ── Research Memory Types ───────────────────────────────────────

export const SOURCE_CREDIBILITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

export type SourceCredibility = typeof SOURCE_CREDIBILITY[keyof typeof SOURCE_CREDIBILITY]

export interface ResearchFinding {
  source: string
  url: string
  visitedAt: number
  data: ResearchDataItem[]
  content: string
  credibility: SourceCredibility
  pageType: PageType
}

export interface ResearchDataItem {
  name: string
  [key: string]: unknown
}

export interface VisitedPage {
  url: string
  title: string
  useful: boolean
  reason: string | undefined
  visitedAt: number
}

export interface ResearchMemoryState {
  task: string
  findings: ResearchFinding[]
  searchesTriedSoFar: string[]
  pagesVisited: VisitedPage[]
  openQuestions: string[]
  confidence: 'low' | 'medium' | 'high'
  confidenceReason: string
}

// ── Smart Navigation Types ──────────────────────────────────────

export type SmartAction =
  | { type: 'click'; target: string; value?: undefined }
  | { type: 'type'; target: string; value: string }
  | { type: 'scroll'; target: string; value?: undefined }
  | { type: 'hover'; target: string; value?: undefined }
  | { type: 'press_key'; target: string; value?: undefined }
  | { type: 'go_back'; target: string; value?: undefined }
  | { type: 'navigate'; target: string; value?: undefined }
  | { type: 'find_text'; target: string; value?: undefined }
  | { type: 'open_tab'; target: string; value?: undefined }
  | { type: 'switch_tab'; target: string; value?: undefined }
  | { type: 'dismiss_popup'; target: string; value?: undefined }
  | { type: 'use_filter'; target: string; value: string }
  | { type: 'expand'; target: string; value?: undefined }
  | { type: 'select_option'; target: string; value: string }
  | { type: 'right_click'; target: string; value?: undefined }
  | { type: 'drag'; target: string; value: string }

export const WAIT_SIGNAL = {
  DOM_CHANGED: 'dom_changed',
  URL_CHANGED: 'url_changed',
  LCP_FIRED: 'lcp_fired',
  NETWORK_IDLE: 'network_idle',
  TRANSITION_END: 'transition_end',
  ARIA_BUSY_FALSE: 'aria_busy_false',
  TIMEOUT: 'timeout',
} as const

export type WaitSignal = typeof WAIT_SIGNAL[keyof typeof WAIT_SIGNAL]

export interface WaitResult {
  signal: WaitSignal
  durationMs: number
}

// ── Visual Performance Types ────────────────────────────────────

export const CURSOR_INTENT = {
  DIRECT: 'direct',
  SCANNING: 'scanning',
  DECISIVE: 'decisive',
  SKIPPING: 'skipping',
  READING: 'reading',
  RETURNING: 'returning',
} as const

export type CursorIntent = typeof CURSOR_INTENT[keyof typeof CURSOR_INTENT]

export interface CursorMove {
  x: number
  y: number
  intent: CursorIntent
}

export interface TypingConfig {
  text: string
  minDelay: number
  maxDelay: number
  thinkingPauses: boolean
}

export interface GlowConfig {
  selector: string
  color: string
  durationMs: number
}

export interface HighlightConfig {
  text: string
  progressive: boolean
  syncWithScanLine: boolean
}

export interface VisualAction {
  cursorMove: CursorMove | undefined
  glow: GlowConfig | undefined
  typing: TypingConfig | undefined
  highlights: HighlightConfig[]
  scanLine: boolean
  extractionPulse: string | undefined
}

// ── Enhanced Decision Result ────────────────────────────────────

export interface SmartDecisionResult {
  thinking: string
  action: SmartAction | undefined
  visual: VisualAction | undefined
  stepComplete: boolean
  teamMessage: string | undefined
  researchUpdate: ResearchDataItem[] | undefined
  highlights: string[] | undefined
  question: string | undefined
  questionSeverity: string | undefined
  questionDefault: string | undefined
  backReason: string | undefined
  confidence: 'low' | 'medium' | 'high' | undefined
}
