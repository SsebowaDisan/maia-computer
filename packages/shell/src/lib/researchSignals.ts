import type { ChatMessage } from '@maia/shared'

export type ResearchConfidence = 'low' | 'medium' | 'high'

export interface ComparisonItem {
  description: string
  detail: string
  emoji: string
  meta: string[]
  name: string
  notes: string[]
  price: string
  rating?: string
  winner: boolean
}

export interface ComparisonGroupData {
  confidence: ResearchConfidence
  intro: string
  items: ComparisonItem[]
}

export interface ResearchSnapshot {
  activity: string
  confidence: ResearchConfidence
  confidenceLabel: string
  findings: string[]
  findingsCount: number
  pagesVisited: number
  sourceCount: number
}

const DOMAIN_RE = /\b(?:www\.)?([a-z0-9-]+\.(?:com|org|net|co|io|ai|dev|app))\b/gi
const EXPLICIT_COUNT_RE = /\bchecked\s+(\d+)\s+(?:sites?|sources?)\b/i
const PRICE_RE = /([€$£]\s?\d[\d.,]*(?:\/(?:night|day|month|yr|year))?)/i
const RATING_RE = /\b(\d+(?:\.\d+)?)\s*(?:\/\s*10|rating|on booking|stars?)\b/i
const COMPARISON_HEADER_RE = /^\s*([\u{1F300}-\u{1FAFF}\u2600-\u27BF])\s+(.+?)\s+[—-]\s+(.+)$/u
const FINDING_LINE_RE = /\b([A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,4})\s*[—-]\s*([€$£]\s?\d[\d.,]*)/g

export function emptyResearchSnapshot(): ResearchSnapshot {
  return {
    activity: '',
    confidence: 'low',
    confidenceLabel: 'just started',
    findings: [],
    findingsCount: 0,
    pagesVisited: 0,
    sourceCount: 0,
  }
}

export function buildResearchSnapshot(messages: ChatMessage[], thought: string): ResearchSnapshot {
  const agentMessages = messages.filter((message) => message.sender !== 'user')
  const texts = [...agentMessages.map((message) => message.message), thought].filter(Boolean)
  const comparisonItems = agentMessages.flatMap((message) => parseComparisonItems(message.message))
  const findings = dedupe([
    ...comparisonItems.map((item) => `${item.name} ${item.price}`),
    ...extractNamedFindings(texts.join('\n')),
  ]).slice(0, 4)

  const explicitCounts = texts
    .map((text) => Number(text.match(EXPLICIT_COUNT_RE)?.[1] ?? 0))
    .filter((count) => count > 0)
  const sourceMentions = extractSources(texts.join('\n'))
  const researchTimelineEvents = agentMessages.filter((message) => isResearchTimelineMessage(message.message)).length

  const sourceCount = Math.max(...explicitCounts, sourceMentions.length, comparisonItems.length > 0 ? 1 : 0, 0)
  const pagesVisited = Math.max(sourceCount, researchTimelineEvents)
  const confidence = inferConfidence(texts.join('\n'), sourceCount, findings.length)

  return {
    activity: deriveActivity(thought, agentMessages),
    confidence,
    confidenceLabel: confidenceLabel(confidence, texts.join('\n')),
    findings,
    findingsCount: findings.length,
    pagesVisited,
    sourceCount,
  }
}

export function parseComparisonGroup(text: string): ComparisonGroupData | undefined {
  const items = parseComparisonItems(text)
  if (items.length < 2) {
    return undefined
  }

  const introLines: string[] = []
  for (const line of text.split('\n')) {
    if (COMPARISON_HEADER_RE.test(line.trim())) {
      break
    }
    if (line.trim()) {
      introLines.push(line.trim())
    }
  }

  return {
    confidence: inferConfidence(text, items.length, items.length),
    intro: introLines.join(' '),
    items,
  }
}

