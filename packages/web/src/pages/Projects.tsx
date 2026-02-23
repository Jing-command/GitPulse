/**
 * 项目管理页面
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Sparkles,
  Shield,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Cpu,
  Database,
  Settings,
  Layout,
  TestTube,
  ChevronRight,
  ChevronUp,
  CheckCircle,
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
  summary?: {
    type?: string;
    breaking?: boolean;
    scope?: string[];
    keywords?: string[];
    semanticType?: string;
    techDomain?: string[];
    codeQuality?: {
      readability: number;
      complexity: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    impactScope?: {
      api: boolean;
      database: boolean;
      config: boolean;
      ui: boolean;
      test: boolean;
      others: string[];
    };
    aiSummary?: string;
    aiDescription?: string;
    aiRisks?: string[];
    aiSuggestions?: string[];
    aiConfidence?: number;
    batchInfo?: {
      totalFiles: number;
      analyzedFiles: number;
      batches: number;
    };
  };
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
  const queryClient = useQueryClient();

  // 使用 useQuery 获取项目列表，staleTime: 0 确保每次进入页面都刷新
  const {
    data: projectsData,
    isLoading: loading,
    error: queryError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getProjects(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const projects = projectsData?.items || [];
  const error = queryError ? '获取项目列表失败' : null;

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
  const [aiConfigStatus, setAiConfigStatus] = useState<{
    ai_enabled: boolean;
    provider: string;
    model: string;
    base_url: string;
    api_key_configured: boolean;
    source?: 'user' | 'server' | 'none';
  } | null>(null);
  const [aiConfigLoading, setAiConfigLoading] = useState(false);

  // 分析进度弹窗状态
  const [analysisProgress, setAnalysisProgress] = useState<{
    isOpen: boolean;
    projectId: string;
    projectName: string;
    status: 'running' | 'completed' | 'failed';
    message: string;
    progress: number; // 0-100
    analyzedCount: number;
    totalCount: number;
    startTime: Date;
  } | null>(null);

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

  // 加载 AI 配置状态（合并后端环境变量和前端 localStorage 配置）
  useEffect(() => {
    const loadAIConfig = async () => {
      try {
        setAiConfigLoading(true);

        // 检查 localStorage 中的用户配置
        const savedConfig = localStorage.getItem('gitpulse-ai-config');
        let userConfig = null;
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            if (parsed.apiKey) {
              userConfig = {
                provider: parsed.provider || 'yunwu',
                model: parsed.model || 'gemini-2.0-flash-exp',
                apiKey: parsed.apiKey,
                baseUrl: parsed.baseUrl || 'https://api.yunwu.ai/v1',
              };
            }
          } catch {
            console.error('解析本地 AI 配置失败');
          }
        }

        // 获取后端环境变量配置状态
        const serverStatus = await commitsAPI.getAIConfigStatus();

        // 合并状态：如果用户配置了或后端配置了，都认为 AI 已启用
        setAiConfigStatus({
          ai_enabled: serverStatus.ai_enabled || !!userConfig,
          provider: userConfig?.provider || serverStatus.provider,
          model: userConfig?.model || serverStatus.model,
          base_url: userConfig?.baseUrl || serverStatus.base_url,
          api_key_configured: serverStatus.api_key_configured || !!userConfig,
          source: userConfig ? 'user' : serverStatus.ai_enabled ? 'server' : 'none',
        });
      } catch (err) {
        console.error('获取 AI 配置状态失败:', err);
      } finally {
        setAiConfigLoading(false);
      }
    };
    loadAIConfig();
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
      // 先从数据库加载已分析的commits（包含AI分析结果）
      const commitsData = await commitsAPI.getCommits(project.id, 1, COMMITS_PER_PAGE);

      // 转换数据格式
      const formattedCommits: Commit[] = commitsData.items.map(item => ({
        hash: item.hash,
        message: item.message,
        author: item.author,
        author_email: item.author_email,
        date: item.timestamp,
        summary: item.summary as Commit['summary'],
      }));

      setCommits(formattedCommits);
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
      // 刷新项目列表
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (err) {
      setFormError('创建项目失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  const handleAnalyze = async (projectId: string) => {
    try {
      setAnalyzing(projectId);

      // 获取项目名称
      const project = projects.find(p => p.id === projectId);
      const projectName = project?.name || '未知项目';

      // 从 localStorage 加载 AI 配置
      const savedConfig = localStorage.getItem('gitpulse-ai-config');
      let aiConfig = null;
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          aiConfig = {
            provider: parsed.provider || 'yunwu',
            model: parsed.model || 'gemini-2.0-flash-exp',
            apiKey: parsed.apiKey,
            baseUrl: parsed.baseUrl || 'https://api.yunwu.ai/v1',
          };
        } catch {
          console.error('解析 AI 配置失败');
        }
      }

      // 启动分析前，先获取当前的 commits 数量作为基准
      const initialCommitsResponse = await commitsAPI.getCommits(projectId, 1, 1);
      const initialCount = initialCommitsResponse.total || 0;

      // 启动分析任务
      await commitsAPI.analyzeCommits(projectId, {
        incremental: false,
        aiConfig: aiConfig || undefined,
      });

      // 打开进度弹窗
      setAnalysisProgress({
        isOpen: true,
        projectId,
        projectName,
        status: 'running',
        message: '正在分析代码...',
        progress: 0,
        analyzedCount: 0,
        totalCount: initialCount > 0 ? initialCount : 20, // 预估数量
        startTime: new Date(),
      });

    } catch (err) {
      alert('启动分析失败，请重试');
      setAnalyzing(null);
    }
  };

  // 轮询跟踪分析进度
  useEffect(() => {
    if (!analysisProgress?.isOpen || analysisProgress.status !== 'running') {
      return;
    }

    let consecutiveNoChange = 0;
    let lastAnalyzedCount = 0;

    const interval = setInterval(async () => {
      try {
        // 获取当前 commits 数量
        const response = await commitsAPI.getCommits(analysisProgress.projectId, 1, 1);
        const currentTotal = response.total || 0;

        // 获取已分析的 commits（带有 summary 的）
        const analyzedResponse = await commitsAPI.getCommits(analysisProgress.projectId, 1, 100);
        const analyzedCount = analyzedResponse.items.filter(
          (c: { summary?: unknown }) => c.summary && Object.keys(c.summary as object).length > 0
        ).length;

        // 判断是否还有变化
        if (analyzedCount === lastAnalyzedCount) {
          consecutiveNoChange++;
        } else {
          consecutiveNoChange = 0;
          lastAnalyzedCount = analyzedCount;
        }

        // 更新进度
        const total = Math.max(analysisProgress.totalCount, currentTotal);
        const progress = total > 0 ? Math.min(100, Math.round((analyzedCount / total) * 100)) : 0;

        setAnalysisProgress(prev =>
          prev ? {
            ...prev,
            analyzedCount,
            totalCount: total,
            progress,
            message: `正在分析代码... (${analyzedCount}/${total})`,
          } : null
        );

        // 如果连续 3 次没有变化（约 9 秒），认为分析完成
        if (consecutiveNoChange >= 3) {
          setAnalysisProgress(prev =>
            prev ? {
              ...prev,
              status: 'completed',
              message: '分析完成！',
              progress: 100,
            } : null
          );
          setAnalyzing(null);
          // 刷新项目列表
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          clearInterval(interval);
        }
      } catch (err) {
        console.error('获取分析进度失败:', err);
      }
    }, 3000); // 每 3 秒检查一次

    return () => clearInterval(interval);
  }, [analysisProgress?.isOpen, analysisProgress?.status, analysisProgress?.projectId, analysisProgress?.totalCount]);

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
      // 刷新项目列表
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      const commitsData = await commitsAPI.getCommits(
        selectedProject.id,
        nextPage,
        COMMITS_PER_PAGE
      );

      const formattedCommits: Commit[] = commitsData.items.map(item => ({
        hash: item.hash,
        message: item.message,
        author: item.author,
        author_email: item.author_email,
        date: item.timestamp,
        summary: item.summary as Commit['summary'],
      }));

      setCommits((prev) => [...prev, ...formattedCommits]);
      setCommitPage(nextPage);
      setHasMore(
        commits.length + formattedCommits.length < commitsData.total
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

      // 转换数据格式，包含 summary
      const formattedCommits: Commit[] = commitsData.items.map(item => ({
        hash: item.hash,
        message: item.message,
        author: item.author,
        author_email: item.author_email,
        date: item.date,
        summary: item.summary as Commit['summary'],
      }));

      setCommits(formattedCommits);
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
            onClick={() => refetchProjects()}
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
                  <CommitListItem key={commit.hash} commit={commit} formatDate={formatDate} />
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

      {/* AI 配置状态警告 */}
      {!aiConfigLoading && aiConfigStatus && !aiConfigStatus.ai_enabled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                AI 分析功能未配置
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                当前分析功能只能使用本地规则，无法进行 AI 深度分析。
                请在<strong>设置页面</strong>配置 AI 参数，或在项目根目录创建{' '}
                <code className="rounded bg-yellow-100 px-1">.env</code> 文件。
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigate('/settings')}
                  className="rounded bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
                >
                  前往设置页面
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 已配置提示 */}
      {!aiConfigLoading && aiConfigStatus?.ai_enabled && aiConfigStatus.source === 'user' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                AI 分析已配置 ({aiConfigStatus.provider} / {aiConfigStatus.model})
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* 分析进度弹窗 */}
      {analysisProgress?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                analysisProgress.status === 'completed'
                  ? 'bg-green-100 text-green-500'
                  : analysisProgress.status === 'failed'
                  ? 'bg-red-100 text-red-500'
                  : 'bg-blue-100 text-blue-500'
              }`}>
                {analysisProgress.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : analysisProgress.status === 'failed' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {analysisProgress.status === 'completed'
                  ? '分析完成'
                  : analysisProgress.status === 'failed'
                  ? '分析失败'
                  : '正在分析代码'}
              </h2>
            </div>

            <div className="mt-4">
              <p className="text-neutral-600">
                项目：<strong>{analysisProgress.projectName}</strong>
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                {analysisProgress.message}
              </p>

              {/* 进度条 */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-neutral-500 mb-1">
                  <span>进度</span>
                  <span>{analysisProgress.progress}%</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      analysisProgress.status === 'completed'
                        ? 'bg-green-500'
                        : analysisProgress.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${analysisProgress.progress}%` }}
                  />
                </div>
              </div>

              {/* 统计信息 */}
              <div className="mt-4 flex justify-between text-sm text-neutral-500">
                <span>已分析：{analysisProgress.analyzedCount} 个 commits</span>
                {analysisProgress.status === 'running' && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    进行中...
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {analysisProgress.status === 'running' ? (
                <button
                  onClick={() => {
                    setAnalysisProgress(null);
                    setAnalyzing(null);
                  }}
                  className="btn border border-border px-4 py-2 hover:bg-neutral-50"
                >
                  后台运行
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAnalysisProgress(null);
                    // 刷新项目数据
                    if (selectedProject?.id === analysisProgress.projectId) {
                      loadProjectDetail(selectedProject);
                    }
                    // 刷新项目列表
                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                  }}
                  className="btn bg-primary px-4 py-2 text-white hover:bg-primary/90"
                >
                  确定
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 提交列表项组件
 */
function CommitListItem({ commit, formatDate }: { commit: Commit; formatDate: (date: string) => string }) {
  const [expanded, setExpanded] = useState(false);

  // 检查是否有 AI 分析数据（aiSummary 或 semanticType 表示 AI 分析结果）
  const hasAIAnalysis = commit.summary?.aiSummary || commit.summary?.semanticType;
  // 检查是否有本地分析数据
  const hasLocalAnalysis = commit.summary?.type;

  return (
    <div className="px-6 py-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {commit.message}
            </p>
            {hasAIAnalysis && (
              <span title="AI 已分析">
                <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-neutral-500">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{commit.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(commit.date)}</span>
            </div>
            {/* 快速标签展示 */}
            {commit.summary?.semanticType ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${semanticTypeColors[commit.summary.semanticType] || 'bg-neutral-100 text-neutral-700'}`}>
                {commit.summary.semanticType}
              </span>
            ) : commit.summary?.type ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">
                {commit.summary.type}
              </span>
            ) : null}
            {commit.summary?.codeQuality?.riskLevel && commit.summary.codeQuality.riskLevel !== 'low' && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium ${
                commit.summary.codeQuality.riskLevel === 'high'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <AlertTriangle className="h-3 w-3" />
                {commit.summary.codeQuality.riskLevel === 'high' ? '高风险' : '中风险'}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2 flex-shrink-0">
          <code className="rounded bg-neutral-100 px-2 py-1 text-xs font-mono text-neutral-600">
            {commit.hash.slice(0, 7)}
          </code>
          {/* 只有有分析数据时才显示展开按钮 */}
          {(hasAIAnalysis || hasLocalAnalysis) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-neutral-200 transition-colors"
              title={expanded ? '收起详情' : '展开详情'}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-neutral-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 展开的 AI 分析详情 */}
      {expanded && <CommitAnalysisDetail summary={commit.summary} />}
    </div>
  );
}

/**
 * 语义类型颜色映射
 */
const semanticTypeColors: Record<string, string> = {
  feature: 'bg-blue-100 text-blue-700',
  fix: 'bg-red-100 text-red-700',
  refactor: 'bg-purple-100 text-purple-700',
  docs: 'bg-gray-100 text-gray-700',
  test: 'bg-yellow-100 text-yellow-700',
  chore: 'bg-neutral-100 text-neutral-700',
  performance: 'bg-green-100 text-green-700',
  security: 'bg-orange-100 text-orange-700',
};

/**
 * 风险等级配置
 */
const riskLevelConfig: Record<string, { color: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  low: { color: 'text-green-500', label: '低风险', icon: Shield },
  medium: { color: 'text-yellow-500', label: '中风险', icon: AlertCircle },
  high: { color: 'text-red-500', label: '高风险', icon: AlertTriangle },
};

/**
 * 影响范围图标映射
 */
const impactScopeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  api: Cpu,
  database: Database,
  config: Settings,
  ui: Layout,
  test: TestTube,
};

/**
 * Commit AI 分析详情组件
 */
function CommitAnalysisDetail({ summary }: { summary?: Commit['summary'] }) {
  if (!summary) {
    return (
      <div className="mt-3 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-500">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-neutral-400" />
          <span>暂无分析数据</span>
        </div>
      </div>
    );
  }

  const hasAIAnalysis = summary.aiSummary || summary.semanticType;
  const hasLocalAnalysis = summary.type;
  const riskConfig = summary.codeQuality?.riskLevel ? riskLevelConfig[summary.codeQuality.riskLevel] : null;

  // 只有本地分析，没有 AI 分析
  if (!hasAIAnalysis && hasLocalAnalysis) {
    return (
      <div className="mt-3 rounded-lg bg-neutral-50 p-4 border border-neutral-200">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">本地规则分析</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {summary.type && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
              {summary.type}
            </span>
          )}
          {summary.breaking && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
              破坏性变更
            </span>
          )}
          {summary.scope?.map((s, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
              {s}
            </span>
          ))}
        </div>

        {summary.keywords && summary.keywords.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-neutral-500">关键词: </span>
            <span className="text-xs text-neutral-600">{summary.keywords.join(', ')}</span>
          </div>
        )}

        <div className="rounded-lg bg-blue-50/50 p-3 border border-blue-100">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-700 font-medium">AI 深度分析</p>
              <p className="text-xs text-blue-600 mt-1">
                当前仅使用本地规则分析。点击"分析代码"按钮运行 AI 深度分析，获取代码质量评估、风险识别和改进建议。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-4 border border-blue-100/50">
      {/* AI 分析头部 */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-blue-700">AI 分析</span>
        {hasAIAnalysis && summary.aiConfidence !== undefined && (
          <span className="text-xs text-neutral-400">
            置信度 {Math.round(summary.aiConfidence * 100)}%
          </span>
        )}
        {summary.batchInfo && summary.batchInfo.batches > 1 && (
          <span className="text-xs text-neutral-400">
            (分批分析: {summary.batchInfo.batches} 批)
          </span>
        )}
      </div>

      {/* 语义类型和技术领域 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {summary.semanticType && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${semanticTypeColors[summary.semanticType] || 'bg-neutral-100 text-neutral-700'}`}>
            {summary.semanticType}
          </span>
        )}
        {summary.type && summary.type !== summary.semanticType && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
            {summary.type}
          </span>
        )}
        {summary.techDomain?.map((domain, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-600">
            {domain}
          </span>
        ))}
      </div>

      {/* AI 摘要 */}
      {summary.aiSummary && (
        <p className="text-sm text-foreground mb-3 font-medium">
          {summary.aiSummary}
        </p>
      )}

      {/* 详细描述 */}
      {summary.aiDescription && (
        <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
          {summary.aiDescription}
        </p>
      )}

      {/* 代码质量和影响范围 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* 代码质量 */}
        {summary.codeQuality && (
          <div className="rounded-lg bg-white/60 p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-700">代码质量</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">可读性</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(summary.codeQuality.readability / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-neutral-700 w-4 text-right">{summary.codeQuality.readability}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">复杂度</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${(summary.codeQuality.complexity / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-neutral-700 w-4 text-right">{summary.codeQuality.complexity}</span>
                </div>
              </div>
              {riskConfig && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">风险等级</span>
                  <div className={`flex items-center gap-1 ${riskConfig.color}`}>
                    <riskConfig.icon className="h-3 w-3" />
                    <span>{riskConfig.label}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 影响范围 */}
        {summary.impactScope && (
          <div className="rounded-lg bg-white/60 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-700">影响范围</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(summary.impactScope).map(([key, value]) => {
                if (key === 'others' || !value) return null;
                const Icon = impactScopeIcons[key];
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600"
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {key.toUpperCase()}
                  </span>
                );
              })}
              {summary.impactScope.others?.map((other, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600"
                >
                  {other}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 风险点 */}
      {summary.aiRisks && summary.aiRisks.length > 0 && (
        <div className="rounded-lg bg-red-50/50 p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-red-700">潜在风险</span>
          </div>
          <ul className="space-y-1">
            {summary.aiRisks.map((risk, idx) => (
              <li key={idx} className="text-xs text-red-600 flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 rounded-full bg-red-400 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 建议 */}
      {summary.aiSuggestions && summary.aiSuggestions.length > 0 && (
        <div className="rounded-lg bg-green-50/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-green-700">改进建议</span>
          </div>
          <ul className="space-y-1">
            {summary.aiSuggestions.map((suggestion, idx) => (
              <li key={idx} className="text-xs text-green-600 flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 rounded-full bg-green-400 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
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
