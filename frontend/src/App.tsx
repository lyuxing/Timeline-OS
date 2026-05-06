import { useState, useEffect } from 'react'
import { useStore } from './store'
import DevMap from './components/DevMap'
import FishboneTimeline from './components/FishboneTimeline'
import WeeklySummary from './components/WeeklySummary'
import TimelineOverview from './components/TimelineOverview'
import CreateProjectModal from './components/CreateProjectModal'
import { Plus, Map, GitBranch, Calendar } from 'lucide-react'
import './App.css'

export default function App() {
  const { fetchProjects, selectedProjectId, viewMode, setViewMode } = useStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌳 Timeline OS</h1>

        <div className="view-toggle">
          <button
            className={viewMode === 'weekly' ? 'active' : ''}
            onClick={() => setViewMode('weekly')}
          >
            <Calendar size={18} />
            本周概览
          </button>
          <button
            className={viewMode === 'timeline' ? 'active' : ''}
            onClick={() => setViewMode('timeline')}
          >
            <GitBranch size={18} />
            时间线
          </button>
          <button
            className={viewMode === 'map' ? 'active' : ''}
            onClick={() => setViewMode('map')}
          >
            <Map size={18} />
            开发地图
          </button>
        </div>

        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          新建项目
        </button>
      </header>

      <main className="app-main">
        {viewMode === 'weekly' && <WeeklySummary />}
        {viewMode === 'timeline' && <TimelineOverview />}
        {viewMode === 'timeline-edit' && selectedProjectId && <FishboneTimeline />}
        {viewMode === 'map' && <DevMap />}
      </main>

      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
