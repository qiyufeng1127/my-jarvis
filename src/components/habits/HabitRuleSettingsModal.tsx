import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useHabitStore } from '@/stores/habitStore';

interface HabitRuleSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HabitRuleSettingsModal({ open, onClose }: HabitRuleSettingsModalProps) {
  const autoGenerationRule = useHabitStore((state) => state.autoGenerationRule);
  const updateAutoGenerationRule = useHabitStore((state) => state.updateAutoGenerationRule);
  
  const [enabled, setEnabled] = useState(autoGenerationRule.enabled);
  const [dailyThreshold, setDailyThreshold] = useState(autoGenerationRule.dailyThreshold);
  const [weeklyThreshold, setWeeklyThreshold] = useState(autoGenerationRule.weeklyThreshold);
  const [weeklyMinCount, setWeeklyMinCount] = useState(autoGenerationRule.weeklyMinCount);
  const [monthlyThreshold, setMonthlyThreshold] = useState(autoGenerationRule.monthlyThreshold);
  const [monthlyMinCount, setMonthlyMinCount] = useState(autoGenerationRule.monthlyMinCount);
  
  const handleSave = () => {
    updateAutoGenerationRule({
      enabled,
      dailyThreshold,
      weeklyThreshold,
      weeklyMinCount,
      monthlyThreshold,
      monthlyMinCount,
    });
    onClose();
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
              className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI 识别规则设置
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* 启用开关 */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      启用 AI 自动识别
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      根据时间轴上的任务自动识别潜在习惯
                    </p>
                  </div>
                  <button
                    onClick={() => setEnabled(!enabled)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      enabled
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <motion.div
                      animate={{ x: enabled ? 28 : 0 }}
                      className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
                
                {enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    {/* 日习惯规则 */}
                    <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">☀️</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          日习惯识别规则
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            连续天数阈值
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="2"
                              max="10"
                              value={dailyThreshold}
                              onChange={(e) => setDailyThreshold(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                              {dailyThreshold}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            连续 {dailyThreshold} 天每天都做，生成日习惯候选
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 周习惯规则 */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">📅</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          周习惯识别规则
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            连续周数阈值
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="2"
                              max="8"
                              value={weeklyThreshold}
                              onChange={(e) => setWeeklyThreshold(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                              {weeklyThreshold}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            连续 {weeklyThreshold} 周达标，生成周习惯候选
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            每周最少次数
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="1"
                              max="7"
                              value={weeklyMinCount}
                              onChange={(e) => setWeeklyMinCount(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                              {weeklyMinCount}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            每周至少做 {weeklyMinCount} 次才算达标
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 月习惯规则 */}
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🗓️</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          月习惯识别规则
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            连续月数阈值
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="2"
                              max="6"
                              value={monthlyThreshold}
                              onChange={(e) => setMonthlyThreshold(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                              {monthlyThreshold}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            连续 {monthlyThreshold} 月达标，生成月习惯候选
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            每月最少次数
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="4"
                              max="20"
                              value={monthlyMinCount}
                              onChange={(e) => setMonthlyMinCount(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                              {monthlyMinCount}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            每月至少做 {monthlyMinCount} 次才算达标
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* 保存按钮 */}
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all"
                >
                  <Save className="w-5 h-5" />
                  <span>保存设置</span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


