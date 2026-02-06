import { useState } from 'react';
import { useTagStore, type TagData, type TagEfficiencyLevel } from '@/stores/tagStore';
import { Scatter } from 'react-chartjs-2';
import { AlertTriangle } from 'lucide-react';

interface TagEfficiencyAnalysisProps {
  tags: TagData[];
  isDark?: boolean;
}

export default function TagEfficiencyAnalysis({ tags, isDark = false }: TagEfficiencyAnalysisProps) {
  const { getTagEfficiencyLevel, getTagEfficiencyEmoji } = useTagStore();
  
  const textColor = isDark ? '#ffffff' : '#1D1D1F';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  // 按效率等级分类标签
  const categorizedTags = {
    high: [] as TagData[],
    medium: [] as TagData[],
    low: [] as TagData[],
    negative: [] as TagData[],
    life_essential: [] as TagData[],
    passive: [] as TagData[],
  };
  
  tags.forEach(tag => {
    const level = getTagEfficiencyLevel(tag.name);
    categorizedTags[level].push(tag);
  });
  
  // 计算负效警示
  const totalWeeklyDuration = tags.reduce((sum, tag) => sum + tag.totalDuration, 0);
  const negativeWarnings = categorizedTags.negative.filter(tag => {
    const percentage = (tag.totalDuration / totalWeeklyDuration) * 100;
    return percentage >= 10;
  });
  
  // 散点图数据
  const scatterData = {
    datasets: [
      {
        label: '💰 高效标签',
        data: categorizedTags.high.map(tag => ({
          x: tag.totalDuration - tag.invalidDuration,
          y: tag.hourlyRate,
          label: tag.name,
        })),
        backgroundColor: '#34C759',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: '📈 中效标签',
        data: categorizedTags.medium.map(tag => ({
          x: tag.totalDuration - tag.invalidDuration,
          y: tag.hourlyRate,
          label: tag.name,
        })),
        backgroundColor: '#007AFF',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: '⚠️ 低效标签',
        data: categorizedTags.low.map(tag => ({
          x: tag.totalDuration - tag.invalidDuration,
          y: tag.hourlyRate,
          label: tag.name,
        })),
        backgroundColor: '#FFCC00',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: '❌ 负效标签',
        data: categorizedTags.negative.map(tag => ({
          x: tag.totalDuration - tag.invalidDuration,
          y: tag.hourlyRate,
          label: tag.name,
        })),
        backgroundColor: '#FF3B30',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: '🏠 生活必需',
        data: categorizedTags.life_essential.map(tag => ({
          x: tag.totalDuration - tag.invalidDuration,
          y: 0,
          label: tag.name,
        })),
        backgroundColor: '#8E8E93',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
    ],
  };
  
  const scatterOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: textColor,
          font: {
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: borderColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const point = context.raw;
            return `${point.label}: ${point.y.toFixed(0)}元/h (${Math.round(point.x / 60)}h)`;
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '单位时间收益（元/小时）',
          color: textColor,
          font: {
            size: 12,
          },
        },
        ticks: {
          color: secondaryColor,
          font: {
            size: 11,
          },
        },
        grid: {
          color: borderColor,
        },
      },
      x: {
        title: {
          display: true,
          text: '有效时长（分钟）',
          color: textColor,
          font: {
            size: 12,
          },
        },
        ticks: {
          color: secondaryColor,
          font: {
            size: 11,
          },
        },
        grid: {
          color: borderColor,
        },
      },
    },
  };
  
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-lg font-medium" style={{ color: textColor }}>
          还没有效率数据
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* 负效警示 - iOS 弹窗样式 */}
      {negativeWarnings.length > 0 && (
        <div 
          className="mb-6 p-4 rounded-2xl border-2"
          style={{ 
            backgroundColor: '#FF3B3010',
            borderColor: '#FF3B30',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">❌</div>
            <div className="flex-1">
              <h3 className="font-bold text-base mb-2" style={{ color: '#FF3B30' }}>
                ⚠️ 本周负效行为警示
              </h3>
              {negativeWarnings.map(tag => {
                const percentage = ((tag.totalDuration / totalWeeklyDuration) * 100).toFixed(1);
                return (
                  <p key={tag.name} className="text-sm mb-1" style={{ color: textColor }}>
                    <span className="font-semibold">#{tag.name}</span> 耗时 {Math.round(tag.totalDuration / 60)}小时
                    （占比 {percentage}%），{tag.netIncome === 0 ? '无任何收入' : `亏损${Math.abs(tag.netIncome).toFixed(0)}元`}，
                    建议优化！
                  </p>
                );
              })}
              <div className="flex gap-2 mt-3">
                <button
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: '#007AFF', color: '#ffffff' }}
                >
                  去优化
                </button>
                <button
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: cardBg, color: textColor }}
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 效率分类统计 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { level: 'high', label: '💰 高效标签', color: '#34C759', count: categorizedTags.high.length },
          { level: 'medium', label: '📈 中效标签', color: '#007AFF', count: categorizedTags.medium.length },
          { level: 'low', label: '⚠️ 低效标签', color: '#FFCC00', count: categorizedTags.low.length },
          { level: 'negative', label: '❌ 负效标签', color: '#FF3B30', count: categorizedTags.negative.length },
          { level: 'life_essential', label: '🏠 生活必需', color: '#8E8E93', count: categorizedTags.life_essential.length },
          { level: 'passive', label: '🪙 被动收入', color: '#FFD60A', count: categorizedTags.passive.length },
        ].map((item) => (
          <div
            key={item.level}
            className="p-4 rounded-2xl"
            style={{ backgroundColor: cardBg }}
          >
            <p className="text-xs mb-1" style={{ color: secondaryColor }}>
              {item.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: item.color }}>
              {item.count}
            </p>
          </div>
        ))}
      </div>
      
      {/* 效率-时长散点图 */}
      <div 
        className="p-6 rounded-2xl mb-6"
        style={{ backgroundColor: cardBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          📊 效率-时长分布图
        </h3>
        <Scatter data={scatterData} options={scatterOptions} />
      </div>
      
      {/* 高价值标签 TOP5 */}
      {categorizedTags.high.length > 0 && (
        <div 
          className="p-6 rounded-2xl mb-6"
          style={{ backgroundColor: cardBg }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
            💰 高价值标签 TOP5
          </h3>
          <div className="space-y-3">
            {categorizedTags.high
              .sort((a, b) => b.hourlyRate - a.hourlyRate)
              .slice(0, 5)
              .map((tag, index) => (
                <div key={tag.name} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ 
                      backgroundColor: '#34C759',
                      color: '#ffffff',
                    }}
                  >
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xl">{tag.emoji}</span>
                    <span className="font-medium" style={{ color: textColor }}>
                      {tag.name}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#34C759' }}>
                      💰 {tag.hourlyRate.toFixed(0)}元/h
                    </p>
                    <p className="text-xs" style={{ color: secondaryColor }}>
                      {Math.round((tag.totalDuration - tag.invalidDuration) / 60)}小时
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* 负效警示清单 */}
      {categorizedTags.negative.length > 0 && (
        <div 
          className="p-6 rounded-2xl"
          style={{ backgroundColor: cardBg }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
            ❌ 需优化标签清单
          </h3>
          <div className="space-y-3">
            {categorizedTags.negative
              .sort((a, b) => a.hourlyRate - b.hourlyRate)
              .map((tag, index) => (
                <div 
                  key={tag.name} 
                  className="p-4 rounded-xl border"
                  style={{ 
                    backgroundColor: '#FF3B3010',
                    borderColor: '#FF3B30',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tag.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold" style={{ color: textColor }}>
                          {tag.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FF3B30', color: '#ffffff' }}>
                          ❌ 负效
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: secondaryColor }}>
                        累计时长：{Math.round((tag.totalDuration - tag.invalidDuration) / 60)}小时 · 
                        时薪：{tag.hourlyRate.toFixed(0)}元/h
                      </p>
                      <p className="text-xs" style={{ color: '#FF3B30' }}>
                        💡 建议：{tag.netIncome === 0 ? '该标签无产出，建议减少投入或优化流程' : '该标签亏损，建议分析成本结构'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

