import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { AppManifest } from '@maia/shared'
import { pino } from 'pino'

const logger = pino({ name: 'app-manifest' })

export async function loadManifests(manifestDir: string): Promise<AppManifest[]> {
  const manifests: AppManifest[] = []

  try {
    const files = await readdir(manifestDir)
    const yamlFiles = files.filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))

    for (const file of yamlFiles) {
      try {
        const content = await readFile(join(manifestDir, file), 'utf-8')
        const parsed = parseYaml(content) as Record<string, unknown>
        const manifest = validateManifest(parsed)
        if (manifest) {
          manifests.push(manifest)
        }
      } catch (error) {
        logger.warn({ file, error }, 'Failed to parse manifest')
      }
    }
  } catch (error) {
    logger.error({ manifestDir, error }, 'Failed to read manifest directory')
  }

  logger.info({ count: manifests.length }, 'Loaded app manifests')
  return manifests
}

function validateManifest(raw: Record<string, unknown>): AppManifest | undefined {
  if (!raw.name || !raw.id || !raw.url) {
    return undefined
  }

  return {
    name: String(raw.name),
    id: String(raw.id),
    icon: String(raw.icon ?? '🌐'),
    url: String(raw.url),
    category: (raw.category as AppManifest['category']) ?? 'other',
    aiDescription: String(raw.ai_description ?? raw.aiDescription ?? ''),
    navigation: (raw.navigation as AppManifest['navigation']) ?? undefined,
    helpUrl: raw.help_url ? String(raw.help_url) : undefined,
  }
}
