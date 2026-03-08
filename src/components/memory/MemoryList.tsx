import React from 'react';
import { useMemoryStore, EMOTION_TAGS, CATEGORY_TAGS } from '@/stores/memoryStore';
import EventCard from '@/components/calendar/EventCard';

interface MemoryListProps {
  date?: Date; // 如果提供日期，只显示该日期的记录
  limit?: number; // 限制显示数量
}

/**
 * 记忆列表 - 显示碎碎念和事件记录
 */
export default function MemoryList({ date, limit }: MemoryListProps) {
  const memories = useMemoryStore(state => state.memories);
  
  // 过滤记录
  let filteredMemories = memories;
  
  if (date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    filteredMemories = memories.filter(memory => {
      const memoryDate = new Date(memory.date);
      memoryDate.setHours(0, 0, 0, 0);
      return memoryDate.getTime() === targetDate.getTime();
    });
  }
  
  // 限制数量
  if (limit) {
    filteredMemories = filteredMemories.slice(0, limit);
  }
  
  if (filteredMemories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {date ? '这一天还没有记录' : '还没有任何记录'}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredMemories.map(memory => (
        <EventCard
          key={memory.id}
          type={memory.type}
          content={memory.content}
          emotionTags={memory.emotionTags}
          categoryTags={memory.categoryTags}
          date={new Date(memory.date)}
          rewards={memory.rewards}
        />
      ))}
    </div>
  );
}

