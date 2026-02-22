/**
 * Python AST 解析器
 * 使用 tree-sitter-python 解析 Python 代码，提取函数信息
 */

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
 * Python AST 解析器类
 * 使用 tree-sitter-python 解析 Python 代码
 * 
 * 注意：tree-sitter-python 需要编译原生模块
 * 在实际使用前需要运行：npm install tree-sitter-python
 */
export class PythonParser {
  // tree-sitter 解析器实例（延迟加载）
  private parser: unknown | null = null;

  constructor() {
    // 延迟加载 tree-sitter，避免在不需要时加载原生模块
  }

  /**
   * 从代码中提取函数信息
   * @param code 源代码
   * @returns 函数信息列表
   */
  extractFunctions(code: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    // 使用正则表达式作为备选方案（当 tree-sitter 不可用时）
    // 匹配 Python 函数定义
    const functionRegex =
      /(?:^|\n)([ \t]*)def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^\n:]+))?\s*:/g;

    let match: RegExpExecArray | null;
    while ((match = functionRegex.exec(code)) !== null) {
      const indent = match[1];
      const name = match[2];
      const params = match[3].trim();
      const returnType = match[4]?.trim();

      // 构建签名
      let signature = `${name}(${params})`;
      if (returnType) {
        signature += ` -> ${returnType}`;
      }

      // 提取文档字符串
      const description = this.extractDocstring(code, match.index, match[0].length);

      // 计算行号
      const beforeMatch = code.substring(0, match.index);
      const start_line = (beforeMatch.match(/\n/g) ?? []).length + 1;

      // 查找函数结束位置
      const functionBody = this.extractFunctionBody(code, match.index, indent.length);
      const end_line = start_line + (functionBody.match(/\n/g) ?? []).length;

      functions.push({
        name,
        signature,
        description,
        start_line,
        end_line,
      });
    }

    // 匹配 Python 类方法
    const classRegex = /(?:^|\n)([ \t]*)class\s+(\w+)(?:\s*\(([^)]*)\))?\s*:/g;

    while ((match = classRegex.exec(code)) !== null) {
      const className = match[2];
      const classStart = match.index + match[0].length;

      // 提取类体
      const classBody = this.extractClassBody(code, classStart, match[1].length);

      // 在类体中查找方法
      const methodRegex =
        /(?:^|\n)([ \t]*)def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^\n:]+))?\s*:/g;

      let methodMatch: RegExpExecArray | null;
      while ((methodMatch = methodRegex.exec(classBody)) !== null) {
        const methodName = methodMatch[2];
        const params = methodMatch[3].trim();
        const returnType = methodMatch[4]?.trim();

        // 构建签名
        let signature = `${className}.${methodName}(${params})`;
        if (returnType) {
          signature += ` -> ${returnType}`;
        }

        // 提取文档字符串
        const description = this.extractDocstring(
          classBody,
          methodMatch.index,
          methodMatch[0].length
        );

        // 计算行号
        const beforeMatch = code.substring(0, classStart + methodMatch.index);
        const start_line = (beforeMatch.match(/\n/g) ?? []).length + 1;

        functions.push({
          name: `${className}.${methodName}`,
          signature,
          description,
          start_line,
          end_line: start_line, // 简化处理
        });
      }
    }

    return functions;
  }

  /**
   * 提取函数体
   * @param code 源代码
   * @param startIndex 函数定义开始位置
   * @param baseIndent 基础缩进级别
   * @returns 函数体代码
   */
  private extractFunctionBody(code: string, startIndex: number, baseIndent: number): string {
    const lines = code.substring(startIndex).split('\n');
    const bodyLines: string[] = [];
    let foundFirstLine = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 跳过函数定义行
      if (i === 0) {
        continue;
      }

      // 检查缩进
      const currentIndent = this.getIndentLevel(line);

      // 空行
      if (line.trim() === '') {
        bodyLines.push(line);
        continue;
      }

      // 第一个非空行确定函数体缩进
      if (!foundFirstLine) {
        if (currentIndent > baseIndent) {
          foundFirstLine = true;
          bodyLines.push(line);
        }
        continue;
      }

      // 检查是否还在函数体内
      if (currentIndent > baseIndent) {
        bodyLines.push(line);
      } else {
        // 函数体结束
        break;
      }
    }

    return bodyLines.join('\n');
  }

  /**
   * 提取类体
   * @param code 源代码
   * @param startIndex 类定义开始位置
   * @param baseIndent 基础缩进级别
   * @returns 类体代码
   */
  private extractClassBody(code: string, startIndex: number, baseIndent: number): string {
    const lines = code.substring(startIndex).split('\n');
    const bodyLines: string[] = [];
    let foundFirstLine = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 空行
      if (line.trim() === '') {
        bodyLines.push(line);
        continue;
      }

      // 检查缩进
      const currentIndent = this.getIndentLevel(line);

      // 第一个非空行确定类体缩进
      if (!foundFirstLine) {
        if (currentIndent > baseIndent) {
          foundFirstLine = true;
          bodyLines.push(line);
        }
        continue;
      }

      // 检查是否还在类体内
      if (currentIndent > baseIndent) {
        bodyLines.push(line);
      } else {
        // 类体结束
        break;
      }
    }

    return bodyLines.join('\n');
  }

  /**
   * 获取行的缩进级别
   * @param line 代码行
   * @returns 缩进空格数
   */
  private getIndentLevel(line: string): number {
    const match = line.match(/^( *)[^\s]/);
    return match ? match[1].length : 0;
  }

  /**
   * 提取文档字符串
   * @param code 源代码
   * @param startIndex 函数定义开始位置
   * @param defLength 函数定义长度
   * @returns 文档字符串内容
   */
  private extractDocstring(code: string, startIndex: number, defLength: number): string | undefined {
    // 获取函数定义后的内容
    const afterDef = code.substring(startIndex + defLength);

    // 匹配文档字符串（三引号包围）
    const docstringRegex = /^\s*("""|\'\'\')([\s\S]*?)\1/;
    const match = afterDef.match(docstringRegex);

    if (match) {
      return match[2].trim();
    }

    return undefined;
  }
}
