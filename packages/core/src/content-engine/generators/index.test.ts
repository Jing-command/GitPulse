/**
 * 内容生成器测试
 */

import { describe, it, expect, vi } from 'vitest';
import { ChangelogGenerator } from '../generators/changelog-generator';
import { TechnicalGenerator } from '../generators/technical-generator';
import { SEOGenerator } from '../generators/seo-generator';
import type { CommitAnalysis, ProjectContext } from '../../types';

// 模拟 AI 生成函数
const mockGenerate = vi.fn().mockResolvedValue(`
# 更新日志

## 新功能

- ✨ 添加新功能

## 修复

- 🐛 修复问题
`);

describe('ChangelogGenerator', () => {
  const generator = new ChangelogGenerator(mockGenerate);

  const mockCommits: CommitAnalysis[] = [
    {
      hash: 'abc123',
      message: 'feat: 添加新功能',
      author: 'Developer',
      author_email: 'dev@test.com',
      timestamp: new Date(),
      changes: [],
      summary: {
        type: 'feature',
        scope: ['core'],
        keywords: ['新功能'],
        breaking: false,
      },
      impact_level: 'minor',
    },
  ];

  const mockContext: ProjectContext = {
    name: 'TestProject',
    description: '测试项目',
    type: 'cli-tool',
    tech_stack: {
      language: ['TypeScript'],
      frameworks: [],
      tools: [],
      dependencies: [],
    },
    terminology: new Map(),
    style_guide: {
      tone: 'technical',
      language: 'zh',
      code_style: 'standard',
      examples: [],
    },
    structure: {
      name: '.',
      type: 'directory',
      path: '.',
      children: [],
    },
  };

  it('应该成功生成更新日志', async () => {
    const content = await generator.generate(mockCommits, mockContext, 'zh');

    expect(content).toBeDefined();
    expect(content.type).toBe('changelog');
    expect(content.title).toContain('更新日志');
    expect(content.content).toContain('新功能');
  });
});

describe('TechnicalGenerator', () => {
  const generator = new TechnicalGenerator(mockGenerate);

  const mockCommits: CommitAnalysis[] = [
    {
      hash: 'abc123',
      message: 'feat: 添加 AST 分析功能',
      author: 'Developer',
      author_email: 'dev@test.com',
      timestamp: new Date(),
      changes: [
        {
          path: 'src/ast.ts',
          type: 'add',
          language: 'typescript',
          hunks: [],
          functions: [{ name: 'parseAST', type: 'add' }],
        },
      ],
      summary: {
        type: 'feature',
        scope: ['ast'],
        keywords: ['AST', '解析'],
        breaking: false,
      },
      impact_level: 'minor',
    },
  ];

  const mockContext: ProjectContext = {
    name: 'TestProject',
    description: '测试项目',
    type: 'cli-tool',
    tech_stack: {
      language: ['TypeScript'],
      frameworks: [],
      tools: [],
      dependencies: [],
    },
    terminology: new Map([['AST', '抽象语法树']]),
    style_guide: {
      tone: 'technical',
      language: 'zh',
      code_style: 'standard',
      examples: [],
    },
    structure: {
      name: '.',
      type: 'directory',
      path: '.',
      children: [],
    },
  };

  it('应该成功生成技术博客', async () => {
    const content = await generator.generate(mockCommits, mockContext, 'zh');

    expect(content).toBeDefined();
    expect(content.type).toBe('technical');
    expect(content.content.length).toBeGreaterThan(0);
  });
});

describe('SEOGenerator', () => {
  const generator = new SEOGenerator(mockGenerate);

  const mockCommits: CommitAnalysis[] = [
    {
      hash: 'abc123',
      message: 'feat: 添加 SEO 优化功能',
      author: 'Developer',
      author_email: 'dev@test.com',
      timestamp: new Date(),
      changes: [],
      summary: {
        type: 'feature',
        scope: ['seo'],
        keywords: ['SEO', '优化'],
        breaking: false,
      },
      impact_level: 'minor',
    },
  ];

  const mockContext: ProjectContext = {
    name: 'TestProject',
    description: '测试项目',
    type: 'web-app',
    tech_stack: {
      language: ['TypeScript'],
      frameworks: ['React'],
      tools: [],
      dependencies: [],
    },
    terminology: new Map(),
    style_guide: {
      tone: 'technical',
      language: 'zh',
      code_style: 'standard',
      examples: [],
    },
    structure: {
      name: '.',
      type: 'directory',
      path: '.',
      children: [],
    },
  };

  it('应该成功生成 SEO 文章', async () => {
    const content = await generator.generate(mockCommits, mockContext, 'zh');

    expect(content).toBeDefined();
    expect(content.type).toBe('seo');
    expect(content.metadata.seo_score).toBeDefined();
  });
});
