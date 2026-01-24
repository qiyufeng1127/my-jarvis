import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import NotificationContainer from '@/components/ui/NotificationContainer';
import FloatingAIChat from '@/components/ai/FloatingAIChat';
import { VoiceAssistant, VoiceTutorial } from '@/components/voice';
import {
  GoalsModule,
  TimelineModule,
} from '@/components/dashboard/ModuleComponents';
import JournalModule from '@/components/journal/JournalModule';
import PanoramaMemory from '@/components/memory/PanoramaMemory';

type TabType = 'timeline' | 'goals' | 'journal' | 'memory' | 'more';

export default function MobileLayout() {
  const { loadTasks } = useTaskStore();
  const { loadGrowthData } = useGrowthStore();
  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  useEffect(() => {
    loadTasks();
    loadGrowthData();
  }, [loadTasks, loadGrowthData]);

  // 渲染当前激活的模块
  const renderActiveModule = () => {
    const moduleProps = {
      isDark: false,
      bgColor: '#ffffff',
    };

    switch (activeTab) {
      case 'timeline':
        return <TimelineModule {...moduleProps} />;
      case 'goals':
        return <GoalsModule {...moduleProps} />;
      case 'journal':
        return <JournalModule {...moduleProps} />;
      case 'memory':
        return <PanoramaMemory {...moduleProps} />;
      case 'more':
        return (
          <div className="p-4 space-y-3">
            <h2 className="text-xl font-bold mb-4">更多功能</h2>
            <div className="text-center text-neutral-500 py-8">
              <p>更多功能开发中...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* 通知容器 */}
      <NotificationContainer />

      {/* 顶部状态栏 */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          {/* 左侧：身份等级 */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50">
              <div className="text-lg">👑</div>
              <div className="text-xs">
                <div className="font-semibold text-black">萌芽新手 Lv.1</div>
              </div>
            </div>
            
            {/* 成长值 */}
            <div className="flex items-center space-x-1 px-2 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50">
              <div className="text-sm">📊</div>
              <div className="text-xs font-semibold text-black">0/200</div>
            </div>
          </div>

          {/* 右侧：金币余额 */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100/50">
            <div className="text-lg">💰</div>
            <div className="text-sm font-bold text-black">0</div>
          </div>
        </div>
      </div>

      {/* 主内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        {renderActiveModule()}
      </div>

      {/* 底部导航栏 */}
      <div className="bg-white border-t border-neutral-200 px-2 py-2 shrink-0 safe-area-bottom">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all ${
              activeTab === 'timeline'
                ? 'bg-blue-50 text-blue-600'
                : 'text-neutral-600'
            }`}
          >
            <span className="text-2xl mb-1">📅</span>
            <span className="text-xs font-medium">时间轴</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all ${
              activeTab === 'goals'
                ? 'bg-blue-50 text-blue-600'
                : 'text-neutral-600'
            }`}
          >
            <span className="text-2xl mb-1">🎯</span>
            <span className="text-xs font-medium">目标</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all ${
              activeTab === 'journal'
                ? 'bg-blue-50 text-blue-600'
                : 'text-neutral-600'
            }`}
          >
            <span className="text-2xl mb-1">📔</span>
            <span className="text-xs font-medium">日记</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all ${
              activeTab === 'memory'
                ? 'bg-blue-50 text-blue-600'
                : 'text-neutral-600'
            }`}
          >
            <span className="text-2xl mb-1">🧠</span>
            <span className="text-xs font-medium">记忆</span>
          </button>

          <button
            onClick={() => setActiveTab('more')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all ${
              activeTab === 'more'
                ? 'bg-blue-50 text-blue-600'
                : 'text-neutral-600'
            }`}
          >
            <span className="text-2xl mb-1">⚙️</span>
            <span className="text-xs font-medium">更多</span>
          </button>
        </div>
      </div>

      {/* Kiki 宝宝语音助手 - 移动端优化 */}
      <VoiceAssistant mode="float" />

      {/* 浮动AI聊天 - 移动端优化 */}
      <FloatingAIChat />

      {/* 语音助手教程 */}
      <VoiceTutorial />
    </div>
  );
}
