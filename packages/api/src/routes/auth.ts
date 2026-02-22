/**
 * 认证路由
 * 实现真实的数据库认证
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { Errors } from '../middleware/error.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

// Prisma 客户端
const prisma = new PrismaClient();

// 密码加密轮数
const SALT_ROUNDS = 10;

// 请求验证 Schema
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少8位'),
  name: z.string().min(2, '姓名至少2个字符'),
});

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

/**
 * 用户注册
 * POST /api/v1/auth/register
 */
authRouter.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = registerSchema.parse(req.body);

      // 检查邮箱是否已存在
      const existingUser = await prisma.users.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        throw Errors.EMAIL_EXISTS();
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(body.password, SALT_ROUNDS);

      // 创建用户
      const user = await prisma.users.create({
        data: {
          email: body.email,
          name: body.name,
          password: hashedPassword,
          role: 'viewer',
        },
      });

      // 生成 JWT Token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      res.status(201).json({
        code: 0,
        message: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar_url: user.avatar_url,
          },
          token,
          expires_in: 7200,
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
 * 用户登录
 * POST /api/v1/auth/login
 */
authRouter.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = loginSchema.parse(req.body);

      // 查找用户
      const user = await prisma.users.findUnique({
        where: { email: body.email },
      });

      // 用户不存在或密码为空（OAuth 用户）
      if (!user || !user.password) {
        throw Errors.INVALID_CREDENTIALS();
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(body.password, user.password);
      if (!isPasswordValid) {
        throw Errors.INVALID_CREDENTIALS();
      }

      // 生成 JWT Token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

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
          },
          token,
          expires_in: 7200,
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
 * 获取当前用户信息
 * GET /api/v1/auth/me
 */
authRouter.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 从数据库获取最新用户信息
      const user = await prisma.users.findUnique({
        where: { id: req.user?.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar_url: true,
          created_at: true,
        },
      });

      if (!user) {
        throw Errors.USER_NOT_FOUND();
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          user,
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
 * 登出
 * POST /api/v1/auth/logout
 */
authRouter.post(
  '/logout',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: 将 Token 加入黑名单（需要 Redis 支持）

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
