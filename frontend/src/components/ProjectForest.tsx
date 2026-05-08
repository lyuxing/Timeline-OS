import { useState, useEffect, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useStore } from '../store'
import { STATUS_ICONS, ProjectStatus } from '../types'
import { Eye, PlusCircle, FileText, Download, Maximize2 } from 'lucide-react'
import TemplateModal from './TemplateModal'
import ImportExportModal from './ImportExportModal'
import './ProjectForest.css'

const BRANCH_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#6366f1', '#84cc16', '#e11d48'
]

// 项目树根节点
function ProjectRootNode({ data }: { data: any }) {
  const statusIcon = STATUS_ICONS[data.status as ProjectStatus] || '🌱'

  return (
    <div className="project-root" style={{ borderColor: data.color }}>
      <Handle type="source" position={Position.Bottom} id="toBranch" style={{ background: data.color }} />
      <div className="root-icon">{statusIcon}</div>
      <div className="root-name">{data.name}</div>
      <div className="root-status">{data.status}</div>
      <div className="root-actions">
        <button onClick={() => data.onView?.(data.projectId)} title="查看时间线">
          <Eye size={14} />
        </button>
        <button onClick={() => data.onExpand?.(data.projectId)} title="展开树">
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}

// 里程碑节点（树干分支）
function BranchNode({ data }: { data: any }) {
  const color = data.color || '#f59e0b'
  const level = data.level || 0
  const icon = level === 0 ? '🚩' : level === 1 ? '📍' : '📌'

  return (
    <div className="branch-node" style={{ borderColor: color, background: `${color}10` }}>
      <Handle type="target" position={Position.Top} id="fromParent" style={{ background: color }} />
      <Handle type="source" position={Position.Bottom} id="toChild" style={{ background: color }} />
      <Handle type="source" position={Position.Right} id="toLeaf" style={{ background: color }} />

      <div className="branch-icon">{icon}</div>
      <div className="branch-name" style={{ color }}>{data.name}</div>
      <div className="branch-date">{data.dueDate}</div>

      {data.hasChildren && (
        <div className="branch-indicator" style={{ background: color }}>
          {data.childCount}
        </div>
      )}
    </div>
  )
}

// 花节点（成果展示）
function FlowerNode({ data }: { data: any }) {
  return (
    <div className="leaf-node flower-node">
      <Handle type="target" position={Position.Left} style={{ background: '#ec4899' }} />
      <div className="leaf-icon">🌸</div>
      <div className="leaf-name">{data.name}</div>
    </div>
  )
}

// 果节点（产出物）
function FruitNode({ data }: { data: any }) {
  return (
    <div className="leaf-node fruit-node">
      <Handle type="target" position={Position.Left} style={{ background: '#22c55e' }} />
      <div className="leaf-icon">🍎</div>
      <div className="leaf-name">{data.name}</div>
    </div>
  )
}

// 知识节点（文档/笔记）
function KnowledgeNode({ data }: { data: any }) {
  return (
    <div className="leaf-node knowledge-node">
      <Handle type="target" position={Position.Left} style={{ background: '#3b82f6' }} />
      <div className="leaf-icon">📄</div>
      <div className="leaf-name">{data.name}</div>
    </div>
  )
}

const nodeTypes = {
  projectRoot: ProjectRootNode,
  branch: BranchNode,
  flower: FlowerNode,
  fruit: FruitNode,
  knowledge: KnowledgeNode,
}

// 构建单个项目的树结构
function buildProjectTree(project: any, offsetX: number = 0): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const allNodes = project.nodes || []

  const projectColor = project.color || '#3b82f6'

  // 项目根节点
  nodes.push({
    id: `root-${project.id}`,
    type: 'projectRoot',
    position: { x: 400 + offsetX, y: 50 },
    data: {
      projectId: project.id,
      name: project.name,
      status: project.status,
      color: projectColor,
    },
  })

  // 获取顶层里程碑（无父节点）
  const topMilestones = allNodes
    .filter((n: any) => n.is_milestone === 1 && !n.parent_id)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.milestone_date || 0).getTime()
      const dateB = new Date(b.milestone_date || 0).getTime()
      return dateA - dateB
    })

  // 构建第一层分支
  topMilestones.forEach((milestone: any, index: number) => {
    const branchColor = BRANCH_COLORS[index % BRANCH_COLORS.length]
    const nodeX = 200 + offsetX + index * 220
    const nodeY = 180

    const childNodes = allNodes.filter((n: any) => n.parent_id === milestone.id)
    const hasChildren = childNodes.length > 0

    const dueDate = milestone.milestone_date
      ? new Date(milestone.milestone_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      : ''

    nodes.push({
      id: milestone.id,
      type: 'branch',
      position: { x: nodeX, y: nodeY },
      data: {
        name: milestone.milestone_name || milestone.title,
        dueDate,
        color: branchColor,
        level: 0,
        hasChildren,
        childCount: childNodes.length,
      },
    })

    edges.push({
      id: `edge-root-${milestone.id}`,
      source: `root-${project.id}`,
      sourceHandle: 'toBranch',
      target: milestone.id,
      targetHandle: 'fromParent',
      style: { stroke: branchColor, strokeWidth: 3 },
      markerEnd: MarkerType.ArrowClosed,
    })

    // 处理子节点
    let leafIndex = 0
    childNodes.forEach((child: any) => {
      if (child.is_milestone === 1) {
        // 子里程碑（第二层）
        const childColor = BRANCH_COLORS[(index + 1) % BRANCH_COLORS.length]
        const childX = nodeX - 60 + leafIndex * 140
        const childY = nodeY + 100

        const grandChildren = allNodes.filter((n: any) => n.parent_id === child.id)
        const childDueDate = child.milestone_date
          ? new Date(child.milestone_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
          : ''

        nodes.push({
          id: child.id,
          type: 'branch',
          position: { x: childX, y: childY },
          data: {
            name: child.milestone_name || child.title,
            dueDate: childDueDate,
            color: childColor,
            level: 1,
            hasChildren: grandChildren.length > 0,
            childCount: grandChildren.length,
          },
        })

        edges.push({
          id: `edge-${milestone.id}-${child.id}`,
          source: milestone.id,
          sourceHandle: 'toChild',
          target: child.id,
          targetHandle: 'fromParent',
          style: { stroke: childColor, strokeWidth: 2 },
        })

        // 第三层
        grandChildren.forEach((gc: any, gcIdx: number) => {
          const gcX = childX - 40 + gcIdx * 100
          const gcY = childY + 80

          if (gc.is_milestone === 1) {
            nodes.push({
              id: gc.id,
              type: 'branch',
              position: { x: gcX, y: gcY },
              data: {
                name: gc.milestone_name || gc.title,
                dueDate: gc.milestone_date ? new Date(gc.milestone_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '',
                color: childColor,
                level: 2,
              },
            })
            edges.push({
              id: `edge-${child.id}-${gc.id}`,
              source: child.id,
              sourceHandle: 'toChild',
              target: gc.id,
              targetHandle: 'fromParent',
              style: { stroke: childColor, strokeWidth: 1.5 },
            })
          } else {
            const gcType = gc.type === 'flower' ? 'flower' : gc.type === 'fruit' ? 'fruit' : 'knowledge'
            nodes.push({
              id: gc.id,
              type: gcType,
              position: { x: gcX, y: gcY },
              data: { name: gc.title },
            })
            edges.push({
              id: `edge-${child.id}-${gc.id}`,
              source: child.id,
              sourceHandle: 'toLeaf',
              target: gc.id,
              type: 'smoothstep',
              style: { stroke: childColor, strokeWidth: 1 },
            })
          }
        })

        leafIndex++
      } else {
        // 叶节点（花、果、知识）
        const leafType = child.type === 'flower' ? 'flower' : child.type === 'fruit' ? 'fruit' : 'knowledge'
        const leafX = nodeX + 140 + leafIndex * 100
        const leafY = nodeY + 30

        nodes.push({
          id: child.id,
          type: leafType,
          position: { x: leafX, y: leafY },
          data: { name: child.title },
        })

        edges.push({
          id: `edge-${milestone.id}-${child.id}`,
          source: milestone.id,
          sourceHandle: 'toLeaf',
          target: child.id,
          type: 'smoothstep',
          style: { stroke: branchColor, strokeWidth: 1.5 },
        })

        leafIndex++
      }
    })
  })

  return { nodes, edges }
}

// 构建森林（多项目）视图
function buildForest(projects: any[]): { nodes: Node[], edges: Edge[] } {
  let allNodes: Node[] = []
  let allEdges: Edge[] = []

  const spacing = 500
  projects.forEach((project, index) => {
    const tree = buildProjectTree(project, index * spacing)
    allNodes = [...allNodes, ...tree.nodes]
    allEdges = [...allEdges, ...tree.edges]
  })

  return { nodes: allNodes, edges: allEdges }
}

export default function ProjectForest() {
  const { projects, fetchProjects, fetchProjectTree, selectProject, setViewMode } = useStore()
  const [loaded, setLoaded] = useState(false)
  const [viewType, setViewType] = useState<'forest' | 'tree'>('forest')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const loadData = async () => {
      await fetchProjects()
      setLoaded(true)
    }
    loadData()
  }, [fetchProjects])

  // 加载项目树数据
  useEffect(() => {
    if (loaded && projects.length > 0) {
      projects.forEach(p => {
        if (!p.nodes) {
          fetchProjectTree(p.id)
        }
      })
    }
  }, [loaded, projects, fetchProjectTree])

  // 构建视图
  const treeData = useMemo(() => {
    const projectsWithNodes = projects.filter(p => p.nodes && p.nodes.length > 0)

    if (viewType === 'tree' && selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId)
      if (project) {
        return buildProjectTree(project)
      }
    }

    return buildForest(projectsWithNodes)
  }, [projects, viewType, selectedProjectId])

  useEffect(() => {
    if (treeData.nodes.length > 0) {
      setNodes(treeData.nodes)
      setEdges(treeData.edges)
    }
  }, [treeData, setNodes, setEdges])

  const handleViewProject = (projectId: string) => {
    selectProject(projectId)
    fetchProjectTree(projectId)
    setViewMode('timeline-edit')
  }

  const handleExpandProject = (projectId: string) => {
    setSelectedProjectId(projectId)
    setViewType('tree')
  }

  const handleBackToForest = () => {
    setViewType('forest')
    setSelectedProjectId(null)
  }

  // 更新节点数据，添加事件处理
  const nodesWithHandlers = useMemo(() => {
    return nodes.map(node => {
      if (node.type === 'projectRoot') {
        return {
          ...node,
          data: {
            ...node.data,
            onView: handleViewProject,
            onExpand: handleExpandProject,
          },
        }
      }
      return node
    })
  }, [nodes])

  return (
    <div className="project-forest">
      <header className="forest-header">
        <div className="header-left">
          <h2>🌲 项目{viewType === 'forest' ? '森林' : '树'}</h2>
          {viewType === 'tree' && selectedProjectId && (
            <button onClick={handleBackToForest} className="back-btn">
              ← 返回森林
            </button>
          )}
        </div>

        <p className="header-hint">
          {viewType === 'forest'
            ? '全局视角：一棵树是一个项目，一片森林是团队协作'
            : '单项目视角：查看项目的完整结构'}
        </p>

        <div className="header-actions">
          <button onClick={() => setShowImportExport(true)} className="btn-import">
            <Download size={16} />
            导入/导出
          </button>
          <button onClick={() => setShowTemplateModal(true)} className="btn-template">
            <FileText size={16} />
            从模板创建
          </button>
          <button onClick={() => {
            selectProject(null)
            setViewMode('map')
          }} className="btn-new-project">
            <PlusCircle size={16} />
            新建项目
          </button>
        </div>
      </header>

      <div className="forest-canvas">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          attributionPosition="bottom-left"
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
        </ReactFlow>

        {nodes.length === 0 && loaded && (
          <div className="empty-state">
            <div className="empty-icon">🌲</div>
            <h3>还没有项目</h3>
            <p>创建你的第一个项目，开始种植你的项目森林</p>
            <button onClick={() => setShowTemplateModal(true)} className="btn-create">
              从模板创建项目
            </button>
          </div>
        )}
      </div>

      {showTemplateModal && (
        <TemplateModal onClose={() => setShowTemplateModal(false)} />
      )}

      {showImportExport && (
        <ImportExportModal onClose={() => setShowImportExport(false)} />
      )}
    </div>
  )
}
