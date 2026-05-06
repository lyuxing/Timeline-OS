import { useEffect, useState } from 'react'
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

  return (
    <div style={{
      background: '#fff',
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

      {/* 右侧连接点 - 用于连接花/果 */}
      <Handle type="source" position={Position.Right} id="toChild" style={{ background: color, width: 8, height: 8, right: -4 }} />

      <div style={{ fontWeight: 'bold', color }}>🚩 {data.label}</div>
      <div style={{ marginTop: 4, fontSize: 10, color }}>
        {data.startTime && <div>起: {data.startTime}</div>}
        <div>止: {data.endTime} (Due)</div>
      </div>

      {/* 加号按钮 */}
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
        title="添加花或果"
      >
        +
      </button>
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
function StartNode() {
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
      <span style={{ fontWeight: 'bold' }}>开始</span>
    </div>
  )
}

// 目标节点
function EndNode() {
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
      <span style={{ fontWeight: 'bold' }}>目标</span>
    </div>
  )
}

const nodeTypes = {
  milestone: MilestoneNode,
  flower: FlowerNode,
  fruit: FruitNode,
  timePoint: TimePointNode,
  startPoint: StartPointNode,
  quarter: QuarterNode,
  start: StartNode,
  end: EndNode,
}

interface EditNode {
  id: string
  label: string
  startDate: string
  endDate: string
  isMilestone: boolean
  isFlower?: boolean
  isFruit?: boolean
  description?: string
  vision?: string
  goal?: string
  isStart?: boolean
  isEnd?: boolean
}

export default function FishboneTimeline() {
  const { currentProject, selectProject, setViewMode, createNode, updateNode, deleteNode, updateProject, fetchProjectTree } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [editNode, setEditNode] = useState<EditNode | null>(null)

  // 添加子节点（花或果）的状态
  const [addChildTo, setAddChildTo] = useState<string | null>(null)
  const [childName, setChildName] = useState('')
  const [childType, setChildType] = useState<'flower' | 'fruit' | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])

  // 处理添加子节点
  const handleAddChild = (nodeId: string) => {
    setAddChildTo(nodeId)
    setChildType(null)
    setChildName('')
  }

  const handleAddChildConfirm = async () => {
    if (!addChildTo || !childName || !childType) return

    await createNode(currentProject!.id, {
      title: childName,
      type: childType,
      parentId: addChildTo,
    })
    await fetchProjectTree(currentProject!.id)

    setAddChildTo(null)
    setChildType(null)
    setChildName('')
  }

  useEffect(() => {
    if (!currentProject) return

    const allNodes = currentProject.nodes || []
    // 按时间排序里程碑
    const milestones = allNodes.filter(n => n.is_milestone === 1)
      .sort((a, b) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime())

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

    if (currentProject.start_date) {
      minDate = new Date(currentProject.start_date)
    } else {
      minDate = new Date()
    }

    if (currentProject.end_date) {
      maxDate = new Date(currentProject.end_date)
    } else {
      maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + 90)
    }

    if (milestones.length > 0) {
      const dates = milestones.map(m => new Date(m.milestone_date)).filter(d => !isNaN(d.getTime()))
      const startDates = milestones.map(m => m.start_date ? new Date(m.start_date) : null).filter(Boolean) as Date[]

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

    // 开始节点
    const startX = currentProject.start_date ? dateToX(currentProject.start_date) : paddingX
    nodeList.push({
      id: 'start',
      type: 'start',
      position: { x: startX - 40, y: mainY },
      data: { label: '开始' },
    })

    // 目标节点
    const endX = currentProject.end_date ? dateToX(currentProject.end_date) : canvasWidth - paddingX
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
      style: { stroke: '#3b82f6', strokeWidth: 6 },
    })

    // 里程碑
    milestones.forEach((m, i) => {
      const isUp = i % 2 === 0
      const color = getColor(i, m.color)

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

      // 里程碑方框
      const milestoneHeight = 60
      const nodeY = isUp
        ? horizontalLineY - verticalLength - milestoneHeight + 4
        : horizontalLineY + verticalLength - 4

      nodeList.push({
        id: m.id,
        type: 'milestone',
        position: { x: endPosX - 50, y: nodeY },
        data: {
          nodeId: m.id,
          label: m.milestone_name || m.title,
          startTime: m.start_date ? formatDate(m.start_date) : '',
          endTime: formatDate(m.milestone_date),
          color,
          isUp,
          onAddChild: handleAddChild,
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

      // 获取该里程碑的花和果子节点
      const children = allNodes.filter(n => n.parent_id === m.id)
      children.forEach((child, childIndex) => {
        const childX = endPosX + 120
        const childY = nodeY + childIndex * 35 - (children.length - 1) * 17

        // 格式化完成时间
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
  }, [currentProject, setNodes, setEdges])

  if (!currentProject) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        ← 请在开发地图中选择项目
      </div>
    )
  }

  const handleAdd = async () => {
    if (name && endDate) {
      await createNode(currentProject.id, {
        title: name,
        type: 'branch',
        isMilestone: true,
        milestoneDate: endDate,
        milestoneName: name,
        startDate: startDate || undefined,
      })
      await fetchProjectTree(currentProject.id)
    }
    setName('')
    setStartDate('')
    setEndDate('')
    setShowModal(false)
  }

  const handleNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
    if (node.id === 'start') {
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
    } else if (node.id === 'end') {
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
    } else if (node.type === 'milestone') {
      const nodeData = currentProject?.nodes?.find(n => n.id === node.id)
      if (nodeData) {
        setEditNode({
          id: node.id,
          label: nodeData.milestone_name || nodeData.title,
          startDate: nodeData.start_date || '',
          endDate: nodeData.milestone_date || '',
          isMilestone: true,
        })
      }
    } else if (node.type === 'flower' || node.type === 'fruit') {
      // 处理花果节点
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
    setShowModal(true)
  }

  const handleEditSave = async () => {
    if (!editNode) return

    if (editNode.isStart) {
      await updateProject(currentProject.id, {
        vision: editNode.vision,
        startDate: editNode.startDate || null,
      })
      await fetchProjectTree(currentProject.id)
    } else if (editNode.isEnd) {
      await updateProject(currentProject.id, {
        goal: editNode.goal,
        endDate: editNode.endDate || null,
      })
      await fetchProjectTree(currentProject.id)
    } else if (editNode.isFlower || editNode.isFruit) {
      // 保存花果节点
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
      })
      await fetchProjectTree(currentProject.id)
    }
    setEditNode(null)
  }

  const handleEditDelete = async () => {
    if (!editNode || editNode.isStart || editNode.isEnd) return
    const confirmMsg = editNode.isFlower || editNode.isFruit
      ? '确定删除此花/果节点？'
      : '确定删除此里程碑？'
    if (confirm(confirmMsg)) {
      console.log('Deleting node:', editNode.id)
      await deleteNode(editNode.id)
      console.log('Delete completed, refreshing tree')
      await fetchProjectTree(currentProject.id)
      setEditNode(null)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => { selectProject(null); setViewMode('timeline') }} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>
          ← 返回概览
        </button>
        <h2 style={{ flex: 1, margin: 0, color: '#333', fontSize: 16 }}>
          {STATUS_ICONS[currentProject.status as ProjectStatus]} {currentProject.name}
        </h2>
        <button onClick={() => setShowModal(true)} style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          + 里程碑
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

      {/* 添加里程碑弹窗 */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 20, borderRadius: 12, width: 300 }}>
            <h3 style={{ margin: '0 0 12px' }}>添加里程碑</h3>
            <label style={{ fontSize: 12, color: '#666' }}>名称 *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="里程碑名称" style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }} />
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
            <h3 style={{ margin: '0 0 12px' }}>添加花或果</h3>

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
            </div>

            {childType && (
              <>
                <label style={{ fontSize: 12, color: '#666' }}>名称 *</label>
                <input
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                  placeholder={childType === 'flower' ? '论文/竞赛名称' : '产品/模式名称'}
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
                  background: childType === 'flower' ? '#ec4899' : childType === 'fruit' ? '#22c55e' : '#ddd',
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
              {editNode.isStart ? '编辑开始' : editNode.isEnd ? '编辑目标' : editNode.isFlower ? '🌸 编辑花' : editNode.isFruit ? '🍎 编辑果' : '编辑里程碑'}
            </h3>

            {editNode.isStart && (
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

            {editNode.isEnd && (
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

            {editNode.isMilestone && (
              <>
                <label style={{ fontSize: 12, color: '#666' }}>名称</label>
                <input
                  value={editNode.label}
                  onChange={e => setEditNode({ ...editNode, label: e.target.value })}
                  style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4 }}
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

            {(editNode.isStart || editNode.isEnd) && (
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