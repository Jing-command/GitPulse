/**
 * 注册页面
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Github, Gitlab, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { authAPI, APIError } from '@/lib/api';

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Register 页面
 * 用户注册界面
 */
function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // 表单状态
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // 验证姓名
    if (!name.trim()) {
      errors.name = '请输入姓名';
    } else if (name.trim().length < 2) {
      errors.name = '姓名至少需要2个字符';
    }

    // 验证邮箱
    if (!email.trim()) {
      errors.email = '请输入邮箱';
    } else if (!isValidEmail(email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    // 验证密码
    if (!password) {
      errors.password = '请输入密码';
    } else if (password.length < 8) {
      errors.password = '密码至少需要8位';
    }

    // 验证确认密码
    if (!confirmPassword) {
      errors.confirmPassword = '请再次输入密码';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * 处理注册
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 前端表单验证
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 调用后端注册 API
      const result = await authAPI.register(email, password, name);

      // 注册成功后自动登录
      login(
        {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role as 'admin' | 'editor' | 'viewer',
        },
        result.token
      );

      // 跳转到首页
      navigate('/');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.userMessage);
      } else {
        setError('注册失败，请稍后再试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white shadow-lg">
            GP
          </div>
          <h1 className="text-2xl font-bold text-foreground">GitPulse</h1>
          <p className="mt-2 text-sm text-neutral-500">技术内容全自动流水线</p>
        </div>

        {/* 注册卡片 */}
        <div className="card p-8">
          <h2 className="mb-6 text-center text-lg font-semibold text-foreground">创建账户</h2>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* OAuth 注册 */}
          <div className="mb-6 space-y-3">
            <button
              type="button"
              className="btn w-full border border-border bg-card px-4 py-2.5 text-foreground hover:bg-neutral-50"
            >
              <Github className="mr-2 h-5 w-5" />
              使用 GitHub 注册
            </button>
            <button
              type="button"
              className="btn w-full border border-border bg-card px-4 py-2.5 text-foreground hover:bg-neutral-50"
            >
              <Gitlab className="mr-2 h-5 w-5" />
              使用 GitLab 注册
            </button>
          </div>

          {/* 分隔线 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-neutral-500">或使用邮箱注册</span>
            </div>
          </div>

          {/* 注册表单 */}
          <form onSubmit={handleRegister} noValidate>
            <div className="space-y-4">
              {/* 姓名 */}
              <div>
                <label className="label mb-2 block">姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    className={`input w-full pl-10 ${fieldErrors.name ? 'border-error focus:border-error focus:ring-error' : ''}`}
                    placeholder="请输入姓名"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-error">{fieldErrors.name}</p>
                )}
              </div>

              {/* 邮箱 */}
              <div>
                <label className="label mb-2 block">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    className={`input w-full pl-10 ${fieldErrors.email ? 'border-error focus:border-error focus:ring-error' : ''}`}
                    placeholder="请输入邮箱"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-error">{fieldErrors.email}</p>
                )}
              </div>

              {/* 密码 */}
              <div>
                <label className="label mb-2 block">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input w-full pl-10 pr-10 ${fieldErrors.password ? 'border-error focus:border-error focus:ring-error' : ''}`}
                    placeholder="请输入密码（至少8位）"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-error">{fieldErrors.password}</p>
                )}
              </div>

              {/* 确认密码 */}
              <div>
                <label className="label mb-2 block">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`input w-full pl-10 ${fieldErrors.confirmPassword ? 'border-error focus:border-error focus:ring-error' : ''}`}
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-error">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* 注册按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn w-full bg-primary px-4 py-2.5 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {isLoading ? '注册中...' : '注册'}
              </button>
            </div>
          </form>

          {/* 登录链接 */}
          <p className="mt-6 text-center text-sm text-neutral-500">
            已有账户？{' '}
            <Link to="/login" className="text-primary hover:text-primary-600">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
