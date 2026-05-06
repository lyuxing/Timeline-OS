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
  db.pragma('foreign_keys = ON')  // 启用外键约束

  createTables()
  runMigrations()
  console.log('📦 Database initialized at', dbPath)
}

function createTables() {
  const db = getDatabase()

  db.exec(`
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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

    CREATE INDEX IF NOT EXISTS idx_nodes_project ON nodes(project_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_milestone ON nodes(is_milestone, milestone_date);
  `)
}

function runMigrations() {
  const db = getDatabase()

  // 添加 start_date 列到 nodes 表（如果不存在）
  try {
    db.exec(`ALTER TABLE nodes ADD COLUMN start_date TEXT`)
  } catch (e) {
    // 列已存在，忽略错误
  }

  // 添加 vision 列到 projects 表（如果不存在）
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN vision TEXT`)
  } catch (e) {}

  // 添加 goal 列到 projects 表（如果不存在）
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN goal TEXT`)
  } catch (e) {}

  // 添加 end_date 列到 projects 表（如果不存在）
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN end_date TEXT`)
  } catch (e) {}

  // 添加 color 列到 nodes 表（如果不存在）
  try {
    db.exec(`ALTER TABLE nodes ADD COLUMN color TEXT`)
  } catch (e) {}
}