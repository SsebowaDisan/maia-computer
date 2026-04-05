import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { useWindowInteractions } from '../../hook/useWindowInteractions'
import { type ShellWindow } from '../../store/windowStore'
import { RESIZE_HANDLES } from '../../windowInteraction'
import { CommandBar } from './CommandBar'
import { SnapPreview } from './SnapPreview'
import { TitleBar } from './TitleBar'

interface AppWindowProps {
  children?: ReactNode
  onClose: () => void
  onCommand: (command: string) => void
  onFocus: () => void
  onMinimize: () => void
  onSnap: (zone: ShellWindow['snapZone']) => void
  onToggleMaximize: () => void
  onUpdateBounds: (bounds: ShellWindow['bounds']) => void
  window: ShellWindow
}

export function AppWindow({
  children,
  onClose,
  onCommand,
  onFocus,
  onMinimize,
  onSnap,
  onToggleMaximize,
  onUpdateBounds,
  window: shellWindow,
}: AppWindowProps) {
  const { snapPreview, startDrag, startResize } = useWindowInteractions({
    onFocus,
    onSnap,
    onUpdateBounds,
    shellWindow,
  })

  return (
    <>
      {snapPreview ? <SnapPreview bounds={snapPreview} /> : null}
      <motion.div
        animate={{
          height: shellWindow.bounds.height,
          left: shellWindow.bounds.x,
          top: shellWindow.bounds.y,
          width: shellWindow.bounds.width,
        }}
        className={`fixed overflow-hidden border border-border bg-chrome shadow-window ${shellWindow.isMinimized ? 'hidden' : ''}`}
        initial={false}
        onMouseDown={onFocus}
        style={{
          borderRadius: '8px 8px 0 0',
          zIndex: shellWindow.zIndex,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <TitleBar
          icon={shellWindow.icon}
          isMaximized={shellWindow.isMaximized}
          onClose={onClose}
          onDoubleClick={onToggleMaximize}
          onDragStart={startDrag}
          onMaximize={onToggleMaximize}
          onMinimize={onMinimize}
          onSnap={onSnap}
          title={shellWindow.title}
        />
        <div className={`bg-[#090b10] ${shellWindow.kind === 'app' ? 'h-[calc(100%-82px)]' : 'h-[calc(100%-38px)]'}`}>
          {children}
        </div>
        {shellWindow.kind === 'app' ? <CommandBar onSubmit={onCommand} /> : null}
        {RESIZE_HANDLES.map((handle) => (
          <div
            key={handle.direction}
            className={`absolute ${handle.className}`}
            onPointerDown={(event) => {
              startResize(handle.direction, event)
            }}
          />
        ))}
      </motion.div>
    </>
  )
}
