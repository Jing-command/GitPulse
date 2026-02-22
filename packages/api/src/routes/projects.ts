/**
 * 项目路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const projectsRouter = Router();

// 所有项目路由都需要认证
projectsRouter.use(authMiddleware);

// 分页查询参数
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

// 创建项目 Schema
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  repo_url: z.string().url(),
  config: z.record(z.unknown()).optional(),
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

      // 从数据库获取项目列表
      const [projects, total] = await Promise.all([
        prisma.projects.findMany({
          skip,
          take: per_page,
          orderBy: { created_at: 'desc' },
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
          items: projects.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            repo_url: p.repo_url,
            config: p.config,
            commits_count: p._count.commits,
            contents_count: p._count.contents,
            created_at: p.created_at.toISOString(),
            updated_at: p.updated_at.toISOString(),
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
 * 创建项目
 * POST /api/v1/projects
 */
projectsRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createProjectSchema.parse(req.body);
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

      // 创建项目并添加当前用户为管理员
      const project = await prisma.projects.create({
        data: {
          name: body.name,
          description: body.description,
          repo_url: body.repo_url,
          config: body.config || {},
          members: {
            create: {
              user_id: userId,
              role: 'admin',
            },
          },
        },
      });

      res.status(201).json({
        code: 0,
        message: 'success',
        data: {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            repo_url: project.repo_url,
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
 * 获取项目详情
 * GET /api/v1/projects/:id
 */
projectsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const project = await prisma.projects.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar_url: true,
                },
              },
            },
          },
          _count: {
            select: {
              commits: true,
              contents: true,
            },
          },
        },
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
            commits_count: project._count.commits,
            contents_count: project._count.contents,
            members: project.members.map((m) => ({
              id: m.id,
              role: m.role,
              user: m.user,
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
 * 更新项目
 * PUT /api/v1/projects/:id
 */
projectsRouter.put(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const body = createProjectSchema.partial().parse(req.body);

      const project = await prisma.projects.update({
        where: { id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.repo_url && { repo_url: body.repo_url }),
          ...(body.config && { config: body.config }),
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
