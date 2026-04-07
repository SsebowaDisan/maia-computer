import { pino } from 'pino'

const logger = pino({ name: 'workspace' })

/**
 * WorkspaceRegistry — tracks which apps are open and ready for agents.
 *
 * Each installed app that the user has opened becomes a "workspace."
 * A workspace = webview + injected bridge + confirmed ready state.
 *
 * When an agent needs to use an app, it gets the workspace from here.
 * If the workspace exists and is ready, the agent starts immediately.
 * If not, the agent waits or reports the app isn't open.
 *
 * No more race conditions — agents only start on ready workspaces.
 */

export interface Workspace {
  appId: string
  appName: string
  appUrl: string
  webContentsId: number
  bridgeReady: boolean
  lastActivity: number
}

export class WorkspaceRegistry {
  private workspaces = new Map<string, Workspace>()

  /** Register a workspace when an app's bridge is confirmed ready. */
  register(workspace: Workspace): void {
    this.workspaces.set(workspace.appId, workspace)
    logger.info({ appId: workspace.appId, appName: workspace.appName, webContentsId: workspace.webContentsId }, 'Workspace registered')
  }

  /** Mark bridge as ready for an app. */
  markReady(appId: string): void {
    const ws = this.workspaces.get(appId)
    if (ws) {
      ws.bridgeReady = true
      ws.lastActivity = Date.now()
      logger.info({ appId }, 'Workspace bridge ready')
    }
  }

  /** Update the webContentsId for an app (happens on auto-discovery). */
  updateWebContentsId(appId: string, webContentsId: number): void {
    const ws = this.workspaces.get(appId)
    if (ws) {
      ws.webContentsId = webContentsId
      ws.lastActivity = Date.now()
    }
  }

  /** Remove a workspace when the app is closed. */
  remove(appId: string): void {
    this.workspaces.delete(appId)
    logger.info({ appId }, 'Workspace removed')
  }

  /** Get a workspace by appId. Returns undefined if not open or not ready. */
  get(appId: string): Workspace | undefined {
    return this.workspaces.get(appId)
  }

  /** Check if a workspace is open AND bridge is ready. */
  isReady(appId: string): boolean {
    const ws = this.workspaces.get(appId)
    return ws?.bridgeReady === true
  }

  /**
   * Wait for a workspace to become ready.
   * Returns the workspace when ready, or undefined on timeout.
   */
  async waitForReady(appId: string, timeoutMs = 10_000): Promise<Workspace | undefined> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const ws = this.workspaces.get(appId)
      if (ws?.bridgeReady) return ws
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
    logger.warn({ appId, timeoutMs }, 'Workspace not ready — timeout')
    return undefined
  }

  /** Get all registered workspaces. */
  getAll(): Workspace[] {
    return Array.from(this.workspaces.values())
  }

  /** Get all ready workspaces. */
  getReady(): Workspace[] {
    return Array.from(this.workspaces.values()).filter((ws) => ws.bridgeReady)
  }
}
