import { useState } from 'react';
import { X, TrendingUp, Calendar, Target, Edit, Plus, CheckCircle } from 'lucide-react';
// import { Line } from 'react-chartjs-2';
// import type { ChartData, ChartOptions } from 'chart.js';

interface GoalDetailProps {
  goal: {
    id: string;
    name: string;
    type: 'numeric' | 'milestone' | 'habit';
    currentValue: number;
    targetValue: number;
    unit?: string;
    deadline?: Date;
    description: string;
    createdAt: Date;
    recentProgress: { date: Date; value: number; note?: string }[];
    contributingTasks: {
      id: string;
      title: string;
      completedAt: Date;
      contribution: number;
    }[];
  };
  onClose: () => void;
  onEdit: () => void;
  onUpdateProgress: (newValue: number, note?: string) => void;
  onTaskClick: (taskId: string) => void;
}

export default function GoalDetail({
  goal,
  onClose,
  onEdit,
  onUpdateProgress,
  onTaskClick,
}: GoalDetailProps) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateValue, setUpdateValue] = useState(goal.currentValue);
  const [updateNote, setUpdateNote] = useState('');

  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  const isCompleted = progress >= 100;

  // 计算预测完成日期
  const getPredictedCompletion = () => {
    if (goal.recentProgress.length < 2) return null;

    const recentData = goal.recentProgress.slice(-7); // 最近7天
    const avgDailyProgress = recentData.reduce((sum, item) => sum + item.value, 0) / recentData.length;
    
    if (avgDailyProgress <= 0) return null;

    const remaining = goal.targetValue - goal.currentValue;
    const daysNeeded = Math.ceil(remaining / avgDailyProgress);
    
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysNeeded);
    
    return predictedDate;
  };

  const predictedDate = getPredictedCompletion();

  // 图表数据 - 暂时注释，需要安装 chart.js
  /*
  const chartData: ChartData<'line'> = {
    labels: goal.recentProgress.map(item =>
      item.date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
    ),
    datasets: [
      {
        label: '累计进度',
        data: goal.recentProgress.map((item, index) =>
          goal.recentProgress.slice(0, index + 1).reduce((sum, p) => sum + p.value, 0)
        ),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: '目标值',
        data: goal.recentProgress.map(() => goal.targetValue),
        borderColor: '#10B981',
        borderDash: [5, 5],
        fill: false,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  */

  // 提交进度更新
  const handleSubmitUpdate = () => {
    if (updateValue < goal.currentValue) {
      alert('新值不能小于当前值');
      return;
    }
    onUpdateProgress(updateValue, updateNote);
    setShowUpdateForm(false);
    setUpdateNote('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className={`p-6 text-white relative overflow-hidden ${
          isCompleted ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'
        }`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32" />
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {isCompleted && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                      ✓ 已完成
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-bold mb-2">{goal.name}</h2>
                <p className="text-white/90">{goal.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onEdit}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* 进度信息 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-white/80 text-xs mb-1">当前进度</div>
                <div className="text-2xl font-bold">
                  {goal.currentValue} / {goal.targetValue} {goal.unit || ''}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-white/80 text-xs mb-1">完成度</div>
                <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-white/80 text-xs mb-1">
                  {goal.deadline ? '剩余天数' : '已进行'}
                </div>
                <div className="text-2xl font-bold">
                  {goal.deadline
                    ? Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : Math.ceil((Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
                  天
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 进度趋势图 */}
          <div>
            <h3 className="text-lg font-bold text-neutral-900 flex items-center mb-4">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              进度趋势
            </h3>
            <div className="bg-neutral-50 rounded-xl p-6" style={{ height: '300px' }}>
              {/* <Line data={chartData} options={chartOptions} /> */}
              <div className="h-full flex items-center justify-center text-neutral-600">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                  <p className="text-lg font-semibold mb-2">进度趋势图</p>
                  <p className="text-sm">安装 chart.js 后可查看详细趋势</p>
                  <p className="text-xs mt-2 text-neutral-500">npm install chart.js react-chartjs-2</p>
                </div>
              </div>
            </div>
          </div>

          {/* 进度预测 */}
          {predictedDate && !isCompleted && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-900 mb-1">预测完成日期</div>
                  <div className="text-blue-800">
                    根据最近的进度，预计在{' '}
                    <span className="font-bold">
                      {predictedDate.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>{' '}
                    完成目标
                  </div>
                  {goal.deadline && predictedDate > goal.deadline && (
                    <div className="text-red-600 text-sm mt-1">
                      ⚠️ 预计完成日期晚于截止日期，需要加快进度
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 更新进度按钮 */}
          {!isCompleted && (
            <button
              onClick={() => setShowUpdateForm(true)}
              className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>更新进度</span>
            </button>
          )}

          {/* 贡献任务列表 */}
          <div>
            <h3 className="text-lg font-bold text-neutral-900 flex items-center mb-4">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              贡献任务
              <span className="ml-2 text-sm font-normal text-neutral-600">
                ({goal.contributingTasks.length} 个)
              </span>
            </h3>
            
            {goal.contributingTasks.length > 0 ? (
              <div className="space-y-2">
                {goal.contributingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    className="w-full bg-white rounded-lg p-4 hover:shadow-md transition-all text-left group border border-neutral-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </div>
                        <div className="text-sm text-neutral-600 mt-1">
                          {task.completedAt.toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          +{task.contribution} {goal.unit || ''}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-8 text-center text-neutral-600">
                还没有贡献任务
              </div>
            )}
          </div>
        </div>

        {/* 进度更新表单 */}
        {showUpdateForm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-10">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-blue-600" />
                更新进度
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    新的当前值
                  </label>
                  <input
                    type="number"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(parseFloat(e.target.value) || 0)}
                    min={goal.currentValue}
                    max={goal.targetValue}
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-sm text-neutral-600 mt-1">
                    当前: {goal.currentValue} {goal.unit || ''} → 新值: {updateValue} {goal.unit || ''}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    备注 <span className="text-neutral-500 text-xs font-normal">(可选)</span>
                  </label>
                  <textarea
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="记录这次进展的详情..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowUpdateForm(false)}
                    className="flex-1 px-4 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitUpdate}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    确认更新
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

