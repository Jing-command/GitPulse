/**
 * 请求日志中间件
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 请求日志中间件
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // 设置请求 ID
  res.setHeader('X-Request-Id', requestId);

  // 请求开始日志
  console.log(`[${new Date().toISOString()}] ${requestId} -> ${req.method} ${req.path}`);

  // 响应结束时记录
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${requestId} <- ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}
