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
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '12px',
          zIndex: 60,
          background: 'transparent',
        }}
      />
      {/* Dock container */}
      <div
        onMouseEnter={() => {
          setHovered(true)
          onPointerEnter()
        }}
        onMouseLeave={() => {
          setHovered(false)
          onPointerLeave()
        }}
        style={{
          position: 'fixed',
          bottom: show ? 0 : -100,
          left: '50%',
          transform: 'translateX(-50%)',
          transition: 'bottom 0.3s ease-out',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
          padding: '8px 12px',
          borderRadius: '16px 16px 0 0',
          border: '1px solid #222222',
          borderBottom: 'none',
          background: 'rgba(17, 17, 17, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.5)',
        }}
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
    </>
  )
}
