import { AppAgent, type AgentTask, type AgentResult } from './AppAgent'
import { WorkflowExecutor } from './WorkflowExecutor'
import type { AppNavigation } from '@maia/shared'
import { pino } from 'pino'

const logger = pino({ name: 'chrome-agent' })

/**
 * ChromeAgent — Google Search specialist.
 *
 * MANIFEST-DRIVEN: Reads chrome.yml workflows and executes step by step.
 * No hardcoded click sequences. The manifest defines HOW to use Google.
 * The LLM decides WHAT to search and WHICH result to click.
 */
export class ChromeAgent extends AppAgent {
  private visitedDomains = new Set<string>()
  private sourcesVisited = 0
  private executor!: WorkflowExecutor
  private factsCollected: string[] = []

  /** Set the manifest navigation data. Called by AgentFactory or Orchestrator. */
  setManifest(navigation: AppNavigation): void {
    this.executor = new WorkflowExecutor(this as any, navigation)
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    this.research = new (await import('../brain/ResearchMemory')).ResearchMemory(task.description)
    logger.info({ task: task.description }, 'ChromeAgent starting')

    // Ensure we have a manifest
    if (!this.executor) {
      logger.warn('No manifest loaded — using fallback search')
      return { success: false, error: 'no manifest' }
    }

    const bridgeReady = await this.waitForBridge()
    if (!bridgeReady) {
      this.chat('browser isn\'t responding')
      return { success: false, error: 'bridge not ready' }
    }

    this.chat('on it, let me dig into this')

    // Parse sub-topics from context or generate them
    const subTopics = task.context?.includes('SUB_TOPICS:')
      ? task.context.split('SUB_TOPICS:')[1]!.split('\n').filter((t) => t.trim()).map((t) => t.trim().replace(/^- /, ''))
      : await this.generateSubTopics(task.description)

    logger.info({ subTopics }, 'Research sub-topics')

    // Handle EU consent / cookie banners before starting
    await this.executor.run('handle_eu_consent_if_present')
    await this.dismissPopups()
    await this.sleep(500)

    // Also try clicking "Accept all" directly — catches banners the workflow missed
    const dom = this.intelligence.getDOMBrain()
    await dom.executeInPage(this.appId, `
      var buttons = document.querySelectorAll('button, [role="button"], a');
      for (var i = 0; i < buttons.length; i++) {
        var t = (buttons[i].textContent || '').trim().toLowerCase();
        if (t === 'accept all' || t === 'accept' || t === 'i agree' || t === 'agree' || t === 'allow all' || t === 'tout accepter' || t === 'alles accepteren') {
          buttons[i].click();
          break;
        }
      }
    `)
    await this.sleep(500)

    // Research each sub-topic
    for (const topic of subTopics) {
      if (!this.running) break

      try {
        const query = await this.generateSearchQuery(topic)

        // Execute search workflow from manifest
        const searched = await this.executor.run('basic_search', { query })
        if (!searched) continue

        // Wait for bridge after navigation
        await this.waitForBridge()
        await this.sleep(500)

        // Dismiss popups
        await this.dismissPopups()

        // Scroll down to see results
        await this.scrollDown()
        await this.sleep(500)

        // Extract facts from search page (snippets, knowledge panel)
        await this.extractFromSearchPage(topic)

        // Pick and visit 1-2 results per sub-topic
        for (let i = 0; i < 2; i++) {
          if (!this.running) break
          const visited = await this.pickAndVisitResult(topic)
          if (!visited) break
        }
      } catch (error) {
        logger.warn({ topic, error: String(error) }, 'Sub-topic failed — moving on')
        this.chat(`had trouble with ${topic}, moving on`)
      }
    }

    // Synthesize
    if (this.sourcesVisited > 0 || this.factsCollected.length > 0) {
      const synthesis = await this.synthesize(task.description)
      this.chat(synthesis)
    } else {
      this.chat('couldn\'t find enough on this topic')
    }

    return {
      success: this.sourcesVisited > 0,
      findings: this.research.formatForLLM(),
      content: this.research.getAllContent(),
    }
  }

  // ── Extract facts from search results page ────────────────────

