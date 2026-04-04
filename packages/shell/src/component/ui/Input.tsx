import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-border bg-elevated px-4 py-3 text-sm text-textPrimary outline-none transition placeholder:text-textMuted focus:border-accentBlue ${className}`}
      {...props}
    />
  )
}
