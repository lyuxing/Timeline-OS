import { create } from 'zustand'

interface Developer {
  id: string
  name: string
  avatar?: string
  color: string
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
  nodes?: any[]
}

interface AppState {
  developers: Developer[]
  projects: Project[]
  currentProject: Project | null
  selectedProjectId: string | null
  viewMode: 'map' | 'timeline' | 'timeline-edit' | 'weekly'
  loading: boolean
  initialized: boolean

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
  developers: [],
  projects: [],
  currentProject: null,
  selectedProjectId: null,
  viewMode: 'map',
  loading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return
    set({ loading: true })
    await Promise.all([
      get().fetchDevelopers(),
      get().fetchProjects(),
    ])
    set({ initialized: true, loading: false })
  },

  fetchDevelopers: async () => {
    try {
      const res = await fetch('/api/developers')
      const data = await res.json()
      const developers = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        avatar: d.avatar,
        color: d.color,
      }))
      set({ developers })
    } catch (e) {
      console.error('fetchDevelopers error:', e)
    }
  },

  createDeveloper: async (name: string) => {
    try {
      const res = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      const developer = {
        id: data.id,
        name: data.name,
        avatar: data.avatar,
        color: data.color,
      }
      set({ developers: [...get().developers, developer] })
      return developer
    } catch (e) {
      console.error('createDeveloper error:', e)
      return null
    }
  },

  fetchProjects: async () => {
    try {
      const res = await fetch('/api/projects')
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
        developer_id: p.developer_id,
        nodes: [],
      }))
      set({ projects })
    } catch (e) {
      console.error('fetchProjects error:', e)
    }
  },

  fetchProjectTree: async (id: string) => {
    try {
      console.log('Fetching project tree for:', id)
      const res = await fetch(`/api/projects/${id}/tree`)
      const data = await res.json()
      console.log('API response:', data)

      const nodes = (data.nodes || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        status: n.status,
        type: n.type,
        is_milestone: n.is_milestone,
        milestone_date: n.milestone_date,
        milestone_name: n.milestone_name,
        start_date: n.start_date,
        color: n.color,
        parent_id: n.parent_id,
      }))

      const project = {
        id: data.id,
        name: data.name,
        status: data.status,
        color: data.color,
        vision: data.vision,
        goal: data.goal,
        start_date: data.start_date,
        end_date: data.end_date,
        developer_id: data.developer_id,
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
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, developerId }),
      })
      const data = await res.json()
      const project = {
        id: data.id,
        name: data.name,
        status: data.status,
        color: data.color,
        developer_id: data.developerId,
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
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
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
    try {
      const res = await fetch(`/api/projects/${projectId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const newNode = await res.json()

      const node = {
        id: newNode.id,
        title: newNode.title,
        status: newNode.status,
        type: newNode.type,
        is_milestone: newNode.isMilestone,
        milestone_date: newNode.milestoneDate,
        milestone_name: newNode.milestoneName,
        start_date: newNode.startDate,
        color: newNode.color,
        parent_id: newNode.parentId,
      }

      if (get().currentProject?.id === projectId) {
        set({
          currentProject: { ...get().currentProject!, nodes: [...(get().currentProject!.nodes || []), node] },
          projects: get().projects.map(p => p.id === projectId ? { ...p, nodes: [...(p.nodes || []), node] } : p),
        })
      }
    } catch (e) {
      console.error('createNode error:', e)
    }
  },

  updateNode: async (nodeId: string, data: any) => {
    try {
      await fetch(`/api/projects/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      set({
        currentProject: get().currentProject ? {
          ...get().currentProject!,
          nodes: get().currentProject!.nodes?.map(n => n.id === nodeId ? { ...n, ...data } : n) || [],
        } : null,
        projects: get().projects.map(p => ({
          ...p,
          nodes: p.nodes?.map(n => n.id === nodeId ? { ...n, ...data } : n) || [],
        })),
      })
    } catch (e) {
      console.error('updateNode error:', e)
    }
  },

  deleteNode: async (nodeId: string) => {
    try {
      const res = await fetch(`/api/projects/nodes/${nodeId}`, { method: 'DELETE' })
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