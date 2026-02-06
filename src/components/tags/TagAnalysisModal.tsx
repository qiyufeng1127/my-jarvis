import { useState } from 'react';
import { X, Calendar, TrendingUp } from 'lucide-react';
import { useTagStore, type TagData } from '@/stores/tagStore';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TagAnalysisModalProps {
  tag: TagData;
  onClose: () => void;
  isDark?: boolean;
}

type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function TagAnalysisModal({ tag, onClose, isDark = false }: TagAnalysisModalProps) {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const { getTagDuration, getTagDurationRecords } = useTagStore();
  
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
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
  
  // 获取时长数据
  const totalDuration = getTagDuration(tag.name, startDate, endDate);
  const todayDuration = getTagDuration(tag.name, 
    new Date(new Date().setHours(0, 0, 0, 0)),
    new Date()
  );
  const yesterdayDuration = getTagDuration(tag.name,
    new Date(new Date().setDate(new Date().getDate() - 1)),
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  
  // 获取记录用于图表
  const records = getTagDurationRecords(tag.name, startDate, endDate);
  
  // 按日期分组
  const durationByDate: Record<string, number> = {};
  records.forEach(record => {
    const dateKey = record.date.toLocaleDateString('zh-CN');
    durationByDate[dateKey] = (durationByDate[dateKey] || 0) + record.duration;
  });
  
  // 生成图表数据
  const chartLabels = Object.keys(durationByDate).sort();
  const chartData = chartLabels.map(date => durationByDate[date]);
  
  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: '时长（分钟）',
        data: chartData,
        borderColor: tag.color,
        backgroundColor: `${tag.color}40`,
        tension: 0.4,
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
        callbacks: {
          label: (context: any) => {
            const minutes = context.parsed.y;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: secondaryColor,
        },
        grid: {
          color: borderColor,
        },
      },
      x: {
        ticks: {
          color: secondaryColor,
        },
        grid: {
          color: borderColor,
        },
      },
    },
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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
              <h3 className="text-xl font-bold" style={{ color: textColor }}>
                {tag.name}
              </h3>
              <p className="text-sm" style={{ color: secondaryColor }}>
                时长分析
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-black transition-colors"
          >
            <X size={24} style={{ color: textColor }} />
          </button>
        </div>
        
        {/* 日期选择器 */}
        <div 
          className="px-6 py-4 border-b flex items-center gap-2 flex-wrap"
          style={{ borderColor }}
        >
          {(['today', 'yesterday', 'week', 'month', 'custom'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: dateRange === range ? tag.color : cardBg,
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
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor, color: textColor }}
              />
              <span style={{ color: secondaryColor }}>至</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor, color: textColor }}
              />
            </div>
          )}
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: cardBg }}
            >
              <p className="text-sm mb-1" style={{ color: secondaryColor }}>
                今日时长
              </p>
              <p className="text-2xl font-bold" style={{ color: textColor }}>
                {Math.floor(todayDuration / 60)}h {todayDuration % 60}m
              </p>
            </div>
            
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: cardBg }}
            >
              <p className="text-sm mb-1" style={{ color: secondaryColor }}>
                昨日时长
              </p>
              <p className="text-2xl font-bold" style={{ color: textColor }}>
                {Math.floor(yesterdayDuration / 60)}h {yesterdayDuration % 60}m
              </p>
            </div>
            
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: cardBg }}
            >
              <p className="text-sm mb-1" style={{ color: secondaryColor }}>
                累计时长
              </p>
              <p className="text-2xl font-bold" style={{ color: textColor }}>
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </p>
            </div>
          </div>
          
          {/* 趋势图 */}
          {chartLabels.length > 0 ? (
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: cardBg }}
            >
              <h4 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
                时长趋势
              </h4>
              <Line data={lineChartData} options={chartOptions} />
            </div>
          ) : (
            <div 
              className="p-8 rounded-xl text-center"
              style={{ backgroundColor: cardBg }}
            >
              <p style={{ color: secondaryColor }}>
                该时间段内暂无数据
              </p>
            </div>
          )}
          
          {/* 任务列表 */}
          {records.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3" style={{ color: textColor }}>
                相关任务
              </h4>
              <div className="space-y-2">
                {records.slice(0, 10).map((record, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: cardBg }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: textColor }}>
                        {record.taskTitle}
                      </p>
                      <p className="text-xs mt-1" style={{ color: secondaryColor }}>
                        {record.date.toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: tag.color }}>
                      {Math.floor(record.duration / 60)}h {record.duration % 60}m
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

