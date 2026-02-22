/**
 * config 命令
 * 管理配置项
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// 创建 config 命令
export const configCommand = new Command('config')
  .description('管理配置项');

// config get 子命令
configCommand
  .command('get <key>')
  .description('获取配置项')
  .action(async (key) => {
    try {
      const config = await loadConfig();
      const value = getNestedValue(config, key);

      if (value === undefined) {
        console.log(chalk.yellow(`配置项 "${key}" 不存在`));
        return;
      }

      if (typeof value === 'object') {
        console.log(YAML.stringify(value));
      } else {
        console.log(value);
      }
    } catch (error) {
      console.error(chalk.red('获取配置失败:'), error);
      process.exit(1);
    }
  });

// config set 子命令
configCommand
  .command('set <key> <value>')
  .description('设置配置项')
  .action(async (key, value) => {
    try {
      const config = await loadConfig();
      setNestedValue(config, key, parseValue(value));

      await saveConfig(config);
      console.log(chalk.green(`✓ 已设置 ${key}`));
    } catch (error) {
      console.error(chalk.red('设置配置失败:'), error);
      process.exit(1);
    }
  });

// config list 子命令
configCommand
  .command('list')
  .description('列出所有配置项')
  .action(async () => {
    try {
      const config = await loadConfig();
      console.log(YAML.stringify(config));
    } catch (error) {
      console.error(chalk.red('读取配置失败:'), error);
      process.exit(1);
    }
  });

/**
 * 加载配置文件
 * @returns 配置对象
 */
async function loadConfig(): Promise<Record<string, unknown>> {
  const configPath = join(process.cwd(), '.gitpulserc.yaml');

  if (!existsSync(configPath)) {
    throw new Error('配置文件不存在，请先运行 gitpulse init');
  }

  const content = await readFile(configPath, 'utf-8');
  return YAML.parse(content) as Record<string, unknown>;
}

/**
 * 保存配置文件
 * @param config 配置对象
 */
async function saveConfig(config: Record<string, unknown>): Promise<void> {
  const configPath = join(process.cwd(), '.gitpulserc.yaml');
  const content = YAML.stringify(config);
  await writeFile(configPath, content, 'utf-8');
}

/**
 * 获取嵌套值
 * @param obj 对象
 * @param path 路径（用点分隔）
 * @returns 值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * 设置嵌套值
 * @param obj 对象
 * @param path 路径（用点分隔）
 * @param value 值
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * 解析值
 * @param value 字符串值
 * @returns 解析后的值
 */
function parseValue(value: string): unknown {
  // 布尔值
  if (value === 'true') return true;
  if (value === 'false') return false;

  // 数字
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  // 字符串
  return value;
}
