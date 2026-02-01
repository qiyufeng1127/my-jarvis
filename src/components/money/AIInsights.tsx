import { useSideHustleStore } from '@/stores/sideHustleStore';
import { Sparkles, TrendingUp, AlertTriangle, Target, Lightbulb } from 'lucide-react';

interface AIInsightsProps {
  isDark?: boolean;
}

export default function AIInsights({ isDark = false }: AIInsightsProps) {
  const { getActiveSideHustles, getRankedByHourlyRate, getTotalIncome } = useSideHustleStore();

  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const activeSideHustles = getActiveSideHustles();
  const rankedByHourlyRate = getRankedByHourlyRate();
  const totalIncome = getTotalIncome();

  // 生成 AI 洞察
  const generateInsights = () => {
    const insights = [];

    // 最佳副业推荐
    if (rankedByHourlyRate.length > 0) {
      const best = rankedByHourlyRate[0];
      insights.push({
        type: 'recommendation',
        icon: TrendingUp,
        color: '#10b981',
        title: '建议优先做',
        content: `"${best.name}"`,
        reason: `时薪最高 (¥${best.hourlyRate.toFixed(0)}/h)，ROI ${best.roi.toFixed(0)}%`,
      });
    }

    // 低效副业警告
    if (rankedByHourlyRate.length > 1) {
      const worst = rankedByHourlyRate[rankedByHourlyRate.length - 1];
      if (worst.hourlyRate < 50) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          color: '#f59e0b',
          title: '效率较低',
          content: `"${worst.name}"`,
          reason: `时薪仅 ¥${worst.hourlyRate.toFixed(0)}/h，建议优化或减少投入`,
        });
      }
    }

    // 收入预测
    const avgMonthlyIncome = totalIncome * 0.3; // 假设本月占30%
    const predictedIncome = avgMonthlyIncome * 1.2; // 预测增长20%
    insights.push({
      type: 'prediction',
      icon: Target,
      color: '#8b5cf6',
      title: '本月收入预测',
      content: `¥${predictedIncome.toLocaleString()}`,
      reason: '基于当前趋势，预计可达成目标',
    });

    // 优化建议
    if (activeSideHustles.length > 0) {
      const totalHours = activeSideHustles.reduce((sum, h) => sum + h.totalHours, 0);
      const avgHourlyRate = totalIncome / totalHours;
      insights.push({
        type: 'suggestion',
        icon: Lightbulb,
        color: '#3b82f6',
        title: '优化建议',
        content: '专注高时薪副业',
        reason: `当前平均时薪 ¥${avgHourlyRate.toFixed(0)}/h，可提升至 ¥${(avgHourlyRate * 1.5).toFixed(0)}/h`,
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return null;
  }

  return (
    <div
      className="p-6 rounded-xl"
      style={{ backgroundColor: cardBg }}
    >
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <Sparkles size={24} style={{ color: '#f59e0b' }} />
        <h2 className="text-xl font-bold" style={{ color: textColor }}>
          今日 AI 洞察
        </h2>
      </div>

      {/* 洞察列表 */}
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="p-4 rounded-lg transition-all hover:scale-[1.02]"
            style={{ 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderLeft: `4px solid ${insight.color}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${insight.color}20` }}
              >
                <insight.icon size={20} style={{ color: insight.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: insight.color }}>
                    {insight.title}
                  </span>
                </div>
                <div className="font-bold mb-1" style={{ color: textColor }}>
                  {insight.content}
                </div>
                <div className="text-sm" style={{ color: secondaryColor }}>
                  {insight.reason}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 查看详细分析按钮 */}
      <button
        className="w-full mt-4 py-2 rounded-lg transition-all hover:scale-[1.02]"
        style={{ 
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          color: textColor,
        }}
      >
        查看详细分析
      </button>
    </div>
  );
}

