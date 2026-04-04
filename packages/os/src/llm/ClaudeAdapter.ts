import Anthropic from '@anthropic-ai/sdk'
import { pino } from 'pino'
import type { LLMProvider, LLMMessage, LLMOptions, LLMResponse, LLMContentBlock } from './LLMProvider'

const logger = pino({ name: 'claude-adapter' })

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const DEFAULT_MAX_TOKENS = 1024
const DEFAULT_TEMPERATURE = 0.3

export class ClaudeAdapter implements LLMProvider {
  readonly name = 'claude'
  private readonly client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env.MAIA_ANTHROPIC_API_KEY,
    })
  }

  async sendMessage(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const startTime = Date.now()
    const model = options?.model ?? DEFAULT_MODEL
    const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS
    const temperature = options?.temperature ?? DEFAULT_TEMPERATURE

    const { systemMessage, userMessages } = this.splitMessages(messages)

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages: userMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : this.toAnthropicContent(m.content),
      })),
    })

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
      latencyMs: Date.now() - startTime,
    }
  }

  async sendMessageWithVision(
    messages: LLMMessage[],
    screenshotBase64: string,
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    // Append the screenshot as an image block to the last user message
    const augmentedMessages = [...messages]
    const lastMessage = augmentedMessages[augmentedMessages.length - 1]

    if (lastMessage && lastMessage.role === 'user') {
      const existingContent: LLMContentBlock[] = typeof lastMessage.content === 'string'
        ? [{ type: 'text', text: lastMessage.content }]
        : [...lastMessage.content]

      existingContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: screenshotBase64,
        },
      })

      augmentedMessages[augmentedMessages.length - 1] = {
        ...lastMessage,
        content: existingContent,
      }
    }

    return this.sendMessage(augmentedMessages, options)
  }

  private splitMessages(messages: LLMMessage[]): {
    systemMessage: string
    userMessages: LLMMessage[]
  } {
    const systemParts: string[] = []
    const userMessages: LLMMessage[] = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemParts.push(typeof msg.content === 'string' ? msg.content : '')
      } else {
        userMessages.push(msg)
      }
    }

    return {
      systemMessage: systemParts.join('\n\n'),
      userMessages,
    }
  }

  private toAnthropicContent(blocks: LLMContentBlock[]): Anthropic.ContentBlockParam[] {
    return blocks.map((block) => {
      if (block.type === 'text') {
        return { type: 'text' as const, text: block.text }
      }
      return {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: block.source.media_type as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
          data: block.source.data,
        },
      }
    })
  }
}
