import { Router, Request, Response } from 'express'
import { getTemplates, getTemplateById, createTemplate, deleteTemplate } from '../storage/templates.js'
import { createProject, createNode } from '../storage/projects.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Get all templates (public + user's custom)
router.get('/', requireAuth, (_req: Request, res: Response) => {
  try {
    const templates = getTemplates()
    res.json(templates)
  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ error: 'Failed to get templates' })
  }
})

// Get single template
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const template = getTemplateById(req.params.id)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }
    res.json(template)
  } catch (error) {
    console.error('Get template error:', error)
    res.status(500).json({ error: 'Failed to get template' })
  }
})

// Create custom template
router.post('/', requireAuth, (req: Request, res: Response) => {
  try {
    const { name, description, category, structure } = req.body

    if (!name || !structure) {
      return res.status(400).json({ error: 'Name and structure are required' })
    }

    const template = createTemplate(
      name,
      description || '',
      category || 'custom',
      structure,
      req.user!.userId
    )

    res.json(template)
  } catch (error) {
    console.error('Create template error:', error)
    res.status(500).json({ error: 'Failed to create template' })
  }
})

// Create project from template
router.post('/apply', requireAuth, (req: Request, res: Response) => {
  try {
    const { templateId, projectName, projectDescription, developerId, startDate } = req.body

    if (!templateId || !projectName) {
      return res.status(400).json({ error: 'Template ID and project name are required' })
    }

    const template = getTemplateById(templateId)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // Create project
    const teamId = req.user!.teamId
    const project = createProject(projectName, projectDescription || template.description, developerId, teamId)

    // Create nodes from template structure
    const createNodesFromTemplate = (nodes: any[], parentId: string | null, baseDate: Date, level: number) => {
      let currentDate = new Date(baseDate)

      nodes.forEach((templateNode) => {
        const estimatedDays = templateNode.estimatedDays || 7
        const nodeStartDate = new Date(currentDate)

        const node = createNode(
          project.id,
          templateNode.title,
          'branch',
          parentId || undefined,
          {
            isMilestone: templateNode.isMilestone,
            startDate: nodeStartDate.toISOString().split('T')[0],
            milestoneDate: templateNode.isMilestone
              ? new Date(nodeStartDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : undefined,
            milestoneName: templateNode.isMilestone ? templateNode.title : undefined,
            estimatedDays: templateNode.estimatedDays
          }
        )

        // Process children
        if (templateNode.children && templateNode.children.length > 0) {
          createNodesFromTemplate(templateNode.children, node.id, nodeStartDate, level + 1)
        }

        // Update current date for next sibling (only at top level)
        if (level === 0) {
          currentDate.setDate(currentDate.getDate() + estimatedDays)
        }
      })
    }

    const baseDate = startDate ? new Date(startDate) : new Date()
    createNodesFromTemplate(template.structure, null, baseDate, 0)

    res.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        color: project.color
      },
      template: {
        id: template.id,
        name: template.name
      }
    })
  } catch (error) {
    console.error('Apply template error:', error)
    res.status(500).json({ error: 'Failed to create project from template' })
  }
})

// Delete custom template
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const success = deleteTemplate(req.params.id, req.user!.userId)
    if (!success) {
      return res.status(404).json({ error: 'Template not found or not owned by you' })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({ error: 'Failed to delete template' })
  }
})

export default router
