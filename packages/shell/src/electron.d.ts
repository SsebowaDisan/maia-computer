import type { IPCCommands, IPCEvents, IPCResults } from '@maia/shared'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

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

  namespace JSX {
    interface IntrinsicElements {
      webview: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        allowpopups?: string
        partition?: string
        src?: string
      }
    }
  }
}

export {}
