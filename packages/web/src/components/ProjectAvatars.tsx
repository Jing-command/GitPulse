/**
 * 项目头像组件 - 使用 Dicebear API
 * 简约现代化的 SVG 头像生成
 * @see https://www.dicebear.com
 */

import type { FC } from 'react';

/**
 * Dicebear 风格配置
 * 使用 shapes 风格：现代几何图形，简约美观
 */
const DICEBEAR_BASE_URL = 'https://api.dicebear.com/9.x/shapes/svg';

/**
 * 项目配色方案 - 协调的渐变色彩
 * 用于背景色，让每个项目有不同的色调
 */
const PROJECT_COLORS = [
  'b6e3f4', // 浅蓝
  'c0aede', // 淡紫
  'd1d4f9', // 薰衣草
  'ffd5dc', // 粉红
  'ffdfbf', // 蜜桃
  'c1f5d3', // 薄荷绿
  'fef3c7', // 暖黄
  'dbeafe', // 天蓝
  'e9d5ff', // 紫罗兰
  'fce7f3', // 玫瑰
  'd1fae5', // 翠绿
  'fed7aa', // 橙黄
  'e0e7ff', // 靛蓝
  'fae8ff', // 洋红
  'ccfbf1', // 青绿
  'fde68a', // 金黄
  'ddd6fe', // 紫水晶
  'fecaca', // 珊瑚
  'bfdbfe', // 钴蓝
  'fbcfe8', // 粉紫
  'bbf7d0', // 春绿
  'fde047', // 柠檬
  'a5f3fc', // 青色
  'fecdd3', // 樱花
  'c7d2fe', // 矢车菊
  'fde047', // 向日葵
  'e879f9', // 紫红
  '38bdf8', // 天青
  'a78bfa', // 紫罗兰
  'fb7185', // 玫瑰红
];

/**
 * 根据项目索引获取颜色
 * @param index 项目索引
 * @returns 十六进制颜色值（不带 #）
 */
function getProjectColor(index: number): string {
  const safeIndex = Math.abs(index) % PROJECT_COLORS.length;
  return PROJECT_COLORS[safeIndex] as string;
}

/**
 * 生成 Dicebear 头像 URL
 * @param seed 种子值（项目名称或ID）
 * @param index 颜色索引
 * @returns 头像图片 URL
 */
function generateAvatarUrl(seed: string, index: number): string {
  const color = getProjectColor(index);
  const params = new URLSearchParams({
    seed: seed,
    backgroundColor: color,
    radius: '12', // 圆角
  });
  return `${DICEBEAR_BASE_URL}?${params.toString()}`;
}

/**
 * 项目头像属性
 */
interface ProjectAvatarProps {
  /** 头像索引，用于选择颜色 */
  index: number;
  /** 项目ID或名称，用于生成确定性头像 */
  seed?: string;
  /** 自定义类名 */
  className?: string;
  /** 头像尺寸（像素） */
  size?: number;
}

/**
 * 项目头像组件
 * 使用 Dicebear API 生成简约几何风格的 SVG 头像
 *
 * @example
 * <ProjectAvatar index={0} seed="my-project" size={48} />
 * <ProjectAvatar index={0} seed="my-project" className="h-full w-full" />
 */
export const ProjectAvatar: FC<ProjectAvatarProps> = ({
  index,
  seed,
  className = '',
  size = 48,
}) => {
  // 使用 seed 或基于 index 生成种子
  const avatarSeed = seed || `project-${index}`;
  const avatarUrl = generateAvatarUrl(avatarSeed, index);

  // 检测是否使用了自适应尺寸类名（h-full w-full 或 h-12 w-12 等）
  const isResponsive = className.includes('h-full') || className.includes('w-full') ||
                       /\bh-\d+/.test(className) || /\bw-\d+/.test(className);

  // 如果是自适应模式，使用 div 包装并填满容器
  if (isResponsive) {
    return (
      <div className={`flex-shrink-0 overflow-hidden rounded-xl ${className}`}>
        <img
          src={avatarUrl}
          alt={`Project avatar ${index}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // 固定尺寸模式
  return (
    <div
      className={`flex-shrink-0 overflow-hidden rounded-xl ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={avatarUrl}
        alt={`Project avatar ${index}`}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

/**
 * 根据索引获取项目头像
 * @param index 头像索引
 * @param seed 可选的种子值（项目名称或ID）
 * @returns 头像 URL 字符串
 * @deprecated 建议使用 ProjectAvatar 组件代替
 */
export function getProjectAvatar(index: number, seed?: string): string {
  const avatarSeed = seed || `project-${index}`;
  return generateAvatarUrl(avatarSeed, index);
}

/**
 * 获取项目头像 URL
 * 用于需要直接获取头像 URL 的场景
 *
 * @param projectId 项目ID
 * @param index 颜色索引
 * @returns 头像图片 URL
 *
 * @example
 * const url = getProjectAvatarUrl('proj-123', 0);
 * // 返回: https://api.dicebear.com/9.x/shapes/svg?seed=proj-123&backgroundColor=b6e3f4&radius=12
 */
export function getProjectAvatarUrl(projectId: string, index: number): string {
  return generateAvatarUrl(projectId, index);
}

export default ProjectAvatar;
