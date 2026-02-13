import { useState, useEffect, useRef } from 'react';

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
  const nowLineRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false); // 防止重复滚动

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
    const now = currentTime.getTime();
    
    // 如果没有任务，不显示
    if (timeBlocks.length === 0) {
      setTopPosition(null);
      return;
    }

    const firstTask = timeBlocks[0];
    const lastTask = timeBlocks[timeBlocks.length - 1];
    
    const dayStart = firstTask.startTime.getTime();
    const dayEnd = lastTask.endTime.getTime();

    console.log('🔍 NOW线计算:', {
      now: new Date(now).toLocaleString('zh-CN'),
      dayStart: new Date(dayStart).toLocaleString('zh-CN'),
      dayEnd: new Date(dayEnd).toLocaleString('zh-CN'),
      beforeStart: now < dayStart,
      afterEnd: now > dayEnd,
    });

    // 如果当前时间在第一个任务之前，显示在顶部
    if (now < dayStart) {
      console.log('✅ NOW线：显示在顶部');
      setTopPosition(0);
      return;
    }

    // 如果当前时间在最后一个任务之后，显示在最后任务下方
    if (now > dayEnd) {
      console.log('✅ NOW线：当前时间在最后任务之后，显示在底部');
      
      // 计算所有任务的总高度
      let totalHeight = 0;
      for (let i = 0; i < timeBlocks.length; i++) {
        const block = timeBlocks[i];
        const taskContainer = document.querySelector(`[data-task-id="${block.id}"]`)?.parentElement;
        const containerHeight = taskContainer ? taskContainer.getBoundingClientRect().height : 120;
        totalHeight += containerHeight;
      }
      
      setTopPosition(totalHeight);
      return;
    }

    // 遍历所有任务，找到当前时间所在的位置
    let accumulatedTop = 0;
    
    for (let i = 0; i < timeBlocks.length; i++) {
      const block = timeBlocks[i];
      const blockStart = block.startTime.getTime();
      const blockEnd = block.endTime.getTime();
      
      console.log(`  任务${i}: ${block.title}`, {
        start: new Date(blockStart).toLocaleString('zh-CN'),
        end: new Date(blockEnd).toLocaleString('zh-CN'),
        inRange: now >= blockStart && now <= blockEnd,
      });
      
      // 获取实际的 DOM 元素
      const taskContainer = document.querySelector(`[data-task-id="${block.id}"]`)?.parentElement;
      
      if (!taskContainer) {
        console.log(`  ⚠️ 找不到DOM元素: ${block.id}`);
        // 如果找不到 DOM 元素，使用默认高度
        const defaultHeight = 120;
        
        if (now >= blockStart && now <= blockEnd) {
          const blockDuration = blockEnd - blockStart;
          const elapsed = now - blockStart;
          const progress = elapsed / blockDuration;
          const position = accumulatedTop + (progress * defaultHeight);
          console.log(`✅ NOW线：在任务${i}内（默认高度），位置=${position}px`);
          setTopPosition(position);
          return;
        }
        
        accumulatedTop += defaultHeight + 12;
        continue;
      }
      
      // 使用实际的容器高度（包括时间标签）
      const containerHeight = taskContainer.getBoundingClientRect().height;
      console.log(`  容器高度: ${containerHeight}px`);
      
      // 如果当前时间在这个任务块内
      if (now >= blockStart && now <= blockEnd) {
        const blockDuration = blockEnd - blockStart;
        const elapsed = now - blockStart;
        const progress = elapsed / blockDuration;
        const position = accumulatedTop + (progress * containerHeight);
        
        console.log(`✅ NOW线：在任务${i}内，位置=${position}px (进度=${(progress*100).toFixed(1)}%)`);
        setTopPosition(position);
        return;
      }
      
      // 累加已经过去的任务容器高度
      accumulatedTop += containerHeight;
      
      // 如果在间隔中，显示在下一个任务的顶部
      if (i < timeBlocks.length - 1) {
        const nextBlock = timeBlocks[i + 1];
        const gapEnd = nextBlock.startTime.getTime();
        
        if (now > blockEnd && now < gapEnd) {
          // 在间隔中，显示在下一个任务的顶部
          console.log(`✅ NOW线：在间隔中，显示在任务${i+1}顶部，位置=${accumulatedTop}px`);
          setTopPosition(accumulatedTop);
          return;
        }
      }
    }
    
    // 默认不显示
    console.log('❌ NOW线：未找到合适位置，不显示');
    setTopPosition(null);
  }, [currentTime, timeBlocks]);

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

