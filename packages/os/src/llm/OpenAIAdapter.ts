import OpenAI from 'openai'
import { pino } from 'pino'
import type { LLMProvider, LLMMessage, LLMOptions, LLMResponse, LLMContentBlock } from './LLMProvider'

const logger = pino({ name: 'openai-adapter' })

const DEFAULT_MODEL = 'gpt-4o'
const DEFAULT_MAX_TOKENS = 1024
const DEFAULT_TEMPERATURE = 0.3

export class OpenAIAdapter implements LLMProvider {
  readonly name = 'openai'
  private readonly client: OpenAI

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey ?? process.env.MAIA_OPENAI_API_KEY,
    })
  }

  async sendMessage(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const startTime = Date.now()
    const model = options?.model ?? DEFAULT_MODEL
    const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS
    const temperature = options?.temperature ?? DEFAULT_TEMPERATURE

    const openAIMessages = messages.map((m) => this.toOpenAIMessage(m))

    const response = await this.client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: openAIMessages,
    })

    const content = response.choices[0]?.message?.content ?? ''

    return {
      content,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      model,
      latencyMs: Date.now() - startTime,
    }
  }

  async sendMessageWithVision(
    messages: LLMMessage[],
    screenshotBase64: string,
    options?: LLMOptions,
  ): Promise<LLMResponse> {
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

  private toOpenAIMessage(message: LLMMessage): OpenAI.ChatCompletionMessageParam {
    if (typeof message.content === 'string') {
      return {
        role: message.role as 'system' | 'user' | 'assistant',
        content: message.content,
      }
    }

    // Multi-modal content (text + images)
    const parts: OpenAI.ChatCompletionContentPart[] = message.content.map((block) => {
      if (block.type === 'text') {
        return { type: 'text' as const, text: block.text }
      }
      return {
        type: 'image_url' as const,
        image_url: {
          url: `data:${block.source.media_type};base64,${block.source.data}`,
          detail: 'high' as const,
        },
      }
    })

    return {
      role: message.role as 'user',
      content: parts,
    }
  }
}
