export type ActionCommand =
  | { type: 'click'; x: number; y: number }
  | { type: 'double_click'; x: number; y: number }
  | { type: 'type'; text: string }
  | { type: 'press_key'; key: string }
  | { type: 'hotkey'; modifier: KeyModifier; key: string }
  | { type: 'scroll'; direction: 'up' | 'down'; amount: number }
  | { type: 'navigate'; url: string }
  | { type: 'hover'; x: number; y: number }
  | { type: 'click_text'; text: string }
  | { type: 'select'; selector: string; value: string }
  | { type: 'wait'; ms: number }
  | { type: 'screenshot' }

export const KEY_MODIFIER = {
  CONTROL: 'Control',
  SHIFT: 'Shift',
  ALT: 'Alt',
  META: 'Meta',
} as const

export type KeyModifier = typeof KEY_MODIFIER[keyof typeof KEY_MODIFIER]

export interface ActionResult {
  success: boolean
  duration: number
  screenshot?: string
  error?: string
}
