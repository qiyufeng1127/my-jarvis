import { useState, useRef, useEffect } from 'react';
import eventBus from '@/utils/eventBus';
import { useTaskStore } from '@/stores/taskStore';
import { 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar as CalendarIcon
} from 'lucide-react';
import type { Task } from '@/types';
import NewTimelineView from './NewTimelineView';
import InboxView from './InboxView';
import QuickStartView from './QuickStartView';
import ImportExportButton from './ImportExportButton';
import NavigationModeView from '@/components/navigation/NavigationModeView';

type TimelineActiveView = 'timeline' | 'inbox' | 'quickStart' | 'navigation' | 'navigationTrend';

interface TimelineCalendarProps {
  tasks?: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  bgColor?: string; // 背景颜色
  moduleSize?: { width: number; height: number }; // 新增：模块尺寸
}

export default function TimelineCalendar({
  tasks: externalTasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  bgColor = '#ffffff',
  moduleSize, // 接收模块尺寸
}: TimelineCalendarProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const resolvedTasks = externalTasks ?? tasks;

  const getInitialActiveView = (): TimelineActiveView => {
    if (typeof window === 'undefined') return 'timeline';
    const hash = window.location.hash || '';
    return hash.includes('nav-trend') ? 'navigationTrend' : 'timeline';
  };

  const detectMobile = () => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isSmallScreen = window.innerWidth < 768;
    return isMobileDevice || isSmallScreen;
  };

  // 检测是否为移动设备
  const [isMobile, setIsMobile] = useState(detectMobile);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(detectMobile());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 手机版默认周视图，电脑版默认月视图
  const [calendarView, setCalendarView] = useState<'week' | 'month'>(() => (detectMobile() ? 'week' : 'month'));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditingTask, setIsEditingTask] = useState(false); // 新增：跟踪是否正在编辑任务
  const [activeView, setActiveView] = useState<TimelineActiveView>(getInitialActiveView);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // 当设备类型改变时更新视图
  useEffect(() => {
    if (isMobile) {
      setCalendarView('week');
    }
  }, [isMobile]);

  useEffect(() => {
    const handleOpenNavigationTrend = () => {
      setActiveView('navigationTrend');
    };

    eventBus.on('timeline:open-navigation-trend', handleOpenNavigationTrend);
    return () => {
      eventBus.off('timeline:open-navigation-trend', handleOpenNavigationTrend);
    };
  }, []);
  
  // 触摸滑动状态
  const [touchStart, setTouchStart] = useState<number | null>(null);

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
    emergency: '#FF4444', // 紧急任务：醒目的红色
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
      const dayTasks = resolvedTasks.filter(task => {
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
      
      const dayTasks = resolvedTasks.filter(task => {
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

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* 上半部分：日历视图 - 编辑任务时隐藏 */}
      {!isEditingTask && (
        <div className="flex-shrink-0" style={{ borderBottom: `2px solid ${borderColor}` }}>
        {/* 手机版：简化的周视图头部 */}
        {isMobile ? (
          <div className="px-3 py-2 bg-white dark:bg-black">
            {/* 周数标题 - 可左右滑动 */}
            <div 
              className="flex items-center justify-between gap-2 mb-2"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                setTouchStart(touch.clientX);
              }}
              onTouchMove={(e) => {
                if (touchStart === null) return;
                const touch = e.touches[0];
                const diff = touch.clientX - touchStart;
                if (Math.abs(diff) > 50) {
                  if (diff > 0) {
                    // 向右滑动 - 上一周
                    goToPreviousWeek();
                  } else {
                    // 向左滑动 - 下一周
                    goToNextWeek();
                  }
                  setTouchStart(null);
                }
              }}
              onTouchEnd={() => setTouchStart(null)}
            >
              <button
                onClick={goToPreviousWeek}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{ backgroundColor: hoverBg, color: textColor }}
                aria-label="上一周"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <span className="text-sm font-semibold text-gray-800 dark:text-white text-center flex-1">
                {selectedDate.toLocaleDateString('zh-CN', { month: 'long' })}第{Math.ceil(selectedDate.getDate() / 7)}周
              </span>

              <button
                onClick={goToNextWeek}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{ backgroundColor: hoverBg, color: textColor }}
                aria-label="下一周"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                <div key={index} className="text-center text-xs font-semibold py-1 text-gray-800 dark:text-white">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 日期数字 - 无方块，只显示数字和下划线 */}
            <div className="grid grid-cols-7 gap-1">
              {generateWeekCalendarDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className="text-center py-1 transition-all relative"
                >
                  <div 
                    className={`text-sm font-semibold ${day.isSelected || day.isToday ? 'relative' : ''}`}
                    style={{
                      color: day.isToday ? '#10B981' : day.isSelected ? '#EC4899' : textColor
                    }}
                  >
                    {day.date.getDate()}
                    {/* 选中日期 - 粉色下划线 */}
                    {day.isSelected && (
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
                        style={{ backgroundColor: '#EC4899' }}
                      />
                    )}
                    {/* 当天 - 蓝色下划线 */}
                    {day.isToday && !day.isSelected && (
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
                        style={{ backgroundColor: '#3B82F6' }}
                      />
                    )}
                  </div>
                  {/* 任务数量指示点 */}
                  {day.tasks.length > 0 && (
                    <div className="flex justify-center mt-0.5">
                      <div 
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: categoryColors[day.tasks[0].taskType] || categoryColors.other }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* 电脑版：保持原样 */
          <>
            {/* 日历工具栏 */}
            <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-black" style={{ borderBottom: `1px solid ${borderColor}` }}>
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
                  className="p-1 rounded-lg transition-colors"
                  style={{ backgroundColor: hoverBg }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: textColor }} />
                </button>

                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5" style={{ color: textColor }} />
                  <h2 className="text-lg font-semibold" style={{ color: textColor }}>
                    {calendarView === 'month' 
                      ? selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
                      : `${selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })} 第${Math.ceil(selectedDate.getDate() / 7)}周`
                    }
                  </h2>
                </div>

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
                  className="p-1 rounded-lg transition-colors"
                  style={{ backgroundColor: hoverBg }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: textColor }} />
                </button>

                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-2 py-1 text-xs rounded-lg transition-colors"
                  style={{ backgroundColor: hoverBg, color: textColor }}
                >
                  今天
                </button>
              </div>

              {/* 电脑版：显示视图切换 */}
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
            </div>

            {/* 日历网格 - 电脑版保留方块 */}
            <div 
              className="overflow-auto px-4 py-2"
              style={{ 
                maxHeight: calendarView === 'week' ? '180px' : '280px',
                minHeight: calendarView === 'week' ? '120px' : '200px',
                overflowY: 'auto',
              }}
            >
              <div className={`grid grid-cols-7 ${calendarView === 'month' ? 'gap-2' : 'gap-3'}`}>
                {/* 星期标题 */}
                {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                  <div key={index} className="text-center font-semibold py-2" style={{ color: textColor }}>
                    {day}
                  </div>
                ))}

                {/* 日期格子 */}
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className="aspect-square rounded-lg border-2 p-2 transition-all hover:shadow-md"
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
                      <div className="text-sm font-semibold mb-1"
                        style={{
                          color: day.isToday ? '#10B981' : day.isSelected ? '#3B82F6' : day.isCurrentMonth ? textColor : accentColor
                        }}
                      >
                        {day.date.getDate()}
                      </div>
                      
                      {day.tasks.length > 0 && (
                        <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
                          {day.tasks.slice(0, calendarView === 'month' ? 2 : 4).map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className="text-xs px-1 py-0.5 rounded truncate"
                              style={{
                                backgroundColor: `${categoryColors[task.taskType] || categoryColors.other}20`,
                                color: categoryColors[task.taskType] || categoryColors.other,
                              }}
                            >
                              {task.title}
                            </div>
                          ))}
                          {day.tasks.length > (calendarView === 'month' ? 2 : 4) && (
                            <div className="text-xs" style={{ color: accentColor }}>
                              +{day.tasks.length - (calendarView === 'month' ? 2 : 4)} 更多
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      )}

      {/* 下半部分：时间轴视图或收集箱或快捷开始 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* 视图切换按钮 */}
        <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between gap-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveView('timeline');
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                activeView === 'timeline' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: activeView === 'timeline' ? hoverBg : 'transparent',
              }}
              title="时间轴"
            >
              <span className="text-xl">📅</span>
            </button>
            
            <button
              onClick={() => {
                setActiveView('inbox');
              }}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                activeView === 'inbox' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: activeView === 'inbox' ? hoverBg : 'transparent',
              }}
              title="收集箱"
            >
              <span className="text-xl">📥</span>
              {tasks.filter(t => !t.scheduledStart).length > 0 && (
                <span 
                  className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: '#FF4444',
                    color: '#FFFFFF',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {tasks.filter(t => !t.scheduledStart).length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('quickStart');
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                activeView === 'quickStart' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: activeView === 'quickStart' ? hoverBg : 'transparent',
              }}
              title="快捷开始"
            >
              <span className="text-xl">⚡</span>
            </button>

            <button
              onClick={() => {
                eventBus.emit('timeline:open-quick-backfill');
              }}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all"
              style={{
                backgroundColor: 'transparent',
              }}
              title="快捷补录"
            >
              <span className="text-xl">📝</span>
            </button>

            <button
              onClick={() => {
                setActiveView('navigation');
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                activeView === 'navigation' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: activeView === 'navigation' ? hoverBg : 'transparent',
              }}
              title="导航模式"
            >
              <span className="text-xl">🧭</span>
            </button>

            <button
              onClick={() => {
                setActiveView('navigationTrend');
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                activeView === 'navigationTrend' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: activeView === 'navigationTrend' ? hoverBg : 'transparent',
              }}
              title="导航可视化"
            >
              <span className="text-xl">📈</span>
            </button>
          </div>

          {/* 导入导出按钮 */}
          <ImportExportButton
            tasks={tasks}
            onImport={(importedTasks) => {
              // 批量创建导入的任务 - 使用 Promise.all 避免循环触发
              Promise.all(
                importedTasks.map(task => onTaskCreate(task))
              ).catch(err => {
                console.error('❌ 批量导入任务失败:', err);
              });
            }}
            bgColor={bgColor}
            textColor={textColor}
            accentColor={accentColor}
            borderColor={borderColor}
            isDark={isDark}
          />
        </div>

        {/* 主体区域 */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-y-auto overflow-x-hidden text-gray-800 dark:text-white"
        >
          {activeView === 'quickStart' ? (
            <QuickStartView
              tasks={tasks}
              onTaskCreate={onTaskCreate}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
              bgColor={bgColor}
              textColor={textColor}
              accentColor={accentColor}
              borderColor={borderColor}
              isDark={isDark}
            />
          ) : activeView === 'inbox' ? (
            <InboxView
              tasks={tasks}
              onTaskUpdate={onTaskUpdate}
              onTaskCreate={onTaskCreate}
              onTaskDelete={onTaskDelete}
              onStartTask={() => {
                setActiveView('timeline');
              }}
              bgColor={bgColor}
              textColor={textColor}
              accentColor={accentColor}
              borderColor={borderColor}
              isDark={isDark}
            />
          ) : activeView === 'navigation' ? (
            <NavigationModeView />
          ) : activeView === 'navigationTrend' ? (
            <NavigationModeView initialScreen="trend" />
          ) : (
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
              onEditingChange={setIsEditingTask}
            />
          )}
        </div>
      </div>

    </div>
  );
}
