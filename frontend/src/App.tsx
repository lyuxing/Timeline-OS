import { useEffect } from 'react'
import { useStore } from './store'
import DevMap from './components/DevMap'
import FishboneTimeline from './components/FishboneTimeline'
import WeeklySummary from './components/WeeklySummary'
import TimelineOverview from './components/TimelineOverview'
import { Calendar, GitBranch, Map } from 'lucide-react'
import './App.css'

export default function App() {
  const { initialize, initialized, loading, selectedProjectId, viewMode, setViewMode } = useStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading && !initialized) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">🌳</div>
        <p>加载中...</p>
      </div>
    )
  }

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
      </header>

      <main className="app-main">
        {viewMode === 'weekly' && <WeeklySummary />}
        {viewMode === 'timeline' && <TimelineOverview />}
        {viewMode === 'timeline-edit' && selectedProjectId && <FishboneTimeline />}
        {viewMode === 'map' && <DevMap />}
      </main>
    </div>
  )
}