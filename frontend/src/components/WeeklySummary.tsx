import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { STATUS_ICONS, ProjectStatus } from '../types'
import { ChevronRight } from 'lucide-react'
import './WeeklySummary.css'

export default function WeeklySummary() {
  const { projects, fetchProjects, fetchProjectTree, selectProject, setViewMode } = useStore()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      await fetchProjects()
      setLoaded(true)
    }
    loadData()
  }, [fetchProjects])

  useEffect(() => {
    if (loaded && projects.length > 0) {
      // 检查是否所有项目都有 nodes
      const needsFetch = projects.some(p => !p.nodes || p.nodes.length === 0)
      if (needsFetch) {
        projects.forEach(p => {
          if (!p.nodes || p.nodes.length === 0) {
            fetchProjectTree(p.id)
          }
        })
      }
    }
  }, [loaded, projects, fetchProjectTree])

  const summary = useMemo(() => {
    const now = new Date()
    // 本周开始（周一）和结束（周日）
    const weekStart = new Date(now)
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    weekStart.setDate(now.getDate() + daysToMonday)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    console.log('Week boundaries:', weekStart.toISOString(), weekEnd.toISOString())

    const projectSummaries: any[] = []

    projects.forEach(project => {
      console.log('Processing project:', project.name, 'nodes:', project.nodes?.length || 0)

      const milestones = (project.nodes || [])
        .filter((n: any) => n.is_milestone === 1 && n.milestone_date)
        .sort((a: any, b: any) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime())

      // 下一个里程碑
      const nextMilestone = milestones.find((m: any) => {
        const date = new Date(m.milestone_date)
        return date >= now
      })

      let daysLeft = null
      if (nextMilestone) {
        const diff = new Date(nextMilestone.milestone_date).getTime() - now.getTime()
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
      }

      // 本周要做的任务
      const thisWeekTasks: any[] = []
      ;(project.nodes || []).forEach((n: any) => {
        // 里程碑任务 - 检查 milestone_date 是否在本周
        if (n.is_milestone === 1 && n.milestone_date) {
          const date = new Date(n.milestone_date)
          if (date >= weekStart && date <= weekEnd) {
            thisWeekTasks.push({
              id: n.id,
              title: n.milestone_name || n.title,
              date: n.milestone_date,
              type: 'milestone',
            })
          }
        }
        // 有开始日期的任务 - 检查 start_date 是否在本周
        if (n.start_date) {
          const date = new Date(n.start_date)
          if (date >= weekStart && date <= weekEnd) {
            thisWeekTasks.push({
              id: n.id,
              title: n.title,
              date: n.start_date,
              type: n.type || 'branch',
            })
          }
        }
      })

      // 按日期排序
      thisWeekTasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // 获取花和果
      const flowers = (project.nodes || []).filter((n: any) => n.type === 'flower')
      const fruits = (project.nodes || []).filter((n: any) => n.type === 'fruit')

      // 显示所有有里程碑的项目，或者有节点的项目
      if (milestones.length > 0 || (project.nodes && project.nodes.length > 0)) {
        projectSummaries.push({
          project,
          nextMilestone,
          daysLeft,
          thisWeekTasks,
          milestones,  // 添加所有里程碑用于显示
          flowers,
          fruits,
          color: project.color || '#3b82f6',
        })
      }
    })

    // 按最近里程碑排序
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

  const getDaysLeftClass = (days: number | null) => {
    if (days === null) return 'normal'
    if (days <= 1) return 'urgent'
    if (days <= 3) return 'soon'
    return 'normal'
  }

  const getDaysLeftText = (days: number | null) => {
    if (days === null) return ''
    if (days === 0) return '今天'
    if (days === 1) return '明天'
    return `${days}天后`
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'milestone': return '🚩'
      case 'flower': return '🌸'
      case 'fruit': return '🍎'
      default: return '🌿'
    }
  }

  const handleProjectClick = (projectId: string) => {
    console.log('Clicking project:', projectId)
    selectProject(projectId)
    fetchProjectTree(projectId)
    setViewMode('timeline-edit')
  }

  return (
    <div className="weekly-summary">
      <header className="weekly-summary-header">
        <h1>📋 本周工作概览</h1>
        <p className="date">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {summary.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p>暂无待办事项</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {summary.map(item => (
            <div
              key={item.project.id}
              className="project-card"
              style={{ borderLeft: `4px solid ${item.color}` }}
              onClick={() => handleProjectClick(item.project.id)}
            >
              <div className="project-card-header">
                <span style={{ fontSize: 24 }}>{STATUS_ICONS[item.project.status as ProjectStatus]}</span>
                <span className="project-name">{item.project.name}</span>
                <span style={{ color: '#666', fontSize: 13 }}>
                  下个里程碑:
                  <span
                    className={`days-badge ${getDaysLeftClass(item.daysLeft)}`}
                    style={{ marginLeft: 6 }}
                  >
                    {item.nextMilestone ? (item.nextMilestone.milestone_name || item.nextMilestone.title) : '无'}
                    {item.daysLeft !== null ? ` (${getDaysLeftText(item.daysLeft)})` : ''}
                  </span>
                </span>
                <ChevronRight size={18} style={{ color: '#ccc' }} />
              </div>

              {/* 本周任务 */}
              {item.thisWeekTasks.length > 0 && (
                <div className="milestone-list" style={{ borderTop: '1px solid #eee' }}>
                  <div className="milestone-list-title">本周任务 ({item.thisWeekTasks.length})</div>
                  {item.thisWeekTasks.map((task: any) => (
                    <div key={task.id} className="milestone-item">
                      <span style={{ color: item.color }}>{getTaskIcon(task.type)}</span>
                      <span>{task.title}</span>
                      <span className="date">{formatDate(task.date)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 本周无任务时显示里程碑列表 */}
              {item.thisWeekTasks.length === 0 && item.milestones && item.milestones.length > 0 && (
                <div className="milestone-list" style={{ borderTop: '1px solid #eee' }}>
                  <div className="milestone-list-title">里程碑规划</div>
                  {item.milestones.slice(0, 3).map((m: any) => (
                    <div key={m.id} className="milestone-item">
                      <span style={{ color: item.color }}>🚩</span>
                      <span>{m.milestone_name || m.title}</span>
                      <span className="date">{formatDate(m.milestone_date)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 显示花和果 */}
              {(item.flowers.length > 0 || item.fruits.length > 0) && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {item.flowers.length > 0 && (
                    <div>
                      <span style={{ fontSize: 12, color: '#888' }}>🌸 花 ({item.flowers.length})</span>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {item.flowers.map((f: any) => (
                          <span key={f.id} style={{ fontSize: 12, background: '#fef3f2', padding: '2px 8px', borderRadius: 4, color: '#ec4899' }}>
                            {f.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.fruits.length > 0 && (
                    <div>
                      <span style={{ fontSize: 12, color: '#888' }}>🍎 果 ({item.fruits.length})</span>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {item.fruits.map((f: any) => (
                          <span key={f.id} style={{ fontSize: 12, background: '#f0fdf4', padding: '2px 8px', borderRadius: 4, color: '#22c55e' }}>
                            {f.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 快速统计 */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="number" style={{ color: '#3b82f6' }}>
            {summary.reduce((acc, item) => acc + item.thisWeekTasks.length, 0)}
          </div>
          <div className="label">本周任务</div>
        </div>
        <div className="stat-item">
          <div className="number" style={{ color: '#f59e0b' }}>
            {summary.filter(item => item.daysLeft !== null && item.daysLeft <= 3).length}
          </div>
          <div className="label">即将到期</div>
        </div>
        <div className="stat-item">
          <div className="number" style={{ color: '#22c55e' }}>
            {summary.length}
          </div>
          <div className="label">活跃项目</div>
        </div>
        <div className="stat-item">
          <div className="number" style={{ color: '#ec4899' }}>
            {summary.reduce((acc, item) => acc + item.flowers.length, 0)}
          </div>
          <div className="label">花</div>
        </div>
        <div className="stat-item">
          <div className="number" style={{ color: '#22c55e' }}>
            {summary.reduce((acc, item) => acc + item.fruits.length, 0)}
          </div>
          <div className="label">果</div>
        </div>
      </div>
    </div>
  )
}
