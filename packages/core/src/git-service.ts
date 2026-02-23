/**
 * Git 服务
 * 提供 Git 仓库操作功能
 */

import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Commit 信息
 */
export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  author_email: string;
  date: string;
  body: string;
}

/**
 * 分支信息
 */
export interface BranchInfo {
  name: string;
  current: boolean;
  commit: string;
  label: string;
}

/**
 * Git 服务类
 */
export class GitService {
  private baseDir: string;
  private cloneLocks: Map<string, Promise<string>>;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || join(tmpdir(), 'gitpulse-repos');
    this.cloneLocks = new Map();
  }

  /**
   * 获取仓库的所有分支
   * @param repoPath 本地仓库路径
   * @returns 分支列表
   */
  async getBranches(repoPath: string): Promise<BranchInfo[]> {
    const git = simpleGit(repoPath);
    const branchSummary = await git.branch(['-a']);

    return branchSummary.all.map((name) => ({
      name,
      current: branchSummary.current === name,
      commit: '',
      label: name.replace('remotes/origin/', ''),
    }));
  }

  /**
   * 切换到指定分支
   * @param repoPath 本地仓库路径
   * @param branchName 分支名称
   */
  async checkoutBranch(repoPath: string, branchName: string): Promise<void> {
    const git = simpleGit(repoPath);

    // 如果是远程分支，先获取
    if (branchName.startsWith('remotes/')) {
      const localName = branchName.replace('remotes/origin/', '');
      await git.checkout(['-b', localName, branchName]);
    } else {
      await git.checkout(branchName);
    }
  }

  /**
   * 克隆或更新仓库（带锁，防止并发克隆同一仓库）
   * @param repoUrl 仓库地址
   * @param projectId 项目 ID
   * @returns 本地仓库路径
   */
  async cloneRepository(repoUrl: string, projectId: string): Promise<string> {
    // 检查是否已有进行中的克隆操作
    const existingLock = this.cloneLocks.get(projectId);
    if (existingLock) {
      return existingLock;
    }

    // 创建新的克隆操作
    const clonePromise = this.doCloneRepository(repoUrl, projectId);
    this.cloneLocks.set(projectId, clonePromise);

    try {
      const result = await clonePromise;
      return result;
    } finally {
      this.cloneLocks.delete(projectId);
    }
  }

  /**
   * 实际执行克隆或更新
   */
  private async doCloneRepository(repoUrl: string, projectId: string): Promise<string> {
    const localPath = join(this.baseDir, projectId);

    // 确保目录存在
    await fs.mkdir(this.baseDir, { recursive: true });

    // 检查是否已存在有效的 git 仓库
    try {
      await fs.access(join(localPath, '.git'));
      // 目录已存在且是 git 仓库，执行 fetch 并更新到最新
      const git = simpleGit(localPath);
      await git.fetch(['--all']);
      // 重置到远程主分支的最新状态
      try {
        await git.reset(['--hard', 'origin/main']);
      } catch {
        // 如果 origin/main 不存在，尝试 origin/master
        try {
          await git.reset(['--hard', 'origin/master']);
        } catch {
          // 忽略错误，可能远程分支名不同
        }
      }
      return localPath;
    } catch {
      // 目录不存在或不是有效的 git 仓库，需要克隆
    }

    // 如果目录存在但不是有效的 git 仓库，先删除
    try {
      await fs.access(localPath);
      await fs.rm(localPath, { recursive: true, force: true });
    } catch {
      // 目录不存在，忽略
    }

    // 克隆仓库（完整历史）
    const git = simpleGit();
    await git.clone(repoUrl, localPath);

    return localPath;
  }

  /**
   * 获取仓库的 commit 列表
   * @param repoPath 本地仓库路径
   * @param from 起始 commit（可选）
   * @param to 结束 commit（可选）
   * @returns Commit 列表
   */
  async getCommits(
    repoPath: string,
    from?: string,
    to?: string
  ): Promise<CommitInfo[]> {
    const git = simpleGit(repoPath);

    // 如果指定了 from，先检查该 commit 是否存在
    if (from) {
      try {
        await git.show([from, '--quiet']);
      } catch {
        console.log(`[GitPulse] Commit ${from} 不存在于当前仓库，回退到全量分析`);
        from = undefined;
      }
    }

    // 构建日志范围
    let range: string | undefined = undefined;
    if (from && to) {
      range = `${from}..${to}`;
    } else if (from) {
      range = `${from}..HEAD`;
    } else if (to) {
      range = to;
    }

    const logOptions: any = {
      format: {
        hash: '%H',
        message: '%s',
        author: '%an',
        author_email: '%ae',
        date: '%ai',
        body: '%b',
      },
    };

    // 如果指定了范围，使用 git.log([range]) 语法
    let log;
    if (range) {
      log = await git.log([range]);
      // 如果范围查询返回空，可能是 commit 不在当前分支历史中，回退到全量查询
      if (log.total === 0) {
        console.log(`[GitPulse] 范围查询 ${range} 返回空，回退到全量分析`);
        log = await git.log(logOptions);
      }
    } else {
      log = await git.log(logOptions);
    }

    return log.all.map((commit: any) => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name || commit.author,
      author_email: commit.author_email,
      date: commit.date,
      body: commit.body || '',
    }));
  }

  /**
   * 获取 commit 的 diff
   * @param repoPath 本地仓库路径
   * @param hash Commit hash
   * @returns Diff 内容
   */
  async getDiff(repoPath: string, hash: string): Promise<string> {
    const git = simpleGit(repoPath);
    const diff = await git.show([hash, '--patch', '--no-color']);
    return diff;
  }

  /**
   * 获取两个 commit 之间的 diff
   * @param repoPath 本地仓库路径
   * @param from 起始 commit
   * @param to 结束 commit
   * @returns Diff 内容
   */
  async getDiffRange(repoPath: string, from: string, to: string): Promise<string> {
    const git = simpleGit(repoPath);
    const diff = await git.diff([`${from}..${to}`]);
    return diff;
  }

  /**
   * 获取仓库的最新 commit hash
   * @param repoPath 本地仓库路径
   * @returns 最新 commit hash
   */
  async getLatestCommit(repoPath: string): Promise<string> {
    const git = simpleGit(repoPath);
    const log = await git.log({ maxCount: 1 });
    return log.latest?.hash || '';
  }

  /**
   * 清理仓库
   * @param projectId 项目 ID
   */
  async cleanup(projectId: string): Promise<void> {
    const localPath = join(this.baseDir, projectId);
    try {
      await fs.access(localPath);
      await fs.rm(localPath, { recursive: true, force: true });
    } catch {
      // 目录不存在，忽略
    }
  }
}

// 导出单例
export const gitService = new GitService();
