# Timeline OS 数据模型设计

## 核心理念

- **时间粒度**：里程碑节点（只标记关键日期，其他用相对时间）
- **树结构**：自由生长（节点可自由添加分支，无严格层级限制）
- **视图联动**：时间线为主视图，点击展开项目树

---

## 数据结构

### 1. Project（项目）

```typescript
interface Project {
  id: string
  name: string
  description?: string
  status: 'seed' | 'rooting' | 'growing' | 'fruiting' | 'blooming' | 'archived'

  // 时间线相关
  startDate?: Date      // 项目开始时间（可选）
  milestoneDate?: Date  // 下一个里程碑日期

  // 显示相关
  color: string         // 项目颜色（用于甘特图）
  position?: number     // 在时间线上的排序位置

  createdAt: Date
  updatedAt: Date
}
```

### 2. Node（节点）

```typescript
interface Node {
  id: string
  projectId: string
  parentId?: string     // 父节点ID（树形结构）

  title: string
  description?: string
  type: 'seed' | 'branch' | 'fruit' | 'flower'
  status: 'pending' | 'active' | 'done' | 'blocked'

  // 里程碑相关（核心）
  isMilestone: boolean      // 是否是里程碑节点
  milestoneDate?: Date      // 里程碑日期
  milestoneName?: string    // 里程碑名称（如"MVP发布"、"上线"）

  // 时间估算（相对时间）
  estimatedDays?: number    // 预估天数
  actualDays?: number       // 实际天数（完成后）

  // 显示位置（树形视图）
  positionX?: number
  positionY?: number

  createdAt: Date
  updatedAt: Date
}
```

### 3. Timeline（时间线视图数据）

```typescript
// 时间线上的项目行
interface TimelineRow {
  project: Project
  nodes: TimelineNode[]
}

// 时间线上的节点
interface TimelineNode {
  node: Node
  startDate: Date      // 计算后的开始日期
  endDate: Date        // 计算后的结束日期
  isMilestone: boolean
}
```

---

## 时间线计算逻辑

### 里程碑驱动的时间计算

```
规则：
1. 有里程碑日期的节点 → 固定在时间轴上
2. 无里程碑的节点 → 相对于父节点或项目开始时间

示例：
项目B (开始: 2/1)
├── 需求分析 (预估 7 天) → 2/1 ~ 2/7
├── 开发阶段 (预估 30 天) → 2/8 ~ 3/10
│   ├── 前端 (预估 20 天)
│   ├── 后端 (预估 15 天)
│   └── 里程碑: MVP发布 (固定 3/15) ← 锚点
└── 上线 (里程碑: 4/1) ← 锚点

计算：
- 如果有里程碑，以里程碑为准
- 没有里程碑的节点，根据预估天数和依赖关系自动计算
- 用户可以手动调整
```

---

## 状态流转

### 项目状态

```
🌱 seed     → 刚有的想法
🪴 rooting  → 预研/学习中
🌿 growing  → 开发推进中
🍎 fruiting → 已有可交付成果
🌸 blooming → 取得成绩/奖励
🍂 archived → 已归档
```

### 节点状态

```
pending   → 待开始
active    → 进行中
done      → 已完成
blocked   → 阻塞中
```

---

## 视图设计

### 1. 时间线视图（主视图）

```
功能：
- 显示所有项目的时间线
- 横轴：时间（月/周切换）
- 纵轴：项目列表
- 节点显示为时间条或里程碑标记

交互：
- 点击项目行 → 展开项目树（侧边或下方）
- 拖拽节点 → 调整时间
- 右键 → 添加里程碑
```

### 2. 项目树视图（详情视图）

```
功能：
- 显示单个项目的树形结构
- 节点可自由添加分支
- 显示里程碑日期

交互：
- 添加子节点
- 设置里程碑
- 修改状态
- 拖拽调整位置
```

---

## API 设计

### 项目 API

```
GET    /api/projects              # 获取项目列表
POST   /api/projects              # 创建项目
GET    /api/projects/:id          # 获取项目详情
PATCH  /api/projects/:id          # 更新项目
DELETE /api/projects/:id          # 删除项目
GET    /api/projects/:id/tree     # 获取项目树
GET    /api/timeline              # 获取时间线数据
```

### 节点 API

```
POST   /api/projects/:id/nodes    # 创建节点
PATCH  /api/nodes/:id             # 更新节点
DELETE /api/nodes/:id             # 删除节点
POST   /api/nodes/:id/milestone   # 设置里程碑
```

---

## 存储设计（SQLite）

```sql
-- 项目表
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'seed',
  start_date TEXT,
  color TEXT DEFAULT '#3b82f6',
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 节点表
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  parent_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'branch',
  status TEXT DEFAULT 'pending',

  -- 里程碑
  is_milestone INTEGER DEFAULT 0,
  milestone_date TEXT,
  milestone_name TEXT,

  -- 时间估算
  estimated_days INTEGER,

  -- 位置
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_nodes_project ON nodes(project_id);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);
CREATE INDEX idx_nodes_milestone ON nodes(is_milestone, milestone_date);
```