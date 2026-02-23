/**
 * 设置页面
 */

import { useState } from 'react';
import {
  Save,
  Bell,
  Palette,
  Shield,
  Info,
  Brain,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Globe,
  Calendar,
  Lock,
  Key,
  Smartphone,
  LogOut,
  Package,
  Github,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

/**
 * 设置标签页类型
 */
type SettingsTab = 'ai' | 'notifications' | 'appearance' | 'security' | 'about';

/**
 * Settings 页面
 * 全局配置、AI 配置、通知设置
 */
function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">设置</h1>
        <p className="mt-1 text-sm text-neutral-500">管理应用配置和偏好设置</p>
      </div>

      {/* 设置分类 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧导航 */}
        <div className="lg:col-span-1">
          <nav className="card p-2">
            <SettingsNavItem
              title="AI 配置"
              icon={<Brain className="h-4 w-4" />}
              active={activeTab === 'ai'}
              onClick={() => setActiveTab('ai')}
            />
            <SettingsNavItem
              title="通知设置"
              icon={<Bell className="h-4 w-4" />}
              active={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
            />
            <SettingsNavItem
              title="外观设置"
              icon={<Palette className="h-4 w-4" />}
              active={activeTab === 'appearance'}
              onClick={() => setActiveTab('appearance')}
            />
            <SettingsNavItem
              title="安全设置"
              icon={<Shield className="h-4 w-4" />}
              active={activeTab === 'security'}
              onClick={() => setActiveTab('security')}
            />
            <SettingsNavItem
              title="关于"
              icon={<Info className="h-4 w-4" />}
              active={activeTab === 'about'}
              onClick={() => setActiveTab('about')}
            />
          </nav>
        </div>

        {/* 右侧内容 */}
        <div className="lg:col-span-2">
          {activeTab === 'ai' && <AISettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'about' && <AboutSettings />}
        </div>
      </div>
    </div>
  );
}

/**
 * 设置导航项属性
 */
