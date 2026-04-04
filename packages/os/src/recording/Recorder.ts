import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pino } from 'pino'
import type { EventBus } from '../events/EventBus'
import { EventLogger } from '../events/EventLogger'
import type { MessageHistory } from '../communication/MessageHistory'
import type { PlanStep } from '@maia/shared'
import type { VerifiedRegistry } from './VerifiedRegistry'

const logger = pino({ name: 'recorder' })

export class Recorder {
  private readonly baseDir: string
  private readonly eventLogger: EventLogger
  private taskDir: string | undefined
  private screenshotCount = 0

  constructor(baseDir: string) {
    this.baseDir = baseDir
    this.eventLogger = new EventLogger(baseDir)
  }

  async startRecording(eventBus: EventBus, taskId: string): Promise<void> {
    this.taskDir = join(this.baseDir, taskId)
    await mkdir(join(this.taskDir, 'screenshot'), { recursive: true })
    await this.eventLogger.startLogging(eventBus, taskId)
    this.screenshotCount = 0
    logger.info({ taskId }, 'Recording started')
  }

  async saveScreenshot(base64Data: string): Promise<string> {
    if (!this.taskDir) throw new Error('Recording not started')

    this.screenshotCount++
    const fileName = `${String(this.screenshotCount).padStart(4, '0')}.jpg`
    const filePath = join(this.taskDir, 'screenshot', fileName)

    const buffer = Buffer.from(base64Data, 'base64')
    await writeFile(filePath, buffer)

    return fileName
  }

  async saveMessages(history: MessageHistory): Promise<void> {
    if (!this.taskDir) return
    const filePath = join(this.taskDir, 'messages.json')
    await writeFile(filePath, JSON.stringify(history.getAll(), null, 2), 'utf-8')
  }

  async savePlan(plan: PlanStep[]): Promise<void> {
    if (!this.taskDir) return
    const filePath = join(this.taskDir, 'plan.json')
    await writeFile(filePath, JSON.stringify(plan, null, 2), 'utf-8')
  }

  async saveEvidence(registry: VerifiedRegistry): Promise<void> {
    if (!this.taskDir) return
    const filePath = join(this.taskDir, 'evidence.json')
    await writeFile(filePath, JSON.stringify(registry.toJSON(), null, 2), 'utf-8')
  }

  async saveSummary(taskId: string, description: string, summary: string, cost: unknown): Promise<void> {
    if (!this.taskDir) return
    const filePath = join(this.taskDir, 'summary.json')
    await writeFile(filePath, JSON.stringify({
      taskId,
      description,
      summary,
      cost,
      completedAt: Date.now(),
      screenshotCount: this.screenshotCount,
    }, null, 2), 'utf-8')
  }

  stopRecording(): void {
    this.eventLogger.stopLogging()
    logger.info('Recording stopped')
  }
}
