/**
 * analyze 命令
 * 分析 Git commits 和代码变更
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { simpleGit, SimpleGit } from 'simple-git';
import { DiffParser, ChangeClassifier } from '@gitpulse/core';
import type { CommitAnalysis } from '@gitpulse/core';

// 创建 analyze 命令
export const analyzeCommand = new Command('analyze')
  .description('分析 Git commits 和代码变更')
  .option('--from <ref>', '起始引用（分支、标签、commit）', 'HEAD~10')
  .option('--to <ref>', '结束引用', 'HEAD')
  .option('--incremental', '增量分析（仅分析未处理的 commits）', false)
  .option('-o, --output <path>', '输出文件路径', '')
  .option('--json', '以 JSON 格式输出', false)
  .action(async (options) => {
    const spinner = ora('正在分析代码变更...').start();

    try {
      // 初始化 Git 客户端
      const git: SimpleGit = simpleGit(process.cwd());

      // 检查是否为 Git 仓库
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        spinner.fail(chalk.red('当前目录不是 Git 仓库'));
        process.exit(1);
      }

      // 获取 commit 列表
      spinner.text = '正在获取 commit 列表...';
      const log = await git.log({
        from: options.from,
        to: options.to,
      });

      if (log.total === 0) {
        spinner.fail(chalk.yellow('没有找到 commits'));
        return;
      }

      spinner.text = `正在分析 ${log.total} 个 commits...`;

      // 初始化分析器
      const diffParser = new DiffParser();
      const classifier = new ChangeClassifier();

      // 分析每个 commit
      const analyses: CommitAnalysis[] = [];

      for (const commit of log.all) {
        // 获取 diff
        const diff = await git.diff([`${commit.hash}^`, commit.hash]);

        // 解析 diff
        const changes = diffParser.parseDiff(diff);

        // 提取变更摘要
        const summary = diffParser.extractSummary(commit.message);

        // 构建 commit 分析结果
        const analysis: CommitAnalysis = {
          hash: commit.hash,
          message: commit.message,
          author: commit.author_name ?? 'Unknown',
          author_email: commit.author_email ?? '',
          timestamp: new Date(commit.date),
          changes,
          summary,
          impact_level: 'patch', // 稍后更新
        };

        // 计算影响级别
        analysis.impact_level = classifier.classifyImpactLevel(analysis);

        analyses.push(analysis);
      }

      spinner.succeed(chalk.green(`分析完成，共 ${analyses.length} 个 commits`));

      // 输出结果
      if (options.json) {
        console.log(JSON.stringify(analyses, null, 2));
      } else {
        printAnalysisResult(analyses);
      }
    } catch (error) {
      spinner.fail(chalk.red('分析失败'));
      console.error(error);
      process.exit(1);
    }
  });

/**
 * 打印分析结果
 * @param analyses 分析结果列表
 */
function printAnalysisResult(analyses: CommitAnalysis[]): void {
  console.log();
  console.log(chalk.bold('📊 分析结果\n'));

  // 统计信息
  const stats = {
    total: analyses.length,
    features: analyses.filter((a) => a.summary.type === 'feature').length,
    fixes: analyses.filter((a) => a.summary.type === 'fix').length,
    refactors: analyses.filter((a) => a.summary.type === 'refactor').length,
    docs: analyses.filter((a) => a.summary.type === 'docs').length,
    breaking: analyses.filter((a) => a.summary.breaking).length,
  };

  console.log(chalk.gray('统计:'));
  console.log(`  总计: ${stats.total} commits`);
  console.log(`  新功能: ${chalk.green(stats.features)}`);
  console.log(`  问题修复: ${chalk.yellow(stats.fixes)}`);
  console.log(`  代码重构: ${chalk.blue(stats.refactors)}`);
  console.log(`  文档更新: ${chalk.gray(stats.docs)}`);
  console.log(`  破坏性变更: ${chalk.red(stats.breaking)}`);
  console.log();

  // 详细列表
  console.log(chalk.gray('详细列表:'));
  console.log();

  for (const analysis of analyses) {
    const typeEmoji = getTypeEmoji(analysis.summary.type);
    const levelColor = getLevelColor(analysis.impact_level);
    const breakingTag = analysis.summary.breaking ? chalk.red(' [破坏性]') : '';

    console.log(
      `  ${typeEmoji} ${chalk.gray(analysis.hash.substring(0, 7))} ` +
        `${levelColor(`[${analysis.impact_level}]`)} ` +
        `${analysis.message.split('\n')[0]}${breakingTag}`
    );

    // 显示文件变更
    if (analysis.changes.length > 0) {
      const fileCount = analysis.changes.length;
      const added = analysis.changes.filter((c) => c.type === 'add').length;
      const modified = analysis.changes.filter((c) => c.type === 'modify').length;
      const deleted = analysis.changes.filter((c) => c.type === 'delete').length;

      console.log(
        chalk.gray(
          `      ${fileCount} 文件: +${added} ~${modified} -${deleted}`
        )
      );
    }
  }
}

/**
 * 获取变更类型 emoji
 * @param type 变更类型
 * @returns emoji
 */
function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    feature: '✨',
    fix: '🐛',
    refactor: '♻️',
    docs: '📝',
    test: '✅',
    chore: '🔧',
  };
  return emojis[type] ?? '📦';
}

/**
 * 获取影响级别颜色
 * @param level 影响级别
 * @returns chalk 函数
 */
function getLevelColor(level: string) {
  const colors: Record<string, (text: string) => string> = {
    major: chalk.red,
    minor: chalk.yellow,
    patch: chalk.green,
  };
  return colors[level] ?? chalk.gray;
}
