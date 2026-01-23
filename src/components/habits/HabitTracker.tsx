import { Card, Progress, Badge } from '@/components/ui';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { BAD_HABIT_CONFIG } from '@/constants';
import type { BadHabit } from '@/types';

interface HabitTrackerProps {
  habits: BadHabit[];
}

export default function HabitTracker({ habits }: HabitTrackerProps) {
  // 计算纯净度
  const calculatePurity = () => {
    if (habits.length === 0) return 100;
    
    const totalOccurrences = habits.reduce((sum, h) => sum + h.occurrenceCount, 0);
    const maxOccurrences = habits.length * 10; // 假设每个习惯最多10次
    
    return Math.max(0, Math.round((1 - totalOccurrences / maxOccurrences) * 100));
  };

  const purity = calculatePurity();

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">坏习惯追踪</h3>
        <Badge variant={purity >= 80 ? 'success' : purity >= 60 ? 'warning' : 'danger'}>
          纯净度 {purity}%
        </Badge>
      </div>

      {/* 纯净度进度条 */}
      <div className="mb-6">
        <Progress
          value={purity}
          color={purity >= 80 ? '#047857' : purity >= 60 ? '#d97706' : '#dc2626'}
          size="lg"
        />
      </div>

      {/* 坏习惯列表 */}
      <div className="space-y-4">
        {habits.length > 0 ? (
          habits.map((habit) => {
            const config = BAD_HABIT_CONFIG[habit.habitType];
            const trend = habit.consecutiveSuccessDays > 0 ? 'up' : 'down';

            return (
              <div
                key={habit.id}
                className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">
                        {habit.customName || config.label}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        发生 {habit.occurrenceCount} 次
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-success-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <Badge
                      variant={habit.severity <= 3 ? 'success' : habit.severity <= 7 ? 'warning' : 'danger'}
                      size="sm"
                    >
                      严重度 {habit.severity}
                    </Badge>
                  </div>
                </div>

                {/* 连续成功天数 */}
                {habit.consecutiveSuccessDays > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-success-600">
                    <span>🎉</span>
                    <span>已连续 {habit.consecutiveSuccessDays} 天没有发生</span>
                  </div>
                )}

                {/* 改进计划进度 */}
                {habit.improvementPlan && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                      <span>改进计划进度</span>
                      <span>{habit.improvementPlan.progress}%</span>
                    </div>
                    <Progress
                      value={habit.improvementPlan.progress}
                      size="sm"
                      color="#7C3AED"
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✨</div>
            <p className="text-neutral-600">暂无坏习惯记录</p>
            <p className="text-sm text-neutral-500 mt-1">保持良好状态！</p>
          </div>
        )}
      </div>

      {/* 添加新习惯按钮 */}
      <button className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
        + 添加新的坏习惯追踪
      </button>
    </Card>
  );
}

