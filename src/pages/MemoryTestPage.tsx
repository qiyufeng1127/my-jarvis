import React from 'react';
import { useMemoryStore } from '@/stores/memoryStore';
import EventCard from '@/components/calendar/EventCard';

/**
 * 测试页面 - 显示所有记忆记录
 */
export default function MemoryTestPage() {
  const memories = useMemoryStore(state => state.memories);
  const addMemory = useMemoryStore(state => state.addMemory);
  
  // 手动添加测试数据
  const handleAddTest = () => {
    addMemory({
      type: 'thought',
      content: '测试碎碎念 - 今天心情不错',
      emotionTags: ['happy', 'calm'],
      categoryTags: ['life'],
      rewards: {
        gold: 5,
        growth: 2,
      },
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            记忆记录测试
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            共 {memories.length} 条记录
          </p>
          
          <button
            onClick={handleAddTest}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            添加测试数据
          </button>
        </div>
        
        {memories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            还没有任何记录
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map(memory => (
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
        )}
        
        {/* 调试信息 */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">调试信息</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(memories, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

