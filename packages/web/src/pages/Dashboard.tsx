/**
 * 仪表板页面
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FolderGit2,
  FileText,
  GitCommit,
  TrendingUp,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { statsAPI, projectsAPI, commitsAPI } from '../lib/api';

/**
 * Dashboard 页面
 * 显示项目概览、最近活动、统计数据
 */
function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 获取仪表板统计数据
  // staleTime: 0 确保每次进入页面都刷新数据
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => statsAPI.getDashboardStats(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 获取项目列表（用于分析代码选择）
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getProjects(),
    staleTime: 60000,
  });

  const stats = statsData?.stats;
  const activities = statsData?.recent_activities || [];
  const projects = projectsData?.items || [];

  // 分析代码弹窗状态
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 分析进度弹窗状态
  const [analysisProgress, setAnalysisProgress] = useState<{
    isOpen: boolean;
    projectId: string;
    projectName: string;
    status: 'running' | 'completed' | 'failed';
    message: string;
    progress: number;
    analyzedCount: number;
    totalCount: number;
    startTime: Date;
  } | null>(null);

  // 轮询跟踪分析进度
  useEffect(() => {
    if (!analysisProgress?.isOpen || analysisProgress.status !== 'running') {
      return;
    }

    let consecutiveNoChange = 0;
    let lastAnalyzedCount = 0;
    // 记录开始分析时已有的 commits 数量（作为基准）
    const initialAnalyzedCount = analysisProgress.analyzedCount;

    const interval = setInterval(async () => {
      try {
        // 获取当前 commits 数量
        const response = await commitsAPI.getCommits(analysisProgress.projectId, 1, 1);
        const currentTotal = response.total || 0;

        // 获取已分析的 commits（带有 summary 的）
        const analyzedResponse = await commitsAPI.getCommits(analysisProgress.projectId, 1, 100);
        const totalAnalyzedCount = analyzedResponse.items.filter(
          (c: { summary?: unknown }) => c.summary && Object.keys(c.summary as object).length > 0
        ).length;

        // 计算本次分析新增的数量
        const analyzedCount = Math.max(0, totalAnalyzedCount - initialAnalyzedCount);

        // 判断是否还有变化
        if (analyzedCount === lastAnalyzedCount) {
          consecutiveNoChange++;
        } else {
          consecutiveNoChange = 0;
          lastAnalyzedCount = analyzedCount;
        }

        // 更新进度 - 基于本次分析新增的 commits 计算
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
          setIsAnalyzing(false);
          // 刷新统计数据
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
          clearInterval(interval);
        }
      } catch (err) {
        console.error('获取分析进度失败:', err);
      }
    }, 3000); // 每 3 秒检查一次

    return () => clearInterval(interval);
  }, [analysisProgress?.isOpen, analysisProgress?.status, analysisProgress?.projectId, analysisProgress?.totalCount, queryClient]);

  // 处理分析代码点击
  const handleAnalyzeClick = () => {
    if (projects.length === 0) {
      alert('请先创建一个项目');
      return;
    }
    setShowAnalyzeModal(true);
    setSelectedProjectId(projects[0]?.id || '');
  };

  // 处理开始分析
  const handleStartAnalyze = async () => {
    if (!selectedProjectId) return;

    setIsAnalyzing(true);
    setShowAnalyzeModal(false);

    try {
      // 获取项目名称
      const project = projects.find((p: { id: string; name: string }) => p.id === selectedProjectId);
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
      const initialCommitsResponse = await commitsAPI.getCommits(selectedProjectId, 1, 1);
      const initialCount = initialCommitsResponse.total || 0;

      // 启动分析任务
      await commitsAPI.analyzeCommits(selectedProjectId, {
        incremental: false,
        aiConfig: aiConfig || undefined,
      });

      // 打开进度弹窗
      setAnalysisProgress({
        isOpen: true,
        projectId: selectedProjectId,
        projectName,
        status: 'running',
        message: '正在分析代码...',
        progress: 0,
        analyzedCount: 0,
        totalCount: initialCount > 0 ? initialCount : 20,
        startTime: new Date(),
      });
    } catch (err) {
      console.error('启动分析失败:', err);
      alert('启动分析失败，请重试');
      setIsAnalyzing(false);
    }
  };

  // 处理跳转到项目管理
  const handleNewProject = () => {
    navigate('/projects');
  };

  // 处理跳转到内容管理
  const handleGenerateContent = () => {
    navigate('/content');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">仪表板</h1>
        <p className="mt-1 text-sm text-neutral-500">项目概览和统计数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="项目总数"
          value={isLoading ? '-' : String(stats?.projects.total || 0)}
          change={`+${stats?.projects.this_week || 0}`}
          icon={FolderGit2}
          color="primary"
          isLoading={isLoading}
        />
        <StatCard
          title="生成内容"
          value={isLoading ? '-' : String(stats?.contents.total || 0)}
          change={`+${stats?.contents.this_week || 0}`}
          icon={FileText}
          color="success"
          isLoading={isLoading}
        />
        <StatCard
          title="Commits 分析"
          value={isLoading ? '-' : String(stats?.commits.total || 0)}
          change={`+${stats?.commits.this_week || 0}`}
          icon={GitCommit}
          color="warning"
          isLoading={isLoading}
        />
        <StatCard
          title="SEO 评分均值"
          value={isLoading ? '-' : String(stats?.seo_score.average || 0)}
          change={`+${stats?.seo_score.this_week_change || 0}`}
          icon={TrendingUp}
          color="primary"
          isLoading={isLoading}
        />
      </div>

      {/* 最近活动和快捷操作 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 最近活动 */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">最近活动</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 animate-pulse rounded-full bg-neutral-300"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-3 w-48 animate-pulse rounded bg-neutral-100"></div>
                  </div>
                  <div className="h-3 w-16 animate-pulse rounded bg-neutral-100"></div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <ActivityItem
                  key={index}
                  type={activity.type}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">暂无活动记录</p>
          )}
        </div>

        {/* 快捷操作 */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">快捷操作</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction
              title="分析代码"
              description="分析 Git 提交"
              icon={GitCommit}
              onClick={handleAnalyzeClick}
            />
            <QuickAction
              title="生成内容"
              description="生成更新日志"
              icon={FileText}
              onClick={handleGenerateContent}
            />
            <QuickAction
              title="新建项目"
              description="添加新项目"
              icon={FolderGit2}
              onClick={handleNewProject}
            />
            <QuickAction
              title="查看报告"
              description="SEO 分析报告"
              icon={TrendingUp}
              onClick={() =>
                navigate('/content?filter=seo')
              }
            />
          </div>
        </div>

        {/* 分析代码弹窗 */}
        {showAnalyzeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">分析代码</h3>
                <button
                  onClick={() => setShowAnalyzeModal(false)}
                  className="rounded-lg p-1 hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-4 text-sm text-neutral-600">
                选择一个项目来分析其 Git 提交记录。分析结果将保存到数据库中。
              </p>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">选择项目</label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="input w-full"
                >
                  {projects.map((project: { id: string; name: string }) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAnalyzeModal(false)}
                  className="btn border border-border px-4 py-2 hover:bg-neutral-50"
                >
                  取消
                </button>
                <button
                  onClick={handleStartAnalyze}
                  disabled={isAnalyzing}
                  className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      启动中...
                    </>
                  ) : (
                    '开始分析'
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
                      setIsAnalyzing(false);
                    }}
                    className="btn border border-border px-4 py-2 hover:bg-neutral-50"
                  >
                    后台运行
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAnalysisProgress(null);
                      // 刷新统计数据
                      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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
    </div>
  );
}

