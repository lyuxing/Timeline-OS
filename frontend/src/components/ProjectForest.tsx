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

// 地面节点 - 开发者
function GroundNode({ data }: { data: any }) {
  return (
    <div className="ground-node">
      <Handle type="source" position={Position.Top} id="toUp" style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} id="toDown" style={{ background: '#8b5cf6' }} />
      <div className="ground-avatar">{data.avatar || '👤'}</div>
      <div className="ground-name">{data.name}</div>
      <div className="ground-line" style={{ background: data.color }} />
    </div>
  )
}

// 向上生长的树干 - 正在进行的里程碑
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

// 花节点 - 论文、竞赛等成果展示
function FlowerNode({ data }: { data: any }) {
  return (
    <div className="flower-node">
      <Handle type="target" position={Position.Bottom} style={{ background: '#ec4899' }} />
      <div className="flower-icon">🌸</div>
      <div className="flower-name">{data.name}</div>
      <div className="flower-hint">{data.hint || '论文/竞赛'}</div>
    </div>
  )
}

// 果节点 - 产品、模式等产出
function FruitNode({ data }: { data: any }) {
  return (
    <div className="fruit-node">
      <Handle type="target" position={Position.Bottom} style={{ background: '#22c55e' }} />
      <div className="fruit-icon">🍎</div>
      <div className="fruit-name">{data.name}</div>
      <div className="fruit-hint">{data.hint || '产品/成果'}</div>
    </div>
  )
}

// 树根节点 - 知识库（地下）
function RootNode({ data }: { data: any }) {
  return (
    <div className="root-node">
      <Handle type="target" position={Position.Top} style={{ background: '#8b5cf6' }} />
      <Handle type="source" position={Position.Bottom} id="toDeeper" style={{ background: '#6b21a8' }} />
      <div className="root-icon">{data.isArchive ? '📦' : '📚'}</div>
      <div className="root-name">{data.name}</div>
      {data.itemCount !== undefined && (
        <div className="root-count">{data.itemCount} 项</div>
      )}
    </div>
  )
}

// 知识叶子节点（地下）
function KnowledgeLeafNode({ data }: { data: any }) {
  return (
    <div className="knowledge-leaf">
      <Handle type="target" position={Position.Top} style={{ background: '#6b21a8' }} />
      <div className="leaf-icon">📄</div>
      <div className="leaf-name">{data.name}</div>
    </div>
  )
}

const nodeTypes = {
  ground: GroundNode,
  trunk: TrunkNode,
  flower: FlowerNode,
  fruit: FruitNode,
  root: RootNode,
  knowledgeLeaf: KnowledgeLeafNode,
}

