/**
 * 项目管理页面
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  GitBranch,
  X,
  Loader2,
  RefreshCw,
  ArrowLeft,
  GitCommit,
  Calendar,
  User,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { projectsAPI, projectsExtendedAPI, commitsAPI, APIError } from '@/lib/api';
import { ProjectAvatar } from '@/components/ProjectAvatars';

interface Project {
  id: string;
  name: string;
  description: string | null;
  repo_url: string;
  status: string;
  avatar_index: number;
  commits_count: number;
  contents_count: number;
  created_at: string;
  updated_at: string;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  author_email: string;
  date: string;
}

interface Branch {
  name: string;
  label: string;
  current: boolean;
}

/**
 * Projects 页面
 */
function Projects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repo_url: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // 分析状态
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  // 删除状态
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // 项目详情视图 - 从 URL 参数获取当前项目ID
  const projectIdFromUrl = searchParams.get('id');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [detailLoading, setDetailLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // 无限滚动分页状态
  const [commitPage, setCommitPage] = useState(1);
  const [commitTotal, setCommitTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const COMMITS_PER_PAGE = 100;

  // 同步状态
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // 当 URL 参数中有项目ID时，自动加载项目详情
  useEffect(() => {
    if (projectIdFromUrl && projects.length > 0) {
      const project = projects.find((p) => p.id === projectIdFromUrl);
      if (project && !selectedProject) {
        loadProjectDetail(project);
      }
    }
  }, [projectIdFromUrl, projects]);

  // 加载项目详情的独立函数 - 优化：先加载commits（数据库查询快），分支异步加载
  const loadProjectDetail = async (project: Project) => {
    setSelectedProject(project);
    setDetailLoading(true);
    setCommitPage(1);
    setCommits([]);
    setHasMore(true);
    setBranches([]); // 清空分支列表

    try {
      // 先只加载commits（从数据库读取，很快）
      const commitsData = await projectsExtendedAPI.getGitCommits(project.id, {
        branch: selectedBranch,
        page: 1,
        per_page: COMMITS_PER_PAGE,
      });

      setCommits(commitsData.items);
      setCommitTotal(commitsData.total);
      setHasMore(commitsData.items.length < commitsData.total);
      setDetailLoading(false); // 立即显示提交列表

      // 分支列表异步加载（需要从git仓库获取，较慢）
      loadBranchesAsync(project.id);
    } catch (err) {
      console.error('获取项目详情失败:', err);
      setDetailLoading(false);
    }
  };

  // 异步加载分支列表（不阻塞页面显示）
  const loadBranchesAsync = async (projectId: string) => {
    setBranchesLoading(true);
    try {
      const branchesData = await projectsExtendedAPI.getBranches(projectId);
      setBranches(branchesData.branches);

      const branchExists = branchesData.branches.some(
        (b) => b.label === selectedBranch
      );
      if (!branchExists && branchesData.branches.length > 0) {
        const defaultBranch =
          branchesData.branches.find((b) => b.label === 'main')?.label ||
          branchesData.branches.find((b) => b.label === 'master')?.label ||
          branchesData.branches[0]?.label || 'main';
        setSelectedBranch(defaultBranch);
      }
    } catch (err) {
      console.error('获取分支列表失败:', err);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getProjects();
      setProjects(data.items);
      setError(null);
    } catch (err) {
      if (err instanceof APIError && err.code === 401) {
        navigate('/login');
        return;
      }
      setError('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('项目名称不能为空');
      return;
    }
    if (!formData.repo_url.trim()) {
      setFormError('仓库地址不能为空');
      return;
    }

    try {
      setCreating(true);
      setFormError(null);

      await projectsAPI.createProject({
        name: formData.name,
        description: formData.description,
        repo_url: formData.repo_url,
      });

      setIsModalOpen(false);
      setFormData({ name: '', description: '', repo_url: '' });
      await fetchProjects();
    } catch (err) {
      setFormError('创建项目失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  const handleAnalyze = async (projectId: string) => {
    try {
      setAnalyzing(projectId);
      await commitsAPI.analyzeCommits(projectId, {
        incremental: true,
      });
      alert('分析任务已启动，请稍后刷新页面查看结果');
    } catch (err) {
      alert('启动分析失败，请重试');
    } finally {
      setAnalyzing(null);
    }
  };

  // 删除项目
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setDeleting(projectToDelete.id);
    try {
      await projectsAPI.deleteProject(projectToDelete.id);
      await fetchProjects();
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      alert('删除项目失败，请重试');
    } finally {
      setDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
  };

  // 查看项目详情
  const handleViewDetail = (project: Project) => {
    // 更新 URL 参数，触发 useEffect 加载详情
    setSearchParams({ id: project.id });
  };

  // 加载更多 commits
  const loadMoreCommits = useCallback(async () => {
    if (!selectedProject || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = commitPage + 1;

    try {
      const commitsData = await projectsExtendedAPI.getGitCommits(
        selectedProject.id,
        {
          branch: selectedBranch,
          page: nextPage,
          per_page: COMMITS_PER_PAGE,
        }
      );

      setCommits((prev) => [...prev, ...commitsData.items]);
      setCommitPage(nextPage);
      setHasMore(
        commits.length + commitsData.items.length < commitsData.total
      );
    } catch (err) {
      console.error('加载更多提交失败:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [selectedProject, selectedBranch, commitPage, commits.length, loadingMore, hasMore]);

  // 切换分支
  const handleBranchChange = async (branch: string) => {
    if (!selectedProject) return;

    setSelectedBranch(branch);
    setDetailLoading(true);
    setCommitPage(1);
    setHasMore(true);

    try {
      const commitsData = await projectsExtendedAPI.getGitCommits(
        selectedProject.id,
        {
          branch,
          page: 1,
          per_page: COMMITS_PER_PAGE,
        }
      );
      setCommits(commitsData.items);
      setCommitTotal(commitsData.total);
      setHasMore(commitsData.items.length < commitsData.total);
    } catch (err) {
      console.error('获取提交历史失败:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // 返回列表
  const handleBack = () => {
    // 清除 URL 参数，返回项目列表
    navigate('/projects');
    setSelectedProject(null);
    setCommits([]);
    setBranches([]);
  };

  // 同步项目 commits
  const handleSync = async () => {
    if (!selectedProject || syncing) return;

    setSyncing(true);
    try {
      const result = await projectsExtendedAPI.syncCommits(selectedProject.id);
      // 显示成功提示
      alert(result.message || '同步任务已启动');

      // 轮询等待同步完成（最多等待10秒）
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = setInterval(async () => {
        attempts++;
        await loadProjectDetail(selectedProject);
        setLastSyncTime(new Date());

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
        }
      }, 1000);
    } catch (err) {
      console.error('同步失败:', err);
      if (err instanceof APIError) {
        alert(`同步失败: ${err.userMessage}`);
      } else {
        alert('同步任务启动失败，请重试');
      }
    } finally {
      setSyncing(false);
    }
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
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
        <div className="text-center">
          <div className="text-error">{error}</div>
          <button
            onClick={fetchProjects}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 项目详情视图
  if (selectedProject) {
    return (
      <div className="space-y-6">
        {/* 返回按钮和标题 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {selectedProject.name}
            </h1>
            <p className="text-sm text-neutral-500">
              {selectedProject.repo_url}
            </p>
          </div>
        </div>

        {/* 分支选择器和同步按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-500">分支:</span>
            </div>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="input h-10 w-48 appearance-none pr-8"
                disabled={branchesLoading}
              >
                {branches.length === 0 && !branchesLoading && (
                  <option value="main">main</option>
                )}
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.label}>
                    {branch.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
            {branchesLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* 同步按钮 */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn flex items-center gap-2 border border-border px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
            title={lastSyncTime ? `上次同步: ${lastSyncTime.toLocaleString('zh-CN')}` : '从未同步'}
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                从 GitHub 同步
              </>
            )}
          </button>
        </div>

        {/* 提交历史列表 - 使用虚拟滚动 */}
        <div className="card overflow-hidden">
          <div className="border-b border-border bg-neutral-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              提交历史
            </h2>
            <p className="text-sm text-neutral-500">
              共 {commitTotal} 个提交
              {lastSyncTime && (
                <span className="ml-2 text-xs text-neutral-400">
                  (上次同步: {formatDate(lastSyncTime.toISOString())})
                </span>
              )}
            </p>
          </div>

          {detailLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : commits.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <GitCommit className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-4 text-neutral-500">暂无提交记录</p>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="mt-4 btn bg-primary px-4 py-2 text-sm text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      同步中...
                    </>
                  ) : (
                    '从 GitHub 同步数据'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-auto max-h-[600px]">
              {/* 提交列表 */}
              <div className="divide-y divide-border">
                {commits.map((commit) => (
                  <div
                    key={commit.hash}
                    className="px-6 py-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {commit.message}
                        </p>
                        <div className="mt-1 flex items-center gap-4 text-sm text-neutral-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{commit.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(commit.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <code className="rounded bg-neutral-100 px-2 py-1 text-xs font-mono text-neutral-600">
                          {commit.hash.slice(0, 7)}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* 加载更多提示 */}
              {loadingMore && (
                <div className="flex h-16 items-center justify-center border-t border-border">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-neutral-500">加载更多...</span>
                </div>
              )}
              {!hasMore && commits.length > 0 && (
                <div className="flex h-16 items-center justify-center">
                  <span className="text-sm text-neutral-400">已加载全部提交</span>
                </div>
              )}
              {hasMore && !loadingMore && (
                <div className="flex h-16 items-center justify-center border-t border-border">
                  <button
                    onClick={loadMoreCommits}
                    className="btn px-4 py-2 text-sm text-primary hover:bg-primary-50"
                  >
                    加载更多
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 项目列表视图
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">项目管理</h1>
          <p className="mt-1 text-sm text-neutral-500">管理您的 Git 项目</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600"
        >
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
            project={project}
            onAnalyze={handleAnalyze}
            onViewDetail={handleViewDetail}
            onDelete={handleDeleteClick}
            analyzing={analyzing === project.id}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-neutral-500">暂无项目</p>
            <p className="mt-2 text-sm text-neutral-400">
              点击"新建项目"按钮创建第一个项目
            </p>
          </div>
        </div>
      )}

      {/* 新建项目模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                新建项目
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  项目名称 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入项目名称"
                  className="input mt-1 w-full"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  项目描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入项目描述（可选）"
                  rows={3}
                  className="input mt-1 w-full resize-none"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  仓库地址 <span className="text-error">*</span>
                </label>
                <input
                  type="url"
                  value={formData.repo_url}
                  onChange={(e) =>
                    setFormData({ ...formData, repo_url: e.target.value })
                  }
                  placeholder="https://github.com/username/repo"
                  className="input mt-1 w-full"
                  disabled={creating}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  支持 GitHub、GitLab 等 Git 仓库地址
                </p>
              </div>

              {formError && (
                <div className="rounded-lg bg-error-50 p-3 text-sm text-error">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn border border-border px-4 py-2 hover:bg-neutral-50"
                  disabled={creating}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '创建项目'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteConfirmOpen && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                删除项目
              </h2>
            </div>

            <p className="mt-4 text-neutral-600">
              确定要删除项目 <strong>"{projectToDelete.name}"</strong> 吗？此操作不可撤销，项目的所有数据将被永久删除。
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="btn border border-border px-4 py-2 hover:bg-neutral-50"
                disabled={deleting === projectToDelete.id}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="btn bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
                disabled={deleting === projectToDelete.id}
              >
                {deleting === projectToDelete.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
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
 * 项目卡片属性
 */
interface ProjectCardProps {
  project: Project;
  onAnalyze: (projectId: string) => void;
  onViewDetail: (project: Project) => void;
  onDelete: (project: Project) => void;
  analyzing: boolean;
}

/**
 * 项目卡片组件
 */
function ProjectCard({
  project,
  onAnalyze,
  onViewDetail,
  onDelete,
  analyzing,
}: ProjectCardProps) {
  const branch = 'main';

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

  const isActive = project.status === 'active';

  return (
    <div className="card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* 项目头像 */}
          <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm">
            <ProjectAvatar index={project.avatar_index} seed={project.name} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
              {/* 状态标签 */}
              <span
                className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                {isActive ? '活跃' : '不活跃'}
              </span>
            </div>
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 hover:text-primary truncate block"
            >
              {project.repo_url.replace('https://github.com/', '')}
            </a>
          </div>
        </div>
        {/* 删除按钮 */}
        <button
          onClick={() => onDelete(project)}
          className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="删除项目"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-4 text-sm text-neutral-600 line-clamp-2">
        {project.description || '暂无描述'}
      </p>

      <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
        <div className="flex items-center gap-1">
          <span className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary">
            {branch}
          </span>
        </div>
        <div>{project.commits_count} commits</div>
        <div>{project.contents_count} 内容</div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-neutral-400">
          更新于 {formatDate(project.updated_at)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onAnalyze(project.id)}
            disabled={analyzing}
            className="btn flex items-center gap-1 border border-border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                分析代码
              </>
            )}
          </button>
          <button
            onClick={() => onViewDetail(project)}
            className="btn bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-600"
          >
            查看详情
          </button>
        </div>
      </div>
    </div>
  );
}

export default Projects;
