#!/usr/bin/env node
/**
 * GitPulse CLI 入口
 * 技术内容自动化生成命令行工具
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { analyzeCommand } from './commands/analyze';
import { generateCommand } from './commands/generate';
import { syncCommand } from './commands/sync';
import { runCommand } from './commands/run';
import { statusCommand } from './commands/status';
import { configCommand } from './commands/config';
import { serverCommand } from './commands/server';

// 创建 CLI 程序
const program = new Command();

// 设置基本信息
program
  .name('gitpulse')
  .description('技术内容全自动流水线 - 深度解析 Git 代码变更，自动生成更新日志、技术博客和文档')
  .version('1.0.0')
  .option('-d, --debug', '启用调试模式', false)
  .option('-c, --config <path>', '指定配置文件路径', '.gitpulserc.yaml');

// 注册命令
program
  .addCommand(initCommand)
  .addCommand(analyzeCommand)
  .addCommand(generateCommand)
  .addCommand(syncCommand)
  .addCommand(runCommand)
  .addCommand(statusCommand)
  .addCommand(configCommand)
  .addCommand(serverCommand);

// 错误处理
program.exitOverride((err) => {
  if (err.code === 'commander.help' || err.code === 'commander.version') {
    process.exit(0);
  }
  if (err.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  console.error(chalk.red(`错误: ${err.message}`));
  process.exit(1);
});

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
