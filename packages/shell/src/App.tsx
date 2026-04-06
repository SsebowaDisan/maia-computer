import { useEffect } from 'react'

import { Dock } from './component/dock/Dock'
import { Toast } from './component/notification/Toast'
import { Spotlight } from './component/spotlight/Spotlight'
import { BrainStatus } from './component/ui/BrainStatus'
import { WindowLayer } from './component/window/WindowLayer'
import { useBrainEvents } from './hook/useBrainEvents'
import { useChat } from './hook/useChat'
import { useDock } from './hook/useDock'
import { useNotifications } from './hook/useNotifications'
import { useShellActions } from './hook/useShellActions'
import { useShellBootstrap } from './hook/useShellBootstrap'
import { useSpaces } from './hook/useSpaces'
import { useSpotlight } from './hook/useSpotlight'
import { useWindowManager } from './hook/useWindowManager'
import { HomeScreen } from './screen/HomeScreen'
import { buildDockSections } from './shellItems'
import { useAppStore } from './store/appStore'
import { useDockStore } from './store/dockStore'
import { useSettingsStore } from './store/settingsStore'
import { useTaskStore } from './store/taskStore'

export function App() {
  const { messages, resetUnreadCount, sendMessage } = useChat()
  const { toasts } = useNotifications()
  const { activeSpaceId } = useSpaces()
  const { isOpen, query, results, closeSpotlight, setQuery } = useSpotlight()
  const {
    closeWindow,
    focusWindow,
    openAppWindow,
    openBuiltinWindow,
    snapWindow,
    toggleMinimized,
    updateWindowBounds,
    windows,
  } = useWindowManager()
  const installedApps = useAppStore((state) => state.installedApps)
  const badges = useDockStore((state) => state.badges)
  const pinItem = useDockStore((state) => state.pinItem)
  const pinnedIds = useDockStore((state) => state.pinnedIds)
  const recentIds = useDockStore((state) => state.recentIds)
  const unpinItem = useDockStore((state) => state.unpinItem)
  const settings = useSettingsStore((state) => state.settings)
  const plan = useTaskStore((state) => state.plan)
  const running = useTaskStore((state) => state.running)
  const research = useTaskStore((state) => state.research)
  const taskDescription = useTaskStore((state) => state.taskDescription)
  const thought = useTaskStore((state) => state.thought)
  const hasVisibleWindows = windows.some((window) => !window.isMinimized)
  const dock = useDock(hasVisibleWindows)

  useBrainEvents()
  const {
    handleInstallApp,
    handleStartTask,
    handleUpdateSetting,
    openDockItem,
    runCommand,
  } = useShellActions({
    installedApps,
    openAppWindow,
    openBuiltinWindow,
  })

  useShellBootstrap(activeSpaceId)

  useEffect(() => {
    if (windows.some((window) => window.id === 'team-chat' && !window.isMinimized)) {
      resetUnreadCount()
    }
  }, [resetUnreadCount, windows])

  const { itemsLeft, itemsRight } = buildDockSections(installedApps, pinnedIds, recentIds)

  const runningIds = windows.filter((window) => !window.isMinimized).map((window) => window.id)

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {!hasVisibleWindows ? (
        <div className="min-h-0 flex-1">
          <HomeScreen onSubmitTask={handleStartTask} />
        </div>
      ) : null}
      <WindowLayer
        installedApps={installedApps}
        messages={messages}
        onCloseWindow={(windowId) => { void closeWindow(windowId) }}
        onCommand={(window, command) => { void runCommand(window.appId, command) }}
        onFocusWindow={focusWindow}
        onInstallApp={handleInstallApp}
        onMinimizeWindow={toggleMinimized}
        onOpenItem={openDockItem}
        onSendMessage={sendMessage}
        onSnapWindow={snapWindow}
        onToggleMaximize={(window) => { snapWindow(window.id, 'maximized') }}
        onUpdateBounds={updateWindowBounds}
        onUpdateSetting={handleUpdateSetting}
        settings={settings}
        windows={windows}
      />
      <Spotlight
        isOpen={isOpen}
        onClose={closeSpotlight}
        onQueryChange={setQuery}
        onSelect={(appId) => {
          if (appId === 'ai-task') {
            void handleStartTask(query)
          } else {
            openDockItem(appId)
          }
          closeSpotlight()
        }}
        query={query}
        results={results}
      />
      <div className="fixed right-6 top-6 z-[70] flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
      <Dock
        badges={badges}
        isVisible={dock.isVisible}
        itemsLeft={itemsLeft}
        itemsRight={itemsRight}
        onOpenItem={openDockItem}
        onPointerEnter={dock.handlePointerEnter}
        onPointerLeave={dock.handlePointerLeave}
        onTogglePin={(itemId) => {
          if (pinnedIds.includes(itemId)) {
            unpinItem(itemId)
            return
          }

          pinItem(itemId)
        }}
        pinnedIds={pinnedIds}
        runningIds={runningIds}
      />
      <BrainStatus
        currentStep={plan.find((s) => s.status === 'in_progress')?.description ?? plan.find((s) => s.status === 'pending')?.description}
        isVisible={running}
        plan={plan}
        research={research}
        taskDescription={taskDescription}
        thought={thought}
      />
    </div>
  )
}
