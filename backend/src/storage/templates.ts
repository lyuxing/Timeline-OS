import { getDatabase } from './database.js'

export interface TemplateNode {
  title: string
  isMilestone: boolean
  estimatedDays?: number
  children?: TemplateNode[]
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'research' | 'product' | 'competition' | 'personal' | 'custom'
  structure: TemplateNode[]
  createdBy: string | null
  isPublic: boolean
  createdAt: string
}

const PRESET_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-research-paper',
    name: '论文撰写',
    description: '学术论文写作流程模板',
    category: 'research',
    structure: [
      {
        title: '选题确定',
        isMilestone: true,
        estimatedDays: 7,
        children: [
          { title: '文献调研', isMilestone: false, estimatedDays: 14 },
          { title: '研究方法设计', isMilestone: false, estimatedDays: 7 },
        ]
      },
      {
        title: '实验阶段',
        isMilestone: true,
        estimatedDays: 30,
        children: [
          { title: '数据收集', isMilestone: false, estimatedDays: 14 },
          { title: '数据分析', isMilestone: false, estimatedDays: 10 },
        ]
      },
      {
        title: '论文撰写',
        isMilestone: true,
        estimatedDays: 21,
        children: [
          { title: '初稿完成', isMilestone: false, estimatedDays: 14 },
          { title: '修改提交', isMilestone: false, estimatedDays: 7 },
        ]
      }
    ],
    createdBy: null,
    isPublic: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-product-dev',
    name: '产品开发',
    description: '软件产品开发流程模板',
    category: 'product',
    structure: [
      {
        title: '需求分析',
        isMilestone: true,
        estimatedDays: 7
      },
      {
        title: '设计阶段',
        isMilestone: true,
        estimatedDays: 14,
        children: [
          { title: 'UI设计', isMilestone: false, estimatedDays: 7 },
          { title: '技术架构', isMilestone: false, estimatedDays: 5 },
        ]
      },
      {
        title: '开发阶段',
        isMilestone: true,
        estimatedDays: 30,
        children: [
          { title: '前端开发', isMilestone: false, estimatedDays: 15 },
          { title: '后端开发', isMilestone: false, estimatedDays: 15 },
        ]
      },
      {
        title: '测试上线',
        isMilestone: true,
        estimatedDays: 14,
        children: [
          { title: '功能测试', isMilestone: false, estimatedDays: 7 },
          { title: '部署上线', isMilestone: false, estimatedDays: 3 },
        ]
      }
    ],
    createdBy: null,
    isPublic: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-competition',
    name: '竞赛项目',
    description: '竞赛项目流程模板',
    category: 'competition',
    structure: [
      {
        title: '报名准备',
        isMilestone: true,
        estimatedDays: 7,
        children: [
          { title: '组队', isMilestone: false, estimatedDays: 3 },
          { title: '选题确定', isMilestone: false, estimatedDays: 4 },
        ]
      },
      {
        title: '初赛阶段',
        isMilestone: true,
        estimatedDays: 21,
        children: [
          { title: '方案设计', isMilestone: false, estimatedDays: 7 },
          { title: '作品开发', isMilestone: false, estimatedDays: 10 },
          { title: '提交初赛', isMilestone: false, estimatedDays: 2 },
        ]
      },
      {
        title: '决赛阶段',
        isMilestone: true,
        estimatedDays: 14,
        children: [
          { title: '作品完善', isMilestone: false, estimatedDays: 7 },
          { title: '答辩准备', isMilestone: false, estimatedDays: 5 },
        ]
      }
    ],
    createdBy: null,
    isPublic: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-personal',
    name: '个人计划',
    description: '个人学习/成长计划模板',
    category: 'personal',
    structure: [
      {
        title: '目标设定',
        isMilestone: true,
        estimatedDays: 3
      },
      {
        title: '学习阶段',
        isMilestone: true,
        estimatedDays: 30,
        children: [
          { title: '基础知识', isMilestone: false, estimatedDays: 10 },
          { title: '实践练习', isMilestone: false, estimatedDays: 15 },
        ]
      },
      {
        title: '成果输出',
        isMilestone: true,
        estimatedDays: 14,
        children: [
          { title: '项目实践', isMilestone: false, estimatedDays: 10 },
          { title: '总结分享', isMilestone: false, estimatedDays: 4 },
        ]
      }
    ],
    createdBy: null,
    isPublic: true,
    createdAt: new Date().toISOString()
  }
]

export function getTemplates(): ProjectTemplate[] {
  const db = getDatabase()

  const rows = db.prepare(`
    SELECT * FROM templates ORDER BY created_at DESC
  `).all() as any[]

  const customTemplates = rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    structure: JSON.parse(row.structure),
    createdBy: row.created_by,
    isPublic: row.is_public === 1,
    createdAt: row.created_at
  }))

  return [...PRESET_TEMPLATES, ...customTemplates]
}

export function getTemplateById(id: string): ProjectTemplate | null {
  const preset = PRESET_TEMPLATES.find(t => t.id === id)
  if (preset) return preset

  const db = getDatabase()
  const row = db.prepare(`
    SELECT * FROM templates WHERE id = ?
  `).get(id) as any

  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    structure: JSON.parse(row.structure),
    createdBy: row.created_by,
    isPublic: row.is_public === 1,
    createdAt: row.created_at
  }
}

export function createTemplate(
  name: string,
  description: string,
  category: ProjectTemplate['category'],
  structure: TemplateNode[],
  createdBy: string
): ProjectTemplate {
  const db = getDatabase()
  const id = `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO templates (id, name, description, category, structure, created_by, is_public, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, name, description, category, JSON.stringify(structure), createdBy, now)

  return {
    id,
    name,
    description,
    category,
    structure,
    createdBy,
    isPublic: true,
    createdAt: now
  }
}

export function deleteTemplate(id: string, userId: string): boolean {
  const db = getDatabase()

  const result = db.prepare(`
    DELETE FROM templates WHERE id = ? AND created_by = ?
  `).run(id, userId)

  return result.changes > 0
}
