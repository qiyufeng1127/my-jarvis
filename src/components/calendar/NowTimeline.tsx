import { useState, useEffect, useRef, useMemo } from 'react';

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
  const [topPosition, setTopPosition] = useState<number | null>(null);
  const nowLineRef = useRef<HTMLDivElement>(null);
  // 已禁用自动滚动功能，用户可以手动滚动到任意位置
  
  // 🔧 使用useMemo稳定timeBlocks的引用，避免无限循环
  const stableTimeBlocks = useMemo(() => {
    return timeBlocks.map(block => ({
      id: block.id,
      startTime: block.startTime.getTime(),
      endTime: block.endTime.getTime(),
      title: block.title,
    }));
  }, [timeBlocks]);

  // 每秒更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 计算NOW线的精确位置（像素值）
  useEffect(() => {
    const now = currentTime.getTime();
    
    // 如果没有任务，不显示
    if (stableTimeBlocks.length === 0) {
      setTopPosition(null);
      return;
    }

    const firstTask = stableTimeBlocks[0];
    const lastTask = stableTimeBlocks[stableTimeBlocks.length - 1];
    
    const dayStart = firstTask.startTime;
    const dayEnd = lastTask.endTime;

    // 如果当前时间在第一个任务之前，显示在顶部
    if (now < dayStart) {
      setTopPosition(0);
      return;
    }

    // 如果当前时间在最后一个任务之后，显示在最后任务下方
    if (now > dayEnd) {
      let totalHeight = 0;
      for (let i = 0; i < stableTimeBlocks.length; i++) {
        const block = stableTimeBlocks[i];
        const taskContainer = document.querySelector(`[data-task-id="${block.id}"]`)?.parentElement;
        const containerHeight = taskContainer ? taskContainer.getBoundingClientRect().height : 120;
        totalHeight += containerHeight;
      }
      
      setTopPosition(totalHeight);
      return;
    }

    let accumulatedTop = 0;
    
    for (let i = 0; i < stableTimeBlocks.length; i++) {
      const block = stableTimeBlocks[i];
      const blockStart = block.startTime;
      const blockEnd = block.endTime;
      const taskContainer = document.querySelector(`[data-task-id="${block.id}"]`)?.parentElement;
      
      if (!taskContainer) {
        const defaultHeight = 120;
        
        if (now >= blockStart && now <= blockEnd) {
          const blockDuration = blockEnd - blockStart;
          const elapsed = now - blockStart;
          const progress = elapsed / blockDuration;
          const position = accumulatedTop + (progress * defaultHeight);
          setTopPosition(position);
          return;
        }
        
        accumulatedTop += defaultHeight + 12;
        continue;
      }
      
      const containerHeight = taskContainer.getBoundingClientRect().height;
      
      if (now >= blockStart && now <= blockEnd) {
        const blockDuration = blockEnd - blockStart;
        const elapsed = now - blockStart;
        const progress = elapsed / blockDuration;
        const position = accumulatedTop + (progress * containerHeight);
        setTopPosition(position);
        return;
      }
      
      accumulatedTop += containerHeight;
      
      if (i < stableTimeBlocks.length - 1) {
        const nextBlock = stableTimeBlocks[i + 1];
        const gapEnd = nextBlock.startTime;
        
        if (now > blockEnd && now < gapEnd) {
          setTopPosition(accumulatedTop);
          return;
        }
      }
    }
    
    setTopPosition(null);
  }, [currentTime, stableTimeBlocks]);

  // 始终显示 NOW 线
  if (topPosition === null) {
    return null;
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div 
      ref={nowLineRef}
      className="absolute left-0 right-0 z-40 pointer-events-none"
      style={{ 
        top: `${topPosition}px`,
      }}
    >
      {/* NOW线 */}
      <div className="relative flex items-center">
        {/* 玫粉色线条 */}
        <div 
          className="flex-1 h-0.5 shadow-lg"
          style={{ 
            backgroundColor: '#FB9FC9',
            boxShadow: '0 0 8px rgba(251, 159, 201, 0.5)',
          }}
        />

        {/* 右侧时间显示 */}
        <div 
          className="ml-2 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap pointer-events-auto"
          style={{ 
            backgroundColor: '#FB9FC9',
            color: '#ffffff',
          }}
        >
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  );
}

