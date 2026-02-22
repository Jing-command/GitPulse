/**
 * generate 命令
 * 生成内容（更新日志、技术博客、SEO 文章）
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import {
  AIService,
  ChangelogGenerator,
  TechnicalGenerator,
  SEOGenerator,
  ContentCache,
} from '@gitpulse/core';
import type { CommitAnalysis, ContentType, GenerateOptions } from '@gitpulse/core';

// 创建 generate 命令
export const generateCommand = new Command('generate')
  .description('生成内容（更新日志、技术博客、SEO 文章）')
  .option('-t, --type <type>', '内容类型 (changelog|technical|seo|all)', 'all')
  .option('--commit <hash>', '指定 commit 哈希', '')
  .option('-l, --language <lang>', '目标语言', 'zh')
  .option('-o, --output <path>', '输出目录', './docs')
  .option('--no-cache', '禁用缓存', false)
  .action(async (options) => {
    const spinner = ora('正在生成内容...').start();

    try {
      // TODO: 从配置文件加载 AI 配置
      // 这里使用模拟的 AI 服务
      const aiService = createMockAIService();
      const cache = options.cache ? new ContentCache() : undefined;

      // 创建生成器
      const changelogGenerator = new ChangelogGenerator(
        (prompt) => aiService.generate(prompt),
        cache
      );
      const technicalGenerator = new TechnicalGenerator(
        (prompt) => aiService.generate(prompt),
        cache
      );
      const seoGenerator = new SEOGenerator(
        (prompt) => aiService.generate(prompt),
        cache
      );

      // TODO: 从 analyze 命令获取 commits
      // 这里使用模拟数据
      const commits = createMockCommits();
      const context = createMockContext();

      // 确定要生成的内容类型
      const types: ContentType[] =
        options.type === 'all'
          ? ['changelog', 'technical', 'seo']
          : [options.type as ContentType];

      spinner.text = `正在生成 ${types.join(', ')} 内容...`;

      // 生成内容
      const results = [];

      for (const type of types) {
        let content;

        switch (type) {
          case 'changelog':
            content = await changelogGenerator.generate(commits, context, options.language);
            break;
          case 'technical':
            content = await technicalGenerator.generate(commits, context, options.language);
            break;
          case 'seo':
            content = await seoGenerator.generate(commits, context, options.language);
            break;
        }

        if (content) {
          results.push(content);

          // 保存到文件
          const fileName = `${type}-${Date.now()}.md`;
          const filePath = join(options.output, fileName);
          await writeFile(filePath, content.content, 'utf-8');

          spinner.text = `已生成: ${fileName}`;
        }
      }

      spinner.succeed(chalk.green(`内容生成完成，共 ${results.length} 个文件`));

      // 打印摘要
      console.log();
      console.log(chalk.bold('📄 生成的内容:\n'));

      for (const result of results) {
        console.log(`  ${getTypeEmoji(result.type)} ${result.title}`);
        console.log(chalk.gray(`    类型: ${result.type}`));
        console.log(chalk.gray(`    语言: ${result.language}`));
        console.log(chalk.gray(`    状态: ${result.status}`));
        if (result.metadata.seo_score) {
          console.log(chalk.gray(`    SEO 评分: ${result.metadata.seo_score.total}/100`));
        }
        console.log();
      }
    } catch (error) {
      spinner.fail(chalk.red('内容生成失败'));
      console.error(error);
      process.exit(1);
    }
  });

/**
 * 获取内容类型 emoji
 * @param type 内容类型
 * @returns emoji
 */
function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    changelog: '📋',
    technical: '📝',
    seo: '🔍',
  };
  return emojis[type] ?? '📄';
}

/**
 * 创建模拟 AI 服务
 * @returns AI 服务实例
 */
function createMockAIService(): AIService {
  // 返回一个模拟的 AI 服务
  return {
    generate: async (prompt: string) => {
      // 模拟 AI 生成
      return `# 模拟生成的内容

这是一个模拟的 AI 生成内容。

提示词长度: ${prompt.length} 字符

## 示例内容

这里是示例内容，实际使用时需要配置真实的 AI 服务。

### 功能特性

- 特性 1
- 特性 2
- 特性 3

### 使用方法

\`\`\`typescript
// 示例代码
console.log('Hello, GitPulse!');
\`\`\`
`;
    },
  } as unknown as AIService;
}

/**
 * 创建模拟 commits
 * @returns 模拟的 commit 分析结果
 */
function createMockCommits(): CommitAnalysis[] {
  return [
    {
      hash: 'abc123def456',
      message: 'feat: 添加 AST 分析功能\n\n- 支持 JS/TS AST 解析\n- 支持 Python AST 解析',
      author: 'Developer',
      author_email: 'developer@example.com',
      timestamp: new Date(),
      changes: [
        {
          path: 'src/diff-analyzer/ast-analyzer.ts',
          type: 'add',
          language: 'typescript',
          hunks: [],
          functions: [],
        },
      ],
      summary: {
        type: 'feature',
        scope: ['ast-analyzer'],
        keywords: ['AST', '解析'],
        breaking: false,
      },
      impact_level: 'minor',
    },
  ];
}

/**
 * 创建模拟上下文
 * @returns 模拟的项目上下文
 */
function createMockContext() {
  return {
    name: 'GitPulse',
    description: '技术内容全自动流水线',
    type: 'cli-tool' as const,
    tech_stack: {
      language: ['TypeScript'],
      frameworks: [],
      tools: ['Node.js'],
      dependencies: [],
    },
    terminology: new Map(),
    style_guide: {
      tone: 'technical' as const,
      language: 'zh',
      code_style: 'standard',
      examples: [],
    },
    structure: {
      name: '.',
      type: 'directory' as const,
      path: '.',
      children: [],
    },
  };
}
