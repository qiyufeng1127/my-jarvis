import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Award, 
  Target, 
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { statisticsService, DailyStatistics, WeeklyStatistics, MonthlyStatistics } from '@/services/statisticsService';

type TimeRange = 'day' | 'week' | 'month';

export default function StatisticsPanel() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<DailyStatistics | WeeklyStatistics | MonthlyStatistics | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  useEffect(() => {
    loadStatistics();
  }, [timeRange, selectedDate]);

  const loadStatistics = () => {
    // 模拟数据加载
    const mockTasks: any[] = [];
    const mockTransactions: any[] = [];
    const mockHabits: any[] = [];
    const mockGrowth: any[] = [];

    if (timeRange === 'day') {
      const dailyStats = statisticsService.calculateDailyStats(
        selectedDate,
        mockTasks,
        mockTransactions,
        mockHabits,
        mockGrowth
      );
      setStats(dailyStats);
    } else if (timeRange === 'week') {
      const weeklyStats = statisticsService.calculateWeeklyStats(
        selectedDate,
        mockTasks,
        mockTransactions,
        mockHabits,
        mockGrowth
      );
      setStats(weeklyStats);
    } else {
      const monthlyStats = statisticsService.calculateMonthlyStats(
        selectedDate,
        mockTasks,
        mockTransactions,
        mockHabits,
        mockGrowth
      );
      setStats(monthlyStats);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">加载统计数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-800">数据统计</h2>
        <TrendingUp className="w-6 h-6 text-blue-600" />
      </div>

      {/* 时间范围选择 */}
      <div className="flex items-center space-x-4">
        <div className="flex bg-white rounded-lg shadow-sm border border-neutral-200 p-1">
          {(['day', 'week', 'month'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              {range === 'day' ? '日' : range === 'week' ? '周' : '月'}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="任务完成率"
          value={`${stats.completionRate.toFixed(1)}%`}
          subValue={`${stats.tasksCompleted}/${stats.tasksTotal}`}
          color="blue"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="总用时"
          value={`${Math.floor(stats.totalTimeSpent / 60)}h ${Math.floor(stats.totalTimeSpent % 60)}m`}
          subValue={`${stats.totalTimeSpent.toFixed(0)} 分钟`}
          color="green"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="金币收支"
          value={`${stats.goldEarned - stats.goldSpent}`}
          subValue={`收入 ${stats.goldEarned} / 支出 ${stats.goldSpent}`}
          color="yellow"
        />
        <StatCard
          icon={<Zap className="w-6 h-6" />}
          label="成长值"
          value={`+${stats.growthPoints}`}
          subValue={`当前余额 ${stats.goldBalance}`}
          color="purple"
        />
      </div>

      {/* 详细统计 */}
      <div className="space-y-4">
        {/* 任务类型分布 */}
        <CollapsibleSection
          title="任务类型分布"
          isExpanded={expandedSections.has('taskTypes')}
          onToggle={() => toggleSection('taskTypes')}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.tasksByType).map(([type, count]) => (
              <div key={type} className="bg-neutral-50 rounded-lg p-4">
                <div className="text-2xl mb-2">{getTaskTypeIcon(type)}</div>
                <div className="text-sm text-neutral-600">{getTaskTypeName(type)}</div>
                <div className="text-2xl font-bold text-neutral-800">{count}</div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* 时间分布 */}
        <CollapsibleSection
          title="时间分布"
          isExpanded={expandedSections.has('hourly')}
          onToggle={() => toggleSection('hourly')}
        >
          <div className="grid grid-cols-12 gap-2">
            {stats.hourlyDistribution.map((count, hour) => (
              <div key={hour} className="flex flex-col items-center">
                <div
                  className="w-full bg-blue-600 rounded-t"
                  style={{
                    height: `${Math.max(count * 10, 4)}px`,
                    opacity: count > 0 ? 1 : 0.2,
                  }}
                ></div>
                <div className="text-xs text-neutral-600 mt-1">{hour}</div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* 成长维度 */}
        <CollapsibleSection
          title="成长维度"
          isExpanded={expandedSections.has('dimensions')}
          onToggle={() => toggleSection('dimensions')}
        >
          <div className="space-y-3">
            {stats.topDimensions.map((dim, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-32 text-sm font-medium text-neutral-700">{dim.name}</div>
                <div className="flex-1 bg-neutral-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min((dim.value / 100) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm font-semibold text-blue-600">
                  +{dim.value}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* 周统计 */}
        {timeRange === 'week' && 'dailyStats' in stats && (
          <CollapsibleSection
            title="每日详情"
            isExpanded={expandedSections.has('daily')}
            onToggle={() => toggleSection('daily')}
          >
            <div className="space-y-2">
              {stats.dailyStats.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-neutral-700 w-24">{day.date}</div>
                    <div className="text-sm text-neutral-600">
                      {day.tasksCompleted}/{day.tasksTotal} 任务
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-sm">
                      <span className="text-neutral-600">完成率:</span>
                      <span className="ml-2 font-semibold text-blue-600">
                        {day.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-600">金币:</span>
                      <span className="ml-2 font-semibold text-yellow-600">
                        +{day.goldEarned}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* 月统计 */}
        {timeRange === 'month' && 'predictions' in stats && (
          <CollapsibleSection
            title="趋势预测"
            isExpanded={expandedSections.has('predictions')}
            onToggle={() => toggleSection('predictions')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="text-sm text-blue-700 mb-2">下月预测成长值</div>
                <div className="text-3xl font-bold text-blue-900">
                  +{stats.predictions.nextMonthGrowth}
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                <div className="text-sm text-yellow-700 mb-2">下月预测金币</div>
                <div className="text-3xl font-bold text-yellow-900">
                  +{stats.predictions.nextMonthGold}
                </div>
              </div>
            </div>
            {stats.predictions.riskAreas.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-semibold text-red-900 mb-2">⚠️ 需要关注的领域</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                  {stats.predictions.riskAreas.map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

// 统计卡片组件
function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    green: 'from-green-500 to-green-600 text-green-600',
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-10 mb-4`}>
        <div className={colorClasses[color].split(' ')[2]}>{icon}</div>
      </div>
      <div className="text-sm text-neutral-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-neutral-800 mb-1">{value}</div>
      <div className="text-xs text-neutral-500">{subValue}</div>
    </div>
  );
}

// 可折叠区域组件
function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 transition-colors"
      >
        <h3 className="font-semibold text-neutral-800">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-600" />
        )}
      </button>
      {isExpanded && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// 辅助函数
function getTaskTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    work: '💼',
    study: '📚',
    health: '💪',
    life: '🏠',
    finance: '💰',
    creative: '🎨',
    rest: '😴',
  };
  return icons[type] || '📋';
}

function getTaskTypeName(type: string): string {
  const names: Record<string, string> = {
    work: '工作',
    study: '学习',
    health: '健康',
    life: '生活',
    finance: '财务',
    creative: '创作',
    rest: '休息',
  };
  return names[type] || type;
}

