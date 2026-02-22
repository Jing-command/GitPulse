/**
 * 用户路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const usersRouter = Router();

// 所有用户路由都需要认证
usersRouter.use(authMiddleware);

// 分页查询参数
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * 获取用户列表
 * GET /api/v1/users
 */
usersRouter.get(
  '/',
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, per_page } = paginationSchema.parse(req.query);
      const skip = (page - 1) * per_page;

      // 从数据库获取用户列表
      const [users, total] = await Promise.all([
        prisma.users.findMany({
          skip,
          take: per_page,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar_url: true,
            created_at: true,
          },
        }),
        prisma.users.count(),
      ]);

      const total_pages = Math.ceil(total / per_page);

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar_url: user.avatar_url,
            created_at: user.created_at.toISOString(),
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
 * 获取用户详情
 * GET /api/v1/users/:id
 */
usersRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // 从数据库获取用户
      const user = await prisma.users.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar_url: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!user) {
        res.status(404).json({
          code: 404,
          message: 'User not found',
          user_message: '用户不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar_url: user.avatar_url,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
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

// 更新用户请求体验证
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional().nullable(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
});

/**
 * 更新用户信息
 * PUT /api/v1/users/:id
 */
usersRouter.put(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = updateUserSchema.parse(req.body);

      // 检查用户是否存在
      const existingUser = await prisma.users.findUnique({
        where: { id },
      });

      if (!existingUser) {
        res.status(404).json({
          code: 404,
          message: 'User not found',
          user_message: '用户不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 更新用户信息
      const user = await prisma.users.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
          ...(data.role && { role: data.role }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar_url: true,
          created_at: true,
          updated_at: true,
        },
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar_url: user.avatar_url,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
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
