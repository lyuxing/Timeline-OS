import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { STATUS_ICONS, ProjectStatus } from '../types'
import { ChevronRight } from 'lucide-react'
import './TimelineOverview.css'

const MILESTONE_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#6366f1', '#84cc16', '#e11d48'
]

export default function TimelineOverview() {
  const { projects, fetchProjects, fetchProjectTree, selectProject, setViewMode } = useStore()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      await fetchProjects()
      setLoaded(true)
    }
    load()
  }, [fetchProjects])

  useEffect(() => {
    if (loaded && projects.length > 0) {
      projects.forEach(p => {
        if (!p.nodes || p.nodes.length === 0) {
          fetchProjectTree(p.id)
        }
      })
    }
  }, [loaded, projects, fetchProjectTree])

  const handleProjectClick = (projectId: string) => {
    console.log('TimelineOverview - Clicking project:', projectId)
    selectProject(projectId)
    fetchProjectTree(projectId)
    setViewMode('timeline-edit')
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const renderMiniTimeline = (project: any) => {
    const milestones = (project.nodes || [])
      .filter((n: any) => n.is_milestone === 1 && n.milestone_date)
      .sort((a: any, b: any) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime())

    if (milestones.length === 0) {
      return <div className="mini-timeline-empty">暂无里程碑</div>
    }

    const startDate = project.start_date ? new Date(project.start_date) : new Date()
    const endDate = project.end_date ? new Date(project.end_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

    return (
      <div className="mini-timeline">
        <div className="mini-timeline-bar" style={{ background: project.color || '#3b82f6' }}>
          {/* 开始点 */}
          <div className="mini-start" style={{ background: project.color || '#3b82f6' }}>
            🌱
          </div>

          {/* 里程碑点 */}
          {milestones.map((m: any, i: number) => {
            const date = new Date(m.milestone_date)
            const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            const days = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            const leftPercent = Math.min(100, Math.max(0, (days / totalDays) * 100))
            const color = m.color || MILESTONE_COLORS[i % MILESTONE_COLORS.length]

            return (
              <div
                key={m.id}
                className="mini-milestone"
                style={{
                  left: `${leftPercent}%`,
                  borderColor: color,
                  background: '#fff',
                }}
                title={`${m.milestone_name || m.title}: ${formatDate(m.milestone_date)}`}
              >
                🚩
              </div>
            )
          })}

          {/* 结束点 */}
          <div className="mini-end" style={{ background: project.color || '#3b82f6' }}>
            🎯
          </div>
        </div>

        {/* 里程碑名称列表 */}
        <div className="mini-milestone-names">
          {milestones.slice(0, 4).map((m: any) => (
            <span key={m.id} className="mini-milestone-name">
              {m.milestone_name || m.title}
            </span>
          ))}
          {milestones.length > 4 && (
            <span className="mini-milestone-more">+{milestones.length - 4}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="timeline-overview">
      <header className="timeline-overview-header">
        <h1>📅 时间线概览</h1>
        <p>点击项目进入详细编辑</p>
      </header>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无项目，请新建项目</p>
        </div>
      ) : (
        <div className="timeline-list">
          {projects.map(project => (
            <div
              key={project.id}
              className="timeline-card"
              style={{ borderLeftColor: project.color || '#3b82f6' }}
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="timeline-card-header">
                <span className="project-icon">{STATUS_ICONS[project.status as ProjectStatus]}</span>
                <span className="project-name">{project.name}</span>
                <span className="project-dates">
                  {project.start_date && formatDate(project.start_date)} - {project.end_date && formatDate(project.end_date)}
                </span>
                <ChevronRight size={18} className="chevron" />
              </div>

              <div className="timeline-card-body">
                {renderMiniTimeline(project)}

                <div className="project-stats">
                  <span className="stat">
                    🚩 {(project.nodes || []).filter((n: any) => n.is_milestone === 1).length} 里程碑
                  </span>
                  <span className="stat">
                    🌸 {(project.nodes || []).filter((n: any) => n.type === 'flower').length} 花
                  </span>
                  <span className="stat">
                    🍎 {(project.nodes || []).filter((n: any) => n.type === 'fruit').length} 果
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
