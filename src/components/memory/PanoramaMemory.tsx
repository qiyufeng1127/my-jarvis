import { useState } from 'react';
import DiarySystem from './DiarySystem';
import MemoryList from './MemoryList';
import { MessageCircle, BookOpen } from 'lucide-react';

interface PanoramaMemoryProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function PanoramaMemory({ isDark = false, bgColor = '#ffffff' }: PanoramaMemoryProps) {
  const [activeTab, setActiveTab] = useState<'memories' | 'diary'>('memories');
  
  return (
    <div className="h-full flex flex-col">
      {/* 标签页切换 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          onClick={() => setActiveTab('memories')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'memories'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>碎碎念</span>
        </button>
        
        <button
          onClick={() => setActiveTab('diary')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'diary'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>日记系统</span>
        </button>
      </div>
      
      {/* 内容区 */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'memories' ? (
          <div className="p-4">
            <MemoryList />
          </div>
        ) : (
          <DiarySystem isDark={isDark} bgColor={bgColor} />
        )}
      </div>
    </div>
  );
}

