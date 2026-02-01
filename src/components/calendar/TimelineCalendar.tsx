import { useState, useRef, useEffect } from 'react';
import { 
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon
} from 'lucide-react';
import type { Task } from '@/types';
import NewTimelineView from './NewTimelineView';

interface TimelineCalendarProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  bgColor?: string; // 背景颜色
  moduleSize?: { width: number; height: number }; // 新增：模块尺寸
}

export default function TimelineCalendar({
  tasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  bgColor = '#ffffff',
  moduleSize, // 接收模块尺寸
}: TimelineCalendarProps) {
  // 检测是否为移动设备
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 手机版默认周视图，电脑版默认月视图
  const [calendarView, setCalendarView] = useState<'week' | 'month'>(isMobile ? 'week' : 'month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // 当设备类型改变时更新视图
  useEffect(() => {
    if (isMobile) {
      setCalendarView('week');
    }
  }, [isMobile]);

  // 判断颜色是否为深色
  const isColorDark = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const isDark = isColorDark(bgColor);
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  // 任务类别颜色
  const categoryColors: Record<string, string> = {
    work: '#C85A7C',
    study: '#C85A7C',
    health: '#6BA56D',
    life: '#8B1538',
    social: '#C85A7C',
    finance: '#8B1538',
    creative: '#C85A7C',
    rest: '#6BA56D',
    other: '#C85A7C',
  };

  // 生成月视图日历数据
  const generateMonthCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayTasks = tasks.filter(task => {
        if (!task.scheduledStart) return false;
        const taskDate = new Date(task.scheduledStart);
        return (
          taskDate.getFullYear() === current.getFullYear() &&
          taskDate.getMonth() === current.getMonth() &&
          taskDate.getDate() === current.getDate()
        );
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        isSelected: current.toDateString() === selectedDate.toDateString(),
        tasks: dayTasks,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // 生成周视图日历数据
  const generateWeekCalendarDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(current.getDate() + i);
      
      const dayTasks = tasks.filter(task => {
        if (!task.scheduledStart) return false;
        const taskDate = new Date(task.scheduledStart);
        return (
          taskDate.getFullYear() === current.getFullYear() &&
          taskDate.getMonth() === current.getMonth() &&
          taskDate.getDate() === current.getDate()
        );
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: true,
        isToday: current.toDateString() === new Date().toDateString(),
        isSelected: current.toDateString() === selectedDate.toDateString(),
        tasks: dayTasks,
      });
    }
    
    return days;
  };

  const calendarDays = calendarView === 'month' ? generateMonthCalendarDays() : generateWeekCalendarDays();

  // 根据模块尺寸计算时间轴区域的高度
  const getTimelineHeight = () => {
    if (!moduleSize) return 600; // 默认高度
    
    // 减去顶部日历区域和底部工具栏的高度
    const calendarHeight = calendarView === 'week' ? 200 : 300; // 日历区域固定高度
    const toolbarsHeight = 150; // 顶部和底部工具栏高度
    
    // 时间轴应该占据至少70%的可用空间
    const availableHeight = moduleSize.height - calendarHeight - toolbarsHeight;
    return Math.max(500, availableHeight);
  };

  const timelineHeight = getTimelineHeight();

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: bgColor }}>
      {/* 上半部分：日历视图 */}
      <div className="flex-shrink-0" style={{ borderBottom: `2px solid ${borderColor}` }}>
        {/* 日历工具栏 - 手机版简化 */}
        <div className={`flex items-center justify-between ${isMobile ? 'px-3 py-2' : 'px-6 py-3'}`} style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                if (calendarView === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else {
                  newDate.setDate(newDate.getDate() - 7);
                }
                setSelectedDate(newDate);
              }}
              className={`${isMobile ? 'p-1' : 'p-2'} rounded-lg transition-colors`}
              style={{ backgroundColor: hoverBg }}
            >
              <ChevronLeft className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: textColor }} />
            </button>

            {/* 手机版：只显示简单日期 */}
            {isMobile ? (
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold" style={{ color: textColor }}>
                  {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </span>
                <span className="text-xs" style={{ color: accentColor }}>
                  {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][selectedDate.getDay()]}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" style={{ color: textColor }} />
                <h2 className="text-lg font-semibold" style={{ color: textColor }}>
                  {calendarView === 'month' 
                    ? selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
                    : `${selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })} 第${Math.ceil(selectedDate.getDate() / 7)}周`
                  }
                </h2>
              </div>
            )}

            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                if (calendarView === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else {
                  newDate.setDate(newDate.getDate() + 7);
                }
                setSelectedDate(newDate);
              }}
              className={`${isMobile ? 'p-1' : 'p-2'} rounded-lg transition-colors`}
              style={{ backgroundColor: hoverBg }}
            >
              <ChevronRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: textColor }} />
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-lg transition-colors`}
              style={{ backgroundColor: hoverBg, color: textColor }}
            >
              今天
            </button>
          </div>

          {/* 电脑版：显示视图切换 */}
          {!isMobile && (
            <div className="flex items-center space-x-2">
              <div className="flex rounded-lg p-1" style={{ backgroundColor: cardBg }}>
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    calendarView === 'week'
                      ? 'font-semibold shadow-sm'
                      : ''
                  }`}
                  style={{
                    backgroundColor: calendarView === 'week' ? hoverBg : 'transparent',
                    color: calendarView === 'week' ? textColor : accentColor,
                  }}
                >
                  周视图
                </button>
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    calendarView === 'month'
                      ? 'font-semibold shadow-sm'
                      : ''
                  }`}
                  style={{
                    backgroundColor: calendarView === 'month' ? hoverBg : 'transparent',
                    color: calendarView === 'month' ? textColor : accentColor,
                  }}
                >
                  月视图
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 日历网格 - 手机版缩小 */}
        <div 
          className={`overflow-auto ${isMobile ? 'px-2 py-1' : 'px-4 py-2'}`}
          style={{ 
            maxHeight: calendarView === 'week' ? (isMobile ? '100px' : '180px') : (isMobile ? '200px' : '280px'),
            minHeight: calendarView === 'week' ? (isMobile ? '80px' : '120px') : (isMobile ? '150px' : '200px'),
            overflowY: 'auto',
          }}
        >
          <div className={`grid grid-cols-7 ${calendarView === 'month' ? (isMobile ? 'gap-1' : 'gap-2') : (isMobile ? 'gap-2' : 'gap-3')}`}>
            {/* 星期标题 */}
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <div key={index} className={`text-center font-semibold ${isMobile ? 'py-1 text-xs' : 'py-2'}`} style={{ color: textColor }}>
                {day}
              </div>
            ))}

            {/* 日期格子 - 手机版缩小 */}
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`aspect-square rounded-lg border-2 ${isMobile ? 'p-1' : 'p-2'} transition-all hover:shadow-md`}
                style={{
                  borderColor: day.isSelected
                    ? '#3B82F6'
                    : day.isToday
                    ? '#10B981'
                    : day.isCurrentMonth
                    ? borderColor
                    : 'transparent',
                  backgroundColor: day.isSelected
                    ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                    : day.isToday
                    ? isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'
                    : day.isCurrentMonth
                    ? cardBg
                    : 'transparent',
                }}
              >
                <div className="flex flex-col h-full">
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-1`}
                    style={{
                      color: day.isToday ? '#10B981' : day.isSelected ? '#3B82F6' : day.isCurrentMonth ? textColor : accentColor
                    }}
                  >
                    {day.date.getDate()}
                  </div>
                  
                  {day.tasks.length > 0 && (
                    <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
                      {day.tasks.slice(0, calendarView === 'month' ? (isMobile ? 1 : 2) : (isMobile ? 2 : 4)).map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className={`${isMobile ? 'text-[8px] px-0.5 py-0.5' : 'text-xs px-1 py-0.5'} rounded truncate`}
                          style={{
                            backgroundColor: `${categoryColors[task.taskType] || categoryColors.other}20`,
                            color: categoryColors[task.taskType] || categoryColors.other,
                          }}
                        >
                          {task.title}
                        </div>
                      ))}
                      {day.tasks.length > (calendarView === 'month' ? (isMobile ? 1 : 2) : (isMobile ? 2 : 4)) && (
                        <div className={`${isMobile ? 'text-[8px]' : 'text-xs'}`} style={{ color: accentColor }}>
                          +{day.tasks.length - (calendarView === 'month' ? (isMobile ? 1 : 2) : (isMobile ? 2 : 4))} 更多
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 下半部分：时间轴视图 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* 时间轴主体区域 - 新设计 */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
        >
          <NewTimelineView
            tasks={tasks}
            selectedDate={selectedDate}
            onTaskUpdate={onTaskUpdate}
            onTaskCreate={onTaskCreate}
            onTaskDelete={onTaskDelete}
            bgColor={bgColor}
            textColor={textColor}
            accentColor={accentColor}
            borderColor={borderColor}
            isDark={isDark}
          />
                </div>
              </div>

    </div>
  );
}