  private async extractFromSearchPage(topic: string): Promise<void> {
    try {
      const results = await this.getSearchResults()

      if (results.knowledgePanel) {
        const kp = results.knowledgePanel
        const facts: string[] = []
        if (kp.description) facts.push(kp.description.slice(0, 300))
        for (const [key, value] of Object.entries(kp.facts)) {
          facts.push(`${key}: ${value}`)
        }
        if (facts.length > 0) {
          this.research.addFinding(
            'Google Knowledge Panel', 'https://www.google.com/search',
            facts.map((f) => ({ name: f.split(':')[0] ?? 'fact', detail: f })),
            'search_results', facts.join('\n'),
          )
          this.factsCollected.push(...facts)
          this.chat('picked up some quick facts from google')
        }
      }

      if (results.aiOverview) {
        this.research.addFinding(
          'Google AI Overview', 'https://www.google.com/search',
          [{ name: 'AI Overview', detail: results.aiOverview }],
          'search_results', results.aiOverview,
        )
        this.factsCollected.push(results.aiOverview)
      }
    } catch (error) {
      logger.warn({ error: String(error) }, 'extractFromSearchPage failed')
    }
  }

  // ── Pick and visit a result ───────────────────────────────────

  private async pickAndVisitResult(topic: string): Promise<boolean> {
    // Try rich results first, fall back to basic links
    let candidates: Array<{ title: string; url: string; snippet: string }> = []

    try {
      const results = await this.getSearchResults()
      if (results.organic.length > 0) {
        candidates = results.organic.filter((r) => {
          const domain = this.extractDomain(r.url)
          if (!domain) return false
          if (this.visitedDomains.has(domain)) return false
          if (domain.includes('google.com') || domain.includes('google.co')) return false
          if (domain.includes('youtube.com') || domain.includes('gstatic.com')) return false
          if (r.url.endsWith('.pdf') || r.url.includes('.pdf?')) return false
          if (r.snippet?.includes('PDF')) return false
          return true
        })
      }
    } catch { /* fall through to getLinks */ }

    // Fallback to basic links
    if (candidates.length === 0) {
      const links = await this.getLinks()
      candidates = links
        .filter((l) => {
          if (!l.href || !l.text || l.text.length < 10) return false
          const domain = this.extractDomain(l.href)
          if (!domain || this.visitedDomains.has(domain)) return false
          if (domain.includes('google.com') || domain.includes('youtube.com')) return false
          if (l.href.endsWith('.pdf') || l.text.includes('PDF')) return false
          return true
        })
        .map((l) => ({ title: l.text, url: l.href, snippet: '' }))
    }

    logger.info({ count: candidates.length }, 'Candidates for clicking')
    if (candidates.length === 0) return false

    // Ask LLM to pick
    const resultList = candidates.slice(0, 6).map((r, i) => {
      const domain = this.extractDomain(r.url)
      const cred = this.rateCredibility(domain)
      const snippet = r.snippet ? `\n     snippet: "${r.snippet.slice(0, 150)}"` : ''
      return `${i + 1}. "${r.title.slice(0, 80)}" — ${domain} [${cred}]${snippet}`
    }).join('\n')

    const response = await this.askLLM(
      `pick the best result for "${topic}". respond JSON: {"number": 1, "reasoning": "why"}
if none good: {"number": 0}`,
      `results:\n${resultList}`,
      100,
    )

    const parsed = this.parseJSON<{ number: number }>(response)
    if (!parsed || parsed.number === 0 || parsed.number > candidates.length) return false

    const chosen = candidates[parsed.number - 1]!
    const domain = this.extractDomain(chosen.url)
    this.visitedDomains.add(domain)

    this.chat(`checking ${domain}`)

    // Click the result — with visual feedback
    const clickSuccess = await this.visualClickWithRetry(chosen.title)
    if (!clickSuccess) {
      const shortTitle = chosen.title.split(' — ')[0] ?? chosen.title.split(' - ')[0]
      if (shortTitle && shortTitle !== chosen.title) {
        if (!await this.visualClickWithRetry(shortTitle)) return false
      } else {
        return false
      }
    }

    // Wait for page
    await this.sleep(1500)
    await this.waitForPage()
    await this.waitForBridge()
    await this.sleep(500)
    await this.dismissPopups()

    // Read page using manifest workflow
    await this.executor.run('read_any_website')

    // Extract content
    const pageText = await this.getPageText(6000)
    if (pageText.length < 50) {
      this.chat('nothing useful here')
      return true
    }

    // Check duplicate
    const duplicateOf = this.research.isDuplicateContent(pageText)
    if (duplicateOf) {
      this.chat(`already have this from ${duplicateOf}`)
      await this.executor.run('go_back_to_results')
      return true
    }

    // LLM extracts findings
    const url = await this.getCurrentUrl()
    await this.showExtraction('reading...')

    const extractResponse = await this.askLLM(
      `extract findings about "${topic}" from this page. respond JSON:
{
  "useful": true/false,
  "summary": "2-3 sentences",
  "findings": [{"name": "fact", "detail": "content"}],
  "content": "important paragraphs for a report — up to 500 words",
  "highlights": ["2-3 key phrases"],
  "chatMessage": "casual update for team chat"
}`,
      `page from ${domain}:\n${pageText}`,
      1024,
    )

    const extracted = this.parseJSON<{
      useful: boolean; summary: string
      findings: Array<{ name: string; [key: string]: unknown }>
      content?: string; highlights?: string[]; chatMessage?: string
    }>(extractResponse)

    if (extracted?.useful) {
      this.sourcesVisited++
      this.research.addFinding(domain, url, extracted.findings, 'article', extracted.content ?? extracted.summary)
      this.research.addPageVisit(url, '', true)
      if (extracted.highlights?.length) await this.highlight(extracted.highlights)
      this.chat(extracted.chatMessage ?? `found good info on ${domain}`)
    } else {
      this.research.addPageVisit(url, '', false)
      this.chat('this page wasn\'t very helpful')
    }

    // Go back using manifest workflow
    await this.executor.run('go_back_to_results')
    return true
  }

