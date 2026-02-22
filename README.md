# 🚀 GitPulse

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Prisma-5.0-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker" alt="Docker" />
</p>

<p align="center">
  <b>技术内容全自动流水线</b> | 让每一次代码提交都变成高质量的技术文档
</p>

---

## ✨ 核心功能

### 🔄 智能 Commit 分析
- **多语言支持**: JavaScript/TypeScript、Python、Go、Rust 等主流语言
- **AST 深度解析**: 不只是看 diff，而是理解代码语义变化
- **智能分类**: 自动识别新功能、Bug 修复、性能优化、重构等类型

### 🤖 AI 内容生成
- **更新日志**: 基于 Commit 自动生成版本发布说明
- **技术博客**: 将代码变更转化为易懂的技术文章
- **SEO 优化**: 自动生成关键词优化的内容，提升搜索引擎排名

### 📝 内容管理
- **可视化编辑器**: 支持 Markdown 和富文本编辑
- **版本控制**: 内容版本历史追踪，随时回滚
- **审批流程**: 团队协作审核，确保内容质量

### 🌐 多端发布
- **GitHub Pages**: 一键部署静态站点
- **VitePress**: 自动生成文档站点
- **多平台适配**: 支持多种静态站点生成器

---

## 🎯 为什么选择 GitPulse?

| 特性 | GitPulse | 传统方式 |
|------|----------|----------|
| 文档生成 | 🤖 AI 自动生成 | ✍️ 手动编写 |
| 更新频率 | 🔄 每次提交自动更新 | ⏰ 依赖人工 |
| 内容质量 | ✅ 结构化、标准化 | 📋 参差不齐 |
| 团队协作 | 👥 内置审批流程 | 📧 邮件/文档来回 |
| SEO 优化 | 🚀 自动生成关键词 | ❌ 常被忽略 |

---

## 🚀 快速开始

### 环境要求
- Node.js >= 20
- pnpm >= 8
- Docker & Docker Compose

### 1. 克隆项目

```bash
git clone https://github.com/Jing-command/GitPulse.git
cd GitPulse
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动服务

```bash
# 启动数据库（PostgreSQL + Redis）
docker-compose -f docker/docker-compose.yml up -d

# 启动后端 API
pnpm --filter @gitpulse/api dev

# 启动前端（新终端）
pnpm --filter @gitpulse/web dev
```

### 4. 访问应用

- 🌐 Web 界面: http://localhost:3000
- 🔌 API 服务: http://localhost:3002

---

## 📁 项目结构

```
GitPulse/
├── 📦 packages/
│   ├── 🖥️ web/              # React + TypeScript 前端
│   ├── ⚙️ api/              # Express + Prisma 后端 API
│   ├── 🔧 core/             # 核心引擎（AI、解析、生成）
│   ├── 🖥️ cli/              # 命令行工具
│   └── 🔄 github-action/    # GitHub Actions 集成
├── 🐳 docker/               # Docker 配置文件
├── 🧪 tests/                # E2E 测试套件
└── 📚 docs/                 # 项目文档
```

---

## 🛠️ 技术栈

### 前端
- **React 18** + **TypeScript** - 现代化 UI 开发
- **Vite** - 极速构建工具
- **Tailwind CSS** - 原子化 CSS 框架
- **Zustand** - 轻量级状态管理

### 后端
- **Express.js** - Web 框架
- **Prisma** - 类型安全的数据库 ORM
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存与会话存储

### AI & 解析
- **OpenAI/Claude API** - 大语言模型集成
- **Babel Parser** - JavaScript/TypeScript AST 解析
- **Tree-sitter** - 多语言代码解析

---

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行 E2E 测试
cd tests
node run-all.js
```

---

## 📸 界面预览

### 仪表板
<p align="center">
  <img src="https://via.placeholder.com/800x400/3b82f6/ffffff?text=Dashboard+Preview" alt="Dashboard" />
</p>

### 项目管理
<p align="center">
  <img src="https://via.placeholder.com/800x400/10b981/ffffff?text=Projects+Preview" alt="Projects" />
</p>

### 内容编辑
<p align="center">
  <img src="https://via.placeholder.com/800x400/f59e0b/ffffff?text=Content+Editor" alt="Content Editor" />
</p>

---

## 🗺️ 路线图

- [x] 基础架构搭建
- [x] Commit 解析引擎
- [x] AI 内容生成
- [x] Web 管理界面
- [ ] GitHub Actions 集成
- [ ] GitLab CI 支持
- [ ] 更多 AI 提供商
- [ ] 插件系统
- [ ] 移动端 App

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证开源。

---

## 💬 联系我们

- 📧 Email: your.email@example.com
- 💬 Issues: [GitHub Issues](https://github.com/Jing-command/GitPulse/issues)
- 🌐 官网: https://gitpulse.dev (即将上线)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Jing-command">Jing-command</a>
</p>

<p align="center">
  ⭐ Star 我们，让更多人发现 GitPulse！
</p>
