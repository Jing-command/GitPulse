/**
 * GitPulse GitHub Action 入口
 * 自动分析 Git 提交，生成更新日志、技术博客和文档
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { simpleGit, SimpleGit } from 'simple-git';

/**
 * Action 主函数
 */
async function run(): Promise<void> {
  try {
    // 获取输入参数
    const from = core.getInput('from');
    const to = core.getInput('to');
    const type = core.getInput('type');
    const language = core.getInput('language');
    const output = core.getInput('output');
    const commitMessage = core.getInput('commit-message');

    // 输出配置信息
    core.info('GitPulse GitHub Action 启动');
    core.info(`从 ${from} 到 ${to}`);
    core.info(`内容类型: ${type}`);
    core.info(`语言: ${language}`);
    core.info(`输出目录: ${output}`);

    // 获取仓库信息
    const context = github.context;
    const repo = context.repo;
    const sha = context.sha;

    core.info(`仓库: ${repo.owner}/${repo.repo}`);
    core.info(`当前 SHA: ${sha}`);

    // 初始化 Git 客户端
    const git: SimpleGit = simpleGit();

    // 获取 commit 列表
    core.info('正在获取 commit 列表...');
    const log = await git.log({ from, to });
    core.info(`找到 ${log.total} 个 commits`);

    // 检查是否有 commits
    if (log.total === 0) {
      core.warning('没有找到 commits，跳过生成');
      core.setOutput('files-generated', '0');
      return;
    }

    // TODO: 调用 GitPulse 核心功能生成文档
    // 这里需要实现实际的文档生成逻辑
    core.info('正在生成文档...');

    // 模拟生成结果
    const filesGenerated = 1;
    core.info(`生成了 ${filesGenerated} 个文件`);

    // 提交更改
    core.info('正在提交更改...');
    await git.add(output);
    await git.commit(commitMessage);
    await git.push();

    // 设置输出
    core.setOutput('files-generated', filesGenerated.toString());
    core.setOutput('output-path', output);

    core.info('GitPulse GitHub Action 完成');
  } catch (error) {
    // 错误处理
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error occurred');
    }
  }
}

// 执行 Action
run();
