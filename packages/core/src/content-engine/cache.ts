/**
 * 内容缓存
 * 缓存已生成的内容，避免重复生成
 */

import type { GeneratedContent, CommitAnalysis } from '../types';
import { createHash } from 'crypto';

/**
 * 缓存条目
 */
interface CacheEntry {
  /** 缓存键 */
  key: string;
  /** 生成的内容 */
  content: GeneratedContent;
  /** 创建时间 */
  created_at: Date;
  /** 过期时间 */
  expires_at: Date;
}

/**
 * 内容缓存类
 * 使用内存缓存已生成的内容，支持 TTL 过期
 */
export class ContentCache {
  // 缓存存储
  private cache: Map<string, CacheEntry> = new Map();
  // 默认 TTL（24小时）
  private defaultTTL: number = 24 * 60 * 60 * 1000;

  /**
   * 构造函数
   * @param ttl 默认过期时间（毫秒）
   */
  constructor(ttl?: number) {
    if (ttl) {
      this.defaultTTL = ttl;
    }
  }

  /**
   * 生成缓存键
   * @param commits commit 分析结果列表
   * @param type 内容类型
   * @param language 语言
   * @returns 缓存键
   */
  generateKey(
    commits: CommitAnalysis[],
    type: string,
    language: string
  ): string {
    // 使用 commit 哈希列表生成唯一键
    const hashInput = commits
      .map((c) => c.hash)
      .sort()
      .join(',');

    const hash = createHash('md5').update(hashInput).digest('hex');

    return `${type}:${language}:${hash}`;
  }

  /**
   * 获取缓存内容
   * @param key 缓存键
   * @returns 缓存的内容，如果不存在或已过期则返回 undefined
   */
  get(key: string): GeneratedContent | undefined {
    const entry = this.cache.get(key);

    // 缓存不存在
    if (!entry) {
      return undefined;
    }

    // 检查是否过期
    if (entry.expires_at < new Date()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.content;
  }

  /**
   * 设置缓存内容
   * @param key 缓存键
   * @param content 要缓存的内容
   * @param ttl 过期时间（毫秒）
   */
  set(key: string, content: GeneratedContent, ttl?: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttl ?? this.defaultTTL));

    const entry: CacheEntry = {
      key,
      content,
      created_at: now,
      expires_at: expiresAt,
    };

    this.cache.set(key, entry);
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在有效缓存
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   * @returns 清理的缓存数量
   */
  cleanup(): number {
    const now = new Date();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires_at < now) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 获取缓存统计信息
   * @returns 统计信息
   */
  getStats(): {
    total: number;
    valid: number;
    expired: number;
  } {
    const now = new Date();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (entry.expires_at >= now) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }
}
