import React from 'react';
import { motion } from 'framer-motion';
import { useGoldStore } from '@/stores/goldStore';
import { useDriveStore } from '@/stores/driveStore';

export default function DailyGoldProgress() {
  const { balance, todayEarned } = useGoldStore();
  const { dailyCost } = useDriveStore();

  // 每日目标：200金币（覆盖生存成本50 + 盈余150）
  const dailyTarget = 200;
  const progress = Math.min(100, (todayEarned / dailyTarget) * 100);

  // 根据进度显示不同颜色
  const getColor = () => {
    if (todayEarned >= 200) return 'from-yellow-400 to-orange-500'; // 富裕
    if (todayEarned >= 150) return 'from-green-400 to-emerald-500'; // 安全
    if (todayEarned >= 50) return 'from-yellow-500 to-amber-500'; // 警告
    return 'from-red-500 to-rose-600'; // 危险
  };

  const getStatusText = () => {
    if (todayEarned >= 200) return '💰 富裕';
    if (todayEarned >= 150) return '✅ 安全';
    if (todayEarned >= 50) return '⚠️ 警告';
    return '🚨 危险';
  };

  const getStatusEmoji = () => {
    if (todayEarned >= 200) return '🤑';
    if (todayEarned >= 150) return '😊';
    if (todayEarned >= 50) return '😰';
    return '😱';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-100">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusEmoji()}</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">今日金币目标</h3>
            <p className="text-xs text-gray-500">
              {todayEarned} / {dailyTarget} 💰
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* 进度条 */}
      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getColor()} flex items-center justify-end px-3`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {progress > 20 && (
            <span className="text-white font-bold text-sm drop-shadow">
              {Math.round(progress)}%
            </span>
          )}
        </motion.div>
      </div>

      {/* 详细信息 */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">当前余额</div>
          <div className="text-lg font-bold text-gray-900">{balance}💰</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <div className="text-xs text-green-600">今日收入</div>
          <div className="text-lg font-bold text-green-700">+{todayEarned}💰</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2">
          <div className="text-xs text-red-600">生存成本</div>
          <div className="text-lg font-bold text-red-700">-{dailyCost.amount}💰</div>
        </div>
      </div>

      {/* 提示信息 */}
      {todayEarned < dailyCost.amount && (
        <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-xs text-red-800 text-center font-semibold">
            ⚠️ 今日收入不足以支付生存成本！请尽快完成任务赚取金币
          </p>
        </div>
      )}

      {todayEarned >= dailyTarget && (
        <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center font-semibold">
            🎉 恭喜！今日目标已达成，继续保持！
          </p>
        </div>
      )}
    </div>
  );
}

