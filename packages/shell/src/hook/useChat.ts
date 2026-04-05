import { useEffect } from 'react'

import { useIPC } from './useIPC'
import { useChatStore } from '../store/chatStore'

export function useChat() {
  const { invoke, on } = useIPC()
  const messages = useChatStore((state) => state.messages)
  const setMessages = useChatStore((state) => state.setMessages)
  const addMessage = useChatStore((state) => state.addMessage)
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount)

  useEffect(() => {
    void invoke('chat:getHistory', {}).then((result) => {
      setMessages(result.messages)
    })

    return on('chat:message', (_, payload) => {
      addMessage(payload.message)
    })
  }, [addMessage, invoke, on, setMessages])

  return {
    messages,
    resetUnreadCount,
    async sendMessage(message: string, replyToId?: string) {
      await invoke('chat:send', { message, replyToId })
    },
  }
}
