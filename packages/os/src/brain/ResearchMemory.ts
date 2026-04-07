import type {
  ResearchMemoryState,
  ResearchFinding,
  ResearchDataItem,
  VisitedPage,
  SourceCredibility,
  ScrapedPage,
} from '@maia/shared'
import { SOURCE_CREDIBILITY } from '@maia/shared'

/**
 * ResearchMemory is the agent's scratchpad — persists across page
 * navigations within a task so the agent can compare findings
 * from different websites.
 *
 * Example: Agent visits booking.com, stores hotel prices.
 * Then visits tripadvisor.com — still has the booking.com data
 * for cross-referencing.
 */
export class ResearchMemory {
  private state: ResearchMemoryState

  constructor(task: string) {
    this.state = {
      task,
      findings: [],
      searchesTriedSoFar: [],
      pagesVisited: [],
      openQuestions: [],
      confidence: 'low',
      confidenceReason: 'just started',
    }
  }

  /** Add findings from a page the agent visited. */
  addFinding(
    source: string,
    url: string,
    data: ResearchDataItem[],
    pageType: ScrapedPage['pageType'],
    content: string = '',
  ): void {
    // Check if we already have findings from this source
    const existing = this.state.findings.find((f) => f.url === url)
    if (existing) {
      existing.data.push(...data)
      if (content) existing.content = (existing.content ? existing.content + '\n' : '') + content
      existing.visitedAt = Date.now()
      return
    }

    this.state.findings.push({
      source,
      url,
      visitedAt: Date.now(),
      data,
      content,
      credibility: this.assessCredibility(source, url),
      pageType,
    })

    this.updateConfidence()
  }

  /**
   * Get all stored content from all findings — used when the agent needs
   * to write a report, compose an email, or do anything with the research.
   */
  getAllContent(): string {
    return this.state.findings
      .filter((f) => f.content)
      .map((f) => `--- ${f.source} (${f.url}) ---\n${f.content}`)
      .join('\n\n')
  }

  /** Record a search query the agent tried. */
  addSearch(query: string): void {
    if (!this.state.searchesTriedSoFar.includes(query)) {
      this.state.searchesTriedSoFar.push(query)
    }
  }

  /** Record a page visit with usefulness assessment. */
  addPageVisit(url: string, title: string, useful: boolean, reason?: string): void {
    // Don't duplicate
    if (this.state.pagesVisited.some((p) => p.url === url)) return

    this.state.pagesVisited.push({
      url,
      title,
      useful,
      reason,
      visitedAt: Date.now(),
    })
  }

  /** Add a question the agent still needs answered. */
  addQuestion(question: string): void {
    if (!this.state.openQuestions.includes(question)) {
      this.state.openQuestions.push(question)
    }
  }

  /** Remove a question that was answered. */
  resolveQuestion(question: string): void {
    this.state.openQuestions = this.state.openQuestions.filter((q) => q !== question)
  }

  /**
   * Check if a page's content overlaps significantly with what we already have.
   * Returns the matching source name if duplicate, undefined if new content.
   */
  isDuplicateContent(pageText: string): string | undefined {
    if (!pageText || pageText.length < 50) return undefined

    // Extract key phrases (words 4+ chars) from the new page
    const newWords = new Set(
      pageText.toLowerCase().split(/\s+/).filter((w) => w.length >= 4),
    )
    if (newWords.size < 10) return undefined

    for (const finding of this.state.findings) {
      if (!finding.content || finding.content.length < 50) continue

      const existingWords = new Set(
        finding.content.toLowerCase().split(/\s+/).filter((w) => w.length >= 4),
      )

      // Count overlap
      let overlap = 0
      for (const word of newWords) {
        if (existingWords.has(word)) overlap++
      }

      const overlapRatio = overlap / Math.min(newWords.size, existingWords.size)
      // 60%+ word overlap = duplicate content
      if (overlapRatio > 0.6) {
        return finding.source
      }
    }

    return undefined
  }

  /** Get the full state for inclusion in LLM prompt. */
  getState(): ResearchMemoryState {
    return this.state
  }

