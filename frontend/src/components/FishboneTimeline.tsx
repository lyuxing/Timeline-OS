import { useEffect, useState, useRef } from 'react'
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Handle, Position, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { useStore } from '../store'
import { STATUS_ICONS, ProjectStatus } from '../types'

// 里程碑颜色数组
const MILESTONE_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#6366f1', '#84cc16', '#e11d48'
]

// 自定义里程碑节点组件
function MilestoneNode({ data }: { data: any }) {
  const color = data.color || '#f59e0b'
  const isUp = data.isUp
  const hasChildren = data.hasChildren
  const level = data.level || 0

  return (
    <div style={{
      background: level > 0 ? `${color}10` : '#fff',
      border: `2px solid ${color}`,
      borderRadius: 8,
      padding: 8,
      fontSize: 12,
      position: 'relative',
      minWidth: 80,
      cursor: 'pointer',
    }}>
      {/* 连接点 - 用于连接时间线 */}
      {isUp ? (
        <Handle type="target" position={Position.Bottom} id="connect" style={{ background: color, width: 8, height: 8, bottom: -4 }} />
      ) : (
        <Handle type="target" position={Position.Top} id="connect" style={{ background: color, width: 8, height: 8, top: -4 }} />
      )}

      {/* 右侧连接点 - 用于连接子节点 */}
      <Handle type="source" position={Position.Right} id="toChild" style={{ background: color, width: 8, height: 8, right: -4 }} />

      <div style={{ fontWeight: 'bold', color }}>
        {level === 0 ? '🚩' : level === 1 ? '📍' : '📌'} {data.label}
      </div>
      <div style={{ marginTop: 4, fontSize: 10, color }}>
        {data.startTime && <div>起: {data.startTime}</div>}
        <div>止: {data.endTime} (Due)</div>
      </div>

      {/* 展开按钮 - 显示子时间线 */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onExpand?.(data.nodeId)
          }}
          style={{
            position: 'absolute',
            left: -24,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#22c55e',
            color: '#fff',
            border: '2px solid #fff',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
          title="展开子时间线"
        >
          ▶
        </button>
      )}

      {/* 加号按钮 - 添加子节点 */}
      {level < 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onAddChild?.(data.nodeId)
          }}
          style={{
            position: 'absolute',
            right: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: color,
            color: '#fff',
            border: '2px solid #fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
          title="添加子节点"
        >
          +
        </button>
      )}
    </div>
  )
}

// 花节点（论文、竞赛等）
function FlowerNode({ data }: { data: any }) {
  const parentColor = data.parentColor || '#f59e0b'
  return (
    <div style={{
      background: '#fef3f2',
      border: `2px solid ${parentColor}`,
      borderRadius: 8,
      padding: 6,
      fontSize: 11,
      position: 'relative',
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: parentColor, width: 6, height: 6 }} />
      <div style={{ color: parentColor }}>🌸 {data.label}</div>
      {data.dueDate && <div style={{ fontSize: 10, color: '#888' }}>📅 {data.dueDate}</div>}
    </div>
  )
}

// 果节点（产品、模式等）
function FruitNode({ data }: { data: any }) {
  const parentColor = data.parentColor || '#f59e0b'
  return (
    <div style={{
      background: '#f0fdf4',
      border: `2px solid ${parentColor}`,
      borderRadius: 8,
      padding: 6,
      fontSize: 11,
      position: 'relative',
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: parentColor, width: 6, height: 6 }} />
      <div style={{ color: parentColor }}>🍎 {data.label}</div>
      {data.dueDate && <div style={{ fontSize: 10, color: '#888' }}>📅 {data.dueDate}</div>}
    </div>
  )
}

