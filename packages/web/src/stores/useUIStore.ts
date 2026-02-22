/**
 * UI 状态管理
 * 使用 Zustand 管理 UI 状态
 */

import { create } from 'zustand';

/**
 * Toast 类型
 */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast 消息
 */
interface ToastMessage {
  type: ToastType;
  message: string;
}

/**
 * UI 状态接口
 */
interface UIState {
  // 侧边栏状态
  sidebarCollapsed: boolean;

  // 主题
  theme: 'light' | 'dark';

  // 加载状态
  isLoading: boolean;

  // Toast 消息
  toast: ToastMessage | null;

  // 操作
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  showToast: (type: ToastType, message: string) => void;
  hideToast: () => void;
}

/**
 * UI 状态 Store
 */
export const useUIStore = create<UIState>((set) => ({
  // 初始状态
  sidebarCollapsed: false,
  theme: 'light',
  isLoading: false,
  toast: null,

  // 切换侧边栏
  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),

  // 设置主题
  setTheme: (theme) => set({ theme }),

  // 设置加载状态
  setLoading: (isLoading) => set({ isLoading }),

  // 显示 Toast
  showToast: (type, message) =>
    set({
      toast: { type, message },
    }),

  // 隐藏 Toast
  hideToast: () => set({ toast: null }),
}));
