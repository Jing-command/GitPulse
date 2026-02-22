/**
 * status 命令
 * 查看项目状态和统计信息
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { simpleGit, SimpleGit } from 'simple-git';
import { existsSync } from 'fs';
import { join } from 'path';

// 创建 status 命令
export const statusCommand = new Command('status')
  .description('查看项目状态和统计信息')
  .option('-v, --verbose', '显示详细信息', false)
  .action(async (options) => {
    console.log(chalk.bold('\n📊 GitPulse 项目状态\n'));

    try {
      // 检查 Git 状态
      await printGitStatus(options.verbose);

      // 检查配置文件
      await printConfigStatus();

      // 检查文档状态
      await printDocsStatus(options.verbose);
    } catch (error) {
      console.error(chalk.red('获取状态失败:'), error);
      process.exit(1);
    }
  });

/**
 * 打印 Git 状态
 * @param verbose 是否显示详细信息
 */
async function printGitStatus(verbose: boolean): Promise<void> {
  console.log(chalk.cyan('Git 状态:'));

  try {
    const git: SimpleGit = simpleGit(process.cwd());
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      console.log(chalk.yellow('  ⚠ 当前目录不是 Git 仓库'));
      return;
    }

    // 获取当前分支
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    console.log(`  当前分支: ${chalk.green(branch.trim())}`);

    // 获取状态
    const status = await git.status();
    if (status.files.length > 0) {
      console.log(`  未提交的更改: ${chalk.yellow(status.files.length)} 个文件`);
      if (verbose) {
        for (const file of status.files.slice(0, 5)) {
          console.log(chalk.gray(`    - ${file.path}`));
        }
        if (status.files.length > 5) {
          console.log(chalk.gray(`    ... 还有 ${status.files.length - 5} 个文件`));
        }
      }
    } else {
      console.log('  工作区状态: ' + chalk.green('干净'));
    }

    // 获取最近的 commit
    const log = await git.log({ maxCount: 1 });
    if (log.latest) {
      console.log(`  最近提交: ${chalk.gray(log.latest.hash.substring(0, 7))} ${log.latest.message.split('\n')[0]}`);
    }
  } catch (error) {
    console.log(chalk.red('  ✗ 无法获取 Git 状态'));
  }

  console.log();
}

/**
 * 打印配置状态
 */
async function printConfigStatus(): Promise<void> {
  console.log(chalk.cyan('配置状态:'));

  const configPath = join(process.cwd(), '.gitpulserc.yaml');
  if (existsSync(configPath)) {
    console.log('  配置文件: ' + chalk.green('已配置'));
    console.log(chalk.gray(`    路径: ${configPath}`));
  } else {
    console.log('  配置文件: ' + chalk.yellow('未配置'));
    console.log(chalk.gray('    运行 gitpulse init 创建配置文件'));
  }

  // 检查环境变量
  const envVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
  const configured = envVars.filter((v) => process.env[v]);

  if (configured.length > 0) {
    console.log(`  AI 服务: ${chalk.green('已配置')} (${configured.length}/${envVars.length})`);
  } else {
    console.log('  AI 服务: ' + chalk.yellow('未配置'));
    console.log(chalk.gray('    设置环境变量以启用 AI 功能'));
  }

  console.log();
}

/**
 * 打印文档状态
 * @param verbose 是否显示详细信息
 */
async function printDocsStatus(verbose: boolean): Promise<void> {
  console.log(chalk.cyan('文档状态:'));

  const docsPath = join(process.cwd(), 'docs');
  if (existsSync(docsPath)) {
    console.log('  文档目录: ' + chalk.green('存在'));
    console.log(chalk.gray(`    路径: ${docsPath}`));

    // 检查 VitePress 配置
    const vitepressPath = join(docsPath, '.vitepress');
    if (existsSync(vitepressPath)) {
      console.log('  VitePress: ' + chalk.green('已配置'));
    } else {
      console.log('  VitePress: ' + chalk.yellow('未配置'));
    }
  } else {
    console.log('  文档目录: ' + chalk.yellow('不存在'));
    console.log(chalk.gray('    运行 gitpulse sync 创建文档目录'));
  }

  console.log();
}
