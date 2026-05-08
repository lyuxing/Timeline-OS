import { useState, useEffect } from 'react'
import { useStore } from '../store'
import './AuthPage.css'

interface RegisterPageProps {
  onSwitchToLogin: () => void
  inviteToken?: string
}

export default function RegisterPage({ onSwitchToLogin, inviteToken }: RegisterPageProps) {
  const { register, registerWithInvite, authLoading, authError } = useStore()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)
  const [teamName, setTeamName] = useState<string | null>(null)

  useEffect(() => {
    if (inviteToken) {
      fetch(`/api/auth/validate-invite/${inviteToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.email) {
            setInvitedEmail(data.email)
            setEmail(data.email)
            setTeamName(data.teamName)
          }
        })
        .catch(() => {})
    }
  }, [inviteToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('密码不匹配')
      return
    }
    if (inviteToken) {
      await registerWithInvite(email, password, name, inviteToken)
    } else {
      await register(email, password, name)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌳</div>
        <h1>Timeline OS</h1>
        <p className="auth-subtitle">
          {teamName ? `加入团队「${teamName}」` : '创建新账号'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的名字"
              required
            />
          </div>

          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={!!invitedEmail}
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="设置密码"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
            />
          </div>

          {authError && <div className="auth-error">{authError}</div>}

          <button type="submit" className="auth-button" disabled={authLoading}>
            {authLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="auth-switch">
          已有账号？
          <button type="button" onClick={onSwitchToLogin}>
            登录
          </button>
        </p>
      </div>
    </div>
  )
}
