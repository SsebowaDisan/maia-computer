import type { ChatMessage } from '@maia/shared'

import { AgentMessage } from './AgentMessage'
import { UserMessage } from './UserMessage'

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      {messages.map((message) => (
        message.sender === 'user'
          ? <UserMessage key={message.id} message={message} />
          : <AgentMessage key={message.id} message={message} />
      ))}
    </div>
  )
}
