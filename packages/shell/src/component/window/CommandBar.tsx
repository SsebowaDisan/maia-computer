import { useState } from 'react'

interface CommandBarProps {
  onSubmit: (command: string) => void
}

export function CommandBar({ onSubmit }: CommandBarProps) {
  const [command, setCommand] = useState('')

  return (
    <div className="border-t border-border bg-surface px-3 py-2">
      <form
        className="flex items-center gap-2 rounded-md border border-transparent px-1 focus-within:border-b-2 focus-within:border-b-accentBlue"
        onSubmit={(event) => {
          event.preventDefault()
          const nextCommand = command.trim()
          if (!nextCommand) {
            return
          }

          onSubmit(nextCommand)
          setCommand('')
        }}
      >
        <span className="text-sm">💬</span>
        <span className="text-xs font-medium text-textSecondary">Tell Maia:</span>
        <input
          className="flex-1 bg-transparent text-sm text-textPrimary outline-none placeholder:text-textMuted"
          onChange={(event) => {
            setCommand(event.target.value)
          }}
          placeholder='Reply to John saying I will be there at 3'
          value={command}
        />
      </form>
    </div>
  )
}
