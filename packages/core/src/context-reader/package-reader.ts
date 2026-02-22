/**
 * Package.json 读取器
 * 解析项目 package.json 文件，提取项目信息
 */

import type { ProjectContext, TechStack, Dependency } from '../types';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Package.json 结构接口
 */
interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  bin?: string | Record<string, string>;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  keywords?: string[];
  engines?: Record<string, string>;
}

/**
 * Package.json 读取器类
 * 解析项目配置文件，提取项目元信息
 */
export class PackageReader {
  /**
   * 读取 package.json 文件
   * @param projectPath 项目根目录路径
   * @returns Package.json 内容
   */
  async read(projectPath: string): Promise<PackageJson | null> {
    const packagePath = join(projectPath, 'package.json');

    // 检查文件是否存在
    if (!existsSync(packagePath)) {
      return null;
    }

    try {
      const content = await readFile(packagePath, 'utf-8');
      return JSON.parse(content) as PackageJson;
    } catch (error) {
      console.warn('Failed to parse package.json:', error);
      return null;
    }
  }

  /**
   * 提取技术栈信息
   * @param packageJson Package.json 内容
   * @returns 技术栈信息
   */
  extractTechStack(packageJson: PackageJson): TechStack {
    const languages: string[] = [];
    const frameworks: string[] = [];
    const tools: string[] = [];
    const dependencies: Dependency[] = [];

    // 分析依赖
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version,
          type: 'production',
        });

        // 识别框架
        const framework = this.identifyFramework(name);
        if (framework) {
          frameworks.push(framework);
        }

        // 识别工具
        const tool = this.identifyTool(name);
        if (tool) {
          tools.push(tool);
        }
      }
    }

    // 分析开发依赖
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push({
          name,
          version,
          type: 'development',
        });

        // 识别工具
        const tool = this.identifyTool(name);
        if (tool) {
          tools.push(tool);
        }
      }
    }

    // 分析 peer 依赖
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        dependencies.push({
          name,
          version,
          type: 'peer',
        });
      }
    }

    // 根据依赖推断语言
    if (dependencies.some((d) => d.name.includes('typescript'))) {
      languages.push('typescript');
    }
    if (dependencies.some((d) => d.name.includes('react') || d.name.includes('vue'))) {
      languages.push('javascript');
    }

    // 去重
    return {
      language: [...new Set(languages)],
      frameworks: [...new Set(frameworks)],
      tools: [...new Set(tools)],
      dependencies,
    };
  }

  /**
   * 推断项目类型
   * @param packageJson Package.json 内容
   * @param techStack 技术栈信息
   * @returns 项目类型
   */
  inferProjectType(
    packageJson: PackageJson,
    techStack: TechStack
  ): ProjectContext['type'] {
    // 检查是否为 CLI 工具
    if (
      packageJson.bin ||
      techStack.tools.includes('commander') ||
      techStack.tools.includes('yargs') ||
      techStack.tools.includes('inquirer')
    ) {
      return 'cli-tool';
    }

    // 检查是否为库
    if (
      packageJson.main &&
      !packageJson.scripts?.start &&
      (packageJson.scripts?.build || packageJson.types)
    ) {
      return 'library';
    }

    // 检查是否为 Web 应用
    if (
      techStack.frameworks.includes('react') ||
      techStack.frameworks.includes('vue') ||
      techStack.frameworks.includes('angular') ||
      techStack.frameworks.includes('svelte')
    ) {
      return 'web-app';
    }

    // 检查是否为 API 服务
    if (
      techStack.frameworks.includes('express') ||
      techStack.frameworks.includes('fastify') ||
      techStack.frameworks.includes('koa') ||
      techStack.frameworks.includes('nestjs')
    ) {
      return 'api-service';
    }

    // 默认为库
    return 'library';
  }

  /**
   * 识别框架
   * @param packageName 包名
   * @returns 框架名称
   */
  private identifyFramework(packageName: string): string | null {
    const frameworkMap: Record<string, string> = {
      react: 'react',
      'react-dom': 'react',
      vue: 'vue',
      angular: 'angular',
      '@angular/core': 'angular',
      svelte: 'svelte',
      next: 'next.js',
      nuxt: 'nuxt.js',
      express: 'express',
      fastify: 'fastify',
      koa: 'koa',
      '@nestjs/core': 'nestjs',
      '@nestjs/common': 'nestjs',
      egg: 'egg.js',
      midway: 'midway',
      nest: 'nestjs',
    };

    // 精确匹配
    if (frameworkMap[packageName]) {
      return frameworkMap[packageName];
    }

    // 模糊匹配
    for (const [key, value] of Object.entries(frameworkMap)) {
      if (packageName.includes(key)) {
        return value;
      }
    }

    return null;
  }

  /**
   * 识别工具
   * @param packageName 包名
   * @returns 工具名称
   */
  private identifyTool(packageName: string): string | null {
    const toolMap: Record<string, string> = {
      typescript: 'typescript',
      eslint: 'eslint',
      prettier: 'prettier',
      jest: 'jest',
      vitest: 'vitest',
      vite: 'vite',
      webpack: 'webpack',
      rollup: 'rollup',
      esbuild: 'esbuild',
      babel: 'babel',
      commander: 'commander',
      yargs: 'yargs',
      inquirer: 'inquirer',
      chalk: 'chalk',
      ora: 'ora',
      prisma: 'prisma',
      '@prisma/client': 'prisma',
      tailwindcss: 'tailwindcss',
      postcss: 'postcss',
      sass: 'sass',
      less: 'less',
    };

    // 精确匹配
    if (toolMap[packageName]) {
      return toolMap[packageName];
    }

    // 模糊匹配
    for (const [key, value] of Object.entries(toolMap)) {
      if (packageName.includes(key)) {
        return value;
      }
    }

    return null;
  }
}
