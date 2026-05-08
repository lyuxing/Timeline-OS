import { Router, Request, Response } from 'express'
import { getProjectTree } from '../storage/projects.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Export single project as JSON
router.get('/projects/:id/json', requireAuth, (req: Request, res: Response) => {
  try {
    const tree = getProjectTree(req.params.id)
    if (!tree) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const exportData = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      source: 'Timeline OS',
      project: {
        name: tree.name,
        description: tree.description,
        vision: tree.vision,
        goal: tree.goal,
        status: tree.status,
        startDate: tree.startDate,
        endDate: tree.endDate,
        color: tree.color,
        nodes: tree.nodes.map(n => ({
          title: n.title,
          description: n.description,
          type: n.type,
          status: n.status,
          isMilestone: n.isMilestone,
          milestoneDate: n.milestoneDate,
          milestoneName: n.milestoneName,
          startDate: n.startDate,
          estimatedDays: n.estimatedDays,
          color: n.color,
          parentId: n.parentId
        }))
      }
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${tree.name}-export.json"`)
    res.json(exportData)
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ error: 'Export failed' })
  }
})

// Export single project as CSV
router.get('/projects/:id/csv', requireAuth, (req: Request, res: Response) => {
  try {
    const tree = getProjectTree(req.params.id)
    if (!tree) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // CSV headers
    const headers = ['层级', '标题', '类型', '状态', '开始日期', '截止日期', '预计天数', '描述']
    const rows: string[][] = [headers]

    // Helper function to flatten nodes
    const flattenNodes = (nodes: any[], parentId: string | null = null, level: number = 0) => {
      const children = nodes.filter(n => n.parentId === parentId)
      children.forEach(node => {
        const row = [
          '　'.repeat(level) + (level === 0 ? '■' : '├'),
          node.title,
          node.isMilestone ? '🚩 里程碑' : '📍 任务',
          node.status,
          node.startDate || '',
          node.milestoneDate || '',
          node.estimatedDays?.toString() || '',
          (node.description || '').replace(/\n/g, ' ').substring(0, 50)
        ]
        rows.push(row)
        flattenNodes(nodes, node.id, level + 1)
      })
    }

    // Start with root nodes (no parent)
    const rootNodes = tree.nodes.filter(n => !n.parentId)
    rootNodes.forEach(node => {
      const row = [
        '■',
        node.title,
        node.isMilestone ? '🚩 里程碑' : '📍 任务',
        node.status,
        node.startDate || '',
        node.milestoneDate || '',
        node.estimatedDays?.toString() || '',
        (node.description || '').replace(/\n/g, ' ').substring(0, 50)
      ]
      rows.push(row)
      flattenNodes(tree.nodes, node.id, 1)
    })

    // Convert to CSV string
    const csvContent = rows.map(row =>
      row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    // Add BOM for Excel Chinese support
    const bom = '﻿'
    const csvWithBom = bom + csvContent

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${tree.name}-export.csv"`)
    res.send(csvWithBom)
  } catch (error) {
    console.error('CSV export error:', error)
    res.status(500).json({ error: 'CSV export failed' })
  }
})

// Import project from JSON
router.post('/import', requireAuth, (req: Request, res: Response) => {
  try {
    const { project } = req.body

    if (!project || !project.name) {
      return res.status(400).json({ error: 'Invalid import data: project name required' })
    }

    const { createProject, createNode } = require('../storage/projects.js')

    // Create project
    const teamId = req.user!.teamId
    const newProject = createProject(project.name, project.description, undefined, teamId)

    // Create nodes
    const idMap = new Map<string, string>()

    const createNodesRecursive = (nodes: any[], parentId: string | null = null) => {
      nodes.forEach(nodeData => {
        const newNode = createNode(
          newProject.id,
          nodeData.title,
          nodeData.type || 'branch',
          parentId || undefined,
          {
            description: nodeData.description,
            isMilestone: nodeData.isMilestone,
            milestoneDate: nodeData.milestoneDate,
            milestoneName: nodeData.milestoneName,
            startDate: nodeData.startDate,
            estimatedDays: nodeData.estimatedDays,
            color: nodeData.color
          }
        )

        // Store mapping from old parent to new id for child nodes
        if (nodeData.parentId) {
          idMap.set(nodeData.parentId!, newNode.id)
        }

        // Find and create children (nodes that have this node as parent)
        const children = nodes.filter((n: any) => n.parentId === nodeData.parentId ||
          (idMap.has(nodeData.parentId || '') && n.parentId === nodeData.parentId))
        if (children.length > 0 && nodeData.children) {
          createNodesRecursive(nodeData.children || [], newNode.id)
        }
      })
    }

    // Create all nodes, handling parent references
    if (project.nodes && project.nodes.length > 0) {
      // First pass: create root nodes (no parent)
      const rootNodes = project.nodes.filter((n: any) => !n.parentId)

      const createNodeFromData = (nodeData: any, parentId: string | null = null) => {
        const newNode = createNode(
          newProject.id,
          nodeData.title,
          nodeData.type || 'branch',
          parentId || undefined,
          {
            description: nodeData.description,
            isMilestone: nodeData.isMilestone,
            milestoneDate: nodeData.milestoneDate,
            milestoneName: nodeData.milestoneName,
            startDate: nodeData.startDate,
            estimatedDays: nodeData.estimatedDays,
            color: nodeData.color
          }
        )

        // Create children
        const childNodes = project.nodes.filter((n: any) => n.parentId &&
          (n.parentId === nodeData.id || n.parentId === nodeData.parentId))

        // Find actual children in the import data
        if (nodeData.children && nodeData.children.length > 0) {
          nodeData.children.forEach((child: any) => {
            createNodeFromData(child, newNode.id)
          })
        }

        return newNode
      }

      rootNodes.forEach((nodeData: any) => {
        createNodeFromData(nodeData, null)
      })
    }

    res.json({
      success: true,
      project: {
        id: newProject.id,
        name: newProject.name,
        status: newProject.status
      }
    })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ error: 'Import failed' })
  }
})

export default router