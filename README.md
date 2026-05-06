# Timeline OS

一个以时间线为核心的项目管理工具，帮助个人开发者管理多项目进展。

## 核心特性

- 📊 **时间线视图** — 所有项目一目了然，自动生成甘特图
- 🚩 **里程碑管理** — 标记关键节点，追踪重要日期
- 🌳 **项目树** — 点击项目展开树形结构，自由添加分支
- 🎨 **状态可视化** — 种子→扎根→生长→结果→开花

## 快速开始

```bash
# 安装后端依赖
cd backend
npm install

# 启动后端
npm run dev

# 安装前端依赖（另一个终端）
cd frontend
npm install

# 启动前端
npm run dev
```

访问 http://localhost:3000

## 产品形态

```
┌─────────────────────────────────────────────────────────────────┐
│  主视图：时间线                                                  │
│                                                                 │
│  项目A  🌱  ├──────────────┤        🚩 MVP发布 (3/15)          │
│  项目B  🌿       ├────────────────┤🚩 上线 (4/1)               │
│  项目C  🍎            ├────────────┤                           │
│                                                                 │
│  点击项目 → 右侧展开项目树                                       │
│                                                                 │
│                    🌳 项目B                                      │
│                         │                                       │
│              ┌──────────┴──────────┐                           │
│          🍎 支付功能           🍎 用户系统                      │
│              │                     │                           │
│          🌿 前端              🌿 后端API                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 项目状态流转

```
🌱 seed     → 刚有的想法
🪴 rooting  → 预研/学习中
🌿 growing  → 开发推进中
🍎 fruiting → 已有可交付成果
🌸 blooming → 取得成绩/奖励
🍂 archived → 已归档
```

## API

### 项目
- `GET /api/projects` — 获取项目列表
- `POST /api/projects` — 创建项目
- `GET /api/projects/:id/tree` — 获取项目树
- `PATCH /api/projects/:id` — 更新项目
- `DELETE /api/projects/:id` — 删除项目

### 节点
- `POST /api/projects/:id/nodes` — 创建节点
- `PATCH /api/projects/nodes/:id` — 更新节点
- `DELETE /api/projects/nodes/:id` — 删除节点

## 技术栈

- **前端**: React + TypeScript + React Flow + Zustand
- **后端**: Node.js + Express + SQLite
- **可视化**: React Flow (树形图)

## 后续规划

- [ ] 智能体建议（LLM 集成）
- [ ] 每日/每周提醒
- [ ] 自进化记忆系统
- [ ] 数据导出/备份