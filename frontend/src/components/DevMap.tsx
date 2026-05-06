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
import { useMemo, useEffect } from 'react'
import './DevMap.css'

// 节点颜色
const MILESTONE_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#6366f1', '#84cc16', '#e11d48'
]

// 项目节点
function ProjectNode({ data }: { data: any }) {
  const { selectProject, setViewMode, deleteProject, fetchProjectTree } = useStore()

  const handleView = () => {
    if (data.projectId) {
      selectProject(data.projectId)
      fetchProjectTree(data.projectId)
      setViewMode('timeline')
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
      <div className="node-label">{data.label}</div>
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

// 里程碑节点（树枝）
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

// 花节点
function FlowerMapNode({ data }: { data: any }) {
  return (
    <div className="dev-node flower" style={{ borderColor: data.color, background: 'rgba(236, 72, 153, 0.1)' }}>
      <Handle type="target" position={Position.Left} style={{ background: data.color }} />
      <div className="node-icon">🌸</div>
      <div className="node-label">{data.label}</div>
    </div>
  )
}

// 果节点
function FruitMapNode({ data }: { data: any }) {
  return (
    <div className="dev-node fruit" style={{ borderColor: data.color, background: 'rgba(34, 197, 94, 0.1)' }}>
      <Handle type="target" position={Position.Left} style={{ background: data.color }} />
      <div className="node-icon">🍎</div>
      <div className="node-label">{data.label}</div>
    </div>
  )
}

// 根节点
function RootNode({ data }: { data: any }) {
  return (
    <div className="dev-node root">
      <div className="node-icon">👤</div>
      <div className="node-label">{data.label}</div>
      <Handle type="source" position={Position.Right} style={{ background: '#3b82f6' }} />
    </div>
  )
}

const nodeTypes = {
  root: RootNode,
  project: ProjectNode,
  milestone: MilestoneMapNode,
  flower: FlowerMapNode,
  fruit: FruitMapNode,
}

function buildDevMapNodes(projects: any[], projectTrees: Map<string, any>) {
  const nodes: Node[] = []
  const edges: any[] = []

  // Root node (Developer)
  nodes.push({
    id: 'root',
    type: 'root',
    data: { label: '开发者' },
    position: { x: 50, y: 300 },
  })

  // Project nodes and their children
  const projectSpacing = 250
  let projectY = 100

  projects.forEach((project) => {
    const projectNodeY = projectY

    nodes.push({
      id: project.id,
      type: 'project',
      data: {
        label: project.name,
        status: project.status,
        color: project.color,
        projectId: project.id,
      },
      position: { x: 250, y: projectNodeY },
    })

    edges.push({
      id: `root-${project.id}`,
      source: 'root',
      target: project.id,
      style: { stroke: project.color, strokeWidth: 2 },
      markerEnd: MarkerType.ArrowClosed,
    })

    // Get project tree data
    const tree = projectTrees.get(project.id)
    if (tree && tree.nodes) {
      // Get milestones (branches)
      const milestones = tree.nodes
        .filter((n: any) => n.is_milestone === 1)
        .sort((a: any, b: any) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime())

      let milestoneY = projectNodeY - (milestones.length - 1) * 50

      milestones.forEach((milestone: any, mIndex: number) => {
        const color = milestone.color || MILESTONE_COLORS[mIndex % MILESTONE_COLORS.length]
        const milestoneId = `m-${milestone.id}`
        const milestoneX = 500
        const milestoneNodeY = milestoneY + mIndex * 100

        nodes.push({
          id: milestoneId,
          type: 'milestone',
          data: {
            label: milestone.milestone_name || milestone.title,
            color,
          },
          position: { x: milestoneX, y: milestoneNodeY },
        })

        edges.push({
          id: `${project.id}-${milestoneId}`,
          source: project.id,
          target: milestoneId,
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: MarkerType.ArrowClosed,
        })

        // Get children (flowers and fruits) of this milestone
        const children = tree.nodes.filter((n: any) => n.parent_id === milestone.id)

        let childY = milestoneNodeY - (children.length - 1) * 40
        children.forEach((child: any, cIndex: number) => {
          const childId = `c-${child.id}`
          const childX = 720
          const childNodeY = childY + cIndex * 80

          nodes.push({
            id: childId,
            type: child.type === 'flower' ? 'flower' : 'fruit',
            data: {
              label: child.title,
              color,
            },
            position: { x: childX, y: childNodeY },
          })

          edges.push({
            id: `${milestoneId}-${childId}`,
            source: milestoneId,
            target: childId,
            type: 'smoothstep',
            style: { stroke: color, strokeWidth: 2 },
            markerEnd: MarkerType.ArrowClosed,
          })
        })
      })
    }

    projectY += projectSpacing + (tree?.nodes?.filter((n: any) => n.is_milestone === 1).length || 0) * 50
  })

  return { nodes, edges }
}

export default function DevMap() {
  const { projects, fetchProjectTree } = useStore()

  // Fetch all project trees on mount
  useEffect(() => {
    projects.forEach(p => {
      if (!p.nodes || p.nodes.length === 0) {
        fetchProjectTree(p.id)
      }
    })
  }, [projects, fetchProjectTree])

  // Create a map to store project trees
  const projectTrees = useMemo(() => {
    const map = new Map<string, any>()
    projects.forEach(p => {
      if (p.nodes && p.nodes.length > 0) {
        map.set(p.id, p)
      }
    })
    return map
  }, [projects])

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildDevMapNodes(projects, projectTrees),
    [projects, projectTrees]
  )
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="dev-map">
      <div className="dev-map-header">
        <h2>🗺️ 开发地图</h2>
        <p className="hint">点击项目查看时间线，拖拽调整布局</p>
      </div>

      <div className="dev-map-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          attributionPosition="bottom-left"
        >
          <Background color="#222" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
