import { useState } from 'react'
import { useStore } from '../store'
import { X } from 'lucide-react'

interface CreateTeamModalProps {
  onClose: () => void
}

export default function CreateTeamModal({ onClose }: CreateTeamModalProps) {
  const { createTeam, authLoading, authError } = useStore()
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const success = await createTeam(name.trim())
    if (success) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal invite-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>创建团队</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>团队名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：研发团队"
              required
            />
          </div>

          <p className="team-hint">创建团队后，你可以邀请成员加入，共同协作项目。</p>

          {authError && <div className="error-message">{authError}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-submit" disabled={authLoading}>
              {authLoading ? '创建中...' : '创建团队'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}