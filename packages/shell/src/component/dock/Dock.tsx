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
      <div
        onMouseEnter={() => {
          setHovered(true)
          onPointerEnter()
        }}
        className="fixed inset-x-0 bottom-0 z-[60] h-8 bg-transparent"
      />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
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
          className={`flex items-center gap-0 rounded-[28px] border border-[#262626] bg-[rgba(12,12,12,0.78)] px-3 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-[26px] transition-[transform,opacity] duration-200 ease-out ${show ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
          style={{ transform: `translateY(${show ? 0 : 32}px)` }}
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
