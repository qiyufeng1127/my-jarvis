import { useState } from 'react';
import { Target, Plus, Calendar, TrendingUp, Clock, Edit, Trash2, CheckCircle } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  type: 'numeric' | 'milestone' | 'habit';
  currentValue: number;
  targetValue: number;
  unit?: string;
  deadline?: Date;
  relatedDimensions: string[];
  description: string;
  createdAt: Date;
  completedAt?: Date;
  recentProgress: { date: Date; value: number }[];
}

interface LongTermGoalsProps {
  goals: Goal[];
  onCreateGoal: () => void;
  onGoalClick: (goalId: string) => void;
  onEdit: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}

export default function LongTermGoals({
  goals,
  onCreateGoal,
  onGoalClick,
  onEdit,
  onDelete,
}: LongTermGoalsProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // 过滤目标
  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'completed') return goal.currentValue >= goal.targetValue;
    return goal.currentValue < goal.targetValue;
  });

  // 计算进度百分比
  const getProgress = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  // 获取剩余天数
  const getDaysRemaining = (deadline?: Date) => {
    if (!deadline) return null;
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // 获取目标类型标签
  const getTypeLabel = (type: Goal['type']) => {
    const labels = {
      numeric: { label: '数值型', emoji: '📊', color: 'text-white', bgColor: '#6D9978' },
      milestone: { label: '里程碑', emoji: '🏁', color: 'text-white', bgColor: '#DD617C' },
      habit: { label: '习惯型', emoji: '🔄', color: 'text-white', bgColor: '#E8C259' },
    };
    return labels[type];
  };

  // 获取状态颜色
  const getStatusColor = (goal: Goal) => {
    const progress = getProgress(goal);
    const daysRemaining = getDaysRemaining(goal.deadline);

    if (progress >= 100) return '#6D9978'; // 绿色 - 已完成
    if (daysRemaining !== null && daysRemaining < 7 && progress < 50) return '#AC0327'; // 红色 - 紧急
    if (progress >= 75) return '#DD617C'; // 粉色 - 接近完成
    if (progress >= 50) return '#E8C259'; // 黄色 - 进行中
    return '#D1CBBA'; // 米色 - 刚开始
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">长期目标</h2>
          <p className="text-sm text-neutral-600 mt-1">设定目标，追踪进展，实现梦想</p>
        </div>
        <button
          onClick={onCreateGoal}
          className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors"
          style={{ backgroundColor: '#DD617C' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c94d68'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DD617C'}
        >
          <Plus className="w-4 h-4" />
          <span>创建新目标</span>
        </button>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center space-x-2 bg-neutral-100 rounded-lg p-1">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            style={filter === f ? { 
              boxShadow: '0 0 0 2px #DD617C' 
            } : undefined}
          >
            {f === 'all' && `全部 (${goals.length})`}
            {f === 'active' && `进行中 (${goals.filter(g => g.currentValue < g.targetValue).length})`}
            {f === 'completed' && `已完成 (${goals.filter(g => g.currentValue >= g.targetValue).length})`}
          </button>
        ))}
      </div>

      {/* 目标列表 */}
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const progress = getProgress(goal);
            const daysRemaining = getDaysRemaining(goal.deadline);
            const statusColor = getStatusColor(goal);
            const typeInfo = getTypeLabel(goal.type);
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal.id}
                onClick={() => onGoalClick(goal.id)}
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group ${
                  isCompleted ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {/* 顶部彩色条 */}
                <div className="h-2" style={{ backgroundColor: statusColor }} />

                {/* 卡片内容 */}
                <div className="p-5">
                  {/* 头部 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ 
                            backgroundColor: typeInfo.bgColor,
                            color: typeInfo.color 
                          }}
                        >
                          {typeInfo.emoji} {typeInfo.label}
                        </span>
                        {isCompleted && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ 
                              backgroundColor: '#6D9978',
                              color: '#ffffff'
                            }}
                          >
                            ✓ 已完成
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-neutral-900 group-hover:text-blue-600 transition-colors">
                        {goal.name}
                      </h3>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(goal.id);
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除目标"${goal.name}"吗？`)) {
                            onDelete(goal.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* 进度信息 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-600">当前进度</span>
                      <span className="text-lg font-bold" style={{ color: statusColor }}>
                        {goal.currentValue} / {goal.targetValue} {goal.unit || ''}
                      </span>
                    </div>

                    {/* 进度条 */}
                    <div className="relative w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: statusColor,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between text-sm">
                    {/* 截止日期 */}
                    {goal.deadline && (
                      <div className="flex items-center space-x-1 text-neutral-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {daysRemaining !== null && daysRemaining >= 0 ? (
                            <span className={daysRemaining < 7 ? 'text-red-600 font-semibold' : ''}>
                              剩余 {daysRemaining} 天
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">已逾期</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* 最近进展 */}
                    {goal.recentProgress.length > 0 && (
                      <div className="flex items-center space-x-1 text-neutral-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>
                          最近 +{goal.recentProgress[goal.recentProgress.length - 1].value}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 描述 */}
                  {goal.description && (
                    <p className="text-sm text-neutral-600 mt-3 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // 空状态
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {filter === 'completed' ? '还没有完成的目标' : '还没有目标'}
          </h3>
          <p className="text-neutral-600 mb-4">
            {filter === 'completed'
              ? '完成一些目标来解锁成就'
              : '创建你的第一个长期目标，开始追踪进展'}
          </p>
          {filter !== 'completed' && (
            <button
              onClick={onCreateGoal}
              className="px-6 py-3 text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#DD617C' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c94d68'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DD617C'}
            >
              创建新目标
            </button>
          )}
        </div>
      )}

      {/* 统计卡片 */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-neutral-600 text-sm mb-1">总目标数</div>
            <div className="text-2xl font-bold" style={{ color: '#DD617C' }}>{goals.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-neutral-600 text-sm mb-1">进行中</div>
            <div className="text-2xl font-bold" style={{ color: '#E8C259' }}>
              {goals.filter(g => g.currentValue < g.targetValue).length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-neutral-600 text-sm mb-1">已完成</div>
            <div className="text-2xl font-bold" style={{ color: '#6D9978' }}>
              {goals.filter(g => g.currentValue >= g.targetValue).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

