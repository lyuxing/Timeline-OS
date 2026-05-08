# Timeline OS 版本规划

## 当前版本 v1.0 已完成功能

### 核心功能
- ✅ 项目管理（创建、编辑、删除）
- ✅ 里程碑管理（多层嵌套，最多3层）
- ✅ 时间线可视化（Fishbone布局）
- ✅ 开发地图（项目-里程碑关系图）
- ✅ 本周概览（任务进度跟踪）

### 用户系统
- ✅ 用户注册/登录
- ✅ 团队邀请机制
- ✅ 基于团队的数据隔离
- ✅ JWT认证

---

## 下一版本 v1.1 规划

### 目标：提升可用性和协作体验

#### 功能清单

| 优先级 | 功能 | 预估工时 | 状态 |
|--------|------|----------|------|
| P0 | 项目模板系统 | 3天 | ✅ 已完成 |
| P0 | 导入导出功能 | 2天 | ✅ 已完成 |
| P1 | 多视图切换（甘特图/看板） | 5天 | 待开发 |
| P1 | 任务评论/讨论 | 3天 | 待开发 |
| P1 | 活动日志 | 2天 | 待开发 |
| P2 | 文件附件上传 | 3天 | 待开发 |
| P2 | 邮件通知 | 2天 | 待开发 |
| P2 | 数据统计仪表盘 | 4天 | 待开发 |

---

## 详细功能实现方案

### 1. 项目模板系统 (P0)

#### 功能描述
用户可以创建项目模板，快速复用常见项目结构。

#### 数据模型
```typescript
interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'research' | 'product' | 'competition' | 'personal' | 'custom'
  structure: TemplateNode[]
  createdBy: string
  isPublic: boolean
  createdAt: string
}

interface TemplateNode {
  title: string
  isMilestone: boolean
  estimatedDays?: number
  children?: TemplateNode[]
}
```

#### 预置模板
```yaml
论文撰写模板:
  - 选题确定 (里程碑, 7天)
    - 文献调研 (任务, 14天)
    - 研究方法设计 (任务, 7天)
  - 实验阶段 (里程碑, 30天)
    - 数据收集 (任务, 14天)
    - 数据分析 (任务, 10天)
  - 论文撰写 (里程碑, 21天)
    - 初稿完成 (任务, 14天)
    - 修改提交 (任务, 7天)

产品开发模板:
  - 需求分析 (里程碑, 7天)
  - 设计阶段 (里程碑, 14天)
    - UI设计 (任务, 7天)
    - 技术架构 (任务, 5天)
  - 开发阶段 (里程碑, 30天)
    - 前端开发 (任务, 15天)
    - 后端开发 (任务, 15天)
  - 测试上线 (里程碑, 14天)
```

#### API 设计
```
GET    /api/templates          - 获取模板列表
GET    /api/templates/:id      - 获取模板详情
POST   /api/templates          - 创建自定义模板
DELETE /api/templates/:id      - 删除模板
POST   /api/projects/from-template - 从模板创建项目
```

#### 前端组件
```
TemplateGallery.tsx    - 模板选择界面
TemplatePreview.tsx    - 模板预览
TemplateEditor.tsx     - 自定义模板编辑
```

---

### 2. 导入导出功能 (P0)

#### 功能描述
支持项目数据的导入导出，便于备份和迁移。

#### 导出格式
```json
{
  "version": "1.1",
  "exportedAt": "2026-05-08T10:00:00Z",
  "project": {
    "name": "我的论文",
    "description": "...",
    "status": "growing",
    "nodes": [
      {
        "title": "选题确定",
        "is_milestone": true,
        "start_date": "2026-03-01",
        "milestone_date": "2026-03-07",
        "children": [...]
      }
    ]
  }
}
```

#### API 设计
```
GET  /api/projects/:id/export  - 导出项目(JSON)
GET  /api/projects/:id/export/csv - 导出CSV格式
POST /api/projects/import      - 导入项目
POST /api/projects/bulk-export - 批量导出
```

#### 前端组件
```
ExportModal.tsx    - 导出选项弹窗
ImportModal.tsx    - 导入数据弹窗
```

---

