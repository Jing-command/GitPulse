/**
 * 项目管理页面
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, GitBranch } from 'lucide-react';
import { projectsAPI } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string | null;
  repo_url: string;
  commits_count: number;
  contents_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Projects 页面
 * 显示项目列表、添加/编辑项目
 */
function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects();
      setProjects(response.data.items);
    } catch (err) {
      setError('获取项目列表失败');
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
          <h1 className="text-2xl font-semibold text-foreground">项目管理</h1>
          <p className="mt-1 text-sm text-neutral-500">管理您的 Git 项目</p>
        </div>
        <button className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600">
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索项目..."
            className="input h-10 w-full pl-10"
          />
        </div>
        <select className="input h-10 w-40">
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="inactive">不活跃</option>
        </select>
      </div>

      {/* 项目列表 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            name={project.name}
            description={project.description || ''}
            repoUrl={project.repo_url}
            commits={project.commits_count}
            contents={project.contents_count}
            updatedAt={project.updated_at}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-neutral-500">暂无项目</p>
            <p className="mt-2 text-sm text-neutral-400">点击"新建项目"按钮创建第一个项目</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 项目卡片属性
 */
interface ProjectCardProps {
  name: string;
  description: string;
  repoUrl: string;
  commits: number;
  contents: number;
  updatedAt: string;
}

/**
 * 项目卡片组件
 */
function ProjectCard({
  name,
  description,
  repoUrl,
  commits,
  contents,
  updatedAt,
}: ProjectCardProps) {
  // 提取分支名从 repoUrl
  const branch = 'main';
  
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
    <div className="card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 hover:text-primary"
            >
              {repoUrl.replace('https://github.com/', '')}
            </a>
          </div>
        </div>
        <button className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-4 text-sm text-neutral-600 line-clamp-2">{description}</p>

      <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
        <div className="flex items-center gap-1">
          <span className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary">{branch}</span>
        </div>
        <div>{commits} commits</div>
        <div>{contents} 内容</div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-neutral-400">更新于 {formatDate(updatedAt)}</span>
        <button className="btn border border-border px-3 py-1.5 text-sm hover:bg-neutral-50">
          查看详情
        </button>
      </div>
    </div>
  );
}

export default Projects;
