/**
 * 团队管理页面
 */

import { Plus, Search, MoreHorizontal, Shield, Edit, Eye } from 'lucide-react';

/**
 * Team 页面
 * 成员管理、角色分配
 */
function Team() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">团队管理</h1>
          <p className="mt-1 text-sm text-neutral-500">管理团队成员和权限</p>
        </div>
        <button className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600">
          <Plus className="mr-2 h-4 w-4" />
          邀请成员
        </button>
      </div>

      {/* 搜索 */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="搜索成员..."
          className="input h-10 w-full pl-10"
        />
      </div>

      {/* 角色说明 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RoleCard
          title="管理员"
          description="拥有所有权限，可以管理成员和项目"
          icon={Shield}
          color="primary"
        />
        <RoleCard
          title="编辑"
          description="可以创建和编辑内容，提交审核"
          icon={Edit}
          color="success"
        />
        <RoleCard
          title="查看者"
          description="只能查看内容，无编辑权限"
          icon={Eye}
          color="neutral"
        />
      </div>

      {/* 成员列表 */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                成员
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                邮箱
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                加入时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <MemberRow
              name="张三"
              email="zhangsan@example.com"
              role="admin"
              avatar="https://avatars.githubusercontent.com/u/1?v=4"
              joinedAt="2024-01-01"
            />
            <MemberRow
              name="李四"
              email="lisi@example.com"
              role="editor"
              avatar="https://avatars.githubusercontent.com/u/2?v=4"
              joinedAt="2024-01-15"
            />
            <MemberRow
              name="王五"
              email="wangwu@example.com"
              role="viewer"
              avatar="https://avatars.githubusercontent.com/u/3?v=4"
              joinedAt="2024-02-01"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 角色卡片属性
 */
interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'neutral';
}

/**
 * 角色卡片组件
 */
function RoleCard({ title, description, icon: Icon, color }: RoleCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary',
    success: 'bg-success-50 text-success',
    neutral: 'bg-neutral-100 text-neutral-600',
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 成员行属性
 */
interface MemberRowProps {
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  joinedAt: string;
}

/**
 * 成员行组件
 */
function MemberRow({ name, email, role, avatar, joinedAt }: MemberRowProps) {
  const roleLabels = {
    admin: '管理员',
    editor: '编辑',
    viewer: '查看者',
  };

  const roleColors = {
    admin: 'bg-primary-50 text-primary',
    editor: 'bg-success-50 text-success',
    viewer: 'bg-neutral-100 text-neutral-600',
  };

  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary">
            {avatar ? (
              <img src={avatar} alt={name} className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-medium">{name.charAt(0)}</span>
            )}
          </div>
          <span className="font-medium text-foreground">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-500">{email}</span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleColors[role]}`}
        >
          {roleLabels[role]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-500">{joinedAt}</span>
      </td>
      <td className="px-6 py-4">
        <button className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}

export default Team;
