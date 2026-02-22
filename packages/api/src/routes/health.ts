/**
 * 健康检查路由
 */

import { Router, Request, Response } from 'express';

export const healthRouter = Router();

/**
 * 健康检查
 * GET /api/v1/health
 */
healthRouter.get('/', (_req: Request, res: Response): void => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    request_id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
  });
});

/**
 * 就绪检查
 * GET /api/v1/health/ready
 */
healthRouter.get('/ready', (_req: Request, res: Response): void => {
  // TODO: 检查数据库连接
  res.json({
    code: 0,
    message: 'success',
    data: {
      ready: true,
    },
    request_id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
  });
});
