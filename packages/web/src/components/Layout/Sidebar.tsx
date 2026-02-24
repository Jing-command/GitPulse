/**
 * 侧边栏组件
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  FileText,
  Users,
  Settings,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

/**
 * 导航菜单项
 */
const menuItems = [
  {
    path: '/',
    label: '仪表板',
    icon: LayoutDashboard,
  },
  {
    path: '/projects',
    label: '项目管理',
    icon: FolderGit2,
  },
  {
    path: '/content',
    label: '内容管理',
    icon: FileText,
  },
  {
    path: '/team',
    label: '团队管理',
    icon: Users,
  },
  {
    path: '/logs',
    label: '系统日志',
    icon: ScrollText,
  },
  {
    path: '/settings',
    label: '设置',
    icon: Settings,
  },
];

/**
 * Sidebar 组件
 * 显示导航菜单和折叠按钮
 */
function Sidebar() {
  // 获取侧边栏状态
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo 区域 */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              GP
            </div>
            <span className="text-lg font-semibold text-foreground">GitPulse</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            GP
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                sidebarCollapsed && 'justify-center px-2'
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* 折叠按钮 */}
      <div className="border-t border-border p-2">
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100',
            sidebarCollapsed && 'px-2'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="ml-2">收起</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
