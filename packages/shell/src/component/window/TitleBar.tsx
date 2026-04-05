import type { SnapZone } from '@maia/shared'

import { AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, type PointerEvent } from 'react'

import { SnapMenu } from './SnapMenu'
import { AppIcon } from '../ui/AppIcon'

interface TitleBarProps {
  icon: string
  isMaximized: boolean
  onClose: () => void
  onDoubleClick: () => void
  onDragStart: (event: PointerEvent<HTMLDivElement>) => void
  onMaximize: () => void
  onMinimize: () => void
  onSnap: (zone: SnapZone) => void
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
  onSnap,
  title,
}: TitleBarProps) {
  const [showSnap, setShowSnap] = useState(false)
  const closeTimeoutRef = useRef<number>()

  const stopControlPointerDown = (event: PointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    event.stopPropagation()
  }

  const openSnapMenu = () => {
    window.clearTimeout(closeTimeoutRef.current)
    setShowSnap(true)
  }

  const scheduleCloseSnapMenu = () => {
    window.clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = window.setTimeout(() => {
      setShowSnap(false)
    }, 180)
  }

  useEffect(() => {
    return () => {
      window.clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  return (
    <div
      className="flex h-[38px] items-center justify-between border-b border-border bg-surface px-3"
      onDoubleClick={onDoubleClick}
      onPointerDown={onDragStart}
    >
      <div className="flex items-center gap-2 text-[13px] font-medium text-textPrimary">
        <AppIcon icon={icon} size={18} />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-1 text-sm text-textSecondary" onPointerDown={stopControlPointerDown}>
        <button
          className="h-7 w-7 rounded-full hover:bg-accentYellow/20 hover:text-accentYellow"
          onClick={onMinimize}
          onPointerDown={stopControlPointerDown}
          type="button"
        >
          ─
        </button>
        <div
          className="relative"
          onMouseEnter={openSnapMenu}
          onMouseLeave={scheduleCloseSnapMenu}
          onPointerDown={stopControlPointerDown}
        >
          <button
            className="h-7 w-7 rounded-full hover:bg-accentGreen/20 hover:text-accentGreen"
            onClick={() => {
              onMaximize()
              setShowSnap(false)
            }}
            onPointerDown={stopControlPointerDown}
            type="button"
          >
            {isMaximized ? '▢' : '□'}
          </button>
          <AnimatePresence>
            {showSnap ? (
              <div onMouseEnter={openSnapMenu} onMouseLeave={scheduleCloseSnapMenu}>
                <SnapMenu
                  onMinimize={() => {
                    onMinimize()
                    setShowSnap(false)
                  }}
                  onSelect={(zone) => {
                    onSnap(zone)
                    setShowSnap(false)
                  }}
                />
              </div>
            ) : null}
          </AnimatePresence>
        </div>
        <button
          className="h-7 w-7 rounded-full hover:bg-accentRed/20 hover:text-accentRed"
          onClick={onClose}
          onPointerDown={stopControlPointerDown}
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
