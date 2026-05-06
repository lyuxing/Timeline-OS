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
import type { ProjectStatus, NodeStatus, NodeType } from '../models/types.js'

const router = Router()

// === Projects ===

router.get('/', (_req: Request, res: Response) => {
  const projects = listProjects()
  res.json(projects)
})

router.post('/', (req: Request, res: Response) => {
  const { name, description } = req.body
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const project = createProject(name, description)
  res.status(201).json(project)
})

router.get('/:id', (req: Request, res: Response) => {
  const project = getProject(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json(project)
})

router.get('/:id/tree', (req: Request, res: Response) => {
  const tree = getProjectTree(req.params.id)
  if (!tree) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json(tree)
})

router.get('/:id/milestones', (req: Request, res: Response) => {
  const milestones = getProjectMilestones(req.params.id)
  res.json(milestones)
})

router.patch('/:id', (req: Request, res: Response) => {
  const { name, description, vision, goal, status, startDate, endDate } = req.body
  const project = updateProject(req.params.id, {
    name,
    description,
    vision,
    goal,
    status: status as ProjectStatus,
    startDate,
    endDate,
  })
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json(project)
})

router.patch('/:id/position', (req: Request, res: Response) => {
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

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteProject(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.status(204).send()
})

// === Nodes ===

router.post('/:id/nodes', (req: Request, res: Response) => {
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

router.get('/nodes/:nodeId', (req: Request, res: Response) => {
  const node = getNode(req.params.nodeId)
  if (!node) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  res.json(node)
})

router.patch('/nodes/:nodeId', (req: Request, res: Response) => {
  const { title, description, status, isMilestone, milestoneDate, milestoneName, startDate, estimatedDays } = req.body
  const node = updateNode(req.params.nodeId, {
    title,
    description,
    status: status as NodeStatus,
    isMilestone,
    milestoneDate,
    milestoneName,
    startDate,
    estimatedDays,
  })
  if (!node) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  res.json(node)
})

router.patch('/nodes/:nodeId/position', (req: Request, res: Response) => {
  const { x, y } = req.body
  if (typeof x !== 'number' || typeof y !== 'number') {
    res.status(400).json({ error: 'x and y are required' })
    return
  }
  const node = updateNodePosition(req.params.nodeId, x, y)
  if (!node) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  res.json(node)
})

router.delete('/nodes/:nodeId', (req: Request, res: Response) => {
  const deleted = deleteNode(req.params.nodeId)
  if (!deleted) {
    res.status(404).json({ error: 'Node not found' })
    return
  }
  res.status(204).send()
})

export default router