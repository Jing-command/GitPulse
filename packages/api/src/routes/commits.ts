/**
 * Commits 路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

export const commitsRouter = Router();

// 所有 commits 路由都需要认证
commitsRouter.use(authMiddleware);

// 分页查询参数
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  project_id: z.string(),
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

      // TODO: 从数据库获取 commit 列表

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: [
            {
              id: 'commit_1',
              project_id,
              hash: 'abc123def456',
              message: 'feat: 添加新功能',
              author: 'Developer',
              author_email: 'developer@example.com',
              impact_level: 'minor',
              timestamp: new Date().toISOString(),
            },
          ],
          total: 1,
          page,
          per_page,
          total_pages: 1,
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
 * 获取 commit 详情
 * GET /api/v1/commits/:hash
 */
commitsRouter.get(
  '/:hash',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { hash } = req.params;

      // TODO: 从数据库获取 commit 详情

      res.json({
        code: 0,
        message: 'success',
        data: {
          commit: {
            id: 'commit_1',
            project_id: 'project_1',
            hash,
            message: 'feat: 添加新功能\n\n- 功能 1\n- 功能 2',
            author: 'Developer',
            author_email: 'developer@example.com',
            impact_level: 'minor',
            summary: {
              type: 'feature',
              scope: ['core'],
              keywords: ['新功能'],
              breaking: false,
            },
            changes: [],
            timestamp: new Date().toISOString(),
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
