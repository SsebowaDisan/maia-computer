import { app, BrowserWindow, BrowserView, ipcMain, session } from 'electron'
import { join, resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { config } from 'dotenv'
import {
  AppRegistry,
  SessionStore,
  loadManifests,
  EventBus,
  NetworkBrain,
  DOMBrain,
  VisionBrain,
  IntelligenceRouter,
  SearchIndex,
  Brain,
  ProviderRegistry,
  OpenAIAdapter,
  MessageBus,
  CostTracker,
} from '@maia/os'
import type { WebContainerAPI, DOMElement } from '@maia/os'
import type { AppBounds, InstalledApp } from '@maia/shared'

config()

// ── Paths (resolved at init, not at import time) ───────────────

const ROOT = resolve(join(__dirname, '..', '..', '..'))
const SHELL_DIST = join(ROOT, 'packages', 'shell', 'dist')
const OS_DIR = join(ROOT, 'packages', 'os')
const MANIFEST_DIR = join(OS_DIR, 'manifests')
const BRIDGE_SCRIPT_PATH = join(OS_DIR, 'src', 'bridge', 'bridge.js')

// ── State (initialized in init()) ──────────────────────────────

let mainWindow: BrowserWindow | undefined
const appViews = new Map<string, BrowserView>()

let eventBus: EventBus
let registry: AppRegistry
let sessionStore: SessionStore
let networkBrain: NetworkBrain
let llm: ProviderRegistry
let messageBus: MessageBus
let searchIndex: SearchIndex
let bridgeScript = ''

function init(): void {
  const DATA_DIR = join(app.getPath('userData'), 'maia-data')

  eventBus = new EventBus()
  registry = new AppRegistry(join(DATA_DIR, 'registry.db'))
  sessionStore = new SessionStore(join(DATA_DIR, 'sessions'))
  networkBrain = new NetworkBrain(eventBus)
  llm = new ProviderRegistry()

  if (process.env.MAIA_OPENAI_API_KEY) {
    llm.setPrimary(new OpenAIAdapter(process.env.MAIA_OPENAI_API_KEY))
  }

  messageBus = new MessageBus(eventBus)
  searchIndex = new SearchIndex(networkBrain, registry)

  try {
    bridgeScript = readFileSync(BRIDGE_SCRIPT_PATH, 'utf-8')
  } catch {
    console.warn('Bridge script not found at', BRIDGE_SCRIPT_PATH)
  }
}

// ── WebContainer API (Electron BrowserView implementation) ─────

const containerAPI: WebContainerAPI = {
  async create(config) {
    if (!mainWindow) return

    const view = new BrowserView({
      webPreferences: {
        partition: `persist:${config.partition}`,
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    mainWindow.addBrowserView(view)
    view.setBounds({
      x: config.bounds.x,
      y: config.bounds.y,
      width: config.bounds.width,
      height: config.bounds.height,
    })

    // Inject bridge script on every page load
    view.webContents.on('did-finish-load', () => {
      if (bridgeScript) {
        view.webContents.executeJavaScript(bridgeScript).catch(() => {})
      }
    })

    // Intercept network traffic for NetworkBrain
    view.webContents.session.webRequest.onCompleted(
      { urls: ['*://*/*'] },
      (details) => {
        if (details.statusCode >= 200 && details.statusCode < 300) {
          // Only track JSON responses
          const contentType = details.responseHeaders?.['content-type']?.[0] ?? ''
          if (contentType.includes('json')) {
            networkBrain.recordRequest({
              url: details.url,
              method: details.method,
              statusCode: details.statusCode,
              contentType,
              body: undefined, // Electron onCompleted doesn't give body — will enhance later
              timestamp: Date.now(),
              appId: config.appId,
            })
          }
        }
      },
    )

    await view.webContents.loadURL(config.url)
    appViews.set(config.appId, view)
  },

  async destroy(appId) {
    const view = appViews.get(appId)
    if (view && mainWindow) {
      mainWindow.removeBrowserView(view)
      view.webContents.close()
      appViews.delete(appId)
    }
  },

  async show(appId) {
    const view = appViews.get(appId)
    if (view && mainWindow) {
      mainWindow.addBrowserView(view)
    }
  },

  async hide(appId) {
    const view = appViews.get(appId)
    if (view && mainWindow) {
      mainWindow.removeBrowserView(view)
    }
  },

  async setBounds(appId, bounds) {
    const view = appViews.get(appId)
    if (view) {
      view.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height })
    }
  },

  async navigate(appId, url) {
    const view = appViews.get(appId)
    if (view) {
      await view.webContents.loadURL(url)
    }
  },

  async getURL(appId) {
    return appViews.get(appId)?.webContents.getURL() ?? ''
  },

  async getTitle(appId) {
    return appViews.get(appId)?.webContents.getTitle() ?? ''
  },

  async isLoading(appId) {
    return appViews.get(appId)?.webContents.isLoading() ?? false
  },

  async getCookies(appId) {
    const view = appViews.get(appId)
    if (!view) return '[]'
    const cookies = await view.webContents.session.cookies.get({})
    return JSON.stringify(cookies)
  },

  async setCookies(appId, cookies) {
    const view = appViews.get(appId)
    if (!view) return
    const parsed = JSON.parse(cookies) as Electron.Cookie[]
    for (const cookie of parsed) {
      await view.webContents.session.cookies.set({
        url: `https://${cookie.domain}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
      })
    }
  },

  async captureScreenshot(appId) {
    const view = appViews.get(appId)
    if (!view) return Buffer.alloc(0)
    const image = await view.webContents.capturePage()
    return image.toPNG()
  },

  async executeJavaScript(appId, code) {
    const view = appViews.get(appId)
    if (!view) return undefined
    return view.webContents.executeJavaScript(code)
  },

  async injectBridgeScript(appId, script) {
    const view = appViews.get(appId)
    if (view) {
      await view.webContents.executeJavaScript(script)
    }
  },

  async getElements(appId) {
    const view = appViews.get(appId)
    if (!view) return []
    try {
      return await view.webContents.executeJavaScript(
        'window.__maia_bridge ? window.__maia_bridge.getElements() : []',
      ) as DOMElement[]
    } catch {
      return []
    }
  },

  async clickElement(appId, selector) {
    const view = appViews.get(appId)
    if (!view) return false
    try {
      return await view.webContents.executeJavaScript(
        `window.__maia_bridge ? window.__maia_bridge.clickElement(${JSON.stringify(selector)}) : false`,
      ) as boolean
    } catch {
      return false
    }
  },

  async typeInElement(appId, selector, text) {
    const view = appViews.get(appId)
    if (!view) return false
    try {
      return await view.webContents.executeJavaScript(
        `window.__maia_bridge ? window.__maia_bridge.typeInElement(${JSON.stringify(selector)}, ${JSON.stringify(text)}) : false`,
      ) as boolean
    } catch {
      return false
    }
  },

  async scrollToElement(appId, selector) {
    const view = appViews.get(appId)
    if (!view) return false
    try {
      return await view.webContents.executeJavaScript(
        `window.__maia_bridge ? window.__maia_bridge.scrollToElement(${JSON.stringify(selector)}) : false`,
      ) as boolean
    } catch {
      return false
    }
  },
}

// ── Intelligence Layer ─────────────────────────────────────────

const domBrain = new DOMBrain(containerAPI, eventBus)
const visionBrain = new VisionBrain(containerAPI, llm)
const intelligence = new IntelligenceRouter(networkBrain, domBrain, visionBrain)

// ── IPC Handlers ───────────────────────────────────────────────

function setupIPC(): void {
  // App management
  ipcMain.handle('app:list', () => {
    return { apps: registry.getAllApps() }
  })

  ipcMain.handle('app:install', async (_event, payload: { url: string; name: string; icon: string; manifestId?: string }) => {
    const appId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const bounds: AppBounds = { x: 0, y: 38, width: 800, height: 600 }

    registry.installApp({
      id: appId,
      manifestId: payload.manifestId ?? appId,
      name: payload.name,
      icon: payload.icon,
      url: payload.url,
      spaceId: 'default',
      installedAt: Date.now(),
    })

    await containerAPI.create({
      appId,
      url: payload.url,
      partition: appId,
      bounds,
    })

    // Notify frontend
    mainWindow?.webContents.send('app:installed', { appId, name: payload.name, icon: payload.icon })
    return { appId }
  })

  ipcMain.handle('app:open', async (_event, payload: { appId: string }) => {
    registry.updateLastOpened(payload.appId)
    const appData = registry.getApp(payload.appId)
    if (!appData) return { success: false }

    const existing = appViews.get(payload.appId)
    if (existing) {
      await containerAPI.show(payload.appId)
    } else {
      await containerAPI.create({
        appId: payload.appId,
        url: appData.url,
        partition: payload.appId,
        bounds: { x: 0, y: 38, width: 800, height: 600 },
      })
    }

    mainWindow?.webContents.send('app:opened', { appId: payload.appId })
    return { success: true }
  })

  ipcMain.handle('app:close', async (_event, payload: { appId: string }) => {
    await containerAPI.hide(payload.appId)
    mainWindow?.webContents.send('app:closed', { appId: payload.appId })
    return { success: true }
  })

  ipcMain.handle('app:uninstall', async (_event, payload: { appId: string }) => {
    await containerAPI.destroy(payload.appId)
    registry.uninstallApp(payload.appId)
    await sessionStore.deleteSession(payload.appId)
    return { success: true }
  })

  ipcMain.handle('app:setBounds', async (_event, payload: { appId: string; bounds: AppBounds }) => {
    await containerAPI.setBounds(payload.appId, payload.bounds)
    return { success: true }
  })

  // Brain
  ipcMain.handle('brain:execute', async (_event, payload: { appId: string; command: string }) => {
    const brain = new Brain(intelligence, eventBus, llm, {
      taskId: `task_${Date.now()}`,
      appId: payload.appId,
    })

    // Forward brain events to renderer
    const unsub = eventBus.subscribePattern('brain.*', (event) => {
      if (event.type === 'brain.thinking') {
        mainWindow?.webContents.send('brain:thinking', { thought: (event as { thought: string }).thought })
      }
      if (event.type === 'brain.decision') {
        mainWindow?.webContents.send('brain:action', { action: (event as { action: unknown }).action, appId: payload.appId })
      }
    })

    brain.run(payload.command).then((summary) => {
      mainWindow?.webContents.send('brain:taskCompleted', { summary })
      unsub()
    }).catch(() => {
      unsub()
    })

    return { success: true }
  })

  ipcMain.handle('brain:startTask', async (_event, payload: { description: string }) => {
    const taskId = `task_${Date.now()}`
    // For now, tasks work against the first open app or Chrome
    const apps = registry.getAllApps()
    const appId = apps[0]?.id ?? 'chrome'

    const brain = new Brain(intelligence, eventBus, llm, { taskId, appId })

    const unsub = eventBus.subscribeAll((event) => {
      if (event.type.startsWith('brain.') || event.type.startsWith('message.') || event.type.startsWith('session.')) {
        mainWindow?.webContents.send(event.type.replace('.', ':') as string, event)
      }
    })

    brain.run(payload.description).then((summary) => {
      mainWindow?.webContents.send('brain:taskCompleted', { summary })
      unsub()
    }).catch(() => unsub())

    return { taskId }
  })

  ipcMain.handle('brain:stop', () => ({ success: true }))
  ipcMain.handle('brain:getStatus', () => ({ running: false }))

  // Chat
  ipcMain.handle('chat:send', (_event, payload: { message: string }) => {
    const msg = messageBus.sendUserMessage(payload.message, 'active')
    mainWindow?.webContents.send('chat:message', { message: msg })
    return { success: true }
  })

  ipcMain.handle('chat:getHistory', () => {
    return { messages: messageBus.getHistory().getAll() }
  })

  // Spotlight
  ipcMain.handle('spotlight:search', async (_event, payload: { query: string }) => {
    const results = await searchIndex.search(payload.query)
    return { results }
  })

  // Spaces
  ipcMain.handle('spaces:list', () => ({ spaces: registry.getSpaces() }))
  ipcMain.handle('spaces:create', (_event, payload: { name: string; aiContext?: string }) => {
    const spaceId = `space_${Date.now()}`
    registry.createSpace({ id: spaceId, name: payload.name, aiContext: payload.aiContext ?? '' })
    return { spaceId }
  })
  ipcMain.handle('spaces:switch', (_event, _payload: { spaceId: string }) => ({ success: true }))
  ipcMain.handle('spaces:delete', (_event, payload: { spaceId: string }) => {
    registry.deleteSpace(payload.spaceId)
    return { success: true }
  })

  // Settings
  ipcMain.handle('settings:get', () => ({
    settings: {
      llmProvider: 'openai',
      taskBudget: 5.0,
      controlLevel: 3,
      autoHideDock: true,
    },
  }))
  ipcMain.handle('settings:update', (_event, _payload: { key: string; value: unknown }) => ({ success: true }))
}

// ── App Manifests ──────────────────────────────────────────────

async function loadAppStore(): Promise<void> {
  const manifests = await loadManifests(MANIFEST_DIR)
  // Store manifests for the app store UI
  ipcMain.handle('appstore:getManifests', () => manifests)
}

// ── Window Creation ────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 }, // hide native traffic lights
    backgroundColor: '#0A0A0A',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the shell
  const shellIndex = join(SHELL_DIST, 'index.html')
  console.log('Shell path:', shellIndex, 'exists:', existsSync(shellIndex))
  console.log('__dirname:', __dirname)
  console.log('ROOT:', ROOT)

  if (existsSync(shellIndex)) {
    mainWindow.loadFile(shellIndex)
  } else {
    console.log('Shell dist not found, trying Vite dev server')
    mainWindow.loadURL('http://localhost:5173')
  }

  // Open DevTools in dev mode for debugging
  mainWindow.webContents.openDevTools({ mode: 'detach' })

  mainWindow.on('closed', () => {
    mainWindow = undefined
  })
}

// ── App Lifecycle ──────────────────────────────────────────────

app.whenReady().then(async () => {
  init()
  setupIPC()
  await loadAppStore()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  registry.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
