import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import type { EventBus } from '../events/EventBus'
import type { MessageBus } from '../communication/MessageBus'
import type { WorkspaceRegistry } from '../app/WorkspaceRegistry'
import type { InstalledApp, AppManifest, AppNavigation } from '@maia/shared'
import { AGENT_PROFILES } from '@maia/shared'
import { createAppAgent } from './AgentFactory'
import type { AppAgent, AgentResult } from './AppAgent'
import { buildPersonalityPrompt } from '../brain/AgentPersonality'
import { pino } from 'pino'

const logger = pino({ name: 'research-lead' })

/**
 * ResearchLead — the team lead for research tasks.
 *
 * The Research Agent doesn't search Google itself.
 * It breaks the topic into sub-topics, assigns ChromeAgent to search each one,
 * reviews findings as they come in, and coordinates with other specialist agents.
 *
 * Flow:
 *   User: "research Uganda"
 *   ResearchLead:
 *     1. Breaks into sub-topics (geography, population, economy, etc.)
 *     2. Assigns ChromeAgent to search each sub-topic
 *     3. Reviews findings — asks for more depth if needed
 *     4. Asks Analyst to verify numbers, Budget to check costs, Policy for compliance
 *     5. Synthesizes all findings into final answer
 *     6. Hands off to DocsAgent if a report is needed
 */
export class ResearchLead {
  private readonly intelligence: IntelligenceRouter
  private readonly llm: ProviderRegistry
  private readonly eventBus: EventBus
  private readonly messageBus: MessageBus
  private readonly workspaces: WorkspaceRegistry
  private readonly installedApps: () => InstalledApp[]
  private readonly appManifests: AppManifest[]
  private readonly taskId: string

  constructor(config: {
    intelligence: IntelligenceRouter
    llm: ProviderRegistry
    eventBus: EventBus
    messageBus: MessageBus
    workspaces: WorkspaceRegistry
    installedApps: () => InstalledApp[]
    appManifests: AppManifest[]
    taskId: string
  }) {
    this.intelligence = config.intelligence
    this.llm = config.llm
    this.eventBus = config.eventBus
    this.messageBus = config.messageBus
    this.workspaces = config.workspaces
    this.installedApps = config.installedApps
    this.appManifests = config.appManifests
    this.taskId = config.taskId
  }

  /**
   * Lead the research — break topic into sub-topics, coordinate agents, synthesize.
   */
  async lead(task: string, browserAppId: string): Promise<AgentResult> {
    logger.info({ task }, 'ResearchLead starting')
    this.chat('research', 'let me figure out what we need to cover')

    // Step 1: Break the topic into sub-topics
    const subTopics = await this.decomposeIntoSubTopics(task)
    this.chat('research', `here's the plan — ${subTopics.length} areas to cover: ${subTopics.join(', ')}`)

    // Step 2: Wait for browser workspace
    const workspace = await this.workspaces.waitForReady(browserAppId, 15_000)
    if (!workspace) {
      this.chat('research', 'browser isn\'t ready — can\'t start research')
      return { success: false, error: 'browser not ready' }
    }

    // Step 3: Create ChromeAgent and give it the sub-topics
    const browserApp = this.installedApps().find((a) => a.id === browserAppId)
    const manifest = browserApp ? this.appManifests.find((m) => m.id === browserApp.manifestId) : undefined

    const chromeAgent = createAppAgent(workspace.appUrl, {
      intelligence: this.intelligence,
      llm: this.llm,
      eventBus: this.eventBus,
      appId: browserAppId,
      taskId: this.taskId,
      agentId: 'research',
      messageBus: this.messageBus,
      manifest,
    })

    const result = await chromeAgent.execute({
      description: task,
      context: `SUB_TOPICS:\n${subTopics.map((t) => `- ${t}`).join('\n')}`,
    })

    // Step 4: Review findings — are they sufficient?
    if (result.success && result.findings) {
      const review = await this.reviewFindings(task, result.findings, subTopics)

      if (!review.sufficient) {
        // Ask ChromeAgent to fill gaps
        this.chat('research', `need more on: ${review.gaps.join(', ')}`)

        const gapResult = await chromeAgent.execute({
          description: `find more information about: ${review.gaps.join(', ')}`,
          context: `SUB_TOPICS:\n${review.gaps.map((g) => `- ${g}`).join('\n')}`,
        })

        if (gapResult.content) {
          result.content = (result.content ?? '') + '\n\n' + gapResult.content
          result.findings = (result.findings ?? '') + '\n\n' + (gapResult.findings ?? '')
        }
      }
    }

    // Step 5: Ask other specialist agents for input
    await this.consultSpecialists(task, result.content ?? result.findings ?? '')

    logger.info({ success: result.success }, 'ResearchLead complete')
    return result
  }

