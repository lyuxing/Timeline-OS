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

// 主视角节点 - 当前用户（中心，大）
function MainUserNode({ data }: { data: any }) {
  return (
    <div className="main-user-node" style={{ borderColor: data.color }}>
      <Handle type="source" position={Position.Top} id="toUp" style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} id="toDown" style={{ background: '#8b5cf6' }} />
      <div className="main-avatar">{data.avatar || '👤'}</div>
      <div className="main-name">{data.name}</div>
      <div className="main-label">我的项目树</div>
      <div className="main-stats">
        <span className="stat-up">↑ {data.activeCount || 0} 进行中</span>
        <span className="stat-down">↓ {data.archiveCount || 0} 已归档</span>
      </div>
    </div>
  )
}

// 相关用户节点（周围，小）
function RelatedUserNode({ data }: { data: any }) {
  return (
    <div className="related-user-node" style={{ borderColor: data.color }}>
      <Handle type="source" position={Position.Top} id="toUp" style={{ background: '#22c55e' }} />
      <div className="related-avatar">{data.avatar || '👤'}</div>
      <div className="related-name">{data.name}</div>
      <div className="related-relation">{data.relation || '队友'}</div>
    </div>
  )
}

// 里程碑节点（向上生长）
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

// 花节点（论文/竞赛）
function FlowerNode({ data }: { data: any }) {
  return (
    <div className="flower-node">
      <Handle type="target" position={Position.Bottom} style={{ background: '#ec4899' }} />
      <div className="flower-icon">🌸</div>
      <div className="flower-name">{data.name}</div>
    </div>
  )
}

// 果节点（产品/成果）
function FruitNode({ data }: { data: any }) {
  return (
    <div className="fruit-node">
      <Handle type="target" position={Position.Bottom} style={{ background: '#22c55e' }} />
      <div className="fruit-icon">🍎</div>
      <div className="fruit-name">{data.name}</div>
    </div>
  )
}

// 知识库节点（地下）
function KnowledgeNode({ data }: { data: any }) {
  return (
    <div className="knowledge-node">
      <Handle type="target" position={Position.Top} style={{ background: '#8b5cf6' }} />
      <Handle type="source" position={Position.Bottom} id="toDeeper" style={{ background: '#6b21a8' }} />
      <div className="knowledge-icon">{data.isArchive ? '📦' : '📚'}</div>
      <div className="knowledge-name">{data.name}</div>
      {data.itemCount !== undefined && (
        <div className="knowledge-count">{data.itemCount} 项</div>
      )}
    </div>
  )
}

// 知识文档节点
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
  mainUser: MainUserNode,
  relatedUser: RelatedUserNode,
  trunk: TrunkNode,
  flower: FlowerNode,
  fruit: FruitNode,
  knowledge: KnowledgeNode,
  knowledgeLeaf: KnowledgeLeafNode,
}

