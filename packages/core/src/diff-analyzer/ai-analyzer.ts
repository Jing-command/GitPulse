/**
 * AI 代码分析器
 * 结合 commit message 和代码 diff 进行智能分析
 * 采用分批处理机制，减轻大模型上下文压力
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
  /** 分析批次信息 */
  batchInfo?: {
    totalFiles: number;
    analyzedFiles: number;
    batches: number;
  };
}

/**
 * 分批配置
 */
interface BatchConfig {
  /** 每批最大文件数 */
  maxFilesPerBatch: number;
  /** 每批最大字符数 */
  maxCharsPerBatch: number;
  /** 单文件最大字符数 */
  maxCharsPerFile: number;
}

/**
 * AI 代码分析器类
 * 支持分批处理大型 diff
 */
export class AIAnalyzer {
  private config: AIConfig;
  private batchConfig: BatchConfig;

  constructor(config: AIConfig, batchConfig?: Partial<BatchConfig>) {
    this.config = config;
    this.batchConfig = {
      maxFilesPerBatch: 5,
      maxCharsPerBatch: 6000,
      maxCharsPerFile: 2000,
      ...batchConfig,
    };
  }

  /**
   * 分析 commit
   * 采用分层策略：先分析概览，再分批分析详细代码
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
      console.log(`[AIAnalyzer] 开始分析，diff 长度: ${diff.length} 字符，文件数: ${fileChanges.length}`);

      // 第一层：快速概览分析（基于文件列表和统计）
      const overviewResult = await this.analyzeOverview(message, fileChanges);
      if (!overviewResult) {
        console.log('[AIAnalyzer] 概览分析失败');
        return null;
      }

      // 如果 diff 较短，直接完成分析
      if (diff.length <= this.batchConfig.maxCharsPerBatch) {
        console.log('[AIAnalyzer] diff 较短，直接完成分析');
        return {
          ...overviewResult,
          batchInfo: {
            totalFiles: fileChanges.length,
            analyzedFiles: fileChanges.length,
            batches: 1,
          },
        };
      }

      // 第二层：分批分析代码细节
      console.log('[AIAnalyzer] diff 较长，启用分批分析');
      const batches = this.splitIntoBatches(diff, fileChanges);
      console.log(`[AIAnalyzer] 分成 ${batches.length} 批进行分析`);

      const batchResults: AIAnalysisResult[] = [];
      for (let i = 0; i < batches.length; i++) {
        console.log(`[AIAnalyzer] 分析第 ${i + 1}/${batches.length} 批`);
        const batchResult = await this.analyzeBatch(message, batches[i], i + 1, batches.length);
        if (batchResult) {
          batchResults.push(batchResult);
        }
      }

      // 合并多批次结果
      const mergedResult = this.mergeResults(overviewResult, batchResults);
      mergedResult.batchInfo = {
        totalFiles: fileChanges.length,
        analyzedFiles: batches.reduce((sum, b) => sum + b.files.length, 0),
        batches: batches.length,
      };

      console.log('[AIAnalyzer] 分批分析完成');
      return mergedResult;
    } catch (error) {
      console.error('[AIAnalyzer] 分析失败:', error);
      return null;
    }
  }

  /**
   * 第一层：概览分析
   * 基于文件列表和 commit message 进行快速分析
   */
  private async analyzeOverview(
    message: string,
    fileChanges: Array<{ path: string; type: string }>
  ): Promise<AIAnalysisResult | null> {
    const fileSummary = fileChanges.map(f => `- ${f.path} (${f.type})`).join('\n');

    const prompt = `请基于 Commit Message 和文件变更列表进行快速分析，返回 JSON 格式。

## Commit Message
${message}

## 文件变更列表 (${fileChanges.length} 个文件)
${fileSummary}

## 分析要求
根据文件路径和命名，判断：
1. **semanticType**: 最可能的变更类型
2. **techDomain**: 涉及的技术领域
3. **impactScope**: 可能影响范围
4. **summary**: 一句话摘要
5. **confidence**: 置信度（基于信息完整度）

返回 JSON 格式，字段与完整分析一致，不确定的字段可留空或给默认值。`;

    try {
      const response = await this.callAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('[AIAnalyzer] 概览分析失败:', error);
      return null;
    }
  }

