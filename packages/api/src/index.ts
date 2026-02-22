/**
 * API 服务入口
 * 提供RESTful API接口
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { requestLogger } from './middleware/logger.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { contentsRouter } from './routes/contents.js';
import { commitsRouter } from './routes/commits.js';
import { usersRouter } from './routes/users.js';
import { healthRouter } from './routes/health.js';
import { statsRouter } from './routes/stats.js';

// 创建 Express 应用
const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// 请求限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 个请求
  message: {
    code: 42900,
    message: 'Too many requests',
    user_message: '请求过于频繁，请稍后再试',
  },
});
app.use(limiter);

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// 根路径路由 - 返回 API 信息
app.get('/', (_req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      name: 'GitPulse API',
      version: '1.0.0',
      description: '技术内容全自动流水线 API 服务',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        projects: '/api/v1/projects',
        contents: '/api/v1/contents',
        commits: '/api/v1/commits',
        users: '/api/v1/users',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// API 路由
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/contents', contentsRouter);
app.use('/api/v1/commits', commitsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/stats', statsRouter);

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务
app.listen(config.port, () => {
  console.log(`GitPulse API 服务已启动`);
  console.log(`端口: ${config.port}`);
  console.log(`环境: ${config.nodeEnv}`);
});

export default app;