export function inferConfidence(
  text: string,
  sourceCount = 0,
  findingCount = 0,
): ResearchConfidence {
  const normalized = text.toLowerCase()

  if (
    /high confidence|pretty confident|top pick|recommend|winner|checked \d+ (sites|sources)|here's what i found/.test(normalized)
    || sourceCount >= 3
    || findingCount >= 3
  ) {
    return 'high'
  }

  if (
    /cross-reference|cross reference|checking reviews|comparing|compare|verify|checking more|could verify/.test(normalized)
    || sourceCount >= 2
    || findingCount >= 1
  ) {
    return 'medium'
  }

  return 'low'
}

export function confidenceLabel(confidence: ResearchConfidence, text?: string): string {
  const normalized = text?.toLowerCase() ?? ''

  if (confidence === 'high') {
    if (normalized.includes('pretty confident')) return 'pretty confident'
    if (normalized.includes('high confidence')) return 'high confidence'
    return 'high confidence'
  }

  if (confidence === 'medium') {
    if (normalized.includes('checking more')) return 'checking more...'
    if (normalized.includes('cross-reference')) return 'cross-referencing'
    return 'checking more...'
  }

  if (normalized.includes('just started')) return 'just started'
  return 'just started'
}

export function isResearchTimelineMessage(text: string): boolean {
  return /searching|checking|reading|heading to|cross-reference|cross reference|compare|comparing|going back|found|reviews|prices|source/i.test(text)
}

function parseComparisonItems(text: string): ComparisonItem[] {
  const items: ComparisonItem[] = []
  let current: ComparisonItem | undefined

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    const headerMatch = line.match(COMPARISON_HEADER_RE)
    if (headerMatch) {
      if (current) {
        items.push(finalizeItem(current))
      }

      const emoji = headerMatch[1] ?? ''
      const name = headerMatch[2] ?? ''
      const trailing = headerMatch[3] ?? ''
      current = {
        description: '',
        detail: trailing.trim(),
        emoji,
        meta: [],
        name: name.trim(),
        notes: [],
        price: extractPrice(trailing.trim()),
        rating: extractRating(trailing.trim()),
        winner: emoji === '🏆' || /top pick|winner|best value/i.test(trailing),
      }
      continue
    }

    if (!current) {
      continue
    }

    const rating = extractRating(line)
    if (!current.rating && rating) {
      current.rating = rating
    }

    current.notes.push(line)
  }

  if (current) {
    items.push(finalizeItem(current))
  }

  return items
}

function finalizeItem(item: ComparisonItem): ComparisonItem {
  const meta = dedupe(
    item.notes
      .flatMap((line) => line.split(','))
      .map((part) => part.trim())
      .filter(Boolean),
  )

  const description = meta[0] ?? item.detail
  const extraMeta = meta.slice(1, 3)

  return {
    ...item,
    description,
    meta: extraMeta,
  }
}

function extractPrice(text: string): string {
  return text.match(PRICE_RE)?.[1]?.trim() ?? text.trim()
}

function extractRating(text: string): string | undefined {
  const match = text.match(RATING_RE)?.[1]
  return match ? `${match} rating` : undefined
}

function extractNamedFindings(text: string): string[] {
  return Array.from(text.matchAll(FINDING_LINE_RE)).map((match) => `${match[1]} ${match[2]}`)
}

function extractSources(text: string): string[] {
  const matches = Array.from(text.matchAll(DOMAIN_RE)).map((match) => match[1]!.replace(/^www\./, ''))
  return dedupe(matches)
}

function deriveActivity(thought: string, messages: ChatMessage[]): string {
  const normalizedThought = thought.trim()
  if (normalizedThought) {
    return normalizedThought.replace(/^working on:\s*/i, '')
  }

  const latestAgentMessage = [...messages].reverse().find((message) => message.sender !== 'user')
  return latestAgentMessage?.message ?? ''
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const normalized = value.toLowerCase()
    if (seen.has(normalized)) continue
    seen.add(normalized)
    result.push(value)
  }

  return result
}
