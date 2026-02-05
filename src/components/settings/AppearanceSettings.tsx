import { useState, useEffect } from 'react';
import { Sun, Moon, Smartphone } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

export default function AppearanceSettings() {
  const { mode, effectiveTheme, setMode } = useThemeStore();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(
    (localStorage.getItem('fontSize') as any) || 'medium'
  );

  const isDark = effectiveTheme === 'dark';

  // 应用暗色主题到整个应用
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // 保存字体大小
  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    
    // 应用到根元素
    const root = document.documentElement;
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.fontSize = sizes[size];
  };

  return (
    <div className="space-y-4">
      {/* 主题模式 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-white">
          主题模式
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMode('light')}
            className={`p-3 rounded-lg transition-all ${
              mode === 'light'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Sun className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xs font-medium">明亮</div>
          </button>
          
          <button
            onClick={() => setMode('dark')}
            className={`p-3 rounded-lg transition-all ${
              mode === 'dark'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Moon className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xs font-medium">暗色</div>
          </button>
          
          <button
            onClick={() => setMode('auto')}
            className={`p-3 rounded-lg transition-all ${
              mode === 'auto'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Smartphone className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xs font-medium">自动</div>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {mode === 'auto' && '跟随系统设置'}
          {mode === 'light' && '始终使用明亮主题'}
          {mode === 'dark' && '始终使用暗色主题'}
        </p>
      </div>

      {/* 字体大小 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-white">
          字体大小
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'small', label: '小', size: 'text-xs' },
            { value: 'medium', label: '中', size: 'text-sm' },
            { value: 'large', label: '大', size: 'text-base' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleFontSizeChange(option.value as any)}
              className={`p-3 rounded-lg transition-all ${
                fontSize === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`${option.size} font-medium`}>
                {option.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 实时预览 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-white">
          实时预览
        </h3>
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900">
          <div className="text-sm font-medium mb-2 text-gray-800 dark:text-white">
            示例卡片
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            这是在当前主题下的样子
          </div>
          <button
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white transition-all hover:bg-blue-600 active:scale-95"
          >
            示例按钮
          </button>
        </div>
      </div>

      {/* 当前设置摘要 */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <h4 className="text-xs font-semibold mb-2 text-blue-800 dark:text-blue-300">
          当前设置
        </h4>
        <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
          <div className="flex justify-between">
            <span>主题:</span>
            <span className="font-medium">
              {mode === 'light' ? '☀️ 明亮' : mode === 'dark' ? '🌙 暗色' : '📱 自动'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>字体:</span>
            <span className="font-medium">
              {fontSize === 'small' ? '小' : fontSize === 'medium' ? '中' : '大'}
            </span>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 所有设置会立即生效并自动保存，刷新页面后依然保持
        </p>
      </div>
    </div>
  );
}

