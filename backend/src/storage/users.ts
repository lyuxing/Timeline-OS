import { getDatabase } from './database'
import type { User } from '../models/types'
import { randomUUID } from 'crypto'

export function createUser(email: string, password: string, name: string, teamId?: string, role: 'admin' | 'member' = 'member'): User {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()
  const bcrypt = require('bcrypt')
  const passwordHash = bcrypt.hashSync(password, 10)

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, team_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, passwordHash, name, role, teamId || null, now, now)

  return getUserById(id)!
}

export function getUserById(id: string): User | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
  if (!row) return undefined
  return mapRowToUser(row)
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
  if (!row) return undefined
  return mapRowToUser(row)
}

export function getUserByUsernameOrEmail(usernameOrEmail: string): User | undefined {
  const db = getDatabase()
  // 先尝试用邮箱查找，再用用户名查找
  const row = db.prepare('SELECT * FROM users WHERE email = ? OR name = ?').get(usernameOrEmail, usernameOrEmail) as any
  if (!row) return undefined
  return mapRowToUser(row)
}

export function validatePassword(user: User, password: string): boolean {
  const bcrypt = require('bcrypt')
  return bcrypt.compareSync(password, user.passwordHash)
}

export function updateUser(id: string, updates: { name?: string; passwordHash?: string; teamId?: string }): User | undefined {
  const db = getDatabase()
  const now = new Date().toISOString()

  if (updates.name) {
    db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(updates.name, now, id)
  }
  if (updates.passwordHash) {
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(updates.passwordHash, now, id)
  }
  if (updates.teamId !== undefined) {
    db.prepare('UPDATE users SET team_id = ?, updated_at = ? WHERE id = ?').run(updates.teamId || null, now, id)
  }

  return getUserById(id)
}

export function setUserRole(id: string, role: 'admin' | 'member'): User | undefined {
  const db = getDatabase()
  const now = new Date().toISOString()
  db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, now, id)
  return getUserById(id)
}

export function getUsersByTeam(teamId: string): User[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM users WHERE team_id = ? ORDER BY created_at').all(teamId) as any[]
  return rows.map(mapRowToUser)
}

export function getAllUsers(): User[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at').all() as any[]
  return rows.map(mapRowToUser)
}

export function deleteUser(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id)
  return result.changes > 0
}

export function getUserCount(): number {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  return row.count
}

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    teamId: row.team_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
