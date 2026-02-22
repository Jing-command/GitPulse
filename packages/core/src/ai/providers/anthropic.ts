/**
 * Anthropic 提供者
 * 实现 Anthropic Claude API 调用
 */

import type { AIConfig } from '../../types';
import type { AIProvider } from '../service';

/**
 * Anthropic API 响应接口
 */
interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: {
    type: string;
    text: string;
  }[];
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic 提供者类
 * 封装 Anthropic Claude API 调用
 */
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  /**
   * 构造函数
   * @param config AI 配置
   */
  constructor(config: AIConfig) {
    this.apiKey = config.api_key ?? '';
    this.model = config.model ?? 'claude-3-opus-20240229';
    this.baseUrl = config.base_url ?? 'https://api.anthropic.com/v1';
  }

  /**
   * 生成内容
   * @param prompt 提示词
   * @returns 生成的内容
   */
  async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: '你是一个专业的技术文档撰写专家，擅长编写清晰、准确、易读的技术文档。',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    // 提取文本内容
    const textContent = data.content.find((c) => c.type === 'text');
    return textContent?.text ?? '';
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

    // Anthropic 没有专门的模型列表接口
    // 简单检查 API Key 格式
    return this.apiKey.startsWith('sk-ant-');
  }
}
