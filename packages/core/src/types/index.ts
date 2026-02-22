/**
 * GitPulse 核心类型定义
 * 定义整个系统使用的核心数据结构
 */

/**
 * Commit 分析结果
 */
export interface CommitAnalysis {
  /** Commit SHA 哈希值 */
  hash: string;
  /** Commit 消息 */
  message: string;
  /** 作者名称 */
  author: string;
  /** 作者邮箱 */
  author_email: string;
  /** 时间戳 */
  timestamp: Date;
  /** 文件变更列表 */
  changes: FileChange[];
  /** 变更摘要 */
  summary: ChangeSummary;
  /** 影响级别 */
  impact_level: 'major' | 'minor' | 'patch';
}

/**
 * 文件变更详情
 */
export interface FileChange {
  /** 文件路径 */
  path: string;
  /** 变更类型 */
  type: 'add' | 'modify' | 'delete' | 'rename';
  /** 编程语言 */
  language: string;
  /** Diff 块列表 */
  hunks: DiffHunk[];
  /** 函数级变更列表 */
  functions: FunctionChange[];
}

/**
 * Diff 块
 */
export interface DiffHunk {
  /** 旧文件起始行 */
  old_start: number;
  /** 旧文件行数 */
  old_lines: number;
  /** 新文件起始行 */
  new_start: number;
  /** 新文件行数 */
  new_lines: number;
  /** 变更内容 */
  content: string;
}

/**
 * 变更摘要
 */
export interface ChangeSummary {
  /** 变更类型 */
  type: 'feature' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore';
  /** 影响范围 */
  scope: string[];
  /** 关键词列表 */
  keywords: string[];
  /** 是否破坏性变更 */
  breaking: boolean;
}

/**
 * 函数级变更
 */
export interface FunctionChange {
  /** 函数名称 */
  name: string;
  /** 变更类型 */
  type: 'add' | 'modify' | 'delete';
  /** 函数签名 */
  signature?: string;
  /** 函数描述（从注释提取） */
  description?: string;
  /** 代码片段 */
  code_snippet?: string;
}

/**
 * 项目上下文
 */
export interface ProjectContext {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description: string;
  /** 项目类型 */
  type: ProjectType;
  /** 技术栈 */
  tech_stack: TechStack;
  /** 术语表 */
  terminology: Map<string, string>;
  /** 风格指南 */
  style_guide: StyleGuide;
  /** 目录结构 */
  structure: DirectoryTree;
}

/**
 * 项目类型
 */
export type ProjectType =
  | 'web-app'
  | 'library'
  | 'cli-tool'
  | 'api-service'
  | 'mobile-app'
  | 'desktop-app';

/**
 * 技术栈
 */
export interface TechStack {
  /** 编程语言列表 */
  language: string[];
  /** 框架列表 */
  frameworks: string[];
  /** 工具列表 */
  tools: string[];
  /** 依赖列表 */
  dependencies: Dependency[];
}

/**
 * 依赖项
 */
export interface Dependency {
  /** 依赖名称 */
  name: string;
  /** 版本号 */
  version: string;
  /** 依赖类型 */
  type: 'production' | 'development' | 'peer';
}

/**
 * 风格指南
 */
export interface StyleGuide {
  /** 语调风格 */
  tone: 'formal' | 'casual' | 'technical';
  /** 主要语言 */
  language: string;
  /** 代码风格 */
  code_style: string;
  /** 示例文档列表 */
  examples: string[];
}

/**
 * 目录树节点
 */
export interface DirectoryTree {
  /** 节点名称 */
  name: string;
  /** 节点类型 */
  type: 'file' | 'directory';
  /** 子节点 */
  children?: DirectoryTree[];
  /** 文件路径 */
  path: string;
}

/**
 * 内容类型
 */
export type ContentType = 'changelog' | 'technical' | 'seo';

/**
 * 内容状态
 */
export type ContentStatus = 'draft' | 'pending' | 'approved' | 'published';

/**
 * 生成内容
 */
export interface GeneratedContent {
  /** 内容 ID */
  id: string;
  /** 内容类型 */
  type: ContentType;
  /** 标题 */
  title: string;
  /** 内容正文 */
  content: string;
  /** 输出格式 */
  formats: OutputFormat[];
  /** 元数据 */
  metadata: ContentMetadata;
  /** 语言 */
  language: string;
  /** 状态 */
  status: ContentStatus;
  /** 创建时间 */
  created_at: Date;
  /** 更新时间 */
  updated_at: Date;
}