// 任务节点（细粒度里程碑）
function TaskNode({ data }: { data: any }) {
  const color = data.color || '#f59e0b'
  const level = data.level || 0
  const hasChildren = data.hasChildren

  return (
    <div style={{
      background: `${color}15`,
      border: `2px solid ${color}`,
      borderRadius: 8,
      padding: 8,
      fontSize: 12,
      position: 'relative',
      minWidth: 80,
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Left} id="connect" style={{ background: color, width: 6, height: 6, left: -3 }} />
      <Handle type="source" position={Position.Right} id="toChild" style={{ background: color, width: 6, height: 6, right: -3 }} />

      <div style={{ fontWeight: 'bold', color }}>
        {level === 1 ? '📍' : '📌'} {data.label}
      </div>
      <div style={{ marginTop: 4, fontSize: 10, color }}>
        {data.startTime && <div>起: {data.startTime}</div>}
        {data.endTime && <div>止: {data.endTime}</div>}
      </div>

      {/* 展开按钮 */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onExpand?.(data.nodeId)
          }}
          style={{
            position: 'absolute',
            left: -20,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#22c55e',
            color: '#fff',
            border: '2px solid #fff',
            cursor: 'pointer',
            fontSize: 8,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="展开"
        >
          ▶
        </button>
      )}

      {/* 添加按钮 - 只在层级 < 2 时显示 */}
      {level < 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onAddChild?.(data.nodeId)
          }}
          style={{
            position: 'absolute',
            right: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: color,
            color: '#fff',
            border: '2px solid #fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="添加子节点"
        >
          +
        </button>
      )}
    </div>
  )
}

// 自定义时间点节点
function TimePointNode({ data }: { data: any }) {
  const color = data.color || '#f59e0b'
  const isUp = data.isUp

  return (
    <div style={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: color,
      border: '2px solid #fff',
      position: 'relative',
      boxShadow: '0 0 0 1px ' + color,
    }}>
      {isUp ? (
        <Handle type="source" position={Position.Top} id="toMilestone" style={{ background: color, width: 6, height: 6, top: -3 }} />
      ) : (
        <Handle type="source" position={Position.Bottom} id="toMilestone" style={{ background: color, width: 6, height: 6, bottom: -3 }} />
      )}
      <Handle type="target" position={Position.Left} id="fromStart" style={{ background: color, width: 6, height: 6, left: -3 }} />
    </div>
  )
}

// 开始时间点节点
function StartPointNode({ data }: { data: any }) {
  const color = data.color || '#f59e0b'

  return (
    <div style={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: color,
      border: '2px solid #fff',
      position: 'relative',
      boxShadow: '0 0 0 1px ' + color,
    }}>
      <Handle type="source" position={Position.Right} id="toEnd" style={{ background: color, width: 6, height: 6, right: -3 }} />
    </div>
  )
}

// 季度标识节点
function QuarterNode({ data }: { data: any }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#3b82f6',
      }} />
      <div style={{
        fontSize: 11,
        color: '#666',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}>
        {data.label}
      </div>
    </div>
  )
}

