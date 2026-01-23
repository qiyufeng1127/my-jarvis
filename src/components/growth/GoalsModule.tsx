import { useState, useEffect } from 'react';
import LongTermGoals from '@/components/growth/LongTermGoals';
import GoalForm from '@/components/growth/GoalForm';
import { useGoalStore } from '@/stores/goalStore';

interface GoalsModuleProps {
  isDark?: boolean;
  bgColor?: string;
}

/**
 * 长期目标模块 - 统一的目标管理组件
 * 集成了目标列表、详情、创建表单和智能关联功能
 */
export function GoalsModule({ isDark = false, bgColor = '#ffffff' }: GoalsModuleProps) {
  const { goals, loadGoals, createGoal, updateGoal, deleteGoal, updateGoalProgress } = useGoalStore();
  const [showDetail, setShowDetail] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 加载目标数据
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreateGoal = () => {
    setShowForm(true);
  };

  const handleGoalClick = (goalId: string) => {
    setSelectedGoalId(goalId);
    setShowDetail(true);
  };

  const handleEdit = (goalId: string) => {
    // TODO: 实现编辑功能
    alert(`编辑目标功能开发中...`);
  };

  const handleDelete = async (goalId: string) => {
    await deleteGoal(goalId);
  };

  const handleSaveGoal = async (goalData: any) => {
    await createGoal({
      name: goalData.name,
      description: goalData.description,
      goalType: goalData.type,
      targetValue: goalData.targetValue,
      unit: goalData.unit,
      deadline: goalData.deadline ? new Date(goalData.deadline) : undefined,
      relatedDimensions: goalData.relatedDimensions,
    });
    setShowForm(false);
  };

  const textColor = isDark ? '#ffffff' : '#000000';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';

  // 目标详情视图
  if (showDetail && selectedGoalId) {
    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) {
      setShowDetail(false);
      return null;
    }

    const progress = Math.min((goal.currentValue / (goal.targetValue || 1)) * 100, 100);

    return (
      <div className="h-full overflow-auto p-4" style={{ backgroundColor: bgColor }}>
        <button
          onClick={() => setShowDetail(false)}
          className="mb-4 px-3 py-1 rounded-lg text-sm"
          style={{ 
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            color: textColor 
          }}
        >
          ← 返回
        </button>

        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: textColor }}>{goal.name}</h2>
            <p className="text-sm mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#666666' }}>
              {goal.description}
            </p>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#666666' }}>
                  当前进度
                </span>
                <span className="text-lg font-bold" style={{ color: textColor }}>
                  {goal.currentValue} / {goal.targetValue} {goal.unit}
                </span>
              </div>
              <div className="w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center text-sm font-bold mt-1" style={{ color: textColor }}>
                {Math.round(progress)}%
              </div>
            </div>

            {goal.deadline && (
              <div className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#666666' }}>
                截止日期: {goal.deadline.toLocaleDateString('zh-CN')}
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              const newValue = goal.currentValue + 1;
              await updateGoalProgress(goal.id, newValue);
            }}
            className="w-full py-3 rounded-lg font-semibold"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              color: textColor,
            }}
          >
            + 记录进展
          </button>
        </div>
      </div>
    );
  }

  // 创建目标表单
  if (showForm) {
    const mockDimensions = [
      { id: '1', name: '学习进步', icon: '📚', color: '#3B82F6' },
      { id: '2', name: '工作效率', icon: '💼', color: '#10B981' },
      { id: '3', name: '健康管理', icon: '💪', color: '#EF4444' },
      { id: '4', name: '财富增长', icon: '💰', color: '#F59E0B' },
      { id: '5', name: '个人成长', icon: '🌱', color: '#8B5CF6' },
    ];

    return (
      <div style={{ backgroundColor: bgColor }}>
        <GoalForm
          dimensions={mockDimensions}
          onSave={handleSaveGoal}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  // 目标列表视图
  return (
    <div className="h-full overflow-auto p-4" style={{ backgroundColor: bgColor }}>
      <div style={{ color: textColor }}>
        <LongTermGoals
          goals={goals}
          onCreateGoal={handleCreateGoal}
          onGoalClick={handleGoalClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

