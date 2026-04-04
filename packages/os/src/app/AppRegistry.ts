import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { pino } from 'pino'
import type { InstalledApp, Space } from '@maia/shared'

const logger = pino({ name: 'app-registry' })

export class AppRegistry {
  private readonly db: Database.Database

  constructor(dbPath: string) {
    // Ensure the directory exists
    mkdirSync(dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    this.createTables()
    logger.info({ dbPath }, 'App registry initialized')
  }

  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS apps (
        id TEXT PRIMARY KEY,
        manifestId TEXT NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        url TEXT NOT NULL,
        spaceId TEXT NOT NULL DEFAULT 'default',
        installedAt INTEGER NOT NULL,
        lastOpenedAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS spaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        aiContext TEXT NOT NULL DEFAULT '',
        createdAt INTEGER NOT NULL
      );

      INSERT OR IGNORE INTO spaces (id, name, aiContext, createdAt)
      VALUES ('default', 'Work', 'Professional workspace', ${Date.now()});
    `)
  }

  installApp(app: Omit<InstalledApp, 'lastOpenedAt'>): void {
    this.db.prepare(`
      INSERT INTO apps (id, manifestId, name, icon, url, spaceId, installedAt, lastOpenedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      app.id,
      app.manifestId,
      app.name,
      app.icon,
      app.url,
      app.spaceId,
      app.installedAt,
      app.installedAt,
    )
    logger.info({ appId: app.id, name: app.name }, 'App installed')
  }

  uninstallApp(appId: string): void {
    this.db.prepare('DELETE FROM apps WHERE id = ?').run(appId)
    logger.info({ appId }, 'App uninstalled')
  }

  updateLastOpened(appId: string): void {
    this.db.prepare('UPDATE apps SET lastOpenedAt = ? WHERE id = ?').run(Date.now(), appId)
  }

  getApp(appId: string): InstalledApp | undefined {
    return this.db.prepare('SELECT * FROM apps WHERE id = ?').get(appId) as InstalledApp | undefined
  }

  getAllApps(): InstalledApp[] {
    return this.db.prepare('SELECT * FROM apps ORDER BY lastOpenedAt DESC').all() as InstalledApp[]
  }

  getAppsBySpace(spaceId: string): InstalledApp[] {
    return this.db.prepare('SELECT * FROM apps WHERE spaceId = ? ORDER BY lastOpenedAt DESC').all(spaceId) as InstalledApp[]
  }

  getRecentApps(limit = 7): InstalledApp[] {
    return this.db.prepare('SELECT * FROM apps ORDER BY lastOpenedAt DESC LIMIT ?').all(limit) as InstalledApp[]
  }

  // Spaces
  createSpace(space: Omit<Space, 'appIds'>): void {
    this.db.prepare('INSERT INTO spaces (id, name, aiContext, createdAt) VALUES (?, ?, ?, ?)').run(
      space.id,
      space.name,
      space.aiContext,
      Date.now(),
    )
  }

  getSpaces(): Space[] {
    const rows = this.db.prepare('SELECT * FROM spaces').all() as Array<{ id: string; name: string; aiContext: string }>
    return rows.map((row) => ({
      ...row,
      appIds: this.getAppsBySpace(row.id).map((a) => a.id),
    }))
  }

  deleteSpace(spaceId: string): void {
    this.db.prepare('DELETE FROM spaces WHERE id = ?').run(spaceId)
  }

  close(): void {
    this.db.close()
  }
}
