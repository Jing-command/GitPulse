/**
 * Diff 解析器测试
 */

import { describe, it, expect } from 'vitest';
import { DiffParser } from './parser';
import { ChangeClassifier } from './classifier';

describe('DiffParser', () => {
  const parser = new DiffParser();

  describe('parseDiff', () => {
    it('应该正确解析简单的 diff', () => {
      const diff = `diff --git a/src/test.ts b/src/test.ts
index 1234567..abcdefg 100644
--- a/src/test.ts
+++ b/src/test.ts
@@ -1,5 +1,6 @@
 import { test } from 'vitest';
 
+// 新增注释
 function hello() {
   return 'world';
 }`;

      const changes = parser.parseDiff(diff);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toBeDefined();
      expect(changes[0]!.path).toBe('src/test.ts');
      expect(changes[0]!.type).toBe('modify');
      expect(changes[0]!.language).toBe('typescript');
    });

    it('应该正确识别新增文件', () => {
      const diff = `diff --git a/src/new.ts b/src/new.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/new.ts
@@ -0,0 +1,5 @@
+export function newFunction() {
+  return 'new';
++}`;

      const changes = parser.parseDiff(diff);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toBeDefined();
      expect(changes[0]!.type).toBe('add');
    });

    it('应该正确识别删除文件', () => {
      const diff = `diff --git a/src/old.ts b/src/old.ts
deleted file mode 100644
index 1234567..0000000
--- a/src/old.ts
+++ /dev/null
@@ -1,5 +0,0 @@
-export function oldFunction() {
-  return 'old';
-}`;

      const changes = parser.parseDiff(diff);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toBeDefined();
      expect(changes[0]!.type).toBe('delete');
    });
  });

  describe('extractSummary', () => {
    it('应该正确解析 feature 类型的 commit', () => {
      const message = 'feat: 添加新的分析功能\n\n- 支持 AST 分析\n- 支持多语言';
      const summary = parser.extractSummary(message);

      expect(summary.type).toBe('feature');
      expect(summary.breaking).toBe(false);
    });

    it('应该正确解析 fix 类型的 commit', () => {
      const message = 'fix: 修复解析错误';
      const summary = parser.extractSummary(message);

      expect(summary.type).toBe('fix');
    });

    it('应该正确识别破坏性变更', () => {
      const message = 'feat!: 重构 API 接口\n\nBREAKING CHANGE: 接口签名已变更';
      const summary = parser.extractSummary(message);

      expect(summary.type).toBe('feature');
      expect(summary.breaking).toBe(true);
    });
  });
});

describe('ChangeClassifier', () => {
  const classifier = new ChangeClassifier();

  describe('classifyImpactLevel', () => {
    it('应该正确识别 major 级别变更', () => {
      const analysis = {
        hash: 'abc123',
        message: 'feat!: 重构 API',
        author: 'test',
        author_email: 'test@test.com',
        timestamp: new Date(),
        changes: [],
        summary: {
          type: 'feature' as const,
          scope: [],
          keywords: [],
          breaking: true,
        },
        impact_level: 'patch' as const,
      };

      const level = classifier.classifyImpactLevel(analysis);
      expect(level).toBe('major');
    });

    it('应该正确识别 minor 级别变更', () => {
      const analysis = {
        hash: 'abc123',
        message: 'feat: 添加新功能',
        author: 'test',
        author_email: 'test@test.com',
        timestamp: new Date(),
        changes: [],
        summary: {
          type: 'feature' as const,
          scope: [],
          keywords: [],
          breaking: false,
        },
        impact_level: 'patch' as const,
      };

      const level = classifier.classifyImpactLevel(analysis);
      expect(level).toBe('minor');
    });

    it('应该正确识别 patch 级别变更', () => {
      const analysis = {
        hash: 'abc123',
        message: 'fix: 修复问题',
        author: 'test',
        author_email: 'test@test.com',
        timestamp: new Date(),
        changes: [],
        summary: {
          type: 'fix' as const,
          scope: [],
          keywords: [],
          breaking: false,
        },
        impact_level: 'patch' as const,
      };

      const level = classifier.classifyImpactLevel(analysis);
      expect(level).toBe('patch');
    });
  });
});
