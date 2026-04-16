import { useState } from 'react';
import { X, TrendingUp, Calendar, Target, CheckCircle, Clock, ChevronLeft } from 'lucide-react';
// import { Line } from 'react-chartjs-2';
// import type { ChartData, ChartOptions } from 'chart.js';

interface Task {
  id: string;
  title: string;
  completedAt: Date;
  growthValue: number;
  duration: number;
}

interface Goal {
  id: string;
  name: string;
  progress: number;
  target: number;
}

interface DimensionDetailProps {
  dimension: {
    id: string;
    name: string;
    icon: string;
    color: string;
    currentValue: number;
    description: string;
    history: { date: string; value: number }[];
  };
  relatedTasks: Task[];
  relatedGoals: Goal[];
  suggestions: string[];
  onClose: () => void;
  onTaskClick: (taskId: string) => void;
  onGoalClick: (goalId: string) => void;
}

type TimeRange = 'day' | 'week' | 'month' | 'year';

export default function DimensionDetail({
  dimension,
  relatedTasks,
  relatedGoals,
  suggestions,
  onClose,
  onTaskClick,
  onGoalClick,
}: DimensionDetailProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // 根据时间范围过滤历史数据
  const getFilteredHistory = () => {
    const now = new Date();
    const ranges = {
      day: 1,
      week: 7,
      month: 30,
      year: 365,
    };
    
    const daysToShow = ranges[timeRange];
    const cutoffDate = new Date(now.getTime() - daysToShow * 24 * 60 * 60 * 1000);
    
    return dimension.history.filter(item => new Date(item.date) >= cutoffDate);
  };

  const filteredHistory = getFilteredHistory();

  // 图表数据 - 暂时注释，需要安装 chart.js
  /*
  const chartData: ChartData<'line'> = {
    labels: filteredHistory.map(item => {
      const date = new Date(item.date);
      if (timeRange === 'day') {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      } else if (timeRange === 'week') {
        return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      } else {
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      }
    }),
    datasets: [
      {
        label: dimension.name,
        data: filteredHistory.map(item => item.value),
        borderColor: dimension.color,
        backgroundColor: `${dimension.color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: dimension.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  // 图表配置
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context) => `${dimension.name}: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };
  */

  // 计算统计数据
  const stats = {
    total: dimension.currentValue,
    change: filteredHistory.length > 1 
      ? filteredHistory[filteredHistory.length - 1].value - filteredHistory[0].value 
      : 0,
    average: filteredHistory.length > 0
      ? Math.round(filteredHistory.reduce((sum, item) => sum + item.value, 0) / filteredHistory.length)
      : 0,
    peak: filteredHistory.length > 0
      ? Math.max(...filteredHistory.map(item => item.value))
      : 0,
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 keyboard-aware-modal-shell">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col keyboard-aware-modal-card"
        style={{ maxHeight: 'var(--app-modal-max-height)' }}>
        {/* 头部 */}
        <div 
          className="p-6 text-white relative overflow-hidden"
          style={{ backgroundColor: dimension.color }}
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24" />
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                {dimension.icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{dimension.name}</h2>
                <p className="text-white/90">{dimension.description}</p>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-white/80 text-xs mb-1">当前值</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-white/80 text-xs mb-1">变化</div>
                <div className={`text-2xl font-bold ${stats.change >= 0 ? '' : 'text-red-200'}`}>
                  {stats.change >= 0 ? '+' : ''}{stats.change}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-white/80 text-xs mb-1">平均值</div>
                <div className="text-2xl font-bold">{stats.average}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-white/80 text-xs mb-1">峰值</div>
                <div className="text-2xl font-bold">{stats.peak}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 keyboard-aware-scroll">
          {/* 时间范围选择 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" style={{ color: dimension.color }} />
              历史趋势
            </h3>
            <div className="flex items-center space-x-2 bg-neutral-100 rounded-lg p-1">
              {(['day', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {range === 'day' && '日'}
                  {range === 'week' && '周'}
                  {range === 'month' && '月'}
                  {range === 'year' && '年'}
                </button>
              ))}
            </div>
          </div>

          {/* 趋势图 */}
          <div className="bg-neutral-50 rounded-xl p-6" style={{ height: '300px' }}>
            {/* <Line data={chartData} options={chartOptions} /> */}
            <div className="h-full flex items-center justify-center text-neutral-600">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                <p className="text-lg font-semibold mb-2">趋势图</p>
                <p className="text-sm">安装 chart.js 后可查看详细趋势图</p>
                <p className="text-xs mt-2 text-neutral-500">npm install chart.js react-chartjs-2</p>
              </div>
            </div>
          </div>

          {/* 相关任务 */}
          <div>
            <h3 className="text-lg font-bold text-neutral-900 flex items-center mb-4">
              <CheckCircle className="w-5 h-5 mr-2" style={{ color: dimension.color }} />
              影响该维度的任务
              <span className="ml-2 text-sm font-normal text-neutral-600">
                ({relatedTasks.length} 个)
              </span>
            </h3>
            
            {relatedTasks.length > 0 ? (
              <div className="space-y-2">
                {relatedTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    className="w-full bg-white rounded-lg p-4 hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {task.completedAt.toLocaleDateString('zh-CN')}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {task.duration} 分钟
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: dimension.color }}>
                          +{task.growthValue}
                        </div>
                        <div className="text-xs text-neutral-600">成长值</div>
                      </div>
                    </div>
                  </button>
                ))}
                
                {relatedTasks.length > 5 && (
                  <button className="w-full py-3 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    查看全部 {relatedTasks.length} 个任务 →
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-8 text-center text-neutral-600">
                还没有相关任务
              </div>
            )}
          </div>

          {/* 关联目标 */}
          <div>
            <h3 className="text-lg font-bold text-neutral-900 flex items-center mb-4">
              <Target className="w-5 h-5 mr-2" style={{ color: dimension.color }} />
              关联的长期目标
              <span className="ml-2 text-sm font-normal text-neutral-600">
                ({relatedGoals.length} 个)
              </span>
            </h3>
            
            {relatedGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relatedGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => onGoalClick(goal.id)}
                    className="bg-white rounded-lg p-4 hover:shadow-md transition-all text-left group"
                  >
                    <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors mb-3">
                      🎯 {goal.name}
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-neutral-600">进度</span>
                      <span className="font-semibold" style={{ color: dimension.color }}>
                        {goal.progress} / {goal.target}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((goal.progress / goal.target) * 100, 100)}%`,
                          backgroundColor: dimension.color,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-8 text-center text-neutral-600">
                还没有关联目标
              </div>
            )}
          </div>

          {/* 改进建议 */}
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-neutral-900 flex items-center mb-4">
                💡 改进建议
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100"
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: dimension.color }}
                      >
                        {index + 1}
                      </div>
                      <p className="text-neutral-800 flex-1">{suggestion}</p>
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

