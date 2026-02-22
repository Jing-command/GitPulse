/**
 * 目录结构分析器
 * 分析项目目录结构，提取架构信息
 */

import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import type { DirectoryTree } from '../types';

/**
 * 目录结构分析器类
 * 分析项目目录结构，识别项目架构
 */
export class StructureAnalyzer {
  // 忽略的目录
  private ignoreDirs: Set<string>;
  // 忽略的文件
  private ignoreFiles: Set<string>;
  // 最大深度
  private maxDepth: number;

  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options?: { ignoreDirs?: string[]; ignoreFiles?: string[]; maxDepth?: number }) {
    this.ignoreDirs = new Set(options?.ignoreDirs ?? [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      '.vitepress',
      'coverage',
      '.prisma',
      '__pycache__',
      '.pytest_cache',
      'venv',
      '.venv',
    ]);

    this.ignoreFiles = new Set(options?.ignoreFiles ?? [
      '.DS_Store',
      'Thumbs.db',
      '.env',
      '.env.local',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
    ]);

    this.maxDepth = options?.maxDepth ?? 5;
  }

  /**
   * 分析目录结构
   * @param projectPath 项目根目录路径
   * @returns 目录树
   */
  async analyze(projectPath: string): Promise<DirectoryTree> {
    return this.buildTree(projectPath, projectPath, 0);
  }

  /**
   * 构建目录树
   * @param rootPath 根路径
   * @param currentPath 当前路径
   * @param depth 当前深度
   * @returns 目录树节点
   */
  private async buildTree(
    rootPath: string,
    currentPath: string,
    depth: number
  ): Promise<DirectoryTree> {
    const name = currentPath === rootPath ? '.' : currentPath.split(/[/\\]/).pop() ?? '';
    const relativePath = relative(rootPath, currentPath) || '.';

    // 获取文件状态
    const stats = await stat(currentPath);

    // 如果是文件
    if (stats.isFile()) {
      return {
        name,
        type: 'file',
        path: relativePath,
      };
    }

    // 如果是目录
    const node: DirectoryTree = {
      name,
      type: 'directory',
      path: relativePath,
      children: [],
    };

    // 检查深度限制
    if (depth >= this.maxDepth) {
      return node;
    }

    // 读取目录内容
    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      // 排序：目录在前，文件在后，按名称排序
      const sortedEntries = entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      // 遍历子项
      for (const entry of sortedEntries) {
        // 跳过忽略的目录和文件
        if (entry.isDirectory() && this.ignoreDirs.has(entry.name)) {
          continue;
        }
        if (entry.isFile() && this.ignoreFiles.has(entry.name)) {
          continue;
        }

        const childPath = join(currentPath, entry.name);
        const childNode = await this.buildTree(rootPath, childPath, depth + 1);
        node.children?.push(childNode);
      }
    } catch (error) {
      // 忽略无法访问的目录
      console.warn(`Failed to read directory ${currentPath}:`, error);
    }

    return node;
  }

  /**
   * 识别项目架构模式
   * @param tree 目录树
   * @returns 架构模式
   */
  identifyArchitecture(tree: DirectoryTree): string[] {
    const patterns: string[] = [];
    const dirs = this.getDirectories(tree);

    // 检测 Monorepo
    if (dirs.includes('packages') || dirs.includes('apps')) {
      patterns.push('monorepo');
    }

    // 检测 MVC
    if (dirs.includes('models') && dirs.includes('views') && dirs.includes('controllers')) {
      patterns.push('mvc');
    }

    // 检测分层架构
    if (dirs.includes('services') && dirs.includes('controllers')) {
      patterns.push('layered');
    }

    // 检测领域驱动设计
    if (dirs.includes('domains') || dirs.includes('modules')) {
      patterns.push('ddd');
    }

    // 检测 Clean Architecture
    if (dirs.includes('entities') && dirs.includes('usecases')) {
      patterns.push('clean-architecture');
    }

    // 检测微服务
    if (dirs.includes('services') && this.hasMultipleServiceDirs(tree)) {
      patterns.push('microservices');
    }

    // 默认
    if (patterns.length === 0) {
      patterns.push('standard');
    }

    return patterns;
  }

  /**
   * 获取所有目录名
   * @param tree 目录树
   * @returns 目录名列表
   */
  private getDirectories(tree: DirectoryTree): string[] {
    const dirs: string[] = [];

    if (tree.type === 'directory') {
      dirs.push(tree.name);

      if (tree.children) {
        for (const child of tree.children) {
          dirs.push(...this.getDirectories(child));
        }
      }
    }

    return dirs;
  }

  /**
   * 检查是否有多个服务目录
   * @param tree 目录树
   * @returns 是否有多个服务目录
   */
  private hasMultipleServiceDirs(tree: DirectoryTree): boolean {
    if (!tree.children) return false;

    // 查找 services 目录下的子目录数量
    const servicesDir = tree.children.find((c) => c.name === 'services');
    if (servicesDir && servicesDir.children) {
      const serviceCount = servicesDir.children.filter((c) => c.type === 'directory').length;
      return serviceCount > 1;
    }

    return false;
  }

  /**
   * 提取关键目录
   * @param tree 目录树
   * @returns 关键目录列表
   */
  extractKeyDirectories(tree: DirectoryTree): string[] {
    const keyDirs: string[] = [];
    const importantNames = [
      'src',
      'lib',
      'app',
      'pages',
      'components',
      'api',
      'routes',
      'services',
      'controllers',
      'models',
      'utils',
      'helpers',
      'types',
      'interfaces',
      'config',
      'tests',
      '__tests__',
      'docs',
    ];

    if (tree.children) {
      for (const child of tree.children) {
        if (child.type === 'directory' && importantNames.includes(child.name)) {
          keyDirs.push(child.name);
        }
      }
    }

    return keyDirs;
  }
}
