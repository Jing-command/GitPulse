/**
 * 数据库种子数据
 * 初始化数据库时创建默认数据
 */

import { PrismaClient } from '@prisma/client';

// 创建 Prisma 客户端实例
const prisma = new PrismaClient();

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('开始填充种子数据...');

  // 创建管理员用户
  const admin = await prisma.users.upsert({
    where: { email: 'admin@gitpulse.dev' },
    update: {},
    create: {
      id: 'user_admin',
      email: 'admin@gitpulse.dev',
      name: 'Admin',
      password: '$2a$10$example_hashed_password', // 实际使用时应该使用 bcrypt 加密
      role: 'admin',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    },
  });

  console.log('创建管理员用户:', admin.email);

  // 创建示例项目
  const project = await prisma.projects.upsert({
    where: { id: 'project_example' },
    update: {},
    create: {
      id: 'project_example',
      name: 'GitPulse',
      description: '技术内容全自动流水线',
      repo_url: 'https://github.com/example/gitpulse',
      config: {
        ai: {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
        },
        content: {
          languages: ['zh', 'en'],
          formats: ['markdown', 'json'],
        },
      },
    },
  });

  console.log('创建示例项目:', project.name);

  // 创建项目成员关联
  await prisma.project_members.upsert({
    where: { id: 'member_admin_example' },
    update: {},
    create: {
      id: 'member_admin_example',
      project_id: project.id,
      user_id: admin.id,
      role: 'admin',
    },
  });

  console.log('创建项目成员关联');

  // 创建示例 commit
  const commit = await prisma.commits.upsert({
    where: { hash: 'abc123def456' },
    update: {},
    create: {
      id: 'commit_example',
      project_id: project.id,
      hash: 'abc123def456',
      message: 'feat: 添加 AST 分析功能\n\n- 支持 JS/TS AST 解析\n- 支持 Python AST 解析\n- 实现函数级变更检测',
      author: 'Developer',
      author_email: 'developer@example.com',
      timestamp: new Date(),
      impact_level: 'minor',
      summary: {
        type: 'feature',
        scope: ['ast-analyzer'],
        keywords: ['AST', '解析', '分析'],
        breaking: false,
      },
      changes: [
        {
          path: 'src/diff-analyzer/ast-analyzer.ts',
          type: 'add',
          language: 'typescript',
          functions: [
            { name: 'analyze', type: 'add' },
            { name: 'parseAST', type: 'add' },
          ],
        },
      ],
    },
  });

  console.log('创建示例 commit:', commit.hash);

  // 创建示例内容
  const content = await prisma.contents.upsert({
    where: { id: 'content_example' },
    update: {},
    create: {
      id: 'content_example',
      project_id: project.id,
      type: 'changelog',
      title: 'v1.0.0 更新日志',
      content: `# v1.0.0 更新日志

## 新功能

- ✨ 添加 AST 分析功能
  - 支持 JS/TS AST 解析
  - 支持 Python AST 解析
  - 实现函数级变更检测

## 改进

- ♻️ 重构 Diff 解析器，提升性能
- 📝 优化 AI Prompt 模板

## 修复

- 🐛 修复大文件解析时的内存泄漏问题
`,
      formats: ['markdown'],
      metadata: {
        commit_hashes: [commit.hash],
        keywords: ['AST', '解析', '分析'],
        author: admin.name,
      },
      language: 'zh',
      status: 'draft',
      author_id: admin.id,
    },
  });

  console.log('创建示例内容:', content.title);

  // 创建项目上下文
  await prisma.contexts.upsert({
    where: { id: 'context_package' },
    update: {},
    create: {
      id: 'context_package',
      project_id: project.id,
      type: 'package',
      data: {
        name: 'gitpulse',
        version: '1.0.0',
        description: '技术内容全自动流水线',
        tech_stack: {
          languages: ['TypeScript'],
          frameworks: ['React', 'Express'],
        },
      },
    },
  });

  console.log('创建项目上下文');

  console.log('种子数据填充完成！');
}

// 执行主函数
main()
  .catch((e) => {
    console.error('种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    // 关闭 Prisma 客户端
    await prisma.$disconnect();
  });
