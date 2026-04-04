import { pino } from 'pino'

const logger = pino({ name: 'verified-registry' })

export interface VerifiedDataEntry {
  dataId: string
  value: string
  sourceUrl: string
  screenshotId: string
  timestamp: number
  taskId: string
  stepIndex: number
}

export class VerifiedRegistry {
  private readonly entries: VerifiedDataEntry[] = []

  register(entry: VerifiedDataEntry): void {
    this.entries.push(entry)
    logger.debug({ dataId: entry.dataId, source: entry.sourceUrl }, 'Data verified')
  }

  getByTask(taskId: string): VerifiedDataEntry[] {
    return this.entries.filter((e) => e.taskId === taskId)
  }

  getByValue(value: string): VerifiedDataEntry | undefined {
    return this.entries.find((e) => e.value === value)
  }

  getAll(): VerifiedDataEntry[] {
    return [...this.entries]
  }

  toJSON(): VerifiedDataEntry[] {
    return this.entries
  }
}
