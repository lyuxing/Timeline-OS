import { create } from 'zustand'

interface Team {
  id: string
  name: string
}

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'member'
  teamId?: string
  team?: Team
}

interface Developer {
  id: string
  name: string
  avatar?: string
  color: string
  userId?: string
  teamId?: string
}

interface Project {
  id: string
  name: string
  status: string
  color: string
  vision?: string
  goal?: string
  start_date?: string
  end_date?: string
  developer_id?: string
  team_id?: string
  nodes?: any[]
}

interface AppState {
  // Auth state
  user: User | null
  token: string | null
  authLoading: boolean
  authError: string | null

  // App state
  developers: Developer[]
  projects: Project[]
  currentProject: Project | null
  selectedProjectId: string | null
  viewMode: 'map' | 'timeline' | 'timeline-edit' | 'weekly'
  loading: boolean
  initialized: boolean

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  registerWithInvite: (email: string, password: string, name: string, inviteToken: string) => Promise<boolean>
  acceptTeamInvite: (inviteToken: string) => Promise<boolean>
  createTeam: (name: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>

  // App actions
  initialize: () => Promise<void>
  fetchDevelopers: () => Promise<void>
  createDeveloper: (name: string) => Promise<Developer | null>
  fetchProjects: () => Promise<void>
  fetchProjectTree: (id: string) => Promise<void>
  createProject: (name: string, description?: string, developerId?: string) => Promise<Project | null>
  updateProject: (id: string, data: any) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  selectProject: (id: string | null) => void
  setViewMode: (mode: 'map' | 'timeline' | 'timeline-edit' | 'weekly') => void
  createNode: (projectId: string, data: any) => Promise<void>
  updateNode: (nodeId: string, data: any) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  // Auth state
  user: null,
  token: localStorage.getItem('token'),
  authLoading: false,
  authError: null,

  // App state
  developers: [],
  projects: [],
  currentProject: null,
  selectedProjectId: null,
  viewMode: 'map',
  loading: false,
  initialized: false,

  // Auth actions
  login: async (username: string, password: string) => {
    set({ authLoading: true, authError: null })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        set({ authError: data.error || 'Login failed', authLoading: false })
        return false
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      set({
        user: { ...data.user, team: data.team },
        token: data.token,
        authLoading: false,
        authError: null
      })
      return true
    } catch (e) {
      set({ authError: 'Login failed', authLoading: false })
      return false
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ authLoading: true, authError: null })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      if (!res.ok) {
        const data = await res.json()
        set({ authError: data.error || 'Registration failed', authLoading: false })
        return false
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      set({ user: data.user, token: data.token, authLoading: false, authError: null })
      return true
    } catch (e) {
      set({ authError: 'Registration failed', authLoading: false })
      return false
    }
  },

  registerWithInvite: async (email: string, password: string, name: string, inviteToken: string) => {
    set({ authLoading: true, authError: null })
    try {
      const res = await fetch('/api/auth/register-with-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, inviteToken }),
      })
      if (!res.ok) {
        const data = await res.json()
        set({ authError: data.error || 'Registration failed', authLoading: false })
        return false
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      set({
        user: { ...data.user, team: data.team },
        token: data.token,
        authLoading: false,
        authError: null
      })
      return true
    } catch (e) {
      set({ authError: 'Registration failed', authLoading: false })
      return false
    }
  },

  acceptTeamInvite: async (inviteToken: string) => {
    const token = get().token
    if (!token) return false

    set({ authLoading: true, authError: null })
    try {
      const res = await fetch('/api/auth/accept-team-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: inviteToken }),
      })
      if (!res.ok) {
        const data = await res.json()
        set({ authError: data.error || 'Failed to accept invitation', authLoading: false })
        return false
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      set({
        user: { ...data.user, team: data.team },
        token: data.token,
        authLoading: false,
        authError: null
      })
      // Refresh data after joining team
      await get().fetchDevelopers()
      await get().fetchProjects()
      return true
    } catch (e) {
      set({ authError: 'Failed to accept invitation', authLoading: false })
      return false
    }
  },

  createTeam: async (name: string) => {
    const token = get().token
    if (!token) return false

    set({ authLoading: true, authError: null })
    try {
      const res = await fetch('/api/auth/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json()
        set({ authError: data.error || 'Failed to create team', authLoading: false })
        return false
      }
      const data = await res.json()
      set(state => ({
        user: state.user ? { ...state.user, teamId: data.id, team: { id: data.id, name: data.name } } : null,
        authLoading: false,
      }))
      return true
    } catch (e) {
      set({ authError: 'Failed to create team', authLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, developers: [], projects: [], currentProject: null, initialized: false })
  },

  checkAuth: async () => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        set({ user: { ...data, team: data.team } })
      } else {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      }
    } catch (e) {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },

  // App actions
  initialize: async () => {
    if (get().initialized) return
    set({ loading: true })
    await get().checkAuth()
    if (!get().token) {
      set({ initialized: true, loading: false })
      return
    }
    await Promise.all([
      get().fetchDevelopers(),
      get().fetchProjects(),
    ])
    set({ initialized: true, loading: false })
  },

  fetchDevelopers: async () => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch('/api/developers', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const developers = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        avatar: d.avatar,
        color: d.color,
        userId: d.userId,
      }))
      set({ developers })
    } catch (e) {
      console.error('fetchDevelopers error:', e)
    }
  },

  createDeveloper: async (name: string) => {
    const token = get().token
    if (!token) return null
    try {
      const res = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      console.log('createDeveloper response:', data)
      const developer = {
        id: data.id,
        name: data.name,
        avatar: data.avatar,
        color: data.color,
        userId: data.userId || data.user_id,
        teamId: data.teamId || data.team_id,
      }
      set({ developers: [...get().developers, developer] })
      return developer
    } catch (e) {
      console.error('createDeveloper error:', e)
      return null
    }
  },

  fetchProjects: async () => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const projects = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        color: p.color,
        start_date: p.start_date,
        end_date: p.end_date,
        vision: p.vision,
        goal: p.goal,
        developer_id: p.developer_id || p.developerId,
        nodes: [],
      }))
      set({ projects })
    } catch (e) {
      console.error('fetchProjects error:', e)
    }
  },

  fetchProjectTree: async (id: string) => {
    const token = get().token
    if (!token) return
    try {
      console.log('Fetching project tree for:', id)
      const res = await fetch(`/api/projects/${id}/tree`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      console.log('API response:', data)

      const nodes = (data.nodes || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        status: n.status,
        type: n.type,
        is_milestone: n.isMilestone === true || n.is_milestone === 1 ? 1 : 0,
        milestone_date: n.milestoneDate || n.milestone_date,
        milestone_name: n.milestoneName || n.milestone_name,
        start_date: n.startDate || n.start_date,
        color: n.color,
        parent_id: n.parentId || n.parent_id,
      }))

      const project = {
        id: data.id,
        name: data.name,
        status: data.status,
        color: data.color,
        vision: data.vision,
        goal: data.goal,
        start_date: data.start_date || data.startDate,
        end_date: data.end_date || data.endDate,
        developer_id: data.developer_id || data.developerId,
        nodes,
      }

      console.log('Processed project:', project)

      set({
        currentProject: project,
        selectedProjectId: id,
        projects: get().projects.map(p => p.id === id ? { ...p, nodes } : p),
      })
    } catch (e) {
      console.error('fetchProjectTree error:', e)
    }
  },

  createProject: async (name: string, description?: string, developerId?: string) => {
    const token = get().token
    if (!token) return null
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, developerId }),
      })
      const data = await res.json()
      const project = {
        id: data.id,
        name: data.name,
        status: data.status,
        color: data.color,
        developer_id: data.developerId || data.developer_id,
        nodes: [],
      }
      set({ projects: [...get().projects, project] })
      return project
    } catch (e) {
      console.error('createProject error:', e)
      return null
    }
  },

  updateProject: async (id: string, data: any) => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      const updated = await res.json()
      if (get().currentProject?.id === id) {
        set({ currentProject: { ...get().currentProject!, ...updated } })
      }
    } catch (e) {
      console.error('updateProject error:', e)
    }
  },

  deleteProject: async (id: string) => {
    const token = get().token
    if (!token) return
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      set({
        projects: get().projects.filter(p => p.id !== id),
        currentProject: get().currentProject?.id === id ? null : get().currentProject,
        selectedProjectId: get().selectedProjectId === id ? null : get().selectedProjectId,
      })
    } catch (e) {
      console.error('deleteProject error:', e)
    }
  },

  selectProject: (id: string | null) => {
    set({ selectedProjectId: id })
    if (!id) set({ currentProject: null })
  },

  setViewMode: (mode: 'map' | 'timeline' | 'timeline-edit' | 'weekly') => {
    set({ viewMode: mode })
  },

  createNode: async (projectId: string, data: any) => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch(`/api/projects/${projectId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      const newNode = await res.json()
      console.log('createNode response:', newNode)

      const node = {
        id: newNode.id,
        title: newNode.title,
        status: newNode.status,
        type: newNode.type,
        is_milestone: newNode.isMilestone === true || newNode.is_milestone === 1 ? 1 : 0,
        milestone_date: newNode.milestoneDate || newNode.milestone_date,
        milestone_name: newNode.milestoneName || newNode.milestone_name,
        start_date: newNode.startDate || newNode.start_date,
        color: newNode.color,
        parent_id: newNode.parentId || newNode.parent_id,
        description: newNode.description,
      }

      // 更新当前项目
      const currentProject = get().currentProject
      if (currentProject?.id === projectId) {
        const updatedNodes = [...(currentProject.nodes || []), node]
        set({
          currentProject: { ...currentProject, nodes: updatedNodes },
          projects: get().projects.map(p => p.id === projectId ? { ...p, nodes: updatedNodes } : p),
        })
      }
    } catch (e) {
      console.error('createNode error:', e)
    }
  },

  updateNode: async (nodeId: string, data: any) => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch(`/api/projects/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      const updatedNode = await res.json()
      console.log('updateNode response:', updatedNode)

      // 转换字段名
      const mappedData = {
        title: updatedNode.title,
        description: updatedNode.description,
        status: updatedNode.status,
        type: updatedNode.type,
        is_milestone: updatedNode.isMilestone === true || updatedNode.is_milestone === 1 ? 1 : 0,
        milestone_date: updatedNode.milestoneDate || updatedNode.milestone_date,
        milestone_name: updatedNode.milestoneName || updatedNode.milestone_name,
        start_date: updatedNode.startDate || updatedNode.start_date,
        color: updatedNode.color,
      }

      set({
        currentProject: get().currentProject ? {
          ...get().currentProject!,
          nodes: get().currentProject!.nodes?.map(n => n.id === nodeId ? { ...n, ...mappedData } : n) || [],
        } : null,
        projects: get().projects.map(p => ({
          ...p,
          nodes: p.nodes?.map(n => n.id === nodeId ? { ...n, ...mappedData } : n) || [],
        })),
      })
    } catch (e) {
      console.error('updateNode error:', e)
    }
  },

  deleteNode: async (nodeId: string) => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch(`/api/projects/nodes/${nodeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok && res.status !== 204) {
        console.error('Delete failed:', res.status)
        return
      }
      console.log('Delete successful for node:', nodeId)
      set({
        currentProject: get().currentProject ? {
          ...get().currentProject!,
          nodes: get().currentProject!.nodes?.filter(n => n.id !== nodeId) || [],
        } : null,
        projects: get().projects.map(p => ({
          ...p,
          nodes: p.nodes?.filter(n => n.id !== nodeId) || [],
        })),
      })
    } catch (e) {
      console.error('deleteNode error:', e)
    }
  },
}))