// 构建当前用户的完整项目树
function buildMainUserTree(
  user: any,
  developer: any,
  projects: any[],
  allProjectNodes: Map<string, any[]>,
  centerX: number,
  centerY: number
): { nodes: Node[], edges: Edge[], activeCount: number, archiveCount: number } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // 该开发者的项目
  const devProjects = projects.filter(p => p.developer_id === developer?.id)
  const activeProjects = devProjects.filter(p => p.status !== 'archived')
  const archivedProjects = devProjects.filter(p => p.status === 'archived')

  // 主用户节点
  nodes.push({
    id: 'main-user',
    type: 'mainUser',
    position: { x: centerX, y: centerY },
    data: {
      name: user?.name || developer?.name || '我',
      avatar: developer?.avatar,
      color: developer?.color || '#22c55e',
      activeCount: activeProjects.length,
      archiveCount: archivedProjects.length,
    },
  })

  // 向上：正在进行的项目
  let branchIndex = 0
  const spacing = 140

  activeProjects.forEach(project => {
    const projectNodes = allProjectNodes.get(project.id) || []
    const topMilestones = projectNodes
      .filter((n: any) => n.is_milestone === 1 && !n.parent_id)
      .sort((a: any, b: any) => new Date(a.milestone_date || 0).getTime() - new Date(b.milestone_date || 0).getTime())

    const projectColor = project.color || BRANCH_COLORS[branchIndex % BRANCH_COLORS.length]
    const totalWidth = (activeProjects.length - 1) * spacing

    topMilestones.forEach((milestone: any, mIdx: number) => {
      const branchX = centerX - totalWidth / 2 + branchIndex * spacing
      const branchY = centerY - 150 - mIdx * 90

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
        source: 'main-user',
        sourceHandle: 'toUp',
        target: milestone.id,
        targetHandle: 'fromBelow',
        style: { stroke: projectColor, strokeWidth: 3 },
      })

      // 子节点
      let leafOffset = -50
      childNodes.forEach((child: any) => {
        if (child.is_milestone === 1) {
          nodes.push({
            id: child.id,
            type: 'trunk',
            position: { x: branchX + leafOffset, y: branchY - 90 },
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
          const leafType = child.type === 'flower' ? 'flower' : child.type === 'fruit' ? 'fruit' : null
          if (leafType) {
            nodes.push({
              id: child.id,
              type: leafType,
              position: { x: branchX + leafOffset * 1.5, y: branchY - 70 },
              data: { name: child.title },
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
        leafOffset += 50
      })

      branchIndex++
    })
  })

  // 向下：知识库和归档项目
  let knowledgeY = centerY + 120
  const knowledgeX = centerX

  // 知识库（如果有）
  nodes.push({
    id: 'knowledge-library',
    type: 'knowledge',
    position: { x: knowledgeX - 80, y: knowledgeY },
    data: { name: '知识库', isArchive: false, itemCount: 0 },
  })
  edges.push({
    id: 'edge-knowledge',
    source: 'main-user',
    sourceHandle: 'toDown',
    target: 'knowledge-library',
    style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5,5' },
  })

  // 归档项目
  archivedProjects.forEach((project, idx) => {
    const archiveY = knowledgeY + 80 + idx * 70
    nodes.push({
      id: `archive-${project.id}`,
      type: 'knowledge',
      position: { x: knowledgeX + 80, y: archiveY },
      data: { name: project.name, isArchive: true },
    })
    edges.push({
      id: `edge-archive-${project.id}`,
      source: 'main-user',
      sourceHandle: 'toDown',
      target: `archive-${project.id}`,
      style: { stroke: '#6b21a8', strokeWidth: 2 },
    })
  })

  return { nodes, edges, activeCount: activeProjects.length, archiveCount: archivedProjects.length }
}

// 构建相关用户节点（围绕主用户）
function buildRelatedUsers(
  currentUser: any,
  developers: any[],
  centerX: number,
  centerY: number
): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // 过滤出其他用户（同团队或有项目关联）
  const otherDevelopers = developers.filter(d => d.userId !== currentUser?.id)

  // 按相关性排序并计算距离
  const maxDistance = 350
  const minDistance = 200

  otherDevelopers.forEach((dev, index) => {
    // 计算角度和距离（相关性越高越近）
    const angle = (index * 60 - 90) * (Math.PI / 180) // 从上方开始，间隔60度
    const relevance = 1 - (index * 0.1) // 相关性递减
    const distance = minDistance + (maxDistance - minDistance) * (1 - relevance)

    const x = centerX + Math.cos(angle) * distance
    const y = centerY + Math.sin(angle) * distance

    nodes.push({
      id: `related-${dev.id}`,
      type: 'relatedUser',
      position: { x, y },
      data: {
        name: dev.name,
        avatar: dev.avatar,
        color: dev.color,
        relation: '队友',
        relevance,
      },
    })

    // 连接线（虚线，表示弱关联）
    edges.push({
      id: `edge-related-${dev.id}`,
      source: 'main-user',
      target: `related-${dev.id}`,
      type: 'straight',
      style: { stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3,3' },
    })
  })

  return { nodes, edges }
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

  // 找到当前用户对应的开发者
  const mainDeveloper = useMemo(() => {
    return developers.find(d => d.userId === user?.id)
  }, [developers, user])

  // 构建视图
  const treeData = useMemo(() => {
    const centerX = 500
    const centerY = 380

    const mainTree = buildMainUserTree(user, mainDeveloper, projects, projectNodesMap, centerX, centerY)
    const relatedTree = buildRelatedUsers(user, developers, centerX, centerY)

    return {
      nodes: [...mainTree.nodes, ...relatedTree.nodes],
      edges: [...mainTree.edges, ...relatedTree.edges],
    }
  }, [user, mainDeveloper, developers, projects, projectNodesMap])

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
          中心是您的项目树，周围是相关队友 ↑进行中 ↓知识沉淀
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
          minZoom={0.3}
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
              <span><span className="legend-icon">🌸</span> 花（论文）</span>
              <span><span className="legend-icon">🍎</span> 果（产品）</span>
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
