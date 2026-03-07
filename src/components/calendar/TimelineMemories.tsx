import React from 'react';
import { useMemoryStore } from '@/stores/memoryStore';
import EventCard from './EventCard';

interface TimelineMemoriesProps {
  date: Date;
}

/**
 * 时间轴上的记忆显示
 * 显示指定日期的碎碎念和事件
 */
export default function TimelineMemories({ date }: TimelineMemoriesProps) {
  const memories = useMemoryStore(state => state.memories);
  
  // 过滤当天的记录
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const todayMemories = memories.filter(memory => {
    const memoryDate = new Date(memory.date);
    memoryDate.setHours(0, 0, 0, 0);
    return memoryDate.getTime() === targetDate.getTime();
  });
  
  if (todayMemories.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
        💭 今日记录
      </h3>
      {todayMemories.map(memory => (
        <EventCard
          key={memory.id}
          type={memory.type}
          content={memory.content}
          emotionTags={memory.emotionTags}
          categoryTags={memory.categoryTags}
          date={memory.date}
          rewards={memory.rewards}
        />
      ))}
    </div>
  );
}

