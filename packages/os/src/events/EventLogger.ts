import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { MaiaEvent } from '@maia/shared'
import type { EventBus } from './EventBus'

export class EventLogger {
  private readonly baseDir: string
  private unsubscribe: (() => void) | undefined

  constructor(baseDir: string) {
    this.baseDir = baseDir
  }

  async startLogging(eventBus: EventBus, taskId: string): Promise<void> {
    const taskDir = join(this.baseDir, taskId)
    await mkdir(taskDir, { recursive: true })

    const logPath = join(taskDir, 'events.ndjson')

    this.unsubscribe = eventBus.subscribeAll(async (event: MaiaEvent) => {
      const line = JSON.stringify(event) + '\n'
      await appendFile(logPath, line, 'utf-8')
    })
  }

  stopLogging(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }
}
