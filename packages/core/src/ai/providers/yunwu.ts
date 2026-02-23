/**
 * 云雾中转站提供者
 * 实现云雾中转站 API 调用（OpenAI 兼容格式）
 */

import type { AIConfig } from '../../types';
import type { AIProvider } from '../service';

/**
 * 云雾中转站 API 响应接口
 */
interface YunwuResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 云雾中转站提供者类
 * 封装云雾中转站 API 调用（OpenAI 兼容格式）
 */
export class YunwuProvider implements AIProvider {
  readonly name = 'yunwu';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  /**
   * 构造函数
   * @param config AI 配置
   */
  constructor(config: AIConfig) {
    this.apiKey = config.api_key ?? '';
    this.model = config.model ?? 'gemini-2.0-flash-exp';
    // 云雾中转站默认使用 OpenAI 兼容接口
    this.baseUrl = config.base_url ?? 'https://api.yunwu.ai/v1';
  }

  /**
   * 生成内容
   * @param prompt 提示词
   * @returns 生成的内容
   */
  async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的技术文档撰写专家，擅长编写清晰、准确、易读的技术文档。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Yunwu API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as YunwuResponse;
    return data.choices[0]?.message?.content ?? '';
  }

  /**
   * 检查是否可用
   * @returns 是否可用
   */
  async isAvailable(): Promise<boolean> {
    // 检查 API Key 是否配置
    if (!this.apiKey) {
      return false;
    }

    // 尝试获取模型列表来验证连接
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
