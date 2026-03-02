import { useState } from 'react';
import { X, Calendar, Clock, Repeat } from 'lucide-react';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly';

export interface RecurrenceRule {
  type: RecurrenceType;
  time: string; // HH:mm 格式
  weekdays?: number[]; // 0-6 (周日到周六)
  endDate?: string; // YYYY-MM-DD 格式
}

interface TaskRecurrenceDialogProps {
  taskTitle: string;
  currentRule?: RecurrenceRule;
  onSave: (rule: RecurrenceRule | null) => void;
  onMoveToTomorrow: () => void;
  onClose: () => void;
  isDark: boolean;
}

export default function TaskRecurrenceDialog({
  taskTitle,
  currentRule,
  onSave,
  onMoveToTomorrow,
  onClose,
  isDark,
}: TaskRecurrenceDialogProps) {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(currentRule?.type || 'once');
  const [time, setTime] = useState(currentRule?.time || '09:00');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(currentRule?.weekdays || [1]); // 默认周一
  const [endDate, setEndDate] = useState(currentRule?.endDate || '');

  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const inputBgColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const borderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';

  const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];

  const toggleWeekday = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      // 至少保留一个
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, day].sort());
    }
  };

  const handleSave = () => {
    if (recurrenceType === 'once') {
      onSave(null); // 不重复
    } else {
      const rule: RecurrenceRule = {
        type: recurrenceType,
        time,
        weekdays: recurrenceType === 'weekly' ? selectedWeekdays : undefined,
        endDate: endDate || undefined,
      };
      onSave(rule);
    }
    onClose();
  };

  const handleMoveToTomorrow = () => {
    onMoveToTomorrow();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* 头部 */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: isDark ? '#3B82F6' : '#3B82F6' }}
        >
          <div className="flex items-center gap-3">
            <Repeat className="w-6 h-6 text-white" />
            <h3 className="text-lg font-bold text-white">任务重复设置</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 任务标题 */}
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: inputBgColor }}
          >
            <p className="text-sm mb-1" style={{ color: secondaryColor }}>任务</p>
            <p className="font-medium" style={{ color: textColor }}>{taskTitle}</p>
          </div>

          {/* 重复类型 */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: textColor }}>
              重复频率
            </label>
            <div className="space-y-2">
              {[
                { value: 'once', label: '只有一次（不重复）', icon: '📅' },
                { value: 'daily', label: '每天一次', icon: '🔄' },
                { value: 'weekly', label: '每周重复', icon: '📆' },
                { value: 'monthly', label: '每月一次', icon: '🗓️' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setRecurrenceType(option.value as RecurrenceType)}
                  className="w-full p-3 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: recurrenceType === option.value ? '#3B82F6' : inputBgColor,
                    color: recurrenceType === option.value ? '#ffffff' : textColor,
                    border: `2px solid ${recurrenceType === option.value ? '#3B82F6' : 'transparent'}`,
                  }}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 时间设置（非"只有一次"时显示） */}
          {recurrenceType !== 'once' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                <Clock className="w-4 h-4 inline mr-1" />
                重复时间
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{
                  backgroundColor: inputBgColor,
                  borderColor: borderColor,
                  color: textColor,
                }}
              />
            </div>
          )}

          {/* 每周选择星期几 */}
          {recurrenceType === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                选择星期几（可多选）
              </label>
              <div className="grid grid-cols-7 gap-2">
                {weekdayNames.map((name, index) => (
                  <button
                    key={index}
                    onClick={() => toggleWeekday(index)}
                    className="aspect-square rounded-lg font-bold transition-all"
                    style={{
                      backgroundColor: selectedWeekdays.includes(index) ? '#3B82F6' : inputBgColor,
                      color: selectedWeekdays.includes(index) ? '#ffffff' : textColor,
                      border: `2px solid ${selectedWeekdays.includes(index) ? '#3B82F6' : 'transparent'}`,
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: secondaryColor }}>
                已选择：{selectedWeekdays.map(d => `周${weekdayNames[d]}`).join('、')}
              </p>
            </div>
          )}

          {/* 结束日期（非"只有一次"时显示） */}
          {recurrenceType !== 'once' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                <Calendar className="w-4 h-4 inline mr-1" />
                结束日期（可选）
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{
                  backgroundColor: inputBgColor,
                  borderColor: borderColor,
                  color: textColor,
                }}
              />
              <p className="text-xs mt-1" style={{ color: secondaryColor }}>
                留空表示永久重复
              </p>
            </div>
          )}

          {/* 移动到明天按钮 */}
          <div
            className="p-4 rounded-lg border-2 border-dashed"
            style={{ borderColor: borderColor }}
          >
            <p className="text-sm mb-2" style={{ color: secondaryColor }}>
              快捷操作
            </p>
            <button
              onClick={handleMoveToTomorrow}
              className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: '#10B981',
                color: '#ffffff',
              }}
            >
              📅 移动到明天
            </button>
          </div>
        </div>

        {/* 底部按钮 */}
        <div
          className="px-6 py-4 flex gap-3 border-t"
          style={{ borderColor: borderColor }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: inputBgColor,
              color: textColor,
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 rounded-lg font-bold transition-colors"
            style={{
              backgroundColor: '#3B82F6',
              color: '#ffffff',
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

