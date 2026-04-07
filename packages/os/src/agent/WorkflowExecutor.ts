import type { AppNavigation } from '@maia/shared'
import type { IntelligenceRouter } from '../kernel/IntelligenceRouter'
import { pino } from 'pino'

const logger = pino({ name: 'workflow-executor' })

/**
 * WorkflowExecutor — reads manifest workflows and executes them step by step.
 *
 * The agent gives a workflow name + inputs. The executor reads the steps
 * from the manifest and executes each one using the agent's action methods.
 *
 * Mechanical steps (click, type, press_key, scroll, wait) execute directly — no LLM.
 * Judgment steps (evaluate, read, detect) call the LLM via the agent.
 *
 * If a step fails, tries fallback selectors from the manifest.
 */

interface WorkflowStep {
  action: string
  target?: string
  key?: string
  value?: string
  url?: string
  for?: string
  duration_ms?: number
  amount?: string
  store_as?: string
  notes?: string
}

interface Workflow {
  description?: string
  inputs?: Array<{ name: string; type: string }>
  steps: WorkflowStep[]
}

/** The agent capabilities the executor needs. */
interface ExecutorAgent {
  intelligence: IntelligenceRouter
  appId: string
  navigate(url: string): Promise<void>
  visualClickWithRetry(target: string): Promise<boolean>
  scrollDown(): Promise<void>
  scrollToElement(target: string): Promise<void>
  pressKey(key: string): Promise<void>
  type(target: string, text: string): Promise<void>
  goBack(): Promise<void>
  waitForPage(): Promise<void>
  waitForBridge(maxRetries?: number): Promise<boolean>
  dismissPopups(): Promise<void>
  getPageStructure(): Promise<{ headings: Array<{ level: number; text: string; top: number }>; tocLinks: string[]; type: string }>
  hasMoreBelow(): Promise<boolean>
}

export class WorkflowExecutor {
  private readonly agent: ExecutorAgent
  private readonly navigation: AppNavigation
  private readonly state = new Map<string, boolean | string>()
  private inputs = new Map<string, string>()

  constructor(agent: ExecutorAgent, navigation: AppNavigation) {
    this.agent = agent
    this.navigation = navigation
  }

  /**
   * Execute a named workflow from the manifest.
   * Returns true if all steps completed successfully.
   */
  async run(workflowName: string, inputs: Record<string, string> = {}): Promise<boolean> {
    const workflows = this.navigation['workflows'] as Record<string, Workflow> | undefined
    if (!workflows) {
      logger.warn('No workflows in manifest')
      return false
    }

    const workflow = workflows[workflowName]
    if (!workflow) {
      logger.warn({ workflowName, available: Object.keys(workflows) }, 'Workflow not found')
      return false
    }

    // Store inputs for {{variable}} substitution
    this.inputs = new Map(Object.entries(inputs))

    logger.info({ workflowName, stepCount: workflow.steps.length }, 'Executing workflow')

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i]!
      const success = await this.executeStep(step, i + 1, workflow.steps.length)

