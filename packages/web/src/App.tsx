/**
 * 主应用组件
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Content from './pages/Content';
import ContentEditor from './pages/ContentEditor';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuthStore } from './stores/useAuthStore';

/**
 * App 组件
 * 定义应用路由和布局
 */
function App() {
  // 获取认证状态
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Routes>
      {/* 登录页面 */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

      {/* 注册页面 */}
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

      {/* 需要认证的页面 */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout />
          ) : (
            <Navigate to="/login" />
          )
        }
      >
        {/* 仪表板 */}
        <Route index element={<Dashboard />} />

        {/* 项目管理 */}
        <Route path="projects" element={<Projects />} />

        {/* 内容管理 */}
        <Route path="content" element={<Content />} />
        <Route path="content/:id" element={<ContentEditor />} />

        {/* 团队管理 */}
        <Route path="team" element={<Team />} />

        {/* 设置 */}
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 页面 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
