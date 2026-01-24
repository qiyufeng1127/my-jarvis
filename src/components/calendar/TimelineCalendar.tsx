import { useState, useRef, useEffect } from 'react';
import { 
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Check, Trash2, Edit, Copy, Play, Pause, X,
  Camera, AlertCircle, ZoomIn, ZoomOut, MoreVertical
} from 'lucide-react';
import type { Task } from '@/types';
import { TASK_TYPE_CONFIG } from '@/constants';
import TaskVerification from './TaskVerification';
import TaskExecutionPanel from './TaskExecutionPanel';
import { useUserStore } from '@/stores/userStore';

interface TimelineCalendarProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  bgColor?: string; // 背景颜色
  moduleSize?: { width: number; height: number }; // 新增：模块尺寸
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
  moduleSize, // 接收模块尺寸
}: TimelineCalendarProps) {
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeScale, setTimeScale] = useState<TimeScale>(30);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; blockId: string } | null>(null);
  const [showVerification, setShowVerification] = useState<{ taskId: string; type: 'start' | 'complete' } | null>(null);
  const [showExecution, setShowExecution] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartMinutes = useRef(0);
  
  // 金币管理
  const { addGold } = useUserStore();

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

  // 任务类别颜色（使用你指定的颜色）
  const categoryColors: Record<string, string> = {
    work: '#f16588',      // 工作赚钱 - 玫红色
    study: '#dba6aa',     // 心情/学习 - 浅粉色
    health: '#67a868',    // 健康/运动 - 绿色
    life: '#79a3ce',      // 生活琐事 - 蓝色
    social: '#95c3be',    // 玩儿 - 青色
    finance: '#f16588',   // 财务 - 玫红色
    creative: '#dba6aa',  // 创意 - 浅粉色
    rest: '#95c3be',      // 休息 - 青色
    other: '#79a3ce',     // 其他 - 蓝色
  };

  // 状态图标
  const statusStyles: Record<TaskStatus, { border: string; bg: string; icon?: string }> = {
    'pending': { border: 'border-gray-400', bg: 'bg-gray-50', icon: '⏳' },
    'in-progress': { border: 'border-green-500', bg: 'bg-green-50', icon: '▶️' },
    'completed': { border: 'border-green-600', bg: 'bg-green-100', icon: '✅' },
    'overdue': { border: 'border-red-500', bg: 'bg-red-50', icon: '⚠️' },
    'verification-needed': { border: 'border-yellow-500', bg: 'bg-yellow-50', icon: '🔒' },
  };

  // 任务类型中文标签映射
  const taskTypeLabels: Record<string, string> = {
    work: '工作赚钱',
    study: '学习',
    health: '健康',
    life: '生活琐事',
    social: '玩儿',
    finance: '财务',
    creative: '创意',
    rest: '休息',
    other: '其他',
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

  // 生成动态时间刻度（基于时间轴范围）
  const generateTimeSlots = () => {
    const slots = [];
    const startMinutes = Math.floor(timelineRange.startMinutes / 30) * 30; // 对齐到30分钟
    const endMinutes = Math.ceil(timelineRange.endMinutes / 30) * 30;
    
    for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const relativePosition = minutes - timelineRange.startMinutes;
      
      slots.push({
        minutes,
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        isHour: minute === 0,
        topPercent: (relativePosition / timelineRange.totalMinutes) * 100,
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 获取当前时间位置（基于动态时间范围）
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const relativePosition = currentMinutes - timelineRange.startMinutes;
    return (relativePosition / timelineRange.totalMinutes) * 100;
  };

  // 计算时间轴的动态范围（基于事件驱动）
  const calculateTimelineRange = () => {
    if (timeBlocks.length === 0) {
      // 如果没有任务，显示全天（00:00 - 24:00）
      return {
        startMinutes: 0,
        endMinutes: 24 * 60,
        totalMinutes: 24 * 60,
      };
    }

    // 找到最早和最晚的时间
    const startTimes = timeBlocks.map(b => b.startTime.getHours() * 60 + b.startTime.getMinutes());
    const endTimes = timeBlocks.map(b => b.endTime.getHours() * 60 + b.endTime.getMinutes());
    
    const earliestStart = Math.min(...startTimes);
    const latestEnd = Math.max(...endTimes);
    
    // 添加一些padding（前后各1小时）
    const startMinutes = Math.max(0, earliestStart - 60);
    const endMinutes = Math.min(24 * 60, latestEnd + 60);
    
    return {
      startMinutes,
      endMinutes,
      totalMinutes: endMinutes - startMinutes,
    };
  };

  const timelineRange = calculateTimelineRange();

  // 计算相邻任务之间的间隔（垂直堆叠版本）
  const calculateGaps = () => {
    const gaps: Array<{
      id: string;
      startTime: Date;
      endTime: Date;
      durationMinutes: number;
      topPercent: number;
      heightPercent: number;
    }> = [];

    const sortedBlocks = [...timeBlocks].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    for (let i = 0; i < sortedBlocks.length - 1; i++) {
      const currentEnd = sortedBlocks[i].endTime;
      const nextStart = sortedBlocks[i + 1].startTime;
      
      if (currentEnd < nextStart) {
        const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;
        if (gapMinutes >= 15) { // 只显示15分钟以上的间隔
          const gapStartMinutes = currentEnd.getHours() * 60 + currentEnd.getMinutes();
          const gapEndMinutes = nextStart.getHours() * 60 + nextStart.getMinutes();
          
          gaps.push({
            id: `gap-${i}`,
            startTime: currentEnd,
            endTime: nextStart,
            durationMinutes: gapMinutes,
            topPercent: ((gapStartMinutes - timelineRange.startMinutes) / timelineRange.totalMinutes) * 100,
            heightPercent: (gapMinutes / timelineRange.totalMinutes) * 100,
          });
        }
      }
    }

    return gaps;
  };

  // 展开状态管理
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpand = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const gaps = calculateGaps();

  // 计算时间块样式（垂直堆叠版本 - 不再使用列）
  const getBlockStyle = (block: TimeBlock) => {
    const startMinutes = block.startTime.getHours() * 60 + block.startTime.getMinutes();
    const endMinutes = block.endTime.getHours() * 60 + block.endTime.getMinutes();
    const duration = endMinutes - startMinutes;

    // 计算相对于时间轴范围的位置
    const relativeStart = startMinutes - timelineRange.startMinutes;
    const topPercent = (relativeStart / timelineRange.totalMinutes) * 100;
    
    // 计算高度百分比
    const heightPercent = (duration / timelineRange.totalMinutes) * 100;
    
    // 最小高度：120px（确保内容完整显示）
    const minHeightPx = 120;

    return {
      top: `${topPercent}%`,
      left: '0',
      width: '100%', // 占满整个宽度，不再分列
      minHeight: `${minHeightPx}px`,
      height: `${Math.max(heightPercent, 8)}%`, // 最小8%高度
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
    const task = tasks.find(t => t.id === blockId);
    
    switch (action) {
      case 'start':
        // 开始任务 - 检查是否需要验证
        if (task?.verificationStart && task.verificationStart.type !== 'none') {
          setShowVerification({ taskId: blockId, type: 'start' });
        } else {
          // 直接开始任务
          handleStartTask(blockId);
        }
        break;
      case 'complete':
        // 完成任务 - 检查是否需要验证
        if (task?.verificationComplete && task.verificationComplete.type !== 'none') {
          setShowVerification({ taskId: blockId, type: 'complete' });
        } else {
          // 直接完成任务
          handleCompleteTask(blockId);
        }
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

  // 开始任务
  const handleStartTask = (taskId: string) => {
    onTaskUpdate(taskId, { 
      status: 'in_progress',
      actualStart: new Date().toISOString(),
    });
    setShowExecution(taskId);
  };

  // 完成任务
  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 计算金币奖励
    const goldReward = Math.floor((task.durationMinutes || 60) * 2);
    
    onTaskUpdate(taskId, { 
      status: 'completed',
      actualEnd: new Date().toISOString(),
      goldEarned: goldReward,
    });
    
    // 增加金币
    addGold(goldReward, `完成任务: ${task.title}`);
    
    setShowExecution(null);
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

  // 根据模块尺寸计算时间轴区域的高度
  const getTimelineHeight = () => {
    if (!moduleSize) return 600; // 默认高度增加到600
    
    // 减去顶部日历区域和底部工具栏的高度
    const calendarHeight = calendarView === 'week' ? 280 : 380; // 日历区域高度
    const toolbarsHeight = 120; // 顶部和底部工具栏高度
    
    return Math.max(400, moduleSize.height - calendarHeight - toolbarsHeight);
  };

  const timelineHeight = getTimelineHeight();

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

        {/* 日历网格 */}
        <div 
          className={calendarView === 'week' ? 'overflow-auto px-4 py-2' : 'px-4 py-2'} 
          style={{ 
            maxHeight: calendarView === 'week' ? '200px' : 'auto',
            overflowY: calendarView === 'week' ? 'auto' : 'visible'
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

      {/* 下半部分：时间轴视图 */}
      <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: `${timelineHeight}px` }}>
        {/* 顶部工具栏 */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3" style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" style={{ color: textColor }} />
            <h2 className="text-base font-semibold" style={{ color: textColor }}>
              {selectedDate.toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })} 时间轴
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={cycleTimeScale}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center space-x-2 transition-colors"
              style={{ backgroundColor: hoverBg, color: textColor }}
              title="切换时间粒度"
            >
              <Clock className="w-4 h-4" />
              <span>{timeScale}分钟</span>
            </button>
            <span className="text-sm" style={{ color: accentColor }}>{timeBlocks.length} 个任务</span>
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
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: hoverBg, color: textColor }}
            >
              <Plus className="w-4 h-4" />
              <span>新建任务</span>
            </button>
          </div>
        </div>

        {/* 时间轴主体区域 - 统一滚动容器 */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-y-auto timeline-scrollbar"
          style={{
            minHeight: `${timelineHeight - 100}px`,
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
          {/* 全天概览卡片 - 固定在顶部 */}
          <div className="sticky top-0 z-30 mx-4 my-3">
            <div 
              className="rounded-2xl shadow-lg p-4 backdrop-blur-md"
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)',
                border: `1px solid ${borderColor}`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">📅</span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: textColor }}>全天概览</div>
                      <div className="text-xs" style={{ color: accentColor }}>
                        {timeBlocks.filter(b => b.status === 'completed').length} Meeting · 
                        {timeBlocks.filter(b => b.status === 'in-progress').length} Task · 
                        已完成: {timeBlocks.filter(b => b.status === 'completed').length}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* 总专注时长 */}
                  <div className="text-right">
                    <div className="text-xs" style={{ color: accentColor }}>总专注时长</div>
                    <div className="text-lg font-bold" style={{ color: textColor }}>
                      {Math.floor(timeBlocks.reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()), 0) / 3600000)}h 
                      {Math.floor((timeBlocks.reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()), 0) % 3600000) / 60000)}m
                    </div>
                  </div>
                  
                  {/* 今日金币 */}
                  <div className="text-right">
                    <div className="text-xs" style={{ color: accentColor }}>今日金币</div>
                    <div className="text-lg font-bold text-yellow-600">
                      💰 +{timeBlocks.reduce((sum, b) => sum + (b.rewards?.gold || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0">
            {/* 左侧时间刻度 */}
            <div className="w-20 flex-shrink-0 border-r" style={{ borderColor }}>
              <div className="relative" style={{ height: '100%', minHeight: '800px' }}>
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`absolute left-0 right-0 text-right pr-3 ${
                      slot.isHour ? 'font-semibold' : ''
                    }`}
                    style={{ 
                      top: `${slot.topPercent}%`,
                      color: slot.isHour ? textColor : accentColor,
                    }}
                  >
                    <span className="text-xs">{slot.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧时间轴内容区域 */}
            <div 
              className="flex-1 relative"
              style={{ 
                minHeight: '800px',
              }}
            >
              {/* 时间网格线 */}
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="absolute left-0 right-0"
                  style={{ 
                    top: `${slot.topPercent}%`,
                    borderTop: `${slot.isHour ? '2px' : '1px'} solid ${borderColor}`,
                  }}
                />
              ))}

              {/* 当前时间指示线 */}
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{ top: `${getCurrentTimePosition()}%` }}
              >
                <div className="relative">
                  <div className="absolute -left-2 -top-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg">
                    NOW
                  </div>
                  <div className="h-0.5 bg-red-500 shadow-lg"></div>
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
                </div>
              </div>

              {/* 任务块 */}
              {timeBlocks.map((block) => {
                const statusStyle = statusStyles[block.status];
                const task = tasks.find(t => t.id === block.id);
                const duration = Math.round((block.endTime.getTime() - block.startTime.getTime()) / 60000);
                const blockStyle = getBlockStyle(block);
                const isExpanded = expandedCards.has(block.id);
                const isCompleted = block.status === 'completed';
                
                // 格式化时长
                const formatDuration = (minutes: number) => {
                  const hours = Math.floor(minutes / 60);
                  const mins = minutes % 60;
                  if (hours > 0) {
                    return `${hours}h ${mins}m`;
                  }
                  return `${mins}m`;
                };
                
                return (
                  <div
                    key={block.id}
                    className={`absolute rounded-2xl shadow-lg transition-all group cursor-move hover:shadow-2xl overflow-visible ${
                      draggedBlockId === block.id ? 'scale-105 z-40 shadow-2xl' : 'z-20'
                    } ${
                      selectedBlockId === block.id ? 'ring-4 ring-white ring-opacity-50' : ''
                    }`}
                    style={{
                      ...blockStyle,
                      backgroundColor: isCompleted ? '#9ca3af' : block.color,
                      position: 'absolute',
                      height: 'auto', // 允许内容撑开高度
                    }}
                    onMouseDown={(e) => handleDragStart(e, block.id)}
                    onClick={() => setSelectedBlockId(block.id)}
                    onContextMenu={(e) => handleContextMenu(e, block.id)}
                  >
                    {/* 完成划线效果 */}
                    {isCompleted && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                        style={{ overflow: 'hidden', borderRadius: '1rem' }}
                      >
                        <div 
                          className="w-full h-1 bg-white opacity-80"
                          style={{ 
                            transform: 'rotate(-15deg)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        ></div>
                      </div>
                    )}
                    
                    <div className="p-4 flex flex-col text-white relative min-h-[120px]">
                      {/* 1. 顶部信息栏 */}
                      <div className="flex items-start justify-between mb-3 gap-2">
                        {/* 左侧：时间段和时长 */}
                        <div className="flex flex-col space-y-1 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-bold text-sm whitespace-nowrap">
                              {block.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {block.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                            >
                              ({formatDuration(duration)})
                            </span>
                          </div>
                          {/* 完成时间戳 */}
                          {isCompleted && task?.completedAt && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-block w-fit"
                              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                            >
                              ✓ {new Date(task.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        
                        {/* 右侧：事件类型标签和按钮组 */}
                        <div className="flex items-start space-x-2 flex-shrink-0">
                          <div className="px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap"
                            style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: block.color }}
                          >
                            [{taskTypeLabels[block.category] || block.category}]
                          </div>
                          
                          {/* 交互按钮组（横向排列） */}
                          <div className="flex items-center space-x-1">
                            {/* AI拆解按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('AI拆解任务:', block.id);
                              }}
                              className="p-1.5 rounded-lg backdrop-blur-sm transition-all hover:scale-110"
                              style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                              title="AI拆解"
                            >
                              <span className="text-sm">✨</span>
                            </button>
                            
                            {/* 任务验证/完成按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (block.status === 'pending') {
                                  handleQuickAction('start', block.id);
                                } else if (block.status === 'in-progress') {
                                  handleQuickAction('complete', block.id);
                                }
                              }}
                              className="p-1.5 rounded-lg backdrop-blur-sm transition-all hover:scale-110"
                              style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                              title={block.status === 'completed' ? '已完成' : '完成任务'}
                            >
                              {block.status === 'completed' ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <span className="text-sm">⏱️</span>
                              )}
                            </button>
                            
                            {/* 编辑颜色按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, block.id);
                              }}
                              className="p-1.5 rounded-lg backdrop-blur-sm transition-all hover:scale-110"
                              style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                              title="更多选项"
                            >
                              <span className="text-sm">🎨</span>
                            </button>
                            
                            {/* 展开/收起按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCardExpand(block.id);
                              }}
                              className="p-1.5 rounded-lg backdrop-blur-sm transition-all hover:scale-110"
                              style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                              title={isExpanded ? '收起' : '展开'}
                            >
                              <span className="text-sm">{isExpanded ? '▲' : '▼'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2. 主信息区 */}
                      <div className="flex-1 mb-3">
                        {/* 事件标题 */}
                        <h3 className="text-base font-bold mb-1 leading-tight">
                          {block.title}
                        </h3>
                        
                        {/* 地点/上下文 */}
                        {block.description && (
                          <p className="text-xs opacity-80 line-clamp-2">
                            {block.description}
                          </p>
                        )}
                        
                        {/* 关联目标 */}
                        {task?.longTermGoals && Object.keys(task.longTermGoals).length > 0 && (
                          <p className="text-xs opacity-70 mt-1">
                            🎯 关联目标: {Object.keys(task.longTermGoals)[0]}
                          </p>
                        )}
                      </div>

                      {/* 3. 底部信息栏（金币等） */}
                      {!isExpanded && (block.rewards?.gold || task?.penaltyGold) && (
                        <div className="flex items-center space-x-2 mb-2">
                          {block.rewards && block.rewards.gold > 0 && (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm" 
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                              💰 +{block.rewards.gold}
                            </span>
                          )}
                          {task?.penaltyGold && task.penaltyGold > 0 && (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm" 
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                              💸 -{task.penaltyGold}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 4. 可展开详情区 */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-white border-opacity-30 space-y-3">
                          {/* 金币信息 */}
                          {(block.rewards?.gold || task?.penaltyGold) && (
                            <div className="flex items-center space-x-2">
                              {block.rewards && block.rewards.gold > 0 && (
                                <span className="px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm" 
                                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                >
                                  💰 +{block.rewards.gold}
                                </span>
                              )}
                              {task?.penaltyGold && task.penaltyGold > 0 && (
                                <span className="px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm" 
                                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                >
                                  💸 -{task.penaltyGold}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* 子任务列表 */}
                          {task?.subtasks && task.subtasks.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold opacity-90">📋 子任务：</p>
                              <div className="space-y-1.5">
                                {task.subtasks.map((subtask) => (
                                  <div key={subtask.id} className="flex items-start space-x-2 text-xs bg-white bg-opacity-10 rounded-lg p-2">
                                    <input
                                      type="checkbox"
                                      checked={subtask.isCompleted}
                                      onChange={() => {
                                        console.log('Toggle subtask:', subtask.id);
                                      }}
                                      className="w-3.5 h-3.5 rounded mt-0.5 flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                      <span className={subtask.isCompleted ? 'line-through opacity-60' : ''}>
                                        {subtask.title}
                                      </span>
                                      {subtask.isCompleted && subtask.completedAt && (
                                        <div className="text-xs opacity-60 mt-0.5">
                                          ✓ {new Date(subtask.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* 图片/备注附件 */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('添加图片');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm hover:bg-white hover:bg-opacity-30 transition-colors"
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                              📷 添加图片
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('添加备注');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm hover:bg-white hover:bg-opacity-30 transition-colors"
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                              📝 添加备注
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 调整大小手柄 */}
                      <div
                        className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full opacity-0 group-hover:opacity-50 transition-opacity cursor-ns-resize"
                        style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                        onMouseDown={(e) => handleResizeStart(e, block.id)}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {/* 间隔快速添加组件 */}
              {gaps.map((gap) => {
                const hours = Math.floor(gap.durationMinutes / 60);
                const minutes = Math.round(gap.durationMinutes % 60);
                let gapText = '';
                if (hours > 0) {
                  gapText += `${hours}h`;
                  if (minutes > 0) {
                    gapText += ` ${minutes}m`;
                  }
                } else {
                  gapText += `${minutes}m`;
                }
                
                return (
                  <div
                    key={gap.id}
                    className="absolute left-0 right-0 z-10 flex items-center justify-center px-4"
                    style={{ 
                      top: `${gap.topPercent}%`,
                      height: `${gap.heightPercent}%`,
                      minHeight: '60px',
                    }}
                  >
                    {/* 悬浮的快速添加按钮 */}
                    <button
                      onClick={() => {
                        const newTask = {
                          title: '新任务',
                          scheduledStart: gap.startTime.toISOString(),
                          durationMinutes: Math.round(gap.durationMinutes),
                          taskType: 'work',
                          status: 'pending' as const,
                        };
                        onTaskCreate(newTask);
                      }}
                      className="group/gap relative px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl flex items-center space-x-2"
                      style={{ 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)',
                        border: `2px dashed ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
                      }}
                      title="点击快速添加任务"
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover/gap:rotate-90"
                        style={{ backgroundColor: '#3b82f6' }}
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-medium" style={{ color: isDark ? '#ffffff' : '#666666' }}>
                          空闲时间
                        </span>
                        <span className="text-sm font-bold" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                          {gapText}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="flex-shrink-0 px-6 py-2" style={{ backgroundColor: cardBg, borderTop: `1px solid ${borderColor}` }}>
          <div className="flex items-center justify-between text-xs" style={{ color: accentColor }}>
            <div className="flex items-center space-x-4">
              <span>💡 拖拽任务调整时间</span>
              <span>📏 拖拽底部调整时长</span>
              <span>🖱️ 右键打开菜单</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>红线表示当前时间</span>
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
            onClick={() => handleQuickAction('start', contextMenu.blockId)}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors"
            style={{ color: textColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Play className="w-4 h-4" />
            <span>开始任务</span>
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

      {/* 任务验证弹窗 */}
      {showVerification && (() => {
        const task = tasks.find(t => t.id === showVerification.taskId);
        if (!task) return null;
        
        const verificationType = showVerification.type === 'start' 
          ? task.verificationStart 
          : task.verificationComplete;
        
        if (!verificationType) return null;
        
        return (
          <TaskVerification
            task={{
              id: task.id,
              title: task.title,
              verificationType: verificationType.type as 'photo' | 'upload' | 'file',
              requirement: verificationType.requirement || '请提供验证材料',
              acceptedFileTypes: verificationType.acceptedFileTypes,
              maxFileSize: verificationType.maxFileSize,
            }}
            verificationType={showVerification.type}
            onSuccess={() => {
              setShowVerification(null);
              if (showVerification.type === 'start') {
                handleStartTask(showVerification.taskId);
              } else {
                handleCompleteTask(showVerification.taskId);
              }
            }}
            onFail={() => {
              setShowVerification(null);
              // 验证失败，任务保持原状态
            }}
            onSkip={() => {
              setShowVerification(null);
              // 跳过验证，继续执行
              if (showVerification.type === 'start') {
                handleStartTask(showVerification.taskId);
              } else {
                handleCompleteTask(showVerification.taskId);
              }
            }}
            timeLimit={verificationType.timeout || 120}
          />
        );
      })()}

      {/* 任务执行面板 */}
      {showExecution && (() => {
        const task = tasks.find(t => t.id === showExecution);
        if (!task || !task.actualStart) return null;
        
        return (
          <TaskExecutionPanel
            task={{
              id: task.id,
              title: task.title,
              startTime: new Date(task.actualStart),
              durationMinutes: task.durationMinutes || 60,
              rewards: {
                gold: Math.floor((task.durationMinutes || 60) * 2),
                growth: Object.entries(task.growthDimensions || {}).map(([dimension, value]) => ({
                  dimension,
                  value,
                  completed: 0,
                })),
              },
              goals: Object.entries(task.longTermGoals || {}).map(([name, contribution]) => ({
                name,
                contribution,
              })),
            }}
            onPause={() => {
              onTaskUpdate(showExecution, { status: 'waiting_start' });
            }}
            onResume={() => {
              onTaskUpdate(showExecution, { status: 'in_progress' });
            }}
            onComplete={() => {
              handleQuickAction('complete', showExecution);
            }}
            onAbandon={() => {
              onTaskUpdate(showExecution, { status: 'cancelled' });
              setShowExecution(null);
            }}
          />
        );
      })()}
    </div>
  );
}
