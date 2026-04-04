import type { ChatMessage } from '@maia/shared'

import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'

interface ChatAppProps {
  activeTask: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
}

export function ChatApp({ activeTask, messages, onSendMessage }: ChatAppProps) {
  return (
    <div className="flex h-full flex-col bg-chrome">
      <ChatHeader activeTask={activeTask} />
      <MessageList messages={messages} />
      <ChatInput onSend={onSendMessage} />
    </div>
  )
}
