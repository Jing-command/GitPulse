/**
 * 内容编辑页面
 */

import { useParams } from 'react-router-dom';
import { Save, Eye, ArrowLeft, History } from 'lucide-react';

/**
 * ContentEditor 页面
 * 内容编辑器、预览、版本历史
 */
function ContentEditor() {
  const { id } = useParams();

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <div className="h-4 w-px bg-border"></div>
          <h2 className="text-lg font-semibold text-foreground">
            {id ? '编辑内容' : '新建内容'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn border border-border px-3 py-1.5 text-sm hover:bg-neutral-50">
            <History className="mr-2 h-4 w-4" />
            版本历史
          </button>
          <button className="btn border border-border px-3 py-1.5 text-sm hover:bg-neutral-50">
            <Eye className="mr-2 h-4 w-4" />
            预览
          </button>
          <button className="btn bg-primary px-4 py-1.5 text-sm text-white hover:bg-primary-600">
            <Save className="mr-2 h-4 w-4" />
            保存
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：表单 */}
        <div className="w-96 overflow-auto border-r border-border p-6">
          <div className="space-y-6">
            {/* 标题 */}
            <div>
              <label className="label mb-2 block">标题</label>
              <input
                type="text"
                className="input w-full"
                placeholder="输入内容标题"
                defaultValue="v1.2.0 更新日志"
              />
            </div>

            {/* 类型 */}
            <div>
              <label className="label mb-2 block">内容类型</label>
              <select className="input w-full">
                <option value="changelog">更新日志</option>
                <option value="technical">技术博客</option>
                <option value="seo">SEO 文章</option>
              </select>
            </div>

            {/* 语言 */}
            <div>
              <label className="label mb-2 block">语言</label>
              <select className="input w-full">
                <option value="zh">中文</option>
                <option value="en">英文</option>
              </select>
            </div>

            {/* 状态 */}
            <div>
              <label className="label mb-2 block">状态</label>
              <select className="input w-full">
                <option value="draft">草稿</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="published">已发布</option>
              </select>
            </div>

            {/* 关键词 */}
            <div>
              <label className="label mb-2 block">关键词</label>
              <input
                type="text"
                className="input w-full"
                placeholder="输入关键词，用逗号分隔"
                defaultValue="AST, 解析, 分析"
              />
            </div>

            {/* 关联项目 */}
            <div>
              <label className="label mb-2 block">关联项目</label>
              <select className="input w-full">
                <option value="1">GitPulse</option>
                <option value="2">Project Alpha</option>
              </select>
            </div>
          </div>
        </div>

        {/* 右侧：编辑器 */}
        <div className="flex-1 overflow-auto bg-neutral-50 p-6">
          <div className="mx-auto max-w-3xl">
            <textarea
              className="h-full w-full resize-none rounded-lg border border-border bg-white p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="在这里编写内容..."
              defaultValue={`# v1.2.0 更新日志

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
- 🐛 修复增量分析时的边界情况

## 其他

- 📦 更新依赖版本
- 📝 完善文档
`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentEditor;
