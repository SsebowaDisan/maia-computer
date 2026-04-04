import { useEffect, useRef, useState } from 'react'

export function useDock(autoHide: boolean) {
  const hideTimeoutRef = useRef<number>()
  const [isVisible, setIsVisible] = useState(!autoHide)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!autoHide) {
      setIsVisible(true)
      return
    }

    // Start hidden when autoHide is on
    setIsVisible(false)

    const handlePointerMove = (event: MouseEvent) => {
      const nearBottom = event.clientY >= window.innerHeight - 12

      if (nearBottom) {
        window.clearTimeout(hideTimeoutRef.current)
        setIsVisible(true)
        return
      }

      if (!isHovered) {
        window.clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = window.setTimeout(() => {
          setIsVisible(false)
        }, 800)
      }
    }

    window.addEventListener('mousemove', handlePointerMove)

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.clearTimeout(hideTimeoutRef.current)
    }
  }, [autoHide, isHovered])

  return {
    isVisible,
    handlePointerEnter: () => {
      window.clearTimeout(hideTimeoutRef.current)
      setIsHovered(true)
      setIsVisible(true)
    },
    handlePointerLeave: () => {
      setIsHovered(false)
      if (!autoHide) return
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false)
      }, 800)
    },
  }
}
