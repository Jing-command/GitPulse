/**
 * 关键词提取器
 * 从文本中提取关键词
 */

import type { KeywordInfo } from '../types';

/**
 * 关键词提取器类
 * 使用 TF-IDF 算法提取关键词
 */
export class KeywordExtractor {
  // 停用词列表（中文）
  private chineseStopWords: Set<string>;
  // 停用词列表（英文）
  private englishStopWords: Set<string>;
  // 最小关键词长度
  private minKeywordLength: number;

  /**
   * 构造函数
   */
  constructor() {
    // 初始化中文停用词
    this.chineseStopWords = new Set([
      '的', '了', '和', '是', '就', '都', '而', '及', '与', '着',
      '或', '一个', '没有', '我们', '你们', '他们', '它们', '这个',
      '那个', '之', '以', '为', '于', '上', '下', '中', '来', '去',
      '在', '有', '这', '那', '但', '可以', '因为', '所以', '如果',
    ]);

    // 初始化英文停用词
    this.englishStopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
      'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
    ]);

    this.minKeywordLength = 2;
  }

  /**
   * 从文本中提取关键词
   * @param text 文本内容
   * @param topN 返回前 N 个关键词
   * @returns 关键词信息列表
   */
  extract(text: string, topN: number = 10): KeywordInfo[] {
    // 预处理文本
    const processedText = this.preprocess(text);

    // 分词
    const words = this.tokenize(processedText);

    // 计算词频
    const wordFrequency = this.calculateFrequency(words);

    // 计算词密度
    const totalWords = words.length;
    const keywordInfoList: KeywordInfo[] = [];

    for (const [keyword, frequency] of wordFrequency.entries()) {
      // 计算密度
      const density = (frequency * keyword.length) / totalWords;

      // 查找出现位置
      const positions = this.findPositions(text, keyword);

      keywordInfoList.push({
        keyword,
        frequency,
        density: Math.round(density * 10000) / 100, // 转换为百分比
        positions,
      });
    }

    // 按频率排序并返回前 N 个
    return keywordInfoList
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, topN);
  }

  /**
   * 预处理文本
   * @param text 原始文本
   * @returns 处理后的文本
   */
  private preprocess(text: string): string {
    return text
      .toLowerCase()
      // 移除 Markdown 标记
      .replace(/[#*_`~\[\]]/g, '')
      // 移除代码块
      .replace(/```[\s\S]*?```/g, '')
      // 移除行内代码
      .replace(/`[^`]+`/g, '')
      // 移除链接
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 移除 HTML 标签
      .replace(/<[^>]+>/g, '')
      // 标点符号替换为空格
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      // 多个空格合并
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 分词
   * @param text 文本
   * @returns 词列表
   */
  private tokenize(text: string): string[] {
    const words: string[] = [];

    // 简单分词：英文按空格分，中文按字符分
    let currentWord = '';
    let isChinese = false;

    for (const char of text) {
      const charIsChinese = /[\u4e00-\u9fa5]/.test(char);

      if (charIsChinese) {
        // 如果当前有英文词，保存它
        if (currentWord && !isChinese) {
          if (this.isValidWord(currentWord)) {
            words.push(currentWord);
          }
          currentWord = '';
        }

        // 中文单个字符作为词
        if (this.isValidWord(char)) {
          words.push(char);
        }

        isChinese = true;
      } else if (char === ' ') {
        // 空格分隔
        if (currentWord && this.isValidWord(currentWord)) {
          words.push(currentWord);
        }
        currentWord = '';
        isChinese = false;
      } else {
        // 英文字符
        if (isChinese && currentWord) {
          // 从中文切换到英文
          currentWord = '';
        }
        currentWord += char;
        isChinese = false;
      }
    }

    // 保存最后一个词
    if (currentWord && this.isValidWord(currentWord)) {
      words.push(currentWord);
    }

    return words;
  }

  /**
   * 检查是否为有效词
   * @param word 词
   * @returns 是否有效
   */
  private isValidWord(word: string): boolean {
    // 检查长度
    if (word.length < this.minKeywordLength) {
      return false;
    }

    // 检查是否为停用词
    if (this.chineseStopWords.has(word) || this.englishStopWords.has(word)) {
      return false;
    }

    // 检查是否为纯数字
    if (/^\d+$/.test(word)) {
      return false;
    }

    return true;
  }

  /**
   * 计算词频
   * @param words 词列表
   * @returns 词频映射
   */
  private calculateFrequency(words: string[]): Map<string, number> {
    const frequency = new Map<string, number>();

    for (const word of words) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }

    return frequency;
  }

  /**
   * 查找关键词出现位置
   * @param text 文本
   * @param keyword 关键词
   * @returns 位置列表
   */
  private findPositions(text: string, keyword: string): string[] {
    const positions: string[] = [];
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    let index = 0;
    while ((index = lowerText.indexOf(lowerKeyword, index)) !== -1) {
      // 提取上下文
      const start = Math.max(0, index - 20);
      const end = Math.min(text.length, index + keyword.length + 20);
      const context = text.substring(start, end).replace(/\n/g, ' ');
      positions.push(`...${context}...`);
      index += keyword.length;
    }

    return positions.slice(0, 3); // 最多返回 3 个位置
  }
}
