import { Router, Request, Response } from 'express'
import { createUser, getUserByEmail, getUserById, updateUser, getUserByUsernameOrEmail, validatePassword } from '../storage/users'
import { createTeamInvitation, getInvitationByToken, acceptInvitation, getPendingInvitations, deleteInvitation } from '../storage/invitations'
import { createTeam, getTeamById } from '../storage/teams'
import { createDeveloper, getDeveloperByUserId } from '../storage/developers'
import { generateToken } from '../utils/jwt'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Register - free registration, no invite required
router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    // Check if email already exists
    const existingUser = getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const user = createUser(email, password, name)

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Accept team invite - for existing users joining a team
router.post('/accept-team-invite', (req: Request, res: Response) => {
  try {
    const { token } = req.body
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userToken = authHeader.substring(7)
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'timeline-os-secret-key-change-in-production'

    let decoded
    try {
      decoded = jwt.verify(userToken, JWT_SECRET) as { userId: string }
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const invitation = getInvitationByToken(token)
    if (!invitation) {
      return res.status(400).json({ error: 'Invalid invitation token' })
    }
    if (invitation.acceptedAt) {
      return res.status(400).json({ error: 'Invitation already used' })
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' })
    }

    // Add user to team
    updateUser(decoded.userId, { teamId: invitation.teamId })
    acceptInvitation(token)

    const user = getUserById(decoded.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    res.json({
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId
      },
      team: {
        id: invitation.teamId,
        name: invitation.teamName
      }
    })
  } catch (error) {
    console.error('Accept invite error:', error)
    res.status(500).json({ error: 'Failed to accept invitation' })
  }
})

// Register with team invite - for new users
router.post('/register-with-invite', (req: Request, res: Response) => {
  try {
    const { email, password, name, inviteToken } = req.body

    if (!email || !password || !name || !inviteToken) {
      return res.status(400).json({ error: 'All fields including invite token are required' })
    }

    const invitation = getInvitationByToken(inviteToken)
    if (!invitation) {
      return res.status(400).json({ error: 'Invalid invitation token' })
    }
    if (invitation.acceptedAt) {
      return res.status(400).json({ error: 'Invitation already used' })
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' })
    }
    if (invitation.email !== email) {
      return res.status(400).json({ error: 'Email does not match invitation' })
    }

    const existingUser = getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Create user and add to team
    const user = createUser(email, password, name, invitation.teamId, invitation.role)
    acceptInvitation(inviteToken)

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId
      },
      team: {
        id: invitation.teamId,
        name: invitation.teamName
      }
    })
  } catch (error) {
    console.error('Register with invite error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login - 支持用户名或邮箱
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' })
    }

    // 支持用户名或邮箱登录
    const user = getUserByUsernameOrEmail(username)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!validatePassword(user, password)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // 确保用户有对应的开发者记录
    let developer = getDeveloperByUserId(user.id)
    if (!developer) {
      // 自动为用户创建开发者记录
      developer = createDeveloper(user.name, undefined, user.id, user.teamId)
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    let team = null
    if (user.teamId) {
      const teamData = getTeamById(user.teamId)
      if (teamData) {
        team = { id: teamData.id, name: teamData.name }
      }
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
        developerId: developer.id
      },
      team
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current user
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  let team = null
  if (user.teamId) {
    const teamData = getTeamById(user.teamId)
    if (teamData) {
      team = { id: teamData.id, name: teamData.name }
    }
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    teamId: user.teamId,
    team
  })
})

// Create team
router.post('/teams', requireAuth, (req: Request, res: Response) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' })
    }

    const user = getUserById(req.user!.userId)
    if (user?.teamId) {
      return res.status(400).json({ error: 'You already belong to a team' })
    }

    const team = createTeam(name, req.user!.userId)

    // Update user to be team admin and member
    updateUser(req.user!.userId, { teamId: team.id })

    res.json({
      id: team.id,
      name: team.name,
      createdBy: team.createdBy
    })
  } catch (error) {
    console.error('Create team error:', error)
    res.status(500).json({ error: 'Failed to create team' })
  }
})

// Invite member to team
router.post('/teams/:teamId/invite', requireAuth, (req: Request, res: Response) => {
  try {
    const { email, role } = req.body
    const { teamId } = req.params

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = getUserById(req.user!.userId)
    if (!user || user.teamId !== teamId) {
      return res.status(403).json({ error: 'You are not a member of this team' })
    }

    const team = getTeamById(teamId)
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check if email already in team
    const existingUser = getUserByEmail(email)
    if (existingUser && existingUser.teamId === teamId) {
      return res.status(400).json({ error: 'User already in this team' })
    }

    const invitation = createTeamInvitation(email, teamId, team.name, role || 'member', req.user!.userId)

    res.json({
      id: invitation.id,
      email: invitation.email,
      teamId: invitation.teamId,
      teamName: invitation.teamName,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt
    })
  } catch (error) {
    console.error('Invite error:', error)
    res.status(500).json({ error: 'Failed to create invitation' })
  }
})

// Get pending invitations for team
router.get('/teams/:teamId/invitations', requireAuth, (req: Request, res: Response) => {
  const { teamId } = req.params
  const user = getUserById(req.user!.userId)

  if (!user || user.teamId !== teamId) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const { getPendingInvitationsByTeam } = require('../storage/invitations')
  const invitations = getPendingInvitationsByTeam(teamId)
  res.json(invitations.map((inv: any) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt
  })))
})

// Delete invitation
router.delete('/invitations/:id', requireAuth, (req: Request, res: Response) => {
  const success = deleteInvitation(req.params.id)
  if (success) {
    res.json({ success: true })
  } else {
    res.status(404).json({ error: 'Invitation not found' })
  }
})

// Validate invite token
router.get('/validate-invite/:token', (req: Request, res: Response) => {
  const invitation = getInvitationByToken(req.params.token)

  if (!invitation) {
    return res.status(400).json({ error: 'Invalid invitation token' })
  }
  if (invitation.acceptedAt) {
    return res.status(400).json({ error: 'Invitation already used' })
  }
  if (new Date(invitation.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Invitation has expired' })
  }

  res.json({
    email: invitation.email,
    teamId: invitation.teamId,
    teamName: invitation.teamName,
    role: invitation.role
  })
})

export default router
