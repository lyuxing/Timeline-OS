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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useStore } from '../store'
import { Eye, FileText, Download } from 'lucide-react'
import TemplateModal from './TemplateModal'
import ImportExportModal from './ImportExportModal'
import './ProjectForest.css'

const BRANCH_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#6366f1', '#84cc16', '#e11d48'
]

// 主视角节点 - 当前用户（大）
function MainGroundNode({ data }: { data: any }) {
  return (
    <div className="main-ground-node" style={{ borderColor: data.color }}>
      <Handle type="source" position={Position.Top} id="toUp" style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} id="toDown" style={{ background: '#8b5cf6' }} />
      <div className="main-avatar">{data.avatar || '👤'}</div>
      <div className="main-name">{data.name}</div>
      <div className="main-label">我的项目树</div>
    </div>
  )
}

// 其他开发者节点（小）
function OtherGroundNode({ data }: { data: any }) {
  return (
    <div className="other-ground-node" style={{ borderColor: data.color }}>
      <Handle type="source" position={Position.Top} id="toUp" style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} id="toDown" style={{ background: '#8b5cf6' }} />
      <div className="other-avatar">{data.avatar || '👤'}</div>
      <div className="other-name">{data.name}</div>
    </div>
  )
}

// 里程碑节点
function TrunkNode({ data }: { data: any }) {
  const color = data.color || '#f59e0b'
  const level = data.level || 0
  const icon = level === 0 ? '🚩' : level === 1 ? '📍' : '📌'

  return (
    <div className="trunk-node" style={{ borderColor: color }}>
      <Handle type="target" position={Position.Bottom} id="fromBelow" style={{ background: color }} />
      <Handle type="source" position={Position.Top} id="toAbove" style={{ background: color }} />
      <Handle type="source" position={Position.Left} id="toLeft" style={{ background: color }} />
      <Handle type="source" position={Position.Right} id="toRight" style={{ background: color }} />

      <div className="trunk-icon">{icon}</div>
      <div className="trunk-name" style={{ color }}>{data.name}</div>
      <div className="trunk-date">{data.dueDate}</div>

      {data.hasChildren && (
        <div className="trunk-badge" style={{ background: color }}>{data.childCount}</div>
      )}
    </div>
  )
}

// 花节点
function FlowerNode({ data }: { data: any }) {
  return (
    <div className="flower-node">
      <Handle type="target" position={Position.Bottom} style={{ background: '#ec4899' }} />
      <div className="flower-icon">🌸</div>
      <div className="flower-name">{data.name}</div>
    </div>
  )
}

// 果节点
function FruitNode({ data }: { data: any }) {
  return (
    <div className="fruit-node">
      <Handle type="target" position={Position.Bottom} style={{ background: '#22c55e' }} />
      <div className="fruit-icon">🍎</div>
      <div className="fruit-name">{data.name}</div>
    </div>
  )
}

// 树根节点（地下）
function RootNode({ data }: { data: any }) {
  return (
    <div className="root-node">
      <Handle type="target" position={Position.Top} style={{ background: '#8b5cf6' }} />
      <div className="root-icon">{data.isArchive ? '📦' : '📚'}</div>
      <div className="root-name">{data.name}</div>
    </div>
  )
}

const nodeTypes = {
  mainGround: MainGroundNode,
  otherGround: OtherGroundNode,
  trunk: TrunkNode,
  flower: FlowerNode,
  fruit: FruitNode,
  root: RootNode,
}