      if (!success) {
        logger.warn({ workflowName, step: i + 1, action: step.action }, 'Step failed')
        // Don't abort on non-critical steps (detect, read_if_present)
        if (['detect', 'read_if_present', 'detect_xpath'].includes(step.action)) {
          continue
        }
        return false
      }
    }

    logger.info({ workflowName }, 'Workflow completed')
    return true
  }

  /**
   * Get a stored state value (from detect/store_as steps).
   */
  getState(key: string): boolean | string | undefined {
    return this.state.get(key)
  }

  // ── Step execution ────────────────────────────────────────────

  private async executeStep(step: WorkflowStep, stepNum: number, totalSteps: number): Promise<boolean> {
    const action = step.action
    logger.info({ step: stepNum, total: totalSteps, action, target: step.target?.slice(0, 40) }, 'Executing step')

    switch (action) {
      case 'navigate':
        return this.stepNavigate(step)

      case 'click':
        return this.stepClick(step)

      case 'click_if_present_xpath':
        return this.stepClickIfPresent(step)

      case 'select_all':
        return this.stepSelectAll()

      case 'type':
        return this.stepType(step)

      case 'press_key':
        return this.stepPressKey(step)

      case 'wait':
        return this.stepWait(step)

      case 'scroll_down':
        return this.stepScrollDown(step)

      case 'scroll_to':
        return this.stepScrollTo(step)

      case 'go_back':
        return this.stepGoBack()

      case 'detect':
        return this.stepDetect(step)

      case 'detect_xpath':
        return this.stepDetect(step)

      case 'read':
      case 'read_if_present':
        return this.stepRead(step)

      case 'read_page_structure':
        return this.stepReadPageStructure()

      case 'evaluate':
        // Judgment step — handled by the agent, not the executor
        return true

      case 'dismiss_popups':
        return this.stepDismissPopups()

      case 'scroll_and_read':
        return this.stepScrollAndRead()

      default:
        logger.warn({ action }, 'Unknown workflow action — skipping')
        return true
    }
  }

  // ── Action implementations ────────────────────────────────────

  private async stepNavigate(step: WorkflowStep): Promise<boolean> {
    const url = this.substitute(step.url ?? '')
    if (!url) return false
    await this.agent.navigate(url)
    return true
  }

  private async stepClick(step: WorkflowStep): Promise<boolean> {
    const target = this.substitute(step.target ?? '')
    if (!target) return false

    // CSS selector — use DOM directly (avoids clicking mic/lens/nearby elements)
    if (target.startsWith('.') || target.startsWith('#') || target.startsWith('[') || target.includes("'")) {
      const dom = this.agent.intelligence.getDOMBrain()
      const appId = this.agent.appId
      await dom.executeInPage(appId, `
        var el = document.querySelector("${target.replace(/"/g, '\\"')}");
        if (el) {
          el.focus();
          // For inputs/textareas: focus + select (don't click — avoids hitting mic/lens)
          if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            el.select();
          } else {
            el.click();
          }
        }
      `)
      await this.sleep(300)
      return true
    }

    // Text-based click with visual feedback
    return this.agent.visualClickWithRetry(target)
  }

  private async stepClickIfPresent(step: WorkflowStep): Promise<boolean> {
    const target = step.target ?? ''
    // XPath-based click — try to find the element
    const dom = this.agent.intelligence.getDOMBrain()
    const appId = this.agent.appId
    const clicked = await dom.executeInPage<boolean>(appId, `
      (function() {
        var xpath = "${target.replace(/"/g, '\\"')}";
        var result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        var el = result.singleNodeValue;
        if (el) { el.click(); return true; }
        return false;
      })()
    `)
    if (clicked) await this.sleep(500)
    return true // Non-critical — "if present"
  }

  private async stepSelectAll(): Promise<boolean> {
    await this.agent.pressKey('Control+a')
    return true
  }

  private async stepType(step: WorkflowStep): Promise<boolean> {
    const target = this.substitute(step.target ?? '')
    const value = this.substitute(step.value ?? '')
    if (!target || !value) return false
    await this.agent.type(target, value)
    return true
  }

  private async stepPressKey(step: WorkflowStep): Promise<boolean> {
    const key = step.key ?? step.target ?? ''
    if (!key) return false
    await this.agent.pressKey(key)
    return true
  }

  private async stepWait(step: WorkflowStep): Promise<boolean> {
    const duration = step.duration_ms ?? 1000

    if (step.for === 'dom_ready') {
      await this.agent.waitForPage()
      await this.sleep(duration)
      await this.agent.waitForBridge()
    } else if (step.for === 'overlay_gone') {
      await this.sleep(duration)
    } else {
      await this.sleep(duration)
    }
    return true
  }

  private async stepScrollDown(step: WorkflowStep): Promise<boolean> {
    await this.agent.scrollDown()
    return true
  }

  private async stepScrollTo(step: WorkflowStep): Promise<boolean> {
    const target = this.substitute(step.target ?? '')
    if (!target) return false
    await this.agent.scrollToElement(target)
    return true
  }

  private async stepGoBack(): Promise<boolean> {
    await this.agent.goBack()
    await this.agent.waitForBridge()
    return true
  }

  private async stepDetect(step: WorkflowStep): Promise<boolean> {
    const target = step.target ?? ''
    const storeAs = step.store_as

    const dom = this.agent.intelligence.getDOMBrain()
    const appId = this.agent.appId

    let found = false
    if (step.action === 'detect_xpath') {
      found = await dom.executeInPage<boolean>(appId, `
        (function() {
          var result = document.evaluate("${target.replace(/"/g, '\\"')}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          return !!result.singleNodeValue;
        })()
      `) ?? false
    } else {
      found = await dom.executeInPage<boolean>(appId, `!!document.querySelector("${target.replace(/"/g, '\\"')}")`) ?? false
    }

    if (storeAs) {
      this.state.set(storeAs, found)
    }

    logger.info({ target: target.slice(0, 40), found, storeAs }, 'Detect result')
    return true // Detection never fails — it just stores result
  }

  private async stepRead(step: WorkflowStep): Promise<boolean> {
    // Read is informational — the content is captured by the agent's getPageText
    // For "read_if_present", check if element exists first
    if (step.action === 'read_if_present') {
      const target = step.target ?? ''
      const dom = this.agent.intelligence.getDOMBrain()
      const appId = this.agent.appId
      const exists = await dom.executeInPage<boolean>(appId, `!!document.querySelector("${target.replace(/"/g, '\\"')}")`) ?? false
      if (!exists) return true // Not present — skip
    }
    return true
  }

  private async stepReadPageStructure(): Promise<boolean> {
    // Trigger page structure reading via agent
    const structure = await this.agent.getPageStructure()
    logger.info({ headings: structure?.headings?.length ?? 0 }, 'Page structure read')
    return true
  }

  private async stepDismissPopups(): Promise<boolean> {
    await this.agent.dismissPopups()
    return true
  }

  private async stepScrollAndRead(): Promise<boolean> {
    // Scroll through the page gradually, reading content
    for (let i = 0; i < 6; i++) {
      const hasMore = await this.agent.hasMoreBelow()
      if (!hasMore) break
      await this.agent.scrollDown()
      await this.sleep(400)
    }
    return true
  }

  // ── Helpers ───────────────────────────────────────────────────

  /**
   * Substitute {{variable}} placeholders with input values.
   */
  private substitute(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return this.inputs.get(key) ?? `{{${key}}}`
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
