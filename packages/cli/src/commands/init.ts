/**
 * init 命令
 * 初始化 GitPulse 项目配置
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// 创建 init 命令
export const initCommand = new Command('init')
  .description('初始化 GitPulse 项目配置')
  .option('-y, --yes', '使用默认配置，跳过交互式问答', false)
  .option('-f, --force', '强制覆盖现有配置文件', false)
  .action(async (options) => {
    const spinner = ora('正在初始化...').start();

    try {
      // 检查配置文件是否已存在
      const configPath = join(process.cwd(), '.gitpulserc.yaml');
      if (existsSync(configPath) && !options.force) {
        spinner.fail('配置文件已存在，使用 --force 参数覆盖');
        return;
      }

      // 如果不是默认配置，进行交互式问答
      let config: Record<string, unknown>;

      if (options.yes) {
        config = getDefaultConfig();
      } else {
        spinner.stop();
        config = await promptConfig();
        spinner.start('正在生成配置文件...');
      }

      // 生成 YAML 配置文件
      const yamlContent = YAML.stringify(config, { indentSeq: false });
      await writeFile(configPath, yamlContent, 'utf-8');

      spinner.succeed(chalk.green('初始化完成！'));
      console.log();
      console.log(chalk.gray('配置文件已创建: .gitpulserc.yaml'));
      console.log();
      console.log(chalk.gray('下一步:'));
      console.log(chalk.gray('  1. 编辑 .gitpulserc.yaml 配置 AI 服务'));
      console.log(chalk.gray('  2. 运行 gitpulse analyze 分析代码变更'));
      console.log(chalk.gray('  3. 运行 gitpulse generate 生成文档'));
    } catch (error) {
      spinner.fail(chalk.red('初始化失败'));
      console.error(error);
      process.exit(1);
    }
  });

/**
 * 交互式配置问答
 * @returns 配置对象
 */
async function promptConfig(): Promise<Record<string, unknown>> {
  console.log(chalk.bold('\n🚀 GitPulse 项目配置向导\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: '项目名称:',
      default: process.cwd().split(/[/\\]/).pop(),
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: '项目描述:',
      default: '',
    },
    {
      type: 'list',
      name: 'aiProvider',
      message: '选择 AI 服务商:',
      choices: [
        { name: 'OpenAI (GPT-4)', value: 'openai' },
        { name: 'Anthropic (Claude)', value: 'anthropic' },
        { name: 'Ollama (本地模型)', value: 'ollama' },
      ],
      default: 'openai',
    },
    {
      type: 'list',
      name: 'aiModel',
      message: '选择 AI 模型:',
      choices: (answers) => {
        const models: Record<string, string[]> = {
          openai: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
          anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
          ollama: ['llama2', 'codellama', 'mistral'],
        };
        return models[answers.aiProvider] ?? [];
      },
      default: 'gpt-4-turbo-preview',
    },
    {
      type: 'checkbox',
      name: 'contentTypes',
      message: '选择要生成的内容类型:',
      choices: [
        { name: '更新日志 (Changelog)', value: 'changelog', checked: true },
        { name: '技术博客 (Technical Blog)', value: 'technical', checked: true },
        { name: 'SEO 文章 (SEO Article)', value: 'seo' },
      ],
    },
    {
      type: 'checkbox',
      name: 'languages',
      message: '选择支持的语言:',
      choices: [
        { name: '中文', value: 'zh', checked: true },
        { name: '英文', value: 'en' },
      ],
    },
    {
      type: 'list',
      name: 'docFramework',
      message: '选择文档框架:',
      choices: [
        { name: 'VitePress', value: 'vitepress' },
      ],
      default: 'vitepress',
    },
    {
      type: 'confirm',
      name: 'enableReview',
      message: '启用内容审核流程?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'enablePreview',
      message: '启用内容预览功能?',
      default: true,
    },
  ]);

  // 构建配置对象
  return {
    project: {
      name: answers.projectName,
      description: answers.projectDescription,
    },
    git: {
      repo: '.',
      branch: 'main',
      platforms: ['github'],
    },
    ai: {
      provider: answers.aiProvider,
      model: answers.aiModel,
      api_key: `\${${answers.aiProvider.toUpperCase()}_API_KEY}`,
    },
    content: {
      languages: answers.languages,
      changelog: {
        enabled: answers.contentTypes.includes('changelog'),
        output: './docs/changelog',
      },
      technical: {
        enabled: answers.contentTypes.includes('technical'),
        output: './docs/blog',
      },
      seo: {
        enabled: answers.contentTypes.includes('seo'),
        keywords: [],
      },
      formats: ['markdown'],
    },
    docs: {
      framework: answers.docFramework,
      output: './docs',
      sidebar: './docs/.vitepress/sidebar.ts',
    },
    context: {
      read_package: true,
      read_readme: true,
      analyze_structure: true,
    },
    review: {
      enabled: answers.enableReview,
      auto_publish: false,
    },
    preview: {
      enabled: answers.enablePreview,
      port: 3000,
    },
  };
}

/**
 * 获取默认配置
 * @returns 默认配置对象
 */
function getDefaultConfig(): Record<string, unknown> {
  return {
    project: {
      name: process.cwd().split(/[/\\]/).pop(),
      description: '',
    },
    git: {
      repo: '.',
      branch: 'main',
      platforms: ['github'],
    },
    ai: {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      api_key: '${OPENAI_API_KEY}',
    },
    content: {
      languages: ['zh'],
      changelog: {
        enabled: true,
        output: './docs/changelog',
      },
      technical: {
        enabled: true,
        output: './docs/blog',
      },
      seo: {
        enabled: false,
        keywords: [],
      },
      formats: ['markdown'],
    },
    docs: {
      framework: 'vitepress',
      output: './docs',
      sidebar: './docs/.vitepress/sidebar.ts',
    },
    context: {
      read_package: true,
      read_readme: true,
      analyze_structure: true,
    },
    review: {
      enabled: false,
      auto_publish: false,
    },
    preview: {
      enabled: true,
      port: 3000,
    },
  };
}
