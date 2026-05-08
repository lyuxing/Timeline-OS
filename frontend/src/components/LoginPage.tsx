import { useState } from 'react'
import { useStore } from '../store'
import './AuthPage.css'

interface LoginPageProps {
  onSwitchToRegister: () => void
}

export default function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login, authLoading, authError } = useStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(username, password)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌳</div>
        <h1>Timeline OS</h1>
        <p className="auth-subtitle">登录以继续</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名 / 邮箱</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin 或 your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
            />
          </div>

          {authError && <div className="auth-error">{authError}</div>}

          <button type="submit" className="auth-button" disabled={authLoading}>
            {authLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="auth-switch">
          还没有账号？
          <button type="button" onClick={onSwitchToRegister}>
            注册
          </button>
        </p>
      </div>
    </div>
  )
}
