/**
 * Diff 解析器
 * 解析 Git Diff 内容，提取变更信息
 */

import type { CommitAnalysis, FileChange, DiffHunk, ChangeSummary } from '../types';

/**
 * Diff 解析器类
 * 负责解析 Git Diff 输出，提取结构化的变更信息
 */
export class DiffParser {
  /**
   * 解析 Git Diff 输出
   * @param diffOutput Git diff 命令的原始输出
   * @returns 文件变更列表
   */
  parseDiff(diffOutput: string): FileChange[] {
    // 如果输出为空，返回空数组
    if (!diffOutput || diffOutput.trim() === '') {
      return [];
    }

    // 按文件分割 diff 输出
    const fileDiffs = this.splitByFile(diffOutput);
    const changes: FileChange[] = [];

    // 遍历每个文件的 diff
    for (const fileDiff of fileDiffs) {
      const change = this.parseFileDiff(fileDiff);
      if (change) {
        changes.push(change);
      }
    }

    return changes;
  }

  /**
   * 按文件分割 diff 输出
   * @param diffOutput Git diff 原始输出
   * @returns 文件 diff 数组
   */
  private splitByFile(diffOutput: string): string[] {
    // 使用正则表达式匹配文件头
    const fileHeaderRegex = /^diff --git a\/(.+?) b\/(.+?)$/gm;
    const matches = [...diffOutput.matchAll(fileHeaderRegex)];

    // 如果没有匹配到文件头，返回空数组
    if (matches.length === 0) {
      return [];
    }

    const fileDiffs: string[] = [];

    // 遍历匹配结果，提取每个文件的 diff
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index ?? 0;
      const end = i < matches.length - 1 ? matches[i + 1].index : diffOutput.length;
      fileDiffs.push(diffOutput.slice(start, end));
    }

