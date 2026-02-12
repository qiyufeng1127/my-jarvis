import { useMemo } from 'react';
import { useHabitCanStore } from '@/stores/habitCanStore';
import { TrendingUp } from 'lucide-react';

interface TrendViewProps {
  isDark: boolean;
  cardBg: string;
  textColor: string;
  accentColor: string;
}

export default function TrendView({
  isDark,
  cardBg,
  textColor,
  accentColor,
}: TrendViewProps) {
  const { getTrendData } = useHabitCanStore();
  
  const trendData = useMemo(() => getTrendData(30), [getTrendData]);
  
  const maxCount = Math.max(...trendData.map((d) => d.totalCount), 1);
  
  // 收集所有出现过的习惯
  const allHabits = useMemo(() => {
    const habitMap = new Map<string, { name: string; emoji: string; color: string }>();
    trendData.forEach((day) => {
      day.habitCounts.forEach((habit) => {
        if (!habitMap.has(habit.habitId)) {
          habitMap.set(habit.habitId, {
            name: habit.habitName,
            emoji: habit.emoji,
            color: habit.color,
          });
        }
      });
    });
    return Array.from(habitMap.entries()).map(([id, data]) => ({ id, ...data }));
  }, [trendData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp size={20} style={{ color: accentColor }} />
        <h3 className="text-lg font-semibold" style={{ color: textColor }}>
          近30天坏习惯趋势
        </h3>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-3 mb-4">
        {allHabits.map((habit) => (
          <div key={habit.id} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: habit.color }}
            />
            <span className="text-sm" style={{ color: textColor }}>
              {habit.emoji} {habit.name}
            </span>
          </div>
        ))}
      </div>

      {/* 折线图区域 */}
      <div className="relative h-64 rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        {/* Y轴刻度 */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs" style={{ color: textColor, opacity: 0.6 }}>
          <span>{maxCount}</span>
          <span>{Math.floor(maxCount * 0.75)}</span>
          <span>{Math.floor(maxCount * 0.5)}</span>
          <span>{Math.floor(maxCount * 0.25)}</span>
          <span>0</span>
        </div>

        {/* 图表区域 */}
        <div className="ml-10 h-full relative">
          {/* 网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <div
              key={ratio}
              className="absolute left-0 right-0 border-t"
              style={{
                bottom: `${ratio * 100}%`,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}
            />
          ))}

          {/* 折线图 */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {allHabits.map((habit) => {
              const points = trendData.map((day, index) => {
                const habitData = day.habitCounts.find((h) => h.habitId === habit.id);
                const count = habitData?.count || 0;
                const x = (index / (trendData.length - 1)) * 100;
                const y = 100 - (count / maxCount) * 100;
                return `${x},${y}`;
              }).join(' ');

              return (
                <polyline
                  key={habit.id}
                  points={points}
                  fill="none"
                  stroke={habit.color}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {/* 数据点 */}
          {trendData.map((day, index) => {
            const x = (index / (trendData.length - 1)) * 100;
            return (
              <div
                key={day.date}
                className="absolute group"
                style={{
                  left: `${x}%`,
                  bottom: 0,
                  transform: 'translateX(-50%)',
                  height: '100%',
                }}
              >
                {/* 悬停显示详情 */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap"
                  style={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  }}
                >
                  <div className="text-xs font-semibold mb-1" style={{ color: textColor }}>
                    {day.date}
                  </div>
                  <div className="space-y-0.5">
                    {day.habitCounts.map((habit) => (
                      <div key={habit.habitId} className="text-xs flex items-center space-x-1" style={{ color: textColor }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color }} />
                        <span>{habit.emoji} {habit.habitName}</span>
                        <span className="font-semibold">×{habit.count}</span>
                      </div>
                    ))}
                    <div className="text-xs font-semibold pt-1 border-t" style={{ color: textColor, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
                      总计: {day.totalCount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X轴日期标签（每5天显示一次） */}
        <div className="ml-10 mt-2 flex justify-between text-xs" style={{ color: textColor, opacity: 0.6 }}>
          {trendData.filter((_, index) => index % 5 === 0).map((day) => (
            <span key={day.date}>
              {new Date(day.date).getDate()}日
            </span>
          ))}
        </div>
      </div>

      {/* 说明 */}
      <div className="text-xs text-center" style={{ color: textColor, opacity: 0.6 }}>
        不同颜色的折线代表不同坏习惯，鼠标悬停查看详细数据
      </div>
    </div>
  );
}

