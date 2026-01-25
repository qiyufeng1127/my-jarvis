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

  // 时间轴常量：完整24小时
  const TIMELINE_HOUR_HEIGHT = 60; // 每小时的像素高度
  const TIMELINE_TOTAL_HEIGHT = 24 * TIMELINE_HOUR_HEIGHT; // 24小时总高度 = 1440px

  // 生成完整24小时时间刻度（00:00 - 24:00）
  const generateTimeSlots = () => {
    const slots = [];
    
    // 生成00:00到24:00，每30分钟一个刻度
    for (let minutes = 0; minutes <= 24 * 60; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      
      // 跳过24:30及以后（24:00是最后一个刻度）
      if (hour > 24) break;
      
      slots.push({
        minutes,
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        isHour: minute === 0,
        topPx: (minutes / 60) * TIMELINE_HOUR_HEIGHT, // 基于像素的绝对位置
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 获取当前时间位置（基于像素）
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return (currentMinutes / 60) * TIMELINE_HOUR_HEIGHT; // 返回像素位置
  };

  // 计算所有事件的垂直堆叠位置（基于完整24小时时间轴）
  const calculateStackedPositions = () => {
    // 按开始时间排序
    const sortedBlocks = [...timeBlocks].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    const positions: Record<string, {
      topPx: number;
      heightPx: number;
      timeBasedTopPx: number; // 保留时间轴上的理论位置（用于参考）
    }> = {};

    let currentBottomPx = 0; // 当前已占用的最底部位置（像素）
    const minHeightPx = 120; // 最小高度
    const cardGapPx = 12; // 卡片之间的间距

    sortedBlocks.forEach((block) => {
      const startMinutes = block.startTime.getHours() * 60 + block.startTime.getMinutes();
      const endMinutes = block.endTime.getHours() * 60 + block.endTime.getMinutes();
      const duration = endMinutes - startMinutes;

      // 计算基于时间的位置（像素）
      const timeBasedTopPx = (startMinutes / 60) * TIMELINE_HOUR_HEIGHT;
      
      // 计算基于时间的高度（像素）
      const timeBasedHeightPx = (duration / 60) * TIMELINE_HOUR_HEIGHT;
      
      // 实际高度：取时间高度和最小高度的较大值
      const actualHeightPx = Math.max(timeBasedHeightPx, minHeightPx);

      // 计算实际top位置：如果与上一个卡片重叠，则放在上一个卡片下方
      const actualTopPx = Math.max(timeBasedTopPx, currentBottomPx);

      positions[block.id] = {
        topPx: actualTopPx,
        heightPx: actualHeightPx,
        timeBasedTopPx, // 保留用于显示时间参考线
      };

      // 更新当前底部位置
      currentBottomPx = actualTopPx + actualHeightPx + cardGapPx;
    });

    return positions;
  };

  const stackedPositions = calculateStackedPositions();

  // 获取单个事件的样式
  const getBlockStyle = (block: TimeBlock) => {
    const position = stackedPositions[block.id];
    if (!position) {
      return {
        top: '0px',
        left: '0',
        width: '100%',
        height: '120px',
      };
    }

    return {
      top: `${position.topPx}px`,
      left: '0',
      width: '100%',
      height: `${position.heightPx}px`,
    };
  };

  // 计算相邻任务之间的间隔（基于堆叠位置）
  const calculateGaps = () => {
    const gaps: Array<{
      id: string;
      startTime: Date;
      endTime: Date;
      durationMinutes: number;
      topPx: number;
      heightPx: number;
    }> = [];

    const sortedBlocks = [...timeBlocks].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    for (let i = 0; i < sortedBlocks.length - 1; i++) {
      const currentBlock = sortedBlocks[i];
      const nextBlock = sortedBlocks[i + 1];
      
      const currentPosition = stackedPositions[currentBlock.id];
      const nextPosition = stackedPositions[nextBlock.id];
      
      if (!currentPosition || !nextPosition) continue;
      
      // 计算视觉间隔（堆叠位置的间隔）
      const currentBottomPx = currentPosition.topPx + currentPosition.heightPx;
      const gapHeightPx = nextPosition.topPx - currentBottomPx;
      
      // 只显示足够大的间隔（至少60px）
      if (gapHeightPx >= 60) {
        const currentEnd = currentBlock.endTime;
        const nextStart = nextBlock.startTime;
        const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;
        
        gaps.push({
          id: `gap-${i}`,
          startTime: currentEnd,
          endTime: nextStart,
          durationMinutes: Math.max(0, gapMinutes), // 可能为负（时间重叠但视觉分离）
          topPx: currentBottomPx,
          heightPx: gapHeightPx,
        });
      }
    }

    return gaps;
  };

  const gaps = calculateGaps();

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
                className={`aspect-square rounded-lg border-2 p-2 transition-all hover:shadow-md`}
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
      <div className="flex-1 flex flex-col min-h-0">
        {/* 全天概览数据 - 移到顶部，无背景，只显示图标+数据 */}
        <div className="flex-shrink-0 px-6 py-3" style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📅</span>
                <div className="text-sm font-bold" style={{ color: textColor }}>
                  {timeBlocks.filter(b => b.status === 'completed').length}/{timeBlocks.length}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xl">⏱️</span>
                <div className="text-sm font-bold" style={{ color: textColor }}>
                  {Math.floor(timeBlocks.reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()), 0) / 3600000)}h 
                  {Math.floor((timeBlocks.reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()), 0) % 3600000) / 60000)}m
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xl">💰</span>
                <div className="text-sm font-bold text-yellow-600">
                  +{timeBlocks.reduce((sum, b) => sum + (b.rewards?.gold || 0), 0)}
                </div>
              </div>
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
        </div>

        {/* 时间轴主体区域 - 固定高度滚动容器 */}
        <div 
          ref={timelineRef}
          className="overflow-y-scroll overflow-x-hidden"
          style={{
            height: '600px', // 固定容器高度，可以调整
            flexShrink: 0,
            WebkitOverflowScrolling: 'touch',
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
          {/* 时间轴内容区域 - 固定24小时高度 */}
          <div className="flex" style={{ minHeight: `${TIMELINE_TOTAL_HEIGHT}px` }}>
            {/* 左侧时间刻度 */}
            <div className="w-20 flex-shrink-0 border-r" style={{ borderColor }}>
              <div className="relative" style={{ height: `${TIMELINE_TOTAL_HEIGHT}px`, minHeight: `${TIMELINE_TOTAL_HEIGHT}px` }}>
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`absolute left-0 right-0 text-right pr-3 ${
                      slot.isHour ? 'font-semibold' : ''
                    }`}
                    style={{ 
                      top: `${slot.topPx}px`,
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
                height: `${TIMELINE_TOTAL_HEIGHT}px`,
                minHeight: `${TIMELINE_TOTAL_HEIGHT}px`,
              }}
            >
              {/* 时间网格线 */}
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="absolute left-0 right-0"
                  style={{ 
                    top: `${slot.topPx}px`,
                    borderTop: `${slot.isHour ? '2px' : '1px'} solid ${borderColor}`,
                  }}
                />
              ))}

              {/* 当前时间指示线 */}
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{ top: `${getCurrentTimePosition()}px` }}
              >
                <div className="relative">
                  <div className="absolute -left-2 -top-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg">
                    NOW
                  </div>
                  <div className="h-0.5 bg-red-500 shadow-lg"></div>
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
                </div>
              </div>

              {/* 任务块 - 全新设计 */}
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

                // AI智能分配的标签（模拟）
                const aiTags = ['#运营', '#创业', '#ins穿搭账号'];
                
                // AI智能分配的Emoji
                const getAIEmoji = (title: string) => {
                  if (title.includes('起床')) return '👔';
                  if (title.includes('ins') || title.includes('穿搭')) return '👗';
                  if (title.includes('照相馆') || title.includes('小红书')) return '💄';
                  return '📝';
                };
                
                return (
                  <div
                    key={block.id}
                    className={`absolute rounded-3xl shadow-xl transition-all group cursor-move hover:shadow-2xl ${
                      draggedBlockId === block.id ? 'scale-105 z-40 shadow-2xl' : 'z-20'
                    } ${
                      selectedBlockId === block.id ? 'ring-4 ring-white ring-opacity-50' : ''
                    }`}
                    style={{
                      ...blockStyle,
                      backgroundColor: isCompleted ? 'rgba(156, 163, 175, 0.5)' : block.color,
                      position: 'absolute',
                      minHeight: '160px',
                      opacity: isCompleted ? 0.7 : 1,
                    }}
                    onMouseDown={(e) => handleDragStart(e, block.id)}
                    onClick={() => setSelectedBlockId(block.id)}
                    onContextMenu={(e) => handleContextMenu(e, block.id)}
                  >
                    {/* 完成划线效果 */}
                    {isCompleted && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                        style={{ overflow: 'hidden', borderRadius: '1.5rem' }}
                      >
                        <div 
                          className="w-full h-1.5 bg-white opacity-90"
                          style={{ 
                            transform: 'rotate(-8deg)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                        ></div>
                      </div>
                    )}
                    
                    <div className="p-5 flex flex-col text-white relative min-h-[160px]">
                      {/* 顶部区域：时间与标签 */}
                      <div className="flex items-start justify-between mb-3">
                        {/* 左侧：开始时间 */}
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold leading-none">
                            {block.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs opacity-60 mt-0.5">
                            {block.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* 中间：AI智能标签 */}
                        <div className="flex-1 flex flex-wrap gap-1.5 justify-center items-start px-3">
                          {aiTags.slice(0, 2).map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* 右侧：持续时间 */}
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: '#ff69b4' }}>
                            *{duration} min
                          </span>
                        </div>
                      </div>

                      {/* 内容主体区域 */}
                      <div className="flex gap-3 mb-3">
                        {/* 左侧：图片上传区 */}
                        <div 
                          className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('上传图片');
                          }}
                        >
                          <Camera className="w-8 h-8 opacity-60" />
                        </div>

                        {/* 右侧：标题与Emoji */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-lg font-bold leading-tight ${isCompleted ? 'line-through' : ''}`}>
                              {block.title}
                            </h3>
                            <span className="text-2xl">{getAIEmoji(block.title)}</span>
                          </div>
                          
                          {/* 虚线分隔 */}
                          <div 
                            className="w-full my-2"
                            style={{ 
                              borderTop: '2px dashed rgba(255,255,255,0.4)',
                            }}
                          ></div>

                          {/* 关联目标 */}
                          <div className="text-sm opacity-90">
                            <span className="font-medium">@挑战早起30天</span>
                          </div>
                        </div>
                      </div>

                      {/* 功能按钮栏 */}
                      <div className="flex items-center justify-between mb-3">
                        {/* 左侧：功能图标 */}
                        <div className="flex items-center gap-2">
                          {/* 星星图标 - AI拆解子任务 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardExpand(block.id);
                            }}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            title="AI拆解子任务"
                          >
                            <span className="text-lg">⭐</span>
                          </button>

                          {/* 验证设置按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('验证设置');
                            }}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            title="验证设置"
                          >
                            <span className="text-lg">⏱️</span>
                          </button>

                          {/* 备注按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('添加备注');
                            }}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            title="备注"
                          >
                            <span className="text-lg">📝</span>
                          </button>
                        </div>

                        {/* 右侧：金币与状态 */}
                        <div className="flex items-center gap-3">
                          {/* 金币显示 */}
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.3)' }}>
                            <span className="text-lg">💰</span>
                            <span className="text-sm font-bold">{block.rewards?.gold || 50}</span>
                          </div>

                          {/* 完成状态圆圈 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (block.status === 'completed') {
                                onTaskUpdate(block.id, { status: 'pending' });
                              } else {
                                handleQuickAction('complete', block.id);
                              }
                            }}
                            className="w-10 h-10 rounded-full border-3 flex items-center justify-center transition-all hover:scale-110"
                            style={{ 
                              backgroundColor: isCompleted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                              borderColor: 'rgba(255,255,255,0.8)',
                              borderWidth: '3px',
                            }}
                            title={isCompleted ? '取消完成' : '标记完成'}
                          >
                            {isCompleted && (
                              <Check className="w-6 h-6" style={{ color: block.color }} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Start按钮 */}
                      {!isCompleted && block.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('start', block.id);
                            }}
                            className="px-6 py-2 rounded-full font-bold text-base transition-all hover:scale-105"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              color: block.color,
                            }}
                          >
                            *start
                          </button>
                          
                          {/* 小三角展开按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardExpand(block.id);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          >
                            <span className="text-sm">{isExpanded ? '▲' : '▼'}</span>
                          </button>
                        </div>
                      )}

                      {/* 展开详情区 - 子任务与附件 */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '2px dashed rgba(255,255,255,0.3)' }}>
                          {/* 子任务列表 */}
                          <div className="space-y-2">
                            {task?.subtasks && task.subtasks.length > 0 ? (
                              task.subtasks.map((subtask) => (
                                <div 
                                  key={subtask.id} 
                                  className="flex items-center gap-3 pl-4 py-2 rounded-xl"
                                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('Toggle subtask:', subtask.id);
                                    }}
                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                    style={{ 
                                      borderColor: 'rgba(255,255,255,0.8)',
                                      backgroundColor: subtask.isCompleted ? 'rgba(255,255,255,0.9)' : 'transparent'
                                    }}
                                  >
                                    {subtask.isCompleted && (
                                      <Check className="w-3 h-3" style={{ color: block.color }} />
                                    )}
                                  </button>
                                  <span className={`text-sm flex-1 ${subtask.isCompleted ? 'line-through opacity-60' : ''}`}>
                                    {subtask.title}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <>
                                <div className="flex items-center gap-3 pl-4 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                  <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.8)' }}></div>
                                  <span className="text-sm">先收集两套穿搭图</span>
                                </div>
                                <div className="flex items-center gap-3 pl-4 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                  <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.8)' }}></div>
                                  <span className="text-sm">更收集两套场景动作图</span>
                                </div>
                                <div className="flex items-center gap-3 pl-4 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                  <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.8)' }}></div>
                                  <span className="text-sm">把穿搭图换成正面站立的动作以及平头</span>
                                </div>
                                <div className="flex items-center gap-3 pl-4 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                  <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.8)' }}></div>
                                  <span className="text-sm">把服装穿在准备好的模特身上</span>
                                </div>
                                <div className="flex items-center gap-3 pl-4 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                  <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.8)' }}></div>
                                  <span className="text-sm">使用换好衣服的模特换背景和动作</span>
                                </div>
                              </>
                            )}
                            
                            {/* 添加子任务按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('添加子任务');
                              }}
                              className="w-full py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                              + 添加子任务
                            </button>
                          </div>

                          {/* 拖拽添加文件区域 */}
                          <div 
                            className="rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-80"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              border: '2px dashed rgba(255,255,255,0.4)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('上传文件');
                            }}
                          >
                            <Plus className="w-8 h-8 mb-2 opacity-60" />
                            <span className="text-sm font-medium opacity-80">拖拽添加文件</span>
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
                const hours = Math.floor(Math.abs(gap.durationMinutes) / 60);
                const minutes = Math.round(Math.abs(gap.durationMinutes) % 60);
                let gapText = '';
                if (gap.durationMinutes < 0) {
                  gapText = '时间重叠';
                } else if (hours > 0) {
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
                      top: `${gap.topPx}px`,
                      height: `${gap.heightPx}px`,
                      minHeight: '60px',
                    }}
                  >
                    {/* 悬浮的快速添加按钮 */}
                    <button
                      onClick={() => {
                        const newTask = {
                          title: '新任务',
                          scheduledStart: gap.startTime.toISOString(),
                          durationMinutes: Math.max(15, Math.round(gap.durationMinutes)),
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
                          {gap.durationMinutes < 0 ? '视觉间隔' : '空闲时间'}
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
