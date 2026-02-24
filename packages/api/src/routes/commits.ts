/**
 * Commits 路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { gitService, DiffParser, ChangeClassifier, AIAnalyzer, logger, decrypt } from '@gitpulse/core';
import type { AIConfig } from '@gitpulse/core';
import { authMiddleware } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const commitsRouter = Router();

// 所有 commits 路由都需要认证
commitsRouter.use(authMiddleware);

// 分页查询参数
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  project_id: z.string(),
});

// 分析 commits 请求参数
const analyzeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  incremental: z.boolean().default(false),
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
      const skip = (page - 1) * per_page;

      // 从数据库获取 commit 列表
      const [commits, total] = await Promise.all([
        prisma.commits.findMany({
          where: { project_id },
          skip,
          take: per_page,
          orderBy: { timestamp: 'desc' },
        }),
        prisma.commits.count({ where: { project_id } }),
      ]);

      const total_pages = Math.ceil(total / per_page);

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: commits.map((commit) => ({
            id: commit.id,
            project_id: commit.project_id,
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            impact_level: commit.impact_level,
            summary: commit.summary,
            timestamp: commit.timestamp.toISOString(),
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
 * 触发 Commit 分析
 * POST /api/v1/commits/analyze
 */
commitsRouter.post(
  '/analyze',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project_id } = req.query as { project_id: string };
      if (!project_id) {
        res.status(400).json({
          code: 10001,
          message: '缺少 project_id 参数',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 打印原始请求体用于调试
      logger.info('Commits', `收到分析请求, project_id: ${project_id}`);
      logger.debug('Commits', '原始请求体', req.body);

      // 解析请求体，捕获 Zod 验证错误
      let parsedBody;
      try {
        parsedBody = analyzeSchema.parse(req.body);
      } catch (zodError) {
        console.error('[GitPulse] Zod 验证失败:', zodError);
        res.status(400).json({
          code: 10001,
          message: `请求参数验证失败: ${zodError instanceof Error ? zodError.message : '未知错误'}`,
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { from, to, incremental } = parsedBody;

      logger.info('Commits', 'Zod 解析成功');

      // 获取项目信息
      const project = await prisma.projects.findUnique({
        where: { id: project_id },
      });

      if (!project) {
        res.status(404).json({
          code: 30002,
          message: '项目不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!project.repo_url) {
        res.status(400).json({
          code: 10001,
          message: '项目未配置仓库地址',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 异步执行分析任务，AI 配置会从数据库读取
      analyzeCommits(project_id, project.repo_url, from, to, incremental, req.user?.id);

      // 立即返回任务已创建响应
      res.json({
        code: 0,
        message: '分析任务已创建',
        data: {
          task_id: `analyze_${Date.now()}`,
          status: 'running',
          estimated_time: 60,
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
 * 分析 commits 并保存到数据库
 * 集成 AI 智能分析，结合 commit message 和代码 diff 进行交叉验证
 */
async function analyzeCommits(
  projectId: string,
  repoUrl: string,
  from?: string,
  to?: string,
  incremental?: boolean,
  userId?: string
): Promise<void> {
  try {
    logger.info('Analyzer', `开始分析项目 ${projectId} 的 commits`, {
      repoUrl,
      incremental,
      userId,
      from,
      to,
    });

    // 克隆仓库
    const repoPath = await gitService.cloneRepository(repoUrl, projectId);
    logger.info('Analyzer', `仓库克隆完成: ${repoPath}`);

    // 如果不是增量分析（全量分析），删除该项目已有的所有 commits 数据
    if (!incremental) {
      const deleteResult = await prisma.commits.deleteMany({
        where: { project_id: projectId },
      });
      logger.info('Analyzer', `全量分析，已删除 ${deleteResult.count} 条旧数据`);
    }

    // 如果是增量分析，获取上次分析的最后一个 commit
    let startFrom = from;
    if (incremental && !from) {
      const lastCommit = await prisma.commits.findFirst({
        where: { project_id: projectId },
        orderBy: { timestamp: 'desc' },
      });
      if (lastCommit) {
        startFrom = lastCommit.hash;
        logger.info('Analyzer', `增量分析，从 ${startFrom} 开始`);
      }
    }

    // 获取 commits
    const commits = await gitService.getCommits(repoPath, startFrom, to);
    logger.info('Analyzer', `获取到 ${commits.length} 个 commits`);

    // 分析每个 commit
    const diffParser = new DiffParser();
    const classifier = new ChangeClassifier();

    // 从数据库加载用户 AI 配置
    const aiConfig = await loadUserAIConfig(userId);
    const aiAnalyzer = aiConfig ? new AIAnalyzer(aiConfig) : null;
    if (aiAnalyzer && aiConfig) {
      logger.info('Analyzer', `AI 分析器已启用: ${aiConfig.provider} (${aiConfig.model})`);
    }

    let analyzedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      try {
        // 检查 commit 是否已存在（使用复合唯一键）
        const existing = await prisma.commits.findFirst({
          where: { hash: commit.hash, project_id: projectId },
        });

        if (existing) {
          logger.debug('Analyzer', `Commit ${commit.hash.substring(0, 8)} 已存在，跳过`);
          skippedCount++;
          continue;
        }

        // AI 分析时添加延迟，避免触发 API 频率限制
        if (aiAnalyzer && i > 0) {
          const delay = 2000; // 每个 commit 之间等待 2 秒
          logger.debug('Analyzer', `等待 ${delay}ms 以避免 API 频率限制`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 获取 diff
        const diffOutput = await gitService.getDiff(repoPath, commit.hash);

        // 解析 diff
        const fileChanges = diffParser.parseDiff(diffOutput);

        // 本地规则分析
        const localSummary = classifier.classify(commit.message, fileChanges);

        // 确定影响级别
        const impactLevel = determineImpactLevel(commit.message, fileChanges);

        // AI 智能分析（如果配置了 AI）
        let aiSummary = null;
        if (aiAnalyzer) {
          try {
            logger.info('Analyzer', `正在使用 AI 分析 commit ${commit.hash.substring(0, 8)}`);
            const fileChangesSimple = fileChanges.map(f => ({
              path: f.path,
              type: f.type,
            }));
            aiSummary = await aiAnalyzer.analyze(commit.message, diffOutput, fileChangesSimple);
            if (aiSummary) {
              logger.info('Analyzer', `AI 分析完成: ${aiSummary.summary}`);
            }
          } catch (aiError) {
            logger.error('Analyzer', `AI 分析失败: ${commit.hash.substring(0, 8)}`, { error: String(aiError) });
          }
        }

        // 合并本地分析和 AI 分析结果
        // 优先使用 AI 的语义分析，但保留本地分析的技术细节
        const mergedSummary = {
          // 本地分析结果
          type: localSummary.type,
          breaking: localSummary.breaking,
          scope: localSummary.scope,
          keywords: localSummary.keywords,
          // AI 分析结果（如果有）
          ...(aiSummary && {
            semanticType: aiSummary.semanticType,
            techDomain: aiSummary.techDomain,
            codeQuality: aiSummary.codeQuality,
            impactScope: aiSummary.impactScope,
            aiSummary: aiSummary.summary,
            aiDescription: aiSummary.description,
            aiRisks: aiSummary.risks,
            aiSuggestions: aiSummary.suggestions,
            aiConfidence: aiSummary.confidence,
            batchInfo: aiSummary.batchInfo,
          }),
        };

        // 保存到数据库（使用 upsert 避免竞态条件导致的唯一约束冲突）
        await prisma.commits.upsert({
          where: {
            hash_project_id: {
              hash: commit.hash,
              project_id: projectId,
            },
          },
          update: {
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            timestamp: new Date(commit.date),
            impact_level: impactLevel,
            summary: mergedSummary as any,
          },
          create: {
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            timestamp: new Date(commit.date),
            impact_level: impactLevel,
            summary: mergedSummary as any,
            project_id: projectId,
          },
        });

        logger.info('Analyzer', `✅ Commit ${commit.hash.substring(0, 8)} 分析完成 ${aiSummary ? '(含AI分析)' : '(仅本地分析)'}`);
        analyzedCount++;
      } catch (err) {
        logger.error('Analyzer', `❌ 分析 commit ${commit.hash} 失败`, { error: String(err) });
        errorCount++;
      }
    }

    logger.info('Analyzer', `项目 ${projectId} 分析完成`, {
      total: commits.length,
      analyzed: analyzedCount,
      skipped: skippedCount,
      errors: errorCount,
    });
    console.log(`[GitPulse] 新分析: ${analyzedCount} 个`);
    console.log(`[GitPulse] 已存在跳过: ${skippedCount} 个`);
  } catch (error) {
    logger.error('Analyzer', `❌ 分析项目 ${projectId} 失败`, { error: String(error) });
  }
}

/**
 * 从数据库加载用户 AI 配置
 * @param userId 用户 ID
 * @returns AIConfig 或 null
 */
async function loadUserAIConfig(userId?: string): Promise<AIConfig | null> {
  if (!userId) {
    logger.warn('AIConfig', 'AI 未配置: 用户未登录');
    return null;
  }

  try {
    const settings = await prisma.user_settings.findUnique({
      where: { user_id: userId },
    });

    if (!settings?.ai_config) {
      logger.warn('AIConfig', 'AI 未配置: 请在前端设置页面配置 AI');
      return null;
    }

    const config = settings.ai_config as Record<string, string>;
    if (!config.apiKeyEncrypted) {
      logger.warn('AIConfig', 'AI 未配置: API Key 为空');
      return null;
    }

    // 解密 API Key
    const apiKey = decrypt(config.apiKeyEncrypted);

    logger.info('AIConfig', '使用用户配置', {
      provider: config.provider,
      model: config.model,
      apiKeyConfigured: true,
    });

    return {
      provider: config.provider as AIConfig['provider'],
      api_key: apiKey,
      base_url: config.baseUrl,
      model: config.model,
    };
  } catch (error) {
    logger.error('AIConfig', '加载配置失败', { error: String(error) });
    return null;
  }
}

/**
 * 确定影响级别
 */
function determineImpactLevel(
  message: string,
  changes: any[]
): 'major' | 'minor' | 'patch' {
  const lowerMessage = message.toLowerCase();

  // 检查破坏性变更标记
  if (
    lowerMessage.includes('breaking') ||
    lowerMessage.includes('break') ||
    lowerMessage.includes('!')
  ) {
    return 'major';
  }

  // 检查新功能
  if (
    lowerMessage.startsWith('feat') ||
    lowerMessage.includes('add') ||
    lowerMessage.includes('new')
  ) {
    return 'minor';
  }

  // 默认 patch
  return 'patch';
}

/**
 * 获取 AI 配置状态
 * GET /api/v1/commits/config/status
 *
 * 从数据库读取用户加密的 AI 配置
 */
commitsRouter.get(
  '/config/status',
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

      // 从数据库读取用户配置
      const settings = await prisma.user_settings.findUnique({
        where: { user_id: userId },
      });

      const hasConfig = settings?.ai_config && (settings.ai_config as Record<string, string>).apiKeyEncrypted;

      if (hasConfig) {
        const config = settings!.ai_config as Record<string, string>;
        res.json({
          code: 0,
          message: 'success',
          data: {
            ai_enabled: true,
            provider: config.provider || 'yunwu',
            model: config.model || 'gemini-2.0-flash-exp',
            base_url: config.baseUrl || 'https://api.yunwu.ai/v1',
            api_key_configured: true,
            source: 'user',
          },
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
      } else {
        res.json({
          code: 0,
          message: 'success',
          data: {
            ai_enabled: false,
            provider: 'yunwu',
            model: 'gemini-2.0-flash-exp',
            base_url: 'https://api.yunwu.ai/v1',
            api_key_configured: false,
            source: 'none',
          },
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
      }
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

      // 从数据库获取 commit 详情（使用 findFirst，因为 hash 是复合唯一键的一部分）
      const commit = await prisma.commits.findFirst({
        where: { hash },
      });

      if (!commit) {
        res.status(404).json({
          code: 30003,
          message: 'Commit 不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          commit: {
            id: commit.id,
            project_id: commit.project_id,
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            author_email: commit.author_email,
            impact_level: commit.impact_level,
            summary: commit.summary,
            timestamp: commit.timestamp.toISOString(),
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
