import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import type { EventBus } from '../events/EventBus'
import type { MessageBus } from '../communication/MessageBus'
import type { AppManifest } from '@maia/shared'
import type { AppAgent } from './AppAgent'
import { ChromeAgent } from './ChromeAgent'
import { DocsAgent } from './DocsAgent'
import { GenericAgent } from './GenericAgent'
import { pino } from 'pino'

const logger = pino({ name: 'agent-factory' })

interface AgentConfig {
  intelligence: IntelligenceRouter
  llm: ProviderRegistry
  eventBus: EventBus
  appId: string
  taskId: string
  agentId: string
  messageBus?: MessageBus
  manifest?: AppManifest
}

export function createAppAgent(appUrl: string, config: AgentConfig): AppAgent {
  const url = appUrl.toLowerCase()

  // Google Search / Web Browser
  if (url.includes('google.com/webhp') || url.includes('google.com/search') || url === 'https://www.google.com' || url.includes('google.com/?')) {
    logger.info({ appUrl }, 'Creating ChromeAgent')
    const agent = new ChromeAgent(config)
    // Pass manifest navigation data for workflow execution
    if (config.manifest?.navigation) {
      agent.setManifest(config.manifest.navigation)
    }
    return agent
  }

  // Google Docs
  if (url.includes('docs.google.com')) {
    logger.info({ appUrl }, 'Creating DocsAgent')
    return new DocsAgent(config)
  }

  // Fallback
  logger.info({ appUrl }, 'Creating GenericAgent')
  return new GenericAgent(config)
}
