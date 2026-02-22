/**
 * 认证状态管理
 * 使用 Zustand 管理用户认证状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 用户信息接口
 */
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar_url?: string;
}

/**
 * 认证状态接口
 */
interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // 操作
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

/**
 * 认证状态 Store
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,

      // 登录
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      // 登出
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      // 更新用户信息
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'gitpulse-auth',
    }
  )
);
