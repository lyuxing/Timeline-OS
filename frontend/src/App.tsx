import { useEffect, useState } from 'react'
import { useStore } from './store'
import ProjectForest from './components/ProjectForest'
import FishboneTimeline from './components/FishboneTimeline'
import WeeklySummary from './components/WeeklySummary'
import TimelineOverview from './components/TimelineOverview'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import UserMenu from './components/UserMenu'
import InviteModal from './components/InviteModal'
import CreateTeamModal from './components/CreateTeamModal'
import { Calendar, GitBranch, TreeDeciduous } from 'lucide-react'
import './App.css'

export default function App() {
  const { initialize, initialized, loading, user, selectedProjectId, viewMode, setViewMode } = useStore()
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login')
  const [showInvite, setShowInvite] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)

  // Check for invite token in URL
  const inviteToken = new URLSearchParams(window.location.search).get('invite')

  useEffect(() => {
    initialize()
  }, [initialize])

  // Show auth page if not logged in
  if (!user && !loading) {
    if (authPage === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthPage('register')} />
    }
    return (
      <RegisterPage
        onSwitchToLogin={() => setAuthPage('login')}
        inviteToken={inviteToken || undefined}
      />
    )
  }

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
            <TreeDeciduous size={18} />
            项目树
          </button>
        </div>

        <UserMenu
          onInvite={() => setShowInvite(true)}
          onCreateTeam={() => setShowCreateTeam(true)}
        />
      </header>

      <main className="app-main">
        {viewMode === 'weekly' && <WeeklySummary />}
        {viewMode === 'timeline' && <TimelineOverview />}
        {viewMode === 'timeline-edit' && selectedProjectId && <FishboneTimeline />}
        {viewMode === 'map' && <ProjectForest />}
      </main>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {showCreateTeam && <CreateTeamModal onClose={() => setShowCreateTeam(false)} />}
    </div>
  )
}