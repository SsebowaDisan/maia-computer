import { useMemo } from 'react'

import type { IPCCommands, IPCEvents, IPCResults } from '@maia/shared'

import { mockElectronAPI } from '../mock/mockElectronAPI'

function getElectronAPI() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI
  }

  return mockElectronAPI
}

const electronAPI = getElectronAPI()

export function useIPC() {
  return useMemo(() => ({
    invoke<TKey extends keyof IPCCommands>(
      channel: TKey,
      payload: IPCCommands[TKey],
    ): Promise<IPCResults[TKey]> {
      return electronAPI.invoke(channel, payload)
    },
    on<TKey extends keyof IPCEvents>(
      channel: TKey,
      listener: (event: unknown, payload: IPCEvents[TKey]) => void,
    ): () => void {
      return electronAPI.on(channel, listener)
    },
  }), [])
}
