/**
 * 侧边栏管理器
 * 管理 VitePress 侧边栏配置
 */

import type { SidebarItem, SidebarGroup, SidebarConfig } from '../types';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * 侧边栏管理器类
 * 处理 VitePress 侧边栏配置的读取和更新
 */
export class SidebarManager {
  // 侧边栏配置文件路径
  private configPath: string;
  // 当前配置
  private config: SidebarConfig | null = null;

  /**
   * 构造函数
   * @param configPath 配置文件路径
   */
  constructor(configPath: string) {
    this.configPath = configPath;
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<SidebarConfig> {
    if (this.config) {
      return this.config;
    }

    // 检查文件是否存在
    if (!existsSync(this.configPath)) {
      // 创建默认配置
      this.config = {
        items: [],
        groups: [],
      };
      return this.config;
    }

    try {
      const content = await readFile(this.configPath, 'utf-8');

      // 解析 TypeScript/JavaScript 配置文件
      // 简化处理：假设是 JSON 格式
      // 实际实现需要使用 esbuild 或其他工具解析
      const jsonMatch = content.match(/export\s+default\s+(\{[\s\S]*\})/);
      if (jsonMatch) {
        // 简单的 JSON 解析（不安全，仅用于演示）
        this.config = new Function(`return ${jsonMatch[1]}`)() as SidebarConfig;
      } else {
        this.config = {
          items: [],
          groups: [],
        };
      }
    } catch {
      this.config = {
        items: [],
        groups: [],
      };
    }

    return this.config;
  }

  /**
   * 保存配置
   */
  private async saveConfig(): Promise<void> {
    if (!this.config) {
      return;
    }

    // 生成配置文件内容
    const content = this.generateConfigFile(this.config);

    await writeFile(this.configPath, content, 'utf-8');
  }

  /**
   * 生成配置文件内容
   * @param config 配置
   * @returns 文件内容
   */
  private generateConfigFile(config: SidebarConfig): string {
    const lines: string[] = [
      '/**',
      ' * VitePress 侧边栏配置',
      ' * 由 GitPulse 自动生成',
      ' */',
      '',
      'import type { DefaultTheme } from \'vitepress\';',
      '',
      'export default {',
    ];

    // 生成分组配置
    if (config.groups.length > 0) {
      lines.push('  sidebar: {');

      for (const group of config.groups) {
        lines.push(`    '/${this.slugify(group.text)}': [`);
        lines.push('      {');
        lines.push(`        text: '${group.text}',`);
        lines.push(`        collapsed: ${group.collapsed ?? false},`);
        lines.push('        items: [');

        for (const item of group.items) {
          lines.push(`          { text: '${item.text}', link: '${item.link}' },`);
        }

        lines.push('        ],');
        lines.push('      },');
        lines.push('    ],');
      }

      lines.push('  },');
    }

    lines.push('} as DefaultTheme.Config;');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 添加侧边栏项
   * @param item 侧边栏项
   * @param groupName 分组名称
   */
  async addItem(item: SidebarItem, groupName: string): Promise<void> {
    const config = await this.loadConfig();

    // 查找或创建分组
    let group = config.groups.find((g) => g.text === groupName);

    if (!group) {
      group = {
        text: groupName,
        collapsed: false,
        items: [],
      };
      config.groups.push(group);
    }

    // 检查是否已存在
    const exists = group.items.some(
      (i) => i.link === item.link || i.text === item.text
    );

    if (!exists) {
      // 添加新项
      group.items.push(item);

      // 按日期排序（假设 link 包含日期）
      group.items.sort((a, b) => {
        const dateA = this.extractDateFromLink(a.link);
        const dateB = this.extractDateFromLink(b.link);
        return dateB.localeCompare(dateA); // 降序，最新的在前
      });

      // 保存配置
      await this.saveConfig();
    }
  }

  /**
   * 移除侧边栏项
   * @param link 链接
   */
  async removeItem(link: string): Promise<void> {
    const config = await this.loadConfig();

    for (const group of config.groups) {
      const index = group.items.findIndex((i) => i.link === link);
      if (index !== -1) {
        group.items.splice(index, 1);
        await this.saveConfig();
        return;
      }
    }
  }

  /**
   * 更新侧边栏项
   * @param link 原链接
   * @param newItem 新的侧边栏项
   */
  async updateItem(link: string, newItem: SidebarItem): Promise<void> {
    const config = await this.loadConfig();

    for (const group of config.groups) {
      const index = group.items.findIndex((i) => i.link === link);
      if (index !== -1) {
        group.items[index] = newItem;
        await this.saveConfig();
        return;
      }
    }
  }

  /**
   * 获取所有分组
   * @returns 分组列表
   */
  async getGroups(): Promise<SidebarGroup[]> {
    const config = await this.loadConfig();
    return config.groups;
  }

  /**
   * 获取指定分组的项
   * @param groupName 分组名称
   * @returns 侧边栏项列表
   */
  async getGroupItems(groupName: string): Promise<SidebarItem[]> {
    const config = await this.loadConfig();
    const group = config.groups.find((g) => g.text === groupName);
    return group?.items ?? [];
  }

  /**
   * 从链接中提取日期
   * @param link 链接
   * @returns 日期字符串
   */
  private extractDateFromLink(link: string): string {
    const dateMatch = link.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : '0000-00-00';
  }

  /**
   * 将文本转换为 slug
   * @param text 文本
   * @returns slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
