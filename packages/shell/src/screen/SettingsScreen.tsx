import { Button } from '../component/ui/Button'

interface SettingsScreenProps {
  onUpdateSetting: (key: string, value: unknown) => Promise<void>
  settings: Record<string, unknown>
}

const SECTIONS = ['General', 'AI', 'Apps', 'Spaces', 'Privacy', 'About']

export function SettingsScreen({ onUpdateSetting, settings }: SettingsScreenProps) {
  return (
    <div className="grid h-full grid-cols-[220px_1fr] bg-chrome">
      <aside className="border-r border-border bg-surface p-4">
        <div className="space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section}
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-textSecondary transition hover:bg-elevated hover:text-white"
            >
              {section}
            </button>
          ))}
        </div>
      </aside>
      <main className="space-y-5 p-6">
        <section className="rounded-xl border border-border bg-elevated p-5">
          <h2 className="text-lg font-semibold text-textPrimary">General</h2>
          <p className="mt-2 text-sm text-textSecondary">Shell behavior and defaults.</p>
          <div className="mt-5 flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
            <div>
              <p className="text-sm text-textPrimary">Auto-hide dock</p>
              <p className="text-xs text-textSecondary">Hide the dock until the pointer hits the bottom edge.</p>
            </div>
            <Button
              onClick={() => {
                void onUpdateSetting('autoHideDock', !(settings.autoHideDock as boolean))
              }}
            >
              {settings.autoHideDock ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
