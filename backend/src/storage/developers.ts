import { randomUUID } from 'crypto'
import { getDatabase } from './database.js'
import type { Developer } from '../models/types.js'

const DEVELOPER_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e',
  '#06b6d4', '#6366f1', '#f43f5e', '#84cc16', '#14b8a6'
]

export function createDeveloper(name: string, avatar?: string, userId?: string, teamId?: string): Developer {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  const maxPos = db.prepare('SELECT COALESCE(MAX(ROWID), -1) as max FROM developers').get() as { max: number }
  const color = DEVELOPER_COLORS[maxPos.max % DEVELOPER_COLORS.length]

  const stmt = db.prepare(`
    INSERT INTO developers (id, user_id, team_id, name, avatar, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, userId || null, teamId || null, name, avatar || null, color, now, now)

  return {
    id,
    userId,
    teamId,
    name,
    avatar,
    color,
    createdAt: now,
    updatedAt: now,
  }
}

export function getDeveloper(id: string): Developer | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM developers WHERE id = ?').get(id) as any
  if (!row) return null
  return mapRowToDeveloper(row)
}

export function getDeveloperByUserId(userId: string): Developer | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM developers WHERE user_id = ?').get(userId) as any
  if (!row) return null
  return mapRowToDeveloper(row)
}

export function listDevelopers(teamId?: string): Developer[] {
  const db = getDatabase()
  let rows: any[]
  if (teamId) {
    // 有团队：看团队的开发者 + 默认开发者
    rows = db.prepare('SELECT * FROM developers WHERE team_id = ? OR team_id IS NULL ORDER BY created_at').all(teamId)
  } else {
    // 无团队：只看没有团队归属的开发者
    rows = db.prepare('SELECT * FROM developers WHERE team_id IS NULL ORDER BY created_at').all()
  }
  return rows.map(mapRowToDeveloper)
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

function mapRowToDeveloper(row: any): Developer {
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    name: row.name,
    avatar: row.avatar,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
