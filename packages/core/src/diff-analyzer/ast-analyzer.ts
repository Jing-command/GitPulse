/**
 * AST 分析器
 * 对代码进行抽象语法树分析，提取函数级变更
 */

import type { FileChange, FunctionChange } from '../types';
import { JSTSParser } from './js-ts-parser';
import { PythonParser } from './python-parser';

/**
 * AST 分析器类
 * 根据编程语言选择合适的解析器进行 AST 分析
 */
export class ASTAnalyzer {
  // JS/TS 解析器实例
  private jsTsParser: JSTSParser;
  // Python 解析器实例
  private pythonParser: PythonParser;

  constructor() {
    this.jsTsParser = new JSTSParser();
    this.pythonParser = new PythonParser();
  }

  /**
   * 分析文件变更，提取函数级变更
   * @param change 文件变更信息
   * @param oldContent 变更前的文件内容（可选）
   * @param newContent 变更后的文件内容（可选）
   * @returns 函数级变更列表
   */
  analyze(change: FileChange, oldContent?: string, newContent?: string): FunctionChange[] {
    // 根据编程语言选择解析器
    switch (change.language) {
      case 'javascript':
      case 'typescript':
        return this.analyzeJSTS(change, oldContent, newContent);
      case 'python':
        return this.analyzePython(change, oldContent, newContent);
      default:
        // 不支持的语言，返回空数组
        return [];
    }
  }

  /**
   * 分析 JS/TS 代码变更
   * @param change 文件变更信息
   * @param oldContent 变更前的文件内容
   * @param newContent 变更后的文件内容
   * @returns 函数级变更列表
   */
  private analyzeJSTS(
    change: FileChange,
    oldContent?: string,
    newContent?: string
  ): FunctionChange[] {
    const functions: FunctionChange[] = [];

    // 处理新增文件
    if (change.type === 'add' && newContent) {
      const newFunctions = this.jsTsParser.extractFunctions(newContent);
      for (const fn of newFunctions) {
        functions.push({
          name: fn.name,
          type: 'add',
          signature: fn.signature,
          description: fn.description,
        });
      }
    }
    // 处理删除文件
    else if (change.type === 'delete' && oldContent) {
      const oldFunctions = this.jsTsParser.extractFunctions(oldContent);
      for (const fn of oldFunctions) {
        functions.push({
          name: fn.name,
          type: 'delete',
          signature: fn.signature,
          description: fn.description,
        });
      }
    }
    // 处理修改文件
    else if (oldContent && newContent) {
      const oldFunctions = this.jsTsParser.extractFunctions(oldContent);
      const newFunctions = this.jsTsParser.extractFunctions(newContent);

      // 检测新增的函数
      for (const newFn of newFunctions) {
        const exists = oldFunctions.some((oldFn) => oldFn.name === newFn.name);
        if (!exists) {
          functions.push({
            name: newFn.name,
            type: 'add',
            signature: newFn.signature,
            description: newFn.description,
          });
        }
      }

      // 检测删除的函数
      for (const oldFn of oldFunctions) {
        const exists = newFunctions.some((newFn) => newFn.name === oldFn.name);
        if (!exists) {
          functions.push({
            name: oldFn.name,
            type: 'delete',
            signature: oldFn.signature,
            description: oldFn.description,
          });
        }
      }

      // 检测修改的函数
      for (const newFn of newFunctions) {
        const oldFn = oldFunctions.find((f) => f.name === newFn.name);
        if (oldFn && oldFn.signature !== newFn.signature) {
          functions.push({
            name: newFn.name,
            type: 'modify',
            signature: newFn.signature,
            description: newFn.description,
          });
        }
      }
    }

    return functions;
  }

  /**
   * 分析 Python 代码变更
   * @param change 文件变更信息
   * @param oldContent 变更前的文件内容
   * @param newContent 变更后的文件内容
   * @returns 函数级变更列表
   */
  private analyzePython(
    change: FileChange,
    oldContent?: string,
    newContent?: string
  ): FunctionChange[] {
    const functions: FunctionChange[] = [];

    // 处理新增文件
    if (change.type === 'add' && newContent) {
      const newFunctions = this.pythonParser.extractFunctions(newContent);
      for (const fn of newFunctions) {
        functions.push({
          name: fn.name,
          type: 'add',
          signature: fn.signature,
          description: fn.description,
        });
      }
    }
    // 处理删除文件
    else if (change.type === 'delete' && oldContent) {
      const oldFunctions = this.pythonParser.extractFunctions(oldContent);
      for (const fn of oldFunctions) {
        functions.push({
          name: fn.name,
          type: 'delete',
          signature: fn.signature,
          description: fn.description,
        });
      }
    }
    // 处理修改文件
    else if (oldContent && newContent) {
      const oldFunctions = this.pythonParser.extractFunctions(oldContent);
      const newFunctions = this.pythonParser.extractFunctions(newContent);

      // 检测新增的函数
      for (const newFn of newFunctions) {
        const exists = oldFunctions.some((oldFn) => oldFn.name === newFn.name);
        if (!exists) {
          functions.push({
            name: newFn.name,
            type: 'add',
            signature: newFn.signature,
            description: newFn.description,
          });
        }
      }

      // 检测删除的函数
      for (const oldFn of oldFunctions) {
        const exists = newFunctions.some((newFn) => newFn.name === oldFn.name);
        if (!exists) {
          functions.push({
            name: oldFn.name,
            type: 'delete',
            signature: oldFn.signature,
            description: oldFn.description,
          });
        }
      }

      // 检测修改的函数
      for (const newFn of newFunctions) {
        const oldFn = oldFunctions.find((f) => f.name === newFn.name);
        if (oldFn && oldFn.signature !== newFn.signature) {
          functions.push({
            name: newFn.name,
            type: 'modify',
            signature: newFn.signature,
            description: newFn.description,
          });
        }
      }
    }

    return functions;
  }
}
