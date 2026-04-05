import { useCallback, useRef, useState } from 'react'

import type { PlanStep } from '@maia/shared'

interface BrainStatusProps {
  currentStep?: string
  isVisible: boolean
  plan: PlanStep[]
  taskDescription: string
  thought: string
}

export function BrainStatus({ currentStep, isVisible, plan, taskDescription, thought }: BrainStatusProps) {
  const [dismissed, setDismissed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | undefined>(undefined)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [position])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    setPosition({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
    })
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = undefined
  }, [])

  if (!isVisible || dismissed) return null

  const completedCount = plan.filter((s) => s.status === 'completed').length

  return (
    <div
      className="fixed left-6 top-12 z-50 max-w-xs cursor-grab select-none rounded-xl border border-border bg-elevated/90 px-4 py-3 shadow-lg backdrop-blur active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accentBlue" />
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-textSecondary">Brain</p>
        </div>
        <button
          className="flex h-5 w-5 items-center justify-center rounded-md text-textMuted transition hover:bg-white/10 hover:text-textPrimary"
          onClick={() => { setDismissed(true) }}
          type="button"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="mt-1 truncate text-sm text-textPrimary">{taskDescription}</p>
      {plan.length > 0 ? (
        <p className="mt-1 text-xs text-textMuted">
          Step {completedCount + 1} of {plan.length}
        </p>
      ) : null}
      {currentStep ? <p className="mt-1 truncate text-xs text-textSecondary">{currentStep}</p> : null}
      {thought ? <p className="mt-2 truncate text-xs italic text-textMuted">{thought}</p> : null}
    </div>
  )
}
