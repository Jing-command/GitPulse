/**
 * SEO 评分器
 * 对内容进行 SEO 质量评分
 */

import type { SEOScore, SEOAnalysis, KeywordInfo } from '../types';
import { KeywordExtractor } from './keywords';

/**
 * SEO 评分器类
 * 对内容进行多维度的 SEO 质量评估
 */
export class SEOScorer {
  // 关键词提取器
  private keywordExtractor: KeywordExtractor;

  /**
   * 构造函数
   */
  constructor() {
    this.keywordExtractor = new KeywordExtractor();
  }

  /**
   * 分析内容的 SEO 质量
   * @param content 内容文本
   * @param targetKeywords 目标关键词列表
   * @returns SEO 分析结果
   */
  analyze(content: string, targetKeywords?: string[]): SEOAnalysis {
    // 提取关键词
    const keywords = this.keywordExtractor.extract(content, 15);

    // 计算各维度评分
    const titleScore = this.scoreTitle(content);
    const contentScore = this.scoreContent(content);
    const keywordsScore = this.scoreKeywords(content, keywords, targetKeywords);
    const readabilityScore = this.scoreReadability(content);

    // 计算总分
    const total = Math.round(
      (titleScore * 0.2 + contentScore * 0.3 + keywordsScore * 0.3 + readabilityScore * 0.2)
    );

    const score: SEOScore = {
      total,
      title: titleScore,
      content: contentScore,
      keywords: keywordsScore,
      readability: readabilityScore,
    };

    // 生成优化建议
    const suggestions = this.generateSuggestions(score, content, keywords, targetKeywords);

    return {
      keywords,
      score,
      suggestions,
    };
  }

  /**
   * 评分标题
   * @param content 内容
   * @returns 标题评分 (0-100)
   */
  private scoreTitle(content: string): number {
    let score = 0;

    // 提取标题
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (!titleMatch) {
      return 0; // 没有标题
    }

    const title = titleMatch[1];

    // 标题长度评分
    if (title.length >= 10 && title.length <= 60) {
      score += 50;
    } else if (title.length >= 5 && title.length <= 80) {
      score += 30;
    } else {
      score += 10;
    }

    // 标题包含数字
    if (/\d+/.test(title)) {
      score += 20;
    }

    // 标题包含吸引词
    const attractWords = ['如何', '怎么', '最佳', '完整', '指南', '教程', '详解', 'How to', 'Guide', 'Tutorial'];
    if (attractWords.some((word) => title.includes(word))) {
      score += 30;
    }

    return Math.min(score, 100);
  }

