import { pino } from 'pino'
import type { SearchResult, SearchResultGroup } from '@maia/shared'
import type { NetworkBrain } from './NetworkBrain'
import type { AppRegistry } from '../app/AppRegistry'

const logger = pino({ name: 'search-index' })

/**
 * SearchIndex powers Spotlight AI — searches across all installed apps
 * using data from the Network Brain and app registry.
 */
export class SearchIndex {
  private readonly network: NetworkBrain
  private readonly registry: AppRegistry

  constructor(network: NetworkBrain, registry: AppRegistry) {
    this.network = network
    this.registry = registry
  }

  async search(query: string): Promise<SearchResultGroup[]> {
    const apps = this.registry.getAllApps()
    const groups: SearchResultGroup[] = []
    const queryLower = query.toLowerCase()

    // Search installed apps by name
    const appMatches: SearchResult[] = []
    for (const app of apps) {
      if (app.name.toLowerCase().includes(queryLower)) {
        appMatches.push({
          title: app.name,
          subtitle: app.url,
          appId: app.id,
          appName: app.name,
          appIcon: app.icon,
        })
      }
    }

    if (appMatches.length > 0) {
      groups.push({
        appId: 'apps',
        appName: 'Apps',
        appIcon: '📱',
        results: appMatches.slice(0, 5),
      })
    }

    // If query looks like a natural language task, add an AI action suggestion
    if (this.looksLikeTask(queryLower)) {
      groups.push({
        appId: 'ai-task',
        appName: 'Ask Maia',
        appIcon: '🧠',
        results: [{
          title: query,
          subtitle: 'Run as AI task',
          appId: 'ai-task',
          appName: 'Ask Maia',
          appIcon: '🧠',
        }],
      })
    }

    // Search network traffic
    for (const app of apps) {
      const data = this.network.getAppData(app.id)
      const results: SearchResult[] = []

      for (const request of data.recentRequests) {
        const bodyStr = JSON.stringify(request.body).toLowerCase()
        if (bodyStr.includes(queryLower)) {
          results.push({
            title: this.extractTitle(request.body, queryLower),
            subtitle: new URL(request.url).pathname,
            appId: app.id,
            appName: app.name,
            appIcon: app.icon,
          })
        }
      }

      if (results.length > 0) {
        groups.push({
          appId: app.id,
          appName: app.name,
          appIcon: app.icon,
          results: results.slice(0, 5),
        })
      }
    }

    return groups
  }

  private looksLikeTask(query: string): boolean {
    const taskVerbs = ['open', 'find', 'search', 'send', 'reply', 'book', 'schedule', 'create', 'write', 'check', 'look up', 'go to', 'navigate']
    return query.split(' ').length >= 2 && taskVerbs.some((verb) => query.startsWith(verb))
  }

  private extractTitle(body: unknown, query: string): string {
    if (typeof body !== 'object' || body === null) return 'Match found'

    const walk = (obj: unknown, depth = 0): string | undefined => {
      if (depth > 5) return undefined
      if (typeof obj === 'string' && obj.toLowerCase().includes(query)) {
        return obj.substring(0, 100)
      }
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const result = walk(item, depth + 1)
          if (result) return result
        }
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          const result = walk(value, depth + 1)
          if (result) return result
        }
      }
      return undefined
    }

    return walk(body) ?? 'Match found'
  }
}
