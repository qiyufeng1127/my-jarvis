import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2, Calendar, TrendingUp, Award, Plus, Minus } from 'lucide-react';
import { useHabitStore } from '@/stores/habitStore';
import type { Habit } from '@/types/habit';

interface HabitDetailModalProps {
  habitId: string;
  open: boolean;
  onClose: () => void;
}

export default function HabitDetailModal({ habitId, open, onClose }: HabitDetailModalProps) {
  const habit = useHabitStore((state) => state.getHabitById(habitId));
  const logs = useHabitStore((state) => state.getLogsForHabit(habitId));
  const calculateHabitStats = useHabitStore((state) => state.calculateHabitStats);
  const logHabit = useHabitStore((state) => state.logHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const archiveHabit = useHabitStore((state) => state.archiveHabit);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'stats'>('overview');
  const [logValue, setLogValue] = useState(1);
  
  if (!habit) return null;
  
  const weekStats = useMemo(() => calculateHabitStats(habitId, 'week'), [habitId, logs]);
  const monthStats = useMemo(() => calculateHabitStats(habitId, 'month'), [habitId, logs]);
  
  const handleLog = () => {
    logHabit(habitId, logValue);
    setLogValue(1);
  };
  
  const handleDelete = () => {
    if (confirm('确定要删除这个习惯吗？')) {
      deleteHabit(habitId);
      onClose();
    }
  };
  
  const handleArchive = () => {
    if (confirm('确定要归档这个习惯吗？')) {
      archiveHabit(habitId);
      onClose();
    }
  };
  
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* 弹窗内容 */}
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl w-full md:max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
                    {habit.emoji}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {habit.name}
                    </h2>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <span>
                        {habit.frequency === 'daily' && '每日'}
                        {habit.frequency === 'weekly' && '每周'}
                        {habit.frequency === 'monthly' && '每月'}
                        {habit.frequency === 'yearly' && '每年'}
                      </span>
                      <span>•</span>
                      <span>
                        目标 {habit.targetValue}
                        {habit.type === 'duration' && ' 分钟'}
                        {habit.type === 'count' && ' 次'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              
              {/* 统计卡片 */}
              <div className="px-6 py-4 grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {habit.currentStreak}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    当前连续
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {habit.longestStreak}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    最长连续
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {habit.totalCount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    总次数
                  </div>
                </div>
              </div>
              
              {/* 标签页 */}
              <div className="px-6 flex gap-2 border-b border-gray-200 dark:border-gray-800">
                {[
                  { id: 'overview' as const, label: '概览', icon: TrendingUp },
                  { id: 'calendar' as const, label: '日历', icon: Calendar },
                  { id: 'stats' as const, label: '统计', icon: Award },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* 内容区域 */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* 快速打卡 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        快速打卡
                      </h3>
                      
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setLogValue(Math.max(1, logValue - 1))}
                          className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md flex items-center justify-center transition-all"
                        >
                          <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        <input
                          type="number"
                          value={logValue}
                          onChange={(e) => setLogValue(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <button
                          onClick={() => setLogValue(logValue + 1)}
                          className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md flex items-center justify-center transition-all"
                        >
                          <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                      
                      <button
                        onClick={handleLog}
                        className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all"
                      >
                        记录 {logValue} {habit.type === 'duration' ? '分钟' : '次'}
                      </button>
                    </div>
                    
                    {/* 本周统计 */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        本周表现
                      </h3>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            完成率
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {weekStats.completionRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${weekStats.completionRate}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          />
                        </div>
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          已完成 {weekStats.completedDays} / {weekStats.totalDays} 天
                        </div>
                      </div>
                    </div>
                    
                    {/* 识别规则 */}
                    {habit.recognitionRule && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          识别关键词
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {habit.recognitionRule.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'calendar' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      最近30天
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                      {monthStats.dailyData.slice(-30).map((day) => (
                        <div
                          key={day.date}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${
                            day.completed
                              ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                              : day.value > 0
                              ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}
                        >
                          <div className="font-semibold">
                            {new Date(day.date).getDate()}
                          </div>
                          {day.value > 0 && (
                            <div className="text-[10px] opacity-80">
                              {day.value}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'stats' && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        本月统计
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">完成天数</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {monthStats.completedDays} 天
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">完成率</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {monthStats.completionRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">当前连续</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {monthStats.currentStreak} 天
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">最长连续</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {monthStats.longestStreak} 天
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 底部操作 */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex gap-3">
                <button
                  onClick={handleArchive}
                  className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  归档
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


