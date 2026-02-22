/**
 * 内容路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const contentsRouter = Router();

// 所有内容路由都需要认证
contentsRouter.use(authMiddleware);

// 分页查询参数
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['changelog', 'technical', 'seo']).optional(),
  status: z.enum(['draft', 'pending', 'approved', 'published']).optional(),
  project_id: z.string().optional(),
});

// 创建内容 Schema
const createContentSchema = z.object({
  project_id: z.string(),
  type: z.enum(['changelog', 'technical', 'seo']),
  title: z.string().min(1).max(200),
  content: z.string(),
  language: z.string().default('zh'),
  formats: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * 获取内容列表
 * GET /api/v1/contents
 */
contentsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, per_page, type, status, project_id } = paginationSchema.parse(req.query);
      const skip = (page - 1) * per_page;

      // 构建查询条件
      const where: any = {};
      if (type) where.type = type;
      if (status) where.status = status;
      if (project_id) where.project_id = project_id;

      // 从数据库获取内容列表
      const [contents, total] = await Promise.all([
        prisma.contents.findMany({
          where,
          skip,
          take: per_page,
          orderBy: { updated_at: 'desc' },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.contents.count({ where }),
      ]);

      const total_pages = Math.ceil(total / per_page);

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: contents.map((c) => ({
            id: c.id,
            project_id: c.project_id,
            project_name: c.project.name,
            type: c.type,
            title: c.title,
            status: c.status,
            language: c.language,
            author_id: c.author_id,
            author_name: c.author.name,
            created_at: c.created_at.toISOString(),
            updated_at: c.updated_at.toISOString(),
            published_at: c.published_at?.toISOString(),
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
 * 获取内容详情
 * GET /api/v1/contents/:id
 */
contentsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const content = await prisma.contents.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          versions: {
            orderBy: { version: 'desc' },
            take: 5,
          },
        },
      });

      if (!content) {
        res.status(404).json({
          code: 404,
          message: 'Content not found',
          user_message: '内容不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          content: {
            id: content.id,
            project_id: content.project_id,
            project_name: content.project.name,
            type: content.type,
            title: content.title,
            content: content.content,
            status: content.status,
            language: content.language,
            formats: content.formats,
            metadata: content.metadata,
            author_id: content.author_id,
            author_name: content.author.name,
            versions: content.versions.map((v) => ({
              id: v.id,
              version: v.version,
              change_log: v.change_log,
              created_at: v.created_at.toISOString(),
            })),
            created_at: content.created_at.toISOString(),
            updated_at: content.updated_at.toISOString(),
            published_at: content.published_at?.toISOString(),
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
 * 创建内容
 * POST /api/v1/contents
 */
contentsRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createContentSchema.parse(req.body);
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

      const content = await prisma.contents.create({
        data: {
          project_id: body.project_id,
          type: body.type,
          title: body.title,
          content: body.content,
          language: body.language,
          formats: body.formats || ['markdown'],
          metadata: body.metadata || {},
          author_id: userId,
          status: 'draft',
        },
      });

      res.status(201).json({
        code: 0,
        message: 'success',
        data: {
          content: {
            id: content.id,
            project_id: content.project_id,
            type: content.type,
            title: content.title,
            status: content.status,
            language: content.language,
            created_at: content.created_at.toISOString(),
            updated_at: content.updated_at.toISOString(),
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
 * 更新内容
 * PUT /api/v1/contents/:id
 */
contentsRouter.put(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const body = createContentSchema.partial().parse(req.body);

      // 创建新版本
      const existingContent = await prisma.contents.findUnique({
        where: { id },
      });

      if (!existingContent) {
        res.status(404).json({
          code: 404,
          message: 'Content not found',
          user_message: '内容不存在',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 获取最新版本号
      const latestVersion = await prisma.content_versions.findFirst({
        where: { content_id: id },
        orderBy: { version: 'desc' },
      });

      const newVersion = (latestVersion?.version || 0) + 1;

      // 更新内容和创建版本
      const [updatedContent] = await prisma.$transaction([
        prisma.contents.update({
          where: { id },
          data: {
            ...(body.title && { title: body.title }),
            ...(body.content && { content: body.content }),
            ...(body.type && { type: body.type }),
            ...(body.language && { language: body.language }),
            ...(body.formats && { formats: body.formats }),
            ...(body.metadata && { metadata: body.metadata }),
          },
        }),
        prisma.content_versions.create({
          data: {
            content_id: id,
            version: newVersion,
            content: body.content || existingContent.content,
            change_log: `更新版本 ${newVersion}`,
            author_id: req.user?.id || '',
          },
        }),
      ]);

      res.json({
        code: 0,
        message: 'success',
        data: {
          content: {
            id: updatedContent.id,
            title: updatedContent.title,
            status: updatedContent.status,
            updated_at: updatedContent.updated_at.toISOString(),
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
 * 删除内容
 * DELETE /api/v1/contents/:id
 */
contentsRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await prisma.contents.delete({
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
 * 提交审核
 * POST /api/v1/contents/:id/submit
 */
contentsRouter.post(
  '/:id/submit',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const content = await prisma.contents.update({
        where: { id },
        data: { status: 'pending' },
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          content: {
            id: content.id,
            status: content.status,
            updated_at: content.updated_at.toISOString(),
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
 * 审批内容
 * POST /api/v1/contents/:id/approve
 */
contentsRouter.post(
  '/:id/approve',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;
      const reviewerId = req.user?.id;

      if (!reviewerId) {
        res.status(401).json({
          code: 401,
          message: 'Unauthorized',
          user_message: '请先登录',
          request_id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const [content, approval] = await prisma.$transaction([
        prisma.contents.update({
          where: { id },
          data: {
            status: status === 'approved' ? 'approved' : 'draft',
            ...(status === 'approved' && { published_at: new Date() }),
          },
        }),
        prisma.approvals.create({
          data: {
            content_id: id,
            reviewer_id: reviewerId,
            status: status === 'approved' ? 'approved' : 'rejected',
            comment: comment || '',
          },
        }),
      ]);

      res.json({
        code: 0,
        message: 'success',
        data: {
          content: {
            id: content.id,
            status: content.status,
            updated_at: content.updated_at.toISOString(),
          },
          approval: {
            status: approval.status,
            comment: approval.comment,
            approved_at: approval.created_at.toISOString(),
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
