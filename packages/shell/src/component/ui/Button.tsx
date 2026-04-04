import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({
  children,
  className = '',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-accentBlue text-white hover:bg-blue-500',
    secondary: 'bg-elevated text-textPrimary hover:bg-[#242424]',
    ghost: 'bg-transparent text-textSecondary hover:bg-elevated',
  }

  return (
    <button
      className={`rounded-lg border border-border px-3 py-2 text-sm transition ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
