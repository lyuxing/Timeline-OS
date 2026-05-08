import { getDatabase } from './database'
import type { Team } from '../models/types'
import { randomUUID } from 'crypto'

export function createTeam(name: string, createdBy: string): Team {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO teams (id, name, created_by, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, name, createdBy, now)

  return getTeamById(id)!
}

export function getTeamById(id: string): Team | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as any
  if (!row) return undefined
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

export function getTeamsByUser(userId: string): Team[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT t.* FROM teams t
    JOIN users u ON u.team_id = t.id
    WHERE u.id = ?
  `).all(userId) as any[]
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at
  }))
}

export function updateTeam(id: string, name: string): Team | undefined {
  const db = getDatabase()
  db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name, id)
  return getTeamById(id)
}

export function deleteTeam(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM teams WHERE id = ?').run(id)
  return result.changes > 0
}

export function getTeamMemberCount(teamId: string): number {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as count FROM users WHERE team_id = ?').get(teamId) as { count: number }
  return row.count
}