/**
 * 统计卡片属性
 */
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'error';
  isLoading?: boolean;
}

/**
 * 统计卡片组件
 */
function StatCard({ title, value, change, icon: Icon, color, isLoading }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary',
    success: 'bg-success-50 text-success',
    warning: 'bg-warning-50 text-warning',
    error: 'bg-error-50 text-error',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${isLoading ? 'animate-pulse' : ''}`}>
            {value}
          </p>
          {!isLoading && (
            <p className="mt-1 text-xs text-success">{change} 本周</p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

/**
 * 活动项属性
 */
interface ActivityItemProps {
  type: 'content' | 'commit' | 'project';
  title: string;
  description: string;
  time: string;
}

/**
 * 活动项组件
 */
function ActivityItem({ type, title, description, time }: ActivityItemProps) {
  const typeColors = {
    content: 'bg-primary',
    commit: 'bg-success',
    project: 'bg-warning',
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1.5 h-2 w-2 rounded-full ${typeColors[type]}`}></div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <span className="text-xs text-neutral-400">{time}</span>
    </div>
  );
}

/**
 * 快捷操作属性
 */
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * 快捷操作组件
 */
function QuickAction({ title, description, icon: Icon, onClick, disabled }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-5 w-5 text-primary" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
    </button>
  );
}

export default Dashboard;
