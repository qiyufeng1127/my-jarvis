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
  const [topPosition, setTopPosition] = useState<number | null>(null);

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

  // 计算NOW线的精确位置（像素值）
  useEffect(() => {
    if (timeBlocks.length === 0) {
      setTopPosition(null);
      return;
    }

    const now = currentTime.getTime();
    const firstTask = timeBlocks[0];
    const lastTask = timeBlocks[timeBlocks.length - 1];
    
    const dayStart = firstTask.startTime.getTime();
    const dayEnd = lastTask.endTime.getTime();

    // 如果当前时间在任务范围之外，不显示
    if (now < dayStart || now > dayEnd) {
      setTopPosition(null);
      return;
    }

    // 使用 DOM 测量来获取实际的卡片位置
    let accumulatedTop = 0;
    
    for (let i = 0; i < timeBlocks.length; i++) {
      const block = timeBlocks[i];
      const blockStart = block.startTime.getTime();
      const blockEnd = block.endTime.getTime();
      
      // 尝试获取实际的 DOM 元素高度
      const cardElement = document.querySelector(`[data-task-id="${block.id}"]`);
      const actualCardHeight = cardElement ? cardElement.getBoundingClientRect().height : 120;
      
      // 如果当前时间在这个任务块内
      if (now >= blockStart && now <= blockEnd) {
        const blockDuration = blockEnd - blockStart;
        const elapsed = now - blockStart;
        const progress = elapsed / blockDuration;
        
        const cardTop = accumulatedTop + (progress * actualCardHeight);
        
        setTopPosition(cardTop);
        return;
      }
      
      // 累加已经过去的任务卡片高度
      accumulatedTop += actualCardHeight + 12; // 卡片高度 + 间距 (mb-0 实际上有默认间距)
      
      // 检查是否在间隔中
      if (i < timeBlocks.length - 1) {
        const nextBlock = timeBlocks[i + 1];
        const gapStart = blockEnd;
        const gapEnd = nextBlock.startTime.getTime();
        
        if (now >= gapStart && now < gapEnd) {
          const gapDuration = gapEnd - gapStart;
          const gapElapsed = now - gapStart;
          const gapProgress = gapElapsed / gapDuration;
          
          // 间隔区域高度约 40px
          const gapHeight = 40;
          const gapTop = accumulatedTop + (gapProgress * gapHeight);
          
          setTopPosition(gapTop);
          return;
        }
        
        accumulatedTop += 40; // 间隔高度
      }
    }
    
    setTopPosition(null);
  }, [currentTime, timeBlocks]);

  if (topPosition === null) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div 
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

