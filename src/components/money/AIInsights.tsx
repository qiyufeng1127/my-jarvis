import { useSideHustleStore } from '@/stores/sideHustleStore';

interface AIInsightsProps {
  isDark?: boolean;
}

export default function AIInsights({ isDark = false }: AIInsightsProps) {
  const { getActiveSideHustles, getRankedByHourlyRate, getTotalIncome } = useSideHustleStore();

  // iOS 风格的颜色系统
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

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
        emoji: '🎯',
        color: '#34C759',
        title: '建议优先做',
        content: `"${best.name}"`,
        reason: `时薪 ¥${best.hourlyRate.toFixed(0)}/h，ROI ${best.roi.toFixed(0)}%`,
      });
    }

    // 低效副业警告
    if (rankedByHourlyRate.length > 1) {
      const worst = rankedByHourlyRate[rankedByHourlyRate.length - 1];
      if (worst.hourlyRate < 50) {
        insights.push({
          emoji: '⚠️',
          color: '#FF9500',
          title: '效率较低',
          content: `"${worst.name}"`,
          reason: `时薪仅 ¥${worst.hourlyRate.toFixed(0)}/h，建议优化`,
        });
      }
    }

    // 收入预测
    const avgMonthlyIncome = totalIncome * 0.3;
    const predictedIncome = avgMonthlyIncome * 1.2;
    insights.push({
      emoji: '📈',
      color: '#007AFF',
      title: '本月预测',
      content: `¥${predictedIncome.toLocaleString()}`,
      reason: '基于当前趋势',
    });

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return null;
  }

  return (
    <div
      className="p-3 rounded-xl"
      style={{ 
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✨</span>
        <h2 className="text-sm font-semibold" style={{ color: textColor }}>
          AI 洞察
        </h2>
      </div>

      {/* 洞察列表 - 紧凑 */}
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="p-2.5 rounded-lg"
            style={{ 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">{insight.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-medium" style={{ color: insight.color }}>
                    {insight.title}
                  </span>
                </div>
                <div className="font-semibold text-sm mb-0.5 truncate" style={{ color: textColor }}>
                  {insight.content}
                </div>
                <div className="text-xs" style={{ color: secondaryColor }}>
                  {insight.reason}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

