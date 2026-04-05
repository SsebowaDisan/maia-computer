import type { Space } from '@maia/shared'

interface SpaceTabProps {
  isActive: boolean
  onClick: () => void
  space: Space
}

export function SpaceTab({ isActive, onClick, space }: SpaceTabProps) {
  return (
    <button
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm transition [-webkit-app-region:no-drag] ${
        isActive ? 'text-white' : 'text-textSecondary hover:text-white'
      }`}
      onClick={onClick}
    >
      <span>{isActive ? '●' : '○'}</span>
      <span className={isActive ? 'font-medium' : ''}>{space.name}</span>
    </button>
  )
}
