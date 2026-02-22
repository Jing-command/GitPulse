# GitPulse

<div align="center">

**技术内容全自动流水线**

深度解析 Git 代码变更，自动生成更新日志、技术博客和文档

[![npm version](https://img.shields.io/npm/v/gitpulse.svg)](https://www.npmjs.com/package/gitpulse)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

[English](./README_EN.md) | 简体中文

</div>

---

## ✨ 功能特性

### 🔍 智能代码分析

- **Git Diff 解析** - 精准解析代码变更，支持多语言
- **AST 分析** - 函数级变更检测，支持 JS/TS/Python
- **变更分类** - 自动识别 feature/fix/refactor 等类型
- **影响评估** - 自动计算 major/minor/patch 版本影响

### 📝 多角色内容生成

- **更新日志 (Changelog)** - 自动生成版本更新日志
- **技术博客 (Technical Blog)** - 深度技术文章生成
- **SEO 文章** - 搜索引擎优化文章生成
- **多语言支持** - 支持中英文内容生成

### 🤖 AI 驱动

- **多服务商支持** - OpenAI、Anthropic、Ollama
- **智能降级** - 主服务不可用时自动切换
- **缓存机制** - 相同输入不重复调用 AI

### 📚 文档同步

- **VitePress 集成** - 自动同步到 VitePress 文档站点
- **侧边栏管理** - 自动更新文档导航
- **多格式输出** - 支持 Markdown、JSON 等格式

---

## 📦 安装

### NPM 全局安装

```bash
npm install -g gitpulse
```

### 使用 pnpm

```bash
pnpm add -g gitpulse
```

### 从源码构建

```bash
git clone https://github.com/your-org/gitpulse.git
cd gitpulse
pnpm install
pnpm build
```

---

## 🚀 快速开始

### 1. 初始化项目

```bash
# 在项目根目录运行
gitpulse init
```

这将创建一个 `.gitpulserc.yaml` 配置文件，引导您完成配置。

### 2. 配置 AI 服务

编辑 `.gitpulserc.yaml`，配置您的 AI 服务：

```yaml
ai:
  provider: openai
  model: gpt-4-turbo-preview
  api_key: ${OPENAI_API_KEY}  # 从环境变量读取
```

### 3. 分析代码变更

```bash
# 分析最近 10 个 commits
gitpulse analyze --from HEAD~10 --to HEAD

# 增量分析（仅分析未处理的 commits）
gitpulse analyze --incremental
```

### 4. 生成内容

```bash
# 生成所有类型内容
gitpulse generate --type all

# 仅生成更新日志
gitpulse generate --type changelog --language zh
```

### 5. 同步到文档站点

```bash
# 同步到 VitePress
gitpulse sync
```

### 6. 一键运行完整流程

```bash
# 执行分析 -> 生成 -> 同步完整流程
gitpulse run --from HEAD~5 --to HEAD
```

---

## 📖 CLI 命令

| 命令 | 描述 |
|------|------|
| `gitpulse init` | 初始化项目配置 |
| `gitpulse analyze` | 分析 Git commits |
| `gitpulse generate` | 生成内容 |
| `gitpulse sync` | 同步到文档站点 |
| `gitpulse run` | 一键运行完整流程 |
| `gitpulse status` | 查看项目状态 |
| `gitpulse config` | 管理配置项 |
| `gitpulse server` | 启动 Web 服务 |

---

## ⚙️ 配置说明

### 完整配置示例

```yaml
# 项目信息
project:
  name: my-project
  description: 我的项目描述

# Git 配置
git:
  repo: .
  branch: main
  platforms:
    - github

# AI 配置
ai:
  provider: openai          # openai | anthropic | ollama
  model: gpt-4-turbo-preview
  api_key: ${OPENAI_API_KEY}

# 内容配置
content:
  languages:
    - zh
    - en
  changelog:
    enabled: true
    output: ./docs/changelog
  technical:
    enabled: true
    output: ./docs/blog
  seo:
    enabled: true
    keywords:
      - 技术
      - 开发
  formats:
    - markdown

# 文档配置
docs:
  framework: vitepress
  output: ./docs
  sidebar: ./docs/.vitepress/sidebar.ts

# 上下文感知
context:
  read_package: true
  read_readme: true
  analyze_structure: true

# 审核流程
review:
  enabled: true
  auto_publish: false

# 预览配置
preview:
  enabled: true
  port: 3000
```

---

## 🏗️ 项目结构

```
GitPulse/
├── packages/
│   ├── core/           # 核心引擎
│   │   ├── diff-analyzer/    # Diff 分析
│   │   ├── content-engine/   # 内容生成
│   │   ├── context-reader/   # 上下文感知
│   │   ├── doc-sync/         # 文档同步
│   │   ├── seo/              # SEO 模块
│   │   └── ai/               # AI 服务
│   ├── cli/            # 命令行工具
│   ├── web/            # Web 管理界面
│   ├── api/            # REST API 服务
│   └── github-action/  # GitHub Action
├── docker/             # Docker 配置
└── docs/               # 文档
```

---

## 🔧 开发指南

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 15（可选，用于数据持久化）

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动 Web 开发服务
pnpm --filter @gitpulse/web dev

# 启动 API 服务
pnpm --filter @gitpulse/api dev

# 构建
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck
```

### 数据库配置

```bash
# 复制环境配置
cp packages/core/.env.example packages/core/.env

# 运行数据库迁移
pnpm --filter @gitpulse/core db:migrate

# 生成 Prisma 客户端
pnpm --filter @gitpulse/core db:generate
```

---

## 🐳 Docker 部署

```bash
# 使用 Docker Compose 启动
cd docker
docker-compose up -d
```

---

## 📄 API 文档

API 服务提供 RESTful 接口，遵循腾讯 RESTful API 设计规范。

### 基础 URL

```
http://localhost:3001/api/v1
```

### 主要接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/auth/login` | 用户登录 |
| POST | `/auth/register` | 用户注册 |
| GET | `/projects` | 项目列表 |
| POST | `/projects` | 创建项目 |
| GET | `/contents` | 内容列表 |
| POST | `/contents` | 创建内容 |
| GET | `/commits` | Commit 列表 |

### 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "request_id": "abc123",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🤝 贡献指南

欢迎贡献代码！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

---

## 📜 许可证

[MIT License](./LICENSE)

---

## 🙏 致谢

- [OpenAI](https://openai.com/) - GPT 模型
- [Anthropic](https://www.anthropic.com/) - Claude 模型
- [VitePress](https://vitepress.dev/) - 文档框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
