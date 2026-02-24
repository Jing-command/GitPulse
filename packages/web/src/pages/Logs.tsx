/**
 * 日志查看页面
 * 显示系统日志，支持按级别筛选和实时刷新
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Trash2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { logsAPI } from '../lib/api';

/**
 * 日志级别配置
 */
const levelConfig = {
  debug: { color: 'bg-gray-100 text-gray-700', icon: Bug, label: '调试' },
  info: { color: 'bg-blue-100 text-blue-700', icon: Info, label: '信息' },
  warn: { color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, label: '警告' },
  error: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: '错误' },
};

/**
 * 日志条目组件
 */
function LogEntryItem({
  log,
  isExpanded,
  onToggle,
}: {
  log: {
    id: string;
    timestamp: string;
    level: keyof typeof levelConfig;
    module: string;
    message: string;
    metadata?: Record<string, unknown>;
  };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = levelConfig[log.level] || levelConfig.info;
  const Icon = config.icon;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={`border-b border-border last:border-b-0 ${
        isExpanded ? 'bg-neutral-50' : 'hover:bg-neutral-50'
      }`}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* 展开图标 */}
        {log.metadata ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          )
        ) : (
          <div className="w-4" />
        )}

        {/* 时间 */}
        <span className="text-xs text-neutral-400 w-16 shrink-0">
          {formatTime(log.timestamp)}
        </span>

        {/* 级别标签 */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium shrink-0 ${config.color}`}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </span>

        {/* 模块 */}
        <span className="text-xs text-neutral-500 shrink-0 w-24 truncate">
          {log.module}
        </span>

        {/* 消息 */}
        <span className="text-sm text-foreground flex-1 truncate">
          {log.message}
        </span>
      </div>

      {/* 展开的详情 */}
      {isExpanded && log.metadata && (
        <div className="px-4 pb-3 pl-16">
          <pre className="bg-neutral-900 text-neutral-100 p-3 rounded-lg text-xs overflow-auto max-h-48">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * 日志页面
 */
function Logs() {
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState<
    'all' | 'debug' | 'info' | 'warn' | 'error'
  >('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 获取日志列表
  const {
    data: logsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['logs', selectedLevel],
    queryFn: () =>
      logsAPI.getLogs({
        level: selectedLevel === 'all' ? undefined : selectedLevel,
        limit: 100,
      }),
    refetchInterval: autoRefresh ? 3000 : false,
  });

  // 获取日志统计
  const { data: statsData } = useQuery({
    queryKey: ['logs-stats'],
    queryFn: () => logsAPI.getLogStats(),
    refetchInterval: autoRefresh ? 3000 : false,
  });

  const logs = logsData?.logs || [];
  const stats = statsData;

  // 切换日志展开状态
  const toggleLog = useCallback((id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 手动刷新
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['logs'] });
    queryClient.invalidateQueries({ queryKey: ['logs-stats'] });
  };

  // 清空日志
  const handleClear = async () => {
    try {
      await logsAPI.clearLogs();
      setShowClearConfirm(false);
      handleRefresh();
    } catch (err) {
      alert('清空日志失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">系统日志</h1>
          <p className="mt-1 text-sm text-neutral-500">
            查看应用程序运行日志和调试信息
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 自动刷新开关 */}
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-600">自动刷新</span>
          </label>

          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-neutral-600 ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            <span className="text-sm text-neutral-600">刷新</span>
          </button>

          {/* 清空按钮 */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm">清空</span>
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <p className="text-sm text-neutral-500">总日志数</p>
            <p className="text-2xl font-semibold text-foreground">
              {stats.total}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-neutral-500">调试</p>
            <p className="text-2xl font-semibold text-gray-700">
              {stats.byLevel.debug}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-neutral-500">信息</p>
            <p className="text-2xl font-semibold text-blue-700">
              {stats.byLevel.info}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-neutral-500">警告</p>
            <p className="text-2xl font-semibold text-yellow-700">
              {stats.byLevel.warn}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-neutral-500">错误</p>
            <p className="text-2xl font-semibold text-red-700">
              {stats.byLevel.error}
            </p>
          </div>
        </div>
      )}

      {/* 筛选器 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-500">级别筛选：</span>
        {(['all', 'debug', 'info', 'warn', 'error'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedLevel === level
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {level === 'all'
              ? '全部'
              : levelConfig[level]?.label || level}
          </button>
        ))}
      </div>

      {/* 日志列表 */}
      <div className="card">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <FileText className="h-5 w-5 text-neutral-500" />
          <h2 className="text-lg font-semibold text-foreground">日志列表</h2>
          <span className="text-sm text-neutral-500">({logs.length} 条)</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            加载中...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            加载失败
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <FileText className="h-6 w-6 mx-auto mb-2 text-neutral-300" />
            暂无日志
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <LogEntryItem
                key={log.id}
                log={log}
                isExpanded={expandedLogs.has(log.id)}
                onToggle={() => toggleLog(log.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 清空确认弹窗 */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">确认清空日志</h3>
            </div>

            <p className="text-sm text-neutral-600 mb-6">
              此操作将永久删除所有日志记录，无法恢复。是否继续？
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg border border-border text-neutral-600 hover:bg-neutral-50"
              >
                取消
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Logs;
