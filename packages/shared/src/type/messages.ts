export interface ChatMessage {
  id: string
  sender: string
  receiver: string
  intent: MessageIntent
  message: string
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
      return MESSAGE_PRIORITY.HIGH
    case MESSAGE_INTENT.CHALLENGE:
      return MESSAGE_PRIORITY.MEDIUM
    default:
      return MESSAGE_PRIORITY.LOW
  }
}
