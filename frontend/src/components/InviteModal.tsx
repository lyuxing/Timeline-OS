import { useState } from 'react'
import { useStore } from '../store'
import { X } from 'lucide-react'

interface InviteModalProps {
  onClose: () => void
}

export default function InviteModal({ onClose }: InviteModalProps) {
  const { user, token } = useStore()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ email: string; token: string } | null>(null)

  const teamId = user?.teamId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamId) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/auth/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '邀请失败')
      } else {
        setSuccess({ email: data.email, token: data.token })
      }
    } catch (e) {
      setError('邀请失败')
    } finally {
      setLoading(false)
    }
  }

  const inviteUrl = success
    ? `${window.location.origin}/register?invite=${success.token}`
    : ''

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal invite-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>邀请成员加入团队</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="invite-success">
            <p>邀请已创建！</p>
            <p className="invite-email">邮箱: {success.email}</p>
            <div className="invite-link">
              <label>邀请链接：</label>
              <input
                type="text"
                value={inviteUrl}
                readOnly
                onClick={e => (e.target as HTMLInputElement).select()}
              />
            </div>
            <p className="invite-hint">请将此链接发送给被邀请者，链接7天内有效。</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>角色</label>
              <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'member')}>
                <option value="member">成员</option>
                <option value="admin">管理员</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? '邀请中...' : '发送邀请'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
