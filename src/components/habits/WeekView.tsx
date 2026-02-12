import { useMemo } from 'react';
import { useHabitCanStore } from '@/stores/habitCanStore';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { HABIT_CAN_COLORS, getTextColor, getCanColorByCount } from '@/styles/habitCanColors';

interface WeekViewProps {
  isDark: boolean;
  cardBg: string;
  textColor: string;
  accentColor: string;
}

export default function WeekView({
  isDark,
  cardBg,
  textColor,
  accentColor,
}: WeekViewProps) {
  const { getWeekViewData } = useHabitCanStore();
  
  const today = new Date().toISOString().split('T')[0];
  const weekData = useMemo(() => getWeekViewData(today), [today, getWeekViewData]);

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}
    >
      {/* 标题 */}
      <div className="flex items-center space-x-2">
        <BarChart3 size={20} style={{ color: HABIT_CAN_COLORS.terreCuite }} />
        <h3
          className="font-semibold"
          style={{
            fontSize: '18px',
            color: HABIT_CAN_COLORS.espresso,
            fontWeight: 600,
          }}
        >
          近7天坏习惯趋势
        </h3>
      </div>

      {/* 罐头网格 - 每行4天 */}
      <div className="grid grid-cols-4 gap-4">
        {weekData.map((day, index) => {
          const date = new Date(day.date);
          const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
          const isToday = day.date === today;
          const bgColor = getCanColorByCount(day.totalCount);
          const textColorForBg = getTextColor(bgColor);

          return (
            <div key={day.date} className="relative group">
              <div
                className="relative w-full aspect-square rounded-xl p-4 transition-all"
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
                    width: '36px',
                    height: '6px',
                    backgroundColor: textColorForBg,
                    opacity: 0.2,
                  }}
                />

                {/* 日期和星期 */}
                <div className="text-center mb-2">
                  <div
                    className="font-bold"
                    style={{
                      fontSize: '16px',
                      color: textColorForBg,
                      fontWeight: 600,
                    }}
                  >
                    {date.getDate()}日
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: textColorForBg,
                      opacity: 0.7,
                      fontWeight: 300,
                    }}
                  >
                    周{weekday}
                  </div>
                </div>

                {/* Emoji 显示 */}
                <div className="flex flex-wrap justify-center items-center gap-1 min-h-[56px]">
                  {day.totalCount === 0 ? (
                    <span style={{ fontSize: '28px', opacity: 0.3 }}>✨</span>
                  ) : day.totalCount <= 8 ? (
                    day.topHabits.map((habit, idx) => (
                      <span key={idx} style={{ fontSize: '20px' }}>
                        {habit.emoji}
                      </span>
                    ))
                  ) : (
                    <div className="text-center space-y-1">
                      {day.topHabits.slice(0, 4).map((habit, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center space-x-1"
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>{habit.emoji}</span>
                          <span style={{ color: textColorForBg }}>×{habit.count}</span>
                        </div>
                      ))}
                      {day.topHabits.length > 4 && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: textColorForBg,
                            opacity: 0.6,
                          }}
                        >
                          +{day.topHabits.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 总次数 */}
                {day.totalCount > 0 && (
                  <div
                    className="absolute bottom-2 right-2 font-bold"
                    style={{
                      fontSize: '14px',
                      color: textColorForBg,
                      opacity: 0.7,
                    }}
                  >
                    ×{day.totalCount}
                  </div>
                )}

                {/* 变化指示 */}
                {index > 0 && day.change !== 0 && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1">
                    {day.change > 0 ? (
                      <>
                        <TrendingUp size={14} style={{ color: HABIT_CAN_COLORS.terreCuite }} />
                        <span
                          className="font-bold"
                          style={{
                            fontSize: '11px',
                            color: HABIT_CAN_COLORS.terreCuite,
                          }}
                        >
                          +{day.change}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={14} style={{ color: HABIT_CAN_COLORS.bleuPorcelaine }} />
                        <span
                          className="font-bold"
                          style={{
                            fontSize: '11px',
                            color: HABIT_CAN_COLORS.bleuPorcelaine,
                          }}
                        >
                          {day.change}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 毛玻璃 Tooltip */}
              {day.totalCount > 0 && (
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
                    {day.date} 共 {day.totalCount} 次
                  </div>
                  <div className="space-y-0.5">
                    {day.topHabits.slice(0, 3).map((habit, idx) => (
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

      {/* 说明文字 */}
      <div
        className="text-center"
        style={{
          fontSize: '12px',
          color: HABIT_CAN_COLORS.eauTrouble,
          fontWeight: 300,
        }}
      >
        罐头颜色表示当日坏习惯次数，绿色↓表示减少，红色↑表示增加
      </div>
    </div>
  );
}
