/**
 * 团队管理页面
 */

import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Shield, Edit, Eye, X, Loader2, UserPlus } from 'lucide-react';
import { usersAPI, authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar_url?: string;
  created_at: string;
}

/**
 * Team 页面
 * 成员管理、角色分配
 */
function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 邀请成员模态框状态
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // 编辑成员模态框状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getUsers();
      setUsers(data.items);
      setError(null);
    } catch (err) {
      setError('获取用户列表失败，需要管理员权限');
    } finally {
      setLoading(false);
    }
  };

  // 过滤用户列表
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 打开邀请模态框
  const openInviteModal = () => {
    setInviteForm({ name: '', email: '', role: 'viewer' });
    setInviteError(null);
    setIsInviteModalOpen(true);
  };

  // 处理邀请成员
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) {
      setInviteError('请填写完整信息');
      return;
    }

    setInviting(true);
    setInviteError(null);

    try {
      // 使用注册 API 创建新用户（实际项目中应该有专门的邀请 API）
      await authAPI.register(inviteForm.email, 'TempPass123!', inviteForm.name);
      setIsInviteModalOpen(false);
      fetchUsers(); // 刷新用户列表
    } catch (err) {
      setInviteError('邀请成员失败，该邮箱可能已存在');
    } finally {
      setInviting(false);
    }
  };

  // 打开编辑模态框
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setIsEditModalOpen(true);
  };

  // 保存角色修改
  const handleSaveRole = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      await usersAPI.updateUser(editingUser.id, { role: editRole });
      setIsEditModalOpen(false);
      fetchUsers(); // 刷新用户列表
    } catch (err) {
      console.error('更新角色失败', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-neutral-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-error">{error}</div>
          <button
            onClick={fetchUsers}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">团队管理</h1>
          <p className="mt-1 text-sm text-neutral-500">管理团队成员和权限</p>
        </div>
        <button
          onClick={openInviteModal}
          className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600"
        >
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-neutral-500">
                    {searchQuery ? '未找到匹配的成员' : '暂无成员'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <MemberRow
                  key={user.id}
                  user={user}
                  onEdit={() => openEditModal(user)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 邀请成员模态框 */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">邀请成员</h2>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                disabled={inviting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  姓名 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                  placeholder="请输入成员姓名"
                  className="input mt-1 w-full"
                  disabled={inviting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  邮箱 <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  placeholder="请输入邮箱地址"
                  className="input mt-1 w-full"
                  disabled={inviting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  角色
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      role: e.target.value as 'admin' | 'editor' | 'viewer',
                    })
                  }
                  className="input mt-1 w-full"
                  disabled={inviting}
                >
                  <option value="viewer">查看者</option>
                  <option value="editor">编辑</option>
                  <option value="admin">管理员</option>
                </select>
              </div>

              {inviteError && (
                <div className="rounded-lg bg-error-50 p-3 text-sm text-error">
                  {inviteError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="btn border border-border px-4 py-2 hover:bg-neutral-50"
                  disabled={inviting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
                  disabled={inviting}
                >
                  {inviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      邀请中...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      邀请
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑成员模态框 */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">编辑成员</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                disabled={saving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary">
                  <span className="text-sm font-medium">
                    {editingUser.name?.charAt(0) || editingUser.email.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {editingUser.name || editingUser.email}
                  </p>
                  <p className="text-sm text-neutral-500">{editingUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  角色
                </label>
                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(e.target.value as 'admin' | 'editor' | 'viewer')
                  }
                  className="input mt-1 w-full"
                  disabled={saving}
                >
                  <option value="viewer">查看者</option>
                  <option value="editor">编辑</option>
                  <option value="admin">管理员</option>
                </select>
                <p className="mt-1 text-xs text-neutral-500">
                  修改角色将立即生效
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="btn border border-border px-4 py-2 hover:bg-neutral-50"
                disabled={saving}
              >
                取消
              </button>
              <button
                onClick={handleSaveRole}
                className="btn bg-primary px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
 * 成员行组件属性
 */
interface MemberRowProps {
  user: User;
  onEdit: () => void;
}

/**
 * 成员行组件
 */
function MemberRow({ user, onEdit }: MemberRowProps) {
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

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium">
                {user.name?.charAt(0) || user.email.charAt(0)}
              </span>
            )}
          </div>
          <span className="font-medium text-foreground">
            {user.name || user.email}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-500">{user.email}</span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            roleColors[user.role]
          }`}
        >
          {roleLabels[user.role]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-500">
          {formatDate(user.created_at)}
        </span>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={onEdit}
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}

export default TeamPage;
