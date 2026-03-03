import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemoryStore } from '@/stores/memoryStore';
import { useTaskStore } from '@/stores/taskStore';

interface DiaryCalendarProps {
  isDark?: boolean;
  bgColor?: string;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  diaryType: 'content' | 'emotion' | 'success';
}

// 日记系统配色 - 参考坏习惯组件
const DIARY_COLORS = {
  espresso: '#542916',
  eauTrouble: '#b79858',
  terreCuite: '#a13a1e',
  bleuPorcelaine: '#88b8ce',
  nuageDeLait: '#fefaf0',
  mielDore: '#f1c166',
  
  // 事件数量颜色
  eventColors: {
    none: '#88b8ce',      // 0个 - 浅蓝
    light: '#f1c166',     // 1-9个 - 蜜黄
    medium: '#b79858',    // 10-19个 - 金棕
    heavy: '#a13a1e',     // 20+个 - 砖红
  },
  
  glassmorphism: {
    light: 'rgba(254, 250, 240, 0.8)',
    accent: 'rgba(241, 193, 102, 0.6)',
  },
  
  shadows: {
    card: '0 2px 8px rgba(84, 41, 22, 0.15)',
    elevated: '0 4px 12px rgba(84, 41, 22, 0.08)',
  },
};

// 时间段对应的emoji
const TIME_EMOJIS = {
  morning: ['☀️', '🌅', '🌤️', '🌻', '🐣', '🥐', '☕'],
  afternoon: ['🌞', '🌈', '🌺', '🦋', '🍃', '🌸', '🌼'],
  evening: ['🌙', '⭐', '🌟', '✨', '🌃', '🌆', '🌇'],
  night: ['🌛', '💫', '🌠', '🦉', '🌌', '💤', '🛌'],
};

// 根据事件数量返回背景色
const getEventCountColor = (count: number) => {
  if (count === 0) return DIARY_COLORS.eventColors.none;
  if (count < 10) return DIARY_COLORS.eventColors.light;
  if (count < 20) return DIARY_COLORS.eventColors.medium;
  return DIARY_COLORS.eventColors.heavy;
};

// 根据背景色返回文字颜色
const getTextColor = (bgColor: string) => {
  const lightBgs = [DIARY_COLORS.bleuPorcelaine, DIARY_COLORS.nuageDeLait, DIARY_COLORS.mielDore];
  return lightBgs.includes(bgColor) ? DIARY_COLORS.espresso : DIARY_COLORS.nuageDeLait;
};

