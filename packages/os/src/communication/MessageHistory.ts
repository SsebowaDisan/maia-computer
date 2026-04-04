import type { ChatMessage } from '@maia/shared'

export class MessageHistory {
  private readonly messages: ChatMessage[] = []

  add(message: ChatMessage): void {
    this.messages.push(message)
  }

  getRecent(count: number): ChatMessage[] {
    return this.messages.slice(-count)
  }

  getAll(): ChatMessage[] {
    return [...this.messages]
  }

  getByAgent(agentId: string): ChatMessage[] {
    return this.messages.filter(
      (m) => m.sender === agentId || m.receiver === agentId,
    )
  }

  getCount(): number {
    return this.messages.length
  }

  clear(): void {
    this.messages.length = 0
  }
}
