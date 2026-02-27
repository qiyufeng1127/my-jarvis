import { useState, useEffect } from 'react';
import { Camera, Image, Zap } from 'lucide-react';

export type VerificationMode = 'baidu' | 'realtime';

interface VerificationModeSettings {
  mode: VerificationMode;
  realtimeConfig: {
    requireAll: boolean; // 是否需要识别到所有物品
    minConfidence: number; // 最小置信度
    maxSelection: number; // 最大选择物品数量
  };
}

export default function VerificationModeSettings() {
  const [settings, setSettings] = useState<VerificationModeSettings>({
    mode: 'baidu',
    realtimeConfig: {
      requireAll: false,
      minConfidence: 0.5,
      maxSelection: 10,
    },
  });

  // 加载保存的设置
  useEffect(() => {
    const saved = localStorage.getItem('verification_mode_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('加载验证模式设置失败:', error);
      }
    }
  }, []);

  // 保存设置
  const saveSettings = (newSettings: VerificationModeSettings) => {
    setSettings(newSettings);
    localStorage.setItem('verification_mode_settings', JSON.stringify(newSettings));
    console.log('✅ 验证模式设置已保存');
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          验证模式设置
        </h2>
      </div>

      {/* 验证模式选择 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
          选择验证方式
        </h3>

        {/* 百度AI验证 */}
        <button
          onClick={() => saveSettings({ ...settings, mode: 'baidu' })}
          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
            settings.mode === 'baidu'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              settings.mode === 'baidu' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <Image className={`w-5 h-5 ${
                settings.mode === 'baidu' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  百度AI图像识别
                </h4>
                {settings.mode === 'baidu' && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    当前使用
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                拍照后上传到百度AI进行识别，支持智能语义匹配
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                  ✓ 识别准确
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                  ✓ 智能匹配
                </span>
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded">
                  需要网络
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* 实时物品识别 */}
        <button
          onClick={() => saveSettings({ ...settings, mode: 'realtime' })}
          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
            settings.mode === 'realtime'
              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              settings.mode === 'realtime' ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <Camera className={`w-5 h-5 ${
                settings.mode === 'realtime' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  实时物品识别
                </h4>
                {settings.mode === 'realtime' && (
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                    当前使用
                  </span>
                )}
                <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded-full font-semibold">
                  NEW
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                实时相机识别，无需上传，支持80+种常见物品
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                  ✓ 实时反馈
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                  ✓ 离线可用
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                  ✓ 无需配置
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* 实时识别配置 */}
      {settings.mode === 'realtime' && (
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 space-y-4">
          <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">
            实时识别配置
          </h3>

          {/* 验证规则 */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
              验证规则
            </label>
            <div className="space-y-2">
              <button
                onClick={() => saveSettings({
                  ...settings,
                  realtimeConfig: { ...settings.realtimeConfig, requireAll: false }
                })}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  !settings.realtimeConfig.requireAll
                    ? 'border-purple-600 bg-white dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-medium text-gray-800 dark:text-white">
                  识别到任意一个物品即可通过
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  推荐：更容易通过验证
                </div>
              </button>

              <button
                onClick={() => saveSettings({
                  ...settings,
                  realtimeConfig: { ...settings.realtimeConfig, requireAll: true }
                })}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  settings.realtimeConfig.requireAll
                    ? 'border-purple-600 bg-white dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-medium text-gray-800 dark:text-white">
                  必须识别到所有物品才能通过
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  更严格的验证方式
                </div>
              </button>
            </div>
          </div>

          {/* 最小置信度 */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
              识别置信度：{(settings.realtimeConfig.minConfidence * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.1"
              value={settings.realtimeConfig.minConfidence}
              onChange={(e) => saveSettings({
                ...settings,
                realtimeConfig: { ...settings.realtimeConfig, minConfidence: parseFloat(e.target.value) }
              })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>宽松 (30%)</span>
              <span>严格 (90%)</span>
            </div>
          </div>

          {/* 最大选择数量 */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
              最多选择物品数量：{settings.realtimeConfig.maxSelection} 个
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={settings.realtimeConfig.maxSelection}
              onChange={(e) => saveSettings({
                ...settings,
                realtimeConfig: { ...settings.realtimeConfig, maxSelection: parseInt(e.target.value) }
              })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1 个</span>
              <span>20 个</span>
            </div>
          </div>
        </div>
      )}

      {/* 说明 */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>提示：</strong>
          {settings.mode === 'baidu' 
            ? '百度AI识别需要配置API密钥，支持更智能的语义匹配。'
            : '实时识别使用浏览器端AI模型，首次使用需要下载模型（约10MB），之后可离线使用。'
          }
        </p>
      </div>
    </div>
  );
}

// 导出获取当前设置的工具函数
export function getVerificationModeSettings(): VerificationModeSettings {
  const saved = localStorage.getItem('verification_mode_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('加载验证模式设置失败:', error);
    }
  }

  // 默认设置
  return {
    mode: 'baidu',
    realtimeConfig: {
      requireAll: false,
      minConfidence: 0.5,
      maxSelection: 10,
    },
  };
}

