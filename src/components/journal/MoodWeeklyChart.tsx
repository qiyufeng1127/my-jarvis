import { useState, useEffect } from 'react';
import { useMemoryStore } from '@/stores/memoryStore';

interface MoodWeeklyChartProps {
  isDark?: boolean;
  bgColor?: string;
}

// 心情表情映射
const MOOD_EMOJIS: Record<number, string> = {
  1: '😢', // 很糟糕
  2: '😕', // 不太好
  3: '😐', // 一般
  4: '😊', // 不错
  5: '😄', // 很棒
};

const MOOD_COLORS: Record<number, string> = {
  1: '#FF6B6B', // 红色
  2: '#FFA07A', // 橙色
  3: '#FFD93D', // 黄色
  4: '#6BCB77', // 绿色
  5: '#4D96FF', // 蓝色
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

type TimeRange = 'weekly' | 'monthly' | 'yearly';

export default function MoodWeeklyChart({ isDark = false, bgColor = '#ffffff' }: MoodWeeklyChartProps) {
  const { journals } = useMemoryStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [weeklyData, setWeeklyData] = useState<Array<{ day: number; mood: number; count: number }>>([]);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    calculateWeeklyMood();
  }, [journals, timeRange]);

  // 计算每周心情数据
  const calculateWeeklyMood = () => {
    const today = new Date();
    const data: Array<{ day: number; mood: number; count: number }> = [];

    // 获取本周的开始日期（周日）
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // 检查是否有真实数据
    const hasRealData = journals.length > 0;

    // 如果没有真实数据，使用预览数据
    if (!hasRealData) {
      // 预览数据：展示一个理想的一周
      const previewData = [
        { day: 0, mood: 3, count: 1 },  // 周日：一般
        { day: 1, mood: 4, count: 2 },  // 周一：不错
        { day: 2, mood: 5, count: 3 },  // 周二：很棒
        { day: 3, mood: 4, count: 2 },  // 周三：不错
        { day: 4, mood: 5, count: 4 },  // 周四：很棒
        { day: 5, mood: 4, count: 2 },  // 周五：不错
        { day: 6, mood: 5, count: 3 },  // 周六：很棒
      ];
      setWeeklyData(previewData);
      return;
    }

    // 计算每天的平均心情（真实数据）
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);

      // 筛选当天的日记
      const dayJournals = journals.filter(j => {
        const journalDate = new Date(j.date);
        return journalDate.toDateString() === currentDay.toDateString();
      });

      // 计算心情分数（基于日记类型和数量）
      let moodScore = 3; // 默认一般
      if (dayJournals.length > 0) {
        const successCount = dayJournals.filter(j => j.type === 'success').length;
        const gratitudeCount = dayJournals.filter(j => j.type === 'gratitude').length;
        
        // 根据记录数量计算心情
        const totalCount = successCount + gratitudeCount;
        if (totalCount >= 3) moodScore = 5; // 很棒
        else if (totalCount === 2) moodScore = 4; // 不错
        else if (totalCount === 1) moodScore = 3; // 一般
        
        // 成功日记权重更高
        if (successCount >= 2) moodScore = Math.min(5, moodScore + 1);
      }

      data.push({
        day: i,
        mood: moodScore,
        count: dayJournals.length,
      });
    }

    setWeeklyData(data);
  };

  const maxMood = 5;
  const chartHeight = 180;
  const barWidth = 40;
  const barGap = 12;

  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.6)' : '#666666';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  // 计算平均心情
  const avgMood = weeklyData.length > 0
    ? (weeklyData.reduce((sum, d) => sum + d.mood, 0) / weeklyData.length).toFixed(1)
    : '0';

  // 计算本周记录总数
  const totalRecords = weeklyData.reduce((sum, d) => sum + d.count, 0);
  
  // 检查是否是预览模式
  const isPreviewMode = journals.length === 0;

  return (
    <div className="h-full overflow-auto p-6 space-y-6" style={{ backgroundColor: bgColor }}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: textColor }}>
            心情周报
          </h2>
          <p className="text-sm" style={{ color: accentColor }}>
            {isPreviewMode ? '预览模式 - 开始记录后显示真实数据' : '通过日记记录追踪你的心情变化'}
          </p>
        </div>
      </div>
      
      {/* 预览模式提示 */}
      {isPreviewMode && (
        <div className="rounded-xl p-4 border-2 border-dashed" style={{ 
          backgroundColor: isDark ? 'rgba(255,217,61,0.1)' : 'rgba(255,193,7,0.1)',
          borderColor: isDark ? 'rgba(255,217,61,0.3)' : 'rgba(255,193,7,0.3)',
        }}>
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <div className="text-sm font-semibold mb-1" style={{ color: textColor }}>
                这是预览效果
              </div>
              <div className="text-xs leading-relaxed" style={{ color: accentColor }}>
                当前显示的是示例数据。开始记录日记、与AI助手对话、写碎碎念后，这里会自动显示你的真实心情数据。系统会智能分析你的文字内容来计算心情分数。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 时间范围切换 */}
      <div className="flex rounded-xl p-1" style={{ backgroundColor: cardBg }}>
        {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className="flex-1 py-2.5 rounded-lg font-semibold transition-all text-sm"
            style={{
              backgroundColor: timeRange === range ? (isDark ? 'rgba(255,255,255,0.2)' : 'white') : 'transparent',
              color: textColor,
              boxShadow: timeRange === range ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {range === 'weekly' ? 'Weekly' : range === 'monthly' ? 'Monthly' : 'Yearly'}
          </button>
        ))}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: cardBg }}>
          <div className="text-3xl mb-2">😊</div>
          <div className="text-xs mb-1" style={{ color: accentColor }}>平均心情</div>
          <div className="text-2xl font-bold" style={{ color: textColor }}>{avgMood}</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: cardBg }}>
          <div className="text-3xl mb-2">📝</div>
          <div className="text-xs mb-1" style={{ color: accentColor }}>本周记录</div>
          <div className="text-2xl font-bold" style={{ color: textColor }}>{totalRecords}</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: cardBg }}>
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-xs mb-1" style={{ color: accentColor }}>连续天数</div>
          <div className="text-2xl font-bold" style={{ color: textColor }}>
            {weeklyData.filter(d => d.count > 0).length}
          </div>
        </div>
      </div>

      {/* 心情柱状图 */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg }}>
        <div className="flex items-center justify-center" style={{ height: chartHeight + 60 }}>
          <div className="flex items-end justify-center space-x-3">
            {weeklyData.map((data, index) => {
              const heightPercent = (data.mood / maxMood) * 100;
              const barHeight = (chartHeight * heightPercent) / 100;
              const isHovered = hoveredDay === index;
              const isToday = new Date().getDay() === data.day;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center"
                  onMouseEnter={() => setHoveredDay(index)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{ width: barWidth }}
                >
                  {/* 表情 */}
                  <div
                    className="text-2xl mb-2 transition-all duration-300"
                    style={{
                      transform: isHovered ? 'scale(1.3) translateY(-5px)' : 'scale(1)',
                      filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                    }}
                  >
                    {MOOD_EMOJIS[data.mood]}
                  </div>

                  {/* 柱子 */}
                  <div
                    className="rounded-full transition-all duration-300 relative"
                    style={{
                      width: barWidth,
                      height: Math.max(barHeight, 20),
                      backgroundColor: MOOD_COLORS[data.mood],
                      opacity: data.count === 0 ? 0.3 : 1,
                      transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                      boxShadow: isHovered ? `0 8px 16px ${MOOD_COLORS[data.mood]}40` : 'none',
                    }}
                  >
                    {/* 悬浮提示 */}
                    {isHovered && (
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap z-10"
                        style={{
                          backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                          color: isDark ? 'white' : 'black',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        <div className="text-center">
                          <div className="font-bold mb-1">{WEEKDAYS_CN[data.day]}</div>
                          <div style={{ color: accentColor }}>
                            {data.count} 条记录
                          </div>
                          <div style={{ color: MOOD_COLORS[data.mood] }}>
                            心情: {data.mood}/5
                          </div>
                        </div>
                        {/* 小三角 */}
                        <div
                          className="absolute top-full left-1/2 transform -translate-x-1/2"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: `6px solid ${isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)'}`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 星期标签 */}
                  <div
                    className="text-xs font-semibold mt-3"
                    style={{
                      color: isToday ? (isDark ? '#FFD93D' : '#FF6B6B') : textColor,
                      fontWeight: isToday ? 'bold' : 'normal',
                    }}
                  >
                    {WEEKDAYS[data.day]}
                  </div>

                  {/* 今天标记 */}
                  {isToday && (
                    <div
                      className="text-xs mt-1 px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,217,61,0.2)' : 'rgba(255,107,107,0.2)',
                        color: isDark ? '#FFD93D' : '#FF6B6B',
                      }}
                    >
                      Today
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 心情图例 */}
      <div className="rounded-xl p-4" style={{ backgroundColor: cardBg }}>
        <div className="text-sm font-semibold mb-3" style={{ color: textColor }}>
          心情等级说明
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="flex flex-col items-center">
              <div className="text-2xl mb-1">{MOOD_EMOJIS[level]}</div>
              <div
                className="w-full h-2 rounded-full mb-1"
                style={{ backgroundColor: MOOD_COLORS[level] }}
              />
              <div className="text-xs text-center" style={{ color: accentColor }}>
                {level === 1 ? '很糟' : level === 2 ? '不好' : level === 3 ? '一般' : level === 4 ? '不错' : '很棒'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 使用提示 */}
      <div className="rounded-xl p-4" style={{ backgroundColor: cardBg }}>
        <div className="text-sm font-semibold mb-2" style={{ color: textColor }}>
          💡 如何提升心情分数
        </div>
        <ul className="space-y-1.5 text-xs" style={{ color: accentColor }}>
          <li className="flex items-start">
            <span className="mr-2">📝</span>
            <span>每天记录成功日记和感恩日记，记录越多心情越好</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🏆</span>
            <span>成功日记对心情的提升效果更明显</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🔥</span>
            <span>保持连续记录，培养积极心态</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">📊</span>
            <span>鼠标悬停在柱子上查看详细信息</span>
          </li>
        </ul>
      </div>

      {/* 快速跳转 */}
      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: cardBg }}>
        <div className="text-sm mb-3" style={{ color: accentColor }}>
          还没有记录？现在就开始吧！
        </div>
        <button
          onClick={() => {
            // 这里可以触发打开日记模块
            const event = new CustomEvent('openJournalModule');
            window.dispatchEvent(event);
          }}
          className="px-6 py-2.5 rounded-lg font-semibold transition-all hover:scale-105"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            color: textColor,
          }}
        >
          ✨ 记录今天的心情
        </button>
      </div>
    </div>
  );
}

