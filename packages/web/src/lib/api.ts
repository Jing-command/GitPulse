/**
 * API 客户端配置
 * 封装 fetch 请求，统一处理认证和错误
 */

// API 基础 URL - 后端服务地址
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

/**
 * API 响应接口
 */
interface APIResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  user_message?: string;
  request_id?: string;
  timestamp?: string;
}

/**
 * API 错误类
 */
class APIError extends Error {
  code: number;
  userMessage: string;

  constructor(code: number, message: string, userMessage: string) {
    super(message);
    this.code = code;
    this.userMessage = userMessage;
    this.name = 'APIError';
  }
}

/**
 * 获取存储的 Token
 */
function getToken(): string | null {
  const authStorage = localStorage.getItem('gitpulse-auth');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 通用请求方法
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  // 默认请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // 添加认证 Token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const result: APIResponse<T> = await response.json();

    // 检查业务错误
    if (result.code !== 0) {
      throw new APIError(
        result.code,
        result.message,
        result.user_message || '请求失败'
      );
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // 网络错误或其他错误
    throw new APIError(
      60001,
      error instanceof Error ? error.message : 'Network error',
      '网络错误，请检查网络连接'
    );
  }
}

/**
 * API 客户端
 */
export const api = {
  /**
   * GET 请求
   */
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST 请求
   */
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * PUT 请求
   */
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * DELETE 请求
   */
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * 认证 API
 */
export const authAPI = {
  /**
   * 用户登录
   */
  login: (email: string, password: string) =>
    api.post<{
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
      token: string;
      expires_in: number;
    }>('/api/v1/auth/login', { email, password }),

  /**
   * 用户注册
   */
  register: (email: string, password: string, name: string) =>
    api.post<{
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
      token: string;
      expires_in: number;
    }>('/api/v1/auth/register', { email, password, name }),

  /**
   * 获取当前用户信息
   */
  me: () =>
    api.get<{
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }>('/api/v1/auth/me'),

  /**
   * 登出
   */
  logout: () => api.post('/api/v1/auth/logout'),
};

/**
 * 项目相关 API
 */
export const projectsAPI = {
  /**
   * 获取项目列表
   */
  getProjects: (page = 1, per_page = 20) =>
    api.get<{
      items: Array<{
        id: string;
        name: string;
        description: string | null;
        repo_url: string;
        config: Record<string, unknown> | null;
        commits_count: number;
        contents_count: number;
        created_at: string;
        updated_at: string;
      }>;
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    }>('/api/v1/projects', { page, per_page }),

  /**
   * 获取项目详情
   */
  getProject: (id: string) =>
    api.get<{
      project: {
        id: string;
        name: string;
        description: string | null;
        repo_url: string;
        config: Record<string, unknown> | null;
        commits_count: number;
        contents_count: number;
        members: Array<{
          id: string;
          role: string;
          user: {
            id: string;
            name: string;
            email: string;
            avatar_url: string | null;
          };
        }>;
        created_at: string;
        updated_at: string;
      };
    }>(`/api/v1/projects/${id}`),

  /**
   * 创建项目
   */
  createProject: (data: {
    name: string;
    description?: string;
    repo_url: string;
    config?: Record<string, unknown>;
  }) =>
    api.post<{
      project: {
        id: string;
        name: string;
        description: string | null;
        repo_url: string;
        config: Record<string, unknown> | null;
        created_at: string;
        updated_at: string;
      };
    }>('/api/v1/projects', data),

  /**
   * 更新项目
   */
  updateProject: (
    id: string,
    data: {
      name?: string;
      description?: string;
      repo_url?: string;
      config?: Record<string, unknown>;
    }
  ) =>
    api.post<{
      project: {
        id: string;
        name: string;
        description: string | null;
        repo_url: string;
        config: Record<string, unknown> | null;
        updated_at: string;
      };
    }>(`/api/v1/projects/${id}`, data),

  /**
   * 删除项目
   */
  deleteProject: (id: string) => api.delete(`/api/v1/projects/${id}`),
};

/**
 * 内容相关 API
 */
export const contentsAPI = {
  /**
   * 获取内容列表
   */
  getContents: (params?: {
    page?: number;
    per_page?: number;
    type?: 'changelog' | 'technical' | 'seo';
    status?: 'draft' | 'pending' | 'approved' | 'published';
    project_id?: string;
  }) =>
    api.get<{
      items: Array<{
        id: string;
        project_id: string;
        project_name: string;
        type: string;
        title: string;
        status: string;
        language: string;
        author_id: string;
        author_name: string;
        created_at: string;
        updated_at: string;
        published_at: string | null;
      }>;
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    }>('/api/v1/contents', params),

  /**
   * 获取内容详情
   */
  getContent: (id: string) =>
    api.get<{
      content: {
        id: string;
        project_id: string;
        project_name: string;
        type: string;
        title: string;
        content: string;
        status: string;
        language: string;
        formats: string[] | null;
        metadata: Record<string, unknown> | null;
        author_id: string;
        author_name: string;
        versions: Array<{
          id: string;
          version: number;
          change_log: string | null;
          created_at: string;
        }>;
        created_at: string;
        updated_at: string;
        published_at: string | null;
      };
    }>(`/api/v1/contents/${id}`),
};

export { APIError };