  /**
   * 评分内容
   * @param content 内容
   * @returns 内容评分 (0-100)
   */
  private scoreContent(content: string): number {
    let score = 0;

    // 内容长度评分
    const wordCount = content.length;
    if (wordCount >= 1500 && wordCount <= 3000) {
      score += 40;
    } else if (wordCount >= 800 && wordCount <= 5000) {
      score += 30;
    } else if (wordCount >= 500) {
      score += 20;
    } else {
      score += 10;
    }

    // 结构评分
    const headingCount = (content.match(/^#{1,3}\s/gm) ?? []).length;
    if (headingCount >= 5 && headingCount <= 15) {
      score += 30;
    } else if (headingCount >= 3) {
      score += 20;
    } else {
      score += 10;
    }

    // 代码块评分
    const codeBlockCount = (content.match(/```/g) ?? []).length / 2;
    if (codeBlockCount >= 2 && codeBlockCount <= 5) {
      score += 20;
    } else if (codeBlockCount >= 1) {
      score += 10;
    }

    // 列表评分
    const listCount = (content.match(/^[-*]\s/gm) ?? []).length;
    if (listCount >= 5) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * 评分关键词
   * @param content 内容
   * @param extractedKeywords 提取的关键词
   * @param targetKeywords 目标关键词
   * @returns 关键词评分 (0-100)
   */
  private scoreKeywords(
    content: string,
    extractedKeywords: KeywordInfo[],
    targetKeywords?: string[]
  ): number {
    let score = 0;

    // 如果有目标关键词
    if (targetKeywords && targetKeywords.length > 0) {
      // 检查目标关键词出现情况
      const lowerContent = content.toLowerCase();
      let matchedCount = 0;

      for (const keyword of targetKeywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          matchedCount++;
        }
      }

      // 匹配率评分
      const matchRate = matchedCount / targetKeywords.length;
      score += matchRate * 60;

      // 检查标题是否包含目标关键词
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        const title = titleMatch[1].toLowerCase();
        for (const keyword of targetKeywords) {
          if (title.includes(keyword.toLowerCase())) {
            score += 20;
            break;
          }
        }
      }

      // 检查关键词密度
      if (extractedKeywords.length > 0) {
        const avgDensity = extractedKeywords.reduce((sum, k) => sum + k.density, 0) / extractedKeywords.length;
        if (avgDensity >= 1 && avgDensity <= 3) {
          score += 20;
        } else if (avgDensity > 3) {
          score += 10; // 过度优化
        }
      }
    } else {
      // 没有目标关键词，基于提取的关键词评分
      if (extractedKeywords.length >= 5) {
        score += 50;
      } else if (extractedKeywords.length >= 3) {
        score += 30;
      }

      // 关键词多样性
      const uniqueKeywords = new Set(extractedKeywords.map((k) => k.keyword));
      if (uniqueKeywords.size >= 5) {
        score += 30;
      }

      // 关键词分布
      const hasKeywordsInTitle = extractedKeywords.some((k) => {
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return titleMatch && titleMatch[1].toLowerCase().includes(k.keyword.toLowerCase());
      });

      if (hasKeywordsInTitle) {
        score += 20;
      }
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * 评分可读性
   * @param content 内容
   * @returns 可读性评分 (0-100)
   */
  private scoreReadability(content: string): number {
    let score = 0;

    // 段落长度评分
    const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0);
    const avgParagraphLength = content.length / Math.max(paragraphs.length, 1);

    if (avgParagraphLength <= 150) {
      score += 40;
    } else if (avgParagraphLength <= 200) {
      score += 30;
    } else if (avgParagraphLength <= 300) {
      score += 20;
    } else {
      score += 10;
    }

    // 句子长度评分
    const sentences = content.split(/[。！？.!?]/).filter((s) => s.trim().length > 0);
    const avgSentenceLength = content.length / Math.max(sentences.length, 1);

    if (avgSentenceLength <= 50) {
      score += 30;
    } else if (avgSentenceLength <= 80) {
      score += 20;
    } else {
      score += 10;
    }

    // 图片评分
    const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) ?? []).length;
    if (imageCount >= 1) {
      score += 15;
    }

    // 链接评分
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) ?? []).length - imageCount;
    if (linkCount >= 1) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * 生成优化建议
   * @param score 评分
   * @param content 内容
   * @param keywords 关键词
   * @param targetKeywords 目标关键词
   * @returns 建议列表
   */
  private generateSuggestions(
    score: SEOScore,
    content: string,
    keywords: KeywordInfo[],
    targetKeywords?: string[]
  ): string[] {
    const suggestions: string[] = [];

    // 标题建议
    if (score.title < 50) {
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (!titleMatch) {
        suggestions.push('添加一个清晰的标题（使用 # 标记）');
      } else if (titleMatch[1].length < 10) {
        suggestions.push('标题太短，建议增加到 10-60 个字符');
      } else if (titleMatch[1].length > 60) {
        suggestions.push('标题太长，建议控制在 60 个字符以内');
      }
    }

    // 内容建议
    if (score.content < 50) {
      const wordCount = content.length;
      if (wordCount < 800) {
        suggestions.push('内容较短，建议增加到 800 字以上');
      }

      const headingCount = (content.match(/^#{1,3}\s/gm) ?? []).length;
      if (headingCount < 3) {
        suggestions.push('添加更多小标题，改善内容结构');
      }
    }

    // 关键词建议
    if (score.keywords < 50) {
      if (targetKeywords && targetKeywords.length > 0) {
        const lowerContent = content.toLowerCase();
        const missingKeywords = targetKeywords.filter(
          (k) => !lowerContent.includes(k.toLowerCase())
        );

        if (missingKeywords.length > 0) {
          suggestions.push(`在内容中自然地融入关键词：${missingKeywords.join('、')}`);
        }
      } else {
        suggestions.push('明确目标关键词，并在内容中合理使用');
      }
    }

    // 可读性建议
    if (score.readability < 50) {
      const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0);
      const avgParagraphLength = content.length / Math.max(paragraphs.length, 1);

      if (avgParagraphLength > 200) {
        suggestions.push('段落过长，建议拆分为更短的段落');
      }

      const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) ?? []).length;
      if (imageCount === 0) {
        suggestions.push('添加相关图片，提升内容吸引力');
      }
    }

    return suggestions;
  }
}
