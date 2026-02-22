/**
 * Changelog 生成器
 * 生成面向用户的更新日志
 */

import type { CommitAnalysis, ProjectContext, GeneratedContent } from '../../types';
import { ContentCache } from '../cache';
import { PromptTemplate } from '../prompts/template';

/**
 * Changelog 生成器类
 * 根据 commit 分析结果生成用户友好的更新日志
 */
export class ChangelogGenerator {
  // 内容缓存
  private cache: ContentCache;
  // Prompt 模板
  private promptTemplate: PromptTemplate;
  // AI 生成函数（由外部注入）
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
   * 生成 Changelog
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
    const cacheKey = this.cache.generateKey(commits, 'changelog', language);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 生成提示词
    const prompt = this.promptTemplate.generateChangelogPrompt(commits, context, language);

    // 调用 AI 生成内容
    const content = await this.generateFn(prompt);

    // 构建生成结果
    const result: GeneratedContent = {
      id: this.generateId(),
      type: 'changelog',
      title: this.extractTitle(content),
      content,
      formats: ['markdown'],
      metadata: {
        commit_hashes: commits.map((c) => c.hash),
        keywords: this.extractKeywords(commits),
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
   * 生成唯一 ID
   * @returns 唯一 ID
   */
  private generateId(): string {
    return `changelog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 从内容中提取标题
   * @param content 生成的内容
   * @returns 标题
   */
  private extractTitle(content: string): string {
    // 查找第一个 Markdown 标题
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      return match[1];
    }

    // 默认标题
    const date = new Date().toISOString().split('T')[0];
    return `更新日志 - ${date}`;
  }

  /**
   * 从 commits 中提取关键词
   * @param commits commit 分析结果列表
   * @returns 关键词列表
   */
  private extractKeywords(commits: CommitAnalysis[]): string[] {
    const keywords = new Set<string>();

    for (const commit of commits) {
      // 添加变更类型
      keywords.add(commit.summary.type);

      // 添加影响范围
      for (const scope of commit.summary.scope) {
        keywords.add(scope);
      }

      // 添加关键词
      for (const keyword of commit.summary.keywords) {
        keywords.add(keyword);
      }
    }

    return Array.from(keywords).slice(0, 10);
  }
}
