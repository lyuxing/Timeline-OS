import ReactFlow, {
  Node,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useStore } from '../store'
import { STATUS_ICONS, ProjectStatus } from '../types'
import { Trash2, Eye } from 'lucide-react'
import { useMemo, useEffect, useState } from 'react'
import './DevMap.css'

const MILESTONE_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#6366f1', '#84cc16', '#e11d48'
]

function DeveloperNode({ data }: { data: any }) {
  return (
    <div className="dev-node developer" style={{ borderColor: data.color }}>
      <Handle type="source" position={Position.Right} style={{ background: data.color }} />
      <div className="node-icon">{data.avatar || '👤'}</div>
      <div className="node-label">{data.name}</div>
    </div>
  )
}

function ProjectNode({ data }: { data: any }) {
  const { selectProject, setViewMode, deleteProject, fetchProjectTree } = useStore()

  const handleView = () => {
    if (data.projectId) {
      selectProject(data.projectId)
      fetchProjectTree(data.projectId)
      setViewMode('timeline-edit')
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.projectId && confirm('确定删除此项目？')) {
      deleteProject(data.projectId)
    }
  }

  return (
    <div className="dev-node project">
      <Handle type="target" position={Position.Left} style={{ background: data.color }} />
      <div className="node-icon">{STATUS_ICONS[data.status as ProjectStatus]}</div>
      <div className="node-label">{data.name}</div>
      <div className="node-actions">
        <button onClick={handleView} title="查看时间线">
          <Eye size={14} />
        </button>
        <button onClick={handleDelete} title="删除项目" className="delete">
          <Trash2 size={14} />
        </button>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: data.color }} />
    </div>
  )
}

function MilestoneMapNode({ data }: { data: any }) {
  return (
    <div className="dev-node milestone" style={{ borderColor: data.color }}>
      <Handle type="target" position={Position.Left} style={{ background: data.color }} />
      <div className="node-icon">🚩</div>
      <div className="node-label" style={{ color: data.color }}>{data.label}</div>
      <Handle type="source" position={Position.Right} style={{ background: data.color }} />
    </div>
  )
}

function FlowerMapNode({ data }: { data: any }) {
  return (
    <div className="dev-node flower" style={{ borderColor: data.color, background: 'rgba(236, 72, 153, 0.1)' }}>
      <Handle type="target" position={Position.Left} style={{ background: data.color }} />
      <div className="node-icon">🌸</div>
      <div className="node-label">{data.label}</div>
    </div>
  )
}

function FruitMapNode({ data }: { data: any }) {
  return (
    <div className="dev-node fruit" style={{ borderColor: data.color, background: 'rgba(34, 197, 94, 0.1)' }}>
      <Handle type="target" position={Position.Left} style={{ background: data.color }} />
      <div className="node-icon">🍎</div>
      <div className="node-label">{data.label}</div>
    </div>
  )
}

const nodeTypes = {
  developer: DeveloperNode,
  project: ProjectNode,
  milestone: MilestoneMapNode,
  flower: FlowerMapNode,
  fruit: FruitMapNode,
}

