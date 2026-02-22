/**
 * AI 服务
 * 提供统一的 AI 服务接口和多服务商降级策略
 */

import type { AIConfig } from '../types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';

/**
 * AI 提供者接口
 */
export interface AIProvider {
  /** 提供者名称 */
  name: string;
  /** 生成内容 */
  generate(prompt: string): Promise<string>;
  /** 检查是否可用 */
  isAvailable(): Promise<boolean>;
}

/**
 * AI 服务类
 * 管理多个 AI 提供者，实现降级策略
 */
export class AIService {
  // AI 提供者列表
  private providers: AIProvider[] = [];
  // 当前使用的提供者索引
  private currentProviderIndex: number = 0;
  // 最大重试次数
  private maxRetries: number = 3;
  // 重试延迟（毫秒）
  private retryDelay: number = 1000;

  /**
   * 构造函数
   * @param configs AI 配置列表
   */
  constructor(configs: AIConfig[]) {
    // 初始化提供者
    for (const config of configs) {
      const provider = this.createProvider(config);
      if (provider) {
        this.providers.push(provider);
      }
    }
  }

  /**
   * 创建 AI 提供者
   * @param config AI 配置
   * @returns AI 提供者实例
   */
  private createProvider(config: AIConfig): AIProvider | null {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        console.warn(`Unknown AI provider: ${config.provider}`);
        return null;
    }
  }

  /**
   * 生成内容
   * @param prompt 提示词
   * @returns 生成的内容
   */
  async generate(prompt: string): Promise<string> {
    // 检查是否有可用的提供者
    if (this.providers.length === 0) {
      throw new Error('No AI providers available');
    }

    let lastError: Error | null = null;

    // 尝试所有提供者
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];

      // 尝试多次重试
      for (let retry = 0; retry < this.maxRetries; retry++) {
        try {
          // 检查提供者是否可用
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) {
            throw new Error(`Provider ${provider.name} is not available`);
          }

          // 生成内容
          const result = await provider.generate(prompt);

          // 成功后更新当前提供者索引
          this.currentProviderIndex = providerIndex;

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(
            `Provider ${provider.name} failed (attempt ${retry + 1}/${this.maxRetries}):`,
            lastError.message
          );

          // 等待后重试
          if (retry < this.maxRetries - 1) {
            await this.delay(this.retryDelay * (retry + 1));
          }
        }
      }

      // 当前提供者失败，尝试下一个
      console.warn(`Switching to next provider from ${provider.name}`);
    }

    // 所有提供者都失败
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * 延迟执行
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 添加提供者
   * @param provider AI 提供者
   */
  addProvider(provider: AIProvider): void {
    this.providers.push(provider);
  }

  /**
   * 获取当前提供者
   * @returns 当前提供者
   */
  getCurrentProvider(): AIProvider | undefined {
    return this.providers[this.currentProviderIndex];
  }

  /**
   * 获取所有提供者
   * @returns 提供者列表
   */
  getProviders(): AIProvider[] {
    return [...this.providers];
  }

  /**
   * 检查是否有可用的提供者
   * @returns 是否有可用提供者
   */
  async hasAvailableProvider(): Promise<boolean> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          return true;
        }
      } catch {
        // 忽略错误，继续检查下一个
      }
    }

    return false;
  }
}
