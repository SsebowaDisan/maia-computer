import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { pino } from 'pino'

const logger = pino({ name: 'session-store' })

const ALGORITHM = 'aes-256-gcm'

export class SessionStore {
  private readonly baseDir: string
  private readonly key: Buffer

  constructor(baseDir: string, encryptionKey?: string) {
    this.baseDir = baseDir
    // Derive a 32-byte key from the provided key or a default
    const raw = encryptionKey ?? 'maia-default-key-change-in-production'
    this.key = Buffer.alloc(32)
    Buffer.from(raw).copy(this.key)
  }

  async saveSession(appId: string, cookies: string): Promise<void> {
    await mkdir(this.baseDir, { recursive: true })
    const encrypted = this.encrypt(cookies)
    const filePath = join(this.baseDir, `${appId}.session`)
    await writeFile(filePath, encrypted, 'utf-8')
    logger.debug({ appId }, 'Session saved')
  }

  async loadSession(appId: string): Promise<string | undefined> {
    try {
      const filePath = join(this.baseDir, `${appId}.session`)
      const encrypted = await readFile(filePath, 'utf-8')
      return this.decrypt(encrypted)
    } catch {
      return undefined
    }
  }

  async deleteSession(appId: string): Promise<void> {
    try {
      const filePath = join(this.baseDir, `${appId}.session`)
      await unlink(filePath)
      logger.debug({ appId }, 'Session deleted')
    } catch {
      // File may not exist
    }
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, this.key, iv)
    let encrypted = cipher.update(text, 'utf-8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
  }

  private decrypt(text: string): string {
    const [ivHex, authTagHex, encrypted] = text.split(':')
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted format')
    }
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, this.key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')
    return decrypted
  }
}
