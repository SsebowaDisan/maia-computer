import type { ChatMessage } from '@maia/shared'
import Database from 'better-sqlite3'

export class MessageHistory {
  private readonly db: Database.Database | undefined
  private readonly fallback: ChatMessage[] = []

  constructor(dbPath?: string) {
    if (dbPath) {
      try {
        this.db = new Database(dbPath)
        this.db.pragma('journal_mode = WAL')
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            intent TEXT NOT NULL,
            message TEXT NOT NULL,
            reply_to_id TEXT,
            context TEXT NOT NULL DEFAULT '{}',
            attachments TEXT,
            timestamp INTEGER NOT NULL
          )
        `)
        ensureColumn(this.db, 'messages', 'reply_to_id', 'TEXT')
      } catch {
        // Fall back to in-memory if SQLite fails
      }
    }
  }

  add(message: ChatMessage): void {
    if (this.db) {
      this.db.prepare(`
        INSERT OR REPLACE INTO messages (id, sender, receiver, intent, message, reply_to_id, context, attachments, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        message.id,
        message.sender,
        message.receiver,
        message.intent,
        message.message,
        message.replyToId,
        JSON.stringify(message.context),
        message.attachments ? JSON.stringify(message.attachments) : undefined,
        message.timestamp,
      )
      return
    }

    this.fallback.push(message)
  }

  getRecent(count: number): ChatMessage[] {
    if (this.db) {
      const rows = this.db.prepare(
        'SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?',
      ).all(count) as MessageRow[]
      return rows.reverse().map(rowToMessage)
    }

    return this.fallback.slice(-count)
  }

  getAll(): ChatMessage[] {
    if (this.db) {
      const rows = this.db.prepare(
        'SELECT * FROM messages ORDER BY timestamp ASC',
      ).all() as MessageRow[]
      return rows.map(rowToMessage)
    }

    return [...this.fallback]
  }

  getByAgent(agentId: string): ChatMessage[] {
    if (this.db) {
      const rows = this.db.prepare(
        'SELECT * FROM messages WHERE sender = ? OR receiver = ? ORDER BY timestamp ASC',
      ).all(agentId, agentId) as MessageRow[]
      return rows.map(rowToMessage)
    }

    return this.fallback.filter(
      (m) => m.sender === agentId || m.receiver === agentId,
    )
  }

  getByTask(taskId: string): ChatMessage[] {
    if (this.db) {
      const rows = this.db.prepare(
        'SELECT * FROM messages WHERE context LIKE ? ORDER BY timestamp ASC',
      ).all(`%"taskId":"${taskId}"%`) as MessageRow[]
      return rows.map(rowToMessage)
    }

    return this.fallback.filter((m) => m.context.taskId === taskId)
  }

  getCount(): number {
    if (this.db) {
      const row = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
      return row.count
    }

    return this.fallback.length
  }

  clear(): void {
    if (this.db) {
      this.db.exec('DELETE FROM messages')
      return
    }

    this.fallback.length = 0
  }

  close(): void {
    this.db?.close()
  }
}

interface MessageRow {
  id: string
  sender: string
  receiver: string
  intent: string
  message: string
  reply_to_id: string | null
  context: string
  attachments: string | null
  timestamp: number
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    sender: row.sender,
    receiver: row.receiver,
    intent: row.intent as ChatMessage['intent'],
    message: row.message,
    replyToId: row.reply_to_id ?? undefined,
    context: JSON.parse(row.context) as ChatMessage['context'],
    attachments: row.attachments ? JSON.parse(row.attachments) as ChatMessage['attachments'] : undefined,
    timestamp: row.timestamp,
  }
}

function ensureColumn(
  db: Database.Database,
  tableName: string,
  columnName: string,
  columnDefinition: string,
): void {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
  if (columns.some((column) => column.name === columnName)) {
    return
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`)
}
