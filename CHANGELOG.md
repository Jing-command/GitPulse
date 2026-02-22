# 更新日志

所有重要的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2024-01-01

### 新增

- ✨ **核心引擎**
  - Git Diff 解析器，支持多语言代码变更分析
  - AST 分析器，支持 JS/TS/Python 函数级变更检测
  - 变更分类器，自动识别 feature/fix/refactor 等类型
  - 影响级别评估，自动计算 major/minor/patch

- ✨ **内容生成**
  - 更新日志生成器 (Changelog Generator)
  - 技术博客生成器 (Technical Blog Generator)
  - SEO 文章生成器 (SEO Article Generator)
  - 多语言支持（中英文）
  - 内容缓存机制

- ✨ **AI 服务**
  - OpenAI GPT-4 支持
  - Anthropic Claude 支持
  - Ollama 本地模型支持
  - 智能降级策略

- ✨ **上下文感知**
  - package.json 解析
  - README 解析
  - 项目结构分析
  - 术语库构建

- ✨ **文档同步**
  - VitePress 适配器
  - 侧边栏自动更新
  - 多格式输出支持

- ✨ **SEO 模块**
  - 关键词提取
  - SEO 评分算法
  - 内容优化建议

- ✨ **CLI 工具**
  - `gitpulse init` - 初始化项目配置
  - `gitpulse analyze` - 分析 Git commits
  - `gitpulse generate` - 生成内容
  - `gitpulse sync` - 同步到文档站点
  - `gitpulse run` - 一键运行完整流程
  - `gitpulse status` - 查看项目状态
  - `gitpulse config` - 管理配置项
  - `gitpulse server` - 启动 Web 服务

- ✨ **Web 管理界面**
  - 用户认证（登录/注册）
  - 项目管理（CRUD）
  - 内容管理（列表/编辑/审核）
  - 团队管理（成员/角色）
  - 系统设置

- ✨ **API 服务**
  - RESTful API 接口
  - JWT 认证
  - 请求限流
  - 错误处理

- ✨ **GitHub Action**
  - 自动分析 commits
  - 自动生成文档
  - 自动提交变更

- ✨ **Docker 支持**
  - Dockerfile 多阶段构建
  - Docker Compose 配置
  - PostgreSQL 支持

### 技术栈

- TypeScript 5.3
- Node.js 18+
- React 18
- Vite 5
- Tailwind CSS 3
- Express 4
- Prisma 5
- PostgreSQL 15

---

## 版本规划

### [1.1.0] - 计划中

- 🔮 GitLab 集成
- 🔮 Bitbucket 集成
- 🔮 更多 AI 模型支持
- 🔮 自定义模板系统
- 🔮 多项目管理

### [1.2.0] - 计划中

- 🔮 实时协作编辑
- 🔮 版本历史对比
- 🔮 高级搜索功能
- 🔮 API Webhook 支持

---

[1.0.0]: https://github.com/your-org/gitpulse/releases/tag/v1.0.0
