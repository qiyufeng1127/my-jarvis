import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ModuleContainer, StatCard, Card, Button, Badge, IconBadge } from '@/components/ui';
import { staggerContainer, staggerItem } from '@/utils/animations';
import { Plus, Target, TrendingUp } from 'lucide-react';
import './GoalsModuleNew.css';

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  target: number;
  deadline?: string;
  color: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
}

export const GoalsModuleNew: React.FC = () => {
  const [goals] = useState<Goal[]>([
    {
      id: '1',
      title: '学习前端开发',
      category: '学习',
      progress: 30,
      target: 100,
      deadline: '2024-12-31',
      color: 'blue',
    },
    {
      id: '2',
      title: '健身计划',
      category: '健康',
      progress: 15,
      target: 50,
      deadline: '2024-06-30',
      color: 'green',
    },
  ]);

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.progress >= g.target).length;
  const inProgressGoals = totalGoals - completedGoals;
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress / g.target * 100), 0) / goals.length)
    : 0;

  return (
    <ModuleContainer
      title="目标"
      icon="🎯"
      headerAction={
        <Button size="sm" icon={<Plus className="w-4 h-4" />}>
          新建
        </Button>
      }
    >
      <motion.div
        className="goals-module"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* 统计卡片 */}
        <motion.div className="goals-module__stats" variants={staggerItem}>
          <StatCard
            icon="🎯"
            label="总目标"
            value={totalGoals}
            color="yellow"
          />
          <StatCard
            icon="✅"
            label="已完成"
            value={completedGoals}
            color="green"
            trend="up"
            trendValue="+2"
          />
          <StatCard
            icon="🔥"
            label="进行中"
            value={inProgressGoals}
            color="pink"
          />
          <StatCard
            icon="📊"
            label="平均进度"
            value={`${avgProgress}%`}
            color="blue"
            trend={avgProgress > 50 ? 'up' : 'neutral'}
            trendValue={`${avgProgress > 50 ? '+' : ''}${avgProgress - 50}%`}
          />
        </motion.div>

        {/* 目标列表 */}
        <motion.div className="goals-module__list" variants={staggerItem}>
          <div className="goals-module__list-header">
            <h3 className="goals-module__list-title">我的目标</h3>
            <Badge color="blue" variant="soft">{totalGoals} 个</Badge>
          </div>

          {goals.length === 0 ? (
            <Card padding="lg" className="goals-module__empty">
              <div className="goals-module__empty-content">
                <Target className="goals-module__empty-icon" />
                <p className="goals-module__empty-text">还没有目标</p>
                <p className="goals-module__empty-hint">点击右上角"新建"按钮创建第一个目标</p>
              </div>
            </Card>
          ) : (
            <div className="goals-module__cards">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  variants={staggerItem}
                  custom={index}
                >
                  <Card hover shadow="md" className="goal-card">
                    <div className="goal-card__header">
                      <IconBadge
                        icon="🎯"
                        color={goal.color}
                        size="md"
                        variant="soft"
                      />
                      <Badge color={goal.color} variant="soft" size="sm">
                        {goal.category}
                      </Badge>
                    </div>

                    <div className="goal-card__body">
                      <h4 className="goal-card__title">{goal.title}</h4>
                      
                      {/* 进度条 */}
                      <div className="goal-card__progress">
                        <div className="goal-card__progress-bar">
                          <motion.div
                            className="goal-card__progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${(goal.progress / goal.target) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{
                              backgroundColor: `var(--color-${goal.color}-500)`,
                            }}
                          />
                        </div>
                        <div className="goal-card__progress-text">
                          {goal.progress} / {goal.target}
                          <span className="goal-card__progress-percent">
                            ({Math.round((goal.progress / goal.target) * 100)}%)
                          </span>
                        </div>
                      </div>

                      {/* 截止日期 */}
                      {goal.deadline && (
                        <div className="goal-card__deadline">
                          📅 截止：{new Date(goal.deadline).toLocaleDateString('zh-CN')}
                        </div>
                      )}
                    </div>

                    <div className="goal-card__footer">
                      <Button size="sm" variant="ghost">
                        查看详情
                      </Button>
                      <Button size="sm" variant="outline">
                        更新进度
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </ModuleContainer>
  );
};

