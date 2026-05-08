import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronDown, FileText, Plus } from 'lucide-react'
import { useStore } from '../store'
import './TemplateModal.css'

interface TemplateNode {
  title: string
  isMilestone: boolean
  estimatedDays?: number
  children?: TemplateNode[]
}

interface Template {
  id: string
  name: string
  description: string
  category: 'research' | 'product' | 'competition' | 'personal' | 'custom'
  structure: TemplateNode[]
  createdBy: string | null
  isPublic: boolean
  createdAt: string
}

interface Props {
  onClose: () => void
}

export default function TemplateModal({ onClose }: Props) {
  const { token, fetchProjects } = useStore()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const [projectName, setProjectName] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (e) {
      console.error('Failed to fetch templates:', e)
    }
  }

  const categoryLabels: Record<string, string> = {
    research: '学术研究',
    product: '产品开发',
    competition: '竞赛项目',
    personal: '个人成长',
    custom: '自定义'
  }

  const categoryIcons: Record<string, string> = {
    research: '📚',
    product: '🚀',
    competition: '🏆',
    personal: '🌱',
    custom: '✨'
  }

  const toggleExpand = (id: string) => {
    setExpandedTemplates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !projectName) {
      setError('请选择模板并输入项目名称')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/templates/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          projectName,
          startDate
        })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '创建失败')
        return
      }

      await fetchProjects()
      onClose()
    } catch (e) {
      setError('创建失败')
    } finally {
      setLoading(false)
    }
  }

  const renderNodeTree = (nodes: TemplateNode[], level: number = 0) => {
    return nodes.map((node, index) => (
      <div key={`${level}-${index}`} className="template-node" style={{ marginLeft: level * 20 }}>
        <span className="node-icon">{node.isMilestone ? '🚩' : '📍'}</span>
        <span className="node-title">{node.title}</span>
        {node.estimatedDays && (
          <span className="node-days">{node.estimatedDays}天</span>
        )}
        {node.children && node.children.length > 0 && (
          <div className="node-children">
            {renderNodeTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  const groupedTemplates = templates.reduce((acc, tpl) => {
    const cat = tpl.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(tpl)
    return acc
  }, {} as Record<string, Template[]>)

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 选择项目模板</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* Template List */}
          <div className="template-list">
            {Object.entries(groupedTemplates).map(([category, tpls]) => (
              <div key={category} className="template-category">
                <div className="category-header">
                  <span className="category-icon">{categoryIcons[category]}</span>
                  <span className="category-label">{categoryLabels[category]}</span>
                  <span className="category-count">{tpls.length}</span>
                </div>
                <div className="category-templates">
                  {tpls.map(tpl => {
                    const isExpanded = expandedTemplates.has(tpl.id)
                    const isSelected = selectedTemplate?.id === tpl.id

                    return (
                      <div
                        key={tpl.id}
                        className={`template-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedTemplate(tpl)}
                      >
                        <div className="template-header">
                          <button
                            className="expand-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(tpl.id)
                            }}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <span className="template-name">{tpl.name}</span>
                          {tpl.createdBy && <span className="custom-badge">自定义</span>}
                        </div>
                        <p className="template-desc">{tpl.description}</p>

                        {isExpanded && (
                          <div className="template-structure">
                            {renderNodeTree(tpl.structure)}
                          </div>
                        )}

                        {isSelected && (
                          <div className="selected-indicator">✓ 已选择</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Project Config */}
          <div className="project-config">
            <h3>⚙️ 项目配置</h3>

            {selectedTemplate && (
              <div className="selected-template-preview">
                <FileText size={18} />
                <span>{selectedTemplate.name}</span>
              </div>
            )}

            <div className="config-field">
              <label>项目名称</label>
              <input
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="输入项目名称..."
              />
            </div>

            <div className="config-field">
              <label>开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <button
              className="apply-btn"
              onClick={handleApplyTemplate}
              disabled={loading || !selectedTemplate || !projectName}
            >
              {loading ? '创建中...' : (
                <>
                  <Plus size={18} />
                  从模板创建项目
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}