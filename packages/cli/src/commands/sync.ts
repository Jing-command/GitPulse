/**
 * sync 命令
 * 同步内容到文档站点
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { VitePressAdapter } from '@gitpulse/core';
import type { DocSyncConfig, GeneratedContent } from '@gitpulse/core';

// 创建 sync 命令
export const syncCommand = new Command('sync')
  .description('同步内容到文档站点')
  .option('-f, --framework <name>', '文档框架 (vitepress)', 'vitepress')
  .option('-o, --output <path>', '输出目录', './docs')
  .option('--dry-run', '预览模式，不实际写入文件', false)
  .action(async (options) => {
    const spinner = ora('正在同步内容...').start();

    try {
      // 创建同步配置
      const config: DocSyncConfig = {
        framework: 'vitepress',
        output_dir: options.output,
        sidebar_file: `${options.output}/.vitepress/sidebar.ts`,
        template: 'default',
        naming: {
          file_pattern: '{date}-{slug}.md',
          directory_pattern: '{type}',
          date_prefix: true,
        },
      };

      // 创建适配器
      const adapter = new VitePressAdapter(config);

      // TODO: 从数据库或文件加载已生成的内容
      // 这里使用模拟数据
      const contents = createMockContents();

      if (options.dryRun) {
        spinner.info(chalk.yellow('预览模式，不实际写入文件'));
        console.log();
        console.log(chalk.gray('将要同步的内容:'));

        for (const content of contents) {
          console.log(`  - ${content.title} (${content.type})`);
        }

        return;
      }

      // 同步内容
      const results = await adapter.syncAll(contents);

      // 统计结果
      const success = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      if (failed === 0) {
        spinner.succeed(chalk.green(`同步完成，共 ${success} 个文件`));
      } else {
        spinner.warn(chalk.yellow(`同步完成，成功 ${success} 个，失败 ${failed} 个`));
      }

      // 打印详细结果
      console.log();
      console.log(chalk.bold('📁 同步结果:\n'));

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const content = contents[i];
        const status = result.success ? chalk.green('✓') : chalk.red('✗');

        console.log(`  ${status} ${content.title}`);
        if (result.success) {
          console.log(chalk.gray(`    路径: ${result.path}`));
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('同步失败'));
      console.error(error);
      process.exit(1);
    }
  });

/**
 * 创建模拟内容
 * @returns 模拟的生成内容列表
 */
function createMockContents(): GeneratedContent[] {
  return [
    {
      id: 'content-1',
      type: 'changelog',
      title: 'v1.0.0 更新日志',
      content: `# v1.0.0 更新日志

## 新功能

- ✨ 添加 AST 分析功能
- ✨ 支持多 AI 服务商

## 修复

- 🐛 修复大文件解析问题
`,
      formats: ['markdown'],
      metadata: {
        commit_hashes: ['abc123'],
        keywords: ['AST', 'AI'],
        author: 'GitPulse',
      },
      language: 'zh',
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'content-2',
      type: 'technical',
      title: 'AST 分析技术详解',
      content: `# AST 分析技术详解

本文介绍如何使用 AST 进行代码分析。

## 什么是 AST

AST（抽象语法树）是源代码的结构化表示...
`,
      formats: ['markdown'],
      metadata: {
        commit_hashes: ['abc123'],
        keywords: ['AST', '技术'],
        author: 'GitPulse',
      },
      language: 'zh',
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];
}
