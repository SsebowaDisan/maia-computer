interface SpotlightInputProps {
  onChange: (value: string) => void
  value: string
}

export function SpotlightInput({ onChange, value }: SpotlightInputProps) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-elevated px-5">
      <span className="text-xl text-textSecondary">⌕</span>
      <input
        autoFocus
        className="flex-1 bg-transparent text-2xl font-light text-textPrimary outline-none placeholder:text-textMuted"
        onChange={(event) => {
          onChange(event.target.value)
        }}
        placeholder="Search Maia"
        value={value}
      />
    </div>
  )
}
