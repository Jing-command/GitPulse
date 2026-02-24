/**
 * 日志路由
 * 提供日志查询和管理接口
 */

import { Router, Request, Response } from 'express';
import { logger, LogLevel } from '@gitpulse/core';

const router = Router();

/**
 * 获取日志列表
 * GET /api/v1/logs
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      level,
      module,
      startTime,
      endTime,
      limit = '100',
      offset = '0',
    } = req.query;

    const query = {
      ...(level && { level: level as LogLevel }),
      ...(module && { module: module as string }),
      ...(startTime && { startTime: new Date(startTime as string) }),
      ...(endTime && { endTime: new Date(endTime as string) }),
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    };

    const result = logger.query(query);

    res.json({
      code: 0,
      message: 'success',
      data: {
        logs: result.logs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
        })),
        total: result.total,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < result.total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取日志失败',
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 获取最近日志
 * GET /api/v1/logs/recent
 */
router.get('/recent', (req: Request, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    const logs = logger.getRecent(parseInt(limit as string, 10));

    res.json({
      code: 0,
      message: 'success',
      data: {
        logs: logs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取最近日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取最近日志失败',
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 获取日志统计
 * GET /api/v1/logs/stats
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = logger.getStats();

    res.json({
      code: 0,
      message: 'success',
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取日志统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取日志统计失败',
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 清空日志
 * POST /api/v1/logs/clear
 */
router.post('/clear', (req: Request, res: Response) => {
  try {
    logger.clear();

    res.json({
      code: 0,
      message: '日志已清空',
      data: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('清空日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '清空日志失败',
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
