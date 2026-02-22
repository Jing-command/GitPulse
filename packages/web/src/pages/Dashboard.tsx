/**
 * 仪表板页面
 */

import { useQuery } from '@tanstack/react-query';
import {
  FolderGit2,
  FileText,
  GitCommit,
  TrendingUp,
} from 'lucide-react';
import { statsAPI } from '../lib/api';

/**
 * Dashboard 页面
 * 显示项目概览、最近活动、统计数据
 */
function Dashboard() {
  // 获取仪表板统计数据
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => statsAPI.getDashboardStats(),
  });

  const stats = statsData?.stats;
  const activities = statsData?.recent_activities || [];

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
            />
            <QuickAction
              title="生成内容"
              description="生成更新日志"
              icon={FileText}
            />
            <QuickAction
              title="新建项目"
              description="添加新项目"
              icon={FolderGit2}
            />
            <QuickAction
              title="查看报告"
              description="SEO 分析报告"
              icon={TrendingUp}
            />
          </div>
        </div>
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
}

/**
 * 快捷操作组件
 */
function QuickAction({ title, description, icon: Icon }: QuickActionProps) {
  return (
    <button className="flex flex-col items-start gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:bg-neutral-50">
      <Icon className="h-5 w-5 text-primary" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
    </button>
  );
}

export default Dashboard;
