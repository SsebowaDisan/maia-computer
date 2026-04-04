import type { ChatMessage } from '@maia/shared'
import type { EventBus } from '../events/EventBus'
import { MessageHistory } from './MessageHistory'
import { classifyIntent } from './IntentClassifier'

type MessageHandler = (message: ChatMessage) => void

export class MessageBus {
  private readonly eventBus: EventBus
  private readonly history: MessageHistory
  private readonly handlers = new Map<string, Set<MessageHandler>>()
  private readonly globalHandlers = new Set<MessageHandler>()

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
    this.history = new MessageHistory()
  }

  send(message: ChatMessage): void {
    this.history.add(message)

    this.eventBus.publish({
      type: 'message.sent',
      message,
      timestamp: Date.now(),
    })

    // Route to specific receiver
    const receiverHandlers = this.handlers.get(message.receiver)
    if (receiverHandlers) {
      for (const handler of receiverHandlers) {
        handler(message)
      }
    }

    // Route to broadcast handlers
    if (message.receiver === 'all') {
      for (const handler of this.globalHandlers) {
        handler(message)
      }
    }
  }

  sendUserMessage(text: string, taskId: string): ChatMessage {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender: 'user',
      receiver: 'all',
      intent: classifyIntent(text),
      message: text,
      context: { taskId },
      timestamp: Date.now(),
    }

    this.send(message)
    return message
  }

  subscribe(receiverId: string, handler: MessageHandler): () => void {
    let handlers = this.handlers.get(receiverId)
    if (!handlers) {
      handlers = new Set()
      this.handlers.set(receiverId, handlers)
    }
    handlers.add(handler)

    return () => {
      handlers!.delete(handler)
    }
  }

  subscribeAll(handler: MessageHandler): () => void {
    this.globalHandlers.add(handler)
    return () => {
      this.globalHandlers.delete(handler)
    }
  }

  getHistory(): MessageHistory {
    return this.history
  }
}
