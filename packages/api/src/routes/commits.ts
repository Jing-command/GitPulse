/**
 * Commits 路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { gitService, DiffParser, ChangeClassifier } from '@gitpulse/core';
import { authMiddleware } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const commitsRouter = Router();

// 所有 commits 路由都需要认证
commitsRouter.use(authMiddleware);

// 分页查询参数
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  project_id: z.string(),
});

// 分析 commits 请求参数
const analyzeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  incremental: z.boolean().default(true),
});

/**
 * 获取 commit 列表
 * GET /api/v1/commits
 */
commitsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, per_page, project_id } = paginationSchema.parse(req.query);
      const skip = (page - 1) * per_page;

      // 从数据库获取 commit 列表
      const [commits, total] = await Promise.all([
        prisma.commits.findMany({
          where: { project_id },
          skip,
          take: per_page,
          orderBy: { timestamp: 'desc' },
        }),
        prisma.commits.count({ where: { project_id } }),
      ]);

      const total_pages = Math.ceil(total / per_page);

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: commits.map((commit) => ({
            id: commit.id,
            project_id: commit.project_id,
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            impact_level: commit.impact_level,
            summary: commit.summary,
            timestamp: commit.timestamp.toISOString(),
          })),
          total,
          page,
          per_page,
          total_pages,
        },
        request_id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 触发 Commit 分析
 * POST /api/v1/commits/analyze
 */
commitsRouter.post(
  '/analyze',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project_id } = req.query as { project_id: string };
      if (!project_id) {
        res.status(400).json({
          code: 10001,
          message: '缺少 project_id 参数',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { from, to, incremental } = analyzeSchema.parse(req.body);

      // 获取项目信息
      const project = await prisma.projects.findUnique({
        where: { id: project_id },
      });

      if (!project) {
        res.status(404).json({
          code: 30002,
          message: '项目不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!project.repo_url) {
        res.status(400).json({
          code: 10001,
          message: '项目未配置仓库地址',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 异步执行分析任务
      analyzeCommits(project_id, project.repo_url, from, to, incremental);

      // 立即返回任务已创建响应
      res.json({
        code: 0,
        message: '分析任务已创建',
        data: {
          task_id: `analyze_${Date.now()}`,
          status: 'running',
          estimated_time: 60,
        },
        request_id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 分析 commits 并保存到数据库
 */
async function analyzeCommits(
  projectId: string,
  repoUrl: string,
  from?: string,
  to?: string,
  incremental?: boolean
): Promise<void> {
  try {
    console.log(`[GitPulse] 开始分析项目 ${projectId} 的 commits`);

    // 克隆仓库
    const repoPath = await gitService.cloneRepository(repoUrl, projectId);
    console.log(`[GitPulse] 仓库克隆完成: ${repoPath}`);

    // 如果是增量分析，获取上次分析的最后一个 commit
    let startFrom = from;
    if (incremental && !from) {
      const lastCommit = await prisma.commits.findFirst({
        where: { project_id: projectId },
        orderBy: { timestamp: 'desc' },
      });
      if (lastCommit) {
        startFrom = lastCommit.hash;
        console.log(`[GitPulse] 增量分析，从 ${startFrom} 开始`);
      }
    }

    // 获取 commits
    const commits = await gitService.getCommits(repoPath, startFrom, to);
    console.log(`[GitPulse] 获取到 ${commits.length} 个 commits`);

    // 分析每个 commit
    const diffParser = new DiffParser();
    const classifier = new ChangeClassifier();

    for (const commit of commits) {
      try {
        // 检查 commit 是否已存在
        const existing = await prisma.commits.findUnique({
          where: { hash: commit.hash },
        });

        if (existing) {
          console.log(`[GitPulse] Commit ${commit.hash} 已存在，跳过`);
          continue;
        }

        // 获取 diff
        const diffOutput = await gitService.getDiff(repoPath, commit.hash);

        // 解析 diff
        const fileChanges = diffParser.parseDiff(diffOutput);

        // 分类变更
        const summary = classifier.classify(commit.message, fileChanges);

        // 确定影响级别
        const impactLevel = determineImpactLevel(commit.message, fileChanges);

        // 保存到数据库
        await prisma.commits.create({
          data: {
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            timestamp: new Date(commit.date),
            impact_level: impactLevel,
            summary: summary as any,
            project_id: projectId,
          },
        });

        console.log(`[GitPulse] Commit ${commit.hash} 分析完成`);
      } catch (err) {
        console.error(`[GitPulse] 分析 commit ${commit.hash} 失败:`, err);
      }
    }

    console.log(`[GitPulse] 项目 ${projectId} 分析完成`);
  } catch (error) {
    console.error(`[GitPulse] 分析项目 ${projectId} 失败:`, error);
  }
}

/**
 * 确定影响级别
 */
function determineImpactLevel(
  message: string,
  changes: any[]
): 'major' | 'minor' | 'patch' {
  const lowerMessage = message.toLowerCase();

  // 检查破坏性变更标记
  if (
    lowerMessage.includes('breaking') ||
    lowerMessage.includes('break') ||
    lowerMessage.includes('!')
  ) {
    return 'major';
  }

  // 检查新功能
  if (
    lowerMessage.startsWith('feat') ||
    lowerMessage.includes('add') ||
    lowerMessage.includes('new')
  ) {
    return 'minor';
  }

  // 默认 patch
  return 'patch';
}

/**
 * 获取 commit 详情
 * GET /api/v1/commits/:hash
 */
commitsRouter.get(
  '/:hash',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { hash } = req.params;

      // 从数据库获取 commit 详情
      const commit = await prisma.commits.findUnique({
        where: { hash },
      });

      if (!commit) {
        res.status(404).json({
          code: 30003,
          message: 'Commit 不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          commit: {
            id: commit.id,
            project_id: commit.project_id,
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            impact_level: commit.impact_level,
            summary: commit.summary,
            timestamp: commit.timestamp.toISOString(),
          },
        },
        request_id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);