    return fileDiffs;
  }

  /**
   * 解析单个文件的 diff
   * @param fileDiff 单个文件的 diff 内容
   * @returns 文件变更信息
   */
  private parseFileDiff(fileDiff: string): FileChange | null {
    // 提取文件路径
    const pathMatch = fileDiff.match(/^diff --git a\/(.+?) b\/(.+?)$/m);
    if (!pathMatch) {
      return null;
    }

    // 判断变更类型
    const oldPath = pathMatch[1];
    const newPath = pathMatch[2];
    let type: FileChange['type'] = 'modify';
    let path = newPath;

    // 检测新增文件
    if (fileDiff.includes('new file mode')) {
      type = 'add';
    }
    // 检测删除文件
    else if (fileDiff.includes('deleted file mode')) {
      type = 'delete';
    }
    // 检测重命名
    else if (oldPath !== newPath) {
      type = 'rename';
      path = `${oldPath} -> ${newPath}`;
    }

    // 提取编程语言
    const language = this.detectLanguage(path);

    // 解析 hunks
    const hunks = this.parseHunks(fileDiff);

    return {
      path,
      type,
      language,
      hunks,
      functions: [], // 函数级变更由 AST 分析器填充
    };
  }

  /**
   * 解析 diff hunks
   * @param fileDiff 文件 diff 内容
   * @returns hunk 列表
   */
  private parseHunks(fileDiff: string): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    // 匹配 hunk 头部信息
    const hunkHeaderRegex = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm;
    const matches = [...fileDiff.matchAll(hunkHeaderRegex)];

    for (const match of matches) {
      // 提取行号信息
      const oldStart = parseInt(match[1], 10);
      const oldLines = match[2] ? parseInt(match[2], 10) : 1;
      const newStart = parseInt(match[3], 10);
      const newLines = match[4] ? parseInt(match[4], 10) : 1;

      // 提取 hunk 内容
      const startIndex = match.index ?? 0 + match[0].length;
      let endIndex = fileDiff.length;

      // 查找下一个 hunk 的位置
      const nextMatch = matches.find((m) => (m.index ?? 0) > (match.index ?? 0));
      if (nextMatch) {
        endIndex = nextMatch.index ?? fileDiff.length;
      }

      const content = fileDiff.slice(startIndex, endIndex).trim();

      hunks.push({
        old_start: oldStart,
        old_lines: oldLines,
        new_start: newStart,
        new_lines: newLines,
        content,
      });
    }

    return hunks;
  }

  /**
   * 根据文件扩展名检测编程语言
   * @param filePath 文件路径
   * @returns 编程语言名称
   */
  private detectLanguage(filePath: string): string {
    // 文件扩展名到语言的映射
    const extensionMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.kt': 'kotlin',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.swift': 'swift',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.html': 'html',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sql': 'sql',
      '.sh': 'shell',
      '.bash': 'shell',
    };

    // 提取文件扩展名
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return extensionMap[ext] ?? 'unknown';
  }

  /**
   * 从 commit 消息中提取变更摘要
   * @param message commit 消息
   * @returns 变更摘要
   */
  extractSummary(message: string): ChangeSummary {
    // 解析 Conventional Commits 格式
    const conventionalMatch = message.match(
      /^(feat|fix|refactor|docs|test|chore|style|perf|ci|build|revert)(\(.+\))?!?:\s*(.+)$/m
    );

    if (conventionalMatch) {
      const type = this.mapCommitType(conventionalMatch[1]);
      const scope = conventionalMatch[2] ? conventionalMatch[2].slice(1, -1) : '';
      const description = conventionalMatch[3];
      const breaking = conventionalMatch[0].includes('!') || message.includes('BREAKING CHANGE');

      return {
        type,
        scope: scope ? [scope] : [],
        keywords: this.extractKeywords(description),
        breaking,
      };
    }

    // 非 Conventional Commits 格式，尝试智能分析
    return {
      type: this.inferType(message),
      scope: [],
      keywords: this.extractKeywords(message),
      breaking: message.toLowerCase().includes('breaking'),
    };
  }

  /**
   * 映射 commit 类型到变更类型
   * @param commitType commit 类型字符串
   * @returns 变更类型
   */
  private mapCommitType(commitType: string): ChangeSummary['type'] {
    const typeMap: Record<string, ChangeSummary['type']> = {
      feat: 'feature',
      fix: 'fix',
      refactor: 'refactor',
      docs: 'docs',
      test: 'test',
      chore: 'chore',
      style: 'refactor',
      perf: 'feature',
      ci: 'chore',
      build: 'chore',
      revert: 'fix',
    };

    return typeMap[commitType] ?? 'chore';
  }

  /**
   * 推断变更类型
   * @param message commit 消息
   * @returns 推断的变更类型
   */
  private inferType(message: string): ChangeSummary['type'] {
    const lowerMessage = message.toLowerCase();

    // 基于关键词推断类型
    if (lowerMessage.includes('add') || lowerMessage.includes('新增') || lowerMessage.includes('feature')) {
      return 'feature';
    }
    if (lowerMessage.includes('fix') || lowerMessage.includes('修复') || lowerMessage.includes('bug')) {
      return 'fix';
    }
    if (lowerMessage.includes('refactor') || lowerMessage.includes('重构')) {
      return 'refactor';
    }
    if (lowerMessage.includes('doc') || lowerMessage.includes('文档')) {
      return 'docs';
    }
    if (lowerMessage.includes('test') || lowerMessage.includes('测试')) {
      return 'test';
    }

    return 'chore';
  }

  /**
   * 从文本中提取关键词
   * @param text 文本内容
   * @returns 关键词列表
   */
  private extractKeywords(text: string): string[] {
    // 移除标点符号，转换为小写
    const cleaned = text.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, ' ');

    // 分词
    const words = cleaned.split(/\s+/).filter((w) => w.length > 2);

    // 去重
    return [...new Set(words)].slice(0, 10);
  }
}
