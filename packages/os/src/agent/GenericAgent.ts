import { AppAgent, type AgentTask, type AgentResult } from './AppAgent'
import { pino } from 'pino'

const logger = pino({ name: 'generic-agent' })

/**
 * GenericAgent — fallback for apps without a specialized agent.
 *
 * Has basic skills: click, type, scroll, go back.
 * Uses the LLM for all decisions since it doesn't know
 * the app's specific layout or workflows.
 *
 * Still better than the old Brain because it uses the app's
 * manifest (navigation guide + rules) for context.
 */
export class GenericAgent extends AppAgent {

  async execute(task: AgentTask): Promise<AgentResult> {
    logger.info({ task: task.description }, 'GenericAgent starting — no specialized agent for this app')
    this.chat(`working on this — using generic controls since I don't have specialized skills for this app`)

    // Fall back to the old Brain action-by-action approach
    // Import Brain dynamically to avoid circular deps
    const { Brain } = await import('../brain/Brain')

    const brain = new Brain(this.intelligence, this.eventBus, this.llm, {
      taskId: this.taskId,
      appId: this.appId,
      agentId: this.agentId,
      messageBus: this.messageBus,
    })

    const summary = await brain.run(task.description)
    return { success: true, content: summary }
  }
}