  // ── Synthesize ────────────────────────────────────────────────

  private async synthesize(taskDescription: string): Promise<string> {
    const snippetFacts = this.factsCollected.length > 0
      ? `\nfacts from search snippets:\n${this.factsCollected.join('\n')}` : ''

    return this.askLLM(
      `present research findings to your team. thorough but casual. cite sources.`,
      `task: ${taskDescription}\nresearch from ${this.sourcesVisited} pages:\n${this.research.formatForLLM()}${snippetFacts}\n\ncontent:\n${this.research.getAllContent().slice(0, 6000)}`,
      2048,
    )
  }

  // ── Helpers ───────────────────────────────────────────────────

  private async generateSubTopics(task: string): Promise<string[]> {
    const response = await this.askLLM(
      'break this into 3-5 specific sub-topics for Google searches. respond JSON: {"topics": ["topic1", "topic2"]}',
      task,
      128,
    )
    return this.parseJSON<{ topics: string[] }>(response)?.topics ?? [task]
  }

  private async generateSearchQuery(topic: string): Promise<string> {
    const response = await this.askLLM(
      'generate a concise Google search query (under 8 words). just the query.',
      topic,
      64,
    )
    return response.replace(/^["']|["']$/g, '')
  }

  private extractDomain(url: string): string {
    try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '') }
    catch { return '' }
  }

  private rateCredibility(domain: string): string {
    if (!domain) return '?'
    if (/\.(gov|edu)$/.test(domain)) return '★★★'
    if (domain.includes('wikipedia.org')) return '★★★'
    if (['bbc.com', 'reuters.com', 'nytimes.com', 'apnews.com', 'theguardian.com', 'aljazeera.com'].some((d) => domain.includes(d))) return '★★★'
    if (['worldbank.org', 'un.org', 'who.int', 'imf.org'].some((d) => domain.includes(d))) return '★★★'
    if (['britannica.com', 'nationalgeographic.com'].some((d) => domain.includes(d))) return '★★☆'
    if (['medium.com', 'forbes.com', 'wired.com'].some((d) => domain.includes(d))) return '★★☆'
    if (['reddit.com', 'quora.com'].some((d) => domain.includes(d))) return '★☆☆'
    return '★★☆'
  }
}
