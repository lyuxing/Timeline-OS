import { randomUUID } from 'crypto'
import { getDatabase } from './database.js'
import type { Project, ProjectNode, ProjectTree, ProjectStatus, NodeStatus, NodeType } from '../models/types.js'
import { PROJECT_COLORS, MILESTONE_COLORS } from '../models/types.js'

export function createProject(name: string, description?: string): Project {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  // Get next position
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM projects').get() as { max: number }
  const position = maxPos.max + 1
  const color = PROJECT_COLORS[position % PROJECT_COLORS.length]

  const stmt = db.prepare(`
    INSERT INTO projects (id, name, description, status, color, position, created_at, updated_at)
    VALUES (?, ?, ?, 'seed', ?, ?, ?, ?)
  `)

  stmt.run(id, name, description || null, color, position, now, now)

  return {
    id,
    name,
    description,
    status: 'seed',
    color,
    position,
    createdAt: now,
    updatedAt: now,
  }
}

export function getProject(id: string): Project | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  return row as Project | null
}

export function getProjectTree(id: string): ProjectTree | null {
  const db = getDatabase()
  const project = getProject(id)
  if (!project) return null

  const nodes = db.prepare('SELECT * FROM nodes WHERE project_id = ? ORDER BY created_at').all(id) as ProjectNode[]

  return { ...project, nodes }
}

export function listProjects(): Project[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM projects ORDER BY position ASC').all() as Project[]
}

export function updateProject(id: string, updates: {
  name?: string;
  description?: string;
  vision?: string;
  goal?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}): Project | null {
  const db = getDatabase()
  const now = new Date().toISOString()

  const fields: string[] = ['updated_at = ?']
  const values: (string | null)[] = [now]

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.vision !== undefined) {
    fields.push('vision = ?')
    values.push(updates.vision)
  }
  if (updates.goal !== undefined) {
    fields.push('goal = ?')
    values.push(updates.goal)
  }
  if (updates.status !== undefined) {
    fields.push('status = ?')
    values.push(updates.status)
  }
  if (updates.startDate !== undefined) {
    fields.push('start_date = ?')
    values.push(updates.startDate)
  }
  if (updates.endDate !== undefined) {
    fields.push('end_date = ?')
    values.push(updates.endDate)
  }

  values.push(id)

  const result = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  if (result.changes === 0) return null
  return getProject(id)
}

export function updateProjectPosition(id: string, position: number): boolean {
  const db = getDatabase()
  const result = db.prepare('UPDATE projects SET position = ?, updated_at = ? WHERE id = ?').run(position, new Date().toISOString(), id)
  return result.changes > 0
}

export function deleteProject(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  return result.changes > 0
}

// Node operations
export function createNode(
  projectId: string,
  title: string,
  type: NodeType = 'branch',
  parentId?: string,
  options?: {
    description?: string
    isMilestone?: boolean
    milestoneDate?: string
    milestoneName?: string
    startDate?: string
    color?: string
    estimatedDays?: number
  }
): ProjectNode {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  // 为里程碑分配颜色
  let color = options?.color
  if (options?.isMilestone && !color) {
    // 获取项目中现有里程碑的颜色
    const existingNodes = db.prepare('SELECT color FROM nodes WHERE project_id = ? AND is_milestone = 1 AND color IS NOT NULL').all(projectId) as { color: string }[]
    const usedColors = new Set(existingNodes.map(n => n.color))
    // 找到第一个未使用的颜色
    color = MILESTONE_COLORS.find(c => !usedColors.has(c)) || MILESTONE_COLORS[existingNodes.length % MILESTONE_COLORS.length]
  }

  const stmt = db.prepare(`
    INSERT INTO nodes (id, project_id, parent_id, title, description, type, status, is_milestone, milestone_date, milestone_name, start_date, color, estimated_days, position_x, position_y, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
  `)

  stmt.run(
    id, projectId, parentId || null, title,
    options?.description || null,
    type,
    options?.isMilestone ? 1 : 0,
    options?.milestoneDate || null,
    options?.milestoneName || null,
    options?.startDate || null,
    color || null,
    options?.estimatedDays || null,
    now, now
  )

  return {
    id,
    projectId,
    parentId,
    title,
    description: options?.description,
    type,
    status: 'pending',
    isMilestone: options?.isMilestone || false,
    milestoneDate: options?.milestoneDate,
    milestoneName: options?.milestoneName,
    startDate: options?.startDate,
    color,
    estimatedDays: options?.estimatedDays,
    positionX: 0,
    positionY: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function getNode(id: string): ProjectNode | null {
  const db = getDatabase()
  return db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as ProjectNode | null
}

export function updateNode(id: string, updates: {
  title?: string
  description?: string
  status?: NodeStatus
  isMilestone?: boolean
  milestoneDate?: string
  milestoneName?: string
  startDate?: string
  estimatedDays?: number
}): ProjectNode | null {
  const db = getDatabase()
  const now = new Date().toISOString()

  const fields: string[] = ['updated_at = ?']
  const values: (string | number | null)[] = [now]

  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.status !== undefined) {
    fields.push('status = ?')
    values.push(updates.status)
  }
  if (updates.isMilestone !== undefined) {
    fields.push('is_milestone = ?')
    values.push(updates.isMilestone ? 1 : 0)
  }
  if (updates.milestoneDate !== undefined) {
    fields.push('milestone_date = ?')
    values.push(updates.milestoneDate)
  }
  if (updates.milestoneName !== undefined) {
    fields.push('milestone_name = ?')
    values.push(updates.milestoneName)
  }
  if (updates.startDate !== undefined) {
    fields.push('start_date = ?')
    values.push(updates.startDate)
  }
  if (updates.estimatedDays !== undefined) {
    fields.push('estimated_days = ?')
    values.push(updates.estimatedDays)
  }

  values.push(id)

  const result = db.prepare(`UPDATE nodes SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  if (result.changes === 0) return null
  return getNode(id)
}

export function updateNodePosition(id: string, x: number, y: number): ProjectNode | null {
  const db = getDatabase()
  const now = new Date().toISOString()

  const result = db.prepare(`
    UPDATE nodes SET position_x = ?, position_y = ?, updated_at = ? WHERE id = ?
  `).run(x, y, now, id)

  if (result.changes === 0) return null
  return getNode(id)
}

export function deleteNode(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM nodes WHERE id = ?').run(id)
  return result.changes > 0
}

export function getProjectMilestones(projectId: string): ProjectNode[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM nodes WHERE project_id = ? AND is_milestone = 1 ORDER BY milestone_date').all(projectId) as ProjectNode[]
}