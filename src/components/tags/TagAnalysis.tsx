import { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { useTagStore, type TagData } from '@/stores/tagStore';

interface TagAnalysisProps {
  tags: TagData[];
  isDark?: boolean;
}

type DateRange = 'today' | 'yesterday' | 'week' | 'month';

export default function TagAnalysis({ tags, isDark = false }: TagAnalysisProps) {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  
  const { getTagDuration } = useTagStore();
  
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
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
  
  // 计算每个标签的时长
  const tagDurations = tags.map(tag => ({
    tag,
    duration: getTagDuration(tag.name, startDate, endDate),
  })).filter(item => item.duration > 0);
  
  // 排序
  const sortedTags = [...tagDurations].sort((a, b) => b.duration - a.duration);
  
  // 总时长
  const totalDuration = tagDurations.reduce((sum, item) => sum + item.duration, 0);
  
  // 饼图数据
  const pieChartData = {
    labels: sortedTags.slice(0, 10).map(item => item.tag.name),
    datasets: [
      {
        data: sortedTags.slice(0, 10).map(item => item.duration),
        backgroundColor: sortedTags.slice(0, 10).map(item => item.tag.color),
        borderWidth: 2,
        borderColor: isDark ? '#1a1a1a' : '#ffffff',
      },
    ],
  };
  
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: textColor,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const minutes = context.parsed;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const percentage = ((minutes / totalDuration) * 100).toFixed(1);
            return `${context.label}: ${hours}h ${mins}m (${percentage}%)`;
          },
        },
      },
    },
  };
  
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-lg font-medium" style={{ color: textColor }}>
          还没有标签数据
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* 日期选择器 */}
      <div className="flex items-center gap-2 mb-6">
        {(['today', 'yesterday', 'week', 'month'] as DateRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: dateRange === range ? '#10B981' : cardBg,
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
      
      {sortedTags.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ backgroundColor: cardBg }}
        >
          <p style={{ color: secondaryColor }}>
            该时间段内暂无数据
          </p>
        </div>
      ) : (
        <>
          {/* 饼图 */}
          <div 
            className="p-6 rounded-xl mb-6"
            style={{ backgroundColor: cardBg }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
              时长占比
            </h3>
            <div className="max-w-md mx-auto">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>
          
          {/* 排行榜 */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: cardBg }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
              时长排行
            </h3>
            <div className="space-y-3">
              {sortedTags.map((item, index) => {
                const percentage = ((item.duration / totalDuration) * 100).toFixed(1);
                const hours = Math.floor(item.duration / 60);
                const minutes = item.duration % 60;
                
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
                            width: `${percentage}%`,
                            backgroundColor: item.tag.color,
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* 时长 */}
                    <div className="text-right min-w-[100px]">
                      <p className="font-semibold" style={{ color: textColor }}>
                        {hours}h {minutes}m
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

