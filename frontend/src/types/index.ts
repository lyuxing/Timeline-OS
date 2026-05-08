export type ProjectStatus = 'seed' | 'rooting' | 'growing' | 'fruiting' | 'blooming' | 'archived'
export type NodeType = 'seed' | 'branch' | 'fruit' | 'flower' | 'task'
export type NodeStatus = 'pending' | 'active' | 'done' | 'blocked'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  startDate?: string
  color: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface Node {
  id: string
  projectId: string
  parentId?: string
  title: string
  description?: string
  type: NodeType
  status: NodeStatus
  isMilestone: boolean
  milestoneDate?: string
  milestoneName?: string
  estimatedDays?: number
  positionX: number
  positionY: number
  createdAt: string
  updatedAt: string
}

export interface ProjectTree extends Project {
  nodes: Node[]
}

export interface TimelineRow {
  project: Project
  nodes: (Node & { startDate: Date; endDate: Date })[]
}

export const STATUS_ICONS: Record<ProjectStatus, string> = {
  seed: '🌱',
  rooting: '🪴',
  growing: '🌿',
  fruiting: '🍎',
  blooming: '🌸',
  archived: '🍂',
}

export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  seed: '🌱',
  branch: '🌿',
  fruit: '🍎',
  flower: '🌸',
  task: '📍',
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  seed: '#6b7280',
  rooting: '#8b5cf6',
  growing: '#3b82f6',
  fruiting: '#22c55e',
  blooming: '#f59e0b',
  archived: '#4b5563',
}

export const NODE_STATUS_COLORS: Record<NodeStatus, string> = {
  pending: '#6b7280',
  active: '#3b82f6',
  done: '#22c55e',
  blocked: '#ef4444',
}

export const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e',
  '#06b6d4', '#6366f1', '#f43f5e', '#84cc16', '#14b8a6'
]