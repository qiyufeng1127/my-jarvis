import { useState } from 'react';
import { Plus, Settings, TrendingUp, Calendar } from 'lucide-react';
import { useHabitStore } from '@/stores/habitStore';
import { motion, AnimatePresence } from 'framer-motion';
import HabitList from '@/components/habits/HabitList';
import AddHabitModal from '@/components/habits/AddHabitModal';
import HabitDetailModal from '@/components/habits/HabitDetailModal';
import HabitCandidateList from '@/components/habits/HabitCandidateList';
import HabitRuleSettingsModal from '@/components/habits/HabitRuleSettingsModal';

export default function HabitPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRuleSettings, setShowRuleSettings] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  
  const habits = useHabitStore((state) => state.habits);
  const candidates = useHabitStore((state) => 
    state.candidates.filter((c) => c.status === 'pending')
  );
  
  const filteredHabits = habits.filter((h) => {
    if (h.archivedAt) return false;
    if (activeTab === 'all') return true;
    return h.frequency === activeTab;
  });
  
  const tabs = [
    { id: 'all' as const, label: '所有', emoji: '📋' },
    { id: 'daily' as const, label: '日', emoji: '☀️' },
    { id: 'weekly' as const, label: '周', emoji: '📅' },
    { id: 'monthly' as const, label: '月', emoji: '🗓️' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-purple-900 pb-20">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                习惯追踪
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredHabits.length} 个习惯
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRuleSettings(true)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>添加习惯</span>
              </button>
            </div>
          </div>
          
          {/* 标签页 */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{tab.emoji}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* AI候选习惯 */}
        {candidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  AI 发现的习惯候选
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-medium">
                  {candidates.length}
                </span>
              </div>
              <HabitCandidateList candidates={candidates} />
            </div>
          </motion.div>
        )}
        
        {/* 习惯列表 */}
        {filteredHabits.length > 0 ? (
          <HabitList
            habits={filteredHabits}
            onHabitClick={(habitId) => setSelectedHabitId(habitId)}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              还没有习惯
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              开始添加你的第一个习惯吧
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all"
            >
              添加习惯
            </button>
          </motion.div>
        )}
      </div>
      
      {/* 添加习惯弹窗 */}
      <AddHabitModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      
      {/* 习惯详情弹窗 */}
      {selectedHabitId && (
        <HabitDetailModal
          habitId={selectedHabitId}
          open={!!selectedHabitId}
          onClose={() => setSelectedHabitId(null)}
        />
      )}
      
      {/* 规则设置弹窗 */}
      <HabitRuleSettingsModal
        open={showRuleSettings}
        onClose={() => setShowRuleSettings(false)}
      />
    </div>
  );
}


