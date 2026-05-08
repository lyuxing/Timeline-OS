import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { STATUS_ICONS, ProjectStatus } from '../types'
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import './WeeklySummary.css'

export default function WeeklySummary() {
  const { projects, fetchProjects, fetchProjectTree, selectProject, setViewMode } = useStore()
  const [loaded, setLoaded] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadData = async () => {
      await fetchProjects()
      setLoaded(true)
    }
    loadData()
  }, [fetchProjects])

  // 确保加载项目树数据
  useEffect(() => {
    if (loaded && projects.length > 0) {
      projects.forEach(p => {
        if (!p.nodes || p.nodes.length === 0) {
          console.log('Loading project tree for:', p.id, p.name)
          fetchProjectTree(p.id)
        }
      })
    }
  }, [loaded, projects, fetchProjectTree])

  // 获取本周时间范围（周一到周日）
  const getWeekRange = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + daysToMonday)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return { weekStart, weekEnd, now }
  }

  const { weekStart, weekEnd, now } = getWeekRange()

  // 检查任务是否正在进行（已开始且未结束）
  const isOngoing = (startDate: string | undefined, endDate: string | undefined): boolean => {
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (!start) return true
    if (start > now) return false
    if (end && end < now) return false

    return true
  }

  // 检查任务是否在本周内
  const isInThisWeek = (startDate: string | undefined, endDate: string | undefined): boolean => {
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (start && end) {
      return start <= weekEnd && end >= weekStart
    }
    if (start) {
      return start >= weekStart && start <= weekEnd
    }
    if (end) {
      return end >= weekStart && end <= weekEnd
    }
    return false
  }

  // 计算进度
  const getProgress = (startDate: string | undefined, endDate: string | undefined): number => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const current = now.getTime()

    if (current <= start) return 0
    if (current >= end) return 100

    return Math.round(((current - start) / (end - start)) * 100)
  }

  // 计算剩余天数
  const getDaysLeft = (endDate: string | undefined): number | null => {
    if (!endDate) return null
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // 构建项目的进行中任务列表
  const buildOngoingTasks = (project: any) => {
    const allNodes = project.nodes || []
    const ongoingTasks: any[] = []

    const topLevelMilestones = allNodes
      .filter((n: any) => n.is_milestone === 1 && !n.parent_id)
      .sort((a: any, b: any) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime())

    topLevelMilestones.forEach((milestone: any) => {
      if (isOngoing(milestone.start_date, milestone.milestone_date)) {
        const milestoneProgress = getProgress(milestone.start_date, milestone.milestone_date)
        const milestoneDaysLeft = getDaysLeft(milestone.milestone_date)

        ongoingTasks.push({
          id: milestone.id,
          type: 'milestone',
          level: 0,
          title: milestone.milestone_name || milestone.title,
          startDate: milestone.start_date,
          endDate: milestone.milestone_date,
          description: milestone.description,
          progress: milestoneProgress,
          daysLeft: milestoneDaysLeft,
          inThisWeek: isInThisWeek(milestone.start_date, milestone.milestone_date),
        })

        const getChildren = (parentId: string, level: number) => {
          const children = allNodes.filter((n: any) => n.parent_id === parentId)
          children.forEach((child: any) => {
            if (isOngoing(child.start_date, child.milestone_date)) {
              const progress = getProgress(child.start_date, child.milestone_date)
              const daysLeft = getDaysLeft(child.milestone_date)

              ongoingTasks.push({
                id: child.id,
                type: child.is_milestone ? 'milestone' : child.type,
                level,
                title: child.milestone_name || child.title,
                startDate: child.start_date,
                endDate: child.milestone_date,
                description: child.description,
                progress,
                daysLeft,
                inThisWeek: isInThisWeek(child.start_date, child.milestone_date),
              })

              getChildren(child.id, level + 1)
            }
          })
        }

        getChildren(milestone.id, 1)
      }
    })

    return ongoingTasks
  }

  const summary = useMemo(() => {
    console.log('Computing summary, projects:', projects.length)
    projects.forEach(p => {
      console.log('Project:', p.name, 'nodes:', p.nodes?.length || 0)
    })
    const projectSummaries: any[] = []

    projects.forEach(project => {
      const allNodes = project.nodes || []

      const milestones = allNodes
        .filter((n: any) => n.is_milestone === 1 && n.milestone_date && !n.parent_id)
        .sort((a: any, b: any) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime())

      const nextMilestone = milestones.find((m: any) => {
        const date = new Date(m.milestone_date)
        return date >= now
      })

      let daysLeft = null
      if (nextMilestone) {
        const diff = new Date(nextMilestone.milestone_date).getTime() - now.getTime()
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
      }

      const ongoingTasks = buildOngoingTasks(project)

      const flowers = allNodes.filter((n: any) => n.type === 'flower')
      const fruits = allNodes.filter((n: any) => n.type === 'fruit')

      if (milestones.length > 0 || allNodes.length > 0) {
        projectSummaries.push({
          project,
          nextMilestone,
          daysLeft,
          ongoingTasks,
          milestones,
          flowers,
          fruits,
          color: project.color || '#3b82f6',
        })
      }
    })

    return projectSummaries.sort((a, b) => {
      if (a.daysLeft === null) return 1
      if (b.daysLeft === null) return -1
      return a.daysLeft - b.daysLeft
    })
  }, [projects])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${d.getMonth() + 1}/${d.getDate()} ${weekdays[d.getDay()]}`
  }

  const formatDateRange = (startDate: string | undefined, endDate: string | undefined) => {
    if (!endDate) return ''
    if (startDate) {
      const s = new Date(startDate)
      const e = new Date(endDate)
      return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
    }
    return formatDate(endDate)
  }

  const getDaysLeftClass = (days: number | null) => {
    if (days === null) return 'normal'
    if (days <= 1) return 'urgent'
    if (days <= 7) return 'soon'
    return 'normal'
  }

  const getDaysLeftText = (days: number | null) => {
    if (days === null) return ''
    if (days < 0) return `已过期${Math.abs(days)}天`
    if (days === 0) return '今天截止'
    if (days === 1) return '明天截止'
    return `还剩${days}天`
  }

  const getIcon = (level: number) => {
    if (level === 0) return '🚩'
    if (level === 1) return '📍'
    return '📌'
  }

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId)
    fetchProjectTree(projectId)
    setViewMode('timeline-edit')
  }

  const toggleProjectExpand = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  // 汇总所有正在进行的任务（本周要务）
  const weeklyTasks = useMemo(() => {
    const tasks: any[] = []
    summary.forEach(item => {
      item.ongoingTasks.forEach((task: any) => {
        // 所有正在进行的任务都显示
        tasks.push({
          ...task,
          projectName: item.project.name,
          projectColor: item.color,
        })
      })
    })
    // 按项目分组，再按层级和剩余天数排序
    return tasks.sort((a, b) => {
      // 先按项目名排序
      if (a.projectName !== b.projectName) {
        return a.projectName.localeCompare(b.projectName)
      }
      // 再按层级排序
      if (a.level !== b.level) {
        return a.level - b.level
      }
      // 最后按剩余天数排序
      if (a.daysLeft === null) return 1
      if (b.daysLeft === null) return -1
      return a.daysLeft - b.daysLeft
    })
  }, [summary])

  // 统计数据
  const stats = useMemo(() => {
    const totalOngoing = summary.reduce((acc, item) => acc + item.ongoingTasks.length, 0)
    const totalWeekly = weeklyTasks.length
    const urgentTasks = weeklyTasks.filter(t => t.daysLeft !== null && t.daysLeft <= 3).length
    const totalFlowers = summary.reduce((acc, item) => acc + item.flowers.length, 0)
    const totalFruits = summary.reduce((acc, item) => acc + item.fruits.length, 0)

    return { totalOngoing, totalWeekly, urgentTasks, totalFlowers, totalFruits }
  }, [summary, weeklyTasks])

  return (
    <div className="weekly-summary">
      {/* 第一栏：标题 */}
      <header className="weekly-summary-header">
        <h1>📋 本周工作概览</h1>
        <p className="date">
          {weekStart.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - {weekEnd.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* 第二栏：数字化统计 */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="number" style={{ color: '#3b82f6' }}>{stats.totalOngoing}</div>
          <div className="label">进行中</div>
        </div>
        <div className="stat-item highlight">
          <div className="number" style={{ color: '#f59e0b' }}>{stats.totalWeekly}</div>
          <div className="label">本周要务</div>
        </div>
        <div className="stat-item">
          <div className="number" style={{ color: '#ef4444' }}>{stats.urgentTasks}</div>
          <div className="label">紧急</div>
        </div>
        <div className="stat-item">
          <div className="number" style={{ color: '#ec4899' }}>{stats.totalFlowers}</div>
          <div className="label">🌸 花</div>
        </div>
        <div className="stat-item">
          <div className="number" style={{ color: '#22c55e' }}>{stats.totalFruits}</div>
          <div className="label">🍎 果</div>
        </div>
      </div>

      {/* 第三栏：本周要务列表 */}
      {weeklyTasks.length > 0 && (
        <div className="weekly-tasks-section">
          <h2>📌 本周要务详情</h2>
          <div className="weekly-tasks-list">
            {weeklyTasks.map((task, index) => (
              <div key={`${task.projectName}-${task.id}`} className="weekly-task-card">
                <div className="weekly-task-header">
                  <span className="weekly-task-number">{index + 1}.</span>
                  <span className="weekly-task-project" style={{ color: task.projectColor }}>
                    {task.projectName}
                  </span>
                  <span style={{ color: task.projectColor }}>
                    {getIcon(task.level)}
                  </span>
                  <span className="weekly-task-title">{task.title}</span>
                </div>
                {task.description && (
                  <div className="weekly-task-desc">
                    目标: {task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}
                  </div>
                )}
                <div className="weekly-task-footer">
                  <span className="weekly-task-date">
                    📅 {formatDateRange(task.startDate, task.endDate)}
                  </span>
                  <div className="progress-mini">
                    <div className="progress-mini-bar" style={{ width: `${task.progress}%`, background: task.projectColor }} />
                  </div>
                  <span className="progress-text">{task.progress}%</span>
                  <span className={`days-badge ${getDaysLeftClass(task.daysLeft)}`}>
                    {getDaysLeftText(task.daysLeft)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 项目详情（可折叠） */}
      <div className="projects-section">
        <h2>📁 项目详情</h2>
        {summary.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p>暂无项目</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summary.map(item => {
              const isExpanded = expandedProjects.has(item.project.id)

              return (
                <div
                  key={item.project.id}
                  className="project-card-mini"
                  style={{ borderLeft: `4px solid ${item.color}` }}
                >
                  <div
                    className="project-card-header"
                    onClick={() => handleProjectClick(item.project.id)}
                  >
                    <span style={{ fontSize: 20 }}>{STATUS_ICONS[item.project.status as ProjectStatus]}</span>
                    <span className="project-name">{item.project.name}</span>
                    <span className="project-count">{item.ongoingTasks.length} 项进行中</span>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={(e) => toggleProjectExpand(item.project.id, e)}
                      style={{
                        padding: '4px 8px',
                        background: '#f0f0f0',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 12,
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <ChevronRight size={18} style={{ color: '#ccc' }} />
                  </div>

                  {isExpanded && item.ongoingTasks.length > 0 && (
                    <div className="task-list-mini">
                      {item.ongoingTasks.map((task: any) => (
                        <div key={task.id} className={`task-item-mini ${task.inThisWeek ? 'this-week' : ''}`}>
                          <span style={{ color: item.color }}>{getIcon(task.level)}</span>
                          <span className="task-title-mini">{task.title}</span>
                          <span className="task-date-mini">{formatDateRange(task.startDate, task.endDate)}</span>
                          {task.daysLeft !== null && (
                            <span className={`days-mini ${getDaysLeftClass(task.daysLeft)}`}>
                              {task.daysLeft}天
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 花和果 */}
                  {(item.flowers.length > 0 || item.fruits.length > 0) && (
                    <div className="flowers-fruits-mini">
                      {item.flowers.length > 0 && (
                        <span className="flower-tag">🌸 {item.flowers.length}</span>
                      )}
                      {item.fruits.length > 0 && (
                        <span className="fruit-tag">🍎 {item.fruits.length}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
