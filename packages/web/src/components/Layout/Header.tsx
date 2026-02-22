/**
 * 头部组件
 */

import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';

/**
 * Header 组件
 * 显示搜索框、通知和用户信息
 */
function Header() {
  // 获取用户信息
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  /**
   * 处理登出
   * 调用真实后端 API
   */
  const handleLogout = async () => {
    try {
      // 调用后端登出 API
      await authAPI.logout();
    } catch (error) {
      // 即使 API 失败也清除本地状态
      console.error('Logout API error:', error);
    } finally {
      // 清除本地登录状态
      logout();
      // 跳转到登录页
      navigate('/login');
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* 搜索框 */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="搜索项目、内容..."
          className="input h-9 w-full pl-10 pr-4"
        />
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-4">
        {/* 通知按钮 */}
        <button className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100">
          <Bell className="h-5 w-5" />
          {/* 通知徽章 */}
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error"></span>
        </button>

        {/* 分隔线 */}
        <div className="h-6 w-px bg-border"></div>

        {/* 用户信息 */}
        <div className="flex items-center gap-3" data-testid="user-info">
          {/* 头像 */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary" data-testid="user-avatar">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>

          {/* 用户名和角色 */}
          <div className="flex flex-col" data-testid="user-details">
            <span className="text-sm font-medium text-foreground" data-testid="user-name">
              {user?.name ?? '用户'}
            </span>
            <span className="text-xs text-neutral-500" data-testid="user-role">
              {user?.role === 'admin' ? '管理员' : user?.role === 'editor' ? '编辑' : '查看者'}
            </span>
          </div>

          {/* 登出按钮 */}
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
