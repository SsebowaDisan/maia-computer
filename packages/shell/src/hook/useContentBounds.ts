import { useEffect } from 'react'

import type { AppBounds } from '@maia/shared'

interface UseContentBoundsOptions {
  contentElement: HTMLDivElement | null
  enabled: boolean
  onReportContentBounds: (bounds: AppBounds) => void
}

export function useContentBounds({
  contentElement,
  enabled,
  onReportContentBounds,
}: UseContentBoundsOptions) {
  useEffect(() => {
    if (!enabled || !contentElement) {
      return
    }

    const reportBounds = () => {
      const rect = contentElement.getBoundingClientRect()
      onReportContentBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      })
    }

    reportBounds()
    const observer = new ResizeObserver(reportBounds)
    observer.observe(contentElement)

    return () => {
      observer.disconnect()
    }
  }, [contentElement, enabled, onReportContentBounds])
}
