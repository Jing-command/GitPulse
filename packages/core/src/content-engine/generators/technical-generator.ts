/**
 * 技术博客生成器
 * 生成面向开发者的技术博客文章
 */

import type { CommitAnalysis, ProjectContext, GeneratedContent } from '../../types';
import { ContentCache } from '../cache';
import { PromptTemplate } from '../prompts/template';

/**
 * 技术博客生成器类
 * 根据 commit 分析结果生成深入的技术博客文章
 */
export class TechnicalGenerator {
  // 内容缓存
  private cache: ContentCache;
  // Prompt 模板
  private promptTemplate: PromptTemplate;
  // AI 生成函数
  private generateFn: (prompt: string) => Promise<string>;

  /**
   * 构造函数
   * @param generateFn AI 生成函数
   * @param cache 内容缓存实例
   */
  constructor(generateFn: (prompt: string) => Promise<string>, cache?: ContentCache) {
    this.generateFn = generateFn;
    this.cache = cache ?? new ContentCache();
    this.promptTemplate = new PromptTemplate();
  }

  /**
   * 生成技术博客
   * @param commits commit 分析结果列表
   * @param context 项目上下文
   * @param language 目标语言
   * @returns 生成的内容
   */
  async generate(
    commits: CommitAnalysis[],
    context: ProjectContext,
    language: string
  ): Promise<GeneratedContent> {
    // 检查缓存
    const cacheKey = this.cache.generateKey(commits, 'technical', language);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 过滤有技术价值的 commits
    const technicalCommits = this.filterTechnicalCommits(commits);

    // 如果没有技术性变更，返回空内容
    if (technicalCommits.length === 0) {
      return this.createEmptyContent(language);
    }

    // 生成提示词
    const prompt = this.promptTemplate.generateTechnicalPrompt(
      technicalCommits,
      context,
      language
    );

    // 调用 AI 生成内容
    const content = await this.generateFn(prompt);

    // 构建生成结果
    const result: GeneratedContent = {
      id: this.generateId(),
      type: 'technical',
      title: this.extractTitle(content),
      content,
      formats: ['markdown'],
      metadata: {
        commit_hashes: technicalCommits.map((c) => c.hash),
        keywords: this.extractTechnicalKeywords(technicalCommits),
        author: 'GitPulse',
      },
      language,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // 缓存结果
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * 过滤有技术价值的 commits
   * @param commits commit 分析结果列表
   * @returns 过滤后的 commits
   */
  private filterTechnicalCommits(commits: CommitAnalysis[]): CommitAnalysis[] {
    return commits.filter((commit) => {
      // 排除纯文档和测试变更
      if (commit.summary.type === 'docs' || commit.summary.type === 'test') {
        return false;
      }

      // 排除纯 chore 变更
      if (commit.summary.type === 'chore' && commit.changes.length < 3) {
        return false;
      }

      // 包含有函数级变更的 commit
      const hasFunctionChanges = commit.changes.some((c) => c.functions.length > 0);
      if (hasFunctionChanges) {
        return true;
      }

      // 包含核心文件变更的 commit
      const hasCoreChanges = commit.changes.some((c) =>
        c.path.includes('src/') || c.path.includes('lib/')
      );

      return hasCoreChanges;
    });
  }

  /**
   * 创建空内容
   * @param language 语言
   * @returns 空内容对象
   */
  private createEmptyContent(language: string): GeneratedContent {
    return {
      id: this.generateId(),
      type: 'technical',
      title: '暂无技术更新',
      content: '本次更新没有需要撰写技术博客的变更。',
      formats: ['markdown'],
      metadata: {
        commit_hashes: [],
        keywords: [],
        author: 'GitPulse',
      },
      language,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * 生成唯一 ID
   * @returns 唯一 ID
   */
  private generateId(): string {
    return `technical-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 从内容中提取标题
   * @param content 生成的内容
   * @returns 标题
   */
  private extractTitle(content: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      return match[1];
    }

    return '技术更新博客';
  }

  /**
   * 提取技术关键词
   * @param commits commit 分析结果列表
   * @returns 关键词列表
   */
  private extractTechnicalKeywords(commits: CommitAnalysis[]): string[] {
    const keywords = new Set<string>();

    for (const commit of commits) {
      // 添加函数名作为关键词
      for (const change of commit.changes) {
        for (const fn of change.functions) {
          keywords.add(fn.name);
        }
      }

      // 添加编程语言
      for (const change of commit.changes) {
        if (change.language !== 'unknown') {
          keywords.add(change.language);
        }
      }

      // 添加原始关键词
      for (const keyword of commit.summary.keywords) {
        keywords.add(keyword);
      }
    }

    return Array.from(keywords).slice(0, 15);
  }
}
