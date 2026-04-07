import { app, BrowserWindow, BrowserView, ipcMain, session, webContents } from 'electron'
import { join, resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { config } from 'dotenv'
import {
  AppRegistry,
  SessionStore,
  loadManifests,
  ManifestGenerator,
  EventBus,
  NetworkBrain,
  DOMBrain,
  VisionBrain,
  PageScraper,
  IntelligenceRouter,
  SearchIndex,
  Brain,
  Orchestrator,
  ProviderRegistry,
  OpenAIAdapter,
  MessageBus,
  CostTracker,
  WorkspaceRegistry,
} from '@maia/os'
import type { WebContainerAPI, DOMElement } from '@maia/os'
import type { AppBounds, IPCCommands, InstalledApp } from '@maia/shared'

config({ path: resolve(join(__dirname, '..', '..', '..', '.env')) })

// ── Paths (resolved at init, not at import time) ───────────────

const ROOT = resolve(join(__dirname, '..', '..', '..'))
const SHELL_DIST = join(ROOT, 'packages', 'shell', 'dist')
const OS_DIR = join(ROOT, 'packages', 'os')
const MANIFEST_DIR = join(OS_DIR, 'manifests')
const BRIDGE_SCRIPT_PATH = join(OS_DIR, 'src', 'bridge', 'bridge.js')
const SCRAPER_SCRIPT_PATH = join(OS_DIR, 'src', 'bridge', 'scraper.js')
const NAVIGATOR_SCRIPT_PATH = join(OS_DIR, 'src', 'bridge', 'navigator.js')
const PERFORMER_SCRIPT_PATH = join(OS_DIR, 'src', 'bridge', 'performer.js')
// pageNerve.js removed — App Agents use direct bridge calls instead

// ── State (initialized in init()) ──────────────────────────────

let mainWindow: BrowserWindow | undefined
const appViews = new Map<string, BrowserView>()
const appWebContentsIds = new Map<string, number>()

let eventBus: EventBus
let registry: AppRegistry
let sessionStore: SessionStore
let networkBrain: NetworkBrain
let llm: ProviderRegistry
let messageBus: MessageBus
let searchIndex: SearchIndex
let orchestrator: Orchestrator
let domBrain: DOMBrain
let visionBrain: VisionBrain
let intelligence: IntelligenceRouter
let bridgeScript = ''
let appManifests: Awaited<ReturnType<typeof loadManifests>> = []
let manifestGenerator: ManifestGenerator
const workspaceRegistry = new WorkspaceRegistry()

function normalizeBounds(bounds: AppBounds): AppBounds {
  const x = Math.floor(bounds.x)
  const y = Math.floor(bounds.y)
  const right = Math.ceil(bounds.x + bounds.width)
  const bottom = Math.ceil(bounds.y + bounds.height)

  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y),
  }
}

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

  const DATA_DIR_MESSAGES = join(DATA_DIR, 'messages.db')
  messageBus = new MessageBus(eventBus, DATA_DIR_MESSAGES)
  searchIndex = new SearchIndex(networkBrain, registry)

  // Initialize Intelligence Layer (must be after eventBus, llm, networkBrain)
  domBrain = new DOMBrain(containerAPI, eventBus)
  visionBrain = new VisionBrain(containerAPI, llm)
  const pageScraper = new PageScraper(containerAPI, networkBrain)
  intelligence = new IntelligenceRouter(networkBrain, domBrain, visionBrain, pageScraper)

  // Load all bridge scripts — core + scraper + navigator + performer
  try {
    const scripts = [BRIDGE_SCRIPT_PATH, SCRAPER_SCRIPT_PATH, NAVIGATOR_SCRIPT_PATH, PERFORMER_SCRIPT_PATH]
    bridgeScript = scripts
      .filter((p) => existsSync(p))
      .map((p) => readFileSync(p, 'utf-8'))
      .join('\n;\n')
  } catch {
    console.warn('Failed to load bridge scripts')
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
    view.setBounds(normalizeBounds(config.bounds))

    // Prevent links from opening in new windows — everything stays in the webview
    view.webContents.setWindowOpenHandler(({ url }) => {
      view.webContents.loadURL(url)
      return { action: 'deny' }
    })

    // Prevent new-window events (catches PDFs, target=_blank, window.open)
    view.webContents.on('will-navigate', (_event, url) => {
      // PDFs and downloads stay in the webview — Chromium renders PDFs natively
    })

    // Block any child windows that slip through
    view.webContents.on('did-create-window' as string, (childWindow: BrowserWindow) => {
      const childUrl = childWindow.webContents.getURL()
      childWindow.close()
      view.webContents.loadURL(childUrl)
    })

    // Inject bridge script on every page load
    view.webContents.on('did-finish-load', () => {
      if (bridgeScript) {
        view.webContents.executeJavaScript(bridgeScript).catch(() => {})
      }
    })

    // Block file downloads — apps run inside Maia, not download installers
    view.webContents.session.on('will-download', (_event, item) => {
      item.cancel()
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
      view.setBounds(normalizeBounds(bounds))
    }
  },

  async navigate(appId, url) {
    const view = appViews.get(appId)
    if (view) {
      await view.webContents.loadURL(url)
    }
  },

  async getURL(appId) {
    return getAppWebContents(appId)?.getURL() ?? ''
  },

  async getTitle(appId) {
    return getAppWebContents(appId)?.getTitle() ?? ''
  },

  async isLoading(appId) {
    return getAppWebContents(appId)?.isLoading() ?? false
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
    const wc = getAppWebContents(appId)
    if (!wc) return Buffer.alloc(0)
    const image = await wc.capturePage()
    return image.toPNG()
  },

  async executeJavaScript(appId, code) {
    const wc = getAppWebContents(appId)
    if (!wc) return undefined
    return wc.executeJavaScript(code)
  },

  async injectBridgeScript(appId, script) {
    const wc = getAppWebContents(appId)
    if (wc) {
      await wc.executeJavaScript(script)
    }
  },

  async getElements(appId) {
    const wc = getAppWebContents(appId)
    if (!wc) {
      console.log('[DOM] getElements: no webContents for', appId)
      return []
    }
    try {
      // Try bridge first — if missing, re-inject it
      const hasBridge = await wc.executeJavaScript('typeof window.__maia_bridge !== "undefined"') as boolean
      if (!hasBridge && bridgeScript) {
        console.log('[DOM] Bridge missing, re-injecting for', appId)
        await wc.executeJavaScript(bridgeScript)
      }

      let result = await wc.executeJavaScript(
        'window.__maia_bridge ? window.__maia_bridge.getElements() : []',
      ) as DOMElement[]

      // Fallback: comprehensive direct DOM query
      if (result.length === 0) {
        result = await wc.executeJavaScript(`
          (function() {
            var selectors = 'a[href],button,input,textarea,select,[role="button"],[role="link"],[role="textbox"],[role="searchbox"],[role="tab"],[role="menuitem"],[role="checkbox"],[role="radio"],[contenteditable="true"]';
            var els = document.querySelectorAll(selectors);
            var results = [];
            for (var i = 0; i < els.length && results.length < 50; i++) {
              var el = els[i];
              if (el.offsetParent === null && el.tagName !== 'BODY') continue;
              var rect = el.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) continue;

              var selector = el.id ? '#' + el.id : '';
              if (!selector) {
                var tag = el.tagName.toLowerCase();
                var cls = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/).filter(function(c){return c.length<30}).slice(0,2) : [];
                selector = cls.length > 0 ? tag + '.' + cls.join('.') : tag;
                var parent = el.parentElement;
                if (parent) {
                  var siblings = Array.from(parent.children).filter(function(c){return c.tagName===el.tagName});
                  if (siblings.length > 1) selector += ':nth-child(' + (siblings.indexOf(el)+1) + ')';
                }
              }

              results.push({
                role: el.getAttribute('role') || el.tagName.toLowerCase(),
                label: el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title') || '',
                text: (el.textContent || '').trim().substring(0, 100),
                selector: selector,
                position: { x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2) },
                size: { width: Math.round(rect.width), height: Math.round(rect.height) },
                value: el.value || '',
                tagName: el.tagName.toLowerCase()
              });
            }
            return results;
          })()
        `) as DOMElement[]
        if (result.length > 0) {
          console.log('[DOM] getElements (direct fallback):', result.length, 'elements')
        }
      }

      if (result.length > 0) {
        console.log('[DOM] getElements:', result.length, 'elements')
      }
      return result
    } catch (e) {
      console.log('[DOM] getElements error:', (e as Error).message)
      return []
    }
  },

  async clickElement(appId, selector) {
    const wc = getAppWebContents(appId)
    if (!wc) return false
    try {
      const result = await wc.executeJavaScript(`
        (function() {
          var sel = ${JSON.stringify(selector)};
          var el = null;
          try { el = document.querySelector(sel); } catch(e) { /* invalid selector, try text match */ }
          if (!el) {
            var all = document.querySelectorAll('a,button,input,[role="button"],[role="link"],[role="tab"],[role="menuitem"],h3');
            for (var i = 0; i < all.length; i++) {
              var txt = (all[i].textContent || '').trim();
              if (txt && (txt.includes(sel) || txt.toLowerCase().includes(sel.toLowerCase()))) {
                el = all[i]; break;
              }
            }
          }
          if (!el) return false;

          var rect = el.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 };

          el.dispatchEvent(new PointerEvent('pointerover', opts));
          el.dispatchEvent(new MouseEvent('mouseover', opts));
          el.dispatchEvent(new PointerEvent('pointerdown', opts));
          el.dispatchEvent(new MouseEvent('mousedown', opts));
          if (el.focus) el.focus();
          el.dispatchEvent(new PointerEvent('pointerup', opts));
          el.dispatchEvent(new MouseEvent('mouseup', opts));
          el.dispatchEvent(new MouseEvent('click', opts));
          return true;
        })()
      `) as boolean
      console.log('[ACTION] click', selector, ':', result)
      return result
    } catch (e) {
      console.log('[ACTION] click error for selector:', selector, '-', (e as Error).message)
      return false
    }
  },

  async typeInElement(appId, selector, text) {
    const wc = getAppWebContents(appId)
    if (!wc) return false
    try {
      const result = await wc.executeJavaScript(`
        (function() {
          var el = document.querySelector(${JSON.stringify(selector)});
          if (!el) {
            var inputs = document.querySelectorAll('input[type="text"],input[type="search"],input:not([type]),textarea,[contenteditable="true"],[role="textbox"],[role="searchbox"]');
            for (var i = 0; i < inputs.length; i++) {
              if (inputs[i].offsetParent !== null) { el = inputs[i]; break; }
            }
          }
          if (!el) return false;

          el.focus();
          el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

          // Clear existing value using select-all + delete (works with React)
          if ('value' in el && el.value) {
            el.select();
            document.execCommand('delete');
          } else if (el.getAttribute('contenteditable') === 'true') {
            el.textContent = '';
          }

          // Use execCommand insertText — fires proper InputEvent for React controlled inputs
          var text = ${JSON.stringify(text)};
          if (document.execCommand('insertText', false, text)) {
            return true;
          }

          // Fallback: native setter + InputEvent for older browsers
          var nativeSetter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(el), 'value'
          );
          if (nativeSetter && nativeSetter.set) {
            nativeSetter.set.call(el, text);
          } else {
            el.value = text;
          }
          el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()
      `) as boolean
      console.log('[ACTION] type', selector, '=', text, ':', result)
      return result
    } catch (e) {
      console.log('[ACTION] type error:', (e as Error).message)
      return false
    }
  },

  async scrollToElement(appId, selector) {
    const wc = getAppWebContents(appId)
    if (!wc) return false
    try {
      // Try bridge first (has human-like flick scrolling)
      const hasBridge = await wc.executeJavaScript('typeof window.__maia_bridge !== "undefined"') as boolean
      if (hasBridge) {
        const result = await wc.executeJavaScript(
          `window.__maia_bridge.scrollToElement(${JSON.stringify(selector)})`,
        ) as boolean
        return result
      }

      // Fallback: basic smooth scroll
      const result = await wc.executeJavaScript(`
        (function() {
          var sel = ${JSON.stringify(selector)};
          if (sel === 'down' || sel === 'body') { window.scrollBy({top: window.innerHeight * 0.6, behavior: 'smooth'}); return true; }
          if (sel === 'up') { window.scrollBy({top: -window.innerHeight * 0.6, behavior: 'smooth'}); return true; }
          var el = document.querySelector(sel);
          if (el) { el.scrollIntoView({behavior:'smooth',block:'center'}); return true; }
          return false;
        })()
      `) as boolean
      return result
    } catch {
      return false
    }
  },

  async sendNativeKeyPress(appId, key) {
    const wc = getAppWebContents(appId)
    if (!wc) return false
    try {
      // Electron sendInputEvent needs different values for keyDown/keyUp vs char
      // keyDown/keyUp use key names, char uses the actual character
      const keyNameMap: Record<string, string> = {
        Enter: 'Return',
        Tab: 'Tab',
        Escape: 'Escape',
        Backspace: 'Backspace',
        Delete: 'Delete',
        ArrowUp: 'Up',
        ArrowDown: 'Down',
        ArrowLeft: 'Left',
        ArrowRight: 'Right',
        Space: ' ',
      }
      const charMap: Record<string, string> = {
        Enter: '\r',
        Tab: '\t',
        Space: ' ',
      }
      const keyName = keyNameMap[key] ?? key
      const charValue = charMap[key] ?? key

      // Send trusted OS-level key events via Electron API
      wc.sendInputEvent({ type: 'keyDown', keyCode: keyName })
      if (charMap[key]) {
        wc.sendInputEvent({ type: 'char', keyCode: charValue })
      }
      wc.sendInputEvent({ type: 'keyUp', keyCode: keyName })
      console.log('[ACTION] nativeKeyPress', key, '→', keyName)
      return true
    } catch (e) {
      console.log('[ACTION] nativeKeyPress error:', (e as Error).message)
      return false
    }
  },
}