interface SettingsNavItemProps {
  title: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

/**
 * 设置导航项组件
 */
function SettingsNavItem({ title, icon, active, onClick }: SettingsNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
        active
          ? 'bg-primary-50 font-medium text-primary'
          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
      }`}
    >
      <span className={active ? 'text-primary' : 'text-neutral-400'}>{icon}</span>
      {title}
    </button>
  );
}

/**
 * AI 配置数据接口
 */
interface AIConfigData {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  fallback: string;
  temperature: number;
}

/**
 * 从 localStorage 加载 AI 配置
 */
function loadAIConfig(): AIConfigData {
  const saved = localStorage.getItem('gitpulse-ai-config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // 解析失败时使用默认值
    }
  }
  return {
    provider: 'yunwu',
    model: 'gemini-3-flash-preview',
    apiKey: 'sk-uFeF7zgtzWOjv0qc26B2T9hjG5f3b9QqwQafLglsxiLI4kA2',
    baseUrl: 'https://api.yunwu.ai/v1',
    fallback: '',
    temperature: 0.7,
  };
}

/**
 * 保存 AI 配置到 localStorage
 */
function saveAIConfig(config: AIConfigData) {
  localStorage.setItem('gitpulse-ai-config', JSON.stringify(config));
}

/**
 * AI 配置组件
 */
function AISettings() {
  const [config, setConfig] = useState<AIConfigData>(loadAIConfig());
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof AIConfigData, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      saveAIConfig(config);
      setSaveSuccess(true);
      // 3秒后隐藏成功提示
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">AI 配置</h2>

      <div className="space-y-6">
        {/* AI 服务商 */}
        <div>
          <label className="label mb-2 block">AI 服务商</label>
          <select
            className="input w-full"
            value={config.provider}
            onChange={e => handleChange('provider', e.target.value)}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama (本地)</option>
            <option value="yunwu">云雾中转站</option>
          </select>
          <p className="mt-1 text-xs text-neutral-500">选择用于生成内容的 AI 服务商</p>
        </div>

        {/* 模型选择 */}
        <div>
          <label className="label mb-2 block">模型</label>
          <select
            className="input w-full"
            value={config.model}
            onChange={e => handleChange('model', e.target.value)}
          >
            <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
            <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
            <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
            <option value="deepseek-chat">DeepSeek Chat</option>
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            云雾中转站支持多种模型，包括 Gemini、Claude、GPT 等
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="label mb-2 block">API Key</label>
          <input
            type="password"
            className="input w-full"
            placeholder="sk-..."
            value={config.apiKey}
            onChange={e => handleChange('apiKey', e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-500">API Key 已加密存储，仅显示部分内容</p>
        </div>

        {/* API 基础 URL */}
        <div>
          <label className="label mb-2 block">API 基础 URL</label>
          <input
            type="url"
            className="input w-full"
            placeholder="https://api.yunwu.ai/v1"
            value={config.baseUrl}
            onChange={e => handleChange('baseUrl', e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-500">云雾中转站默认使用 https://api.yunwu.ai/v1</p>
        </div>

        {/* 降级配置 */}
        <div>
          <label className="label mb-2 block">降级服务商</label>
          <select
            className="input w-full"
            value={config.fallback}
            onChange={e => handleChange('fallback', e.target.value)}
          >
            <option value="">不启用降级</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama (本地)</option>
            <option value="yunwu">云雾中转站</option>
          </select>
          <p className="mt-1 text-xs text-neutral-500">当主服务商不可用时，自动切换到降级服务商</p>
        </div>

        {/* 温度参数 */}
        <div>
          <label className="label mb-2 block">温度参数 (Temperature)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature}
            onChange={e => handleChange('temperature', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-neutral-500">
            <span>精确 (0)</span>
            <span className="font-medium text-primary">{config.temperature}</span>
            <span>创意 (1)</span>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
          {saveSuccess && (
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle className="mr-1 h-4 w-4" />
              保存成功
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
          >
            <Save className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 通知设置组件
 */
function NotificationSettings() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">通知设置</h2>

      <div className="space-y-8">
        {/* 邮件通知 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">邮件通知</p>
                <p className="text-xs text-neutral-500">接收重要事件邮件提醒</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
              />
              <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          {emailEnabled && (
            <div className="ml-13 space-y-3 rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded border-neutral-300" />
                <span className="text-sm text-neutral-700">提交同步完成</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded border-neutral-300" />
                <span className="text-sm text-neutral-700">内容生成完成</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="rounded border-neutral-300" />
                <span className="text-sm text-neutral-700">审批状态变更</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded border-neutral-300" />
                <span className="text-sm text-neutral-700">系统公告</span>
              </div>
            </div>
          )}
        </div>

        {/* Webhook 配置 */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Webhook 通知</p>
                <p className="text-xs text-neutral-500">推送事件到外部系统</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={webhookEnabled}
                onChange={(e) => setWebhookEnabled(e.target.checked)}
              />
              <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          {webhookEnabled && (
            <div className="ml-13 space-y-4 rounded-lg bg-neutral-50 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Webhook URL</label>
                <input
                  type="url"
                  className="input w-full"
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">密钥 (Secret)</label>
                <input
                  type="password"
                  className="input w-full"
                  placeholder="用于验证请求签名"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" defaultChecked className="rounded border-neutral-300" />
                <span className="text-sm text-neutral-700">包含详细内容</span>
              </div>
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end border-t border-border pt-6">
          <button className="btn bg-primary px-6 py-2 text-white hover:bg-primary-600">
            <Save className="mr-2 h-4 w-4" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 外观设置组件
 */
function AppearanceSettings() {
  const [theme, setTheme] = useState('system');

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">外观设置</h2>

      <div className="space-y-8">
        {/* 主题选择 */}
        <div className="space-y-4">
          <label className="label block">主题模式</label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                theme === 'light'
                  ? 'border-primary bg-primary-50'
                  : 'border-border hover:border-neutral-300'
              }`}
            >
              <Sun className={`h-8 w-8 ${theme === 'light' ? 'text-primary' : 'text-neutral-400'}`} />
              <span className={`text-sm ${theme === 'light' ? 'font-medium text-primary' : 'text-neutral-600'}`}>
                浅色
              </span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                theme === 'dark'
                  ? 'border-primary bg-primary-50'
                  : 'border-border hover:border-neutral-300'
              }`}
            >
              <Moon className={`h-8 w-8 ${theme === 'dark' ? 'text-primary' : 'text-neutral-400'}`} />
              <span className={`text-sm ${theme === 'dark' ? 'font-medium text-primary' : 'text-neutral-600'}`}>
                深色
              </span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                theme === 'system'
                  ? 'border-primary bg-primary-50'
                  : 'border-border hover:border-neutral-300'
              }`}
            >
              <Monitor className={`h-8 w-8 ${theme === 'system' ? 'text-primary' : 'text-neutral-400'}`} />
              <span className={`text-sm ${theme === 'system' ? 'font-medium text-primary' : 'text-neutral-600'}`}>
                跟随系统
              </span>
            </button>
          </div>
        </div>

        {/* 语言设置 */}
        <div className="space-y-4 border-t border-border pt-6">
          <label className="label block">语言</label>
          <select className="input w-full max-w-xs">
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        {/* 日期时间格式 */}
        <div className="space-y-4 border-t border-border pt-6">
          <label className="label block">日期格式</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-neutral-50">
              <input type="radio" name="dateFormat" defaultChecked className="text-primary" />
              <span className="text-sm">2024年1月15日</span>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-neutral-50">
              <input type="radio" name="dateFormat" className="text-primary" />
              <span className="text-sm">2024-01-15</span>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-neutral-50">
              <input type="radio" name="dateFormat" className="text-primary" />
              <span className="text-sm">01/15/2024</span>
            </label>
          </div>
        </div>

        {/* 界面选项 */}
        <div className="space-y-4 border-t border-border pt-6">
          <label className="label block">界面选项</label>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-neutral-50">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <span className="text-sm">默认折叠侧边栏</span>
              </div>
              <input type="checkbox" className="rounded border-neutral-300" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-neutral-50">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-neutral-400" />
                <span className="text-sm">显示提交预览</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-neutral-300" />
            </label>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end border-t border-border pt-6">
          <button className="btn bg-primary px-6 py-2 text-white hover:bg-primary-600">
            <Save className="mr-2 h-4 w-4" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 安全设置组件
 */
