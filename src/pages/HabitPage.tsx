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
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1D1D1F' }}>
                习惯追踪
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                {filteredHabits.length} 个习惯
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRuleSettings(true)}
                className="p-2 rounded-xl transition-all active:scale-95"
                style={{
                  backgroundColor: '#F5F5F7',
                  color: 'rgba(60, 60, 67, 0.6)'
                }}
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm shadow-lg transition-all active:scale-95"
                style={{
                  backgroundColor: '#6D9978',
                  color: '#FFFFFF'
                }}
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
                className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all active:scale-95"
                style={{
                  backgroundColor: activeTab === tab.id ? '#DD617C' : '#F5F5F7',
                  color: activeTab === tab.id ? '#FFFFFF' : '#8E8E93',
                  fontWeight: activeTab === tab.id ? 600 : 500
                }}
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
            <div className="rounded-2xl p-4" style={{
              backgroundColor: '#FFF5E5'
            }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5" style={{ color: '#AC0327' }} />
                <h2 className="font-semibold" style={{ color: '#1D1D1F' }}>
                  AI 发现的习惯候选
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                  backgroundColor: '#E8C259',
                  color: '#000000'
                }}>
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
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#1D1D1F' }}>
              还没有习惯
            </h3>
            <p className="mb-6" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
              开始添加你的第一个习惯吧
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-full font-semibold text-sm shadow-lg transition-all active:scale-95"
              style={{
                backgroundColor: '#6D9978',
                color: '#FFFFFF'
              }}
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


