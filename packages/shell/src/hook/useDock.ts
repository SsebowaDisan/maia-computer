import { useCallback, useEffect, useRef, useState } from 'react'

export function useDock(autoHide: boolean) {
  const hideTimeoutRef = useRef<number>()
  const isHoveredRef = useRef(false)
  const [isVisible, setIsVisible] = useState(!autoHide)

  useEffect(() => {
    if (!autoHide) {
      setIsVisible(true)
      return
    }

    setIsVisible(false)

    const handlePointerMove = (event: MouseEvent) => {
      const nearBottom = event.clientY >= window.innerHeight - 12

      if (nearBottom) {
        window.clearTimeout(hideTimeoutRef.current)
        setIsVisible(true)
        return
      }

      if (!isHoveredRef.current) {
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
  }, [autoHide])

  const handlePointerEnter = useCallback(() => {
    window.clearTimeout(hideTimeoutRef.current)
    isHoveredRef.current = true
    setIsVisible(true)
  }, [])

  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false
    if (!autoHide) return
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false)
    }, 800)
  }, [autoHide])

  return {
    isVisible,
    handlePointerEnter,
    handlePointerLeave,
  }
}
