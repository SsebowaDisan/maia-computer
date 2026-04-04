import type { PointerEvent } from 'react'

interface TitleBarProps {
  icon: string
  isMaximized: boolean
  onClose: () => void
  onDoubleClick: () => void
  onDragStart: (event: PointerEvent<HTMLDivElement>) => void
  onMaximize: () => void
  onMinimize: () => void
  title: string
}

export function TitleBar({
  icon,
  isMaximized,
  onClose,
  onDoubleClick,
  onDragStart,
  onMaximize,
  onMinimize,
  title,
}: TitleBarProps) {
  return (
    <div
      className="flex h-[38px] items-center justify-between border-b border-border bg-surface px-3"
      onDoubleClick={onDoubleClick}
      onPointerDown={onDragStart}
    >
      <div className="flex items-center gap-2 text-[13px] font-medium text-textPrimary">
        <span className="text-base">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-1 text-sm text-textSecondary">
        <button className="h-7 w-7 rounded-full hover:bg-accentYellow/20 hover:text-accentYellow" onClick={onMinimize}>
          ─
        </button>
        <button className="h-7 w-7 rounded-full hover:bg-accentGreen/20 hover:text-accentGreen" onClick={onMaximize}>
          {isMaximized ? '▢' : '□'}
        </button>
        <button className="h-7 w-7 rounded-full hover:bg-accentRed/20 hover:text-accentRed" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  )
}
