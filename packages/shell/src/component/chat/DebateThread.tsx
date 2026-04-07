import type { ReactNode } from 'react'

interface DebateThreadProps {
  children: ReactNode
}

export function DebateThread({ children }: DebateThreadProps) {
  return (
    <div className="my-4 rounded-lg border border-[#1A1A1A] bg-[#0F0F0F] p-2 pl-3">
      <div className="relative">
        <div className="pointer-events-none absolute bottom-3 left-[1.95rem] top-3 w-[2px] rounded bg-[#333333]" />
        <div className="relative flex flex-col gap-1">{children}</div>
      </div>
    </div>
  )
}