  /**
   * Break a topic into specific, searchable sub-topics.
   */
  private async decomposeIntoSubTopics(task: string): Promise<string[]> {
    const response = await this.llm.sendMessage([
      {
        role: 'system',
        content: `you are a research team lead planning a research task.
break this topic into 4-6 specific sub-topics that can each be searched on Google.
each sub-topic should be specific enough for one focused search.

respond with JSON: {"topics": ["sub-topic 1", "sub-topic 2", ...]}

examples:
- "research Uganda" → ["Uganda geography and location", "Uganda population and demographics", "Uganda government and politics", "Uganda economy and GDP", "Uganda culture and languages", "Uganda current events 2026"]
- "research machine learning" → ["what is machine learning definition", "types of machine learning supervised unsupervised", "machine learning applications real world", "machine learning vs AI differences", "machine learning recent breakthroughs 2026"]`,
      },
      { role: 'user', content: task },
    ], { maxTokens: 256, temperature: 0.3 })

    const parsed = this.parseJSON<{ topics: string[] }>(response.content)
    return parsed?.topics ?? [task]
  }

  /**
   * Review findings — check if all sub-topics are covered.
   */
  private async reviewFindings(
    task: string,
    findings: string,
    subTopics: string[],
  ): Promise<{ sufficient: boolean; gaps: string[] }> {
    const response = await this.llm.sendMessage([
      {
        role: 'system',
        content: `you are reviewing research findings. check if all planned sub-topics are covered.
respond with JSON:
{
  "sufficient": true/false,
  "gaps": ["sub-topics that need more research"],
  "reasoning": "what's missing"
}`,
      },
      {
        role: 'user',
        content: `task: ${task}\nsub-topics planned: ${subTopics.join(', ')}\n\nfindings:\n${findings.slice(0, 3000)}`,
      },
    ], { maxTokens: 128, temperature: 0.3 })

    const parsed = this.parseJSON<{ sufficient: boolean; gaps: string[] }>(response.content)
    return parsed ?? { sufficient: true, gaps: [] }
  }

  /**
   * Ask other specialist agents if they have input on the findings.
   * Budget might notice costs, Policy might flag compliance, Analyst might spot data issues.
   */
  private async consultSpecialists(task: string, findings: string): Promise<void> {
    if (findings.length < 100) return

    const specialists = ['analyst', 'budget', 'policy']

    for (const specialistId of specialists) {
      const profile = AGENT_PROFILES[specialistId]
      if (!profile) continue

      const personality = buildPersonalityPrompt(specialistId)
      const shouldSpeak = profile.expertise.some((e) =>
        findings.toLowerCase().includes(e.toLowerCase()),
      )

      if (!shouldSpeak) continue

      try {
        const response = await this.llm.sendMessage([
          { role: 'system', content: personality },
          {
            role: 'user',
            content: `your teammate just researched "${task}". review their findings and comment if you notice anything relevant to your expertise. if nothing relevant, respond with exactly "SKIP".

findings:\n${findings.slice(0, 2000)}`,
          },
        ], { model: 'gpt-4o-mini', maxTokens: 200, temperature: 0.5 })

        const text = response.content.trim()
        if (text !== 'SKIP' && text.length > 10) {
          this.chat(specialistId, text)
        }
      } catch {
        // Non-critical — specialist couldn't contribute
      }
    }
  }

  private chat(agentId: string, message: string): void {
    this.messageBus.send({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender: agentId,
      receiver: 'all',
      intent: 'update' as const,
      message,
      context: { taskId: this.taskId },
      timestamp: Date.now(),
    })
  }

  private parseJSON<T>(content: string): T | undefined {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return undefined
    try { return JSON.parse(match[0]) as T } catch { return undefined }
  }
}
