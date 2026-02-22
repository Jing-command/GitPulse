/**
 * 仪表板页面
 */

import {
  FolderGit2,
  FileText,
  GitCommit,
  TrendingUp,
} from 'lucide-react';

/**
 * Dashboard 页面
 * 显示项目概览、最近活动、统计数据
 */
function Dashboard() {
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
          value="12"
          change="+2"
          icon={FolderGit2}
          color="primary"
        />
        <StatCard
          title="生成内容"
          value="156"
          change="+23"
          icon={FileText}
          color="success"
        />
        <StatCard
          title="Commits 分析"
          value="1,234"
          change="+89"
          icon={GitCommit}
          color="warning"
        />
        <StatCard
          title="SEO 评分均值"
          value="85"
          change="+5"
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* 最近活动和快捷操作 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 最近活动 */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">最近活动</h2>
          <div className="space-y-4">
            <ActivityItem
              type="content"
              title="生成了更新日志"
              description="v1.2.0 更新日志"
              time="2 小时前"
            />
            <ActivityItem
              type="commit"
              title="分析了新提交"
              description="feat: 添加 AST 分析功能"
              time="5 小时前"
            />
            <ActivityItem
              type="project"
              title="创建了新项目"
              description="GitPulse Demo"
              time="1 天前"
            />
            <ActivityItem
              type="content"
              title="发布了技术博客"
              description="AST 分析技术详解"
              time="2 天前"
            />
          </div>
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
}

/**
 * 统计卡片组件
 */
function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
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
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-success">{change} 本周</p>
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
