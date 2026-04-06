import { SNAP_ZONE, type SnapZone } from '@maia/shared'

import { motion } from 'framer-motion'
import type { PointerEvent } from 'react'

interface SnapMenuProps {
  onMinimize: () => void
  onSelect: (zone: SnapZone) => void
}

interface PreviewFrameProps {
  children: React.ReactNode
}

type PreviewKind =
  | 'minimize'
  | 'maximize'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

interface MenuOption {
  id: string
  kind: PreviewKind
  label: string
  onClick: () => void
}

function PreviewFrame({ children }: PreviewFrameProps) {
  return (
    <div className="grid h-7 w-10 overflow-hidden rounded-[8px] border border-border bg-border p-px">
      {children}
    </div>
  )
}

function renderPreview(kind: PreviewKind) {
  switch (kind) {
    case 'minimize':
      return (
        <PreviewFrame>
          <div className="flex items-center justify-center rounded-[7px] bg-elevated">
            <span className="h-px w-4 rounded-full bg-textPrimary/80" />
          </div>
        </PreviewFrame>
      )
    case 'maximize':
      return (
        <PreviewFrame>
          <div className="rounded-[7px] bg-accentBlue/30" />
        </PreviewFrame>
      )
    case 'left':
      return (
        <PreviewFrame>
          <div className="grid grid-cols-2 gap-px">
            <div className="rounded-l-[7px] bg-accentBlue/30" />
            <div className="rounded-r-[7px] bg-elevated" />
          </div>
        </PreviewFrame>
      )
    case 'right':
      return (
        <PreviewFrame>
          <div className="grid grid-cols-2 gap-px">
            <div className="rounded-l-[7px] bg-elevated" />
            <div className="rounded-r-[7px] bg-accentBlue/30" />
          </div>
        </PreviewFrame>
      )
    case 'top-left':
      return (
        <PreviewFrame>
          <div className="grid grid-cols-2 grid-rows-2 gap-px">
            <div className="rounded-tl-[7px] bg-accentBlue/30" />
            <div className="rounded-tr-[7px] bg-elevated" />
            <div className="rounded-bl-[7px] bg-elevated" />
            <div className="rounded-br-[7px] bg-elevated" />
          </div>
        </PreviewFrame>
      )
    case 'top-right':
      return (
        <PreviewFrame>
          <div className="grid grid-cols-2 grid-rows-2 gap-px">
            <div className="rounded-tl-[7px] bg-elevated" />
            <div className="rounded-tr-[7px] bg-accentBlue/30" />
            <div className="rounded-bl-[7px] bg-elevated" />
            <div className="rounded-br-[7px] bg-elevated" />
          </div>
        </PreviewFrame>
      )
    case 'bottom-left':
      return (
        <PreviewFrame>
          <div className="grid grid-cols-2 grid-rows-2 gap-px">
            <div className="rounded-tl-[7px] bg-elevated" />
            <div className="rounded-tr-[7px] bg-elevated" />
            <div className="rounded-bl-[7px] bg-accentBlue/30" />
            <div className="rounded-br-[7px] bg-elevated" />
          </div>
        </PreviewFrame>
      )
    case 'bottom-right':
      return (
        <PreviewFrame>
          <div className="grid grid-cols-2 grid-rows-2 gap-px">
            <div className="rounded-tl-[7px] bg-elevated" />
            <div className="rounded-tr-[7px] bg-elevated" />
            <div className="rounded-bl-[7px] bg-elevated" />
            <div className="rounded-br-[7px] bg-accentBlue/30" />
          </div>
        </PreviewFrame>
      )
    default:
      return null
  }
}

function stopPointerPropagation(event: PointerEvent<HTMLDivElement | HTMLButtonElement>) {
  event.stopPropagation()
}

export function SnapMenu({ onMinimize, onSelect }: SnapMenuProps) {
  const options: MenuOption[] = [
    {
      id: 'minimize',
      kind: 'minimize',
      label: 'Minimize',
      onClick: onMinimize,
    },
    {
      id: SNAP_ZONE.MAXIMIZED,
      kind: 'maximize',
      label: 'Maximize',
      onClick: () => {
        onSelect(SNAP_ZONE.MAXIMIZED)
      },
    },
    {
      id: SNAP_ZONE.LEFT,
      kind: 'left',
      label: 'Left Half',
      onClick: () => {
        onSelect(SNAP_ZONE.LEFT)
      },
    },
    {
      id: SNAP_ZONE.RIGHT,
      kind: 'right',
      label: 'Right Half',
      onClick: () => {
        onSelect(SNAP_ZONE.RIGHT)
      },
    },
    {
      id: SNAP_ZONE.TOP_LEFT,
      kind: 'top-left',
      label: 'Top Left',
      onClick: () => {
        onSelect(SNAP_ZONE.TOP_LEFT)
      },
    },
    {
      id: SNAP_ZONE.TOP_RIGHT,
      kind: 'top-right',
      label: 'Top Right',
      onClick: () => {
        onSelect(SNAP_ZONE.TOP_RIGHT)
      },
    },
    {
      id: SNAP_ZONE.BOTTOM_LEFT,
      kind: 'bottom-left',
      label: 'Bottom Left',
      onClick: () => {
        onSelect(SNAP_ZONE.BOTTOM_LEFT)
      },
    },
    {
      id: SNAP_ZONE.BOTTOM_RIGHT,
      kind: 'bottom-right',
      label: 'Bottom Right',
      onClick: () => {
        onSelect(SNAP_ZONE.BOTTOM_RIGHT)
      },
    },
  ]

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-0 top-full z-30 w-[272px] pt-2"
      initial={{ opacity: 0, y: -6 }}
      onPointerDown={stopPointerPropagation}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-elevated p-2 shadow-2xl">
        {options.map((option) => (
          <button
            key={option.id}
            aria-label={option.label}
            className="flex flex-col items-center gap-2 rounded-md border border-transparent px-2 py-2 text-[11px] font-medium text-textSecondary transition-colors hover:border-border hover:bg-white/10 hover:text-textPrimary"
            onClick={option.onClick}
            onPointerDown={stopPointerPropagation}
            type="button"
          >
            {renderPreview(option.kind)}
            <span className="text-center leading-tight">{option.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
