import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import projectRoutes from './routes/projects.js'
import developerRoutes from './routes/developers.js'
import authRoutes from './routes/auth.js'
import templateRoutes from './routes/templates.js'
import { initDatabase } from './storage/database.js'

config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/developers', developerRoutes)
app.use('/api/templates', templateRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

async function start() {
  try {
    initDatabase()
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()