function SecuritySettings() {
  return (
    <div className="card p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">安全设置</h2>

      <div className="space-y-8">
        {/* 修改密码 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">修改密码</p>
              <p className="text-xs text-neutral-500">建议定期更换密码以保障账户安全</p>
            </div>
          </div>

          <div className="ml-13 space-y-4 rounded-lg bg-neutral-50 p-4">
            <div>
              <label className="mb-2 block text-sm font-medium">当前密码</label>
              <input type="password" className="input w-full" placeholder="输入当前密码" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">新密码</label>
              <input type="password" className="input w-full" placeholder="至少8位，包含字母和数字" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">确认新密码</label>
              <input type="password" className="input w-full" placeholder="再次输入新密码" />
            </div>
            <button className="btn bg-amber-600 px-4 py-2 text-white hover:bg-amber-700">
              更新密码
            </button>
          </div>
        </div>

        {/* 双因素认证 */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">双因素认证 (2FA)</p>
                <p className="text-xs text-neutral-500">启用后登录时需要额外验证</p>
              </div>
            </div>
            <button className="btn border border-border px-4 py-2 hover:bg-neutral-50">
              启用
            </button>
          </div>
        </div>

        {/* API Token */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">API Token</p>
                <p className="text-xs text-neutral-500">用于 CLI 和第三方集成</p>
              </div>
            </div>
            <button className="btn border border-border px-4 py-2 hover:bg-neutral-50">
              重新生成
            </button>
          </div>

          <div className="ml-13 rounded-lg bg-neutral-50 p-4">
            <code className="block rounded bg-neutral-800 px-4 py-3 font-mono text-sm text-neutral-300">
              gp_live_••••••••••••••••
            </code>
            <p className="mt-2 text-xs text-neutral-500">Token 仅显示一次，请妥善保存</p>
          </div>
        </div>

        {/* 登录会话 */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Smartphone className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">登录会话</p>
              <p className="text-xs text-neutral-500">管理已登录的设备</p>
            </div>
          </div>

          <div className="ml-13 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm font-medium">Windows - Chrome</p>
                  <p className="text-xs text-neutral-500">当前会话 · 北京 IP · 2小时前</p>
                </div>
              </div>
              <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">当前</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-neutral-300"></div>
                <div>
                  <p className="text-sm font-medium">Mac - Safari</p>
                  <p className="text-xs text-neutral-500">上海 IP · 3天前</p>
                </div>
              </div>
              <button className="text-sm text-red-600 hover:text-red-700">
                登出
              </button>
            </div>
          </div>
        </div>

        {/* 危险操作 */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">危险操作</p>
            </div>
          </div>

          <div className="ml-13 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
            <div>
              <p className="text-sm font-medium text-red-900">退出所有会话</p>
              <p className="text-xs text-red-600">强制所有设备重新登录</p>
            </div>
            <button className="btn bg-red-600 px-4 py-2 text-white hover:bg-red-700">
              <LogOut className="mr-2 inline h-4 w-4" />
              全部退出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 关于设置组件
 */
function AboutSettings() {
  return (
    <div className="card p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">关于</h2>

      <div className="space-y-8">
        {/* 版本信息 */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">GitPulse</h3>
            <p className="text-sm text-neutral-500">版本 1.0.0 · 构建 2024.02.23</p>
          </div>
        </div>

        {/* 更新检查 */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">已是最新版本</p>
              <p className="text-xs text-neutral-500">上次检查: 2024-02-23 10:30</p>
            </div>
          </div>
          <button className="btn border border-border px-4 py-2 hover:bg-neutral-50">
            检查更新
          </button>
        </div>

        {/* 链接列表 */}
        <div className="space-y-2">
          <a
            href="https://github.com/your-org/gitpulse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-neutral-50"
          >
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5 text-neutral-600" />
              <span className="font-medium">GitHub 仓库</span>
            </div>
            <ExternalLink className="h-4 w-4 text-neutral-400" />
          </a>

          <a
            href="#"
            className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-neutral-50"
          >
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-neutral-600" />
              <span className="font-medium">文档中心</span>
            </div>
            <ExternalLink className="h-4 w-4 text-neutral-400" />
          </a>

          <a
            href="#"
            className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-neutral-50"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-neutral-600" />
              <span className="font-medium">问题反馈</span>
            </div>
            <ExternalLink className="h-4 w-4 text-neutral-400" />
          </a>

          <button className="flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:bg-neutral-50"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-neutral-600" />
              <span className="font-medium">隐私政策</span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </button>
        </div>

        {/* 开源许可 */}
        <div className="rounded-lg bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">
            GitPulse 基于 MIT 协议开源。使用 React、Node.js、Prisma 等开源技术构建。
          </p>
          <p className="mt-2 text-xs text-neutral-400">© 2024 GitPulse. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
