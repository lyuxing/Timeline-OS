# Timeline OS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)

**Timeline OS** 是一个以时间线为核心的项目管理工具，帮助个人和小团队管理多项目进展，从想法到成果的全流程追踪。

## ✨ 核心特性

- 📊 **时间线视图** — Fishbone 风格时间线，清晰展示项目进度
- 🚩 **里程碑管理** — 多层嵌套里程碑（最多3层），追踪关键节点
- 🗺️ **开发地图** — 项目-里程碑关系图，全局视角掌控
- 📋 **本周概览** — 自动汇总正在进行的工作任务
- 👥 **团队协作** — 用户认证、团队邀请、数据隔离
- 🎨 **状态可视化** — 种子→扎根→生长→结果→开花

## 📸 截图

### 时间线视图
![Timeline View](./docs/screenshots/timeline.png)

### 开发地图
![DevMap View](./docs/screenshots/devmap.png)

### 本周概览
![Weekly Summary](./docs/screenshots/weekly.png)

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/lyuxing/Timeline-OS.git
cd Timeline-OS

# 安装后端依赖
cd backend
npm install

# 启动后端（终端1）
npm run dev

# 安装前端依赖（终端2）
cd ../frontend
npm install

# 启动前端
npm run dev
```

访问 http://localhost:3000

### 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 管理员 |
| test | 123456 | 普通用户 |

## 📖 使用指南

### 项目状态流转

```
🌱 seed     → 刚有的想法
🪴 rooting  → 预研/学习中
🌿 growing  → 开发推进中
🍎 fruiting → 已有可交付成果
🌸 blooming → 取得成绩/奖励
🍂 archived → 已归档
```

### 创建项目

1. 在开发地图中点击"+ 新建项目"
2. 输入项目名称，选择关联开发者
3. 点击项目进入时间线编辑

### 管理里程碑

1. 双击时间线空白处添加里程碑
2. 设置里程碑名称、开始日期、截止日期
3. 点击里程碑可添加子任务（花🌸、果🍎、子任务📍）

### 查看本周工作

1. 点击顶部"本周概览"
2. 查看所有正在进行中的任务
3. 了解任务进度和剩余天数

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 状态管理 | Zustand |
| 可视化 | React Flow |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT + bcrypt |

## 📁 项目结构

```
Timeline-OS/
├── backend/
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── storage/      # 数据存储层
│   │   ├── middleware/   # 中间件
│   │   ├── models/       # 类型定义
│   │   └── utils/        # 工具函数
│   └── data/             # SQLite 数据库文件
├── frontend/
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── store/        # Zustand 状态
│   │   └── types/        # TypeScript 类型
│   └── public/
└── docs/                 # 文档
```

## 🔌 API 文档

### 认证

```
POST /api/auth/register   - 注册新用户
POST /api/auth/login      - 登录
GET  /api/auth/me         - 获取当前用户
```

### 项目

```
GET    /api/projects           - 获取项目列表
POST   /api/projects           - 创建项目
GET    /api/projects/:id/tree  - 获取项目树
PATCH  /api/projects/:id       - 更新项目
DELETE /api/projects/:id       - 删除项目
```

### 节点

```
POST   /api/projects/:id/nodes      - 创建节点
PATCH  /api/projects/nodes/:id      - 更新节点
DELETE /api/projects/nodes/:id      - 删除节点
```

### 开发者

```
GET  /api/developers      - 获取开发者列表
POST /api/developers      - 创建开发者
```

## 🗺️ 版本规划

详见 [ROADMAP.md](./ROADMAP.md)

### v1.1 计划功能
- [ ] 项目模板系统
- [ ] 导入导出功能
- [ ] 多视图切换（甘特图/看板）
- [ ] 任务评论/讨论
- [ ] 活动日志
- [ ] 文件附件上传
- [ ] 邮件通知
- [ ] 数据统计仪表盘

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📝 更新日志

### v1.0.0 (2026-05-08)
- ✅ 用户认证系统（注册、登录、团队邀请）
- ✅ 项目管理功能
- ✅ 多层嵌套里程碑
- ✅ Fishbone 时间线视图
- ✅ 开发地图视图
- ✅ 本周概览功能
- ✅ 今日标识（动画小人）

## 📄 许可证

[MIT License](./LICENSE)

## 🙏 致谢

- [React Flow](https://reactflow.dev/) - 强大的流程图库
- [Lucide Icons](https://lucide.dev/) - 优雅的图标库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

---

**Timeline OS** - 让项目管理变得简单直观 🚀