/**
 * 输出格式
 */
export type OutputFormat = 'markdown' | 'json' | 'html' | 'pdf';

/**
 * 内容元数据
 */
export interface ContentMetadata {
  /** 关联的 commit 哈希列表 */
  commit_hashes: string[];
  /** 关键词列表 */
  keywords: string[];
  /** SEO 评分 */
  seo_score?: SEOScore;
  /** 作者 */
  author: string;
  /** 版本号 */
  version?: string;
}

/**
 * SEO 分析结果
 */
export interface SEOAnalysis {
  /** 关键词列表 */
  keywords: KeywordInfo[];
  /** SEO 评分 */
  score: SEOScore;
  /** 优化建议 */
  suggestions: string[];
}

/**
 * 关键词信息
 */
export interface KeywordInfo {
  /** 关键词 */
  keyword: string;
  /** 出现频率 */
  frequency: number;
  /** 密度 */
  density: number;
  /** 出现位置列表 */
  positions: string[];
}

/**
 * SEO 评分
 */
export interface SEOScore {
  /** 总分 (0-100) */
  total: number;
  /** 标题评分 */
  title: number;
  /** 内容评分 */
  content: number;
  /** 关键词评分 */
  keywords: number;
  /** 可读性评分 */
  readability: number;
}

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'editor' | 'viewer';

/**
 * 用户信息
 */
export interface User {
  /** 用户 ID */
  id: string;
  /** 邮箱 */
  email: string;
  /** 名称 */
  name: string;
  /** 角色 */
  role: UserRole;
  /** OAuth 提供商 */
  oauth_provider?: string;
  /** OAuth 用户 ID */
  oauth_id?: string;
  /** 创建时间 */
  created_at: Date;
}

/**
 * 内容版本
 */
export interface ContentVersion {
  /** 版本 ID */
  id: string;
  /** 内容 ID */
  content_id: string;
  /** 版本号 */
  version: number;
  /** 内容正文 */
  content: string;
  /** 作者 */
  author: User;
  /** 创建时间 */
  created_at: Date;
  /** 变更日志 */
  change_log?: string;
}

/**
 * 审批记录
 */
export interface ApprovalRecord {
  /** 审批 ID */
  id: string;
  /** 内容 ID */
  content_id: string;
  /** 审批状态 */
  status: 'pending' | 'approved' | 'rejected';
  /** 审批人 */
  reviewer: User;
  /** 审批意见 */
  comment?: string;
  /** 创建时间 */
  created_at: Date;
}

/**
 * AI 服务配置
 */
export interface AIConfig {
  /** 服务商 */
  provider: 'openai' | 'anthropic' | 'ollama';
  /** 模型名称 */
  model: string;
  /** API 密钥 */
  api_key?: string;
  /** API 基础 URL */
  base_url?: string;
  /** 降级配置 */
  fallback?: AIConfig;
}

/**
 * 生成选项
 */
export interface GenerateOptions {
  /** 内容类型 */
  type: ContentType;
  /** 目标语言 */
  language: string;
  /** 输出格式 */
  formats: OutputFormat[];
  /** 是否启用 SEO 优化 */
  seo_optimized: boolean;
  /** 自定义提示词 */
  custom_prompt?: string;
}

/**
 * 文档同步配置
 */
export interface DocSyncConfig {
  /** 文档框架 */
  framework: 'vitepress';
  /** 输出目录 */
  output_dir: string;
  /** 侧边栏配置文件 */
  sidebar_file: string;
  /** 文档模板 */
  template: string;
  /** 命名规则 */
  naming: NamingConvention;
}

/**
 * 命名规则
 */
export interface NamingConvention {
  /** 文件命名模式 */
  file_pattern: string;
  /** 目录命名模式 */
  directory_pattern: string;
  /** 是否使用日期前缀 */
  date_prefix: boolean;
}

/**
 * 侧边栏配置
 */
export interface SidebarConfig {
  /** 侧边栏项列表 */
  items: SidebarItem[];
  /** 分组列表 */
  groups: SidebarGroup[];
}

/**
 * 侧边栏项
 */
export interface SidebarItem {
  /** 显示文本 */
  text: string;
  /** 链接路径 */
  link: string;
  /** 是否折叠 */
  collapsed?: boolean;
}

/**
 * 侧边栏分组
 */
export interface SidebarGroup {
  /** 分组文本 */
  text: string;
  /** 是否折叠 */
  collapsed?: boolean;
  /** 子项列表 */
  items: SidebarItem[];
}
