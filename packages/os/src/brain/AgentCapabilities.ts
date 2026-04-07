import {
  AGENT_PROFILES,
  type AgentBid,
  type AgentCapability,
} from '@maia/shared'
import type { ProviderRegistry } from '../llm/ProviderRegistry'

/**
 * Capability-aware agent matching. Replaces naive keyword substring matching
 * with LLM-powered semantic matching against structured capability declarations.
 */
export async function matchAgentsToTask(
  taskDescription: string,
  availableAgentIds: string[],
  llm: ProviderRegistry,
): Promise<AgentBid[]> {
  const capabilityList = availableAgentIds
    .map((id) => {
      const profile = AGENT_PROFILES[id]
      if (!profile) return ''
      const cap = profile.capability
      return `${id}:
  role: ${profile.role}
  domains: ${cap.domains.join(', ')}
  verbs: ${cap.verbs.join(', ')}
  apps: ${cap.apps.join(', ')}
  complexity: ${cap.complexity}`
    })
    .filter(Boolean)
    .join('\n\n')

  const response = await llm.sendMessage([
    {
      role: 'system',
      content: `you are a task router. given a task and a list of specialist agents with their capabilities, score each agent's fit for the task.

agents:
${capabilityList}

respond with a json array. for EACH agent, provide:
- agentId: the agent id
- confidence: 0.0 to 1.0 (how well this agent fits the task)
- reasoning: one sentence explaining why
- estimatedComplexity: "single-step" | "multi-step" | "analytical"
- relevantApps: which apps from the agent's list are relevant

sort by confidence descending. json array only, no other text.`,
    },
    { role: 'user', content: taskDescription },
  ], { maxTokens: 512, temperature: 0.2 })

  return parseBids(response.content, availableAgentIds)
}

/** Quick capability check without LLM — used for observer triggers. */
export function hasRelevantCapability(agentId: string, text: string): boolean {
  const profile = AGENT_PROFILES[agentId]
  if (!profile) return false

  const lower = text.toLowerCase()
  const cap = profile.capability
  const domainMatch = cap.domains.some((d) => lower.includes(d))
  const verbMatch = cap.verbs.some((v) => lower.includes(v))

  return domainMatch || verbMatch
}

/** Get the capability declaration for an agent. */
export function getCapability(agentId: string): AgentCapability | undefined {
  return AGENT_PROFILES[agentId]?.capability
}

function parseBids(content: string, validAgentIds: string[]): AgentBid[] {
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return fallbackBids(validAgentIds)

  try {
    const parsed = JSON.parse(jsonMatch[0]) as AgentBid[]
    return parsed
      .filter((b) => validAgentIds.includes(b.agentId))
      .map((b) => ({
        agentId: b.agentId,
        confidence: Math.max(0, Math.min(1, b.confidence)),
        reasoning: b.reasoning ?? '',
        estimatedComplexity: b.estimatedComplexity ?? 'multi-step',
        relevantApps: b.relevantApps ?? [],
      }))
      .sort((a, b) => b.confidence - a.confidence)
  } catch {
    return fallbackBids(validAgentIds)
  }
}

function fallbackBids(agentIds: string[]): AgentBid[] {
  return agentIds.map((id) => ({
    agentId: id,
    confidence: id === 'research' ? 0.5 : 0.3,
    reasoning: 'fallback — capability matching failed',
    estimatedComplexity: 'multi-step' as const,
    relevantApps: [],
  }))
}
