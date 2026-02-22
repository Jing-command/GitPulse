/**
 * 布局组件
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Layout 组件
 * 包含侧边栏、头部和内容区域
 */
function Layout() {
  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 头部 */}
        <Header />

        {/* 内容区域 */}
        <main className="flex-1 overflow-auto bg-neutral-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