### 3. 多视图切换 (P1)

#### 功能描述
提供甘特图、看板、日历等多种视图模式。

#### 视图类型
```typescript
type ViewMode = 
  | 'timeline'      // 现有的Fishbone时间线
  | 'timeline-edit' // 编辑模式时间线
  | 'gantt'         // 甘特图（传统横向时间线）
  | 'kanban'        // 看板（按状态分类）
  | 'calendar'      // 日历视图
  | 'devmap'        // 开发地图
  | 'weekly'        // 本周概览
```

#### 甘特图实现方案
使用 ReactFlow 或 react-gantt-chart 库：
```typescript
// 甘特图节点
interface GanttNode {
  id: string
  title: string
  start: Date
  end: Date
  progress: number
  dependencies: string[]  // 前置任务
  color: string
}
```

#### 看板实现方案
```typescript
interface KanbanColumn {
  status: 'pending' | 'active' | 'done' | 'blocked'
  title: string
  tasks: KanbanTask[]
}

interface KanbanTask {
  id: string
  title: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  assignee?: string
}
```

#### API 设计
```
// 无需新增API，使用现有数据
// 前端根据视图类型重新组织展示
```

#### 前端组件
```
ViewSwitcher.tsx      - 视图切换器
GanttChart.tsx        - 甘特图组件
KanbanBoard.tsx       - 看板组件
CalendarView.tsx      - 日历组件
```

---

### 4. 任务评论/讨论 (P1)

#### 功能描述
为每个里程碑/任务添加评论功能，记录讨论和决策。

#### 数据模型
```typescript
interface Comment {
  id: string
  nodeId: string      // 关联的节点ID
  userId: string
  content: string
  mentions: string[]  // @提及的用户
  attachments: string[] // 附件文件ID
  createdAt: string
  updatedAt: string
}
```

#### 数据库表
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  mentions TEXT,      -- JSON数组
  attachments TEXT,   -- JSON数组
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_node ON comments(node_id);
```

#### API 设计
```
GET    /api/nodes/:id/comments       - 获取节点评论列表
POST   /api/nodes/:id/comments       - 添加评论
PUT    /api/comments/:id             - 编辑评论
DELETE /api/comments/:id             - 删除评论
```

#### 前端组件
```
CommentSection.tsx    - 评论区域
CommentItem.tsx       - 单条评论
CommentEditor.tsx     - 评论编辑器（支持@提及）
```

---

### 5. 活动日志 (P1)

#### 功能描述
记录项目中所有重要操作，便于追溯和审计。

#### 数据模型
```typescript
interface ActivityLog {
  id: string
  projectId: string
  userId: string
  action: ActivityAction
  targetId: string     // 操作对象ID
  targetType: 'project' | 'node' | 'comment'
  details: object      // 操作详情
  createdAt: string
}

type ActivityAction = 
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'milestone_added'
  | 'milestone_completed'
  | 'task_started'
  | 'comment_added'
  | 'member_invited'
```

#### 数据库表
```sql
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  details TEXT,       -- JSON对象
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_project ON activity_logs(project_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
```

#### API 设计
```
GET /api/projects/:id/activities - 获取项目活动日志
GET /api/activities/recent       - 获取用户最近活动
```

#### 前端组件
```
ActivityLog.tsx       - 活动日志列表
ActivityTimeline.tsx  - 活动时间线展示
```

---

### 6. 文件附件上传 (P2)

#### 功能描述
支持上传文件附件到任务/评论中。

#### 数据模型
```typescript
interface Attachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string         // 存储路径
  uploadedBy: string
  nodeId?: string      // 关联节点
  commentId?: string   // 关联评论
  createdAt: string
}
```

#### 存储方案
```yaml
本地存储模式（默认）:
  目录: backend/data/uploads/
  结构: uploads/{year}/{month}/{uuid}.{ext}

云存储模式（可选）:
  - AWS S3
  - 阿里云OSS
  - MinIO（私有部署）
