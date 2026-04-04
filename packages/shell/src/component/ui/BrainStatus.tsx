interface BrainStatusProps {
  currentStep?: string
  isVisible: boolean
  taskDescription: string
}

export function BrainStatus({ currentStep, isVisible, taskDescription }: BrainStatusProps) {
  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed left-6 top-12 z-50 rounded-xl border border-border bg-elevated/90 px-4 py-3 backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-textSecondary">Brain</p>
      <p className="mt-1 text-sm text-textPrimary">{taskDescription}</p>
      {currentStep ? <p className="mt-2 text-xs text-textSecondary">{currentStep}</p> : null}
    </div>
  )
}
