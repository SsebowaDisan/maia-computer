interface DockTooltipProps {
  label: string
}

export function DockTooltip({ label }: DockTooltipProps) {
  return (
    <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-2 py-1 text-[11px] text-textPrimary shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      {label}
    </div>
  )
}
