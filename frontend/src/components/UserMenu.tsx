import { useState } from 'react'
import { useStore } from '../store'
import { LogOut, UserPlus, FolderPlus } from 'lucide-react'
import './UserMenu.css'

interface UserMenuProps {
  onInvite: () => void
  onCreateTeam: () => void
}

export default function UserMenu({ onInvite, onCreateTeam }: UserMenuProps) {
  const { user, logout } = useStore()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="user-menu">
      <button className="user-menu-trigger" onClick={() => setOpen(!open)}>
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="user-name">{user.name}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <span className="user-role">{user.role === 'admin' ? '管理员' : '成员'}</span>
            {user.team && <span className="user-team">团队：{user.team.name}</span>}
          </div>

          <div className="menu-divider" />

          {user.team ? (
            <button onClick={() => { setOpen(false); onInvite(); }}>
              <UserPlus size={16} />
              邀请成员
            </button>
          ) : (
            <button onClick={() => { setOpen(false); onCreateTeam(); }}>
              <FolderPlus size={16} />
              创建团队
            </button>
          )}

          <button onClick={logout}>
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
