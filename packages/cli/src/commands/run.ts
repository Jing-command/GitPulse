/**
 * run 命令
 * 一键执行完整流程
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { simpleGit, SimpleGit } from 'simple-git';
import {
  DiffParser,
  ChangeClassifier,
  AIService,
  ChangelogGenerator,
  TechnicalGenerator,
  VitePressAdapter,
  ContentCache,
} from '@gitpulse/core';
import type { CommitAnalysis, DocSyncConfig } from '@gitpulse/core';

// 创建 run 命令
export const runCommand = new Command('run')
  .description('一键执行完整流程（分析 -> 生成 -> 同步）')
  .option('--from <ref>', '起始引用', 'HEAD~10')
  .option('--to <ref>', '结束引用', 'HEAD')
  .option('-t, --type <type>', '内容类型', 'changelog')
  .option('-l, --language <lang>', '目标语言', 'zh')
  .option('-o, --output <path>', '输出目录', './docs')
  .option('--skip-sync', '跳过同步步骤', false)
  .action(async (options) => {
    console.log(chalk.bold('\n🚀 GitPulse 完整流程\n'));

    try {
      // 步骤 1: 分析
      console.log(chalk.cyan('步骤 1/3: 分析代码变更'));
      const commits = await analyzeCommits(options.from, options.to);
      console.log(chalk.green(`  ✓ 分析完成，共 ${commits.length} 个 commits\n`));

      // 步骤 2: 生成
      console.log(chalk.cyan('步骤 2/3: 生成内容'));
      const content = await generateContent(commits, options.type, options.language);
      console.log(chalk.green(`  ✓ 生成完成: ${content.title}\n`));

      // 步骤 3: 同步
      if (!options.skipSync) {
        console.log(chalk.cyan('步骤 3/3: 同步到文档站点'));
        const result = await syncContent(content, options.output);
        console.log(chalk.green(`  ✓ 同步完成: ${result}\n`));
      } else {
        console.log(chalk.yellow('  ⊘ 跳过同步步骤\n'));
      }

      console.log(chalk.bold.green('✨ 完成！\n'));
    } catch (error) {
      console.log(chalk.red('\n流程执行失败:'));
      console.error(error);
      process.exit(1);
    }
  });

/**
 * 分析 commits
 * @param from 起始引用
 * @param to 结束引用
 * @returns commit 分析结果列表
 */
async function analyzeCommits(from: string, to: string): Promise<CommitAnalysis[]> {
  const spinner = ora('正在分析...').start();

  try {
    const git: SimpleGit = simpleGit(process.cwd());
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      throw new Error('当前目录不是 Git 仓库');
    }

    const log = await git.log({ from, to });
    const diffParser = new DiffParser();
    const classifier = new ChangeClassifier();
    const analyses: CommitAnalysis[] = [];

    for (const commit of log.all) {
      const diff = await git.diff([`${commit.hash}^`, commit.hash]);
      const changes = diffParser.parseDiff(diff);
      const summary = diffParser.extractSummary(commit.message);

      const analysis: CommitAnalysis = {
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name ?? 'Unknown',
        author_email: commit.author_email ?? '',
        timestamp: new Date(commit.date),
        changes,
        summary,
        impact_level: 'patch',
      };

      analysis.impact_level = classifier.classifyImpactLevel(analysis);
      analyses.push(analysis);
    }

    spinner.stop();
    return analyses;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

/**
 * 生成内容
 * @param commits commit 分析结果
 * @param type 内容类型
 * @param language 语言
 * @returns 生成的内容
 */
async function generateContent(
  commits: CommitAnalysis[],
  type: string,
  language: string
) {
  const spinner = ora('正在生成...').start();

  try {
    // 创建模拟 AI 服务
    const aiService = createMockAIService();
    const cache = new ContentCache();
    const generator = new ChangelogGenerator((prompt) => aiService.generate(prompt), cache);

    // 创建模拟上下文
    const context = {
      name: 'GitPulse',
      description: '技术内容全自动流水线',
      type: 'cli-tool' as const,
      tech_stack: {
        language: ['TypeScript'],
        frameworks: [],
        tools: [],
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

    const content = await generator.generate(commits, context, language);

    spinner.stop();
    return content;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

/**
 * 同步内容
 * @param content 生成的内容
 * @param output 输出目录
 * @returns 同步结果路径
 */
async function syncContent(content: unknown, output: string): Promise<string> {
  const spinner = ora('正在同步...').start();

  try {
    const config: DocSyncConfig = {
      framework: 'vitepress',
      output_dir: output,
      sidebar_file: `${output}/.vitepress/sidebar.ts`,
      template: 'default',
      naming: {
        file_pattern: '{date}-{slug}.md',
        directory_pattern: '{type}',
        date_prefix: true,
      },
    };

    const adapter = new VitePressAdapter(config);
    const result = await adapter.sync(content as never);

    spinner.stop();
    return result.path;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

/**
 * 创建模拟 AI 服务
 */
function createMockAIService(): AIService {
  return {
    generate: async () => {
      return `# 更新日志

## 新功能

- ✨ 添加新功能

## 修复

- 🐛 修复问题
`;
    },
  } as unknown as AIService;
}
