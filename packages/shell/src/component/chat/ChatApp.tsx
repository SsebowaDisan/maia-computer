import { useEffect, useState } from 'react'

import type { ChatMessage } from '@maia/shared'

import { useTaskStore } from '../../store/taskStore'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'

interface ChatAppProps {
  messages: ChatMessage[]
  onSendMessage: (message: string, replyToId?: string) => Promise<void>
}

export function ChatApp({ messages, onSendMessage }: ChatAppProps) {
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)
  const activeAgentIds = useTaskStore((state) => state.activeAgentIds)
  const agentStatuses = useTaskStore((state) => state.agentStatuses)
  const taskDescription = useTaskStore((state) => state.taskDescription)
  const taskPhase = useTaskStore((state) => state.taskPhase)
  const replyToMessage = replyToMessageId
    ? messages.find((message) => message.id === replyToMessageId)
    : undefined

  useEffect(() => {
    if (replyToMessageId && !replyToMessage) {
      setReplyToMessageId(null)
    }
  }, [replyToMessage, replyToMessageId])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,#0d1016_0%,#0a0a0a_100%)]">
      <ChatHeader
        activeAgentIds={activeAgentIds}
        activeTask={taskDescription}
        agentStatuses={agentStatuses}
        messageCount={messages.length}
        taskPhase={taskPhase}
      />
      <MessageList
        messages={messages}
        onReply={(message) => {
          setReplyToMessageId(message.id)
        }}
      />
      <ChatInput
        onCancelReply={() => {
          setReplyToMessageId(null)
        }}
        onSend={async (message, currentReplyToId) => {
          await onSendMessage(message, currentReplyToId)
          setReplyToMessageId(null)
        }}
        replyToMessage={replyToMessage}
      />
    </div>
  )
}
