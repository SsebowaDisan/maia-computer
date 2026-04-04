import type { MaiaEvent } from '@maia/shared'

type EventHandler = (event: MaiaEvent) => void
type EventType = MaiaEvent['type']

export class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>()
  private readonly globalHandlers = new Set<EventHandler>()

  publish(event: MaiaEvent): void {
    // Notify type-specific handlers
    const typeHandlers = this.handlers.get(event.type)
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        handler(event)
      }
    }

    // Notify global handlers
    for (const handler of this.globalHandlers) {
      handler(event)
    }
  }

  subscribe(eventType: EventType, handler: EventHandler): () => void {
    let typeHandlers = this.handlers.get(eventType)
    if (!typeHandlers) {
      typeHandlers = new Set()
      this.handlers.set(eventType, typeHandlers)
    }
    typeHandlers.add(handler)

    return () => {
      typeHandlers!.delete(handler)
      if (typeHandlers!.size === 0) {
        this.handlers.delete(eventType)
      }
    }
  }

  subscribeAll(handler: EventHandler): () => void {
    this.globalHandlers.add(handler)
    return () => {
      this.globalHandlers.delete(handler)
    }
  }

  subscribePattern(pattern: string, handler: EventHandler): () => void {
    // Subscribe to all events matching a prefix like 'action.*' or 'brain.*'
    const prefix = pattern.replace('.*', '.')

    const wrappedHandler: EventHandler = (event) => {
      if (event.type.startsWith(prefix)) {
        handler(event)
      }
    }

    this.globalHandlers.add(wrappedHandler)
    return () => {
      this.globalHandlers.delete(wrappedHandler)
    }
  }

  clear(): void {
    this.handlers.clear()
    this.globalHandlers.clear()
  }
}
