import { useEffect, useState } from 'react'

import { useIPC } from './useIPC'
import { useDockStore } from '../store/dockStore'

export interface ToastItem {
  id: string
  title: string
  body: string
}

export function useNotifications() {
  const { on } = useIPC()
  const setBadge = useDockStore((state) => state.setBadge)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const pushToast = (title: string, body: string) => {
      const nextToast = { id: crypto.randomUUID(), title, body }
      setToasts((currentToasts) => [...currentToasts, nextToast])
      window.setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== nextToast.id))
      }, 5000)
    }

    const unsubscribeNotification = on('app:notification', (_, payload) => {
      setBadge(payload.appId, payload.count)
    })
    const unsubscribeInstalled = on('app:installed', (_, payload) => {
      pushToast('App installed', `${payload.name} is ready in your dock.`)
    })
    const unsubscribeCompleted = on('brain:taskCompleted', (_, payload) => {
      pushToast('Task completed', payload.summary)
    })
    const unsubscribeError = on('brain:error', (_, payload) => {
      pushToast('Brain error', payload.message)
    })

    return () => {
      unsubscribeNotification()
      unsubscribeInstalled()
      unsubscribeCompleted()
      unsubscribeError()
    }
  }, [on, setBadge])

  return { toasts }
}
