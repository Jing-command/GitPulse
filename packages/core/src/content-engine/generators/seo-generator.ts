/**
 * SEO 博客生成器
 * 生成 SEO 优化的博客文章
 */

import type { CommitAnalysis, ProjectContext, GeneratedContent } from '../../types';
import { ContentCache } from '../cache';
import { PromptTemplate } from '../prompts/template';

/**
 * SEO 博客生成器类
 * 根据 commit 分析结果生成 SEO 优化的博客文章
 */
export class SEOGenerator {
  // 内容缓存
  private cache: ContentCache;
  // Prompt 模板
  private promptTemplate: PromptTemplate;
  // AI 生成函数
  private generateFn: (prompt: string) => Promise<string>;
  // 默认关键词
  private defaultKeywords: string[];

  /**
   * 构造函数
   * @param generateFn AI 生成函数
   * @param cache 内容缓存实例
   * @param defaultKeywords 默认关键词列表
   */
  constructor(
    generateFn: (prompt: string) => Promise<string>,
    cache?: ContentCache,
    defaultKeywords?: string[]
  ) {
    this.generateFn = generateFn;
    this.cache = cache ?? new ContentCache();
    this.promptTemplate = new PromptTemplate();
    this.defaultKeywords = defaultKeywords ?? [];
  }

  /**
   * 生成 SEO 博客
   * @param commits commit 分析结果列表
   * @param context 项目上下文
   * @param language 目标语言
   * @param customKeywords 自定义关键词
   * @returns 生成的内容
   */
  async generate(
    commits: CommitAnalysis[],
    context: ProjectContext,
    language: string,
    customKeywords?: string[]
  ): Promise<GeneratedContent> {
    // 检查缓存
    const cacheKey = this.cache.generateKey(commits, 'seo', language);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 合并关键词
    const keywords = this.mergeKeywords(commits, customKeywords);

    // 生成提示词
    const prompt = this.promptTemplate.generateSEOPrompt(
      commits,
      context,
      language,
      keywords
    );

    // 调用 AI 生成内容
    const content = await this.generateFn(prompt);

    // 提取 SEO 元数据
    const seoMetadata = this.extractSEOMetadata(content);

    // 构建生成结果
    const result: GeneratedContent = {
      id: this.generateId(),
      type: 'seo',
      title: seoMetadata.title ?? this.extractTitle(content),
      content,
      formats: ['markdown'],
      metadata: {
        commit_hashes: commits.map((c) => c.hash),
        keywords: seoMetadata.keywords ?? keywords,
        author: 'GitPulse',
        seo_score: this.calculateSEOScore(content, keywords),
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
   * 合并关键词
   * @param commits commit 分析结果列表
   * @param customKeywords 自定义关键词
   * @returns 合并后的关键词列表
   */
  private mergeKeywords(
    commits: CommitAnalysis[],
    customKeywords?: string[]
  ): string[] {
    const keywords = new Set<string>();

    // 添加默认关键词
    for (const keyword of this.defaultKeywords) {
      keywords.add(keyword);
    }

    // 添加自定义关键词
    if (customKeywords) {
      for (const keyword of customKeywords) {
        keywords.add(keyword);
      }
    }

    // 从 commits 提取关键词
    for (const commit of commits) {
      for (const keyword of commit.summary.keywords) {
        keywords.add(keyword);
      }
      for (const scope of commit.summary.scope) {
        keywords.add(scope);
      }
    }

    return Array.from(keywords).slice(0, 10);
  }

  /**
   * 提取 SEO 元数据
   * @param content 生成的内容
   * @returns SEO 元数据
   */
  private extractSEOMetadata(content: string): {
    title?: string;
    description?: string;
    keywords?: string[];
  } {
    const result: {
      title?: string;
      description?: string;
      keywords?: string[];
    } = {};

    // 提取 SEO 标题
    const titleMatch = content.match(/\*\*SEO 元数据\*\*[\s\S]*?- 标题：(.+)/);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // 提取 SEO 描述
    const descMatch = content.match(/\*\*SEO 元数据\*\*[\s\S]*?- 描述：(.+)/);
    if (descMatch) {
      result.description = descMatch[1].trim();
    }

    // 提取 SEO 关键词
    const keywordsMatch = content.match(/\*\*SEO 元数据\*\*[\s\S]*?- 关键词：(.+)/);
    if (keywordsMatch) {
      result.keywords = keywordsMatch[1]
        .split(/[,，、]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    return result;
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

    return 'SEO 博客文章';
  }

  /**
   * 计算 SEO 评分
   * @param content 内容
   * @param keywords 目标关键词
   * @returns SEO 评分
   */
  private calculateSEOScore(
    content: string,
    keywords: string[]
  ): { total: number; title: number; content: number; keywords: number; readability: number } {
    let titleScore = 0;
    let contentScore = 0;
    let keywordsScore = 0;
    let readabilityScore = 0;

    // 计算标题评分
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      const title = titleMatch[1];
      // 标题长度检查
      if (title.length >= 10 && title.length <= 60) {
        titleScore += 50;
      }
      // 标题包含关键词
      for (const keyword of keywords) {
        if (title.toLowerCase().includes(keyword.toLowerCase())) {
          titleScore += 50;
          break;
        }
      }
    }

    // 计算内容评分
    const wordCount = content.length;
    if (wordCount >= 800 && wordCount <= 2000) {
      contentScore = 100;
    } else if (wordCount >= 500) {
      contentScore = 70;
    } else {
      contentScore = 40;
    }

    // 计算关键词评分
    const lowerContent = content.toLowerCase();
    let keywordCount = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw.toLowerCase(), 'g');
      const matches = lowerContent.match(regex);
      if (matches) {
        keywordCount += matches.length;
      }
    }
    // 关键词密度检查
    const avgKeywordLength = keywords.length > 0 
      ? keywords.reduce((sum, kw) => sum + kw.length, 0) / keywords.length 
      : 0;
    const density = (keywordCount * avgKeywordLength) / wordCount;
    if (density >= 0.01 && density <= 0.03) {
      keywordsScore = 100;
    } else if (density > 0.03) {
      keywordsScore = 70; // 过度优化
    } else {
      keywordsScore = 50;
    }

    // 计算可读性评分
    const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0);
    const avgParagraphLength = wordCount / Math.max(paragraphs.length, 1);
    if (avgParagraphLength <= 150) {
      readabilityScore = 100;
    } else if (avgParagraphLength <= 200) {
      readabilityScore = 80;
    } else {
      readabilityScore = 60;
    }

    // 计算总分
    const total = Math.round((titleScore + contentScore + keywordsScore + readabilityScore) / 4);

    return {
      total,
      title: titleScore,
      content: contentScore,
      keywords: keywordsScore,
      readability: readabilityScore,
    };
  }

  /**
   * 生成唯一 ID
   * @returns 唯一 ID
   */
  private generateId(): string {
    return `seo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
