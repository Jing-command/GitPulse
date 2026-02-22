/**
 * 变更分类器
 * 对代码变更进行智能分类和影响评估
 */

import type { CommitAnalysis, FileChange, ChangeSummary } from '../types';

/**
 * 变更分类器类
 * 根据变更内容和 commit 消息对变更进行分类
 */
export class ChangeClassifier {
  /**
   * 分析 commit 的影响级别
   * @param analysis commit 分析结果
   * @returns 影响级别
   */
  classifyImpactLevel(analysis: CommitAnalysis): 'major' | 'minor' | 'patch' {
    // 破坏性变更为 major
    if (analysis.summary.breaking) {
      return 'major';
    }

    // 新功能为 minor
    if (analysis.summary.type === 'feature') {
      return 'minor';
    }

    // 根据变更文件数量和类型判断
    const fileCount = analysis.changes.length;
    const hasCoreChanges = this.hasCoreFileChanges(analysis.changes);

    // 核心文件变更且文件数量多，视为 major
    if (hasCoreChanges && fileCount > 10) {
      return 'major';
    }

    // 核心文件变更或文件数量较多，视为 minor
    if (hasCoreChanges || fileCount > 5) {
      return 'minor';
    }

    return 'patch';
  }

  /**
   * 检查是否有核心文件变更
   * @param changes 文件变更列表
   * @returns 是否有核心文件变更
   */
  private hasCoreFileChanges(changes: FileChange[]): boolean {
    // 核心文件路径模式
    const corePatterns = [
      /src\/index\.(ts|js)$/,
      /src\/main\.(ts|js)$/,
      /src\/core\//,
      /src\/lib\//,
      /package\.json$/,
      /tsconfig\.json$/,
      /\.env/,
      /config\//,
    ];

    return changes.some((change) =>
      corePatterns.some((pattern) => pattern.test(change.path))
    );
  }

  /**
   * 对变更进行分组
   * @param changes 文件变更列表
   * @returns 分组后的变更
   */
  groupChanges(changes: FileChange[]): Map<string, FileChange[]> {
    const groups = new Map<string, FileChange[]>();

    for (const change of changes) {
      // 提取目录路径作为分组依据
      const dir = this.extractDirectory(change.path);

      if (!groups.has(dir)) {
        groups.set(dir, []);
      }

      groups.get(dir)?.push(change);
    }

    return groups;
  }

  /**
   * 提取目录路径
   * @param filePath 文件路径
   * @returns 目录路径
   */
  private extractDirectory(filePath: string): string {
    // 处理重命名路径
    if (filePath.includes(' -> ')) {
      filePath = filePath.split(' -> ')[1];
    }

    const lastSlash = filePath.lastIndexOf('/');
    if (lastSlash === -1) {
      return 'root';
    }

    return filePath.substring(0, lastSlash);
  }

  /**
   * 计算变更的复杂度分数
   * @param analysis commit 分析结果
   * @returns 复杂度分数 (0-100)
   */
  calculateComplexity(analysis: CommitAnalysis): number {
    let score = 0;

    // 基于文件数量
    score += Math.min(analysis.changes.length * 5, 30);

    // 基于 hunks 数量和大小
    const totalHunks = analysis.changes.reduce((sum, c) => sum + c.hunks.length, 0);
    score += Math.min(totalHunks * 3, 20);

    // 基于函数变更数量
    const totalFunctions = analysis.changes.reduce((sum, c) => sum + c.functions.length, 0);
    score += Math.min(totalFunctions * 5, 30);

    // 基于变更类型
    if (analysis.summary.breaking) {
      score += 20;
    }
    if (analysis.summary.type === 'feature') {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * 生成变更摘要描述
   * @param analysis commit 分析结果
   * @returns 摘要描述
   */
  generateSummaryDescription(analysis: CommitAnalysis): string {
    const parts: string[] = [];

    // 添加变更类型描述
    const typeDescriptions: Record<string, string> = {
      feature: '新增功能',
      fix: '修复问题',
      refactor: '代码重构',
      docs: '文档更新',
      test: '测试相关',
      chore: '其他变更',
    };

    parts.push(typeDescriptions[analysis.summary.type] ?? '代码变更');

    // 添加影响范围
    if (analysis.summary.scope.length > 0) {
      parts.push(`(${analysis.summary.scope.join(', ')})`);
    }

    // 添加文件统计
    const added = analysis.changes.filter((c) => c.type === 'add').length;
    const modified = analysis.changes.filter((c) => c.type === 'modify').length;
    const deleted = analysis.changes.filter((c) => c.type === 'delete').length;

    const stats: string[] = [];
    if (added > 0) stats.push(`新增 ${added} 个文件`);
    if (modified > 0) stats.push(`修改 ${modified} 个文件`);
    if (deleted > 0) stats.push(`删除 ${deleted} 个文件`);

    if (stats.length > 0) {
      parts.push(`：${stats.join('，')}`);
    }

    return parts.join('');
  }
}
