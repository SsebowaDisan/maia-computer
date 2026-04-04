import { useState } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('')

  return (
    <div className="border-t border-border p-5">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const nextMessage = message.trim()
          if (!nextMessage) {
            return
          }

          void onSend(nextMessage)
          setMessage('')
        }}
      >
        <input
          className="w-full rounded-xl border border-borderHover bg-elevated px-4 py-3 text-sm text-textPrimary outline-none transition placeholder:text-textMuted focus:border-accentBlue"
          onChange={(event) => {
            setMessage(event.target.value)
          }}
          placeholder="Type a message..."
          value={message}
        />
      </form>
    </div>
  )
}
