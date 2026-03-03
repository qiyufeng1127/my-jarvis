import { useState, useMemo } from 'react';
import { useHabitCanStore } from '@/stores/habitCanStore';
import { ChevronLeft, ChevronRight, Settings, Plus } from 'lucide-react';
import { HABIT_CAN_COLORS, getTextColor, getCanColorByCount } from '@/styles/habitCanColors';

interface HabitCanCalendarProps {
  isDark: boolean;
  cardBg: string;
  textColor: string;
  accentColor: string;
  onOpenSettings: () => void;
  onOpenCustomize: () => void;
  onOpenCanDetail: (date: string) => void;
}

export default function HabitCanCalendar({
  isDark,
  cardBg,
  textColor,
  accentColor,
  onOpenSettings,
  onOpenCustomize,
  onOpenCanDetail,
}: HabitCanCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const { getMonthCanData, getMostFrequentHabit } = useHabitCanStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 获取当月罐头数据
  const canDataList = useMemo(() => {
    return getMonthCanData(year, month);
  }, [year, month, getMonthCanData]);

  // 计算当月统计
  const monthStats = useMemo(() => {
    const totalCount = canDataList.reduce((sum, can) => sum + can.totalCount, 0);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(canDataList.length).padStart(2, '0')}`;
    const mostFrequent = getMostFrequentHabit(startDate, endDate);
    
    return { totalCount, mostFrequent };
  }, [canDataList, year, month, getMostFrequentHabit]);

  // 切换月份
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  // 获取星期几
  const getWeekday = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDay();
  };

  // 生成日历网格（包含空白占位）
  const calendarGrid = useMemo(() => {
    const firstDayWeekday = getWeekday(canDataList[0]?.date || '');
    const emptySlots = Array(firstDayWeekday).fill(null);
    return [...emptySlots, ...canDataList];
  }, [canDataList]);

  return (
    <div className="space-y-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
      {/* 顶部导航栏 - 现代iOS风格 */}
      <div
        className="sticky top-0 z-10 rounded-2xl p-4"
        style={{
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(242, 242, 247, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* 月份切换 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-xl transition-all active:scale-95"
              style={{ 
                backgroundColor: isDark ? 'rgba(58, 58, 60, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(60, 60, 67, 0.8)'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <div
              className="text-xl font-bold px-4"
              style={{ 
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(60, 60, 67, 0.9)', 
                fontSize: '20px', 
                fontWeight: 600 
              }}
            >
              {year}年{month}月
            </div>
            
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-xl transition-all active:scale-95"
              style={{ 
                backgroundColor: isDark ? 'rgba(58, 58, 60, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(60, 60, 67, 0.8)'
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 右侧按钮 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCustomize}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: '#007AFF',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 500,
                minHeight: '40px',
              }}
            >
              <Plus size={16} />
              <span>自定义</span>
            </button>
            
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: isDark ? 'rgba(58, 58, 60, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(60, 60, 67, 0.8)',
                minWidth: '40px',
                minHeight: '40px',
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: isDark ? 'rgba(58, 58, 60, 0.3)' : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div
                className="font-bold mb-1"
                style={{ 
                  fontSize: '24px', 
                  color: '#007AFF'
                }}
              >
                {monthStats.totalCount}
              </div>
              <div
                style={{ 
                  fontSize: '13px', 
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                  fontWeight: 400 
                }}
              >
                本月坏习惯
              </div>
            </div>
            {monthStats.mostFrequent && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span style={{ fontSize: '24px' }}>{monthStats.mostFrequent.habit.emoji}</span>
                  <span
                    className="font-bold"
                    style={{ fontSize: '24px', color: '#007AFF' }}
                  >
                    ×{monthStats.mostFrequent.count}
                  </span>
                </div>
                <div
                  style={{ 
                    fontSize: '13px', 
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                    fontWeight: 400 
                  }}
                >
                  最频发
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 颜色图例 */}
      <div className="flex items-center justify-center space-x-4 py-3">
        {[
          { color: isDark ? 'rgba(58, 58, 60, 0.5)' : 'rgba(242, 242, 247, 1)', label: '0个' },
          { color: 'rgba(52, 199, 89, 0.3)', label: '1-10个' },
          { color: 'rgba(255, 149, 0, 0.4)', label: '11-20个' },
          { color: 'rgba(255, 59, 48, 0.5)', label: '20+个' },
        ].map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="rounded"
              style={{
                width: '24px',
                height: '8px',
                backgroundColor: item.color,
              }}
            />
            <span
              style={{
                fontSize: '11px',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                fontWeight: 400,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-4 gap-3">
        {['日', '一', '二', '三'].map((day, index) => (
          <div
            key={index}
            className="text-center py-2"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(60, 60, 67, 0.5)',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 罐头日历网格 - iOS 风格 */}
      <div className="grid grid-cols-4 gap-3">
        {calendarGrid.map((canData, index) => {
          if (!canData) {
            return <div key={`empty-${index}`} />;
          }

          const day = parseInt(canData.date.split('-')[2]);
          const isToday = canData.date === new Date().toISOString().split('T')[0];
          const bgColor = getCanColorByCount(canData.totalCount);
          const textColorForBg = getTextColor(bgColor);
          
          const sortedHabits = [...canData.habits].sort((a, b) => b.count - a.count);

          return (
            <div key={canData.date} className="relative group">
              <button
                onClick={() => onOpenCanDetail(canData.date)}
                onMouseEnter={() => setHoveredDay(canData.date)}
                onMouseLeave={() => setHoveredDay(null)}
                className="relative w-full aspect-square rounded-xl p-3 transition-all active:scale-95"
                style={{
                  backgroundColor: bgColor,
                  boxShadow: isToday
                    ? `0 0 0 2px ${HABIT_CAN_COLORS.espresso}`
                    : HABIT_CAN_COLORS.shadows.card,
                }}
              >
                {/* 罐头盖装饰 */}
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: '32px',
                    height: '6px',
                    backgroundColor: textColorForBg,
                    opacity: 0.2,
                  }}
                />

                {/* 日期 */}
                <div
                  className="font-medium mb-2"
                  style={{
                    fontSize: '14px',
                    color: textColorForBg,
                    fontWeight: 500,
                  }}
                >
                  {day}
                </div>

                {/* Emoji 显示 */}
                <div className="flex flex-wrap justify-center items-center gap-1 min-h-[48px]">
                  {canData.totalCount === 0 ? (
                    <span style={{ fontSize: '24px', opacity: 0.3 }}>✨</span>
                  ) : canData.totalCount <= 8 ? (
                    sortedHabits.map((habit, idx) => (
                      <span key={idx} style={{ fontSize: '18px' }}>
                        {habit.emoji}
                      </span>
                    ))
                  ) : (
                    <div className="text-center space-y-1">
                      {sortedHabits.slice(0, 3).map((habit, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center space-x-1"
                          style={{ fontSize: '12px', fontWeight: 600 }}
                        >
                          <span style={{ fontSize: '16px' }}>{habit.emoji}</span>
                          <span style={{ color: textColorForBg }}>×{habit.count}</span>
                        </div>
                      ))}
                      {sortedHabits.length > 3 && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: textColorForBg,
                            opacity: 0.6,
                          }}
                        >
                          +{sortedHabits.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 总次数标记 */}
                {canData.totalCount > 0 && canData.totalCount <= 8 && (
                  <div
                    className="absolute bottom-2 right-2 font-bold"
                    style={{
                      fontSize: '12px',
                      color: textColorForBg,
                      opacity: 0.6,
                    }}
                  >
                    ×{canData.totalCount}
                  </div>
                )}
              </button>

              {/* 毛玻璃 Tooltip */}
              {hoveredDay === canData.date && canData.totalCount > 0 && (
                <div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap"
                  style={{
                    backgroundColor: HABIT_CAN_COLORS.glassmorphism.light,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: HABIT_CAN_COLORS.shadows.elevated,
                  }}
                >
                  <div
                    className="font-semibold mb-1"
                    style={{
                      fontSize: '12px',
                      color: HABIT_CAN_COLORS.espresso,
                    }}
                  >
                    {canData.date} 共 {canData.totalCount} 次
                  </div>
                  <div className="space-y-0.5">
                    {sortedHabits.slice(0, 3).map((habit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-1"
                        style={{
                          fontSize: '11px',
                          color: HABIT_CAN_COLORS.espresso,
                        }}
                      >
                        <span>{habit.emoji}</span>
                        <span>{habit.habitName}</span>
                        <span className="font-semibold">×{habit.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部今日预览 */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(242, 242, 247, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className="font-semibold"
            style={{
              fontSize: '15px',
              color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(60, 60, 67, 0.9)',
            }}
          >
            📅 今日预览
          </div>
          <button
            onClick={() => onOpenCanDetail(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-lg transition-all active:scale-95"
            style={{
              backgroundColor: '#007AFF',
              fontSize: '13px',
              color: '#FFFFFF',
              fontWeight: 500,
            }}
          >
            查看详情
          </button>
        </div>
        
        {(() => {
          const todayData = canDataList.find((can) => {
            const today = new Date().toISOString().split('T')[0];
            return can.date === today;
          });

          if (!todayData || todayData.totalCount === 0) {
            return (
              <div
                className="text-center py-4"
                style={{
                  fontSize: '14px',
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                  fontWeight: 400,
                }}
              >
                今天还没有坏习惯记录 ✨
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center space-x-4">
              {todayData.habits.map((habit, idx) => (
                <div key={idx} className="flex items-center space-x-1">
                  <span style={{ fontSize: '24px' }}>{habit.emoji}</span>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: '16px',
                      color: '#007AFF',
                    }}
                  >
                    ×{habit.count}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
