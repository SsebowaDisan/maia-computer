import { AGENT_PROFILES, USER_PROFILE } from '@maia/shared'

import type { ChatMessage } from '@maia/shared'

export interface ChatSenderMeta {
  color: string
  initials: string
  isUser: boolean
  name: string
  role?: string
}

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: 'numeric',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat([], {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function getSenderMeta(sender: string): ChatSenderMeta {
  if (sender === 'user') {
    return {
      color: USER_PROFILE.color,
      initials: getInitials(USER_PROFILE.name),
      isUser: true,
      name: USER_PROFILE.name,
    }
  }

  const profile = AGENT_PROFILES[sender]
  if (profile) {
    return {
      color: profile.color,
      initials: getInitials(profile.name),
      isUser: false,
      name: profile.name,
      role: profile.role,
    }
  }

  return {
    color: '#94A3B8',
    initials: getInitials(sender),
    isUser: false,
    name: sender,
  }
}

export function formatMessageTime(timestamp: number): string {
  return timeFormatter.format(timestamp)
}

export function formatDayLabel(timestamp: number): string {
  const messageDate = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const current = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())

  if (current.getTime() === today.getTime()) {
    return 'Today'
  }

  if (current.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  }

  return dateFormatter.format(messageDate)
}

export function isSameCalendarDay(leftTimestamp: number, rightTimestamp: number): boolean {
  const left = new Date(leftTimestamp)
  const right = new Date(rightTimestamp)
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  )
}

export function isMessageContinuation(previous: ChatMessage | undefined, current: ChatMessage): boolean {
  if (!previous || previous.sender !== current.sender) {
    return false
  }

  if (!isSameCalendarDay(previous.timestamp, current.timestamp)) {
    return false
  }

  return current.timestamp - previous.timestamp < 5 * 60 * 1000
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
