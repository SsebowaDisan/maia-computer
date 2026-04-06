interface AppIconProps {
  icon: string
  size?: number
}

function isImagePath(icon: string): boolean {
  return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.startsWith('./') || icon.endsWith('.svg') || icon.endsWith('.png')
}

export function AppIcon({ icon, size = 24 }: AppIconProps) {
  if (isImagePath(icon)) {
    return (
      <img
        alt=""
        className="object-contain"
        draggable={false}
        src={icon}
        style={{ width: size, height: size }}
      />
    )
  }

  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>
}