  /**
   * 将 diff 分成多个批次
   */
  private splitIntoBatches(
    diff: string,
    fileChanges: Array<{ path: string; type: string }>
  ): Array<{ diff: string; files: Array<{ path: string; type: string }> }> {
    const batches: Array<{ diff: string; files: Array<{ path: string; type: string }> }> = [];
    const files = [...fileChanges];

    // 按文件分割 diff
    const fileDiffs = this.splitDiffByFile(diff);

    let currentBatch: { diff: string; files: typeof fileChanges; chars: number } = {
      diff: '',
      files: [],
      chars: 0,
    };

    for (const file of files) {
      const fileDiff = fileDiffs.get(file.path) || '';
      const truncatedDiff = this.truncateFileDiff(fileDiff);
      const diffLength = truncatedDiff.length;

      // 检查是否需要开启新批次
      if (
        currentBatch.files.length >= this.batchConfig.maxFilesPerBatch ||
        currentBatch.chars + diffLength > this.batchConfig.maxCharsPerBatch
      ) {
        if (currentBatch.files.length > 0) {
          batches.push({
            diff: currentBatch.diff,
            files: currentBatch.files,
          });
        }
        currentBatch = {
          diff: '',
          files: [],
          chars: 0,
        };
      }

      currentBatch.files.push(file);
      currentBatch.diff += truncatedDiff + '\n';
      currentBatch.chars += diffLength;
    }

    // 添加最后一个批次
    if (currentBatch.files.length > 0) {
      batches.push({
        diff: currentBatch.diff,
        files: currentBatch.files,
      });
    }

    return batches;
  }

  /**
   * 按文件分割 diff
   */
  private splitDiffByFile(diff: string): Map<string, string> {
    const fileDiffs = new Map<string, string>();
    const lines = diff.split('\n');

    let currentFile = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      // 检测文件开始
      const diffGitMatch = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      if (diffGitMatch) {
        // 保存上一个文件
        if (currentFile && currentContent.length > 0) {
          fileDiffs.set(currentFile, currentContent.join('\n'));
        }
        // 开始新文件
        currentFile = diffGitMatch[2]; // 使用 b/ 路径（新路径）
        currentContent = [line];
      } else if (currentFile) {
        currentContent.push(line);
      }
    }

    // 保存最后一个文件
    if (currentFile && currentContent.length > 0) {
      fileDiffs.set(currentFile, currentContent.join('\n'));
    }

