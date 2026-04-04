import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        chrome: 'var(--maia-chrome)',
        surface: 'var(--maia-surface)',
        elevated: 'var(--maia-elevated)',
        border: 'var(--maia-border)',
        borderHover: 'var(--maia-border-hover)',
        textPrimary: 'var(--maia-text-primary)',
        textSecondary: 'var(--maia-text-secondary)',
        textMuted: 'var(--maia-text-muted)',
        accentBlue: 'var(--maia-accent-blue)',
        accentGreen: 'var(--maia-accent-green)',
        accentYellow: 'var(--maia-accent-yellow)',
        accentRed: 'var(--maia-accent-red)',
      },
      boxShadow: {
        window: '0 8px 32px rgba(0, 0, 0, 0.5)',
        dock: '0 -4px 24px rgba(0, 0, 0, 0.5)',
        spotlight: '0 8px 48px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
} satisfies Config