  /** Format research memory as text for the LLM prompt. */
  formatForLLM(): string {
    if (this.state.findings.length === 0 && this.state.pagesVisited.length === 0) {
      return 'Research memory: empty — no findings yet.'
    }

    const parts: string[] = ['Research memory:']

    // Findings by source
    if (this.state.findings.length > 0) {
      parts.push(`  Findings from ${this.state.findings.length} source(s):`)
      for (const finding of this.state.findings) {
        parts.push(`    [${finding.source}] (${finding.credibility} credibility)`)
        for (const item of finding.data.slice(0, 5)) {
          const fields = Object.entries(item)
            .filter(([key]) => key !== 'name')
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ')
          parts.push(`      - ${item.name}${fields ? ' — ' + fields : ''}`)
        }
        // Show content preview if available
        if (finding.content) {
          const preview = finding.content.length > 200
            ? finding.content.slice(0, 200) + '...'
            : finding.content
          parts.push(`      content: "${preview}"`)
        }
      }
    }

    // Searches tried — MAKE VERY EXPLICIT so the LLM doesn't repeat
    if (this.state.searchesTriedSoFar.length > 0) {
      parts.push(`  ⚠️ ALREADY SEARCHED (do NOT search these again): "${this.state.searchesTriedSoFar.join('", "')}"`)
      parts.push(`  If you need to search again, use DIFFERENT search terms.`)
    }

    // Pages visited — show which were useful and which to avoid
    if (this.state.pagesVisited.length > 0) {
      const domains = this.state.pagesVisited.map((p) => { try { return new URL(p.url).hostname } catch { return p.url } })
      parts.push(`  ⚠️ ALREADY VISITED THESE SITES (do NOT click these again on search results): ${[...new Set(domains)].join(', ')}`)
    }
    const useful = this.state.pagesVisited.filter((p) => p.useful)
    const useless = this.state.pagesVisited.filter((p) => !p.useful)
    if (useful.length > 0) {
      parts.push(`  ✅ Useful pages: ${useful.map((p) => { try { return new URL(p.url).hostname } catch { return p.url } }).join(', ')}`)
    }
    if (useless.length > 0) {
      parts.push(`  ❌ Useless pages: ${useless.map((p) => { try { return `${new URL(p.url).hostname} (${p.reason ?? 'not useful'})` } catch { return p.url } }).join(', ')}`)
    }

    // Open questions
    if (this.state.openQuestions.length > 0) {
      parts.push(`  Open questions: ${this.state.openQuestions.join('; ')}`)
    }

    // Confidence
    parts.push(`  Confidence: ${this.state.confidence} — ${this.state.confidenceReason}`)

    return parts.join('\n')
  }

  /** Check if the agent has visited this URL already. */
  hasVisited(url: string): boolean {
    return this.state.pagesVisited.some((p) => p.url === url)
  }

  /** Get the number of unique sources with findings. */
  getSourceCount(): number {
    return this.state.findings.length
  }

  private assessCredibility(source: string, url: string): SourceCredibility {
    let hostname: string
    try {
      hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
    } catch {
      return SOURCE_CREDIBILITY.MEDIUM
    }

    // First-party booking/review sites
    const highCredibility = [
      'booking.com', 'hotels.com', 'expedia.com', 'agoda.com',
      'tripadvisor.com', 'yelp.com', 'google.com',
      'amazon.com', 'ebay.com',
      'nytimes.com', 'bbc.com', 'reuters.com', 'bloomberg.com',
      'wikipedia.org', 'github.com',
    ]
    if (highCredibility.some((h) => hostname.includes(h))) return SOURCE_CREDIBILITY.HIGH

    // Medium credibility — forums, social, smaller sites
    const mediumCredibility = [
      'reddit.com', 'quora.com', 'stackexchange.com', 'stackoverflow.com',
      'medium.com', 'substack.com',
    ]
    if (mediumCredibility.some((h) => hostname.includes(h))) return SOURCE_CREDIBILITY.MEDIUM

    return SOURCE_CREDIBILITY.LOW
  }

  private updateConfidence(): void {
    const sourceCount = this.state.findings.length
    const highCredCount = this.state.findings.filter((f) => f.credibility === 'high').length
    const totalItems = this.state.findings.reduce((sum, f) => sum + f.data.length, 0)

    if (sourceCount >= 3 && highCredCount >= 2 && totalItems >= 5) {
      this.state.confidence = 'high'
      this.state.confidenceReason = `checked ${sourceCount} sources (${highCredCount} high-credibility), found ${totalItems} items`
    } else if (sourceCount >= 2 || totalItems >= 3) {
      this.state.confidence = 'medium'
      this.state.confidenceReason = `checked ${sourceCount} source(s), found ${totalItems} items — could verify with more sources`
    } else {
      this.state.confidence = 'low'
      this.state.confidenceReason = `only ${sourceCount} source(s) so far`
    }
  }
}
