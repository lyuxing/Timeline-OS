import { getDatabase } from './database'
import type { TeamInvitation } from '../models/types'
import { randomUUID } from 'crypto'

export function createTeamInvitation(
  email: string,
  teamId: string,
  teamName: string,
  role: 'admin' | 'member',
  createdBy: string
): TeamInvitation {
  const db = getDatabase()
  const id = randomUUID()
  const token = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  db.prepare(`
    INSERT INTO team_invitations (id, email, team_id, team_name, role, token, created_by, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, teamId, teamName, role, token, createdBy, expiresAt, now.toISOString())

  return getInvitationById(id)!
}

export function getInvitationById(id: string): TeamInvitation | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM team_invitations WHERE id = ?').get(id) as any
  if (!row) return undefined
  return mapRowToInvitation(row)
}

export function getInvitationByToken(token: string): TeamInvitation | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM team_invitations WHERE token = ?').get(token) as any
  if (!row) return undefined
  return mapRowToInvitation(row)
}

export function getPendingInvitationsByTeam(teamId: string): TeamInvitation[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM team_invitations
    WHERE team_id = ? AND accepted_at IS NULL AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `).all(teamId) as any[]
  return rows.map(mapRowToInvitation)
}

export function getPendingInvitations(): TeamInvitation[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM team_invitations
    WHERE accepted_at IS NULL AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `).all() as any[]
  return rows.map(mapRowToInvitation)
}

export function acceptInvitation(token: string): boolean {
  const db = getDatabase()
  const now = new Date().toISOString()
  const result = db.prepare(`
    UPDATE team_invitations
    SET accepted_at = ?
    WHERE token = ? AND accepted_at IS NULL
  `).run(now, token)
  return result.changes > 0
}

export function deleteInvitation(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM team_invitations WHERE id = ?').run(id)
  return result.changes > 0
}

export function cleanupExpiredInvitations(): number {
  const db = getDatabase()
  const result = db.prepare(`
    DELETE FROM team_invitations
    WHERE accepted_at IS NULL AND expires_at < datetime('now')
  `).run()
  return result.changes
}

function mapRowToInvitation(row: any): TeamInvitation {
  return {
    id: row.id,
    email: row.email,
    teamId: row.team_id,
    teamName: row.team_name,
    role: row.role,
    token: row.token,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at
  }
}
