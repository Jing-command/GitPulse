/**
 * JavaScript/TypeScript AST 解析器
 * 使用 Babel 解析 JS/TS 代码，提取函数信息
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { Node, Comment, FunctionDeclaration, ArrowFunctionExpression, FunctionExpression, ObjectMethod, ClassMethod, Identifier, RestElement } from '@babel/types';

/**
 * 函数信息接口
 */
interface FunctionInfo {
  /** 函数名称 */
  name: string;
  /** 函数签名 */
  signature: string;
  /** 函数描述（从注释提取） */
  description?: string;
  /** 起始行号 */
  start_line: number;
  /** 结束行号 */
  end_line: number;
}

/**
 * 带注释的节点
 */
type NodeWithComments = Node & {
  leadingComments?: Comment[] | null;
};

/**
 * JS/TS AST 解析器类
 * 使用 Babel 解析 JavaScript 和 TypeScript 代码
 */
export class JSTSParser {
  /**
   * 从代码中提取函数信息
   * @param code 源代码
   * @returns 函数信息列表
   */
  extractFunctions(code: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    try {
      // 使用 Babel 解析代码
      const ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining',
        ],
      });

      // 遍历 AST，提取函数节点
      traverse(ast, {
        // 处理函数声明
        FunctionDeclaration: (path) => {
          const info = this.extractFunctionInfo(path.node);
          if (info) {
            functions.push(info);
          }
        },
        // 处理箭头函数变量声明
        VariableDeclarator: (path) => {
          const node = path.node;
          // 检查是否为箭头函数
          if (
            this.isIdentifier(node.id) &&
            (this.isArrowFunctionExpression(node.init) || this.isFunctionExpression(node.init))
          ) {
            const info = this.extractArrowFunctionInfo(node.id.name, node.init);
            if (info) {
              functions.push(info);
            }
          }
        },
        // 处理对象方法
        ObjectMethod: (path) => {
          const info = this.extractObjectMethodInfo(path.node);
          if (info) {
            functions.push(info);
          }
        },
        // 处理类方法
        ClassMethod: (path) => {
          const info = this.extractClassMethodInfo(path.node);
          if (info) {
            functions.push(info);
          }
        },
      });
    } catch (error) {
      // 解析失败时返回空数组
      console.warn('Failed to parse JS/TS code:', error);
    }

    return functions;
  }

  /**
   * 类型守卫：检查是否为 Identifier
   */
  private isIdentifier(node: unknown): node is Identifier {
    return node !== null && typeof node === 'object' && (node as Node).type === 'Identifier';
  }

  /**
   * 类型守卫：检查是否为箭头函数表达式
   */
  private isArrowFunctionExpression(node: unknown): node is ArrowFunctionExpression {
    return node !== null && typeof node === 'object' && (node as Node).type === 'ArrowFunctionExpression';
  }

  /**
   * 类型守卫：检查是否为函数表达式
   */
  private isFunctionExpression(node: unknown): node is FunctionExpression {
    return node !== null && typeof node === 'object' && (node as Node).type === 'FunctionExpression';
  }

  /**
   * 提取函数声明信息
   */
  private extractFunctionInfo(node: FunctionDeclaration): FunctionInfo | null {
    if (!node.id) {
      return null;
    }

    const name = node.id.name;
    const signature = this.buildSignature(name, node.params);
    const description = this.extractLeadingComment(node);

    return {
      name,
      signature,
      description,
      start_line: node.loc?.start.line ?? 0,
      end_line: node.loc?.end.line ?? 0,
    };
  }

  /**
   * 提取箭头函数信息
   */
  private extractArrowFunctionInfo(
    name: string,
    node: ArrowFunctionExpression | FunctionExpression
  ): FunctionInfo | null {
    const signature = this.buildSignature(name, node.params);
    const description = this.extractLeadingComment(node);

    return {
      name,
      signature,
      description,
      start_line: node.loc?.start.line ?? 0,
      end_line: node.loc?.end.line ?? 0,
    };
  }

  /**
   * 提取对象方法信息
   */
  private extractObjectMethodInfo(node: ObjectMethod): FunctionInfo | null {
    if (!this.isIdentifier(node.key)) {
      return null;
    }

    const name = node.key.name;
    const signature = this.buildSignature(name, node.params);
    const description = this.extractLeadingComment(node);

    return {
      name,
      signature,
      description,
      start_line: node.loc?.start.line ?? 0,
      end_line: node.loc?.end.line ?? 0,
    };
  }

  /**
   * 提取类方法信息
   */
  private extractClassMethodInfo(node: ClassMethod): FunctionInfo | null {
    if (!this.isIdentifier(node.key)) {
      return null;
    }

    const name = node.key.name;

    // 构建签名，包含类方法特性
    let signature = this.buildSignature(name, node.params);
    if (node.static) {
      signature = `static ${signature}`;
    }
    if (node.async) {
      signature = `async ${signature}`;
    }
    if (node.kind === 'get') {
      signature = `get ${signature}`;
    }
    if (node.kind === 'set') {
      signature = `set ${signature}`;
    }

    const description = this.extractLeadingComment(node);

    return {
      name,
      signature,
      description,
      start_line: node.loc?.start.line ?? 0,
      end_line: node.loc?.end.line ?? 0,
    };
  }

  /**
   * 构建函数签名
   */
  private buildSignature(
    name: string,
    params: (Identifier | RestElement | unknown)[]
  ): string {
    // 构建参数列表
    const paramStrings = params.map((param) => {
      if (this.isIdentifier(param)) {
        return param.name;
      }
      if (param && typeof param === 'object' && (param as Node).type === 'RestElement') {
        const restParam = param as RestElement;
        if (this.isIdentifier(restParam.argument)) {
          return `...${restParam.argument.name}`;
        }
      }
      return 'param';
    });

    return `${name}(${paramStrings.join(', ')})`;
  }

  /**
   * 提取节点前导注释
   */
  private extractLeadingComment(node: NodeWithComments): string | undefined {
    const leadingComments = node.leadingComments;
    if (!leadingComments || leadingComments.length === 0) {
      return undefined;
    }

    // 获取最后一个前导注释
    const comment = leadingComments[leadingComments.length - 1];

    // 解析 JSDoc 格式注释
    if (comment.type === 'CommentBlock' && comment.value.startsWith('*')) {
      return this.parseJSDoc(comment.value);
    }

    // 返回普通注释内容
    return comment.value.trim();
  }

  /**
   * 解析 JSDoc 注释
   */
  private parseJSDoc(comment: string): string {
    // 移除开头的 *
    const lines = comment
      .replace(/^\*/, '')
      .split('\n')
      .map((line) => line.replace(/^\s*\*/, '').trim());

    // 提取描述部分（第一个非标签行）
    for (const line of lines) {
      if (line && !line.startsWith('@')) {
        return line;
      }
    }

    return '';
  }
}
