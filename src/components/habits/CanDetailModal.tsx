import { useHabitCanStore } from '@/stores/habitCanStore';
import { X, Trash2 } from 'lucide-react';
import { HABIT_CAN_COLORS } from '@/styles/habitCanColors';

interface CanDetailModalProps {
  date: string;
  isDark: boolean;
  cardBg: string;
  textColor: string;
  accentColor: string;
  onClose: () => void;
}

export default function CanDetailModal({
  date,
  isDark,
  cardBg,
  textColor,
  accentColor,
  onClose,
}: CanDetailModalProps) {
  const { getOccurrencesByDate, getHabitById, deleteOccurrence } = useHabitCanStore();
  
  const occurrences = getOccurrencesByDate(date);
  const totalCount = occurrences.reduce((sum, occ) => sum + occ.count, 0);

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  };

  const handleDelete = (habitId: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteOccurrence(habitId, date);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6"
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
            🏺 坏习惯罐头
          </h2>
          <div className="text-sm" style={{ color: '#666666' }}>
            {formatDate(date)}
          </div>
          <div className="text-lg font-semibold mt-2" style={{ color: HABIT_CAN_COLORS.terreCuite }}>
            当日坏习惯总次数: {totalCount}
          </div>
        </div>

        {/* 坏习惯列表 */}
        {occurrences.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#666666' }}>
            <div className="text-6xl mb-4">✨</div>
            <div className="text-lg">这一天没有坏习惯记录</div>
            <div className="text-sm mt-2">保持良好状态！</div>
          </div>
        ) : (
          <div className="space-y-4">
            {occurrences.map((occurrence) => {
              const habit = getHabitById(occurrence.habitId);
              if (!habit) return null;

              return (
                <div
                  key={occurrence.id}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  {/* 习惯标题 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{habit.emoji}</span>
                      <div>
                        <div className="font-semibold text-lg" style={{ color: '#000000' }}>
                          {habit.name}
                        </div>
                        <div className="text-sm" style={{ color: HABIT_CAN_COLORS.terreCuite }}>
                          发生 {occurrence.count} 次
                          {occurrence.isManual && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: '#666666' }}>
                              手动添加
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 删除按钮（仅手动添加的可删除） */}
                    {occurrence.isManual && (
                      <button
                        onClick={() => handleDelete(occurrence.habitId)}
                        className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'rgba(255,0,0,0.1)' }}
                      >
                        <Trash2 size={18} style={{ color: '#ff4444' }} />
                      </button>
                    )}
                  </div>

                  {/* 详细记录 */}
                  <div className="space-y-2">
                    {occurrence.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 text-sm p-2 rounded-lg"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#000000',
                        }}
                      >
                        <span className="font-mono" style={{ color: '#666666' }}>{detail.time}</span>
                        <span className="flex-1">{detail.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-6 text-xs text-center" style={{ color: '#999999' }}>
          自动统计的坏习惯不可删除，手动添加的可以删除
        </div>
      </div>
    </div>
  );
}

