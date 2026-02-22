/**
 * API 配置
 */

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * API 配置接口
 */
interface APIConfig {
  // 服务端口
  port: number;
  // 运行环境
  nodeEnv: 'development' | 'production' | 'test';
  // CORS 允许的源
  corsOrigins: string[];
  // JWT 密钥
  jwtSecret: string;
  // JWT 过期时间
  jwtExpiresIn: string;
  // 数据库连接 URL
  databaseUrl: string;
}

/**
 * 获取配置值
 */
function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * API 配置对象
 */
export const config: APIConfig = {
  port: getEnvNumber('PORT', 3001),
  nodeEnv: (getEnvString('NODE_ENV', 'development') as APIConfig['nodeEnv']),
  corsOrigins: getEnvString('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost:3006,http://localhost:3007,http://localhost:3008').split(','),
  jwtSecret: getEnvString('JWT_SECRET', 'your-secret-key-change-in-production'),
  jwtExpiresIn: getEnvString('JWT_EXPIRES_IN', '2h'),
  databaseUrl: getEnvString('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/gitpulse?schema=public'),
};
