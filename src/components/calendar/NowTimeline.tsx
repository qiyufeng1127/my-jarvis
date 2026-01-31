import { useState, useEffect } from 'react';

interface NowTimelineProps {
  timeBlocks: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    title: string;
  }>;
  isDark: boolean;
}

export default function NowTimeline({ timeBlocks, isDark }: NowTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTask, setCurrentTask] = useState<string | null>(null);

  // 每秒更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 查找当前正在进行的任务
  useEffect(() => {
    const now = currentTime.getTime();
    const activeTask = timeBlocks.find(block => {
      const start = block.startTime.getTime();
      const end = block.endTime.getTime();
      return now >= start && now <= end;
    });

    setCurrentTask(activeTask ? activeTask.title : null);
  }, [currentTime, timeBlocks]);

  // 计算NOW线的位置（相对于第一个任务）
  const calculatePosition = () => {
    if (timeBlocks.length === 0) return null;

    const firstTask = timeBlocks[0];
    const lastTask = timeBlocks[timeBlocks.length - 1];
    
    const dayStart = firstTask.startTime.getTime();
    const dayEnd = lastTask.endTime.getTime();
    const now = currentTime.getTime();

    // 如果当前时间在任务范围之外，不显示
    if (now < dayStart || now > dayEnd) return null;

    // 计算百分比位置
    const totalDuration = dayEnd - dayStart;
    const elapsed = now - dayStart;
    const percentage = (elapsed / totalDuration) * 100;

    return percentage;
  };

  const position = calculatePosition();

  if (position === null) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const getTimeRange = () => {
    if (timeBlocks.length === 0) return '';
    
    const firstTask = timeBlocks[0];
    const lastTask = timeBlocks[timeBlocks.length - 1];
    
    const startTime = firstTask.startTime.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    const endTime = lastTask.endTime.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    return `${startTime} - ${endTime}`;
  };

  return (
    <div 
      className="fixed left-0 right-0 z-40 pointer-events-none"
      style={{ 
        top: `${position}%`,
        transform: 'translateY(-50%)',
      }}
    >
      {/* NOW线 */}
      <div className="relative">
        {/* 左上角时间信息 */}
        <div 
          className="absolute left-4 -top-8 px-3 py-1.5 rounded-lg shadow-lg pointer-events-auto"
          style={{ 
            backgroundColor: '#FB9FC9',
            color: '#ffffff',
          }}
        >
          <div className="text-xs font-bold mb-0.5">NOW</div>
          <div className="text-sm font-bold">{formatTime(currentTime)}</div>
          <div className="text-[10px] opacity-90 mt-0.5">{getTimeRange()}</div>
          {currentTask && (
            <div className="text-[10px] opacity-90 mt-1 border-t border-white/30 pt-1">
              📍 {currentTask}
            </div>
          )}
        </div>

        {/* 玫粉色线条 */}
        <div 
          className="w-full h-1 shadow-lg"
          style={{ 
            backgroundColor: '#FB9FC9',
            boxShadow: '0 0 10px rgba(251, 159, 201, 0.6)',
          }}
        />

        {/* 右侧箭头 */}
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2"
          style={{ 
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '10px solid #FB9FC9',
          }}
        />
      </div>
    </div>
  );
}

