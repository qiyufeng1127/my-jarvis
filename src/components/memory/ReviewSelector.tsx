import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface ReviewSelectorProps {
  selectedDate: Date;
  timeRange: 'day' | 'week' | 'month' | 'custom';
  onTimeRangeChange: (range: 'day' | 'week' | 'month' | 'custom') => void;
  onDateChange: (date: Date) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomRangeChange?: (start: Date, end: Date) => void;
}

export default function ReviewSelector({
  selectedDate,
  timeRange,
  onTimeRangeChange,
  onDateChange,
  customStartDate,
  customEndDate,
  onCustomRangeChange,
}: ReviewSelectorProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const DIARY_COLORS = {
    espresso: '#542916',
    eauTrouble: '#b79858',
    nuageDeLait: '#fefaf0',
    mielDore: '#f1c166',
  };

  return (
    <div className="space-y-3">
      {/* 时间范围选择 */}
      <div className="flex items-center space-x-2">
        <Calendar className="w-5 h-5" style={{ color: DIARY_COLORS.eauTrouble }} />
        <div className="flex space-x-2 flex-1">
          <button
            onClick={() => onTimeRangeChange('day')}
            className="flex-1 px-3 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: timeRange === 'day' ? DIARY_COLORS.espresso : 'transparent',
              color: timeRange === 'day' ? DIARY_COLORS.nuageDeLait : DIARY_COLORS.espresso,
              border: `1px solid ${DIARY_COLORS.eauTrouble}`,
            }}
          >
            日记
          </button>
          <button
            onClick={() => onTimeRangeChange('week')}
            className="flex-1 px-3 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: timeRange === 'week' ? DIARY_COLORS.espresso : 'transparent',
              color: timeRange === 'week' ? DIARY_COLORS.nuageDeLait : DIARY_COLORS.espresso,
              border: `1px solid ${DIARY_COLORS.eauTrouble}`,
            }}
          >
            周复盘
          </button>
          <button
            onClick={() => onTimeRangeChange('month')}
            className="flex-1 px-3 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: timeRange === 'month' ? DIARY_COLORS.espresso : 'transparent',
              color: timeRange === 'month' ? DIARY_COLORS.nuageDeLait : DIARY_COLORS.espresso,
              border: `1px solid ${DIARY_COLORS.eauTrouble}`,
            }}
          >
            月复盘
          </button>
          <button
            onClick={() => {
              onTimeRangeChange('custom');
              setShowCustomPicker(true);
            }}
            className="flex-1 px-3 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: timeRange === 'custom' ? DIARY_COLORS.espresso : 'transparent',
              color: timeRange === 'custom' ? DIARY_COLORS.nuageDeLait : DIARY_COLORS.espresso,
              border: `1px solid ${DIARY_COLORS.eauTrouble}`,
            }}
          >
            自定义
          </button>
        </div>
      </div>

      {/* 自定义时间范围选择器 */}
      {timeRange === 'custom' && showCustomPicker && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: DIARY_COLORS.nuageDeLait }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: DIARY_COLORS.espresso }}>
                开始日期
              </label>
              <input
                type="date"
                value={customStartDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const start = new Date(e.target.value);
                  if (customEndDate && onCustomRangeChange) {
                    onCustomRangeChange(start, customEndDate);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: DIARY_COLORS.eauTrouble }}
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: DIARY_COLORS.espresso }}>
                结束日期
              </label>
              <input
                type="date"
                value={customEndDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const end = new Date(e.target.value);
                  if (customStartDate && onCustomRangeChange) {
                    onCustomRangeChange(customStartDate, end);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: DIARY_COLORS.eauTrouble }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 时间范围说明 */}
      <div className="text-xs" style={{ color: DIARY_COLORS.eauTrouble }}>
        {timeRange === 'day' && '📅 查看单日的详细记录和深度分析'}
        {timeRange === 'week' && '📊 回顾本周的整体表现，识别模式和趋势'}
        {timeRange === 'month' && '📈 总结本月的成长轨迹，发现深层规律'}
        {timeRange === 'custom' && '🔍 自定义时间段，进行针对性复盘'}
      </div>
    </div>
  );
}

