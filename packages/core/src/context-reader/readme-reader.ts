/**
 * README 读取器
 * 解析项目 README 文件，提取项目描述和使用说明
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * README 信息接口
 */
export interface ReadmeInfo {
  /** 项目标题 */
  title: string;
  /** 项目描述 */
  description: string;
  /** 功能特性列表 */
  features: string[];
  /** 安装说明 */
  installation: string;
  /** 使用示例 */
  usage: string;
  /** 原始内容 */
  raw: string;
}

/**
 * README 读取器类
 * 解析 README.md 文件，提取项目信息
 */
export class ReadmeReader {
  /**
   * 读取 README 文件
   * @param projectPath 项目根目录路径
   * @returns README 信息
   */
  async read(projectPath: string): Promise<ReadmeInfo | null> {
    // 尝试不同的 README 文件名
    const readmeNames = ['README.md', 'readme.md', 'Readme.md', 'README', 'readme'];

    for (const name of readmeNames) {
      const readmePath = join(projectPath, name);

      if (existsSync(readmePath)) {
        try {
          const content = await readFile(readmePath, 'utf-8');
          return this.parse(content);
        } catch (error) {
          console.warn(`Failed to read ${name}:`, error);
        }
      }
    }

    return null;
  }

  /**
   * 解析 README 内容
   * @param content README 文件内容
   * @returns 解析后的信息
   */
  parse(content: string): ReadmeInfo {
    return {
      title: this.extractTitle(content),
      description: this.extractDescription(content),
      features: this.extractFeatures(content),
      installation: this.extractSection(content, '安装', 'Installation', 'Install'),
      usage: this.extractSection(content, '使用', 'Usage', 'Quick Start', '快速开始'),
      raw: content,
    };
  }

  /**
   * 提取标题
   * @param content README 内容
   * @returns 标题
   */
  private extractTitle(content: string): string {
    // 查找第一个一级标题
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      return match[1].trim();
    }

    return 'Untitled Project';
  }

  /**
   * 提取描述
   * @param content README 内容
   * @returns 描述
   */
  private extractDescription(content: string): string {
    // 查找标题后的第一段
    const lines = content.split('\n');
    let foundTitle = false;
    const descriptionLines: string[] = [];

    for (const line of lines) {
      // 跳过标题行
      if (line.startsWith('# ')) {
        foundTitle = true;
        continue;
      }

      // 标题后开始收集描述
      if (foundTitle) {
        // 遇到空行后再次遇到内容，停止收集
        if (line.trim() === '' && descriptionLines.length > 0) {
          break;
        }

        // 遇到二级标题，停止收集
        if (line.startsWith('## ')) {
          break;
        }

        // 收集非空行
        if (line.trim() !== '') {
          descriptionLines.push(line.trim());
        }
      }
    }

    return descriptionLines.join(' ').trim() || 'No description available.';
  }

  /**
   * 提取功能特性列表
   * @param content README 内容
   * @returns 功能特性列表
   */
  private extractFeatures(content: string): string[] {
    const features: string[] = [];

    // 查找特性部分
    const featureSectionPatterns = [
      /##\s*(?:特性|Features|功能)\s*\n([\s\S]*?)(?=\n##|$)/i,
      /##\s*(?:✨\s*)?(?:特性|Features|功能)\s*\n([\s\S]*?)(?=\n##|$)/i,
    ];

    for (const pattern of featureSectionPatterns) {
      const match = content.match(pattern);
      if (match) {
        // 提取列表项
        const listItems = match[1].match(/[-*]\s+(.+)/g);
        if (listItems) {
          for (const item of listItems) {
            const feature = item.replace(/^[-*]\s+/, '').trim();
            if (feature) {
              features.push(feature);
            }
          }
        }
        break;
      }
    }

    return features;
  }

  /**
   * 提取指定章节内容
   * @param content README 内容
   * @param sectionNames 章节名称列表（支持多语言）
   * @returns 章节内容
   */
  private extractSection(content: string, ...sectionNames: string[]): string {
    for (const name of sectionNames) {
      // 匹配章节标题和内容
      const pattern = new RegExp(
        `##\\s*(?:.*?${name}.*?)\\s*\\n([\\s\\S]*?)(?=\\n##|$)`,
        'i'
      );
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * 提取代码示例
   * @param content README 内容
   * @returns 代码示例列表
   */
  extractCodeExamples(content: string): { language: string; code: string }[] {
    const examples: { language: string; code: string }[] = [];

    // 匹配代码块
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      examples.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      });
    }

    return examples;
  }
}
