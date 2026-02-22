/**
 * 项目路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { gitService } from '@gitpulse/core';
import { authMiddleware } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const projectsRouter = Router();

// 所有项目路由都需要认证
projectsRouter.use(authMiddleware);

// 创建项目请求体验证
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  repo_url: z.string().url(),
  status: z.enum(['active', 'inactive']).optional(),
  config: z.record(z.unknown()).optional(),
});

// 更新项目请求体验证
const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  repo_url: z.string().url().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  config: z.record(z.unknown()).optional(),
});

// 分页查询参数
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * 获取项目列表
 * GET /api/v1/projects
 */
projectsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, per_page } = paginationSchema.parse(req.query);
      const skip = (page - 1) * per_page;

      const [projects, total] = await Promise.all([
        prisma.projects.findMany({
          skip,
          take: per_page,
          orderBy: { updated_at: 'desc' },
          include: {
            _count: {
              select: {
                commits: true,
                contents: true,
              },
            },
          },
        }),
        prisma.projects.count(),
      ]);

      const total_pages = Math.ceil(total / per_page);

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: projects.map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            repo_url: project.repo_url,
            status: project.status,
            avatar_index: project.avatar_index,
            config: project.config,
            commits_count: project._count.commits,
            contents_count: project._count.contents,
            created_at: project.created_at.toISOString(),
            updated_at: project.updated_at.toISOString(),
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
 * 获取项目详情
 * GET /api/v1/projects/:id
 */
projectsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const [project, commitsCount, contentsCount] = await Promise.all([
        prisma.projects.findUnique({
          where: { id },
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        }),
        prisma.commits.count({ where: { project_id: id } }),
        prisma.contents.count({ where: { project_id: id } }),
      ]);

      if (!project) {
        res.status(404).json({
          code: 404,
          message: 'Project not found',
          user_message: '项目不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            repo_url: project.repo_url,
            config: project.config,
            commits_count: commitsCount,
            contents_count: contentsCount,
            members: project.members.map((member) => ({
              id: member.id,
              role: member.role,
              user: {
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                avatar_url: member.user.avatar_url,
              },
            })),
            created_at: project.created_at.toISOString(),
            updated_at: project.updated_at.toISOString(),
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

/**
 * 获取随机未使用的头像索引
 * @param prisma PrismaClient 实例
 * @returns 0-29 之间未使用的头像索引
 */
async function getRandomAvatarIndex(prisma: PrismaClient): Promise<number> {
  // 获取已使用的头像索引
  const usedIndices = await prisma.projects.findMany({
    select: { avatar_index: true },
    distinct: ['avatar_index'],
  });
  const usedSet = new Set(usedIndices.map((p) => p.avatar_index));

  // 找到所有未使用的索引
  const availableIndices: number[] = [];
  for (let i = 0; i < 30; i++) {
    if (!usedSet.has(i)) {
      availableIndices.push(i);
    }
  }

  // 如果有未使用的，随机选择一个
  if (availableIndices.length > 0) {
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }

  // 如果都使用了，随机返回 0-29
  return Math.floor(Math.random() * 30);
}

/**
 * 创建项目
 * POST /api/v1/projects
 */
projectsRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createProjectSchema.parse(req.body);

      // 获取当前用户ID
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: 'Unauthorized',
          user_message: '请先登录',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 获取随机头像索引
      const avatarIndex = await getRandomAvatarIndex(prisma);

      const project = await prisma.projects.create({
        data: {
          name: data.name,
          description: data.description,
          repo_url: data.repo_url,
          status: data.status || 'active',
          avatar_index: avatarIndex,
          config: (data.config || {}) as Prisma.InputJsonValue,
          members: {
            create: {
              user_id: userId,
              role: 'owner',
            },
          },
        },
      });

      // 异步获取并缓存项目的所有 commit
      syncProjectCommits(project.id, data.repo_url);

      res.status(201).json({
        code: 0,
        message: 'success',
        data: {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            repo_url: project.repo_url,
            status: project.status,
            avatar_index: project.avatar_index,
            config: project.config,
            created_at: project.created_at.toISOString(),
            updated_at: project.updated_at.toISOString(),
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

/**
 * 同步项目的所有 commit 到数据库
 */
async function syncProjectCommits(projectId: string, repoUrl: string): Promise<void> {
  try {
    console.log(`[GitPulse] 开始同步项目 ${projectId} 的 commits`);

    // 克隆仓库
    const repoPath = await gitService.cloneRepository(repoUrl, projectId);
    console.log(`[GitPulse] 仓库克隆完成: ${repoPath}`);

    // 获取所有 commits
    const commits = await gitService.getCommits(repoPath);
    console.log(`[GitPulse] 获取到 ${commits.length} 个 commits`);

    // 保存到数据库
    let savedCount = 0;
    for (const commit of commits) {
      try {
        // 检查 commit 是否已存在
        const existing = await prisma.commits.findUnique({
          where: { hash: commit.hash },
        });

        if (existing) {
          continue;
        }

        // 保存到数据库
        await prisma.commits.create({
          data: {
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            timestamp: new Date(commit.date),
            impact_level: 'patch', // 默认级别
            summary: {}, // 空摘要，后续分析时再填充
            project_id: projectId,
          },
        });
        savedCount++;
      } catch (err) {
        console.error(`[GitPulse] 保存 commit ${commit.hash} 失败:`, err);
      }
    }

    console.log(`[GitPulse] 项目 ${projectId} 同步完成，新增 ${savedCount} 个 commits`);
  } catch (error) {
    console.error(`[GitPulse] 同步项目 ${projectId} 失败:`, error);
  }
}

/**
 * 更新项目
 * POST /api/v1/projects/:id
 */
projectsRouter.post(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = updateProjectSchema.parse(req.body);

      const project = await prisma.projects.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.repo_url && { repo_url: data.repo_url }),
          ...(data.config && { config: data.config as Prisma.InputJsonValue }),
        },
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            repo_url: project.repo_url,
            config: project.config,
            updated_at: project.updated_at.toISOString(),
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

/**
 * 删除项目
 * DELETE /api/v1/projects/:id
 */
projectsRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await prisma.projects.delete({
        where: { id },
      });

      res.json({
        code: 0,
        message: 'success',
        data: null,
        request_id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 获取项目分支列表
 * GET /api/v1/projects/:id/branches
 */
projectsRouter.get(
  '/:id/branches',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const project = await prisma.projects.findUnique({
        where: { id },
      });

      if (!project) {
        res.status(404).json({
          code: 404,
          message: 'Project not found',
          user_message: '项目不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!project.repo_url) {
        res.status(400).json({
          code: 400,
          message: 'Project has no repository URL',
          user_message: '项目未配置仓库地址',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 克隆或更新仓库
      const repoPath = await gitService.cloneRepository(project.repo_url, id);

      // 获取分支列表
      const branches = await gitService.getBranches(repoPath);

      res.json({
        code: 0,
        message: 'success',
        data: {
          branches: branches.map((b) => ({
            name: b.name,
            label: b.label,
            current: b.current,
          })),
        },
        request_id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// 提交历史查询参数
const commitsQuerySchema = z.object({
  branch: z.string().default('main'),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(0).max(10000).default(100),
});

/**
 * 获取项目提交历史（优先从数据库缓存获取）
 * GET /api/v1/projects/:id/git-commits
 */
projectsRouter.get(
  '/:id/git-commits',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { page, per_page } = commitsQuerySchema.parse(req.query);

      const project = await prisma.projects.findUnique({
        where: { id },
      });

      if (!project) {
        res.status(404).json({
          code: 404,
          message: 'Project not found',
          user_message: '项目不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!project.repo_url) {
        res.status(400).json({
          code: 400,
          message: 'Project has no repository URL',
          user_message: '项目未配置仓库地址',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 从数据库获取缓存的 commits
      const skip = (page - 1) * per_page;
      const total = await prisma.commits.count({ where: { project_id: id } });

      // 如果 per_page 为 0，获取所有 commits
      const commits = await prisma.commits.findMany({
        where: { project_id: id },
        skip: per_page === 0 ? undefined : skip,
        take: per_page === 0 ? undefined : per_page,
        orderBy: { timestamp: 'desc' },
      });

      const total_pages = per_page === 0 ? 1 : Math.ceil(total / per_page);

      // 如果数据库中没有 commits，触发同步
      if (total === 0) {
        // 异步同步 commits，不等待完成
        syncProjectCommits(id, project.repo_url);
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: commits.map((commit) => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            date: commit.timestamp.toISOString(),
          })),
          total,
          page,
          per_page,
          total_pages,
          branch: 'main',
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
 * 同步项目 commits（从 GitHub 拉取最新）
 * POST /api/v1/projects/:id/sync
 */
projectsRouter.post(
  '/:id/sync',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const project = await prisma.projects.findUnique({
        where: { id },
      });

      if (!project) {
        res.status(404).json({
          code: 404,
          message: 'Project not found',
          user_message: '项目不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!project.repo_url) {
        res.status(400).json({
          code: 400,
          message: 'Project has no repository URL',
          user_message: '项目未配置仓库地址',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 异步执行同步
      syncProjectCommits(id, project.repo_url);

      res.json({
        code: 0,
        message: 'success',
        data: {
          status: 'syncing',
          message: '同步任务已启动',
        },
        request_id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);
