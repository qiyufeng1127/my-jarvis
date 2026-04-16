import { useState } from 'react';
import { X, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { useTagStore, type TagData } from '@/stores/tagStore';
import { Line, Bar } from 'react-chartjs-2';

interface TagAnalysisModalV2Props {
  tag: TagData;
  onClose: () => void;
  isDark?: boolean;
}

type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function TagAnalysisModalV2({ tag, onClose, isDark = false }: TagAnalysisModalV2Props) {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'duration' | 'finance' | 'efficiency'>('duration');
  
  const { 
    getTagDuration, 
    getTagDurationRecords,
    getTagIncome,
    getTagExpense,
    getTagNetIncome,
    getFinanceRecords,
    getTagHourlyRate,
    getTagEfficiencyLevel,
    getTagEfficiencyEmoji,
  } = useTagStore();
  
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1D1D1F';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  // 计算日期范围
  const getDateRangeValues = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = customEndDate ? new Date(customEndDate) : now;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRangeValues();
  
  // 获取数据
  const totalDuration = getTagDuration(tag.name, startDate, endDate);
  const todayDuration = getTagDuration(tag.name, 
    new Date(new Date().setHours(0, 0, 0, 0)),
    new Date()
  );
  const yesterdayDuration = getTagDuration(tag.name,
    new Date(new Date().setDate(new Date().getDate() - 1)),
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  
  const totalIncome = getTagIncome(tag.name, startDate, endDate);
  const totalExpense = getTagExpense(tag.name, startDate, endDate);
  const netIncome = getTagNetIncome(tag.name, startDate, endDate);
  const hourlyRate = getTagHourlyRate(tag.name, startDate, endDate);
  
  const efficiencyLevel = getTagEfficiencyLevel(tag.name);
  const efficiencyEmoji = getTagEfficiencyEmoji(efficiencyLevel);
  
  // 时长记录
  const durationRecords = getTagDurationRecords(tag.name, startDate, endDate);
  const financeRecords = getFinanceRecords(tag.name, startDate, endDate);
  
  // 按日期分组时长
  const durationByDate: Record<string, number> = {};
  durationRecords.forEach(record => {
    const dateKey = record.date.toLocaleDateString('zh-CN');
    durationByDate[dateKey] = (durationByDate[dateKey] || 0) + record.duration;
  });
  
  // 按日期分组收支
  const financeByDate: Record<string, { income: number; expense: number }> = {};
  financeRecords.forEach(record => {
    const dateKey = record.date.toLocaleDateString('zh-CN');
    if (!financeByDate[dateKey]) {
      financeByDate[dateKey] = { income: 0, expense: 0 };
    }
    if (record.type === 'income') {
      financeByDate[dateKey].income += record.amount;
    } else {
      financeByDate[dateKey].expense += record.amount;
    }
  });
  
  // 时长趋势图
  const durationChartLabels = Object.keys(durationByDate).sort();
  const durationChartData = {
    labels: durationChartLabels,
    datasets: [
      {
        label: '⏱️ 时长（分钟）',
        data: durationChartLabels.map(date => durationByDate[date]),
        borderColor: tag.color,
        backgroundColor: `${tag.color}40`,
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // 收支趋势图
  const financeChartLabels = Object.keys(financeByDate).sort();
  const financeChartData = {
    labels: financeChartLabels,
    datasets: [
      {
        label: '🟢 收入',
        data: financeChartLabels.map(date => financeByDate[date].income),
        backgroundColor: '#34C759',
      },
      {
        label: '🔴 支出',
        data: financeChartLabels.map(date => financeByDate[date].expense),
        backgroundColor: '#FF3B30',
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: borderColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: secondaryColor,
          font: { size: 11 },
        },
        grid: {
          color: borderColor,
        },
      },
      x: {
        ticks: {
          color: secondaryColor,
          font: { size: 11 },
        },
        grid: {
          display: false,
        },
      },
    },
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 keyboard-aware-modal-shell"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col overflow-hidden keyboard-aware-modal-card"
        style={{ backgroundColor: bgColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tag.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold" style={{ color: textColor }}>
                  {tag.name}
                </h3>
                {tag.tagType === 'life_essential' && (
                  <span className="text-sm">🏠</span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: secondaryColor }}>
                详细分析
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black hover:bg-opacity-5 transition-colors"
          >
            <X size={24} style={{ color: textColor }} />
          </button>
        </div>
        
        {/* 标签页 */}
        <div 
          className="flex items-center gap-2 px-6 py-3 border-b"
          style={{ borderColor, backgroundColor: cardBg }}
        >
          <button
            onClick={() => setActiveTab('duration')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'duration' ? '#007AFF' : 'transparent',
              color: activeTab === 'duration' ? '#ffffff' : textColor,
            }}
          >
            <TrendingUp size={14} />
            ⏱️ 时长
          </button>
          
          <button
            onClick={() => setActiveTab('finance')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'finance' ? '#007AFF' : 'transparent',
              color: activeTab === 'finance' ? '#ffffff' : textColor,
            }}
          >
            <DollarSign size={14} />
            💰 财务
          </button>
          
          <button
            onClick={() => setActiveTab('efficiency')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'efficiency' ? '#007AFF' : 'transparent',
              color: activeTab === 'efficiency' ? '#ffffff' : textColor,
            }}
          >
            <Zap size={14} />
            📊 效率
          </button>
        </div>
        
        {/* 日期选择器 */}
        <div 
          className="px-6 py-3 border-b flex items-center gap-2 flex-wrap"
          style={{ borderColor }}
        >
          {(['today', 'yesterday', 'week', 'month', 'custom'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: dateRange === range ? '#007AFF' : cardBg,
                color: dateRange === range ? '#ffffff' : textColor,
              }}
            >
              {range === 'today' && '今日'}
              {range === 'yesterday' && '昨日'}
              {range === 'week' && '本周'}
              {range === 'month' && '本月'}
              {range === 'custom' && '自定义'}
            </button>
          ))}
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-xs"
                style={{ backgroundColor: cardBg, borderColor, color: textColor }}
              />
              <span style={{ color: secondaryColor }}>至</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-xs"
                style={{ backgroundColor: cardBg, borderColor, color: textColor }}
              />
            </div>
          )}
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'duration' && (
            <div className="space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>⏱️ 今日时长</p>
                  <p className="text-2xl font-bold" style={{ color: textColor }}>
                    {Math.floor(todayDuration / 60)}h {todayDuration % 60}m
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>⏱️ 昨日时长</p>
                  <p className="text-2xl font-bold" style={{ color: textColor }}>
                    {Math.floor(yesterdayDuration / 60)}h {yesterdayDuration % 60}m
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>⏱️ 累计时长</p>
                  <p className="text-2xl font-bold" style={{ color: textColor }}>
                    {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                  </p>
                </div>
              </div>
              
              {/* 趋势图 */}
              {durationChartLabels.length > 0 && (
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <h4 className="text-base font-semibold mb-4" style={{ color: textColor }}>
                    时长趋势
                  </h4>
                  <Line data={durationChartData} options={chartOptions} />
                </div>
              )}
              
              {/* 任务列表 */}
              {durationRecords.length > 0 && (
                <div>
                  <h4 className="text-base font-semibold mb-3" style={{ color: textColor }}>
                    相关任务
                  </h4>
                  <div className="space-y-2">
                    {durationRecords.slice(0, 10).map((record, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: cardBg }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm" style={{ color: textColor }}>
                              {record.taskTitle}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: secondaryColor }}>
                              {record.date.toLocaleDateString('zh-CN')}
                              {record.isInvalid && <span className="ml-2 text-xs" style={{ color: '#FF3B30' }}>⏳ 无效时长</span>}
                              {/* 🔧 显示效率 */}
                              {record.completionEfficiency !== undefined && (
                                <span 
                                  className="ml-2 text-xs font-semibold"
                                  style={{ 
                                    color: record.completionEfficiency >= 70 ? '#34C759' : 
                                           record.completionEfficiency >= 50 ? '#FFCC00' : '#FF3B30'
                                  }}
                                >
                                  📊 {record.completionEfficiency}%
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-sm font-semibold" style={{ color: tag.color }}>
                            {Math.floor(record.duration / 60)}h {record.duration % 60}m
                          </div>
                        </div>
                        {/* 🔧 显示备注 */}
                        {record.completionNotes && (
                          <div 
                            className="mt-2 p-2 rounded-lg text-xs"
                            style={{ 
                              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                              borderLeft: `3px solid ${tag.color}`
                            }}
                          >
                            <p style={{ color: secondaryColor }}>📝 备注：</p>
                            <p className="mt-1 whitespace-pre-wrap" style={{ color: textColor }}>
                              {record.completionNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>🟢 总收入</p>
                  <p className="text-2xl font-bold" style={{ color: '#34C759' }}>
                    +{totalIncome.toFixed(0)}元
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>🔴 总支出</p>
                  <p className="text-2xl font-bold" style={{ color: '#FF3B30' }}>
                    -{totalExpense.toFixed(0)}元
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>📊 净收支</p>
                  <p 
                    className="text-2xl font-bold" 
                    style={{ color: netIncome >= 0 ? '#34C759' : '#FF3B30' }}
                  >
                    {netIncome >= 0 ? '+' : ''}{netIncome.toFixed(0)}元
                  </p>
                </div>
              </div>
              
              {/* 收支趋势图 */}
              {financeChartLabels.length > 0 && (
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <h4 className="text-base font-semibold mb-4" style={{ color: textColor }}>
                    收支趋势
                  </h4>
                  <Bar data={financeChartData} options={chartOptions} />
                </div>
              )}
              
              {/* 收支明细 */}
              {financeRecords.length > 0 && (
                <div>
                  <h4 className="text-base font-semibold mb-3" style={{ color: textColor }}>
                    收支明细
                  </h4>
                  <div className="space-y-2">
                    {financeRecords.map((record) => (
                      <div
                        key={record.id}
                        className="p-3 rounded-xl flex items-center justify-between"
                        style={{ 
                          backgroundColor: cardBg,
                          backdropFilter: 'blur(20px)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {record.type === 'income' ? '🟢' : '🔴'}
                          </span>
                          <div>
                            <p className="font-medium text-sm" style={{ color: textColor }}>
                              {record.description}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: secondaryColor }}>
                              {record.date.toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>
                        <div 
                          className="text-sm font-bold" 
                          style={{ color: record.type === 'income' ? '#34C759' : '#FF3B30' }}
                        >
                          {record.type === 'income' ? '+' : '-'}{record.amount.toFixed(0)}元
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'efficiency' && (
            <div className="space-y-6">
              {/* 效率卡片 */}
              <div 
                className="p-6 rounded-2xl"
                style={{ 
                  backgroundColor: cardBg,
                  border: `2px solid ${tag.color}`,
                }}
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">{efficiencyEmoji}</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    {tag.tagType === 'life_essential' 
                      ? '🏠 生活必需'
                      : hourlyRate === Infinity
                      ? '🪙 被动收入'
                      : `${hourlyRate.toFixed(0)}元/小时`
                    }
                  </h3>
                  <p className="text-sm" style={{ color: secondaryColor }}>
                    {efficiencyLevel === 'high' && '💰 高效标签 - 继续保持！'}
                    {efficiencyLevel === 'medium' && '📈 中效标签 - 表现良好'}
                    {efficiencyLevel === 'low' && '⚠️ 低效可优化 - 建议提升效率'}
                    {efficiencyLevel === 'negative' && '❌ 负效警示 - 需要优化'}
                    {efficiencyLevel === 'life_essential' && '🏠 生活必需 - 保持平衡'}
                    {efficiencyLevel === 'passive' && '🪙 被动收入 - 优质资产'}
                  </p>
                </div>
              </div>
              
              {/* 效率分析 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>⏱️ 有效时长</p>
                  <p className="text-xl font-bold" style={{ color: textColor }}>
                    {Math.floor((tag.totalDuration - tag.invalidDuration) / 60)}h
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>⏳ 无效时长</p>
                  <p className="text-xl font-bold" style={{ color: '#FF3B30' }}>
                    {Math.floor(tag.invalidDuration / 60)}h
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>💰 净收支</p>
                  <p 
                    className="text-xl font-bold" 
                    style={{ color: tag.netIncome >= 0 ? '#34C759' : '#FF3B30' }}
                  >
                    {tag.netIncome >= 0 ? '+' : ''}{tag.netIncome.toFixed(0)}元
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl" style={{ backgroundColor: cardBg }}>
                  <p className="text-xs mb-1" style={{ color: secondaryColor }}>📊 效率等级</p>
                  <p className="text-xl font-bold" style={{ color: tag.color }}>
                    {efficiencyEmoji} {efficiencyLevel.toUpperCase()}
                  </p>
                </div>
              </div>
              
              {/* 优化建议 */}
              {efficiencyLevel === 'negative' && (
                <div 
                  className="p-4 rounded-2xl border-2"
                  style={{ 
                    backgroundColor: '#FF3B3010',
                    borderColor: '#FF3B30',
                  }}
                >
                  <h4 className="font-bold mb-2" style={{ color: '#FF3B30' }}>
                    ⚠️ 优化建议
                  </h4>
                  <ul className="text-sm space-y-1" style={{ color: textColor }}>
                    <li>• 分析该标签的时间投入是否合理</li>
                    <li>• 检查是否有无效时长可以优化</li>
                    <li>• 考虑提升该标签的收入或降低成本</li>
                    <li>• 如果是必要活动，可标记为"生活必需"</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