export default function DiaryCalendar({ 
  isDark = false, 
  bgColor = '#ffffff',
  onDateSelect,
  selectedDate,
  diaryType
}: DiaryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const { memories } = useMemoryStore();
  const { tasks } = useTaskStore();

  // 获取当月的所有日期
  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // 填充月初空白
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // 填充实际日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentMonth]);

  // 获取某天的事件和emoji
  const getDayData = (date: Date | null) => {
    if (!date) return { events: [], emojis: [], count: 0, color: 'transparent' };
    
    const dateStr = date.toDateString();
    
    // 获取所有事件
    const dayMemories = memories.filter(m => new Date(m.date).toDateString() === dateStr);
    const dayTasks = tasks.filter(t => new Date(t.startTime).toDateString() === dateStr);
    const allEvents = [...dayMemories, ...dayTasks];
    
    // 按时间排序
    const sortedEvents = allEvents.sort((a, b) => {
      const timeA = 'startTime' in a ? new Date(a.startTime).getTime() : new Date(a.date).getTime();
      const timeB = 'startTime' in b ? new Date(b.startTime).getTime() : new Date(b.date).getTime();
      return timeA - timeB;
    });
    
    // 为每个事件分配emoji
    const emojis = sortedEvents.slice(0, 8).map(event => {
      const eventTime = 'startTime' in event ? new Date(event.startTime) : new Date(event.date);
      const hour = eventTime.getHours();
      
      // 根据时间段选择emoji
      let emojiPool: string[];
      if (hour >= 5 && hour < 12) {
        emojiPool = TIME_EMOJIS.morning;
      } else if (hour >= 12 && hour < 17) {
        emojiPool = TIME_EMOJIS.afternoon;
      } else if (hour >= 17 && hour < 21) {
        emojiPool = TIME_EMOJIS.evening;
      } else {
        emojiPool = TIME_EMOJIS.night;
      }
      
      // 根据事件类型选择特定emoji
      if ('type' in event) {
        if (event.type === 'success') return '⭐';
        if (event.type === 'mood' && event.emotionTags.includes('happy')) return '😊';
        if (event.type === 'mood' && event.emotionTags.includes('anxious')) return '😰';
      }
      
      // 随机选择一个emoji
      return emojiPool[Math.floor(Math.random() * emojiPool.length)];
    });
    
    const count = allEvents.length;
    const color = getEventCountColor(count);
    
    return { events: sortedEvents, emojis, count, color };
  };

  // 上一月
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // 下一月
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 今天
  const goToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  return (
    <div 
      className="space-y-4" 
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}
    >
      {/* 顶部毛玻璃导航栏 */}
      <div
        className="sticky top-0 z-10 rounded-2xl p-4"
        style={{
          backgroundColor: DIARY_COLORS.glassmorphism.light,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        {/* 月份切换 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg transition-transform active:scale-95"
              style={{ backgroundColor: DIARY_COLORS.nuageDeLait }}
            >
              <ChevronLeft size={20} style={{ color: DIARY_COLORS.espresso }} />
            </button>
            
            <div
              className="text-xl font-bold px-4"
              style={{ color: DIARY_COLORS.espresso, fontSize: '20px', fontWeight: 600 }}
            >
              {year}年{month}月
            </div>
            
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg transition-transform active:scale-95"
              style={{ backgroundColor: DIARY_COLORS.nuageDeLait }}
            >
              <ChevronRight size={20} style={{ color: DIARY_COLORS.espresso }} />
            </button>
          </div>

          {/* 今天按钮 */}
          <button
            onClick={goToday}
            className="px-4 py-2 rounded-lg transition-transform active:scale-95"
            style={{
              backgroundColor: DIARY_COLORS.espresso,
              color: DIARY_COLORS.nuageDeLait,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            📅 今天
          </button>
        </div>

        {/* 颜色图例 */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: DIARY_COLORS.glassmorphism.accent,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center justify-around">
            {[
              { color: DIARY_COLORS.eventColors.none, label: '0个' },
              { color: DIARY_COLORS.eventColors.light, label: '1-9个' },
              { color: DIARY_COLORS.eventColors.medium, label: '10-19个' },
              { color: DIARY_COLORS.eventColors.heavy, label: '20+个' },
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
                    fontSize: '10px',
                    color: DIARY_COLORS.eauTrouble,
                    fontWeight: 300,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-3">
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <div
            key={index}
            className="text-center py-2"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: DIARY_COLORS.espresso,
              opacity: 0.6,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 - iOS 风格 */}
      <div className="grid grid-cols-7 gap-3">
        {monthDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />;
          }

          const dayData = getDayData(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const bgColor = dayData.color;
          const textColorForBg = getTextColor(bgColor);
          const day = date.getDate();

          return (
            <div key={date.toISOString()} className="relative group">
              <button
                onClick={() => onDateSelect(date)}
                onMouseEnter={() => setHoveredDay(date.toDateString())}
                onMouseLeave={() => setHoveredDay(null)}
                className="relative w-full aspect-square rounded-xl p-3 transition-all active:scale-95"
                style={{
                  backgroundColor: bgColor,
                  boxShadow: isTodayDate
                    ? `0 0 0 2px ${DIARY_COLORS.espresso}`
                    : isSelectedDate
                      ? `0 0 0 2px ${DIARY_COLORS.terreCuite}`
                      : DIARY_COLORS.shadows.card,
                }}
              >
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
                  {dayData.count === 0 ? (
                    <span style={{ fontSize: '24px', opacity: 0.3 }}>✨</span>
                  ) : dayData.count <= 8 ? (
                    dayData.emojis.map((emoji, idx) => (
                      <span key={idx} style={{ fontSize: '16px' }}>
                        {emoji}
                      </span>
                    ))
                  ) : (
                    <div className="text-center">
                      <div className="flex flex-wrap justify-center gap-1 mb-1">
                        {dayData.emojis.slice(0, 6).map((emoji, idx) => (
                          <span key={idx} style={{ fontSize: '14px' }}>
                            {emoji}
                          </span>
                        ))}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: textColorForBg,
                          opacity: 0.6,
                        }}
                      >
                        +{dayData.count - 6}
                      </div>
                    </div>
                  )}
                </div>

                {/* 总次数标记 */}
                {dayData.count > 0 && dayData.count <= 8 && (
                  <div
                    className="absolute bottom-2 right-2 font-bold"
                    style={{
                      fontSize: '12px',
                      color: textColorForBg,
                      opacity: 0.6,
                    }}
                  >
                    ×{dayData.count}
                  </div>
                )}
              </button>

              {/* 毛玻璃 Tooltip */}
              {hoveredDay === date.toDateString() && dayData.count > 0 && (
                <div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap"
                  style={{
                    backgroundColor: DIARY_COLORS.glassmorphism.light,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: DIARY_COLORS.shadows.elevated,
                  }}
                >
                  <div
                    className="font-semibold"
                    style={{
                      fontSize: '12px',
                      color: DIARY_COLORS.espresso,
                    }}
                  >
                    共 {dayData.count} 条记录
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: DIARY_COLORS.glassmorphism.light,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        <div
          className="font-semibold mb-2"
          style={{
            fontSize: '14px',
            color: DIARY_COLORS.espresso,
          }}
        >
          ⏰ Emoji时间段
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: DIARY_COLORS.eauTrouble }}>
          <div>☀️ 早晨 (5-12点)</div>
          <div>🌞 下午 (12-17点)</div>
          <div>🌙 傍晚 (17-21点)</div>
          <div>🌛 夜晚 (21-5点)</div>
        </div>
      </div>
    </div>
  );
}
