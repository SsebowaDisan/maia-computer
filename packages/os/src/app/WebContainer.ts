import { pino } from 'pino'
import type { AppBounds } from '@maia/shared'

const logger = pino({ name: 'web-container' })

/**
 * WebContainer manages a sandboxed app instance.
 *
 * In the Electron environment, each WebContainer wraps a BrowserView.
 * This class defines the interface — the actual Electron BrowserView
 * creation happens in the main process (packages/main).
 *
 * The OS core communicates with the main process via IPC to
 * create, position, and control BrowserViews.
 */
export interface WebContainerConfig {
  appId: string
  url: string
  partition: string
  bounds: AppBounds
}

export interface WebContainerState {
  appId: string
  url: string
  title: string
  isLoading: boolean
  isVisible: boolean
}

export interface DOMElement {
  role: string
  label: string
  text: string
  selector: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  value?: string
  tagName: string
}

/**
 * Abstract WebContainer — implemented by the Electron main process.
 * The OS core calls these methods via IPC.
 */
export interface WebContainerAPI {
  create(config: WebContainerConfig): Promise<void>
  destroy(appId: string): Promise<void>
  show(appId: string): Promise<void>
  hide(appId: string): Promise<void>
  setBounds(appId: string, bounds: AppBounds): Promise<void>
  navigate(appId: string, url: string): Promise<void>
  getURL(appId: string): Promise<string>
  getTitle(appId: string): Promise<string>
  isLoading(appId: string): Promise<boolean>
  getCookies(appId: string): Promise<string>
  setCookies(appId: string, cookies: string): Promise<void>
  captureScreenshot(appId: string): Promise<Buffer>
  executeJavaScript(appId: string, code: string): Promise<unknown>
  injectBridgeScript(appId: string, script: string): Promise<void>
  getElements(appId: string): Promise<DOMElement[]>
  clickElement(appId: string, selector: string): Promise<boolean>
  typeInElement(appId: string, selector: string, text: string): Promise<boolean>
  scrollToElement(appId: string, selector: string): Promise<boolean>
}
