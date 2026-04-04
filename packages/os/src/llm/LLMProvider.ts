export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | LLMContentBlock[]
}

export type LLMContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

export interface LLMOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export interface LLMResponse {
  content: string
  inputTokens: number
  outputTokens: number
  model: string
  latencyMs: number
}

export interface LLMProvider {
  readonly name: string
  sendMessage(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>
  sendMessageWithVision(
    messages: LLMMessage[],
    screenshotBase64: string,
    options?: LLMOptions,
  ): Promise<LLMResponse>
}
