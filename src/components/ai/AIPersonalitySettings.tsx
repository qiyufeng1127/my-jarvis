import React, { useState } from 'react';
import { X, Upload, Sparkles } from 'lucide-react';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';

interface AIPersonalitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIPersonalitySettings({ isOpen, onClose }: AIPersonalitySettingsProps) {
  const { personality, updatePersonality, applyPreset } = useAIPersonalityStore();
  const [localPersonality, setLocalPersonality] = useState(personality);
  const [avatarInput, setAvatarInput] = useState(personality.avatar);

  if (!isOpen) return null;

  const handleSave = () => {
    updatePersonality(localPersonality);
    onClose();
  };

  const handlePresetChange = (preset: typeof personality.preset) => {
    applyPreset(preset);
    // 重新加载最新的personality
    setTimeout(() => {
      const updated = useAIPersonalityStore.getState().personality;
      setLocalPersonality(updated);
      setAvatarInput(updated.avatar);
    }, 100);
  };

  const presets = [
    { id: 'gentle', name: '温柔体贴', emoji: '🤗', desc: '像闺蜜一样温柔关心' },
    { id: 'toxic', name: '毒舌教练', emoji: '😏', desc: '直接犀利，不留情面' },
    { id: 'professional', name: '专业顾问', emoji: '👔', desc: '正式严谨，注重效率' },
    { id: 'friend', name: '好朋友', emoji: '😊', desc: '轻松随意，偶尔调侃' },
    { id: 'custom', name: '自定义', emoji: '⚙️', desc: '完全自定义性格' },
  ];

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI性格设置</h2>
            <p className="text-sm text-gray-500 mt-1">打造专属于你的AI教练</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 预设性格模板 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              <Sparkles className="w-4 h-4 inline mr-1" />
              快速选择性格模板
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    localPersonality.preset === preset.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{preset.emoji}</div>
                  <div className="font-semibold text-gray-900 text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 基础信息 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">基础信息</h3>
            
            {/* AI名字 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI名字
              </label>
              <input
                type="text"
                value={localPersonality.name}
                onChange={(e) =>
                  setLocalPersonality({ ...localPersonality, name: e.target.value })
                }
                placeholder="例如：王嘉尔、小助手、教练"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 头像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                头像（emoji或图片URL）
              </label>
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{localPersonality.avatar}</div>
                <input
                  type="text"
                  value={avatarInput}
                  onChange={(e) => {
                    setAvatarInput(e.target.value);
                    setLocalPersonality({ ...localPersonality, avatar: e.target.value });
                  }}
                  placeholder="例如：😎 或图片URL"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 可以输入emoji表情或图片链接
              </p>
            </div>

            {/* 称呼用户 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                称呼你为
              </label>
              <input
                type="text"
                value={localPersonality.callUserAs}
                onChange={(e) =>
                  setLocalPersonality({ ...localPersonality, callUserAs: e.target.value })
                }
                placeholder="例如：老板、宝、兄弟、废物"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 性格参数 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">性格参数</h3>

            {/* 毒舌程度 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  毒舌程度
                </label>
                <span className="text-sm font-semibold text-purple-600">
                  {localPersonality.toxicity}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localPersonality.toxicity}
                onChange={(e) =>
                  setLocalPersonality({
                    ...localPersonality,
                    toxicity: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>温柔体贴 😊</span>
                <span>毒舌犀利 😏</span>
              </div>
            </div>

            {/* 严格程度 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  严格程度
                </label>
                <span className="text-sm font-semibold text-purple-600">
                  {localPersonality.strictness}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localPersonality.strictness}
                onChange={(e) =>
                  setLocalPersonality({
                    ...localPersonality,
                    strictness: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>宽容理解 🤗</span>
                <span>严格要求 😤</span>
              </div>
            </div>

            {/* 正式程度 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  正式程度
                </label>
                <span className="text-sm font-semibold text-purple-600">
                  {localPersonality.formality}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localPersonality.formality}
                onChange={(e) =>
                  setLocalPersonality({
                    ...localPersonality,
                    formality: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>口语化 💬</span>
                <span>正式专业 👔</span>
              </div>
            </div>
          </div>

          {/* 自定义提示词 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自定义提示词（高级）
            </label>
            <textarea
              value={localPersonality.customPrompt || ''}
              onChange={(e) =>
                setLocalPersonality({
                  ...localPersonality,
                  customPrompt: e.target.value,
                })
              }
              placeholder="例如：你是一个严厉但关心用户的教练，说话直接但有温度..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 留空则使用性格参数自动生成提示词
            </p>
          </div>

          {/* 预览效果 */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              💬 预览效果
            </div>
            <div className="space-y-3">
              {/* 用户消息 */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
                  <div className="text-sm">待会儿3点去打扫卫生</div>
                </div>
              </div>
              
              {/* AI回复 */}
              <div className="flex justify-start items-start space-x-2">
                <div className="text-2xl">{localPersonality.avatar}</div>
                <div className="bg-white rounded-lg px-4 py-2 max-w-[80%] shadow-sm">
                  <div className="text-xs font-semibold text-purple-600 mb-1">
                    {localPersonality.name}
                  </div>
                  <div className="text-sm text-gray-900">
                    {localPersonality.toxicity > 70
                      ? `行，3点打扫卫生安排上了。别又找借口拖延啊，${localPersonality.callUserAs}，我盯着你呢👀`
                      : localPersonality.toxicity > 40
                      ? `好的${localPersonality.callUserAs}，3点打扫卫生已经安排好了，记得按时完成哦~`
                      : `收到啦${localPersonality.callUserAs}！3点打扫卫生已经帮你加到时间轴了，加油💪`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}


