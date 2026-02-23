/**
 * 内容管理页面
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Clock, CheckCircle, X, Loader2 } from 'lucide-react';
import { contentsAPI, projectsAPI, commitsAPI } from '@/lib/api';

interface Content {
  id: string;
  project_id: string;
  project_name: string;
  type: string;
  title: string;
  status: string;
  language: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Content 页面
 * 显示生成的内容列表、编辑、审核
 */
interface Project {
  id: string;
  name: string;
}

function Content() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // 生成内容模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('changelog');
  const [generating, setGenerating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchContents();
  }, [filterType, filterStatus]);

  // 获取项目列表（用于生成内容模态框）
  const fetchProjects = async () => {
    try {
      const data = await projectsAPI.getProjects(1, 100);
      setProjects(data.items);
    } catch (err) {
      console.error('获取项目列表失败', err);
    }
  };

  // 打开生成内容模态框
  const openGenerateModal = () => {
    fetchProjects();
    setSelectedProject('');
    setSelectedType('changelog');
    setModalError(null);
    setIsModalOpen(true);
  };

  // 生成内容
  const handleGenerate = async () => {
    if (!selectedProject) {
      setModalError('请选择项目');
      return;
    }

    setGenerating(true);
    setModalError(null);

    try {
      // 触发 commit 分析来生成内容
      await commitsAPI.analyzeCommits(selectedProject, { incremental: false });

      // 关闭模态框并刷新内容列表
      setIsModalOpen(false);
      fetchContents();
    } catch (err) {
      setModalError('生成内容失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      
      const data = await contentsAPI.getContents(params);
      setContents(data.items);
    } catch (err) {
      setError('获取内容列表失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-neutral-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">内容管理</h1>
          <p className="mt-1 text-sm text-neutral-500">管理生成的内容</p>
        </div>
        <button
          onClick={openGenerateModal}
          className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          生成内容
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索内容..."
            className="input h-10 w-full pl-10"
          />
        </div>
        <select 
          className="input h-10 w-32"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">全部类型</option>
          <option value="changelog">更新日志</option>
          <option value="technical">技术博客</option>
          <option value="seo">SEO 文章</option>
        </select>
        <select 
          className="input h-10 w-32"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="published">已发布</option>
        </select>
        <button className="btn border border-border px-4 py-2 hover:bg-neutral-50">
          <Filter className="mr-2 h-4 w-4" />
          筛选
        </button>
      </div>

      {/* 内容列表 */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                标题
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                项目
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                作者
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                更新时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contents.map((content) => (
              <ContentRow
                key={content.id}
                content={content}
              />
            ))}
          </tbody>
        </table>
        
        {contents.length === 0 && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="text-neutral-500">暂无内容</p>
              <p className="mt-2 text-sm text-neutral-400">点击生成内容按钮创建第一个内容</p>
            </div>
          </div>
        )}
      </div>

      {/* 生成内容模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">生成内容</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                disabled={generating}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-error-50 p-3 text-sm text-error">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground">
                  选择项目
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="input mt-1 w-full"
                  disabled={generating}
                >
                  <option value="">请选择一个项目</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  内容类型
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input mt-1 w-full"
                  disabled={generating}
                >
                  <option value="changelog">更新日志</option>
                  <option value="technical">技术博客</option>
                  <option value="seo">SEO 文章</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn border border-border px-4 py-2 hover:bg-neutral-50"
                disabled={generating}
              >
                取消
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedProject}
                className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  '开始生成'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 内容行组件
 */
function ContentRow({ content }: { content: Content }) {
  const typeLabels: Record<string, string> = {
    changelog: '更新日志',
    technical: '技术博客',
    seo: 'SEO 文章',
  };

  const typeColors: Record<string, string> = {
    changelog: 'bg-primary-50 text-primary',
    technical: 'bg-success-50 text-success',
    seo: 'bg-warning-50 text-warning',
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    published: '已发布',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-600',
    pending: 'bg-warning-50 text-warning',
    approved: 'bg-success-50 text-success',
    published: 'bg-primary-50 text-primary',
  };

  const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    draft: Clock,
    pending: Clock,
    approved: CheckCircle,
    published: CheckCircle,
  };

  const StatusIcon = statusIcons[content.status] || Clock;

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    if (days < 30) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-neutral-400" />
          <span className="font-medium text-foreground">{content.title}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-600">{content.project_name}</span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeColors[content.type]}`}
        >
          {typeLabels[content.type]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusColors[content.status]}`}
        >
          <StatusIcon className="h-3 w-3" />
          {statusLabels[content.status]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-600">{content.author_name}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-500">{formatDate(content.updated_at)}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button className="text-sm text-primary hover:text-primary-600">编辑</button>
          <span className="text-neutral-300">|</span>
          <button className="text-sm text-neutral-500 hover:text-neutral-700">预览</button>
        </div>
      </td>
    </tr>
  );
}

export default Content;
