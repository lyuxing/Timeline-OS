import { getDatabase } from '../storage/database.js'

const bcrypt = require('bcrypt')

function initUsers() {
  const db = getDatabase()
  const now = new Date().toISOString()
  const passwordHash = bcrypt.hashSync('123456', 10)

  // 创建 admin 用户
  try {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('user-admin', 'admin@timeline.os', passwordHash, 'admin', 'admin', now, now)
    console.log('✓ Created admin user (admin / 123456)')
  } catch (e) {
    console.log('• Admin user already exists')
  }

  // 创建 test 用户
  try {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('user-test', 'test@timeline.os', passwordHash, 'test', 'member', now, now)
    console.log('✓ Created test user (test / 123456)')
  } catch (e) {
    console.log('• Test user already exists')
  }

  // 显示所有用户
  const users = db.prepare('SELECT id, email, name, role FROM users').all() as any[]
  console.log('\n当前用户列表:')
  users.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}]`))
}

initUsers()
