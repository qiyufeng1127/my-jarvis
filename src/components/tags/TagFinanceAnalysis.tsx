import { useState } from 'react';
import { useTagStore, type TagData } from '@/stores/tagStore';
import { Pie, Bar } from 'react-chartjs-2';

interface TagFinanceAnalysisProps {
  tags: TagData[];
  isDark?: boolean;
}

type DateRange = 'today' | 'yesterday' | 'week' | 'month';

export default function TagFinanceAnalysis({ tags, isDark = false }: TagFinanceAnalysisProps) {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  
  const { getTagIncome, getTagExpense, getTagNetIncome } = useTagStore();
  
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
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRangeValues();
  
  // 计算每个标签的财务数据
  const tagFinanceData = tags
    .map(tag => ({
      tag,
      income: getTagIncome(tag.name, startDate, endDate),
      expense: getTagExpense(tag.name, startDate, endDate),
      netIncome: getTagNetIncome(tag.name, startDate, endDate),
    }))
    .filter(item => item.income > 0 || item.expense > 0);
  
  // 排序
  const sortedByIncome = [...tagFinanceData].sort((a, b) => b.income - a.income);
  const sortedByExpense = [...tagFinanceData].sort((a, b) => b.expense - a.expense);
  const sortedByNetIncome = [...tagFinanceData].sort((a, b) => b.netIncome - a.netIncome);
  
  // 总计
  const totalIncome = tagFinanceData.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = tagFinanceData.reduce((sum, item) => sum + item.expense, 0);
  const totalNetIncome = totalIncome - totalExpense;
  
  // 收入饼图数据
  const incomePieData = {
    labels: sortedByIncome.slice(0, 10).map(item => item.tag.name),
    datasets: [
      {
        data: sortedByIncome.slice(0, 10).map(item => item.income),
        backgroundColor: sortedByIncome.slice(0, 10).map(item => item.tag.color),
        borderWidth: 2,
        borderColor: isDark ? '#1a1a1a' : '#ffffff',
      },
    ],
  };
  
  // 收支柱状图数据
  const barChartData = {
    labels: sortedByNetIncome.slice(0, 10).map(item => item.tag.name),
    datasets: [
      {
        label: '🟢 收入',
        data: sortedByNetIncome.slice(0, 10).map(item => item.income),
        backgroundColor: '#34C759',
      },
      {
        label: '🔴 支出',
        data: sortedByNetIncome.slice(0, 10).map(item => item.expense),
        backgroundColor: '#FF3B30',
      },
    ],
  };
  
  const chartOptions = {
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
      },
    },
    scales: {
      y: {
        beginAtZero: true,
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
        ticks: {
          color: secondaryColor,
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };
  
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">💰</div>
        <p className="text-lg font-medium" style={{ color: textColor }}>
          还没有财务数据
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* 日期选择器 - iOS 风格 */}
      <div className="flex items-center gap-2 mb-6">
        {(['today', 'yesterday', 'week', 'month'] as DateRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: dateRange === range ? '#007AFF' : cardBg,
              color: dateRange === range ? '#ffffff' : textColor,
            }}
          >
            {range === 'today' && '今日'}
            {range === 'yesterday' && '昨日'}
            {range === 'week' && '本周'}
            {range === 'month' && '本月'}
          </button>
        ))}
      </div>
      
      {tagFinanceData.length === 0 ? (
        <div 
          className="p-8 rounded-2xl text-center"
          style={{ backgroundColor: cardBg }}
        >
          <p style={{ color: secondaryColor }}>
            该时间段内暂无财务数据
          </p>
        </div>
      ) : (
        <>
          {/* 总览卡片 - iOS 毛玻璃样式 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div 
              className="p-4 rounded-2xl"
              style={{ 
                backgroundColor: cardBg,
                backdropFilter: 'blur(20px)',
              }}
            >
              <p className="text-xs mb-2" style={{ color: secondaryColor }}>
                🟢 总收入
              </p>
              <p className="text-2xl font-bold" style={{ color: '#34C759' }}>
                +{totalIncome.toFixed(0)}元
              </p>
            </div>
            
            <div 
              className="p-4 rounded-2xl"
              style={{ 
                backgroundColor: cardBg,
                backdropFilter: 'blur(20px)',
              }}
            >
              <p className="text-xs mb-2" style={{ color: secondaryColor }}>
                🔴 总支出
              </p>
              <p className="text-2xl font-bold" style={{ color: '#FF3B30' }}>
                -{totalExpense.toFixed(0)}元
              </p>
            </div>
            
            <div 
              className="p-4 rounded-2xl"
              style={{ 
                backgroundColor: cardBg,
                backdropFilter: 'blur(20px)',
              }}
            >
              <p className="text-xs mb-2" style={{ color: secondaryColor }}>
                📊 净收支
              </p>
              <p 
                className="text-2xl font-bold" 
                style={{ 
                  color: totalNetIncome >= 0 ? '#34C759' : '#FF3B30' 
                }}
              >
                {totalNetIncome >= 0 ? '+' : ''}{totalNetIncome.toFixed(0)}元
              </p>
            </div>
          </div>
          
          {/* 图表区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 收入占比饼图 */}
            <div 
              className="p-6 rounded-2xl"
              style={{ backgroundColor: cardBg }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
                🟢 收入占比
              </h3>
              <div className="max-w-sm mx-auto">
                <Pie data={incomePieData} options={chartOptions} />
              </div>
            </div>
            
            {/* 收支对比柱状图 */}
            <div 
              className="p-6 rounded-2xl"
              style={{ backgroundColor: cardBg }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
                📊 收支对比
              </h3>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>
          
          {/* 排行榜 */}
          <div 
            className="p-6 rounded-2xl"
            style={{ backgroundColor: cardBg }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
              💰 净收支排行
            </h3>
            <div className="space-y-3">
              {sortedByNetIncome.slice(0, 10).map((item, index) => {
                const percentage = totalNetIncome > 0 
                  ? ((item.netIncome / totalNetIncome) * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <div key={item.tag.name} className="flex items-center gap-3">
                    {/* 排名 */}
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ 
                        backgroundColor: index < 3 ? item.tag.color : cardBg,
                        color: index < 3 ? '#ffffff' : textColor,
                      }}
                    >
                      {index + 1}
                    </div>
                    
                    {/* 标签信息 */}
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xl">{item.tag.emoji}</span>
                      <span className="font-medium" style={{ color: textColor }}>
                        {item.tag.name}
                      </span>
                    </div>
                    
                    {/* 进度条 */}
                    <div className="flex-1 max-w-xs">
                      <div 
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: borderColor }}
                      >
                        <div
                          className="h-full transition-all"
                          style={{ 
                            width: `${Math.abs(parseFloat(percentage))}%`,
                            backgroundColor: item.netIncome >= 0 ? '#34C759' : '#FF3B30',
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* 金额 */}
                    <div className="text-right min-w-[120px]">
                      <p 
                        className="font-bold" 
                        style={{ 
                          color: item.netIncome >= 0 ? '#34C759' : '#FF3B30' 
                        }}
                      >
                        {item.netIncome >= 0 ? '+' : ''}{item.netIncome.toFixed(0)}元
                      </p>
                      <p className="text-xs" style={{ color: secondaryColor }}>
                        {percentage}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