```

#### API 设计
```
POST   /api/uploads           - 上传文件
GET    /api/uploads/:id       - 获取文件信息
GET    /api/uploads/:id/download - 下载文件
DELETE /api/uploads/:id       - 删除文件
```

#### 前端组件
```
FileUploader.tsx      - 文件上传组件
AttachmentList.tsx    - 附件列表
```

---

### 7. 邮件通知 (P2)

#### 功能描述
发送邮件通知用户重要事件。

#### 通知场景
```yaml
里程碑即将到期: 
  - 提前3天提醒
  - 提前1天提醒
  - 当天提醒

团队协作:
  - 新成员加入团队
  - 被@提及
  - 任务被分配

周报:
  - 每周一发送本周任务概览
```

#### 实现方案
```typescript
// 使用 nodemailer 或第三方服务
interface EmailConfig {
  service: 'smtp' | 'sendgrid' | 'mailgun' | 'aliyun'
  host?: string
  port?: number
  user?: string
  password?: string
  apiKey?: string
}

// 邮件模板
interface EmailTemplate {
  subject: string
  html: string
  variables: object
}
```

#### API 设计
```
POST /api/notifications/settings - 配置通知偏好
GET  /api/notifications/settings - 获取通知配置
```

---

### 8. 数据统计仪表盘 (P2)

#### 功能描述
提供项目数据的可视化统计分析。

#### 统计指标
```yaml
项目健康度:
  - 完成率: 已完成里程碑/总里程碑
  - 延期率: 延期里程碑/总里程碑
  - 进度偏差: 实际进度 vs 计划进度

效率分析:
  - 平均完成时间
  - 里程碑准时率
  - 任务完成趋势

工作量统计:
  - 本周完成任务数
  - 本月完成任务数
  - 各项目工作量分布
```

#### 图表类型
```typescript
// 使用 recharts 或 chart.js
- 饼图：项目状态分布
- 折线图：完成趋势
- 柱状图：工作量对比
- 进度条：单项目进度
```

#### 前端组件
```
Dashboard.tsx         - 仪表盘主页
ProjectHealthCard.tsx - 项目健康度卡片
ProgressChart.tsx     - 进度图表
WorkloadChart.tsx     - 工作量图表
```

---

## 技术改进计划

### 数据库迁移
```yaml
当前: SQLite (单文件)
目标: PostgreSQL (多用户高并发)

迁移步骤:
1. 添加 PostgreSQL 支持
2. 数据迁移脚本
3. 支持两种数据库模式（开发/生产）
```

### API 改进
```yaml
当前: REST API
目标: REST + GraphQL（可选）

改进点:
- 统一错误处理
- 分页支持
- 缓存策略
- Rate Limiting
```

### 前端优化
```yaml
性能:
- 虚拟滚动（大列表）
- 懒加载组件
- 缓存策略

体验:
- 键盘快捷键
- 拖拽排序
- 深色模式
- 移动端适配
```

---

## 开发排期建议

### Week 1-2: 核心功能
- Day 1-3: 项目模板系统
- Day 4-5: 导入导出功能
- Day 6-10: 多视图切换（甘特图）

### Week 3-4: 协作功能
- Day 11-13: 任务评论系统
- Day 14-15: 活动日志
- Day 16-18: 文件附件上传

### Week 5-6: 增强功能
- Day 19-20: 邮件通知
- Day 21-24: 数据统计仪表盘
- Day 25-26: 文档完善
- Day 27-28: 测试与修复

---

## 文档完善计划

### README.md 结构
```markdown
# Timeline OS

## 简介
## 功能特性
## 快速开始
  - 安装
  - 配置
  - 运行
## 使用指南
  - 创建项目
  - 管理里程碑
  - 本周概览
## API 文档
## 贡献指南
## 更新日志
## 许可证
```

### 文档目录
```
docs/
├── getting-started.md      - 快速开始
├── user-guide.md           - 用户指南
├── api-reference.md        - API参考
├── architecture.md         - 架构设计
├── contributing.md         - 贡献指南
├── changelog.md            - 更新日志
└── roadmap.md              - 版本规划
```

---

## 下一步行动

1. **立即开始**：项目模板系统（核心价值）
2. **并行进行**：完善 README 和文档
3. **社区准备**：创建 Discord/Slack 频道
4. **发布准备**：录制 Demo 视频