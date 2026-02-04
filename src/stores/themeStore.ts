import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'rose' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';

interface ThemeState {
  // 主题模式
  mode: ThemeMode;
  // 主色调
  accentColor: AccentColor;
  // 实际应用的主题（考虑自动模式）
  effectiveTheme: 'light' | 'dark';
  
  // 操作
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  updateEffectiveTheme: () => void;
}

// 主色调配置
export const ACCENT_COLORS = {
  rose: {
    name: '玫瑰粉',
    primary: '#e11d48',
    light: '#fecdd3',
    dark: '#9f1239',
  },
  green: {
    name: '森林绿',
    primary: '#059669',
    light: '#a7f3d0',
    dark: '#065f46',
  },
  yellow: {
    name: '阳光黄',
    primary: '#eab308',
    light: '#fef08a',
    dark: '#a16207',
  },
  red: {
    name: '热情红',
    primary: '#dc2626',
    light: '#fecaca',
    dark: '#991b1b',
  },
  gray: {
    name: '经典灰',
    primary: '#6b7280',
    light: '#e5e7eb',
    dark: '#374151',
  },
  purple: {
    name: '神秘紫',
    primary: '#9333ea',
    light: '#e9d5ff',
    dark: '#6b21a8',
  },
};

// 检测系统主题
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      accentColor: 'rose',
      effectiveTheme: 'light',

      setMode: (mode) => {
        set({ mode });
        get().updateEffectiveTheme();
      },

      setAccentColor: (color) => {
        set({ accentColor: color });
        // 应用主色调到 CSS 变量
        const colors = ACCENT_COLORS[color];
        document.documentElement.style.setProperty('--accent-primary', colors.primary);
        document.documentElement.style.setProperty('--accent-light', colors.light);
        document.documentElement.style.setProperty('--accent-dark', colors.dark);
      },

      updateEffectiveTheme: () => {
        const { mode } = get();
        let effectiveTheme: 'light' | 'dark' = 'light';

        if (mode === 'auto') {
          effectiveTheme = getSystemTheme();
        } else {
          effectiveTheme = mode;
        }

        set({ effectiveTheme });

        // 应用主题到 document
        if (effectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // 恢复后立即应用主题
        if (state) {
          state.updateEffectiveTheme();
          const colors = ACCENT_COLORS[state.accentColor];
          document.documentElement.style.setProperty('--accent-primary', colors.primary);
          document.documentElement.style.setProperty('--accent-light', colors.light);
          document.documentElement.style.setProperty('--accent-dark', colors.dark);
        }
      },
    }
  )
);

// 监听系统主题变化
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const store = useThemeStore.getState();
    if (store.mode === 'auto') {
      store.updateEffectiveTheme();
    }
  });
}

