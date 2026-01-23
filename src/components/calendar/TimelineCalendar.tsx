import { useState, useRef, useEffect } from 'react';
import { 
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Check, Trash2, Edit, Copy, Play, Pause, X,
  Camera, AlertCircle, ZoomIn, ZoomOut, MoreVertical
} from 'lucide-react';
import type { Task } from '@/types';

interface TimelineCalendarProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  bgColor?: string; // 背景颜色
}

type TimeScale = 30 | 15 | 5; // 时间粒度（分钟）
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue' | 'verification-needed';

interface TimeBlock {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color: string;
  status: TaskStatus;
  category: string;
  description?: string;
  verification?: {
    start?: 'photo' | 'location' | 'none';
    end?: 'photo' | 'upload' | 'none';
  };
  rewards?: {
    gold: number;
    growth: { dimension: string; value: number }[];
  };
}

export default function TimelineCalendar({
  tasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  bgColor = '#ffffff',
}: TimelineCalendarProps) {
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeScale, setTimeScale] = useState<TimeScale>(30);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; blockId: string } | null>(null);
  const [showVerification, setShowVerification] = useState<string | null>(null);
  const [showExecution, setShowExecution] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartMinutes = useRef(0);

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
    work: '#3B82F6',      // 蓝色
    study: '#10B981',     // 绿色
    health: '#F59E0B',    // 橙色
    life: '#8B5CF6',      // 紫色
    social: '#EC4899',    // 粉色
    other: '#6B7280',     // 灰色
  };

  // 状态颜色
  const statusStyles: Record<TaskStatus, { border: string; bg: string; icon?: string }> = {
    'pending': { border: 'border-gray-400', bg: 'bg-gray-50', icon: '⏳' },
    'in-progress': { border: 'border-green-500', bg: 'bg-green-50', icon: '▶️' },
    'completed': { border: 'border-green-600', bg: 'bg-green-100', icon: '✅' },
    'overdue': { border: 'border-red-500', bg: 'bg-red-50', icon: '⚠️' },
    'verification-needed': { border: 'border-yellow-500', bg: 'bg-yellow-50', icon: '🔒' },
  };

  // 转换 tasks 为 timeBlocks
  const timeBlocks: TimeBlock[] = tasks
    .filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    })
    .map((task) => {
      const startTime = new Date(task.scheduledStart!);
      const endTime = new Date(startTime.getTime() + (task.durationMinutes || 60) * 60000);
      const now = new Date();
      
      let status: TaskStatus = 'pending';
      if (task.status === 'completed') {
        status = 'completed';
      } else if (endTime < now) {
        status = 'overdue';
      } else if (startTime <= now && endTime > now) {
        status = 'in-progress';
      }

      return {
        id: task.id,
        title: task.title,
        startTime,
        endTime,
        color: categoryColors[task.taskType] || categoryColors.other,
        status,
        category: task.taskType,
        description: task.description,
        verification: {
          start: 'none',
          end: 'none',
        },
        rewards: {
          gold: Math.floor((task.durationMinutes || 60) * 2),
          growth: [],
        },
      };
    });

  // 生成时间刻度
  const generateTimeSlots = () => {
    const slots = [];
    const totalMinutes = 24 * 60;
    for (let minutes = 0; minutes < totalMinutes; minutes += timeScale) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push({
        minutes,
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        isHour: minute === 0,
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 获取当前时间位置
  const getCurrentTimePosition = () => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * 100;
  };

  // 计算时间块样式
  const getBlockStyle = (block: TimeBlock) => {
    const startMinutes = block.startTime.getHours() * 60 + block.startTime.getMinutes();
    const endMinutes = block.endTime.getHours() * 60 + block.endTime.getMinutes();
    const duration = Math.max(endMinutes - startMinutes, 15);

    const top = (startMinutes / (24 * 60)) * 100;
    const height = (duration / (24 * 60)) * 100;

    return {
      top: `${top}%`,
      height: `${Math.max(height, 2)}%`,
      borderColor: block.color,
    };
  };

  // 拖拽开始
  const handleDragStart = (e: React.MouseEvent, blockId: string) => {
    const block = timeBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    setDraggedBlockId(blockId);
    dragStartY.current = e.clientY;
    dragStartMinutes.current = block.startTime.getHours() * 60 + block.startTime.getMinutes();
    e.preventDefault();
  };

  // 拖拽移动
  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggedBlockId || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const scrollHeight = timelineRef.current.scrollHeight;
    const deltaY = e.clientY - dragStartY.current;
    const minutesPerPixel = (24 * 60) / scrollHeight; // 使用 scrollHeight 而不是 rect.height
    const deltaMinutes = Math.round(deltaY * minutesPerPixel / timeScale) * timeScale;
    
    const newStartMinutes = Math.max(0, Math.min(24 * 60 - 15, dragStartMinutes.current + deltaMinutes));
    
    const block = timeBlocks.find(b => b.id === draggedBlockId);
    if (block) {
      const duration = (block.endTime.getTime() - block.startTime.getTime()) / 60000;
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(Math.floor(newStartMinutes / 60));
      newStartTime.setMinutes(newStartMinutes % 60);
      newStartTime.setSeconds(0);
      
      onTaskUpdate(draggedBlockId, {
        scheduledStart: newStartTime.toISOString(),
        durationMinutes: duration,
      });
    }
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedBlockId(null);
  };

  // 调整大小开始
  const handleResizeStart = (e: React.MouseEvent, blockId: string) => {
    setResizingBlockId(blockId);
    dragStartY.current = e.clientY;
    e.stopPropagation();
    e.preventDefault();
  };

  // 调整大小移动
  const handleResizeMove = (e: React.MouseEvent) => {
    if (!resizingBlockId || !timelineRef.current) return;

    const scrollHeight = timelineRef.current.scrollHeight;
    const deltaY = e.clientY - dragStartY.current;
    const minutesPerPixel = (24 * 60) / scrollHeight; // 使用 scrollHeight 而不是 rect.height
    const deltaMinutes = Math.round(deltaY * minutesPerPixel / timeScale) * timeScale;
    
    const block = timeBlocks.find(b => b.id === resizingBlockId);
    if (block) {
      const currentDuration = (block.endTime.getTime() - block.startTime.getTime()) / 60000;
      const newDuration = Math.max(timeScale, currentDuration + deltaMinutes);
      
      onTaskUpdate(resizingBlockId, {
        durationMinutes: newDuration,
      });
      
      dragStartY.current = e.clientY;
    }
  };

  // 调整大小结束
  const handleResizeEnd = () => {
    setResizingBlockId(null);
  };

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, blockId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, blockId });
  };

  // 点击时间刻度定位
  const handleTimeSlotClick = (minutes: number) => {
    if (timelineRef.current) {
      const position = (minutes / (24 * 60)) * timelineRef.current.scrollHeight;
      timelineRef.current.scrollTop = position - 100;
    }
  };

  // 快速操作
  const handleQuickAction = (action: string, blockId: string) => {
    switch (action) {
      case 'complete':
        onTaskUpdate(blockId, { status: 'completed' });
        break;
      case 'delete':
        if (confirm('确定要删除这个任务吗？')) {
          onTaskDelete(blockId);
        }
        break;
      case 'copy':
        const block = timeBlocks.find(b => b.id === blockId);
        if (block) {
          const newStartTime = new Date(block.startTime.getTime() + 24 * 60 * 60 * 1000);
          onTaskCreate({
            title: block.title + ' (副本)',
            scheduledStart: newStartTime.toISOString(),
            durationMinutes: (block.endTime.getTime() - block.startTime.getTime()) / 60000,
            taskType: block.category,
            status: 'pending',
          });
        }
        break;
      case 'edit':
        setShowDetail(blockId);
        break;
    }
    setContextMenu(null);
  };

  // 切换时间粒度
  const cycleTimeScale = () => {
    const scales: TimeScale[] = [30, 15, 5];
    const currentIndex = scales.indexOf(timeScale);
    const nextIndex = (currentIndex + 1) % scales.length;
    setTimeScale(scales[nextIndex]);
  };

  // 关闭所有弹窗
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: bgColor }}>
      {/* 上半部分：日历视图 */}
      <div className="flex-shrink-0" style={{ borderBottom: `2px solid ${borderColor}` }}>
        {/* 日历工具栏 */}
        <div className="flex items-center justify-between px-6 py-3" style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center space-x-4">
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
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: hoverBg }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: textColor }} />
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
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: hoverBg }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: textColor }} />
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors"
              style={{ backgroundColor: hoverBg, color: textColor }}
            >
              今天
            </button>
          </div>

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

        {/* 日历网格 - 月视图不滚动，周视图可滚动 */}
        <div className={calendarView === 'week' ? 'calendar-scrollbar overflow-auto p-4' : 'p-4'} style={{ maxHeight: calendarView === 'week' ? '200px' : 'auto' }}>
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
                className={`${calendarView === 'month' ? 'aspect-square' : 'h-24'} rounded-lg border-2 p-2 transition-all hover:shadow-md`}
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
                  <div className={`text-sm font-semibold mb-1`}
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
      </div>

      {/* 下半部分：时间轴视图 - 完全重写的滚动结构 */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* 左侧时间刻度 */}
        <div style={{ 
          width: '80px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: cardBg,
          borderRight: `1px solid ${borderColor}`,
        }}>
          {/* 时间刻度头部 */}
          <div style={{ 
            padding: '8px',
            backgroundColor: cardBg,
            borderBottom: `1px solid ${borderColor}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={cycleTimeScale}
                style={{ 
                  padding: '6px',
                  borderRadius: '8px',
                  backgroundColor: hoverBg,
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="切换时间粒度"
              >
                <Clock style={{ width: '16px', height: '16px', color: textColor }} />
              </button>
              <span style={{ fontSize: '12px', fontWeight: 500, color: textColor }}>{timeScale}分钟</span>
            </div>
          </div>

          {/* 时间刻度列表 - 可滚动 */}
          <div className="timeline-scrollbar" style={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}>
            <div style={{ 
              position: 'relative',
              height: `${(24 * 60 / timeScale) * 40}px`,
              width: '100%',
            }}>
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSlotClick(slot.minutes)}
                  style={{ 
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${(slot.minutes / (24 * 60)) * 100}%`,
                    height: `${(timeScale / (24 * 60)) * 100}%`,
                    textAlign: 'right',
                    paddingRight: '12px',
                    color: slot.isHour ? textColor : accentColor,
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: slot.isHour ? 600 : 400,
                    fontSize: '12px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧时间轴主体 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {/* 顶部工具栏 */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            backgroundColor: bgColor,
            borderBottom: `1px solid ${borderColor}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock style={{ width: '20px', height: '20px', color: textColor }} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: textColor, margin: 0 }}>
                {selectedDate.toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })} 时间轴
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: accentColor }}>{timeBlocks.length} 个任务</span>
              <button
                onClick={() => {
                  const newTask = {
                    title: '新任务',
                    scheduledStart: new Date(selectedDate.setHours(9, 0, 0, 0)).toISOString(),
                    durationMinutes: 60,
                    taskType: 'work',
                    status: 'pending' as const,
                  };
                  onTaskCreate(newTask);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: hoverBg,
                  color: textColor,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                <span>新建任务</span>
              </button>
            </div>
          </div>

          {/* 时间轴滚动区域 - 隐藏滚动条但可滚动 */}
          <div 
            ref={timelineRef}
            className="timeline-scrollbar"
            style={{
              flex: 1,
              position: 'relative',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            onMouseMove={(e) => {
              if (draggedBlockId) handleDragMove(e);
              if (resizingBlockId) handleResizeMove(e);
            }}
            onMouseUp={() => {
              handleDragEnd();
              handleResizeEnd();
            }}
            onMouseLeave={() => {
              handleDragEnd();
              handleResizeEnd();
            }}
          >
            <div style={{ 
              position: 'relative',
              backgroundColor: bgColor,
              height: `${(24 * 60 / timeScale) * 40}px`,
              minHeight: `${(24 * 60 / timeScale) * 40}px`,
              width: '100%',
            }}>
              {/* 时间网格线 */}
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  style={{ 
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${(slot.minutes / (24 * 60)) * 100}%`,
                    borderTop: `${slot.isHour ? '2px' : '1px'} solid ${borderColor}`,
                  }}
                />
              ))}

              {/* 当前时间指示线 */}
              <div
                style={{ 
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${getCurrentTimePosition()}%`,
                  zIndex: 30,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-8px',
                    top: '-12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    NOW
                  </div>
                  <div style={{ height: '2px', backgroundColor: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}></div>
                  <div className="animate-pulse" style={{
                    position: 'absolute',
                    left: '-6px',
                    top: '-6px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                  }}></div>
                </div>
              </div>

              {/* 任务块 */}
              {timeBlocks.map((block) => {
                const statusStyle = statusStyles[block.status];
                const blockStyle = getBlockStyle(block);
                return (
                  <div
                    key={block.id}
                    className={`${statusStyle.border} ${statusStyle.bg} group`}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      right: '16px',
                      top: blockStyle.top,
                      height: blockStyle.height,
                      borderRadius: '8px',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: block.color,
                      boxShadow: draggedBlockId === block.id ? '0 20px 25px -5px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
                      transform: draggedBlockId === block.id ? 'scale(1.05)' : 'scale(1)',
                      zIndex: draggedBlockId === block.id ? 40 : selectedBlockId === block.id ? 30 : 20,
                      cursor: 'move',
                      transition: draggedBlockId === block.id ? 'none' : 'all 0.2s',
                    }}
                    onMouseDown={(e) => handleDragStart(e, block.id)}
                    onClick={() => setSelectedBlockId(block.id)}
                    onContextMenu={(e) => handleContextMenu(e, block.id)}
                  >
                    <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* 任务头部 */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '18px' }}>{statusStyle.icon}</span>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {block.title}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, block.id);
                          }}
                          className="opacity-0 group-hover:opacity-100"
                          style={{
                            padding: '4px',
                            borderRadius: '4px',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                        >
                          <MoreVertical style={{ width: '16px', height: '16px', color: textColor }} />
                        </button>
                      </div>

                      {/* 时间信息 */}
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: accentColor, marginBottom: '8px' }}>
                        <Clock style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                        {block.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {block.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        <span style={{ marginLeft: '8px' }}>
                          ({Math.round((block.endTime.getTime() - block.startTime.getTime()) / 60000)}分钟)
                        </span>
                      </div>

                      {/* 奖励信息 */}
                      {block.rewards && (
                        <div style={{ fontSize: '12px', color: accentColor, marginTop: 'auto' }}>
                          💰 {block.rewards.gold} 金币
                        </div>
                      )}

                      {/* 调整大小手柄 */}
                      <div
                        className="opacity-0 group-hover:opacity-100"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '8px',
                          cursor: 'ns-resize',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseDown={(e) => handleResizeStart(e, block.id)}
                      >
                        <div style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '48px',
                          height: '4px',
                          borderRadius: '2px',
                          backgroundColor: accentColor,
                        }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 底部提示 */}
          <div style={{ 
            padding: '8px 24px',
            backgroundColor: cardBg,
            borderTop: `1px solid ${borderColor}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: accentColor }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>💡 拖拽任务调整时间</span>
                <span>📏 拖拽底部调整时长</span>
                <span>🖱️ 右键打开菜单</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="animate-pulse" style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                <span>红线表示当前时间</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed rounded-lg shadow-xl py-1 z-50"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          <button
            onClick={() => handleQuickAction('edit', contextMenu.blockId)}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors"
            style={{ color: textColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Edit className="w-4 h-4" />
            <span>编辑</span>
          </button>
          <button
            onClick={() => handleQuickAction('complete', contextMenu.blockId)}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors"
            style={{ color: textColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Check className="w-4 h-4" />
            <span>标记完成</span>
          </button>
          <button
            onClick={() => handleQuickAction('copy', contextMenu.blockId)}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors"
            style={{ color: textColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Copy className="w-4 h-4" />
            <span>复制到明天</span>
          </button>
          <div style={{ borderTop: `1px solid ${borderColor}`, margin: '4px 0' }}></div>
          <button
            onClick={() => handleQuickAction('delete', contextMenu.blockId)}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors"
            style={{ color: '#ef4444' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 className="w-4 h-4" />
            <span>删除</span>
          </button>
        </div>
      )}
    </div>
  );
}