// 开始节点
function StartNode({ data }: { data: any }) {
  return (
    <div style={{
      background: '#3b82f6',
      color: '#fff',
      borderRadius: 16,
      padding: '10px 16px',
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <Handle type="source" position={Position.Right} style={{ background: '#3b82f6', width: 8, height: 8 }} />
      <span style={{ fontSize: 16 }}>🌱</span>
      <span style={{ fontWeight: 'bold' }}>{data?.label || '开始'}</span>
    </div>
  )
}

// 目标节点
function EndNode({ data }: { data: any }) {
  return (
    <div style={{
      background: '#22c55e',
      color: '#fff',
      borderRadius: 16,
      padding: '10px 16px',
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#22c55e', width: 8, height: 8 }} />
      <span style={{ fontSize: 16 }}>🎯</span>
      <span style={{ fontWeight: 'bold' }}>{data?.label || '目标'}</span>
    </div>
  )
}

// 今天节点 - 小人形象
function TodayNode() {
  const today = new Date()
  const dateStr = `${today.getMonth() + 1}/${today.getDate()}`

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
    }}>
      {/* 小人形象 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'bounce 1s infinite',
      }}>
        {/* 头 */}
        <div style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#ef4444',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }} />
        {/* 身体 */}
        <div style={{
          width: 3,
          height: 12,
          background: '#ef4444',
          marginTop: -2,
        }} />
        {/* 腿 */}
        <div style={{
          display: 'flex',
          gap: 4,
          marginTop: -1,
        }}>
          <div style={{ width: 3, height: 8, background: '#ef4444', transform: 'rotate(-15deg)' }} />
          <div style={{ width: 3, height: 8, background: '#ef4444', transform: 'rotate(15deg)' }} />
        </div>
      </div>
      {/* 日期标签 */}
      <div style={{
        background: '#ef4444',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}>
        今天 {dateStr}
      </div>
      {/* 向下的箭头指示线 */}
      <div style={{
        width: 2,
        height: 20,
        background: 'linear-gradient(to bottom, #ef4444, transparent)',
        marginTop: -4,
      }} />
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  )
}

const nodeTypes = {
  milestone: MilestoneNode,
  flower: FlowerNode,
  fruit: FruitNode,
  task: TaskNode,
  timePoint: TimePointNode,
  startPoint: StartPointNode,
  quarter: QuarterNode,
  start: StartNode,
  end: EndNode,
  today: TodayNode,
}

interface EditNode {
  id: string
  label: string
  startDate: string
  endDate: string
  isMilestone: boolean
  isFlower?: boolean
  isFruit?: boolean
  isTask?: boolean
  description?: string
  vision?: string
  goal?: string
  isStart?: boolean
  isEnd?: boolean
  level?: number
}

export default function FishboneTimeline() {
  const { currentProject, selectProject, setViewMode, createNode, updateNode, deleteNode, updateProject, fetchProjectTree } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [editNode, setEditNode] = useState<EditNode | null>(null)

  // 添加子节点的状态
  const [addChildTo, setAddChildTo] = useState<string | null>(null)
  const [childName, setChildName] = useState('')
  const [childType, setChildType] = useState<'flower' | 'fruit' | 'task' | null>(null)

  // 嵌套时间线状态 - 聚焦的节点ID栈
  const [focusStack, setFocusStack] = useState<string[]>([])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])

  // 用于防止双击节点后触发画布双击
  const justInteractedRef = useRef(false)

  // 当前聚焦的节点（null 表示根级别）
  const focusedNodeId = focusStack.length > 0 ? focusStack[focusStack.length - 1] : null

  // 计算节点层级（从根开始）
  const getNodeLevel = (nodeId: string, allNodes: any[]): number => {
    const node = allNodes.find(n => n.id === nodeId)
    if (!node || !node.parent_id) return 0
    return 1 + getNodeLevel(node.parent_id, allNodes)
  }

  // 展开节点 - 进入子时间线
  const handleExpand = (nodeId: string) => {
    setFocusStack([...focusStack, nodeId])
  }

  // 返回上一级
  const handleGoBack = () => {
    setFocusStack(focusStack.slice(0, -1))
  }

  // 返回根级别
  const handleGoToRoot = () => {
    setFocusStack([])
  }

  // 获取面包屑路径
  const getBreadcrumb = () => {
    if (!currentProject?.nodes) return []
    const nodes = currentProject.nodes
    return focusStack.map(id => {
      const node = nodes.find(n => n.id === id)
      return { id, name: node?.milestone_name || node?.title || '未知' }
    })
  }

  // 处理添加子节点
  const handleAddChild = (nodeId: string) => {
    setAddChildTo(nodeId)
    const allNodes = currentProject?.nodes || []
    const nodeLevel = getNodeLevel(nodeId, allNodes)
    // 根据层级决定可选类型
    if (nodeLevel === 0) {
      setChildType(null) // 可以选择花、果或任务
    } else {
      setChildType('task') // 子层级只能添加任务
    }
    setChildName('')
  }

  const handleAddChildConfirm = async () => {
    if (!addChildTo || !childName || !childType) return

    await createNode(currentProject!.id, {
      title: childName,
      type: childType,
      parentId: addChildTo,
      isMilestone: childType === 'task',
    })
    await fetchProjectTree(currentProject!.id)

    setAddChildTo(null)
    setChildType(null)
    setChildName('')
  }

  useEffect(() => {
    if (!currentProject) return

    const allNodes = currentProject.nodes || []

    // 根据当前聚焦级别过滤要显示的节点
    let nodesToShow: any[] = []
    let startDateScope: string | undefined
    let endDateScope: string | undefined
    const scopeColor = currentProject.color || '#3b82f6'

    if (focusedNodeId) {
      // 聚焦模式下：显示该节点的直接子节点
      const focusedNode = allNodes.find(n => n.id === focusedNodeId)
      if (focusedNode) {
        nodesToShow = allNodes.filter(n => n.parent_id === focusedNodeId)
        startDateScope = focusedNode.start_date || focusedNode.milestone_date
        endDateScope = focusedNode.milestone_date
      }
    } else {
      // 根级别：显示顶层里程碑
      nodesToShow = allNodes.filter(n => n.is_milestone === 1 && !n.parent_id)
      startDateScope = currentProject.start_date
      endDateScope = currentProject.end_date
    }

    // 按时间排序
    nodesToShow.sort((a, b) => {
      const dateA = new Date(a.milestone_date || a.start_date || 0).getTime()
      const dateB = new Date(b.milestone_date || b.start_date || 0).getTime()
      return dateA - dateB
    })

    const nodeList: any[] = []
    const edgeList: any[] = []

    // 布局参数
    const mainY = 300
    const paddingX = 100
    const canvasWidth = 900
    const lineSpacing = 5
    const minVerticalLength = 80

    // 时间范围
    let minDate: Date
    let maxDate: Date

    if (startDateScope) {
      minDate = new Date(startDateScope)
    } else {
      minDate = new Date()
    }

    if (endDateScope) {
      maxDate = new Date(endDateScope)
    } else {
      maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + 90)
    }

    if (nodesToShow.length > 0) {
      const dates = nodesToShow.map(n => new Date(n.milestone_date)).filter(d => !isNaN(d.getTime()))
      const startDates = nodesToShow.map(n => n.start_date ? new Date(n.start_date) : null).filter(Boolean) as Date[]

      if (dates.length > 0) {
        const earliest = new Date(Math.min(...dates.map(d => d.getTime())))
        const latest = new Date(Math.max(...dates.map(d => d.getTime())))
        if (earliest < minDate) minDate = earliest
        if (latest > maxDate) maxDate = latest
      }

      if (startDates.length > 0) {
        const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())))
        if (earliestStart < minDate) minDate = earliestStart
      }
    }

    // 调整时间范围到季度边界
    const startQuarter = new Date(minDate.getFullYear(), Math.floor(minDate.getMonth() / 3) * 3, 1)
    const endQuarter = new Date(maxDate.getFullYear(), Math.ceil((maxDate.getMonth() + 1) / 3) * 3, 0)

    minDate = startQuarter
    maxDate = new Date(endQuarter.getFullYear(), endQuarter.getMonth() + 1, 0)
    maxDate.setDate(maxDate.getDate() + 10)

    const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    const mainWidth = canvasWidth - paddingX * 2
    const dayWidth = mainWidth / totalDays

    const dateToX = (dateStr: string) => {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return paddingX
      const days = (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      return paddingX + days * dayWidth
    }

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      return `${d.getMonth() + 1}/${d.getDate()}`
    }

    const getColor = (index: number, nodeColor?: string) => {
      if (nodeColor) return nodeColor
      return MILESTONE_COLORS[index % MILESTONE_COLORS.length]
    }

    // 添加季度标识
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    const quarterMonths = [0, 3, 6, 9]

    let currentYear = minDate.getFullYear()
    const endYear = maxDate.getFullYear()

    while (currentYear <= endYear) {
      quarterMonths.forEach((month, qIndex) => {
        const quarterStart = new Date(currentYear, month, 1)
        const quarterEnd = new Date(currentYear, month + 3, 0)

        if (quarterStart <= maxDate && quarterEnd >= minDate) {
          const quarterStartX = dateToX(quarterStart.toISOString().split('T')[0])

          nodeList.push({
            id: `quarter-${currentYear}-${qIndex + 1}`,
            type: 'quarter',
            position: { x: quarterStartX - 4, y: mainY + 25 },
            data: { label: `${currentYear} ${quarters[qIndex]}` },
          })
        }
      })
      currentYear++
    }

    // 添加"今天"小人节点
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayX = dateToX(today.toISOString().split('T')[0])

    // 只有当今天在时间范围内时才显示
    if (todayX >= paddingX && todayX <= canvasWidth - paddingX) {
      nodeList.push({
        id: 'today',
        type: 'today',
        position: { x: todayX - 30, y: mainY - 70 },
        data: {},
      })
    }

    // 开始节点
    const startX = startDateScope ? dateToX(startDateScope) : paddingX
    nodeList.push({
      id: 'start',
      type: 'start',
      position: { x: startX - 40, y: mainY },
      data: { label: '开始' },
    })

    // 目标节点
    const endX = endDateScope ? dateToX(endDateScope) : canvasWidth - paddingX
    nodeList.push({
      id: 'end',
      type: 'end',
      position: { x: endX - 40, y: mainY },
      data: { label: '目标' },
    })

    // 主线
    edgeList.push({
      id: 'main-line',
      source: 'start',
      target: 'end',
      type: 'straight',
      style: { stroke: scopeColor, strokeWidth: 6 },
    })

    // 渲染里程碑/任务节点
    nodesToShow.forEach((m, i) => {
      const isUp = i % 2 === 0
      const color = getColor(i, m.color)
      const level = getNodeLevel(m.id, allNodes)
      const hasChildren = allNodes.some(n => n.parent_id === m.id)
      const nodeType = level === 0 ? 'milestone' : 'task'

      const altIndex = Math.floor(i / 2)
      const horizontalLineY = isUp
        ? mainY - 6 - lineSpacing - altIndex * lineSpacing
        : mainY + 6 + lineSpacing + altIndex * lineSpacing

      const verticalLength = minVerticalLength + altIndex * 20

      const startPosX = m.start_date ? dateToX(m.start_date) : dateToX(m.milestone_date) - 40
      const endPosX = dateToX(m.milestone_date)

      // 开始时间点
      const startPointId = `start-point-${m.id}`
      nodeList.push({
        id: startPointId,
        type: 'startPoint',
        position: { x: startPosX - 6, y: horizontalLineY - 6 },
        data: { color, isUp },
      })

      // 终止时间点
      const endPointId = `end-point-${m.id}`
      nodeList.push({
        id: endPointId,
        type: 'timePoint',
        position: { x: endPosX - 6, y: horizontalLineY - 6 },
        data: { color, isUp },
      })

      // 横向连线
      edgeList.push({
        id: `horizontal-${m.id}`,
        source: startPointId,
        sourceHandle: 'toEnd',
        target: endPointId,
        targetHandle: 'fromStart',
        type: 'straight',
        style: { stroke: color, strokeWidth: 2 },
      })

      // 里程碑/任务方框
      const nodeHeight = level > 0 ? 50 : 60
      const nodeY = isUp
        ? horizontalLineY - verticalLength - nodeHeight + 4
        : horizontalLineY + verticalLength - 4

      nodeList.push({
        id: m.id,
        type: nodeType,
        position: { x: endPosX - 50, y: nodeY },
        data: {
          nodeId: m.id,
          label: m.milestone_name || m.title,
          startTime: m.start_date ? formatDate(m.start_date) : '',
          endTime: formatDate(m.milestone_date),
          color,
          isUp,
          level,
          hasChildren,
          onAddChild: handleAddChild,
          onExpand: handleExpand,
        },
      })

      // 纵向连线
      edgeList.push({
        id: `vertical-${m.id}`,
        source: endPointId,
        sourceHandle: 'toMilestone',
        target: m.id,
        targetHandle: 'connect',
        type: 'straight',
        style: { stroke: color, strokeWidth: 2 },
      })

      // 获取该节点的花和果子节点（非任务类型的子节点）
      const flowerFruitChildren = allNodes.filter(n =>
        n.parent_id === m.id && (n.type === 'flower' || n.type === 'fruit')
      )

      flowerFruitChildren.forEach((child, childIndex) => {
        const childX = endPosX + 120
        const childY = nodeY + childIndex * 35 - (flowerFruitChildren.length - 1) * 17

        const formatDateShort = (dateStr: string) => {
          if (!dateStr) return ''
          const d = new Date(dateStr)
          return `${d.getMonth() + 1}/${d.getDate()}`
        }

        nodeList.push({
          id: child.id,
          type: child.type === 'flower' ? 'flower' : 'fruit',
          position: { x: childX, y: childY },
          data: {
            label: child.title,
            parentColor: color,
            dueDate: child.milestone_date ? formatDateShort(child.milestone_date) : '',
          },
        })

        edgeList.push({
          id: `child-${child.id}`,
          source: m.id,
          sourceHandle: 'toChild',
          target: child.id,
          type: 'smoothstep',
          style: { stroke: color, strokeWidth: 2 },
        })
      })
    })

    setNodes(nodeList)
    setEdges(edgeList)
  }, [currentProject, focusStack, setNodes, setEdges])

  if (!currentProject) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        ← 请在开发地图中选择项目
      </div>
    )
  }

  const breadcrumb = getBreadcrumb()

  const handleAdd = async () => {
    if (name && endDate) {
      await createNode(currentProject.id, {
        title: name,
        type: 'branch',
        isMilestone: true,
        milestoneDate: endDate,
        milestoneName: name,
        startDate: startDate || undefined,
        parentId: focusedNodeId || undefined,
      })
      await fetchProjectTree(currentProject.id)
    }
    setName('')
    setStartDate('')
    setEndDate('')
    setShowModal(false)
  }

  const handleNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
    // 设置标志，防止触发画布双击
    justInteractedRef.current = true

    if (node.id === 'start') {
      if (focusedNodeId) {
        // 在聚焦模式下，编辑聚焦节点
        const focusedNode = currentProject?.nodes?.find(n => n.id === focusedNodeId)
        if (focusedNode) {
          setEditNode({
            id: focusedNodeId,
            label: focusedNode.milestone_name || focusedNode.title,
            startDate: focusedNode.start_date || '',
            endDate: focusedNode.milestone_date || '',
            isMilestone: true,
            level: getNodeLevel(focusedNodeId, currentProject?.nodes || []),
          })
        }
      } else {
        setEditNode({
          id: 'start',
          label: '开始',
          startDate: currentProject.start_date || '',
          endDate: '',
          isMilestone: false,
          vision: currentProject.vision || '',
          goal: '',
          isStart: true,
        })
      }
    } else if (node.id === 'end') {
      if (focusedNodeId) {
        // 在聚焦模式下，编辑聚焦节点
        const focusedNode = currentProject?.nodes?.find(n => n.id === focusedNodeId)
        if (focusedNode) {
          setEditNode({
            id: focusedNodeId,
            label: focusedNode.milestone_name || focusedNode.title,
            startDate: focusedNode.start_date || '',
            endDate: focusedNode.milestone_date || '',
            isMilestone: true,
            level: getNodeLevel(focusedNodeId, currentProject?.nodes || []),
          })
        }
      } else {
        setEditNode({
          id: 'end',
          label: '目标',
          startDate: '',
          endDate: currentProject.end_date || '',
          isMilestone: false,
          vision: '',
          goal: currentProject.goal || '',
          isEnd: true,
        })
      }
    } else if (node.type === 'milestone' || node.type === 'task') {
      const nodeData = currentProject?.nodes?.find(n => n.id === node.id)
      if (nodeData) {
        setEditNode({
          id: node.id,
          label: nodeData.milestone_name || nodeData.title,
          startDate: nodeData.start_date || '',
          endDate: nodeData.milestone_date || '',
          isMilestone: true,
          isTask: node.type === 'task',
          level: getNodeLevel(node.id, currentProject?.nodes || []),
          description: nodeData.description || '',
        })
      }
    } else if (node.type === 'flower' || node.type === 'fruit') {
      const nodeData = currentProject?.nodes?.find(n => n.id === node.id)
      if (nodeData) {
        setEditNode({
          id: node.id,
          label: nodeData.title,
          startDate: nodeData.start_date || '',
          endDate: nodeData.milestone_date || '',
          isMilestone: false,
          isFlower: node.type === 'flower',
          isFruit: node.type === 'fruit',
          description: nodeData.description || '',
        })
      }
    }
  }

  const handlePaneDoubleClick = () => {
    // 防止双击节点后触发画布双击
    if (justInteractedRef.current) {
      justInteractedRef.current = false
      return
    }
    setShowModal(true)
  }

  const handleEditSave = async () => {
    if (!editNode) return

    if (editNode.isStart && !focusedNodeId) {
      await updateProject(currentProject.id, {
        vision: editNode.vision,
        startDate: editNode.startDate || null,
      })
      await fetchProjectTree(currentProject.id)
    } else if (editNode.isEnd && !focusedNodeId) {
      await updateProject(currentProject.id, {
        goal: editNode.goal,
        endDate: editNode.endDate || null,
      })
      await fetchProjectTree(currentProject.id)
    } else if (editNode.isFlower || editNode.isFruit) {
      await updateNode(editNode.id, {
        title: editNode.label,
        description: editNode.description,
        milestoneDate: editNode.endDate || undefined,
        startDate: editNode.startDate || undefined,
      })
      await fetchProjectTree(currentProject.id)
    } else {
      await updateNode(editNode.id, {
        title: editNode.label,
        milestoneName: editNode.label,
        milestoneDate: editNode.endDate,
        startDate: editNode.startDate || undefined,
        description: editNode.description,
      })
      await fetchProjectTree(currentProject.id)
    }
    setEditNode(null)
  }

  const handleEditDelete = async () => {
    if (!editNode || editNode.isStart || editNode.isEnd) return
    const confirmMsg = editNode.isFlower || editNode.isFruit
      ? '确定删除此花/果节点？'
      : editNode.isTask ? '确定删除此任务节点？' : '确定删除此里程碑？'
    if (confirm(confirmMsg)) {
      await deleteNode(editNode.id)
      await fetchProjectTree(currentProject.id)
      setEditNode(null)
      // 如果删除的是当前聚焦节点或其祖先，返回上一级
      if (focusStack.includes(editNode.id)) {
        const newStack = focusStack.filter(id => id !== editNode.id)
        setFocusStack(newStack)
      }
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { selectProject(null); setViewMode('timeline') }} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>
          ← 返回概览
        </button>

        {/* 面包屑导航 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <span
            onClick={handleGoToRoot}
            style={{ cursor: 'pointer', color: focusStack.length > 0 ? '#3b82f6' : '#333' }}
          >
            {STATUS_ICONS[currentProject.status as ProjectStatus]} {currentProject.name}
          </span>
          {breadcrumb.map((item, index) => (
            <span key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#ccc' }}>›</span>
              <span
                onClick={() => setFocusStack(focusStack.slice(0, index + 1))}
                style={{
                  cursor: 'pointer',
                  color: index === breadcrumb.length - 1 ? '#333' : '#3b82f6'
                }}
              >
                {item.name}
              </span>
            </span>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {focusedNodeId && (
          <button onClick={handleGoBack} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#f0f0f0' }}>
            ← 上一级
          </button>
        )}

        <button onClick={() => setShowModal(true)} style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          + {focusedNodeId ? '子节点' : '里程碑'}
        </button>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={handleNodeDoubleClick}
          onDoubleClick={handlePaneDoubleClick}
          fitView
        >
          <Background color="#ddd" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {/* 添加里程碑/任务弹窗 */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 20, borderRadius: 12, width: 300 }}>
            <h3 style={{ margin: '0 0 12px' }}>{focusedNodeId ? '添加子节点' : '添加里程碑'}</h3>
            <label style={{ fontSize: 12, color: '#666' }}>名称 *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={focusedNodeId ? "子节点名称" : "里程碑名称"} style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }} />
            <label style={{ fontSize: 12, color: '#666' }}>开始时间</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }} />
            <label style={{ fontSize: 12, color: '#666' }}>Due Date *</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAdd} style={{ flex: 1, padding: 8, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>添加</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, background: '#ddd', border: 'none', borderRadius: 4, cursor: 'pointer' }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加花或果弹窗 */}
      {addChildTo && (
        <div onClick={() => setAddChildTo(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 20, borderRadius: 12, width: 320 }}>
            <h3 style={{ margin: '0 0 12px' }}>添加花、果或子任务</h3>

            {/* 类型选择 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setChildType('flower')}
                style={{
                  flex: 1,
                  padding: 12,
                  background: childType === 'flower' ? '#fef3f2' : '#f5f5f5',
                  border: childType === 'flower' ? '2px solid #ec4899' : '2px solid #ddd',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 20 }}>🌸</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>花</div>
                <div style={{ fontSize: 10, color: '#888' }}>论文、竞赛等</div>
              </button>
              <button
                onClick={() => setChildType('fruit')}
                style={{
                  flex: 1,
                  padding: 12,
                  background: childType === 'fruit' ? '#f0fdf4' : '#f5f5f5',
                  border: childType === 'fruit' ? '2px solid #22c55e' : '2px solid #ddd',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 20 }}>🍎</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>果</div>
                <div style={{ fontSize: 10, color: '#888' }}>产品、模式等</div>
              </button>
              <button
                onClick={() => setChildType('task')}
                style={{
                  flex: 1,
                  padding: 12,
                  background: childType === 'task' ? '#fef3c7' : '#f5f5f5',
                  border: childType === 'task' ? '2px solid #f59e0b' : '2px solid #ddd',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 20 }}>📍</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>子任务</div>
                <div style={{ fontSize: 10, color: '#888' }}>细粒度任务</div>
              </button>
            </div>

            {childType && (
              <>
                <label style={{ fontSize: 12, color: '#666' }}>名称 *</label>
                <input
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                  placeholder={childType === 'flower' ? '论文/竞赛名称' : childType === 'fruit' ? '产品/模式名称' : '任务名称'}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
              </>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setAddChildTo(null)} style={{ flex: 1, padding: 8, background: '#ddd', border: 'none', borderRadius: 4, cursor: 'pointer' }}>取消</button>
              <button
                onClick={handleAddChildConfirm}
                disabled={!childType || !childName}
                style={{
                  flex: 1,
                  padding: 8,
                  background: childType === 'flower' ? '#ec4899' : childType === 'fruit' ? '#22c55e' : '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: childType && childName ? 'pointer' : 'not-allowed',
                  opacity: childType && childName ? 1 : 0.5,
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editNode && (
        <div onClick={() => setEditNode(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 20, borderRadius: 12, width: 340 }}>
            <h3 style={{ margin: '0 0 12px' }}>
              {editNode.isStart ? '编辑开始' : editNode.isEnd ? '编辑目标' : editNode.isFlower ? '🌸 编辑花' : editNode.isFruit ? '🍎 编辑果' : editNode.isTask ? '📍 编辑任务' : '编辑里程碑'}
            </h3>

            {editNode.isStart && !focusedNodeId && (
              <>
                <label style={{ fontSize: 12, color: '#666' }}>远景</label>
                <textarea
                  value={editNode.vision || ''}
                  onChange={e => setEditNode({ ...editNode, vision: e.target.value })}
                  placeholder="描述你的远景..."
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4, minHeight: 60, resize: 'vertical' }}
                />
                <label style={{ fontSize: 12, color: '#666' }}>开始时间</label>
                <input
                  type="date"
                  value={editNode.startDate}
                  onChange={e => setEditNode({ ...editNode, startDate: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
              </>
            )}

            {editNode.isEnd && !focusedNodeId && (
              <>
                <label style={{ fontSize: 12, color: '#666' }}>目标</label>
                <textarea
                  value={editNode.goal || ''}
                  onChange={e => setEditNode({ ...editNode, goal: e.target.value })}
                  placeholder="描述你的目标..."
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4, minHeight: 60, resize: 'vertical' }}
                />
                <label style={{ fontSize: 12, color: '#666' }}>预期结束时间</label>
                <input
                  type="date"
                  value={editNode.endDate}
                  onChange={e => setEditNode({ ...editNode, endDate: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
              </>
            )}

            {(editNode.isFlower || editNode.isFruit) && (
              <>
                <label style={{ fontSize: 12, color: '#666' }}>名称</label>
                <input
                  value={editNode.label}
                  onChange={e => setEditNode({ ...editNode, label: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
                <label style={{ fontSize: 12, color: '#666' }}>主要任务/内容</label>
                <textarea
                  value={editNode.description || ''}
                  onChange={e => setEditNode({ ...editNode, description: e.target.value })}
                  placeholder="描述主要任务..."
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4, minHeight: 60, resize: 'vertical' }}
                />
                <label style={{ fontSize: 12, color: '#666' }}>开始时间</label>
                <input
                  type="date"
                  value={editNode.startDate}
                  onChange={e => setEditNode({ ...editNode, startDate: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
                <label style={{ fontSize: 12, color: '#666' }}>完成时间</label>
                <input
                  type="date"
                  value={editNode.endDate}
                  onChange={e => setEditNode({ ...editNode, endDate: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={handleEditDelete} style={{ padding: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>删除</button>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setEditNode(null)} style={{ padding: '8px 16px', background: '#ddd', border: 'none', borderRadius: 4, cursor: 'pointer' }}>取消</button>
                  <button onClick={handleEditSave} style={{ padding: '8px 16px', background: editNode.isFlower ? '#ec4899' : editNode.isFruit ? '#22c55e' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>保存</button>
                </div>
              </>
            )}

            {(editNode.isMilestone || editNode.isTask) && (
              <>
                <label style={{ fontSize: 12, color: '#666' }}>名称</label>
                <input
                  value={editNode.label}
                  onChange={e => setEditNode({ ...editNode, label: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
                <label style={{ fontSize: 12, color: '#666' }}>描述</label>
                <textarea
                  value={editNode.description || ''}
                  onChange={e => setEditNode({ ...editNode, description: e.target.value })}
                  placeholder="描述任务内容..."
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4, minHeight: 60, resize: 'vertical' }}
                />
                <label style={{ fontSize: 12, color: '#666' }}>开始时间</label>
                <input
                  type="date"
                  value={editNode.startDate}
                  onChange={e => setEditNode({ ...editNode, startDate: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
                <label style={{ fontSize: 12, color: '#666' }}>Due Date</label>
                <input
                  type="date"
                  value={editNode.endDate}
                  onChange={e => setEditNode({ ...editNode, endDate: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={handleEditDelete} style={{ padding: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>删除</button>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setEditNode(null)} style={{ padding: '8px 16px', background: '#ddd', border: 'none', borderRadius: 4, cursor: 'pointer' }}>取消</button>
                  <button onClick={handleEditSave} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>保存</button>
                </div>
              </>
            )}

            {(editNode.isStart || editNode.isEnd) && focusedNodeId && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditNode(null)} style={{ padding: '8px 16px', background: '#ddd', border: 'none', borderRadius: 4, cursor: 'pointer' }}>取消</button>
                <button onClick={handleEditSave} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>保存</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