// 构建开发者树（包含地上和地下）
function buildDeveloperTree(
  developer: any,
  projects: any[],
  allProjectNodes: Map<string, any[]>,
  offsetX: number
): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const groundY = 400

  // 地面节点 - 开发者
  nodes.push({
    id: `ground-${developer.id}`,
    type: 'ground',
    position: { x: offsetX, y: groundY },
    data: {
      id: developer.id,
      name: developer.name,
      avatar: developer.avatar,
      color: developer.color,
    },
  })

  // 该开发者的项目
  const devProjects = projects.filter(p => p.developer_id === developer.id)

  // 向上：正在进行的项目的里程碑
  const activeProjects = devProjects.filter(p => p.status !== 'archived' && p.status !== 'blooming')
  let branchIndex = 0

  activeProjects.forEach(project => {
    const projectNodes = allProjectNodes.get(project.id) || []
    const topMilestones = projectNodes
      .filter((n: any) => n.is_milestone === 1 && !n.parent_id)
      .sort((a: any, b: any) => new Date(a.milestone_date || 0).getTime() - new Date(b.milestone_date || 0).getTime())

    const projectColor = project.color || BRANCH_COLORS[branchIndex % BRANCH_COLORS.length]

    topMilestones.forEach((milestone: any, mIdx: number) => {
      const branchX = offsetX - 200 + branchIndex * 160
      const branchY = groundY - 100 - mIdx * 80

      const childNodes = projectNodes.filter((n: any) => n.parent_id === milestone.id)
      const hasChildren = childNodes.length > 0

      nodes.push({
        id: milestone.id,
        type: 'trunk',
        position: { x: branchX, y: branchY },
        data: {
          name: milestone.milestone_name || milestone.title,
          dueDate: milestone.milestone_date ? new Date(milestone.milestone_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '',
          color: projectColor,
          level: 0,
          hasChildren,
          childCount: childNodes.length,
          projectId: project.id,
        },
      })

      // 连接到地面
      edges.push({
        id: `edge-ground-up-${milestone.id}`,
        source: `ground-${developer.id}`,
        sourceHandle: 'toUp',
        target: milestone.id,
        targetHandle: 'fromBelow',
        style: { stroke: projectColor, strokeWidth: 3 },
      })

      // 子节点（花、果、子任务）
      let leafOffset = -80
      childNodes.forEach((child: any) => {
        const isMilestone = child.is_milestone === 1

        if (isMilestone) {
          // 子里程碑
          const childY = branchY - 80
          nodes.push({
            id: child.id,
            type: 'trunk',
            position: { x: branchX + leafOffset, y: childY },
            data: {
              name: child.milestone_name || child.title,
              dueDate: child.milestone_date ? new Date(child.milestone_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '',
              color: projectColor,
              level: 1,
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
            const leafY = branchY - 60
            const leafX = branchX + leafOffset
            nodes.push({
              id: child.id,
              type: leafType,
              position: { x: leafX, y: leafY },
              data: {
                name: child.title,
                hint: leafType === 'flower' ? '论文/竞赛' : '产品/成果',
              },
            })
            edges.push({
              id: `edge-${milestone.id}-${child.id}`,
              source: milestone.id,
              sourceHandle: leafOffset < 0 ? 'toLeft' : 'toRight',
              target: child.id,
              targetHandle: 'Bottom',
              type: 'smoothstep',
              style: { stroke: leafType === 'flower' ? '#ec4899' : '#22c55e', strokeWidth: 2 },
            })
          }
        }
        leafOffset += 80
      })

      branchIndex++
    })
  })

  // 向下：知识库和归档项目
  const archivedProjects = devProjects.filter(p => p.status === 'archived')
  const rootNodeY = groundY + 100

  // 知识库根节点
  const knowledgeId = `knowledge-${developer.id}`
  nodes.push({
    id: knowledgeId,
    type: 'root',
    position: { x: offsetX - 100, y: rootNodeY },
    data: {
      name: '知识库',
      isArchive: false,
      itemCount: 0,
    },
  })
  edges.push({
    id: `edge-ground-down-${knowledgeId}`,
    source: `ground-${developer.id}`,
    sourceHandle: 'toDown',
    target: knowledgeId,
    style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5,5' },
  })

  // 归档项目作为根节点
  archivedProjects.forEach((project, idx) => {
    const archiveY = rootNodeY + 80 + idx * 70
    nodes.push({
      id: `archive-${project.id}`,
      type: 'root',
      position: { x: offsetX + 80, y: archiveY },
      data: {
        name: project.name,
        isArchive: true,
      },
    })
    edges.push({
      id: `edge-ground-archive-${project.id}`,
      source: `ground-${developer.id}`,
      sourceHandle: 'toDown',
      target: `archive-${project.id}`,
      style: { stroke: '#6b21a8', strokeWidth: 2 },
    })
  })

  return { nodes, edges }
}

// 构建整个森林
function buildForest(
  developers: any[],
  projects: any[],
  allProjectNodes: Map<string, any[]>
): { nodes: Node[], edges: Edge[] } {
  let allNodes: Node[] = []
  let allEdges: Edge[] = []

  const spacing = 500
  const startX = 200

  developers.forEach((dev, index) => {
    const tree = buildDeveloperTree(dev, projects, allProjectNodes, startX + index * spacing)
    allNodes = [...allNodes, ...tree.nodes]
    allEdges = [...allEdges, ...tree.edges]
  })

  return { nodes: allNodes, edges: allEdges }
}

export default function ProjectForest() {
  const { projects, developers, fetchProjects, fetchDevelopers, fetchProjectTree, selectProject, setViewMode } = useStore()
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
    return buildForest(developers, projects, projectNodesMap)
  }, [developers, projects, projectNodesMap])

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
          <h2>🌲 项目森林</h2>
        </div>

        <p className="header-hint">
          地面是开发者，向上是正在生长的项目🌳，向下是知识库与归档项目📚
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
              <span><span className="legend-icon">📄</span> 文档/笔记</span>
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
