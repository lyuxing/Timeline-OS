import { Router, Request, Response } from 'express'
import {
  createDeveloper,
  getDeveloper,
  listDevelopers,
  updateDeveloper,
  deleteDeveloper,
} from '../storage/developers.js'
import { getUserById } from '../storage/users.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// === Developers ===

router.get('/', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId)
  const teamId = user?.teamId || undefined
  const developers = listDevelopers(teamId)
  res.json(developers)
})

router.post('/', requireAuth, (req: Request, res: Response) => {
  const { name, avatar, userId } = req.body
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const user = getUserById(req.user!.userId)
  const teamId = user?.teamId || undefined
  const developer = createDeveloper(name, avatar, userId, teamId)
  res.status(201).json(developer)
})

router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const developer = getDeveloper(req.params.id)
  if (!developer) {
    res.status(404).json({ error: 'Developer not found' })
    return
  }
  res.json(developer)
})

router.patch('/:id', requireAuth, (req: Request, res: Response) => {
  const { name, avatar } = req.body
  const developer = updateDeveloper(req.params.id, { name, avatar })
  if (!developer) {
    res.status(404).json({ error: 'Developer not found' })
    return
  }
  res.json(developer)
})

router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const deleted = deleteDeveloper(req.params.id)
  if (!deleted) {
    res.status(400).json({ error: 'Cannot delete this developer' })
    return
  }
  res.status(204).send()
})

export default router
