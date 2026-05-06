import { Router, Request, Response } from 'express'
import {
  createDeveloper,
  getDeveloper,
  listDevelopers,
  updateDeveloper,
  deleteDeveloper,
} from '../storage/developers.js'

const router = Router()

// === Developers ===

router.get('/', (_req: Request, res: Response) => {
  const developers = listDevelopers()
  res.json(developers)
})

router.post('/', (req: Request, res: Response) => {
  const { name, avatar } = req.body
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const developer = createDeveloper(name, avatar)
  res.status(201).json(developer)
})

router.get('/:id', (req: Request, res: Response) => {
  const developer = getDeveloper(req.params.id)
  if (!developer) {
    res.status(404).json({ error: 'Developer not found' })
    return
  }
  res.json(developer)
})

router.patch('/:id', (req: Request, res: Response) => {
  const { name, avatar } = req.body
  const developer = updateDeveloper(req.params.id, { name, avatar })
  if (!developer) {
    res.status(404).json({ error: 'Developer not found' })
    return
  }
  res.json(developer)
})

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteDeveloper(req.params.id)
  if (!deleted) {
    res.status(400).json({ error: 'Cannot delete this developer' })
    return
  }
  res.status(204).send()
})

export default router