function buildDevMapNodes(developers: any[], projects: any[], projectTrees: Map<string, any>) {
  const nodes: Node[] = []
  const edges: any[] = []

  // 开发者节点
  const developerSpacing = 200
  developers.forEach((dev, index) => {
    nodes.push({
      id: dev.id,
      type: 'developer',
      data: {
        name: dev.name,
        avatar: dev.avatar,
        color: dev.color,
      },
      position: { x: 50, y: 100 + index * developerSpacing },
    })
  })

  // 项目节点
  projects.forEach((project) => {
    const developerId = project.developer_id
    const developer = developers.find(d => d.id === developerId)
    const devIndex = developers.findIndex(d => d.id === developerId)

    if (!developer) return

    // 计算项目位置
    const projectsOfDev = projects.filter(p => p.developer_id === developerId)
    const projIndex = projectsOfDev.findIndex(p => p.id === project.id)

    const projectX = 280 + projIndex * 180
    const projectY = 100 + devIndex * developerSpacing

    nodes.push({
      id: project.id,
      type: 'project',
      data: {
        name: project.name,
        status: project.status,
        color: project.color,
        projectId: project.id,
      },
      position: { x: projectX, y: projectY },
    })

    edges.push({
      id: `${developerId}-${project.id}`,
      source: developerId,
      target: project.id,
      style: { stroke: project.color, strokeWidth: 2 },
      markerEnd: MarkerType.ArrowClosed,
    })

    // 里程碑和花果节点
    const tree = projectTrees.get(project.id)
    if (tree && tree.nodes) {
      const milestones = tree.nodes
        .filter((n: any) => n.is_milestone === 1 || n.is_milestone === true)
        .sort((a: any, b: any) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime())

      milestones.forEach((milestone: any, mIndex: number) => {
        const color = milestone.color || MILESTONE_COLORS[mIndex % MILESTONE_COLORS.length]
        const milestoneId = `m-${milestone.id}`
        const milestoneX = projectX + 200
        const milestoneY = projectY - 30 + mIndex * 60

        nodes.push({
          id: milestoneId,
          type: 'milestone',
          data: {
            label: milestone.milestone_name || milestone.title,
            color,
          },
          position: { x: milestoneX, y: milestoneY },
        })

        edges.push({
          id: `${project.id}-${milestoneId}`,
          source: project.id,
          target: milestoneId,
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: MarkerType.ArrowClosed,
        })

        const children = tree.nodes.filter((n: any) => n.parent_id === milestone.id)
        children.forEach((child: any, cIndex: number) => {
          const childId = `c-${child.id}`
          const childX = milestoneX + 180
          const childY = milestoneY - 20 + cIndex * 50

          nodes.push({
            id: childId,
            type: child.type === 'flower' ? 'flower' : 'fruit',
            data: {
              label: child.title,
              color,
            },
            position: { x: childX, y: childY },
          })

          edges.push({
            id: `${milestoneId}-${childId}`,
            source: milestoneId,
            target: childId,
            type: 'smoothstep',
            style: { stroke: color, strokeWidth: 1.5 },
            markerEnd: MarkerType.ArrowClosed,
          })
        })
      })
    }
  })

  return { nodes, edges }
}

export default function DevMap() {
  const { developers, projects, fetchProjects, fetchDevelopers, fetchProjectTree, createProject } = useStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedDeveloperId, setSelectedDeveloperId] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      await fetchProjects()
      await fetchDevelopers()
      setLoaded(true)
    }
    loadData()
  }, [fetchProjects, fetchDevelopers])

  // 确保所有项目的节点数据都已加载
  useEffect(() => {
    if (loaded && projects.length > 0) {
      // 检查是否有项目缺少 nodes 数据
      const needsFetch = projects.some(p => !p.nodes)
      if (needsFetch) {
        projects.forEach(p => {
          if (!p.nodes) {
            fetchProjectTree(p.id)
          }
        })
      }
    }
  }, [loaded, projects, fetchProjectTree])

  const projectTrees = useMemo(() => {
    const map = new Map<string, any>()
    projects.forEach(p => {
      if (p.nodes && p.nodes.length > 0) {
        map.set(p.id, p)
      }
    })
    return map
  }, [projects])

  const { nodes: computedNodes, edges: computedEdges } = useMemo(
    () => buildDevMapNodes(developers, projects, projectTrees),
    [developers, projects, projectTrees]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 当计算出的节点/边变化时，立即更新状态
  useEffect(() => {
    if (computedNodes.length > 0) {
      setNodes(computedNodes)
      setEdges(computedEdges)
    }
  }, [computedNodes, computedEdges, setNodes, setEdges])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    await createProject(newProjectName.trim(), '', selectedDeveloperId || undefined)
    setNewProjectName('')
    setSelectedDeveloperId('')
    setShowCreateModal(false)
  }

  const handleNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
    if (node.type === 'developer' && node.id !== 'add-developer') {
      // 双击开发者节点可以创建项目
      setSelectedDeveloperId(node.id)
      setShowCreateModal(true)
    }
  }

  return (
    <div className="dev-map">
      <div className="dev-map-header">
        <h2>🗺️ 开发地图</h2>
        <p className="hint">双击开发者创建项目，点击项目查看时间线</p>
        <button onClick={() => setShowCreateModal(true)} className="btn-new-project">
          + 新建项目
        </button>
      </div>

      <div className="dev-map-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={handleNodeDoubleClick}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          attributionPosition="bottom-left"
        >
          <Background color="#222" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {/* 创建项目弹窗 */}
      {showCreateModal && (
        <div onClick={() => setShowCreateModal(false)} className="modal-overlay">
          <div onClick={e => e.stopPropagation()} className="modal">
            <h3>新建项目</h3>
            <label>项目名称</label>
            <input
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="输入项目名称"
              autoFocus
            />
            <label>关联开发者</label>
            <select
              value={selectedDeveloperId}
              onChange={e => setSelectedDeveloperId(e.target.value)}
            >
              <option value="">选择开发者</option>
              {developers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>取消</button>
              <button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
