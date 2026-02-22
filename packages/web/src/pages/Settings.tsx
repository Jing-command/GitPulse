/**
 * 设置页面
 */

import { Save } from 'lucide-react';

/**
 * Settings 页面
 * 全局配置、AI 配置、通知设置
 */
function Settings() {
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
            <SettingsNavItem title="AI 配置" active />
            <SettingsNavItem title="通知设置" />
            <SettingsNavItem title="外观设置" />
            <SettingsNavItem title="安全设置" />
            <SettingsNavItem title="关于" />
          </nav>
        </div>

        {/* 右侧内容 */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">AI 配置</h2>

            <div className="space-y-6">
              {/* AI 服务商 */}
              <div>
                <label className="label mb-2 block">AI 服务商</label>
                <select className="input w-full">
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="ollama">Ollama (本地)</option>
                </select>
                <p className="mt-1 text-xs text-neutral-500">选择用于生成内容的 AI 服务商</p>
              </div>

              {/* 模型选择 */}
              <div>
                <label className="label mb-2 block">模型</label>
                <select className="input w-full">
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="label mb-2 block">API Key</label>
                <input
                  type="password"
                  className="input w-full"
                  placeholder="sk-..."
                  defaultValue="sk-••••••••••••••••"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  API Key 已加密存储，仅显示部分内容
                </p>
              </div>

              {/* 降级配置 */}
              <div>
                <label className="label mb-2 block">降级服务商</label>
                <select className="input w-full">
                  <option value="">不启用降级</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="ollama">Ollama (本地)</option>
                </select>
                <p className="mt-1 text-xs text-neutral-500">
                  当主服务商不可用时，自动切换到降级服务商
                </p>
              </div>

              {/* 温度参数 */}
              <div>
                <label className="label mb-2 block">温度参数 (Temperature)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.7"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>精确 (0)</span>
                  <span>创意 (1)</span>
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
  active?: boolean;
}

/**
 * 设置导航项组件
 */
function SettingsNavItem({ title, active }: SettingsNavItemProps) {
  return (
    <button
      className={`w-full rounded-lg px-4 py-2 text-left text-sm transition-colors ${
        active
          ? 'bg-primary-50 text-primary'
          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
      }`}
    >
      {title}
    </button>
  );
}

export default Settings;
