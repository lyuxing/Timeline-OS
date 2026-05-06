import { randomUUID } from 'crypto'
import { getDatabase } from './database.js'
import type { Developer } from '../models/types.js'

const DEVELOPER_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e',
  '#06b6d4', '#6366f1', '#f43f5e', '#84cc16', '#14b8a6'
]

export function createDeveloper(name: string, avatar?: string): Developer {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  const maxPos = db.prepare('SELECT COALESCE(MAX(ROWID), -1) as max FROM developers').get() as { max: number }
  const color = DEVELOPER_COLORS[maxPos.max % DEVELOPER_COLORS.length]

  const stmt = db.prepare(`
    INSERT INTO developers (id, name, avatar, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, name, avatar || null, color, now, now)

  return {
    id,
    name,
    avatar,
    color,
    createdAt: now,
    updatedAt: now,
  }
}

export function getDeveloper(id: string): Developer | null {
  const db = getDatabase()
  return db.prepare('SELECT * FROM developers WHERE id = ?').get(id) as Developer | null
}

export function listDevelopers(): Developer[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM developers ORDER BY created_at').all() as Developer[]
}

export function updateDeveloper(id: string, updates: {
  name?: string
  avatar?: string
}): Developer | null {
  const db = getDatabase()
  const now = new Date().toISOString()

  const fields: string[] = ['updated_at = ?']
  const values: (string | null)[] = [now]

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar = ?')
    values.push(updates.avatar)
  }

  values.push(id)

  const result = db.prepare(`UPDATE developers SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  if (result.changes === 0) return null
  return getDeveloper(id)
}

export function deleteDeveloper(id: string): boolean {
  const db = getDatabase()
  // 不能删除默认开发者
  if (id === 'default-dev') return false
  const result = db.prepare('DELETE FROM developers WHERE id = ?').run(id)
  return result.changes > 0
}
