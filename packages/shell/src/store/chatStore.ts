import { create } from 'zustand'

import type { ChatMessage } from '@maia/shared'

interface ChatStoreState {
  messages: ChatMessage[]
  unreadCount: number
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  resetUnreadCount: () => void
}

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  unreadCount: 0,
  setMessages: (messages) => {
    set({ messages })
  },
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: state.unreadCount + (message.sender === 'user' ? 0 : 1),
    }))
  },
  resetUnreadCount: () => {
    set({ unreadCount: 0 })
  },
}))
