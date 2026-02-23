/**
 * 仪表板页面
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderGit2,
  FileText,
  GitCommit,
  TrendingUp,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { statsAPI, projectsAPI, commitsAPI } from '../lib/api';

/**
 * 分析任务状态
 */
interface AnalysisTask {
  id: string;
  projectId: string;
  projectName: string;
  status: 'running' | 'completed' | 'failed';
  message: string;
  createdAt: Date;
}

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

  // 分析任务列表
  const [tasks, setTasks] = useState<AnalysisTask[]>([]);

  // 分析代码 mutation
  const analyzeMutation = useMutation({
    mutationFn: (projectId: string) => commitsAPI.analyzeCommits(projectId),
    onSuccess: (data, projectId) => {
      const project = projects.find((p: { id: string; name: string }) => p.id === projectId);
      const newTask: AnalysisTask = {
        id: data.task_id || `analyze_${Date.now()}`,
        projectId,
        projectName: project?.name || '未知项目',
        status: 'running',
        message: '分析任务已开始，预计需要 1-2 分钟',
        createdAt: new Date(),
      };
      setTasks(prev => [newTask, ...prev].slice(0, 5)); // 只保留最近5个任务

      // 模拟任务完成（实际应该通过 WebSocket 或轮询获取状态）
      setTimeout(() => {
        setTasks(prev =>
          prev.map(task =>
            task.projectId === projectId && task.status === 'running'
              ? { ...task, status: 'completed', message: '分析完成！' }
              : task
          )
        );
        // 刷新统计数据
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      }, 3000);
    },
    onError: (error: Error, projectId) => {
      const project = projects.find((p: { id: string; name: string }) => p.id === projectId);
      const newTask: AnalysisTask = {
        id: `analyze_${Date.now()}`,
        projectId,
        projectName: project?.name || '未知项目',
        status: 'failed',
        message: error.message || '分析失败',
        createdAt: new Date(),
      };
      setTasks(prev => [newTask, ...prev].slice(0, 5));
    },
  });

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
  const handleStartAnalyze = () => {
    if (!selectedProjectId) return;
    analyzeMutation.mutate(selectedProjectId);
    setShowAnalyzeModal(false);
  };

  // 处理查看结果
  const handleViewResults = (projectId: string) => {
    navigate(`/projects?id=${projectId}`);
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

        {/* 分析任务状态 */}
        {tasks.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              分析任务状态
            </h2>
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    {task.status === 'running' && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {task.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {task.status === 'failed' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {task.projectName}
                      </p>
                      <p className="text-sm text-neutral-500">{task.message}</p>
                    </div>
                  </div>
                  {task.status === 'completed' && (
                    <button
                      onClick={() => handleViewResults(task.projectId)}
                      className="flex items-center text-sm text-primary hover:text-primary-600"
                    >
                      查看结果
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
                  disabled={analyzeMutation.isPending}
                  className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {analyzeMutation.isPending ? (
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
