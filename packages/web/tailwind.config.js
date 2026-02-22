/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // 主色调 - 科技蓝
        primary: {
          DEFAULT: '#0052D9',
          50: '#F2F7FF',
          100: '#E0EFFF',
          200: '#B8D9FF',
          300: '#7DB5FF',
          400: '#3D8EFF',
          500: '#0052D9',
          600: '#003CAB',
          700: '#002A7D',
          800: '#001A4F',
          900: '#000D26',
        },
        // 成功色 - 绿色
        success: {
          DEFAULT: '#00A870',
          50: '#E8F8F2',
          100: '#D1F1E6',
          200: '#A3E4CD',
          300: '#6FD7B2',
          400: '#3DC594',
          500: '#00A870',
          600: '#00875A',
          700: '#006643',
          800: '#00452C',
          900: '#002316',
        },
        // 警告色 - 橙色
        warning: {
          DEFAULT: '#ED7B2F',
          50: '#FFF4E8',
          100: '#FFE9D1',
          200: '#FFD4A3',
          300: '#FFBA6F',
          400: '#FF9A3D',
          500: '#ED7B2F',
          600: '#D15E16',
          700: '#A5450D',
          800: '#7A300A',
          900: '#4E1D06',
        },
        // 错误色 - 红色
        error: {
          DEFAULT: '#E34D59',
          50: '#FDEBEC',
          100: '#FBD7D9',
          200: '#F7AFB3',
          300: '#F2878E',
          400: '#E8616A',
          500: '#E34D59',
          600: '#C9353F',
          700: '#A42630',
          800: '#7F1A22',
          900: '#5A1017',
        },
        // 中性色
        neutral: {
          DEFAULT: '#5E6E82',
          50: '#F6F7F9',
          100: '#EDF0F3',
          200: '#D8DEE6',
          300: '#B5C0D0',
          400: '#8497B0',
          500: '#5E6E82',
          600: '#4B5A6B',
          700: '#394554',
          800: '#272F3B',
          900: '#141920',
        },
        // 边框色
        border: '#D8DEE6',
        // 输入框背景
        input: '#F6F7F9',
        // 背景
        background: '#FFFFFF',
        // 前景
        foreground: '#141920',
        // 卡片
        card: '#FFFFFF',
        // 弹出层
        popover: '#FFFFFF',
        // 次要
        secondary: '#F6F7F9',
        // 静音
        muted: '#F6F7F9',
        // 强调
        accent: '#F6F7F9',
        // 销毁
        destructive: '#E34D59',
        // 圆环
        ring: '#0052D9',
      },
      borderRadius: {
        lg: '6px',
        md: '4px',
        sm: '2px',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