    return fileDiffs;
  }

  /**
   * 智能截断单个文件的 diff
   * 保留关键部分：函数定义、类定义、变更标记
   */
  private truncateFileDiff(fileDiff: string): string {
    if (fileDiff.length <= this.batchConfig.maxCharsPerFile) {
      return fileDiff;
    }

    const lines = fileDiff.split('\n');
    const result: string[] = [];
    let charCount = 0;

    // 保留文件头信息
    let inHeader = true;
    for (const line of lines) {
      if (inHeader) {
        result.push(line);
        charCount += line.length + 1;
        // 头部结束标记
        if (line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++')) {
          inHeader = false;
        }
      } else if (charCount < this.batchConfig.maxCharsPerFile * 0.7) {
        // 保留 70% 的内容
        result.push(line);
        charCount += line.length + 1;
      } else {
        // 截断，添加省略标记
        result.push('... [代码截断，保留关键变更信息] ...');
        break;
      }
    }

    return result.join('\n');
  }

  /**
   * 分析单个批次
   */
  private async analyzeBatch(
    message: string,
    batch: { diff: string; files: Array<{ path: string; type: string }> },
    batchIndex: number,
    totalBatches: number
  ): Promise<AIAnalysisResult | null> {
    const fileList = batch.files.map(f => `- ${f.path}`).join('\n');

    const prompt = `这是分批分析的第 ${batchIndex}/${totalBatches} 批。

## Commit Message
${message}

## 本批次文件 (${batch.files.length} 个)
${fileList}

## Code Diff
\`\`\`diff
${batch.diff}
\`\`\`

## 分析要求
请分析这批代码变更，重点关注：
1. **risks**: 本批次代码的潜在风险
2. **suggestions**: 针对本批次代码的改进建议
3. **description**: 详细描述本批次变更
4. **codeQuality**: 本批次代码质量评估

注意：这是分批分析，只需关注本批次的文件，返回 JSON 格式。`;

    try {
      const response = await this.callAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error(`[AIAnalyzer] 批次 ${batchIndex} 分析失败:`, error);
      return null;
    }
  }

  /**
   * 合并多批次结果
   */
  private mergeResults(
    overview: AIAnalysisResult,
    batchResults: AIAnalysisResult[]
  ): AIAnalysisResult {
    if (batchResults.length === 0) {
      return overview;
    }

    // 合并风险点（去重）
    const allRisks = [...overview.risks];
    for (const batch of batchResults) {
      for (const risk of batch.risks) {
        if (!allRisks.some(r => r.includes(risk.substring(0, 20)))) {
          allRisks.push(risk);
        }
      }
    }

    // 合并建议（去重）
    const allSuggestions = [...overview.suggestions];
    for (const batch of batchResults) {
      for (const suggestion of batch.suggestions) {
        if (!allSuggestions.some(s => s.includes(suggestion.substring(0, 20)))) {
          allSuggestions.push(suggestion);
        }
      }
    }

    // 计算平均质量分数
    const avgReadability =
      batchResults.reduce((sum, b) => sum + b.codeQuality.readability, 0) / batchResults.length;
    const avgComplexity =
      batchResults.reduce((sum, b) => sum + b.codeQuality.complexity, 0) / batchResults.length;

    // 取最高风险等级
    const riskLevels = ['low', 'medium', 'high'];
    const maxRiskIndex = Math.max(
      ...batchResults.map(b => riskLevels.indexOf(b.codeQuality.riskLevel))
    );

    // 合并技术领域（去重）
    const allTechDomains = [...new Set([...overview.techDomain, ...batchResults.flatMap(b => b.techDomain)])];

    // 合并影响范围
    const mergedImpactScope = {
      api: overview.impactScope.api || batchResults.some(b => b.impactScope.api),
      database: overview.impactScope.database || batchResults.some(b => b.impactScope.database),
      config: overview.impactScope.config || batchResults.some(b => b.impactScope.config),
      ui: overview.impactScope.ui || batchResults.some(b => b.impactScope.ui),
      test: overview.impactScope.test || batchResults.some(b => b.impactScope.test),
      others: [...new Set([...overview.impactScope.others, ...batchResults.flatMap(b => b.impactScope.others)])],
    };

    return {
      ...overview,
      techDomain: allTechDomains,
      codeQuality: {
        readability: Math.round(avgReadability),
        complexity: Math.round(avgComplexity),
        riskLevel: riskLevels[maxRiskIndex] as 'low' | 'medium' | 'high',
      },
      impactScope: mergedImpactScope,
      description: overview.description || batchResults.map(b => b.description).filter(Boolean).join('\n'),
      risks: allRisks.slice(0, 10), // 最多保留 10 个风险点
      suggestions: allSuggestions.slice(0, 10), // 最多保留 10 个建议
    };
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

    // 带重试的 fetch 调用
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = (await response.json()) as Record<string, unknown>;

          if (provider === 'anthropic') {
            const content = (data.content as Array<{ text?: string }>) || [];
            return content[0]?.text || '';
          }
          const choices = (data.choices as Array<{ message?: { content?: string } }>) || [];
          return choices[0]?.message?.content || '';
        }

        // 429 错误时等待后重试
        if (response.status === 429) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`[AIAnalyzer] 遇到 429 错误，等待 ${delay}ms 后重试 (${attempt + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(`AI API error: ${response.status}`);
      } catch (error) {
        lastError = error as Error;
        if (attempt < 2) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[AIAnalyzer] 请求失败，等待 ${delay}ms 后重试 (${attempt + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('AI API 调用失败');
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
