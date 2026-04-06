import { useEffect, useRef } from 'react'

import type { InstalledApp } from '@maia/shared'

import { useIPC } from '../../hook/useIPC'

interface AppWebViewProps {
  app: InstalledApp
}

export function AppWebView({ app }: AppWebViewProps) {
  const { invoke } = useIPC()
  const webviewRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleReady = () => {
      const getWcId = (webview as unknown as Record<string, unknown>).getWebContentsId as (() => number) | undefined
      const wcId = getWcId?.()
      if (wcId) {
        void (invoke as unknown as (ch: string, p: unknown) => Promise<unknown>)(
          'app:registerWebContents',
          { appId: app.id, webContentsId: wcId },
        )
      }
    }

    webview.addEventListener('dom-ready', handleReady)
    return () => { webview.removeEventListener('dom-ready', handleReady) }
  }, [app.id, invoke])

  return (
    <webview
      ref={webviewRef as React.RefObject<never>}
      allowpopups={'true' as unknown as boolean}
      className="h-full w-full bg-[#090b10]"
      partition={`persist:${app.id}`}
      src={app.url}
    />
  )
}
