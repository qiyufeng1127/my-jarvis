import { useState } from 'react';
import { useHabitCanStore } from '@/stores/habitCanStore';
import { X, Save, Plus } from 'lucide-react';
import type { BadHabit, RuleType } from '@/types/habitTypes';
import { HABIT_CAN_COLORS } from '@/styles/habitCanColors';

interface CustomizeHabitModalProps {
  isDark: boolean;
  cardBg: string;
  textColor: string;
  accentColor: string;
  onClose: () => void;
}

const EMOJI_POOL = [
  '😴', '🌙', '🛌', '⏰', '🕒', '🐢', '🍱', '🥣', '🍔', '🍕',
  '📱', '💻', '🎮', '📺', '🚬', '🍺', '💤', '😤', '😰', '😓',
  '🤯', '😵', '🥱', '😪', '🤦', '🙈', '🙉', '🙊', '💸', '🗑️',
];

export default function CustomizeHabitModal({
  isDark,
  cardBg,
  textColor,
  accentColor,
  onClose,
}: CustomizeHabitModalProps) {
  const { createHabit } = useHabitCanStore();
  
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [ruleType, setRuleType] = useState<RuleType>('manual');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // 时间阈值规则参数
  const [thresholdTime, setThresholdTime] = useState('23:00');
  const [comparison, setComparison] = useState<'before' | 'after'>('after');
  const [checkType, setCheckType] = useState<'first_event' | 'last_event'>('last_event');
  
  // 关键词规则参数
  const [keywords, setKeywords] = useState('');
  const [timeRangeStart, setTimeRangeStart] = useState('');
  const [timeRangeEnd, setTimeRangeEnd] = useState('');
  const [shouldExist, setShouldExist] = useState(true);

  const handleCreate = () => {
    if (!name.trim()) {
      alert('请输入坏习惯名称');
      return;
    }

    const newHabit: Omit<BadHabit, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      emoji,
      isPreset: false,
      enabled: true,
      rule: {
        id: `custom-${Date.now()}`,
        type: ruleType,
        enabled: true,
      },
    };

    // 根据规则类型添加参数
    if (ruleType === 'time_threshold') {
      newHabit.rule.timeThreshold = {
        time: thresholdTime,
        comparison,
        checkType,
      };
    } else if (ruleType === 'keyword') {
      newHabit.rule.keywordRule = {
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        matchType: 'any',
        shouldExist,
        ...(timeRangeStart && timeRangeEnd ? {
          timeRange: { start: timeRangeStart, end: timeRangeEnd }
        } : {}),
      };
    }

    createHabit(newHabit);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6"
        style={{ 
          backgroundColor: '#ffffff',
          boxShadow: HABIT_CAN_COLORS.shadows.card,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
        >
          <X size={20} style={{ color: '#000000' }} />
        </button>

        {/* 标题 */}
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#000000' }}>
          ➕ 自定义坏习惯
        </h2>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                坏习惯名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：刷短视频、吃零食..."
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: '#f5f5f5',
                  color: '#000000',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                选择 Emoji
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-5xl p-2 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  {emoji}
                </button>
                <span className="text-sm" style={{ color: '#666666' }}>
                  点击选择或输入自定义 emoji
                </span>
              </div>

              {showEmojiPicker && (
                <div
                  className="mt-2 p-3 rounded-lg grid grid-cols-10 gap-2"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  {EMOJI_POOL.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setEmoji(e);
                        setShowEmojiPicker(false);
                      }}
                      className="text-3xl hover:scale-110 transition-transform"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 规则类型选择 */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              监控规则类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'manual', label: '✍️ 手动记录', desc: '完全手动添加' },
                { value: 'time_threshold', label: '⏰ 时间阈值', desc: '基于任务时间' },
                { value: 'keyword', label: '🔍 关键词匹配', desc: '基于任务内容' },
                { value: 'task_status', label: '📊 任务状态', desc: '基于完成情况' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRuleType(option.value as RuleType)}
                  className="p-3 rounded-lg text-left hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: ruleType === option.value
                      ? HABIT_CAN_COLORS.espresso
                      : '#f5f5f5',
                    color: ruleType === option.value ? '#ffffff' : '#000000',
                  }}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs mt-1 opacity-70">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 规则参数配置 */}
          {ruleType === 'time_threshold' && (
            <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: '#f5f5f5' }}>
              <h3 className="font-semibold" style={{ color: '#000000' }}>⏰ 时间阈值规则配置</h3>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: '#000000' }}>检查类型</label>
                <select
                  value={checkType}
                  onChange={(e) => setCheckType(e.target.value as 'first_event' | 'last_event')}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                >
                  <option value="first_event">第一个任务（晚起）</option>
                  <option value="last_event">最后一个任务（熬夜）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#000000' }}>比较方式</label>
                <select
                  value={comparison}
                  onChange={(e) => setComparison(e.target.value as 'before' | 'after')}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                >
                  <option value="after">晚于</option>
                  <option value="before">早于</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#000000' }}>阈值时间</label>
                <input
                  type="time"
                  value={thresholdTime}
                  onChange={(e) => setThresholdTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                />
              </div>
            </div>
          )}

          {ruleType === 'keyword' && (
            <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: '#f5f5f5' }}>
              <h3 className="font-semibold" style={{ color: '#000000' }}>🔍 关键词规则配置</h3>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: '#000000' }}>关键词（用逗号分隔）</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="例如：外卖,美团,饿了么"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#000000' }}>匹配逻辑</label>
                <select
                  value={shouldExist ? 'exist' : 'not_exist'}
                  onChange={(e) => setShouldExist(e.target.value === 'exist')}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                >
                  <option value="exist">存在关键词则记录（如：点外卖）</option>
                  <option value="not_exist">不存在关键词则记录（如：不吃午饭）</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>时间范围开始（可选）</label>
                  <input
                    type="time"
                    value={timeRangeStart}
                    onChange={(e) => setTimeRangeStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>时间范围结束（可选）</label>
                  <input
                    type="time"
                    value={timeRangeEnd}
                    onChange={(e) => setTimeRangeEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {ruleType === 'task_status' && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f5f5' }}>
              <p className="text-sm" style={{ color: '#000000' }}>
                📊 任务状态规则需要在代码中配置具体逻辑，建议使用其他规则类型或手动记录。
              </p>
            </div>
          )}

          {ruleType === 'manual' && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f5f5' }}>
              <p className="text-sm" style={{ color: '#000000' }}>
                ✍️ 手动记录模式：需要你手动添加每次坏习惯的发生记录。
              </p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#000000' }}
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: HABIT_CAN_COLORS.terreCuite, color: '#ffffff' }}
          >
            <Save size={18} />
            <span>创建坏习惯</span>
          </button>
        </div>
      </div>
    </div>
  );
}

