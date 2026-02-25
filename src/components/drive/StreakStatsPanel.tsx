import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';
import { useDriveStore } from '@/stores/driveStore';

export default function StreakStatsPanel() {
  const { winStreak } = useDriveStore();

  // 计算统计数据
  const stats = [
    {
      icon: <TrendingUp size={24} />,
      label: '当前连胜',
      value: winStreak.currentStreak,
      unit: '天',
      color: 'from-orange-400 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      emoji: '🔥',
    },
    {
      icon: <Award size={24} />,
      label: '最长连胜',
      value: winStreak.longestStreak,
      unit: '天',
      color: 'from-green-400 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      emoji: '🏆',
    },
    {
      icon: <Target size={24} />,
      label: '今日进度',
      value: winStreak.todayCompleted,
      unit: '/3',
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      emoji: '🎯',
    },
    {
      icon: <Zap size={24} />,
      label: '保护卡',
      value: winStreak.streakProtectionCards,
      unit: '张',
      color: 'from-purple-400 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      emoji: '🛡️',
    },
  ];

  // 计算进度百分比
  const progressPercentage = Math.min(100, (winStreak.todayCompleted / 3) * 100);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">连胜统计</h3>
        {winStreak.currentStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
            <span className="text-2xl">🔥</span>
            <span className="text-sm font-bold text-orange-700">
              {winStreak.currentStreak}天连胜
            </span>
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className={`bg-gradient-to-r ${stat.bgColor} rounded-xl p-4 border-2 border-gray-200`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-3xl">{stat.emoji}</span>
            </div>
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-sm text-gray-500">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 今日进度条 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">今日任务进度</span>
          <span className="text-sm text-gray-500">
            {winStreak.todayCompleted}/3 完成
          </span>
        </div>
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {progressPercentage >= 100 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <span className="text-white font-bold text-xs drop-shadow">
                ✅ 已达成
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* 连胜状态提示 */}
      {winStreak.currentStreak === 0 ? (
        <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            💡 完成3个任务即可开启连胜！
          </p>
        </div>
      ) : winStreak.todayCompleted < 3 ? (
        <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
          <p className="text-sm text-yellow-800 text-center font-semibold">
            ⚠️ 今天还需完成 {3 - winStreak.todayCompleted} 个任务才能保持连胜！
          </p>
        </div>
      ) : (
        <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
          <p className="text-sm text-green-800 text-center font-semibold">
            ✅ 今日目标已达成！连胜继续保持！
          </p>
        </div>
      )}

      {/* 下一个里程碑 */}
      {winStreak.currentStreak > 0 && winStreak.currentStreak < 100 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-600 mb-1">下一个里程碑</div>
              <div className="font-bold text-purple-900">
                {winStreak.currentStreak < 7 && '7天连胜 🏆'}
                {winStreak.currentStreak >= 7 && winStreak.currentStreak < 30 && '30天连胜 🥇'}
                {winStreak.currentStreak >= 30 && winStreak.currentStreak < 100 && '100天连胜 👑'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-purple-600 mb-1">还需</div>
              <div className="text-2xl font-black text-purple-600">
                {winStreak.currentStreak < 7 && `${7 - winStreak.currentStreak}天`}
                {winStreak.currentStreak >= 7 && winStreak.currentStreak < 30 && `${30 - winStreak.currentStreak}天`}
                {winStreak.currentStreak >= 30 && winStreak.currentStreak < 100 && `${100 - winStreak.currentStreak}天`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 传奇成就 */}
      {winStreak.currentStreak >= 100 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300">
          <div className="text-center">
            <div className="text-4xl mb-2">👑</div>
            <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
              传奇成就已达成！
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              你是真正的自律大师！
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

