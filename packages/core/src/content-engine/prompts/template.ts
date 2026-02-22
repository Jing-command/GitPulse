/**
 * Prompt 模板
 * 定义 AI 内容生成的提示词模板
 */

import type { CommitAnalysis, ProjectContext, ContentType } from '../../types';

/**
 * Prompt 模板类
 * 提供各种内容类型的 AI 提示词模板
 */
export class PromptTemplate {
  /**
   * 生成 Changelog 提示词
   * @param commits commit 分析结果列表
   * @param context 项目上下文
   * @param language 目标语言
   * @returns 提示词
   */
  generateChangelogPrompt(
    commits: CommitAnalysis[],
    context: ProjectContext,
    language: string
  ): string {
    const languageInstruction = this.getLanguageInstruction(language);
    const commitSummaries = this.formatCommitSummaries(commits);

    return `你是一个专业的技术文档撰写专家。请根据以下 Git 提交记录，生成一份面向用户的更新日志（Changelog）。

## 项目信息
- 项目名称：${context.name}
- 项目描述：${context.description}
- 项目类型：${context.type}

## 提交记录
${commitSummaries}

## 要求
1. ${languageInstruction}
2. 使用简洁、易懂的语言，面向产品用户
3. 按变更类型分组（新功能、问题修复、改进、其他）
4. 每个变更条目应该清晰说明对用户的影响
5. 使用 Markdown 格式
6. 标题使用"## [版本号] - 日期"格式
7. 突出重要的新功能和修复

## 输出格式
请按照以下格式输出：

## [版本号] - ${new Date().toISOString().split('T')[0]}

### 新功能
- 功能描述1
- 功能描述2

### 问题修复
- 修复描述1

### 改进
- 改进描述1

### 其他
- 其他变更描述1
`;
  }

  /**
   * 生成技术博客提示词
   * @param commits commit 分析结果列表
   * @param context 项目上下文
   * @param language 目标语言
   * @returns 提示词
   */
  generateTechnicalPrompt(
    commits: CommitAnalysis[],
    context: ProjectContext,
    language: string
  ): string {
    const languageInstruction = this.getLanguageInstruction(language);
    const commitDetails = this.formatCommitDetails(commits);
    const techStack = this.formatTechStack(context.tech_stack);

    return `你是一个资深的技术博客作者。请根据以下代码变更，撰写一篇面向开发者的技术博客文章。

## 项目信息
- 项目名称：${context.name}
- 项目描述：${context.description}
- 技术栈：${techStack}

## 代码变更详情
${commitDetails}

## 要求
1. ${languageInstruction}
2. 使用专业、深入的技术语言
3. 解释代码变更的技术原理和设计思路
4. 包含代码示例和最佳实践
5. 讨论技术选型和权衡
6. 使用 Markdown 格式
7. 文章长度 1000-2000 字
8. 包含引言、正文、总结三个部分

## 输出格式
请按照以下格式输出：

# [文章标题]

> 简短的文章摘要

## 背景

[背景介绍]

## 技术实现

[详细的技术实现说明，包含代码示例]

### 代码示例

\`\`\`typescript
// 代码示例
\`\`\`

## 设计思考

[设计决策和技术权衡]

## 总结

[总结和展望]
`;
  }

  /**
   * 生成 SEO 博客提示词
   * @param commits commit 分析结果列表
   * @param context 项目上下文
   * @param language 目标语言
   * @param keywords 目标关键词
   * @returns 提示词
   */
  generateSEOPrompt(
    commits: CommitAnalysis[],
    context: ProjectContext,
    language: string,
    keywords: string[]
  ): string {
    const languageInstruction = this.getLanguageInstruction(language);
    const commitSummaries = this.formatCommitSummaries(commits);
    const keywordList = keywords.join('、');

    return `你是一个专业的 SEO 内容撰写专家。请根据以下信息，撰写一篇 SEO 优化的博客文章。

## 项目信息
- 项目名称：${context.name}
- 项目描述：${context.description}

## 变更内容
${commitSummaries}

## 目标关键词
${keywordList}

## 要求
1. ${languageInstruction}
2. 标题包含主要关键词
3. 文章结构清晰，使用 H2、H3 标题层级
4. 关键词自然分布在标题和正文中
5. 段落简短，易于阅读
6. 包含内部链接建议
7. 文章长度 800-1500 字
8. 使用 Markdown 格式

## 输出格式
请按照以下格式输出：

# [包含关键词的标题]

## [副标题1]

[正文内容]

## [副标题2]

[正文内容]

## 总结

[总结内容]

---
**SEO 元数据**
- 标题：[SEO 标题，60字符以内]
- 描述：[SEO 描述，160字符以内]
- 关键词：[关键词列表]
`;
  }

  /**
   * 获取语言指令
   * @param language 目标语言
   * @returns 语言指令文本
   */
  private getLanguageInstruction(language: string): string {
    const instructions: Record<string, string> = {
      zh: '使用中文撰写',
      en: '使用英文撰写',
      ja: '使用日文撰写',
      ko: '使用韩文撰写',
    };

    return instructions[language] ?? `使用${language}撰写`;
  }

  /**
   * 格式化 commit 摘要
   * @param commits commit 分析结果列表
   * @returns 格式化的摘要文本
   */
  private formatCommitSummaries(commits: CommitAnalysis[]): string {
    return commits
      .map((commit) => {
        const typeEmoji = this.getTypeEmoji(commit.summary.type);
        const breaking = commit.summary.breaking ? ' [破坏性变更]' : '';
        return `- ${typeEmoji} ${commit.message.split('\n')[0]}${breaking}`;
      })
      .join('\n');
  }

  /**
   * 格式化 commit 详情
   * @param commits commit 分析结果列表
   * @returns 格式化的详情文本
   */
  private formatCommitDetails(commits: CommitAnalysis[]): string {
    return commits
      .map((commit) => {
        const parts: string[] = [];
        parts.push(`### Commit: ${commit.hash.substring(0, 8)}`);
        parts.push(`消息: ${commit.message}`);
        parts.push(`类型: ${commit.summary.type}`);
        parts.push(`影响级别: ${commit.impact_level}`);

        if (commit.changes.length > 0) {
          parts.push('\n文件变更:');
          for (const change of commit.changes) {
            parts.push(`- ${change.type}: ${change.path}`);
            if (change.functions.length > 0) {
              parts.push('  函数变更:');
              for (const fn of change.functions) {
                parts.push(`    - ${fn.type}: ${fn.name}`);
              }
            }
          }
        }

        return parts.join('\n');
      })
      .join('\n\n');
  }

  /**
   * 格式化技术栈
   * @param techStack 技术栈信息
   * @returns 格式化的技术栈文本
   */
  private formatTechStack(techStack: { language: string[]; frameworks: string[] }): string {
    const parts: string[] = [];

    if (techStack.language.length > 0) {
      parts.push(`语言: ${techStack.language.join(', ')}`);
    }
    if (techStack.frameworks.length > 0) {
      parts.push(`框架: ${techStack.frameworks.join(', ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * 获取变更类型对应的 emoji
   * @param type 变更类型
   * @returns emoji
   */
  private getTypeEmoji(type: string): string {
    const emojis: Record<string, string> = {
      feature: '✨',
      fix: '🐛',
      refactor: '♻️',
      docs: '📝',
      test: '✅',
      chore: '🔧',
    };

    return emojis[type] ?? '📦';
  }
}
