import { pino } from 'pino'

const logger = pino({ name: 'navigation-memory' })

/**
 * NavigationMemory stores what the agent learns from interacting with apps.
 *
 * When the agent clicks something and gets blocked (paywall, login wall),
 * lands on the wrong page, or discovers a useful shortcut — it remembers
 * that for future tasks, not just the current one.
 *
 * This is persistent across tasks via SQLite (loaded/saved by the caller).
 */

export interface NavigationLesson {
  id: string
  domain: string
  url: string
  lesson: string
  category: 'obstacle' | 'shortcut' | 'layout' | 'behavior' | 'error'
  learnedAt: number
  useCount: number
  lastUsedAt: number
}

export class NavigationMemory {
  private lessons: NavigationLesson[] = []

  /** Load lessons from persistent storage. */
  loadLessons(lessons: NavigationLesson[]): void {
    this.lessons = lessons
  }

  /** Get all lessons as a serializable array. */
  getAllLessons(): NavigationLesson[] {
    return this.lessons
  }

  /** Record a new lesson the agent learned. */
  addLesson(domain: string, url: string, lesson: string, category: NavigationLesson['category']): void {
    // Check if we already know this
    const existing = this.lessons.find(
      (l) => l.domain === domain && l.lesson.toLowerCase() === lesson.toLowerCase(),
    )
    if (existing) {
      existing.useCount++
      existing.lastUsedAt = Date.now()
      return
    }

    this.lessons.push({
      id: `lesson_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      domain,
      url,
      lesson,
      category,
      learnedAt: Date.now(),
      useCount: 1,
      lastUsedAt: Date.now(),
    })

    // Cap at 200 lessons — remove oldest unused ones
    if (this.lessons.length > 200) {
      this.lessons.sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      this.lessons = this.lessons.slice(0, 200)
    }

    logger.info({ domain, category, lesson }, 'Learned new navigation lesson')
  }

  /** Get lessons relevant to a specific domain or URL. */
  getLessonsForDomain(domain: string): NavigationLesson[] {
    return this.lessons.filter((l) => domain.includes(l.domain) || l.domain.includes(domain))
  }

  /** Format lessons for inclusion in the LLM prompt. */
  formatForLLM(currentDomain: string): string {
    const domainLessons = this.getLessonsForDomain(currentDomain)
    const generalLessons = this.lessons
      .filter((l) => l.category === 'obstacle' && l.useCount >= 2)
      .filter((l) => !domainLessons.includes(l))
      .slice(0, 5)

    const allRelevant = [...domainLessons, ...generalLessons]
    if (allRelevant.length === 0) return ''

    const parts: string[] = ['\nLearned from previous experience:']
    for (const lesson of allRelevant.slice(0, 10)) {
      const icon = lesson.category === 'obstacle' ? '⚠️'
        : lesson.category === 'shortcut' ? '💡'
        : lesson.category === 'error' ? '❌'
        : 'ℹ️'
      parts.push(`  ${icon} ${lesson.domain}: ${lesson.lesson}`)
    }
    return parts.join('\n')
  }

  /** Learn from a failed click or navigation. */
  learnFromFailure(url: string, action: string, outcome: string): void {
    const domain = this.extractDomain(url)
    this.addLesson(domain, url, `${action} → ${outcome}`, 'obstacle')
  }

  /** Learn from a successful navigation shortcut. */
  learnShortcut(url: string, shortcut: string): void {
    const domain = this.extractDomain(url)
    this.addLesson(domain, url, shortcut, 'shortcut')
  }

  /** Learn about a site's layout or behavior. */
  learnBehavior(url: string, behavior: string): void {
    const domain = this.extractDomain(url)
    this.addLesson(domain, url, behavior, 'behavior')
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }
}
