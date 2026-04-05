import { useEffect, useRef, useState } from 'react'

import type { ChatMessage } from '@maia/shared'

import { ReplyPreview } from './ReplyPreview'

interface ChatInputProps {
  onCancelReply: () => void
  onSend: (message: string, replyToId?: string) => void | Promise<void>
  replyToMessage?: ChatMessage
}

export function ChatInput({ onCancelReply, onSend, replyToMessage }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
  }, [message])

  useEffect(() => {
    if (replyToMessage) {
      textareaRef.current?.focus()
    }
  }, [replyToMessage])

  const handleSubmit = async () => {
    const nextMessage = message.trim()
    if (!nextMessage || isSending) return

    setIsSending(true)
    try {
      await onSend(nextMessage, replyToMessage?.id)
      setMessage('')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="border-t border-border bg-[#0c0e13]/95 px-6 pb-5 pt-4 backdrop-blur">
      {replyToMessage ? (
        <div className="mb-3">
          <ReplyPreview message={replyToMessage} onClear={onCancelReply} variant="composer" />
        </div>
      ) : null}
      <div className="rounded-[22px] border border-border bg-elevated/90 shadow-[0_10px_30px_rgba(0,0,0,0.24)]">
        <textarea
          ref={textareaRef}
          className="max-h-[180px] min-h-[56px] w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-6 text-textPrimary outline-none placeholder:text-textMuted"
          onChange={(event) => {
            setMessage(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void handleSubmit()
            }
          }}
          placeholder={replyToMessage ? 'Reply to this message...' : 'Message the team...'}
          rows={1}
          value={message}
        />
        <div className="flex items-center justify-between gap-3 border-t border-border/80 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-textMuted">
            <span className="rounded-full border border-border px-2 py-1">Enter to send</span>
            <span>Shift+Enter for a new line</span>
          </div>
          <button
            className="rounded-full bg-accentBlue px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4a90ff] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!message.trim() || isSending}
            onClick={() => {
              void handleSubmit()
            }}
            type="button"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
