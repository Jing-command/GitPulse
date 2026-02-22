/**
 * Ollama 提供者
 * 实现本地 Ollama API 调用
 */

import type { AIConfig } from '../../types';
import type { AIProvider } from '../service';

/**
 * Ollama API 响应接口
 */
interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ollama 提供者类
 * 封装本地 Ollama API 调用
 */
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  private model: string;
  private baseUrl: string;

  /**
   * 构造函数
   * @param config AI 配置
   */
  constructor(config: AIConfig) {
    this.model = config.model ?? 'llama2';
    this.baseUrl = config.base_url ?? 'http://localhost:11434';
  }

  /**
   * 生成内容
   * @param prompt 提示词
   * @returns 生成的内容
   */
  async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as OllamaResponse;
    return data.message?.content ?? '';
  }

  /**
   * 检查是否可用
   * @returns 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 检查 Ollama 服务是否运行
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        return false;
      }

      // 检查模型是否存在
      const data = (await response.json()) as { models: { name: string }[] };
      const models = data.models ?? [];
      return models.some((m) => m.name === this.model || m.name.startsWith(this.model));
    } catch {
      return false;
    }
  }

  /**
   * 获取可用模型列表
   * @returns 模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as { models: { name: string }[] };
      return (data.models ?? []).map((m) => m.name);
    } catch {
      return [];
    }
  }
}
