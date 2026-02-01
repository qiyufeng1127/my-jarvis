import { useState } from 'react';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { Trophy, TrendingUp, DollarSign, Target, Clock } from 'lucide-react';

interface EfficiencyRankingProps {
  isDark?: boolean;
}

export default function EfficiencyRanking({ isDark = false }: EfficiencyRankingProps) {
  const { getRankedByHourlyRate, getRankedByROI, getRankedByProfit } = useSideHustleStore();
  const [rankingType, setRankingType] = useState<'hourlyRate' | 'roi' | 'profit'>('hourlyRate');

  // 增强对比度的颜色系统
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.9)' : '#333333';
  const cardBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';

  const getRankedList = () => {
    switch (rankingType) {
      case 'hourlyRate':
        return getRankedByHourlyRate();
      case 'roi':
        return getRankedByROI();
      case 'profit':
        return getRankedByProfit();
      default:
        return [];
    }
  };

  const rankedList = getRankedList();

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}️⃣`;
    }
  };

  const getRankingValue = (hustle: any) => {
    switch (rankingType) {
      case 'hourlyRate':
        return `¥${hustle.hourlyRate.toFixed(0)}/h`;
      case 'roi':
        return `${hustle.roi.toFixed(0)}%`;
      case 'profit':
        return `¥${hustle.profit.toLocaleString()}`;
      default:
        return '';
    }
  };

  return (
    <div
      className="p-6 rounded-xl"
      style={{ backgroundColor: cardBg }}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy size={24} style={{ color: '#f59e0b' }} />
          <h2 className="text-xl font-bold" style={{ color: textColor }}>
            副业效率排名
          </h2>
        </div>
        
        {/* 排名类型切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setRankingType('hourlyRate')}
            className="px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: rankingType === 'hourlyRate' ? `${textColor}20` : 'transparent',
              color: rankingType === 'hourlyRate' ? textColor : secondaryColor,
            }}
          >
            时薪
          </button>
          <button
            onClick={() => setRankingType('roi')}
            className="px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: rankingType === 'roi' ? `${textColor}20` : 'transparent',
              color: rankingType === 'roi' ? textColor : secondaryColor,
            }}
          >
            ROI
          </button>
          <button
            onClick={() => setRankingType('profit')}
            className="px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: rankingType === 'profit' ? `${textColor}20` : 'transparent',
              color: rankingType === 'profit' ? textColor : secondaryColor,
            }}
          >
            利润
          </button>
        </div>
      </div>

      {/* 排名列表 - 大字体、图表化 */}
      <div className="space-y-4">
        {rankedList.length === 0 ? (
          <div className="text-center py-8" style={{ color: secondaryColor }}>
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">还没有副业数据</p>
          </div>
        ) : (
          rankedList.map((hustle, index) => {
            // 计算进度条的最大值
            const maxHours = Math.max(...rankedList.map(h => h.totalHours));
            const maxIncome = Math.max(...rankedList.map(h => h.totalIncome));
            const timeProgress = maxHours > 0 ? (hustle.totalHours / maxHours) * 100 : 0;
            const incomeProgress = maxIncome > 0 ? (hustle.totalIncome / maxIncome) * 100 : 0;

            return (
              <div
                key={hustle.id}
                className="p-5 rounded-xl transition-all hover:scale-[1.02]"
                style={{ 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  border: index < 3 ? `3px solid ${hustle.color}60` : `2px solid ${hustle.color}30`,
                }}
              >
                {/* 排名和名称 - 大字体 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{getRankEmoji(index)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{hustle.icon}</span>
                      <span className="font-bold text-xl" style={{ color: textColor }}>
                        {hustle.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-medium" style={{ color: secondaryColor }}>
                      {rankingType === 'hourlyRate' && '时薪'}
                      {rankingType === 'roi' && 'ROI'}
                      {rankingType === 'profit' && '利润'}
                    </div>
                    <div className="text-3xl font-bold" style={{ color: hustle.color }}>
                      {getRankingValue(hustle)}
                    </div>
                  </div>
                </div>

                {/* 双色进度条 - 更粗、更明显 */}
                <div className="space-y-3">
                  {/* 时间进度条（绿色） */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={18} style={{ color: '#10b981' }} />
                        <span className="text-base font-semibold" style={{ color: textColor }}>时间</span>
                      </div>
                      <span className="text-base font-bold" style={{ color: '#10b981' }}>
                        {hustle.totalHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${timeProgress}%`,
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                        }}
                      />
                    </div>
                  </div>

                  {/* 收入进度条（粉色） */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign size={18} style={{ color: '#ec4899' }} />
                        <span className="text-base font-semibold" style={{ color: textColor }}>收入</span>
                      </div>
                      <span className="text-base font-bold" style={{ color: '#ec4899' }}>
                        ¥{hustle.totalIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${incomeProgress}%`,
                          backgroundColor: '#ec4899',
                          boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 其他指标 - 大字体 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t-2" style={{ borderColor: `${hustle.color}30` }}>
                  <div className="flex items-center gap-4 text-base font-medium" style={{ color: textColor }}>
                    <span>支出: <span className="font-bold">¥{hustle.totalExpense.toLocaleString()}</span></span>
                    <span>利润: <span className="font-bold">¥{hustle.profit.toLocaleString()}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} style={{ color: hustle.roi > 0 ? '#10b981' : '#ef4444' }} />
                    <span className="text-base font-bold" style={{ color: hustle.roi > 0 ? '#10b981' : '#ef4444' }}>
                      ROI {hustle.roi.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

