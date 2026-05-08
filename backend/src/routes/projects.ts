import { Router, Request, Response } from 'express'
import {
  createProject,
  getProject,
  getProjectTree,
  listProjects,
  updateProject,
  updateProjectPosition,
  deleteProject,
  createNode,
  getNode,
  updateNode,
  updateNodePosition,
  deleteNode,
  getProjectMilestones,
} from '../storage/projects.js'
import { getUserById } from '../storage/users.js'
import { requireAuth } from '../middleware/auth.js'
import type { ProjectStatus, NodeStatus, NodeType } from '../models/types.js'

const router = Router()

// Helper to check if user can access a project
function canAccessProject(userTeamId: string | undefined, projectTeamId: string | undefined): boolean {
  // No team user can only access no-team projects
  if (!userTeamId) {
    return !projectTeamId
  }
  // Team user can access their team's projects
  return userTeamId === projectTeamId
}

// === Projects ===

router.get('/', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const teamId = user?.teamId || undefined
  const projects = listProjects(teamId)
  res.json(projects)
})

router.post('/', requireAuth, (req: Request, res: Response) => {
  const { name, description, developerId } = req.body
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const user = getUserById(req.user!.userId)
  const teamId = user?.teamId || undefined
  const project = createProject(name, description, developerId, teamId)
  res.status(201).json(project)
})

router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const project = getProject(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  if (!canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  res.json(project)
})

router.get('/:id/tree', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const tree = getProjectTree(req.params.id)
  if (!tree) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  if (!canAccessProject(user?.teamId, tree.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  res.json(tree)
})

router.get('/:id/milestones', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const project = getProject(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  if (!canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const milestones = getProjectMilestones(req.params.id)
  res.json(milestones)
})

router.patch('/:id', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const project = getProject(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  if (!canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const { name, description, vision, goal, status, startDate, endDate } = req.body
  const updated = updateProject(req.params.id, {
    name,
    description,
    vision,
    goal,
    status: status as ProjectStatus,
    startDate,
    endDate,
  })
  if (!updated) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json(updated)
})

router.patch('/:id/position', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const project = getProject(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  if (!canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const { position } = req.body
  if (typeof position !== 'number') {
    res.status(400).json({ error: 'position is required' })
    return
  }
  const success = updateProjectPosition(req.params.id, position)
  if (!success) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json({ success: true })
})

router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const project = getProject(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  if (!canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const deleted = deleteProject(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.status(204).send()
})

// === Nodes ===

router.post('/:id/nodes', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const project = getProject(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  if (!canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const { title, type, parentId, description, isMilestone, milestoneDate, milestoneName, startDate, estimatedDays } = req.body
  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  const node = createNode(
    req.params.id,
    title,
    type as NodeType || 'branch',
    parentId,
    { description, isMilestone, milestoneDate, milestoneName, startDate, estimatedDays }
  )
  res.status(201).json(node)
})

router.get('/nodes/:nodeId', requireAuth, (req: Request, res: Response) => {
  const node = getNode(req.params.nodeId)
  if (!node) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  const user = getUserById(req.user!.userId)
  const project = getProject(node.projectId)
  if (!project || !canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  res.json(node)
})

router.patch('/nodes/:nodeId', requireAuth, (req: Request, res: Response) => {
  const node = getNode(req.params.nodeId)
  if (!node) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  const user = getUserById(req.user!.userId)
  const project = getProject(node.projectId)
  if (!project || !canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const { title, description, status, isMilestone, milestoneDate, milestoneName, startDate, estimatedDays } = req.body
  const updated = updateNode(req.params.nodeId, {
    title,
    description,
    status: status as NodeStatus,
    isMilestone,
    milestoneDate,
    milestoneName,
    startDate,
    estimatedDays,
  })
  if (!updated) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  res.json(updated)
})

router.patch('/nodes/:nodeId/position', requireAuth, (req: Request, res: Response) => {
  const node = getNode(req.params.nodeId)
  if (!node) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  const user = getUserById(req.user!.userId)
  const project = getProject(node.projectId)
  if (!project || !canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const { x, y } = req.body
  if (typeof x !== 'number' || typeof y !== 'number') {
    res.status(400).json({ error: 'x and y are required' })
    return
  }
  const updated = updateNodePosition(req.params.nodeId, x, y)
  if (!updated) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  res.json(updated)
})

router.delete('/nodes/:nodeId', requireAuth, (req: Request, res: Response) => {
  const node = getNode(req.params.nodeId)
  if (!node) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  const user = getUserById(req.user!.userId)
  const project = getProject(node.projectId)
  if (!project || !canAccessProject(user?.teamId, project.teamId)) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const deleted = deleteNode(req.params.nodeId)
  if (!deleted) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  res.status(204).send()
})

export default router