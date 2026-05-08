export type ProjectStatus = 'seed' | 'rooting' | 'growing' | 'fruiting' | 'blooming' | 'archived'
export type NodeType = 'seed' | 'branch' | 'fruit' | 'flower' | 'task'
export type NodeStatus = 'pending' | 'active' | 'done' | 'blocked'
export type UserRole = 'admin' | 'member'

export interface Team {
  id: string
  name: string
  createdBy: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  passwordHash: string
  name: string
  role: UserRole
  teamId?: string
  createdAt: string
  updatedAt: string
}

export interface TeamInvitation {
  id: string
  email: string
  teamId: string
  teamName: string
  role: UserRole
  token: string
  createdBy: string
  expiresAt: string
  createdAt: string
  acceptedAt?: string
}

export interface Developer {
  id: string
  userId?: string
  teamId?: string
  name: string
  avatar?: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  vision?: string
  goal?: string
  status: ProjectStatus
  startDate?: string
  endDate?: string
  color: string
  position: number
  developerId?: string
  teamId?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectNode {
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
  startDate?: string
  color?: string
  estimatedDays?: number
  positionX: number
  positionY: number
  createdAt: string
  updatedAt: string
}

export interface Knowledge {
  id: string
  projectId?: string
  title: string
  content?: string
  tags: string[]
  createdAt: string
}

export interface ProjectTree extends Project {
  nodes: ProjectNode[]
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

export const MILESTONE_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#6366f1', '#84cc16', '#e11d48'
]