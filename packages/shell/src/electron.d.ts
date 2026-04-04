import type { IPCCommands, IPCEvents, IPCResults } from '@maia/shared'

export interface ElectronAPI {
  invoke<TKey extends keyof IPCCommands>(
    channel: TKey,
    payload: IPCCommands[TKey],
  ): Promise<IPCResults[TKey]>
  on<TKey extends keyof IPCEvents>(
    channel: TKey,
    listener: (event: unknown, payload: IPCEvents[TKey]) => void,
  ): () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
