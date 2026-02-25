import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Medal, Crown } from 'lucide-react';
import Confetti from 'react-confetti';

interface WinStreakRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays: number;
  reward: number;
}

export default function WinStreakRewardModal({ 
  isOpen, 
  onClose, 
  streakDays,
  reward 
}: WinStreakRewardModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // 5秒后停止彩带
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 根据天数获取图标和颜色
  const getRewardInfo = () => {
    if (streakDays >= 100) {
      return {
        icon: <Crown size={80} />,
        color: 'from-yellow-400 to-orange-500',
        title: '传奇成就',
        emoji: '👑',
        message: '你已经连续100天保持自律！你是真正的传奇！',
      };
    } else if (streakDays >= 30) {
      return {
        icon: <Medal size={80} />,
        color: 'from-orange-400 to-red-500',
        title: '自律大师',
        emoji: '🥇',
        message: '你已经连续30天保持自律！你是自律大师！',
      };
    } else if (streakDays >= 7) {
      return {
        icon: <Trophy size={80} />,
        color: 'from-green-400 to-emerald-500',
        title: '坚持不懈',
        emoji: '🏆',
        message: '你已经连续7天保持自律！继续保持！',
      };
    }
    return {
      icon: <Trophy size={80} />,
      color: 'from-blue-400 to-cyan-500',
      title: '连胜奖励',
      emoji: '🎉',
      message: `你已经连续${streakDays}天保持自律！`,
    };
  };

  const rewardInfo = getRewardInfo();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 彩带效果 */}
          {showConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={500}
              gravity={0.3}
            />
          )}

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
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* 头部 - 渐变背景 */}
              <div className={`bg-gradient-to-r ${rewardInfo.color} text-white p-8 relative`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>

                {/* 图标动画 */}
                <motion.div
                  className="flex justify-center mb-4"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  <div className="text-8xl">
                    {rewardInfo.emoji}
                  </div>
                </motion.div>

                <h2 className="text-3xl font-black text-center mb-2">
                  {rewardInfo.title}
                </h2>
                <p className="text-center text-white/90 text-lg">
                  连续 {streakDays} 天自律
                </p>
              </div>

              {/* 内容 */}
              <div className="p-8">
                {/* 祝贺消息 */}
                <div className="text-center mb-6">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {rewardInfo.message}
                  </p>
                </div>

                {/* 奖励展示 */}
                <motion.div
                  className={`bg-gradient-to-r ${rewardInfo.color} rounded-2xl p-6 mb-6`}
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  <div className="text-center">
                    <div className="text-white/80 text-sm mb-2">获得奖励</div>
                    <div className="text-5xl font-black text-white mb-2">
                      +{reward} 💰
                    </div>
                    <div className="text-white/80 text-sm">金币已自动添加到余额</div>
                  </div>
                </motion.div>

                {/* 下一个目标 */}
                {streakDays < 100 && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="text-center">
                      <div className="text-gray-600 text-sm mb-2">下一个目标</div>
                      <div className="flex items-center justify-center gap-2">
                        {streakDays < 7 && (
                          <>
                            <Trophy size={20} className="text-green-500" />
                            <span className="font-bold text-gray-900">7天连胜</span>
                            <span className="text-gray-500">+200💰</span>
                          </>
                        )}
                        {streakDays >= 7 && streakDays < 30 && (
                          <>
                            <Medal size={20} className="text-orange-500" />
                            <span className="font-bold text-gray-900">30天连胜</span>
                            <span className="text-gray-500">+1000💰</span>
                          </>
                        )}
                        {streakDays >= 30 && streakDays < 100 && (
                          <>
                            <Crown size={20} className="text-yellow-500" />
                            <span className="font-bold text-gray-900">100天连胜</span>
                            <span className="text-gray-500">+5000💰</span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        还需 {streakDays < 7 ? 7 - streakDays : streakDays < 30 ? 30 - streakDays : 100 - streakDays} 天
                      </div>
                    </div>
                  </div>
                )}

                {/* 鼓励语 */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800 text-center font-semibold">
                    💪 继续保持！每天完成3个任务即可延续连胜
                  </p>
                </div>

                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className={`w-full py-4 rounded-xl text-white font-bold text-lg bg-gradient-to-r ${rewardInfo.color} hover:opacity-90 transition-opacity`}
                >
                  太棒了！继续加油 🔥
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

