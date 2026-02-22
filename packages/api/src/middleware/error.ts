/**
 * 错误处理中间件
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// 定义 uuidv4 函数别名以便兼容现有代码
const uuidv4 = randomUUID;

/**
 * API 错误类
 */
export class APIError extends Error {
  code: number;
  statusCode: number;
  userMessage: string;
  requestId: string;

  constructor(
    code: number,
    message: string,
    userMessage: string,
    statusCode: number = 400
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.requestId = uuidv4();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 预定义错误
 */
export const Errors = {
  // 参数错误 10000-19999
  INVALID_PARAM: (field: string) =>
    new APIError(10001, `Invalid parameter: ${field}`, `参数 ${field} 无效`, 400),
  MISSING_PARAM: (field: string) =>
    new APIError(10002, `Missing parameter: ${field}`, `缺少参数 ${field}`, 400),
  INVALID_FORMAT: (field: string) =>
    new APIError(10003, `Invalid format: ${field}`, `${field} 格式不正确`, 400),

  // 认证错误 20000-29999
  UNAUTHORIZED: () =>
    new APIError(20001, 'Unauthorized', '请先登录', 401),
  INVALID_TOKEN: () =>
    new APIError(20002, 'Invalid token', '登录已过期，请重新登录', 401),
  INVALID_CREDENTIALS: () =>
    new APIError(20003, 'Invalid credentials', '邮箱或密码错误', 401),
  TOKEN_EXPIRED: () =>
    new APIError(20004, 'Token expired', '登录已过期，请重新登录', 401),

  // 权限错误 30000-39999
  FORBIDDEN: () =>
    new APIError(30001, 'Forbidden', '您没有权限执行此操作', 403),
  NOT_MEMBER: () =>
    new APIError(30002, 'Not a project member', '您不是该项目的成员', 403),
  NOT_ADMIN: () =>
    new APIError(30003, 'Not an admin', '需要管理员权限', 403),

  // 资源错误 40000-49999
  NOT_FOUND: (resource: string) =>
    new APIError(40001, `${resource} not found`, `${resource} 不存在`, 404),
  PROJECT_NOT_FOUND: () =>
    new APIError(40002, 'Project not found', '项目不存在', 404),
  CONTENT_NOT_FOUND: () =>
    new APIError(40003, 'Content not found', '内容不存在', 404),
  USER_NOT_FOUND: () =>
    new APIError(40004, 'User not found', '用户不存在', 404),

  // 冲突错误 50000-59999
  ALREADY_EXISTS: (resource: string) =>
    new APIError(50001, `${resource} already exists`, `${resource} 已存在`, 409),
  EMAIL_EXISTS: () =>
    new APIError(50002, 'Email already exists', '该邮箱已被注册', 409),

  // 服务器错误 60000-69999
  INTERNAL_ERROR: () =>
    new APIError(60001, 'Internal server error', '服务器内部错误，请稍后再试', 500),
  DATABASE_ERROR: () =>
    new APIError(60002, 'Database error', '数据库错误，请稍后再试', 500),
  AI_ERROR: () =>
    new APIError(60003, 'AI service error', 'AI 服务错误，请稍后再试', 500),
};

/**
 * 错误处理中间件
 */
export function errorHandler(
  err: Error | APIError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = err instanceof APIError ? err.requestId : uuidv4();
  const timestamp = new Date().toISOString();

  if (err instanceof APIError) {
    // 已知的 API 错误
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      user_message: err.userMessage,
      request_id: requestId,
      timestamp,
    });
  } else {
    // 未知错误
    console.error('Unhandled error:', err);
    res.status(500).json({
      code: 60001,
      message: 'Internal server error',
      user_message: '服务器内部错误，请稍后再试',
      request_id: requestId,
      timestamp,
    });
  }
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    code: 40001,
    message: 'Resource not found',
    user_message: '请求的资源不存在',
    request_id: uuidv4(),
    timestamp: new Date().toISOString(),
  });
}
