import { motion } from 'framer-motion'
import { useState } from 'react'

import { AppIcon } from '../ui/AppIcon'
import { DockTooltip } from './DockTooltip'

interface DockIconProps {
  badgeCount?: number
  icon: string
  isPinned: boolean
  isRunning: boolean
  label: string
  onClick: () => void
  onContextMenu: () => void
}

export function DockIcon({
  badgeCount = 0,
  icon,
  isPinned,
  isRunning,
  label,
  onClick,
  onContextMenu,
}: DockIconProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      className="relative flex flex-col items-center gap-1"
      onClick={onClick}
      onContextMenu={(event) => {
        event.preventDefault()
        onContextMenu()
      }}
      onMouseEnter={() => {
        setIsHovered(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
      }}
    >
      {isHovered ? <DockTooltip label={isPinned ? `${label} • pinned` : label} /> : null}
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-elevated text-2xl"
        transition={{ duration: 0.15, ease: 'easeOut' }}
        whileHover={{ scale: 1.15 }}
      >
        <AppIcon icon={icon} size={28} />
        {badgeCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accentRed px-1 text-[11px] font-bold text-white">
            {badgeCount}
          </span>
        ) : null}
      </motion.div>
      {isRunning ? <span className="h-1 w-1 rounded-full bg-white" /> : <span className="h-1 w-1" />}
    </button>
  )
}
