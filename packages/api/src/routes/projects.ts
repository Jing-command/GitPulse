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
 * 只返回当前用户有权限的项目
 */
projectsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, per_page } = paginationSchema.parse(req.query);
      const skip = (page - 1) * per_page;

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

      // 查询当前用户有权限的项目（通过 project_members 关联表）
      const [projects, total] = await Promise.all([
        prisma.projects.findMany({
          where: {
            members: {
              some: {
                user_id: userId,
              },
            },
          },
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
        prisma.projects.count({
          where: {
            members: {
              some: {
                user_id: userId,
              },
            },
          },
        }),
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
 * 只返回当前用户有权限的项目
 */
projectsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
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

      const [project, commitsCount, contentsCount] = await Promise.all([
        prisma.projects.findUnique({
          where: {
            id,
            members: {
              some: {
                user_id: userId,
              },
            },
          },
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
          user_message: '项目不存在或无权限访问',
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
        // 检查 commit 是否已存在于当前项目（hash 按项目隔离）
        const existing = await prisma.commits.findFirst({
          where: {
            hash: commit.hash,
            project_id: projectId,
          },
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
 * 检查用户是否有项目管理权限（owner 或 admin）
 */
async function checkProjectPermission(
  projectId: string,
  userId: string
): Promise<{ hasPermission: boolean; role: string | null }> {
  const member = await prisma.project_members.findUnique({
    where: {
      project_id_user_id: {
        project_id: projectId,
        user_id: userId,
      },
    },
  });

  if (!member) {
    return { hasPermission: false, role: null };
  }

  const canManage = member.role === 'owner' || member.role === 'admin';
  return { hasPermission: canManage, role: member.role };
}

/**
 * 更新项目
 * POST /api/v1/projects/:id
 * 只有 owner 或 admin 可以更新
 */
projectsRouter.post(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
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

      // 检查权限
      const { hasPermission } = await checkProjectPermission(id, userId);
      if (!hasPermission) {
        res.status(403).json({
          code: 403,
          message: 'Forbidden',
          user_message: '您没有权限更新此项目',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

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
 * 检查用户是否是项目 owner
 */
async function checkProjectOwner(
  projectId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.project_members.findUnique({
    where: {
      project_id_user_id: {
        project_id: projectId,
        user_id: userId,
      },
    },
  });

  return member?.role === 'owner';
}

/**
 * 删除项目
 * DELETE /api/v1/projects/:id
 * 只有 owner 可以删除
 */
projectsRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
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

      // 检查是否是 owner
      const isOwner = await checkProjectOwner(id, userId);
      if (!isOwner) {
        res.status(403).json({
          code: 403,
          message: 'Forbidden',
          user_message: '只有项目所有者可以删除项目',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

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
 * 检查用户是否是项目成员
 */
async function checkProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.project_members.findUnique({
    where: {
      project_id_user_id: {
        project_id: projectId,
        user_id: userId,
      },
    },
  });

  return !!member;
}

/**
 * 获取项目分支列表
 * GET /api/v1/projects/:id/branches
 * 只返回当前用户有权限的项目
 */
projectsRouter.get(
  '/:id/branches',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
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

      // 检查是否是项目成员
      const isMember = await checkProjectMember(id, userId);
      if (!isMember) {
        res.status(403).json({
          code: 403,
          message: 'Forbidden',
          user_message: '您没有权限访问此项目',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

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
 * 只返回当前用户有权限的项目
 */
projectsRouter.get(
  '/:id/git-commits',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
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

      // 检查是否是项目成员
      const isMember = await checkProjectMember(id, userId);
      if (!isMember) {
        res.status(403).json({
          code: 403,
          message: 'Forbidden',
          user_message: '您没有权限访问此项目',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

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
 * 项目成员均可同步（viewer 也可以拉取最新数据）
 */
projectsRouter.post(
  '/:id/sync',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
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

      // 检查是否是项目成员（所有成员都可以同步）
      const isMember = await checkProjectMember(id, userId);
      if (!isMember) {
        res.status(403).json({
          code: 403,
          message: 'Forbidden',
          user_message: '您没有权限同步此项目',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

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
