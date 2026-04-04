import sharp from 'sharp'
import { pino } from 'pino'
import type { WebContainerAPI } from '../app/WebContainer'
import type { ProviderRegistry } from '../llm/ProviderRegistry'

const logger = pino({ name: 'vision-brain' })

/**
 * VisionBrain is the fallback — takes screenshots and sends to LLM vision.
 * Used for < 5% of actions: CAPTCHAs, complex visuals, verification.
 */
export class VisionBrain {
  private readonly containers: WebContainerAPI
  private readonly llm: ProviderRegistry

  constructor(containers: WebContainerAPI, llm: ProviderRegistry) {
    this.containers = containers
    this.llm = llm
  }

  async captureScreenshot(appId: string): Promise<string> {
    try {
      const buffer = await this.containers.captureScreenshot(appId)
      const resized = await sharp(buffer)
        .resize(1024, undefined, { fit: 'inside' })
        .png({ compressionLevel: 6 })
        .toBuffer()
      return resized.toString('base64')
    } catch (error) {
      logger.error({ appId, error }, 'Screenshot failed')
      return ''
    }
  }

  async describeScreen(appId: string): Promise<string> {
    const screenshot = await this.captureScreenshot(appId)
    if (!screenshot) return 'Failed to capture screenshot.'

    const response = await this.llm.sendMessageWithVision(
      [
        { role: 'system', content: 'Describe what you see on this screen. List any interactive elements (buttons, inputs, links) with their approximate positions.' },
        { role: 'user', content: 'What is on this screen?' },
      ],
      screenshot,
      { maxTokens: 512 },
    )

    return response.content
  }
}
