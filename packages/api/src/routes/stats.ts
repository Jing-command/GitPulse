/**
 * 统计数据路由
 * 提供仪表板所需的统计数据
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const statsRouter = Router();

// 所有统计路由都需要认证
statsRouter.use(authMiddleware);

/**
 * 获取仪表板统计数据
 * GET /api/v1/stats/dashboard
 * 只统计当前用户有权限的项目数据
 */
statsRouter.get(
  '/dashboard',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      // 构建用户有权限的项目查询条件
      const userProjectsWhere = {
        members: {
          some: {
            user_id: userId,
          },
        },
      };

      // 获取用户有权限的项目 ID 列表
      const userProjects = await prisma.projects.findMany({
        where: userProjectsWhere,
        select: { id: true },
      });
      const userProjectIds = userProjects.map((p) => p.id);

      // 并行获取各项统计数据
      const [
        projectsCount,
        contentsCount,
        commitsCount,
        // 计算本周新增
        projectsThisWeek,
        contentsThisWeek,
        commitsThisWeek,
      ] = await Promise.all([
        // 项目总数
        prisma.projects.count({ where: userProjectsWhere }),
        // 内容总数（只统计用户项目的）
        prisma.contents.count({
          where: {
            project_id: { in: userProjectIds },
          },
        }),
        // Commit 总数（只统计用户项目的）
        prisma.commits.count({
          where: {
            project_id: { in: userProjectIds },
          },
        }),
        // 本周新增项目
        prisma.projects.count({
          where: {
            ...userProjectsWhere,
            created_at: {
              gte: getWeekStart(),
            },
          },
        }),
        // 本周新增内容（只统计用户项目的）
        prisma.contents.count({
          where: {
            project_id: { in: userProjectIds },
            created_at: {
              gte: getWeekStart(),
            },
          },
        }),
        // 本周新增 commits（只统计用户项目的）
        prisma.commits.count({
          where: {
            project_id: { in: userProjectIds },
            timestamp: {
              gte: getWeekStart(),
            },
          },
        }),
      ]);

      // 计算平均 SEO 评分（只统计用户项目的）
      const seoContents = await prisma.contents.findMany({
        where: {
          project_id: { in: userProjectIds },
          type: 'seo',
          metadata: {
            path: ['score'],
            not: Prisma.JsonNull,
          },
        },
        select: {
          metadata: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 100, // 最近 100 条
      });

      let seoScore: number | null = null;
      let seoScoreChange = 0;

      if (seoContents.length > 0) {
        const totalScore = seoContents.reduce((sum, content) => {
          const score = (content.metadata as { score?: number })?.score || 0;
          return sum + score;
        }, 0);
        seoScore = Math.round(totalScore / seoContents.length);

        // 计算本周变化：比较本周和上上周的平均分
        const weekStart = getWeekStart();
        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const thisWeekScores: number[] = [];
        const lastWeekScores: number[] = [];

        seoContents.forEach((content) => {
          const score = (content.metadata as { score?: number })?.score || 0;
          const createdAt = new Date(content.created_at);

          if (createdAt >= weekStart) {
            thisWeekScores.push(score);
          } else if (createdAt >= lastWeekStart && createdAt < weekStart) {
            lastWeekScores.push(score);
          }
        });

        if (thisWeekScores.length > 0 && lastWeekScores.length > 0) {
          const thisWeekAvg = thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length;
          const lastWeekAvg = lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length;
          seoScoreChange = Math.round(thisWeekAvg - lastWeekAvg);
        } else if (thisWeekScores.length > 0) {
          // 上周没有数据，显示本周平均分作为变化
          seoScoreChange = Math.round(thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length);
        }
      }

      // 获取最近活动（只统计用户项目的）
      const recentActivities = await getRecentActivities(userProjectIds);

      res.json({
        code: 0,
        message: 'success',
        data: {
          stats: {
            projects: {
              total: projectsCount,
              this_week: projectsThisWeek,
            },
            contents: {
              total: contentsCount,
              this_week: contentsThisWeek,
            },
            commits: {
              total: commitsCount,
              this_week: commitsThisWeek,
            },
            seo_score: {
              average: seoScore ?? 0, // 没有数据时显示 0
              this_week_change: seoScoreChange,
            },
          },
          recent_activities: recentActivities,
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
 * 获取本周开始时间
 */
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 调整为周一开始
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * 获取最近活动
 * 只返回指定项目 ID 列表中的活动
 */
async function getRecentActivities(projectIds: string[]) {
  // 如果没有项目，返回空数组
  if (projectIds.length === 0) {
    return [];
  }

  // 获取最近的内容生成活动
  const recentContents = await prisma.contents.findMany({
    where: {
      project_id: { in: projectIds },
    },
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      project: {
        select: { name: true },
      },
    },
  });

  // 获取最近的 commits
  const recentCommits = await prisma.commits.findMany({
    where: {
      project_id: { in: projectIds },
    },
    take: 5,
    orderBy: { timestamp: 'desc' },
    include: {
      project: {
        select: { name: true },
      },
    },
  });

  // 获取最近的项目
  const recentProjects = await prisma.projects.findMany({
    where: {
      id: { in: projectIds },
    },
    take: 5,
    orderBy: { created_at: 'desc' },
  });

  // 合并并排序活动
  const activities = [
    ...recentContents.map((content) => ({
      type: 'content' as const,
      title: getContentTitle(content.type),
      description: content.title,
      time: content.created_at.toISOString(),
    })),
    ...recentCommits.map((commit) => ({
      type: 'commit' as const,
      title: '分析了新提交',
      description: commit.message.slice(0, 50) + (commit.message.length > 50 ? '...' : ''),
      time: commit.timestamp.toISOString(),
    })),
    ...recentProjects.map((project) => ({
      type: 'project' as const,
      title: '创建了新项目',
      description: project.name,
      time: project.created_at.toISOString(),
    })),
  ];

  // 按时间排序并取前 4 条
  return activities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 4)
    .map((activity) => ({
      ...activity,
      time: formatTime(activity.time),
    }));
}

/**
 * 获取内容类型的中文标题
 */
function getContentTitle(type: string): string {
  const titles: Record<string, string> = {
    changelog: '生成了更新日志',
    technical: '发布了技术博客',
    seo: '生成了 SEO 内容',
  };
  return titles[type] || '生成了内容';
}

/**
 * 格式化时间为相对时间
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} 分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}
