import { useEffect } from 'react'

import { useIPC } from './useIPC'
import { useChatStore } from '../store/chatStore'
import { useTaskStore } from '../store/taskStore'

export function useChat() {
  const { invoke, on } = useIPC()
  const messages = useChatStore((state) => state.messages)
  const setMessages = useChatStore((state) => state.setMessages)
  const addMessage = useChatStore((state) => state.addMessage)
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount)
  const rebuildResearch = useTaskStore((state) => state.rebuildResearch)
  const thought = useTaskStore((state) => state.thought)

  useEffect(() => {
    void invoke('chat:getHistory', {}).then((result) => {
      setMessages(result.messages)
      rebuildResearch(result.messages, thought)
    })

    return on('chat:message', (_, payload) => {
      addMessage(payload.message)
      rebuildResearch(useChatStore.getState().messages, useTaskStore.getState().thought)
    })
  }, [addMessage, invoke, on, rebuildResearch, setMessages, thought])

  useEffect(() => {
    rebuildResearch(messages, thought)
  }, [messages, rebuildResearch, thought])

  return {
    messages,
    resetUnreadCount,
    async sendMessage(message: string, replyToId?: string) {
      await invoke('chat:send', { message, replyToId })
    },
  }
}