/** Get webContents for an app — from BrowserView or by scanning all webContents */
function getAppWebContents(appId: string): Electron.WebContents | undefined {
  // Try BrowserView first
  const view = appViews.get(appId)
  if (view) return view.webContents

  // Try finding the webview by its registered ID using getAllWebContents
  const wcId = appWebContentsIds.get(appId)
  if (wcId) {
    const allWc = webContents.getAllWebContents()
    const match = allWc.find((wc) => wc.id === wcId && !wc.isDestroyed())
    if (match) return match
  }

  // Fallback: find any webview-type webContents (not the main window)
  const allWc = webContents.getAllWebContents()
  const webviewWc = allWc.find((wc) => wc.getType() === 'webview' && !wc.isDestroyed())
  if (webviewWc) return webviewWc

  return undefined
}

// ── Intelligence Layer (initialized in init()) ───────────────

// ── IPC Handlers ───────────────────────────────────────────────

function setupIPC(): void {
  // App management
  ipcMain.handle('app:list', () => {
    return { apps: registry.getAllApps() }
  })

  ipcMain.handle('app:install', async (_event, payload: { url: string; name: string; icon: string; manifestId?: string }) => {
    const appId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    // Check if we have a pre-built manifest for this app
    let manifestId = payload.manifestId
    const hasManifest = manifestId && appManifests.some((m) => m.id === manifestId)

    // If no manifest exists, generate one using LLM knowledge
    if (!hasManifest && manifestGenerator) {
      try {
        const generated = await manifestGenerator.generate(payload.url, payload.name)
        appManifests.push(generated)
        manifestId = generated.id
        console.log(`Generated manifest for custom app: ${payload.name} → ${manifestId}`)
      } catch (error) {
        console.warn('Failed to generate manifest for custom app:', error)
      }
    }

    registry.installApp({
      id: appId,
      manifestId: manifestId ?? appId,
      name: payload.name,
      icon: payload.icon,
      url: payload.url,
      spaceId: 'default',
      installedAt: Date.now(),
    })

    // Don't create the BrowserView yet — it gets created when the user opens the app.
    // This prevents the BrowserView from covering the shell UI.

    mainWindow?.webContents.send('app:installed', { appId, name: payload.name, icon: payload.icon })
    return { appId }
  })

  ipcMain.handle('app:open', async (_event, payload: { appId: string }) => {
    registry.updateLastOpened(payload.appId)
    const appData = registry.getApp(payload.appId)
    if (!appData) return { success: false }

    // The shell renders the app via <webview> tag.
    // Find the webview's webContents by URL after a delay (webview needs time to load).
    mainWindow?.webContents.send('app:opened', { appId: payload.appId })

    // Auto-discover webview webContents after it loads
    setTimeout(() => {
      const allWc = webContents.getAllWebContents()
      for (const wc of allWc) {
        try {
          const url = wc.getURL()
          if (url.includes(appData.url.replace('https://', '').replace('http://', '').split('/')[0])) {
            if (!appWebContentsIds.has(payload.appId)) {
              appWebContentsIds.set(payload.appId, wc.id)
              console.log('Auto-discovered webContentsId for', payload.appId, ':', wc.id, 'URL:', url)

              // Inject bridge script
              if (bridgeScript) {
                wc.executeJavaScript(bridgeScript).then(() => {
                  console.log('Bridge injected successfully for', payload.appId)
                  return wc.executeJavaScript('typeof window.__maia_bridge')
                }).then((result) => {
                  console.log('Bridge check:', result)
                  // Register workspace — app is ready for agents
                  workspaceRegistry.register({
                    appId: payload.appId,
                    appName: appData?.name ?? '',
                    appUrl: appData?.url ?? '',
                    webContentsId: wc.id,
                    bridgeReady: true,
                    lastActivity: Date.now(),
                  })
                }).catch((e) => {
                  console.log('Bridge injection failed:', (e as Error).message)
                })
                wc.on('did-finish-load', () => {
                  wc.executeJavaScript(bridgeScript).then(() => {
                    console.log('Bridge re-injected on navigation')
                    workspaceRegistry.markReady(payload.appId)
                  }).catch(() => {})
                })
              }
            }
          }
        } catch {
          // webContents may be destroyed
        }
      }
    }, 3000)
    return { success: true }
  })

  ipcMain.handle('app:close', async (_event, payload: { appId: string }) => {
    if (appViews.has(payload.appId)) {
      await containerAPI.destroy(payload.appId)
    }
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
    if (appViews.has(payload.appId)) {
      await containerAPI.setBounds(payload.appId, payload.bounds)
    }
    return { success: true }
  })

  // Register webview webContentsId so the Brain can access it
  ipcMain.handle('app:registerWebContents', (_event, payload: { appId: string; webContentsId: number }) => {
    appWebContentsIds.set(payload.appId, payload.webContentsId)
    console.log('Registered webContentsId for', payload.appId, ':', payload.webContentsId)

    // Inject bridge script into the webview
    const wc = webContents.fromId(payload.webContentsId)
    if (wc && bridgeScript) {
      wc.executeJavaScript(bridgeScript).catch(() => {})

      // Re-inject on navigation
      wc.on('did-finish-load', () => {
        wc.executeJavaScript(bridgeScript).catch(() => {})
      })

      // Track network traffic for NetworkBrain
      wc.session.webRequest.onCompleted(
        { urls: ['*://*/*'] },
        (details) => {
          if (details.statusCode >= 200 && details.statusCode < 300) {
            const contentType = details.responseHeaders?.['content-type']?.[0] ?? ''
            if (contentType.includes('json')) {
              networkBrain.recordRequest({
                url: details.url,
                method: details.method,
                statusCode: details.statusCode,
                contentType,
                body: undefined,
                timestamp: Date.now(),
                appId: payload.appId,
              })
            }
          }
        },
      )
    }

    return { success: true }
  })

  // Brain
  ipcMain.handle('brain:execute', async (_event, payload: { appId: string; command: string }) => {
    // Look up the app's manifest for navigation guides
    const app = registry.getAllApps().find((a) => a.id === payload.appId)
    const manifest = app ? appManifests.find((m) => m.id === app.manifestId) : undefined

    const brain = new Brain(intelligence, eventBus, llm, {
      taskId: `task_${Date.now()}`,
      appId: payload.appId,
      messageBus,
      appNavigation: manifest?.navigation,
      appName: manifest?.name ?? app?.name,
      helpUrl: manifest?.helpUrl,
    })

    // Events are forwarded globally via setupEventForwarding()
    brain.run(payload.command).then((summary) => {
      mainWindow?.webContents.send('brain:taskCompleted', { summary })
    }).catch(() => {})

    return { success: true }
  })

  ipcMain.handle('brain:startTask', async (_event, payload: { description: string }) => {
    console.log('brain:startTask received:', payload.description)

    // Stop any running orchestrator
    if (orchestrator?.isRunning()) {
      orchestrator.stop()
    }

    // Create fresh orchestrator
    try {
      orchestrator = new Orchestrator(
        intelligence, eventBus, llm, messageBus,
        () => registry.getAllApps(),
        appManifests,
        workspaceRegistry,
      )
      console.log('Orchestrator created, apps:', registry.getAllApps().length)
    } catch (e) {
      console.error('Failed to create orchestrator:', e)
    }

    console.log('Starting orchestrator for:', payload.description)
    orchestrator.start(payload.description).then((summary) => {
      console.log('Task completed:', summary)
      mainWindow?.webContents.send('brain:taskCompleted', { summary })
    }).catch((error) => {
      console.error('Orchestrator error:', error)
      mainWindow?.webContents.send('brain:error', { message: String(error) })
    })

    return { taskId: `task_${Date.now()}` }
  })

  ipcMain.handle('brain:stop', () => {
    orchestrator?.stop()
    return { success: true }
  })

  ipcMain.handle('brain:getStatus', () => ({
    running: orchestrator?.isRunning() ?? false,
  }))

  // Chat
  ipcMain.handle('chat:send', (_event, payload: IPCCommands['chat:send']) => {
    const msg = messageBus.sendUserMessage(payload.message, 'active', payload.replyToId)
    // message.sent event is published by messageBus.send() and forwarded
    // to the renderer via setupEventForwarding — no direct send needed

    // Route user message through orchestrator for agent awareness
    if (orchestrator?.isRunning()) {
      orchestrator.handleUserMessage(msg)
    }

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

// ── Global Event Forwarding (backend → renderer) ──────────────

function setupEventForwarding(): void {
  eventBus.subscribePattern('brain.*', (event) => {
    if (event.type === 'brain.thinking') {
      mainWindow?.webContents.send('brain:thinking', { thought: (event as { thought: string }).thought })
    }
    if (event.type === 'brain.plan_created') {
      mainWindow?.webContents.send('brain:planCreated', { steps: (event as { steps: unknown[] }).steps })
    }
    if (event.type === 'brain.plan_updated') {
      const e = event as { stepIndex: number; status: string }
      mainWindow?.webContents.send('brain:planUpdated', { stepIndex: e.stepIndex, status: e.status })
    }
    if (event.type === 'brain.decision') {
      mainWindow?.webContents.send('brain:action', { action: (event as { action: unknown }).action, appId: '' })
    }
    if (event.type === 'brain.error') {
      mainWindow?.webContents.send('brain:error', { message: (event as { message: string }).message })
    }
  })

  eventBus.subscribePattern('message.*', (event) => {
    if (event.type === 'message.sent') {
      mainWindow?.webContents.send('chat:message', { message: (event as { message: unknown }).message })
    }
  })

  eventBus.subscribePattern('orchestrator.*', (event) => {
    if (event.type === 'orchestrator.agent_started') {
      const e = event as { agentId: string; appId: string; description: string }
      mainWindow?.webContents.send('brain:agentStarted', { agentId: e.agentId, appId: e.appId, description: e.description })
    }
    if (event.type === 'orchestrator.agent_completed') {
      const e = event as { agentId: string; summary: string }
      mainWindow?.webContents.send('brain:agentCompleted', { agentId: e.agentId, summary: e.summary })
    }
    if (event.type === 'orchestrator.theatre_arrange') {
      const e = event as { layout: unknown[]; focusAppId?: string }
      mainWindow?.webContents.send('theatre:arrange', { layout: e.layout, focusAppId: e.focusAppId })
    }
    if (event.type === 'orchestrator.theatre_focus') {
      const e = event as { appId: string }
      mainWindow?.webContents.send('theatre:focus', { appId: e.appId })
    }
  })

  eventBus.subscribePattern('cost.*', () => {
    // Cost updates forwarded generically
    mainWindow?.webContents.send('cost:update', { totalCost: 0, budget: 5.0 })
  })
}

// ── App Manifests ──────────────────────────────────────────────

async function loadAppStore(): Promise<void> {
  appManifests = await loadManifests(MANIFEST_DIR)
  manifestGenerator = new ManifestGenerator(llm, MANIFEST_DIR)
  // Store manifests for the app store UI
  ipcMain.handle('appstore:getManifests', () => appManifests)
}

// ── Register installed apps as workspaces ──────────────────────
// Installed = ready. The user shouldn't think about bridge states.

function registerInstalledApps(): void {
  const apps = registry.getAllApps()
  for (const app of apps) {
    // Check if this app already has a webContents (still open from previous session)
    const existingWcId = appWebContentsIds.get(app.id)
    const alreadyOpen = existingWcId !== undefined

    workspaceRegistry.register({
      appId: app.id,
      appName: app.name,
      appUrl: app.url,
      webContentsId: existingWcId ?? 0,
      bridgeReady: alreadyOpen, // If already open, bridge was already injected
      lastActivity: Date.now(),
    })
  }
  console.log(`Registered ${apps.length} installed apps as workspaces (${apps.filter((a) => appWebContentsIds.has(a.id)).length} already open)`)
}

// ── Window Creation ────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    center: true,
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#090909',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  })

  // Load the shell
  const shellIndex = join(SHELL_DIST, 'index.html')

  if (existsSync(shellIndex)) {
    mainWindow.loadFile(shellIndex)
  } else {
    mainWindow.loadURL('http://localhost:5173')
  }


  mainWindow.on('closed', () => {
    mainWindow = undefined
  })

}

// ── App Lifecycle ──────────────────────────────────────────────

// Prevent ALL new windows from any webContents — everything stays inline
app.on('web-contents-created', (_event, wc) => {
  wc.setWindowOpenHandler(({ url }) => {
    // Navigate the originating webContents to the URL instead of opening a popup
    wc.loadURL(url)
    return { action: 'deny' }
  })
})

app.whenReady().then(async () => {
  init()
  setupIPC()
  setupEventForwarding()
  await loadAppStore()
  registerInstalledApps()
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
