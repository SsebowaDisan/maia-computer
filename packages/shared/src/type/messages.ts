export interface ChatMessage {
  id: string
  sender: string
  receiver: string
  intent: MessageIntent
  message: string
  replyToId?: string
  context: MessageContext
  attachments?: MessageAttachments
  timestamp: number
}

export const MESSAGE_INTENT = {
  QUESTION: 'question',
  ANSWER: 'answer',
  CHALLENGE: 'challenge',
  AGREEMENT: 'agreement',
  APPROVAL_REQUEST: 'approval_request',
  INSTRUCTION: 'instruction',
  UPDATE: 'update',
  HANDOFF: 'handoff',
  CONTEXT: 'context',
  REDIRECT: 'redirect',
  TAKEOVER: 'takeover',
  CASUAL: 'casual',
  RECOMMENDATION: 'recommendation',
  CORRECTION: 'correction',
  FLAG: 'flag',
} as const

export type MessageIntent = typeof MESSAGE_INTENT[keyof typeof MESSAGE_INTENT]

export interface MessageContext {
  taskId: string
  step?: string
}

export interface MessageAttachments {
  screenshot?: string
  data?: Record<string, unknown>
}

export const MESSAGE_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

export type MessagePriority = typeof MESSAGE_PRIORITY[keyof typeof MESSAGE_PRIORITY]

export function getMessagePriority(intent: MessageIntent): MessagePriority {
  switch (intent) {
    case MESSAGE_INTENT.APPROVAL_REQUEST:
    case MESSAGE_INTENT.QUESTION:
    case MESSAGE_INTENT.REDIRECT:
      return MESSAGE_PRIORITY.HIGH
    case MESSAGE_INTENT.CHALLENGE:
    case MESSAGE_INTENT.CORRECTION:
    case MESSAGE_INTENT.FLAG:
    case MESSAGE_INTENT.INSTRUCTION:
    case MESSAGE_INTENT.TAKEOVER:
      return MESSAGE_PRIORITY.MEDIUM
    default:
      return MESSAGE_PRIORITY.LOW
  }
}

export const QUESTION_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export type QuestionSeverity = typeof QUESTION_SEVERITY[keyof typeof QUESTION_SEVERITY]

export interface PendingQuestion {
  id: string
  agentId: string
  question: string
  severity: QuestionSeverity
  defaultAction: string
  waitSeconds: number
  askedAt: number
  resolved: boolean
  resolution?: string
}
