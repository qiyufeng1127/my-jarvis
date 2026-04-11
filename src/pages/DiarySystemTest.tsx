import { useState } from 'react';
import DiarySystem from '@/components/memory/DiarySystem';
import { useMemoryStore } from '@/stores/memoryStore';
import { useTaskStore } from '@/stores/taskStore';

export default function DiarySystemTest() {
  const { addMemory } = useMemoryStore();
  const { createTask } = useTaskStore();

  // 添加测试数据
  const addTestData = () => {
    const today = new Date();
    
    // 添加一些测试记忆
    addMemory({
      type: 'mood',
      content: '今天心情不错，完成了很多工作',
      emotionTags: ['happy', 'proud'],
      categoryTags: ['work'],
      rewards: { gold: 10, growth: 5 }
    });

    addMemory({
      type: 'success',
      content: '成功完成了项目的核心功能开发',
      emotionTags: ['excited', 'proud'],
      categoryTags: ['work', 'startup'],
      rewards: { gold: 20, growth: 10 }
    });

    addMemory({
      type: 'thought',
      content: '感觉有点焦虑，担心项目进度',
      emotionTags: ['anxious', 'frustrated'],
      categoryTags: ['work'],
      rewards: { gold: 5, growth: 3 }
    });

    addMemory({
      type: 'success',
      content: '今天坚持运动了30分钟',
      emotionTags: ['happy', 'proud'],
      categoryTags: ['health'],
      rewards: { gold: 15, growth: 8 }
    });

    // 添加一些测试任务
    createTask({
      title: '开会讨论项目方案',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
      note: '与团队讨论下一步计划',
      status: 'completed',
      type: 'work'
    });

    createTask({
      title: '写代码实现新功能',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString(),
      note: '完成日记系统的开发',
      status: 'completed',
      type: 'work'
    });

    alert('测试数据已添加！');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📔 日记系统测试
            </h1>
            <p className="text-gray-600">
              测试内容结构分析、情绪链条和成功日记功能
            </p>
          </div>
          <button
            onClick={addTestData}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            添加测试数据
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <DiarySystem isDark={false} bgColor="#ffffff" />
        </div>
      </div>
    </div>
  );
}



































