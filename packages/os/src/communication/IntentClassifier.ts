import { MESSAGE_INTENT, type MessageIntent } from '@maia/shared'

const TAKEOVER_PATTERNS = [
  /\blet me\b/i,
  /\bi'?ll (do|handle|take)/i,
  /\bgive me control\b/i,
  /\bmy turn\b/i,
  /\blet me log ?in\b/i,
]

const RESUME_PATTERNS = [
  /\bcontinue\b/i,
  /\bresume\b/i,
  /\byour turn\b/i,
  /\bgo ahead\b/i,
  /\bdone\b/i,
  /\bfinished\b/i,
]

const NEGATIVE_PATTERNS = [
  /\bno\b/i,
  /\bstop\b/i,
  /\bcancel\b/i,
  /\bdon'?t\b/i,
  /\babort\b/i,
]

const QUESTION_PATTERNS = [
  /\bwhy\b/i,
  /\bhow\b/i,
  /\bwhat\b/i,
  /\?$/,
]

const APPROVAL_PATTERNS = [
  /\byes\b/i,
  /\bok\b/i,
  /\bapprove\b/i,
  /\bgo ahead\b/i,
  /\bbook it\b/i,
  /\bdo it\b/i,
  /\bsure\b/i,
]

export function classifyIntent(text: string): MessageIntent {
  const trimmed = text.trim()

  if (TAKEOVER_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.INSTRUCTION
  }

  if (RESUME_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.INSTRUCTION
  }

  if (NEGATIVE_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.INSTRUCTION
  }

  if (QUESTION_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.QUESTION
  }

  if (APPROVAL_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.AGREEMENT
  }

  return MESSAGE_INTENT.INSTRUCTION
}

export function isTakeoverRequest(text: string): boolean {
  return TAKEOVER_PATTERNS.some((p) => p.test(text.trim()))
}

export function isResumeRequest(text: string): boolean {
  return RESUME_PATTERNS.some((p) => p.test(text.trim()))
}
