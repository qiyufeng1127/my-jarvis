import { useMemoryStore } from '@/stores/memoryStore';
import { useEffect, useState } from 'react';

interface MoodWeeklyCardProps {
  colorScheme?: string[];
}

type TimeRange = 'today' | 'weekly' | 'monthly';

// 每天固定的心情表情（7种不同的情绪）
const WEEKDAY_EMOJIS = ['😊', '😎', '😡', '😰', '😐', '🤔', '😄'];
const WEEKDAY_NAMES = ['开心', '自信', '愤怒', '焦虑', '平淡', '思考', '兴奋'];

// 心情颜色（使用用户提供的配色）
const MOOD_COLORS = ['#D1CBBA', '#6D9978', '#E8C259', '#DD617C', '#AC0327', '#6D9978', '#E8C259'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MoodWeeklyCard({ colorScheme }: MoodWeeklyCardProps) {
  const { journals } = useMemoryStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [weeklyData, setWeeklyData] = useState<Array<{ day: number; mood: number; count: number; label: string }>>([]);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    calculateMoodData();
  }, [journals, timeRange]);

  const calculateMoodData = () => {
    const today = new Date();
    const data: Array<{ day: number; mood: number; count: number; label: string }> = [];

    const hasRealData = journals.length > 0;

    if (!hasRealData) {
      // 预览数据 - 根据时间范围展示不同数据
      if (timeRange === 'today') {
        // 今天的数据 - 显示7种心情的时长
        const previewData = [
          { day: 0, mood: 80, count: 1, label: WEEKDAY_NAMES[0] },   // 开心 80%
          { day: 1, mood: 60, count: 2, label: WEEKDAY_NAMES[1] },   // 自信 60%
          { day: 2, mood: 20, count: 3, label: WEEKDAY_NAMES[2] },   // 愤怒 20%
          { day: 3, mood: 30, count: 2, label: WEEKDAY_NAMES[3] },   // 焦虑 30%
          { day: 4, mood: 50, count: 4, label: WEEKDAY_NAMES[4] },   // 平淡 50%
          { day: 5, mood: 70, count: 2, label: WEEKDAY_NAMES[5] },   // 思考 70%
          { day: 6, mood: 90, count: 3, label: WEEKDAY_NAMES[6] },   // 兴奋 90%
        ];
        setWeeklyData(previewData);
      } else if (timeRange === 'weekly') {
        // 本周数据 - 显示7天
        const previewData = [
          { day: 0, mood: 60, count: 1, label: WEEKDAYS[0] },
          { day: 1, mood: 80, count: 2, label: WEEKDAYS[1] },
          { day: 2, mood: 90, count: 3, label: WEEKDAYS[2] },
          { day: 3, mood: 100, count: 2, label: WEEKDAYS[3] },
          { day: 4, mood: 70, count: 4, label: WEEKDAYS[4] },
          { day: 5, mood: 85, count: 2, label: WEEKDAYS[5] },
          { day: 6, mood: 95, count: 3, label: WEEKDAYS[6] },
        ];
        setWeeklyData(previewData);
      } else {
        // 本月数据 - 显示4周
        const previewData = [
          { day: 0, mood: 75, count: 7, label: '第1周' },
          { day: 1, mood: 85, count: 8, label: '第2周' },
          { day: 2, mood: 80, count: 6, label: '第3周' },
          { day: 3, mood: 90, count: 9, label: '第4周' },
          { day: 4, mood: 0, count: 0, label: '' },
          { day: 5, mood: 0, count: 0, label: '' },
          { day: 6, mood: 0, count: 0, label: '' },
        ];
        setWeeklyData(previewData);
      }
      return;
    }

    // 真实数据计算
    if (timeRange === 'today') {
      // 今天的数据 - 按心情类型统计时长
      const todayJournals = journals.filter(j => {
        const journalDate = new Date(j.date);
        return journalDate.toDateString() === today.toDateString();
      });

      // 统计每种心情的出现次数（模拟时长）
      for (let i = 0; i < 7; i++) {
        const moodCount = todayJournals.filter(j => {
          // 这里可以根据日记内容判断心情类型
          // 暂时使用随机分配
          return Math.random() > 0.5;
        }).length;

        const moodPercent = todayJournals.length > 0 
          ? Math.min(100, (moodCount / todayJournals.length) * 100 * 7)
          : 0;

        data.push({
          day: i,
          mood: moodPercent,
          count: moodCount,
          label: WEEKDAY_NAMES[i],
        });
      }
    } else if (timeRange === 'weekly') {
      // 本周数据
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);

        const dayJournals = journals.filter(j => {
          const journalDate = new Date(j.date);
          return journalDate.toDateString() === currentDay.toDateString();
        });

        let moodPercent = 50;
        if (dayJournals.length > 0) {
          const successCount = dayJournals.filter(j => j.type === 'success').length;
          const gratitudeCount = dayJournals.filter(j => j.type === 'gratitude').length;
          
          const totalCount = successCount + gratitudeCount;
          if (totalCount >= 4) moodPercent = 100;
          else if (totalCount === 3) moodPercent = 85;
          else if (totalCount === 2) moodPercent = 70;
          else if (totalCount === 1) moodPercent = 55;
          
          if (successCount >= 2) moodPercent = Math.min(100, moodPercent + 15);
        }

        data.push({
          day: i,
          mood: moodPercent,
          count: dayJournals.length,
          label: WEEKDAYS[i],
        });
      }
    } else {
      // 本月数据 - 按周统计
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const weeksInMonth = Math.ceil((today.getDate() + startOfMonth.getDay()) / 7);

      for (let i = 0; i < Math.min(7, weeksInMonth); i++) {
        const weekStart = new Date(startOfMonth);
        weekStart.setDate(1 + i * 7 - startOfMonth.getDay());
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekJournals = journals.filter(j => {
          const journalDate = new Date(j.date);
          return journalDate >= weekStart && journalDate <= weekEnd;
        });

        let moodPercent = 50;
        if (weekJournals.length > 0) {
          const successCount = weekJournals.filter(j => j.type === 'success').length;
          const gratitudeCount = weekJournals.filter(j => j.type === 'gratitude').length;
          
          const totalCount = successCount + gratitudeCount;
          moodPercent = Math.min(100, (totalCount / weekJournals.length) * 100);
        }

        data.push({
          day: i,
          mood: moodPercent,
          count: weekJournals.length,
          label: `第${i + 1}周`,
        });
      }

      // 填充空白
      while (data.length < 7) {
        data.push({
          day: data.length,
          mood: 0,
          count: 0,
          label: '',
        });
      }
    }

    setWeeklyData(data);
  };

  const avgMood = weeklyData.length > 0
    ? (weeklyData.reduce((sum, d) => sum + d.mood, 0) / weeklyData.length).toFixed(0)
    : '0';

  const isPreviewMode = journals.length === 0;

  return (
    <div 
      className="rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="p-5">
        {/* 头部 - 时间范围切换 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
                timeRange === 'today' 
                  ? 'bg-[#DD617C] text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
                timeRange === 'weekly' 
                  ? 'bg-[#6D9978] text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
                timeRange === 'monthly' 
                  ? 'bg-[#E8C259] text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Monthly
            </button>
          </div>
          <div className="flex gap-2">
            <button className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">
              ↓
            </button>
            <button className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs">
              ✕
            </button>
          </div>
        </div>

        {/* 心情柱状图 - iOS风格，像容器一样填充 */}
        <div className="mb-4">
          <div className="flex items-end justify-center gap-2 h-60">
            {weeklyData.map((data, index) => {
              const heightPercent = data.mood;
              const containerHeight = 210; // 固定容器高度（稍微增加）
              const fillHeight = (containerHeight * heightPercent) / 100;
              const isHovered = hoveredDay === index;
              const isToday = new Date().getDay() === data.day;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center"
                  onMouseEnter={() => setHoveredDay(index)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{ width: '40px' }}
                >
                  {/* 容器 - 固定高度 */}
                  <div
                    className="rounded-[20px] transition-all duration-300 relative overflow-hidden"
                    style={{
                      width: '40px',
                      height: containerHeight,
                      backgroundColor: `${MOOD_COLORS[index]}20`, // 20%透明度作为容器背景
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isHovered ? `0 4px 12px ${MOOD_COLORS[index]}60` : '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* 填充部分 - 从底部往上填充 */}
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-[20px] transition-all duration-500 flex flex-col items-center justify-start pt-2"
                      style={{
                        height: fillHeight,
                        backgroundColor: MOOD_COLORS[index],
                      }}
                    >
                      {/* 表情在填充部分的顶部 */}
                      <div
                        className="text-2xl transition-all duration-300"
                        style={{
                          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                        }}
                      >
                        {WEEKDAY_EMOJIS[index]}
                      </div>
                    </div>

                    {/* 悬浮提示 */}
                    {isHovered && (
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap z-10 bg-gray-900 text-white shadow-lg"
                      >
                        <div className="text-center">
                          <div className="font-bold">{WEEKDAY_NAMES[index]}</div>
                          <div className="text-gray-300 text-[10px]">
                            {isPreviewMode ? '示例数据' : `${data.count} 条记录`}
                          </div>
                          <div className="text-white text-[10px] mt-0.5">
                            {heightPercent}%
                          </div>
                        </div>
                        {/* 小三角 */}
                        <div
                          className="absolute top-full left-1/2 transform -translate-x-1/2"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid #1f2937',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 标签 */}
                  <div
                    className="text-[11px] font-medium mt-3"
                    style={{
                      color: isToday ? '#DD617C' : '#6B7280',
                      fontWeight: isToday ? 'bold' : 'normal',
                    }}
                  >
                    {data.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">平均</div>
            <div className="text-xl font-bold text-gray-900">{avgMood}%</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">记录</div>
            <div className="text-xl font-bold text-gray-900">
              {isPreviewMode ? '17' : weeklyData.reduce((sum, d) => sum + d.count, 0)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">连续</div>
            <div className="text-xl font-bold text-gray-900">
              {isPreviewMode ? '7天' : `${weeklyData.filter(d => d.count > 0).length}天`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
