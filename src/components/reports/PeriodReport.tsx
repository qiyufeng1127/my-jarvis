import { useState } from 'react';
import { Lock, Download, Share2, TrendingUp, BarChart3, PieChart, Calendar } from 'lucide-react';
// import { Line, Bar, Doughnut } from 'react-chartjs-2';
// import type { ChartData } from 'chart.js';

interface PeriodReportData {
  period: 'week' | 'month';
  startDate: Date;
  endDate: Date;
  efficiency: {
    trend: { date: string; value: number }[];
    average: number;
    peak: number;
  };
  dimensions: {
    name: string;
    icon: string;
    change: number;
    tasks: number;
  }[];
  badHabits: {
    name: string;
    pattern: string;
    frequency: number;
  }[];
  suggestions: string[];
}

interface PeriodReportProps {
  type: 'week' | 'month';
  isUnlocked: boolean;
  unlockPrice: number;
  currentGold: number;
  reportData?: PeriodReportData;
  onUnlock: () => void;
  onDownload: (format: 'pdf' | 'excel') => void;
  onShare: () => void;
}

export default function PeriodReport({
  type,
  isUnlocked,
  unlockPrice,
  currentGold,
  reportData,
  onUnlock,
  onDownload,
  onShare,
}: PeriodReportProps) {
  const [activeTab, setActiveTab] = useState<'efficiency' | 'growth' | 'habits' | 'suggestions'>('efficiency');
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const periodName = type === 'week' ? '周报' : '月报';

  // 未解锁状态
  if (!isUnlocked) {
    return (
      <>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* 模糊预览 */}
            <div className="relative">
              <div className="p-8 filter blur-sm pointer-events-none">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">{periodName}分析</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-neutral-100 rounded-lg p-4 h-24" />
                  <div className="bg-neutral-100 rounded-lg p-4 h-24" />
                  <div className="bg-neutral-100 rounded-lg p-4 h-24" />
                </div>
                <div className="bg-neutral-100 rounded-lg p-6 h-64" />
              </div>

              {/* 解锁提示 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-12 h-12 text-neutral-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {periodName}需要解锁
                  </h3>
                  <p className="text-white/80 mb-6">
                    解锁后可查看深度分析报告
                  </p>
                  <button
                    onClick={() => setShowUnlockDialog(true)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    解锁 {periodName} ({unlockPrice} 💰)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 解锁确认对话框 */}
        {showUnlockDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                确认解锁{periodName}
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <span className="text-neutral-700">解锁价格</span>
                  <span className="text-2xl font-bold text-blue-600">{unlockPrice} 💰</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <span className="text-neutral-700">当前余额</span>
                  <span className={`text-2xl font-bold ${currentGold >= unlockPrice ? 'text-green-600' : 'text-red-600'}`}>
                    {currentGold} 💰
                  </span>
                </div>

                {currentGold < unlockPrice && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">
                      ⚠️ 金币不足，还需要 {unlockPrice - currentGold} 金币
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowUnlockDialog(false)}
                  className="flex-1 px-4 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (currentGold >= unlockPrice) {
                      onUnlock();
                      setShowUnlockDialog(false);
                    }
                  }}
                  disabled={currentGold < unlockPrice}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认解锁
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 已解锁状态
  if (!reportData) return null;

  // 图表数据 - 暂时注释，需要安装 chart.js
  /*
  // 效率趋势图数据
  const efficiencyChartData: ChartData<'line'> = {
    labels: reportData.efficiency.trend.map(t => t.date),
    datasets: [
      {
        label: '效率值',
        data: reportData.efficiency.trend.map(t => t.value),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
  */

  // 维度分布图数据
  const dimensionsChartData: ChartData<'doughnut'> = {
    labels: reportData.dimensions.map(d => d.name),
    datasets: [
      {
        data: reportData.dimensions.map(d => d.change),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
          '#6B7280',
        ],
      },
    ],
  };

  // 任务完成图数据
  const tasksChartData: ChartData<'bar'> = {
    labels: reportData.dimensions.map(d => d.icon + ' ' + d.name),
    datasets: [
      {
        label: '完成任务数',
        data: reportData.dimensions.map(d => d.tasks),
        backgroundColor: '#3B82F6',
      },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{periodName}分析</h1>
          <p className="text-neutral-600 mt-1">
            {reportData.startDate.toLocaleDateString('zh-CN')} - {reportData.endDate.toLocaleDateString('zh-CN')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onDownload('pdf')}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => onDownload('excel')}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={onShare}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>分享</span>
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b border-neutral-200">
          {[
            { key: 'efficiency' as const, label: '效率趋势', icon: TrendingUp },
            { key: 'growth' as const, label: '成长分析', icon: BarChart3 },
            { key: 'habits' as const, label: '习惯模式', icon: PieChart },
            { key: 'suggestions' as const, label: '个性化建议', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        <div className="p-6">
          {/* 效率趋势 */}
          {activeTab === 'efficiency' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-600 text-sm mb-1">平均效率</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {reportData.efficiency.average}%
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-600 text-sm mb-1">峰值效率</div>
                  <div className="text-3xl font-bold text-green-900">
                    {reportData.efficiency.peak}%
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-600 text-sm mb-1">趋势</div>
                  <div className="text-3xl font-bold text-purple-900">
                    {reportData.efficiency.trend[reportData.efficiency.trend.length - 1].value >
                    reportData.efficiency.trend[0].value
                      ? '📈 上升'
                      : '📉 下降'}
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-xl p-6" style={{ height: '400px' }}>
                {/* <Line data={efficiencyChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /> */}
                <div className="h-full flex items-center justify-center text-neutral-600">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                    <p className="text-lg font-semibold mb-2">效率趋势图</p>
                    <p className="text-sm">安装 chart.js 后可查看详细图表</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 成长分析 */}
          {activeTab === 'growth' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">维度分布</h3>
                  <div className="bg-neutral-50 rounded-xl p-6" style={{ height: '300px' }}>
                    {/* <Doughnut data={dimensionsChartData} options={{ responsive: true, maintainAspectRatio: false }} /> */}
                    <div className="h-full flex items-center justify-center text-neutral-600">
                      <div className="text-center">
                        <PieChart className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                        <p className="text-sm">维度分布图</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">任务完成</h3>
                  <div className="bg-neutral-50 rounded-xl p-6" style={{ height: '300px' }}>
                    {/* <Bar data={tasksChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /> */}
                    <div className="h-full flex items-center justify-center text-neutral-600">
                      <div className="text-center">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                        <p className="text-sm">任务完成图</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {reportData.dimensions.map((dim, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{dim.icon}</span>
                        <div>
                          <div className="font-semibold text-neutral-900">{dim.name}</div>
                          <div className="text-sm text-neutral-600">{dim.tasks} 个任务</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">+{dim.change}</div>
                        <div className="text-sm text-neutral-600">成长值</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 习惯模式 */}
          {activeTab === 'habits' && (
            <div className="space-y-4">
              {reportData.badHabits.length > 0 ? (
                reportData.badHabits.map((habit, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-red-900 mb-1">{habit.name}</h4>
                        <p className="text-red-700">{habit.pattern}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-red-600">{habit.frequency}</div>
                        <div className="text-sm text-red-700">次</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">太棒了！</h3>
                  <p className="text-neutral-600">本{type === 'week' ? '周' : '月'}没有坏习惯记录</p>
                </div>
              )}
            </div>
          )}

          {/* 个性化建议 */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              {reportData.suggestions.map((suggestion, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-neutral-800 text-lg">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

