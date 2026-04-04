import type { AppBounds } from '@maia/shared'

interface SnapPreviewProps {
  bounds: AppBounds
}

export function SnapPreview({ bounds }: SnapPreviewProps) {
  return (
    <div
      className="pointer-events-none fixed rounded-t-lg border-4 border-accentBlue bg-accentBlue/5 shadow-[0_0_0_4px_rgba(59,130,246,0.35)]"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
      }}
    />
  )
}
