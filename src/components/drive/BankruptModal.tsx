import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useDriveStore } from '@/stores/driveStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTaskStore } from '@/stores/taskStore';

interface BankruptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BankruptModal({ isOpen, onClose }: BankruptModalProps) {
  const { setBankruptStatus } = useDriveStore();
  const { addGold } = useGoldStore();
  const { createTask } = useTaskStore();
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // 紧急任务列表
  const emergencyTasks = [
    { title: '整理桌面', duration: 10, emoji: '🗂️' },
    { title: '喝一杯水', duration: 5, emoji: '💧' },
    { title: '深呼吸5分钟', duration: 5, emoji: '🧘' },
    { title: '整理书架', duration: 15, emoji: '📚' },
    { title: '清理垃圾桶', duration: 10, emoji: '🗑️' },
    { title: '擦拭显示器', duration: 10, emoji: '🖥️' },
  ];

  const handleCreateEmergencyTask = async (task: typeof emergencyTasks[0]) => {
    setIsCreatingTask(true);
    
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + task.duration * 60000);
      
      await createTask({
        title: `${task.emoji} 紧急任务：${task.title}`,
        description: '完成此任务可获得50金币，解除破产状态',
        taskType: 'life',
        priority: 1,
        durationMinutes: task.duration,
        scheduledStart: now,
        scheduledEnd: endTime,
        goldReward: 50,
        tags: ['紧急任务', '破产解救'],
      });
      
      // 直接给予50金币（因为是紧急任务）
      addGold(50, '完成紧急任务');
      
      // 解除破产状态
      setBankruptStatus(false);
      
      onClose();
      
      // 显示成功提示
      alert('✅ 紧急任务已创建！完成后即可解除破产状态。');
    } catch (error) {
      console.error('创建紧急任务失败:', error);
      alert('❌ 创建任务失败，请重试');
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* 头部 */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={32} />
                    <div>
                      <h2 className="text-2xl font-bold">破产警告</h2>
                      <p className="text-sm opacity-90 mt-1">金币余额不足</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-800 text-center font-semibold">
                    ⚠️ 你的金币余额不足以支付每日生存成本（50金币）
                  </p>
                  <p className="text-red-600 text-center text-sm mt-2">
                    所有功能已被锁定，请完成紧急任务赚取金币
                  </p>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  选择一个紧急任务：
                </h3>

                <div className="space-y-3">
                  {emergencyTasks.map((task, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleCreateEmergencyTask(task)}
                      disabled={isCreatingTask}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 rounded-xl transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{task.emoji}</span>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            ⏱️ {task.duration} 分钟
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          +50💰
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800 text-center">
                    💡 <strong>提示：</strong>完成任意一个紧急任务即可获得50金币，解除破产状态
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

