/**
 * AI 代码分析器
 * 结合 commit message 和代码 diff 进行智能分析
 * 不偏信任何一方，采用交叉验证策略
 */

import type { AIConfig } from '../types';

/**
 * AI 分析结果接口
 */
export interface AIAnalysisResult {
  /** 语义变更类型 */
  semanticType: 'feature' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore' | 'performance' | 'security';
  /** 技术领域分类 */
  techDomain: string[];
  /** 代码质量评估 */
  codeQuality: {
    /** 可读性评分 (0-10) */
    readability: number;
    /** 复杂度评分 (0-10, 越高越复杂) */
    complexity: number;
    /** 潜在风险等级 (low/medium/high) */
    riskLevel: 'low' | 'medium' | 'high';
  };
  /** 变更影响范围 */
  impactScope: {
    /** 是否影响 API */
    api: boolean;
    /** 是否影响数据库 */
    database: boolean;
    /** 是否影响配置 */
    config: boolean;
    /** 是否影响 UI */
    ui: boolean;
    /** 是否影响测试 */
    test: boolean;
    /** 其他影响 */
    others: string[];
  };
  /** 一句话变更摘要 */
  summary: string;
  /** 详细变更描述 */
  description: string;
  /** 潜在风险点 */
  risks: string[];
  /** 建议改进点 */
  suggestions: string[];
  /** AI 置信度 (0-1) */
  confidence: number;
}

/**
 * AI 代码分析器类
 */
export class AIAnalyzer {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * 分析 commit
   * @param message commit 消息
   * @param diff diff 内容
   * @param fileChanges 文件变更列表
   * @returns AI 分析结果
   */
  async analyze(
    message: string,
    diff: string,
    fileChanges: Array<{ path: string; type: string }>
  ): Promise<AIAnalysisResult | null> {
    try {
      const prompt = this.buildPrompt(message, diff, fileChanges);
      const response = await this.callAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('[AIAnalyzer] 分析失败:', error);
      return null;
    }
  }

  /**
   * 构建分析 prompt
   * 同时提供 commit message 和 diff，让 AI 交叉验证
   */
  private buildPrompt(
    message: string,
    diff: string,
    fileChanges: Array<{ path: string; type: string }>
  ): string {
    // 截断 diff 避免超出 token 限制
    const truncatedDiff = diff.length > 8000 ? diff.substring(0, 8000) + '\n... (truncated)' : diff;

    // 构建文件变更摘要
    const fileSummary = fileChanges.map(f => `- ${f.path} (${f.type})`).join('\n');

    return `请分析以下 Git commit，结合 commit message 和代码 diff 进行交叉验证分析。

## Commit Message
${message}

## 文件变更列表
${fileSummary}

## Code Diff
\`\`\`diff
${truncatedDiff}
\`\`\`

## 分析要求
请从以下维度进行分析，返回 JSON 格式：

1. **semanticType**: 语义变更类型
   - feature: 新功能
   - fix: 修复问题
   - refactor: 代码重构
   - docs: 文档更新
   - test: 测试相关
   - chore: 其他变更
   - performance: 性能优化
   - security: 安全修复

2. **techDomain**: 技术领域分类（数组）
   例如: ["frontend", "api", "database", "auth"]

3. **codeQuality**: 代码质量评估
   - readability: 可读性评分 (0-10)
   - complexity: 复杂度评分 (0-10, 越高越复杂)
   - riskLevel: 潜在风险等级 (low/medium/high)

4. **impactScope**: 变更影响范围
   - api: 是否影响 API
   - database: 是否影响数据库
   - config: 是否影响配置
   - ui: 是否影响 UI
   - test: 是否影响测试
   - others: 其他影响描述（数组）

5. **summary**: 一句话变更摘要（不超过 50 字）

6. **description**: 详细变更描述（不超过 200 字）

7. **risks**: 潜在风险点（数组）

8. **suggestions**: 建议改进点（数组）

9. **confidence**: AI 置信度 (0-1)

## 交叉验证规则
- 如果 commit message 说 "fix bug" 但 diff 显示新增功能，以 diff 为准
- 如果 commit message 说 "refactor" 但 diff 显示大量新增代码，可能是 feature
- 关注文件路径变化，判断技术领域
- 分析代码修改模式判断实际变更类型

请严格返回 JSON 格式，不要包含其他文字。`;
  }

  /**
   * 调用 AI 服务
   */
  private async callAI(prompt: string): Promise<string> {
    const { provider, api_key, base_url, model } = this.config;

    let url: string;
    let headers: Record<string, string>;
    let body: unknown;

    if (provider === 'openai' || provider === 'yunwu') {
      url = `${base_url || 'https://api.openai.com/v1'}/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key || ''}`,
      };
      body = {
        model: model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的代码审查专家，擅长分析 Git commit 的语义和影响。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      };
    } else if (provider === 'anthropic') {
      url = `${base_url || 'https://api.anthropic.com'}/v1/messages`;
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key || '',
        'anthropic-version': '2023-06-01',
      };
      body = {
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };
    } else {
      throw new Error(`不支持的 AI provider: ${provider}`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (provider === 'anthropic') {
      const content = (data.content as Array<{ text?: string }>) || [];
      return content[0]?.text || '';
    }
    const choices = (data.choices as Array<{ message?: { content?: string } }>) || [];
    return choices[0]?.message?.content || '';
  }

  /**
   * 解析 AI 响应
   */
  private parseResponse(response: string): AIAnalysisResult {
    // 提取 JSON 部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 响应中没有找到 JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      semanticType: parsed.semanticType || 'chore',
      techDomain: parsed.techDomain || [],
      codeQuality: {
        readability: parsed.codeQuality?.readability ?? 5,
        complexity: parsed.codeQuality?.complexity ?? 5,
        riskLevel: parsed.codeQuality?.riskLevel || 'low',
      },
      impactScope: {
        api: parsed.impactScope?.api || false,
        database: parsed.impactScope?.database || false,
        config: parsed.impactScope?.config || false,
        ui: parsed.impactScope?.ui || false,
        test: parsed.impactScope?.test || false,
        others: parsed.impactScope?.others || [],
      },
      summary: parsed.summary || '代码变更',
      description: parsed.description || '',
      risks: parsed.risks || [],
      suggestions: parsed.suggestions || [],
      confidence: parsed.confidence ?? 0.5,
    };
  }
}

/**
 * 从 localStorage 加载 AI 配置（仅浏览器端使用）
 */
export function loadAIConfigFromStorage(): AIConfig | null {
  // 检查是否在浏览器环境
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).localStorage === 'undefined') {
    return null;
  }

  try {
    const saved = (globalThis as any).localStorage?.getItem('gitpulse-ai-config');
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return {
      provider: parsed.provider || 'yunwu',
      model: parsed.model || 'gemini-2.0-flash-exp',
      api_key: parsed.apiKey,
      base_url: parsed.baseUrl,
    };
  } catch {
    return null;
  }
}
