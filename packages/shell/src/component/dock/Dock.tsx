import { useState } from 'react'

import type { DockItem } from '../../shellItems'

import { DockDivider } from './DockDivider'
import { DockIcon } from './DockIcon'

interface DockProps {
  badges: Record<string, number>
  isVisible: boolean
  itemsLeft: DockItem[]
  itemsRight: DockItem[]
  onOpenItem: (itemId: string) => void
  onPointerEnter: () => void
  onPointerLeave: () => void
  onTogglePin: (itemId: string) => void
  pinnedIds: string[]
  runningIds: string[]
}

export function Dock({
  badges,
  isVisible,
  itemsLeft,
  itemsRight,
  onOpenItem,
  onPointerEnter,
  onPointerLeave,
  onTogglePin,
  pinnedIds,
  runningIds,
}: DockProps) {
  const [hovered, setHovered] = useState(false)
  const show = isVisible || hovered

  return (
    <>
      {/* Invisible hover trigger zone at the bottom of the screen */}
      <div
        onMouseEnter={() => {
          setHovered(true)
          onPointerEnter()
        }}
        className="fixed inset-x-0 bottom-0 z-[60] h-3 bg-transparent"
      />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center"
      >
        <div
          onMouseEnter={() => {
            setHovered(true)
            onPointerEnter()
          }}
          onMouseLeave={() => {
            setHovered(false)
            onPointerLeave()
          }}
          className="pointer-events-auto flex items-center gap-0 rounded-t-2xl border border-[#222222] border-b-0 bg-[rgba(17,17,17,0.9)] px-3 py-2 shadow-[-0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-[20px] transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${show ? 0 : 100}px)` }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            {itemsLeft.map((item) => (
              <DockIcon
                key={item.id}
                badgeCount={badges[item.id]}
                icon={item.icon}
                isPinned={pinnedIds.includes(item.id)}
                isRunning={runningIds.includes(item.id)}
                label={item.label}
                onClick={() => {
                  onOpenItem(item.id)
                }}
                onContextMenu={() => {
                  onTogglePin(item.id)
                }}
              />
            ))}
          </div>
          <DockDivider />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            {itemsRight.map((item) => (
              <DockIcon
                key={item.id}
                badgeCount={badges[item.id]}
                icon={item.icon}
                isPinned={pinnedIds.includes(item.id)}
                isRunning={runningIds.includes(item.id)}
                label={item.label}
                onClick={() => {
                  onOpenItem(item.id)
                }}
                onContextMenu={() => {
                  onTogglePin(item.id)
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
