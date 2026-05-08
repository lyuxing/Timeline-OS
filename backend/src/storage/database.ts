import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../../data/timeline.db')

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function initDatabase() {
  const fs = require('fs')
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables()
  runMigrations()
  console.log('📦 Database initialized at', dbPath)
}

function createTables() {
  const db = getDatabase()

  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      team_id TEXT REFERENCES teams(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_invitations (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      team_id TEXT NOT NULL REFERENCES teams(id),
      team_name TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      token TEXT UNIQUE NOT NULL,
      created_by TEXT REFERENCES users(id),
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      accepted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS developers (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      team_id TEXT REFERENCES teams(id),
      name TEXT NOT NULL,
      avatar TEXT,
      color TEXT DEFAULT '#3b82f6',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      vision TEXT,
      goal TEXT,
      status TEXT DEFAULT 'seed',
      start_date TEXT,
      end_date TEXT,
      color TEXT DEFAULT '#3b82f6',
      position INTEGER DEFAULT 0,
      developer_id TEXT,
      team_id TEXT REFERENCES teams(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      parent_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'branch',
      status TEXT DEFAULT 'pending',
      is_milestone INTEGER DEFAULT 0,
      milestone_date TEXT,
      milestone_name TEXT,
      start_date TEXT,
      estimated_days INTEGER,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'custom',
      structure TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_project ON nodes(project_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_milestone ON nodes(is_milestone, milestone_date);
    CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_id);
    CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);
    CREATE INDEX IF NOT EXISTS idx_developers_team ON developers(team_id);
    CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
    CREATE INDEX IF NOT EXISTS idx_templates_creator ON templates(created_by);
  `)
}

function runMigrations() {
  const db = getDatabase()

  // Add team_id to users if not exists
  try { db.exec(`ALTER TABLE users ADD COLUMN team_id TEXT REFERENCES teams(id)`) } catch (e) {}

  // Add team_id to developers if not exists
  try { db.exec(`ALTER TABLE developers ADD COLUMN team_id TEXT REFERENCES teams(id)`) } catch (e) {}

  // Add team_id to projects if not exists
  try { db.exec(`ALTER TABLE projects ADD COLUMN team_id TEXT REFERENCES teams(id)`) } catch (e) {}

  // Add developer_id to projects if not exists
  try { db.exec(`ALTER TABLE projects ADD COLUMN developer_id TEXT`) } catch (e) {}

  // Add start_date to nodes if not exists
  try { db.exec(`ALTER TABLE nodes ADD COLUMN start_date TEXT`) } catch (e) {}

  // Add vision to projects if not exists
  try { db.exec(`ALTER TABLE projects ADD COLUMN vision TEXT`) } catch (e) {}

  // Add goal to projects if not exists
  try { db.exec(`ALTER TABLE projects ADD COLUMN goal TEXT`) } catch (e) {}

  // Add end_date to projects if not exists
  try { db.exec(`ALTER TABLE projects ADD COLUMN end_date TEXT`) } catch (e) {}

  // Add color to nodes if not exists
  try { db.exec(`ALTER TABLE nodes ADD COLUMN color TEXT`) } catch (e) {}

  // Create team_invitations table if not exists
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS team_invitations (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        team_id TEXT NOT NULL REFERENCES teams(id),
        team_name TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        token TEXT UNIQUE NOT NULL,
        created_by TEXT REFERENCES users(id),
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        accepted_at TEXT
      )
    `)
  } catch (e) {}

  // Create default users if not exists
  const bcrypt = require('bcrypt')
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  const now = new Date().toISOString()
  const passwordHash = bcrypt.hashSync('123456', 10)
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4']

  if (existingUsers.count === 0) {
    // Create admin user with corresponding developer
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('user-admin', 'admin@timeline.os', passwordHash, 'admin', 'admin', now, now)

    // Create developer for admin user
    db.prepare(`
      INSERT INTO developers (id, user_id, name, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('dev-admin', 'user-admin', 'admin', colors[0], now, now)

    // Create test user with corresponding developer
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('user-test', 'test@timeline.os', passwordHash, 'test', 'member', now, now)

    // Create developer for test user
    db.prepare(`
      INSERT INTO developers (id, user_id, name, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('dev-test', 'user-test', 'test', colors[1], now, now)

    console.log('👥 Created default users: admin / 123456, test / 123456')
  }
}
