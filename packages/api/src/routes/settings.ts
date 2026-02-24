/**
 * 用户设置路由
 * 管理用户的 AI 配置等敏感信息（加密存储）
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@gitpulse/core';
import { encrypt, decrypt } from '@gitpulse/core';
import { authMiddleware } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// 所有设置路由都需要认证
router.use(authMiddleware);

/**
 * AI 配置接口
 */
interface AIConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
}

/**
 * 获取用户 AI 配置
 * GET /api/v1/settings/ai
 */
router.get(
  '/ai',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          code: 10001,
          message: '未登录',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const settings = await prisma.user_settings.findUnique({
        where: { user_id: userId },
      });

      if (!settings?.ai_config) {
        res.json({
          code: 0,
          message: 'success',
          data: null,
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 解密配置
      const config = settings.ai_config as Record<string, string>;
      const decryptedConfig: AIConfig = {
        provider: config.provider || 'yunwu',
        model: config.model || 'gemini-2.0-flash-exp',
        apiKey: config.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : '',
        baseUrl: config.baseUrl || 'https://api.yunwu.ai/v1',
      };

      res.json({
        code: 0,
        message: 'success',
        data: decryptedConfig,
        request_id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 保存用户 AI 配置
 * POST /api/v1/settings/ai
 */
router.post(
  '/ai',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          code: 10001,
          message: '未登录',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { provider, model, apiKey, baseUrl } = req.body;

      // 验证必填字段
      if (!provider || !model || !apiKey) {
        res.status(400).json({
          code: 10001,
          message: '缺少必填字段: provider, model, apiKey',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 加密 API Key
      const encryptedApiKey = encrypt(apiKey);

      // 保存到数据库
      await prisma.user_settings.upsert({
        where: { user_id: userId },
        update: {
          ai_config: {
            provider,
            model,
            apiKeyEncrypted: encryptedApiKey,
            baseUrl: baseUrl || 'https://api.yunwu.ai/v1',
          },
        },
        create: {
          user_id: userId,
          ai_config: {
            provider,
            model,
            apiKeyEncrypted: encryptedApiKey,
            baseUrl: baseUrl || 'https://api.yunwu.ai/v1',
          },
        },
      });

      res.json({
        code: 0,
        message: 'AI 配置已保存',
        data: {
          provider,
          model,
          baseUrl: baseUrl || 'https://api.yunwu.ai/v1',
          // 不返回 apiKey
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
 * 删除用户 AI 配置
 * DELETE /api/v1/settings/ai
 */
router.delete(
  '/ai',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          code: 10001,
          message: '未登录',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await prisma.user_settings.update({
        where: { user_id: userId },
        data: { ai_config: null },
      });

      res.json({
        code: 0,
        message: 'AI 配置已删除',
        data: null,
        request_id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