// 构建开发者树
function buildDeveloperTree(
  developer: any,
  projects: any[],
  allProjectNodes: Map<string, any[]>,
  centerX: number,
  isMain: boolean
): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const groundY = 400

  // 地面节点
  const groundType = isMain ? 'mainGround' : 'otherGround'

  nodes.push({
    id: `ground-${developer.id}`,
    type: groundType,
    position: { x: centerX, y: groundY },
    data: {
      id: developer.id,
      name: developer.name,
      avatar: developer.avatar,
      color: developer.color,
    },
  })

  // 该开发者的项目
  const devProjects = projects.filter(p => p.developer_id === developer.id)

  // 活跃项目（向上）
  const activeProjects = devProjects.filter(p => p.status !== 'archived')
  let branchIndex = 0

  activeProjects.forEach(project => {
    const projectNodes = allProjectNodes.get(project.id) || []
    const topMilestones = projectNodes
      .filter((n: any) => n.is_milestone === 1 && !n.parent_id)
      .sort((a: any, b: any) => new Date(a.milestone_date || 0).getTime() - new Date(b.milestone_date || 0).getTime())

    const projectColor = project.color || BRANCH_COLORS[branchIndex % BRANCH_COLORS.length]
    const spacing = isMain ? 160 : 120

    topMilestones.forEach((milestone: any, mIdx: number) => {
      const branchX = centerX - (activeProjects.length > 1 ? (activeProjects.length - 1) * spacing / 2 : 0) + branchIndex * spacing
      const branchY = groundY - 120 - mIdx * 80

      const childNodes = projectNodes.filter((n: any) => n.parent_id === milestone.id)

      nodes.push({
        id: milestone.id,
        type: 'trunk',
        position: { x: branchX, y: branchY },
        data: {
          name: milestone.milestone_name || milestone.title,
          dueDate: milestone.milestone_date ? new Date(milestone.milestone_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '',
          color: projectColor,
          level: 0,
          hasChildren: childNodes.length > 0,
          childCount: childNodes.length,
          projectId: project.id,
        },
      })

      edges.push({
        id: `edge-up-${milestone.id}`,
        source: `ground-${developer.id}`,
        sourceHandle: 'toUp',
        target: milestone.id,
        targetHandle: 'fromBelow',
        style: { stroke: projectColor, strokeWidth: isMain ? 3 : 2 },
      })

      // 子节点
      let leafOffset = -60
      childNodes.forEach((child: any) => {
        if (child.is_milestone === 1) {
          // 子里程碑
          nodes.push({
            id: child.id,
            type: 'trunk',
            position: { x: branchX + leafOffset, y: branchY - 80 },
            data: {
              name: child.milestone_name || child.title,
              dueDate: child.milestone_date ? new Date(child.milestone_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '',
              color: projectColor,
              level: 1,
              projectId: project.id,
            },
          })
          edges.push({
            id: `edge-${milestone.id}-${child.id}`,
            source: milestone.id,
            sourceHandle: 'toAbove',
            target: child.id,
            targetHandle: 'fromBelow',
            style: { stroke: projectColor, strokeWidth: 2 },
          })
        } else {
          // 花或果
          const leafType = child.type === 'flower' ? 'flower' : child.type === 'fruit' ? 'fruit' : null
          if (leafType) {
            nodes.push({
              id: child.id,
              type: leafType,
              position: { x: branchX + leafOffset, y: branchY - 60 },
              data: { name: child.title },
            })
            edges.push({
              id: `edge-${milestone.id}-${child.id}`,
              source: milestone.id,
              sourceHandle: leafOffset < 0 ? 'toLeft' : 'toRight',
              target: child.id,
              targetHandle: 'Bottom',
              type: 'smoothstep',
              style: { stroke: leafType === 'flower' ? '#ec4899' : '#22c55e', strokeWidth: 1.5 },
            })
          }
        }
        leafOffset += 60
      })

      branchIndex++
    })
  })

  // 归档项目（向下）
  const archivedProjects = devProjects.filter(p => p.status === 'archived')
  archivedProjects.forEach((project, idx) => {
    nodes.push({
      id: `archive-${project.id}`,
      type: 'root',
      position: { x: centerX + idx * 100 - 50, y: groundY + 100 },
      data: { name: project.name, isArchive: true },
    })
    edges.push({
      id: `edge-down-${project.id}`,
      source: `ground-${developer.id}`,
      sourceHandle: 'toDown',
      target: `archive-${project.id}`,
      style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '4,4' },
    })
  })

  return { nodes, edges }
}

