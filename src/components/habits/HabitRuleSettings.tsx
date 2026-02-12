import { useState } from 'react';
import { useHabitCanStore } from '@/stores/habitCanStore';
import { X, Save, Trash2, Power, PowerOff } from 'lucide-react';
import type { BadHabit } from '@/types/habitTypes';
import { HABIT_CAN_COLORS } from '@/styles/habitCanColors';

interface HabitRuleSettingsProps {
  isDark: boolean;
  cardBg: string;
  textColor: string;
  accentColor: string;
  onClose: () => void;
}

export default function HabitRuleSettings({
  isDark,
  cardBg,
  textColor,
  accentColor,
  onClose,
}: HabitRuleSettingsProps) {
  const { habits, updateHabit, deleteHabit, toggleHabit } = useHabitCanStore();
  const [editingHabit, setEditingHabit] = useState<BadHabit | null>(null);

  const handleSave = () => {
    if (!editingHabit) return;
    updateHabit(editingHabit.id, editingHabit);
    setEditingHabit(null);
  };

  const handleDelete = (habitId: string) => {
    if (confirm('确定要删除这个坏习惯吗？所有相关记录也会被删除。')) {
      deleteHabit(habitId);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl p-6"
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
          ⚙️ 坏习惯规则设置
        </h2>

        {/* 习惯列表 */}
        <div className="space-y-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="rounded-xl p-4"
              style={{
                backgroundColor: '#f5f5f5',
                opacity: habit.enabled ? 1 : 0.5,
              }}
            >
              <div className="flex items-start justify-between">
                {/* 左侧：习惯信息 */}
                <div className="flex items-start space-x-4 flex-1">
                  <span className="text-4xl">{habit.emoji}</span>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                        {habit.name}
                      </span>
                      {habit.isPreset && (
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: '#666666' }}
                        >
                          预设
                        </span>
                      )}
                    </div>

                    {/* 规则描述 */}
                    <div className="text-sm space-y-1" style={{ color: '#666666' }}>
                      {habit.rule.type === 'time_threshold' && habit.rule.timeThreshold && (
                        <div>
                          ⏰ 时间阈值: {habit.rule.timeThreshold.checkType === 'first_event' ? '第一个任务' : '最后一个任务'}{' '}
                          {habit.rule.timeThreshold.comparison === 'after' ? '晚于' : '早于'} {habit.rule.timeThreshold.time}
                        </div>
                      )}
                      {habit.rule.type === 'keyword' && habit.rule.keywordRule && (
                        <div>
                          🔍 关键词: {habit.rule.keywordRule.keywords.join('、')}
                          {habit.rule.keywordRule.timeRange && (
                            <span> ({habit.rule.keywordRule.timeRange.start}-{habit.rule.keywordRule.timeRange.end})</span>
                          )}
                          {habit.rule.keywordRule.shouldExist ? ' 存在则记录' : ' 不存在则记录'}
                        </div>
                      )}
                      {habit.rule.type === 'task_status' && habit.rule.taskStatusRule && (
                        <div>
                          📊 任务状态: {habit.rule.taskStatusRule.statusType === 'start_timeout' ? '启动超时' : '完成超时'}
                          {habit.rule.taskStatusRule.countPerOccurrence && (
                            <span> (每次记{habit.rule.taskStatusRule.countPerOccurrence}次)</span>
                          )}
                        </div>
                      )}
                      {habit.rule.type === 'manual' && (
                        <div>✍️ 手动记录</div>
                      )}
                    </div>

                    {/* 编辑按钮 */}
                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="mt-2 text-sm px-3 py-1 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: HABIT_CAN_COLORS.terreCuite }}
                    >
                      编辑规则
                    </button>
                  </div>
                </div>

                {/* 右侧：操作按钮 */}
                <div className="flex items-center space-x-2">
                  {/* 启用/禁用 */}
                  <button
                    onClick={() => toggleHabit(habit.id, !habit.enabled)}
                    className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: habit.enabled ? 'rgba(0,255,0,0.1)' : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {habit.enabled ? (
                      <Power size={18} style={{ color: '#00ff00' }} />
                    ) : (
                      <PowerOff size={18} style={{ color: '#999999' }} />
                    )}
                  </button>

                  {/* 删除（仅非预设） */}
                  {!habit.isPreset && (
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'rgba(255,0,0,0.1)' }}
                    >
                      <Trash2 size={18} style={{ color: '#ff4444' }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 编辑弹窗 */}
        {editingHabit && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setEditingHabit(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-xl p-6"
              style={{ 
                backgroundColor: '#ffffff',
                boxShadow: HABIT_CAN_COLORS.shadows.card,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>
                编辑规则: {editingHabit.emoji} {editingHabit.name}
              </h3>

              {/* 时间阈值规则编辑 */}
              {editingHabit.rule.type === 'time_threshold' && editingHabit.rule.timeThreshold && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                      阈值时间
                    </label>
                    <input
                      type="time"
                      value={editingHabit.rule.timeThreshold.time}
                      onChange={(e) =>
                        setEditingHabit({
                          ...editingHabit,
                          rule: {
                            ...editingHabit.rule,
                            timeThreshold: {
                              ...editingHabit.rule.timeThreshold!,
                              time: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: '#f5f5f5',
                        color: '#000000',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 关键词规则编辑 */}
              {editingHabit.rule.type === 'keyword' && editingHabit.rule.keywordRule && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                      关键词（用逗号分隔）
                    </label>
                    <input
                      type="text"
                      value={editingHabit.rule.keywordRule.keywords.join(',')}
                      onChange={(e) =>
                        setEditingHabit({
                          ...editingHabit,
                          rule: {
                            ...editingHabit.rule,
                            keywordRule: {
                              ...editingHabit.rule.keywordRule!,
                              keywords: e.target.value.split(',').map((k) => k.trim()),
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: '#f5f5f5',
                        color: '#000000',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 保存按钮 */}
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button
                  onClick={() => setEditingHabit(null)}
                  className="px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#000000' }}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: HABIT_CAN_COLORS.terreCuite, color: '#ffffff' }}
                >
                  <Save size={18} />
                  <span>保存</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

