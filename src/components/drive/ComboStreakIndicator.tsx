import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriveStore } from '@/stores/driveStore';

export default function ComboStreakIndicator() {
  const { comboStreak, checkComboTimeout } = useDriveStore();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    // 每秒检查连击超时
    const interval = setInterval(() => {
      checkComboTimeout();
      
      // 计算剩余时间
      if (comboStreak.lastCompletedTime) {
        const now = new Date();
        const elapsed = (now.getTime() - comboStreak.lastCompletedTime.getTime()) / 1000;
        const remaining = Math.max(0, 30 * 60 - elapsed); // 30分钟
        setTimeLeft(Math.floor(remaining / 60));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [comboStreak.lastCompletedTime, checkComboTimeout]);

  if (!comboStreak.isActive || comboStreak.count === 0) {
    return null;
  }

  // 根据连击数显示不同颜色
  const getColor = () => {
    if (comboStreak.count >= 10) return 'from-red-500 to-orange-500';
    if (comboStreak.count >= 5) return 'from-orange-500 to-yellow-500';
    if (comboStreak.count >= 3) return 'from-yellow-500 to-green-500';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-20 right-4 z-50"
        initial={{ scale: 0, opacity: 0, x: 100 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0, opacity: 0, x: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className={`bg-gradient-to-r ${getColor()} text-white px-6 py-3 rounded-full shadow-2xl`}>
          <div className="flex items-center gap-3">
            {/* 火焰图标 */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="text-3xl"
            >
              🔥
            </motion.div>

            {/* 连击信息 */}
            <div>
              <div className="text-2xl font-black">
                {comboStreak.count}连击
              </div>
              <div className="text-xs opacity-90">
                倍率 x{comboStreak.multiplier.toFixed(1)} · {timeLeft}分钟后失效
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <motion.div
            className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden"
            initial={{ width: '100%' }}
          >
            <motion.div
              className="h-full bg-white"
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 30) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

