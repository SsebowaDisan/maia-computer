import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload script — exposes window.electronAPI to the renderer process.
 * This is the bridge between the frontend shell and the backend OS core.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, payload: unknown) => {
    return ipcRenderer.invoke(channel, payload)
  },

  on: (channel: string, listener: (event: unknown, payload: unknown) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      listener(_event, args[0])
    }

    ipcRenderer.on(channel, subscription)

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
})
