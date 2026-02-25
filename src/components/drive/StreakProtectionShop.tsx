import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShoppingCart, Info } from 'lucide-react';
import { useDriveStore } from '@/stores/driveStore';
import { useGoldStore } from '@/stores/goldStore';

export default function StreakProtectionShop() {
  const { winStreak, addStreakProtectionCard } = useDriveStore();
  const { balance, spendGold } = useGoldStore();
  const [showInfo, setShowInfo] = useState(false);

  const CARD_PRICE = 100; // 100金币一张

  const handleBuyCard = () => {
    if (balance < CARD_PRICE) {
      alert('⚠️ 金币不足！需要 100 金币才能购买连胜保护卡');
      return;
    }

    if (confirm(`确定花费 ${CARD_PRICE} 金币购买连胜保护卡吗？\n\n保护卡可以在连胜中断时自动使用，保护你的连胜不被中断。`)) {
      spendGold(CARD_PRICE, '购买连胜保护卡');
      addStreakProtectionCard();
      alert('✅ 购买成功！你现在拥有 ' + (winStreak.streakProtectionCards + 1) + ' 张连胜保护卡');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={24} />
          <h3 className="text-lg font-bold text-gray-900">连胜保护卡</h3>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Info size={20} className="text-gray-400" />
        </button>
      </div>

      {/* 说明信息 */}
      {showInfo && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
        >
          <p className="text-sm text-blue-800 mb-2">
            <strong>🛡️ 连胜保护卡的作用：</strong>
          </p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>当你某天未完成3个任务时，自动使用保护卡</li>
            <li>使用后，你的连胜不会中断</li>
            <li>每周最多使用1次</li>
            <li>适合应对突发情况（生病、加班等）</li>
          </ul>
        </motion.div>
      )}

      {/* 当前拥有 */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🛡️</div>
            <div>
              <div className="text-sm text-gray-600">当前拥有</div>
              <div className="text-2xl font-black text-blue-600">
                {winStreak.streakProtectionCards} 张
              </div>
            </div>
          </div>
          {winStreak.streakProtectionCards > 0 && (
            <div className="text-right">
              <div className="text-xs text-green-600 font-semibold">
                ✅ 已保护
              </div>
              <div className="text-xs text-gray-500">
                连胜安全
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 购买区域 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900 mb-1">
              购买连胜保护卡
            </div>
            <div className="text-sm text-gray-600">
              保护你的连胜不被中断
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-purple-600">
              {CARD_PRICE}💰
            </div>
            <div className="text-xs text-gray-500">
              每张
            </div>
          </div>
        </div>

        <button
          onClick={handleBuyCard}
          disabled={balance < CARD_PRICE}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} />
          {balance < CARD_PRICE ? '金币不足' : '立即购买'}
        </button>

        {balance < CARD_PRICE && (
          <div className="mt-3 text-xs text-center text-red-600">
            还需 {CARD_PRICE - balance} 金币
          </div>
        )}
      </div>

      {/* 使用建议 */}
      <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
        <p className="text-xs text-yellow-800 text-center">
          💡 <strong>建议：</strong>至少保留1张保护卡，以应对突发情况
        </p>
      </div>

      {/* 统计信息 */}
      {winStreak.currentStreak > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">当前连胜</div>
            <div className="text-xl font-bold text-orange-600">
              {winStreak.currentStreak}天
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">最长连胜</div>
            <div className="text-xl font-bold text-green-600">
              {winStreak.longestStreak}天
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

