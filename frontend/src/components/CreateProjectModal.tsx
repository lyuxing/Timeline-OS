import { useState } from 'react'
import { useStore } from '../store'

interface Props {
  onClose: () => void
}

export default function CreateProjectModal({ onClose }: Props) {
  const { createProject, fetchProjects } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return

    setLoading(true)
    await createProject(name.trim(), description.trim())
    await fetchProjects()
    setLoading(false)

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>新建项目</h2>

        <input
          className="modal-input"
          placeholder="项目名称"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <textarea
          className="modal-input"
          placeholder="项目描述（可选）"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-submit"
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
          >
            {loading ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}