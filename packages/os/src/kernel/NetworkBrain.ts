import { pino } from 'pino'
import type { EventBus } from '../events/EventBus'

const logger = pino({ name: 'network-brain' })

export interface InterceptedRequest {
  url: string
  method: string
  statusCode: number
  contentType: string
  body: unknown
  timestamp: number
  appId: string
}

export interface AppNetworkData {
  appId: string
  recentRequests: InterceptedRequest[]
  summary: string
}

/**
 * NetworkBrain intercepts API traffic from every installed app.
 *
 * In Electron, this works via webContents.session.webRequest API
 * which allows intercepting all HTTP traffic from a BrowserView.
 *
 * The OS core registers listeners via the main process.
 * Intercepted JSON responses are parsed and stored here.
 */
export class NetworkBrain {
  private readonly dataByApp = new Map<string, InterceptedRequest[]>()
  private readonly eventBus: EventBus
  private readonly maxRequestsPerApp = 100

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
  }

  recordRequest(request: InterceptedRequest): void {
    let requests = this.dataByApp.get(request.appId)
    if (!requests) {
      requests = []
      this.dataByApp.set(request.appId, requests)
    }

    requests.push(request)

    // Keep only the most recent requests
    if (requests.length > this.maxRequestsPerApp) {
      requests.shift()
    }
  }

  getAppData(appId: string): AppNetworkData {
    const requests = this.dataByApp.get(appId) ?? []
    const jsonRequests = requests.filter((r) =>
      r.contentType.includes('json') && r.body !== undefined,
    )

    return {
      appId,
      recentRequests: jsonRequests.slice(-20),
      summary: this.summarizeRequests(jsonRequests.slice(-10)),
    }
  }

  getAppSummary(appId: string): string {
    const data = this.getAppData(appId)
    return data.summary
  }

  clear(appId: string): void {
    this.dataByApp.delete(appId)
  }

  clearAll(): void {
    this.dataByApp.clear()
  }

  private summarizeRequests(requests: InterceptedRequest[]): string {
    if (requests.length === 0) return 'No recent API activity.'

    const summaries = requests.map((r) => {
      const bodyPreview = typeof r.body === 'object'
        ? JSON.stringify(r.body).substring(0, 200)
        : String(r.body).substring(0, 200)
      return `${r.method} ${new URL(r.url).pathname}: ${bodyPreview}`
    })

    return summaries.join('\n')
  }
}
