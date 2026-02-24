/**
 * 日志系统
 * 提供内存中的日志存储和查询功能
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LogQuery {
  level?: LogLevel;
  module?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 日志管理器
 * 单例模式，存储最近的日志条目
 */
class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly maxLogs: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 添加日志条目
   */
  log(level: LogLevel, module: string, message: string, metadata?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      module,
      message,
      metadata,
    };

    this.logs.push(entry);

    // 保持日志数量在限制范围内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 同时输出到控制台
    const consoleMessage = `[${module}] ${message}`;
    switch (level) {
      case 'debug':
        console.debug(consoleMessage, metadata || '');
        break;
      case 'info':
        console.log(consoleMessage, metadata || '');
        break;
      case 'warn':
        console.warn(consoleMessage, metadata || '');
        break;
      case 'error':
        console.error(consoleMessage, metadata || '');
        break;
    }

    return entry;
  }

  /**
   * 快捷方法：调试日志
   */
  debug(module: string, message: string, metadata?: Record<string, unknown>): LogEntry {
    return this.log('debug', module, message, metadata);
  }

  /**
   * 快捷方法：信息日志
   */
  info(module: string, message: string, metadata?: Record<string, unknown>): LogEntry {
    return this.log('info', module, message, metadata);
  }

  /**
   * 快捷方法：警告日志
   */
  warn(module: string, message: string, metadata?: Record<string, unknown>): LogEntry {
    return this.log('warn', module, message, metadata);
  }

  /**
   * 快捷方法：错误日志
   */
  error(module: string, message: string, metadata?: Record<string, unknown>): LogEntry {
    return this.log('error', module, message, metadata);
  }

  /**
   * 查询日志
   */
  query(query: LogQuery = {}): { logs: LogEntry[]; total: number } {
    let filtered = [...this.logs];

    // 按级别过滤
    if (query.level) {
      filtered = filtered.filter(log => log.level === query.level);
    }

    // 按模块过滤
    if (query.module) {
      filtered = filtered.filter(log => log.module.includes(query.module!));
    }

    // 按时间范围过滤
    if (query.startTime) {
      filtered = filtered.filter(log => log.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      filtered = filtered.filter(log => log.timestamp <= query.endTime!);
    }

    const total = filtered.length;

    // 分页
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    filtered = filtered.slice(offset, offset + limit);

    // 按时间倒序排列
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return { logs: filtered, total };
  }

  /**
   * 获取最近的日志
   */
  getRecent(limit: number = 50): LogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 获取日志统计信息
   */
  getStats(): { total: number; byLevel: Record<LogLevel, number> } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    for (const log of this.logs) {
      byLevel[log.level]++;
    }

    return {
      total: this.logs.length,
      byLevel,
    };
  }
}

// 导出单例实例
export const logger = Logger.getInstance();
