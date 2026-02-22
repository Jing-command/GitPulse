/**
 * 用户路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

export const usersRouter = Router();

// 所有用户路由都需要认证
usersRouter.use(authMiddleware);

/**
 * 获取用户列表
 * GET /api/v1/users
 */
usersRouter.get(
  '/',
  adminMiddleware,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: 从数据库获取用户列表

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: [
            {
              id: 'user_1',
              email: 'admin@gitpulse.dev',
              name: 'Admin',
              role: 'admin',
              created_at: new Date().toISOString(),
            },
          ],
          total: 1,
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

      // TODO: 从数据库获取用户

      res.json({
        code: 0,
        message: 'success',
        data: {
          user: {
            id,
            email: 'user@example.com',
            name: 'User',
            role: 'viewer',
            created_at: new Date().toISOString(),
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
 * 更新用户信息
 * PUT /api/v1/users/:id
 */
usersRouter.put(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const body = req.body;

      // TODO: 更新用户信息

      res.json({
        code: 0,
        message: 'success',
        data: {
          user: {
            id,
            ...body,
            updated_at: new Date().toISOString(),
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
