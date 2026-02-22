/**
 * VitePress 适配器
 * 将生成的内容同步到 VitePress 文档站点
 */

import type { GeneratedContent, DocSyncConfig, SidebarItem } from '../types';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { SidebarManager } from './sidebar';

/**
 * VitePress 适配器类
 * 处理 VitePress 文档站点的同步操作
 */
export class VitePressAdapter {
  // 配置
  private config: DocSyncConfig;
  // 侧边栏管理器
  private sidebarManager: SidebarManager;

  /**
   * 构造函数
   * @param config 文档同步配置
   */
  constructor(config: DocSyncConfig) {
    this.config = config;
    this.sidebarManager = new SidebarManager(config.sidebar_file);
  }

  /**
   * 同步内容到 VitePress
   * @param content 生成的内容
   * @returns 同步结果
   */
  async sync(content: GeneratedContent): Promise<{ path: string; success: boolean }> {
    // 生成文件路径
    const filePath = this.generateFilePath(content);

    // 确保目录存在
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // 生成文件内容
    const fileContent = this.generateFileContent(content);

    // 写入文件
    await writeFile(filePath, fileContent, 'utf-8');

    // 更新侧边栏
    const sidebarItem = this.createSidebarItem(content, filePath);
    await this.sidebarManager.addItem(sidebarItem, this.getGroupForContent(content));

    return {
      path: filePath,
      success: true,
    };
  }

  /**
   * 批量同步内容
   * @param contents 内容列表
   * @returns 同步结果列表
   */
  async syncAll(contents: GeneratedContent[]): Promise<{ path: string; success: boolean }[]> {
    const results: { path: string; success: boolean }[] = [];

    for (const content of contents) {
      try {
        const result = await this.sync(content);
        results.push(result);
      } catch (error) {
        console.error(`Failed to sync content ${content.id}:`, error);
        results.push({
          path: '',
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * 生成文件路径
   * @param content 内容
   * @returns 文件路径
   */
  private generateFilePath(content: GeneratedContent): string {
    // 根据内容类型确定目录
    const typeDir = this.getTypeDirectory(content.type);

    // 生成文件名
    const fileName = this.generateFileName(content);

    return join(this.config.output_dir, typeDir, fileName);
  }

  /**
   * 获取类型目录
   * @param type 内容类型
   * @returns 目录名
   */
  private getTypeDirectory(type: string): string {
    const dirMap: Record<string, string> = {
      changelog: 'changelog',
      technical: 'blog',
      seo: 'blog',
    };

    return dirMap[type] ?? 'docs';
  }

  /**
   * 生成文件名
   * @param content 内容
   * @returns 文件名
   */
  private generateFileName(content: GeneratedContent): string {
    // 使用日期前缀
    const date = content.created_at.toISOString().split('T')[0];

    // 从标题生成 slug
    const slug = this.titleToSlug(content.title);

    return `${date}-${slug}.md`;
  }

  /**
   * 将标题转换为 slug
   * @param title 标题
   * @returns slug
   */
  private titleToSlug(title: string): string {
    return title
      .toLowerCase()
      // 移除特殊字符
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      // 空格替换为连字符
      .replace(/\s+/g, '-')
      // 中文转拼音（简化处理，实际应使用 pinyin 库）
      .replace(/[\u4e00-\u9fa5]/g, (char) => {
        // 简单的中文映射
        const map: Record<string, string> = {
          更新: 'update',
          日志: 'changelog',
          新功能: 'new-feature',
          修复: 'fix',
          改进: 'improvement',
          技术: 'technical',
          博客: 'blog',
        };
        return map[char] ?? char;
      })
      // 移除连续连字符
      .replace(/-+/g, '-')
      // 移除首尾连字符
      .replace(/^-|-$/g, '')
      // 限制长度
      .substring(0, 50);
  }

  /**
   * 生成文件内容
   * @param content 内容
   * @returns 文件内容
   */
  private generateFileContent(content: GeneratedContent): string {
    const frontmatter = this.generateFrontmatter(content);
    return `${frontmatter}\n\n${content.content}`;
  }

  /**
   * 生成 Frontmatter
   * @param content 内容
   * @returns Frontmatter 字符串
   */
  private generateFrontmatter(content: GeneratedContent): string {
    const frontmatter: Record<string, unknown> = {
      title: content.title,
      date: content.created_at.toISOString(),
      lastUpdated: content.updated_at.toISOString(),
      lang: content.language,
      type: content.type,
    };

    // 添加 SEO 元数据
    if (content.metadata.seo_score) {
      frontmatter.seo_score = content.metadata.seo_score.total;
    }

    // 添加关键词
    if (content.metadata.keywords.length > 0) {
      frontmatter.keywords = content.metadata.keywords;
    }

    // 添加版本号
    if (content.metadata.version) {
      frontmatter.version = content.metadata.version;
    }

    // 转换为 YAML
    const yamlLines = ['---'];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yamlLines.push(`${key}:`);
        for (const item of value) {
          yamlLines.push(`  - ${item}`);
        }
      } else if (typeof value === 'object') {
        yamlLines.push(`${key}: ${JSON.stringify(value)}`);
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
    yamlLines.push('---');

    return yamlLines.join('\n');
  }

  /**
   * 创建侧边栏项
   * @param content 内容
   * @param filePath 文件路径
   * @returns 侧边栏项
   */
  private createSidebarItem(content: GeneratedContent, filePath: string): SidebarItem {
    // 计算相对路径
    const relativePath = filePath
      .replace(this.config.output_dir, '')
      .replace(/\\/g, '/')
      .replace(/\.md$/, '')
      .replace(/^\//, '');

    return {
      text: content.title,
      link: `/${relativePath}`,
    };
  }

  /**
   * 获取内容所属分组
   * @param content 内容
   * @returns 分组名
   */
  private getGroupForContent(content: GeneratedContent): string {
    const groupMap: Record<string, string> = {
      changelog: '更新日志',
      technical: '技术博客',
      seo: 'SEO 文章',
    };

    return groupMap[content.type] ?? '文档';
  }
}