// 构建整个项目树
function buildProjectTree(
  currentUser: any,
  developers: any[],
  projects: any[],
  allProjectNodes: Map<string, any[]>
): { nodes: Node[], edges: Edge[] } {
  let allNodes: Node[] = []
  let allEdges: Edge[] = []

  console.log('Building project tree:', {
    currentUser: currentUser?.id,
    developers: developers.map(d => ({ id: d.id, name: d.name, userId: d.userId })),
    projects: projects.map(p => ({ id: p.id, name: p.name, developer_id: p.developer_id })),
  })

  // 找到当前用户对应的开发者
  const mainDeveloper = developers.find(d => d.userId === currentUser?.id)
  console.log('Main developer:', mainDeveloper)

  if (mainDeveloper) {
    // 主视角（当前用户）
    const tree = buildDeveloperTree(mainDeveloper, projects, allProjectNodes, 450, true)
    allNodes = [...allNodes, ...tree.nodes]
    allEdges = [...allEdges, ...tree.edges]
  }

  // 其他开发者（在右侧，缩小显示）
  const otherDevelopers = developers.filter(d => d.userId !== currentUser?.id)
  const offsetX = 950

  otherDevelopers.forEach((dev, index) => {
    const tree = buildDeveloperTree(dev, projects, allProjectNodes, offsetX + index * 350, false)
    allNodes = [...allNodes, ...tree.nodes]
    allEdges = [...allEdges, ...tree.edges]
  })

  return { nodes: allNodes, edges: allEdges }
}

export default function ProjectForest() {
  const { user, projects, developers, fetchProjects, fetchDevelopers, fetchProjectTree, selectProject, setViewMode } = useStore()
  const [loaded, setLoaded] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProjects(), fetchDevelopers()])
      setLoaded(true)
    }
    loadData()
  }, [fetchProjects, fetchDevelopers])

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

  // 构建项目节点的Map
  const projectNodesMap = useMemo(() => {
    const map = new Map<string, any[]>()
    projects.forEach(p => {
      if (p.nodes && p.nodes.length > 0) {
        map.set(p.id, p.nodes)
      }
    })
    return map
  }, [projects])

  // 构建视图
  const treeData = useMemo(() => {
    return buildProjectTree(user, developers, projects, projectNodesMap)
  }, [user, developers, projects, projectNodesMap])

  useEffect(() => {
    if (treeData.nodes.length > 0) {
      setNodes(treeData.nodes)
      setEdges(treeData.edges)
    }
  }, [treeData, setNodes, setEdges])

  // 节点点击处理
  const handleNodeClick = (_: any, node: Node) => {
    if (node.type === 'trunk') {
      const projectId = node.data?.projectId
      if (projectId) {
        selectProject(projectId)
        fetchProjectTree(projectId)
        setViewMode('timeline-edit')
      }
    }
  }

  return (
    <div className="project-forest">
      <header className="forest-header">
        <div className="header-left">
          <h2>🌲 项目树</h2>
        </div>

        <p className="header-hint">
          地面是开发者，向上是正在生长的项目🌳，向下是归档项目📦
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
          <button onClick={() => setViewMode('timeline')} className="btn-timeline">
            <Eye size={16} />
            时间线
          </button>
        </div>
      </header>

      <div className="forest-canvas">
        {/* 地面线 */}
        <div className="ground-line-visual" />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          attributionPosition="bottom-left"
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
        </ReactFlow>

        {/* 图例 */}
        <div className="forest-legend">
          <div className="legend-section">
            <div className="legend-title">↑ 地上（进行中）</div>
            <div className="legend-items">
              <span><span className="legend-icon">🚩</span> 里程碑</span>
              <span><span className="legend-icon">🌸</span> 花（论文/竞赛）</span>
              <span><span className="legend-icon">🍎</span> 果（产品/成果）</span>
            </div>
          </div>
          <div className="legend-divider" />
          <div className="legend-section">
            <div className="legend-title">↓ 地下（知识沉淀）</div>
            <div className="legend-items">
              <span><span className="legend-icon">📚</span> 知识库</span>
              <span><span className="legend-icon">📦</span> 归档项目</span>
            </div>
          </div>
        </div>
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
