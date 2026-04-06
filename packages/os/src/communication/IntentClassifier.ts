import { MESSAGE_INTENT, type MessageIntent } from '@maia/shared'
import type { ProviderRegistry } from '../llm/ProviderRegistry'

const TAKEOVER_PATTERNS = [
  /\blet me\b/i,
  /\bi'?ll (do|handle|take)/i,
  /\bgive me control\b/i,
  /\bmy turn\b/i,
  /\blet me log ?in\b/i,
]

const RESUME_PATTERNS = [
  /\bcontinue\b/i,
  /\bresume\b/i,
  /\byour turn\b/i,
  /\bgo ahead\b/i,
  /\bdone\b/i,
  /\bfinished\b/i,
]

const NEGATIVE_PATTERNS = [
  /\bno\b/i,
  /\bstop\b/i,
  /\bcancel\b/i,
  /\bdon'?t\b/i,
  /\babort\b/i,
]

const QUESTION_PATTERNS = [
  /\bwhy\b/i,
  /\bhow\b/i,
  /\bwhat\b/i,
  /\?$/,
]

const APPROVAL_PATTERNS = [
  /\byes\b/i,
  /\bok\b/i,
  /\bapprove\b/i,
  /\bgo ahead\b/i,
  /\bbook it\b/i,
  /\bdo it\b/i,
  /\bsure\b/i,
  /\blooks good\b/i,
  /\bsend it\b/i,
  /\bgo with\b/i,
]

const REDIRECT_PATTERNS = [
  /\bactually\b/i,
  /\binstead\b/i,
  /\bforget\b/i,
  /\bchange\b/i,
  /\bswitch to\b/i,
  /\bnot that\b/i,
  /\bdo .+ instead\b/i,
]

const CASUAL_PATTERNS = [
  /^(lol|haha|nice|cool|thanks|ty|thx|wow|😂|😄|👍|heh)$/i,
  /^(good job|well done|great|awesome)!?$/i,
]

/** Fast regex-based classification for short/simple messages. */
export function classifyIntent(text: string): MessageIntent {
  const trimmed = text.trim()

  if (CASUAL_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.CASUAL
  }

  if (TAKEOVER_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.TAKEOVER
  }

  if (RESUME_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.HANDOFF
  }

  if (REDIRECT_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.REDIRECT
  }

  if (NEGATIVE_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.INSTRUCTION
  }

  if (QUESTION_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.QUESTION
  }

  if (APPROVAL_PATTERNS.some((p) => p.test(trimmed))) {
    return MESSAGE_INTENT.AGREEMENT
  }

  return MESSAGE_INTENT.INSTRUCTION
}

/** LLM-backed classification for complex messages. */
export async function classifyIntentWithLLM(text: string, llm: ProviderRegistry): Promise<MessageIntent> {
  // Short messages: regex is enough
  if (text.split(' ').length <= 6) {
    return classifyIntent(text)
  }

  try {
    const response = await llm.sendMessage([
      {
        role: 'system',
        content: `Classify this user message into exactly one intent. Respond with ONLY the intent name.

Intents:
- question: asking something ("why did you pick that?", "how much is it?")
- instruction: telling the agent to do something ("book the flight", "use economy")
- context: sharing new info the agents don't have ("Mark is already in Tokyo")
- redirect: changing the plan ("actually do Seoul instead", "forget the email")
- agreement: approving something ("yes", "looks good", "send it")
- challenge: pushing back ("that seems expensive", "are you sure?")
- takeover: user wants to do it themselves ("let me handle the email")
- handoff: user is done, agents can resume ("ok your turn", "I'm done")
- casual: social/informal ("lol", "nice find", "haha that's a long flight")`,
      },
      { role: 'user', content: text },
    ], { model: 'gpt-4o-mini', maxTokens: 16, temperature: 0.1 })

    const intent = response.content.trim().toLowerCase()
    const intentMap: Record<string, MessageIntent> = {
      question: MESSAGE_INTENT.QUESTION,
      instruction: MESSAGE_INTENT.INSTRUCTION,
      context: MESSAGE_INTENT.CONTEXT,
      redirect: MESSAGE_INTENT.REDIRECT,
      agreement: MESSAGE_INTENT.AGREEMENT,
      challenge: MESSAGE_INTENT.CHALLENGE,
      takeover: MESSAGE_INTENT.TAKEOVER,
      handoff: MESSAGE_INTENT.HANDOFF,
      casual: MESSAGE_INTENT.CASUAL,
    }

    return intentMap[intent] ?? classifyIntent(text)
  } catch {
    return classifyIntent(text)
  }
}

export function isTakeoverRequest(text: string): boolean {
  return TAKEOVER_PATTERNS.some((p) => p.test(text.trim()))
}

export function isResumeRequest(text: string): boolean {
  return RESUME_PATTERNS.some((p) => p.test(text.trim()))
}
