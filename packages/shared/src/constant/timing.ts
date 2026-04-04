// Action Engine — intentional delays for visibility
export const ACTION_TIMING = {
  MOUSE_MOVE_SHORT: 300,    // < 100px distance
  MOUSE_MOVE_MEDIUM: 400,   // 100-500px distance
  MOUSE_MOVE_LONG: 500,     // > 500px distance
  PRE_CLICK_PAUSE: 50,      // pause before clicking
  CLICK_HOLD: 50,           // hold the click
  DOUBLE_CLICK_GAP: 100,    // between two clicks
  TYPE_MIN_DELAY: 50,       // minimum ms between keystrokes
  TYPE_MAX_DELAY: 80,       // maximum ms between keystrokes
  SCROLL_MIN_DURATION: 300, // minimum scroll animation
  SCROLL_MAX_DURATION: 600, // maximum scroll animation
  POST_CLICK_DELAY: 200,    // wait after click for page reaction
  POST_TYPE_DELAY: 150,     // wait after typing for autocomplete
  POST_SCROLL_DELAY: 100,   // wait after scroll for content settle
} as const

// Brain — loop timing
export const BRAIN_TIMING = {
  SCREENSHOT_FORMAT_STREAM: 'jpeg' as const,
  SCREENSHOT_FORMAT_ANALYSIS: 'png' as const,
  SCREENSHOT_QUALITY: 80,
  MAX_LLM_CALLS_PER_MINUTE: 20,
  LLM_TIMEOUT: 30_000,
  SELF_HEAL_MAX_RETRIES: 3,
} as const

// Streaming
export const STREAM_TIMING = {
  TARGET_FPS: 30,
  FRAME_INTERVAL: 33,       // 1000 / 30
  EVENT_BATCH_INTERVAL: 16, // batch events every 16ms
  CHANGE_DETECTION_SAMPLES: 100,
  CHANGE_THRESHOLD: 0.05,   // 5% pixel difference
} as const

// WebSocket
export const WEBSOCKET_TIMING = {
  RECONNECT_BASE: 1000,
  RECONNECT_MAX: 30_000,
  HEARTBEAT_INTERVAL: 15_000,
} as const

// Cost
export const COST_DEFAULTS = {
  DEFAULT_TASK_BUDGET: 5.00,
  BUDGET_WARNING_THRESHOLD: 0.80,
  BUDGET_INCREASE_ON_CONTINUE: 0.50,
} as const
