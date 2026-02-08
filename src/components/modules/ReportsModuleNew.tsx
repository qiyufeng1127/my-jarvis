import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ModuleContainer, StatCard, Card, Button, Badge } from '@/components/ui';
import { staggerContainer, staggerItem } from '@/utils/animations';
import { Download, Calendar } from 'lucide-react';
import './ReportsModuleNew.css';

export const ReportsModuleNew: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // 模拟数据
  const stats = {
    today: {
      tasksCompleted: 5,
      tasksTotal: 8,
      timeSpent: '3h 45m',
      coinsEarned: 150,
      expGained: 80,
    },
    week: {
      tasksCompleted: 28,
      tasksTotal: 35,
      timeSpent: '18h 30m',
      coinsEarned: 850,
      expGained: 420,
    },
    month: {
      tasksCompleted: 95,
      tasksTotal: 120,
      timeSpent: '65h 15m',
      coinsEarned: 3200,
      expGained: 1580,
    },
  };

  const currentStats = stats[period];
  const completionRate = Math.round((currentStats.tasksCompleted / currentStats.tasksTotal) * 100);

  return (
    <ModuleContainer
      title="数据报告"
      icon="📊"
      headerAction={
        <Button size="sm" variant="ghost" icon={<Download className="w-4 h-4" />}>
          导出
        </Button>
      }
    >
      <motion.div
        className="reports-module"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* 时间段选择 */}
        <motion.div className="reports-module__period" variants={staggerItem}>
          <Button
            size="sm"
            variant={period === 'today' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('today')}
          >
            今日
          </Button>
          <Button
            size="sm"
            variant={period === 'week' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('week')}
          >
            本周
          </Button>
          <Button
            size="sm"
            variant={period === 'month' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('month')}
          >
            本月
          </Button>
        </motion.div>

        {/* 核心数据 */}
        <motion.div className="reports-module__stats" variants={staggerItem}>
          <StatCard
            icon="✅"
            label="任务完成"
            value={`${currentStats.tasksCompleted}/${currentStats.tasksTotal}`}
            subValue={`完成率 ${completionRate}%`}
            color="green"
            trend={completionRate >= 70 ? 'up' : completionRate >= 50 ? 'neutral' : 'down'}
            trendValue={`${completionRate}%`}
          />
          <StatCard
            icon="⏰"
            label="总用时"
            value={currentStats.timeSpent}
            color="blue"
          />
          <StatCard
            icon="💰"
            label="金币收入"
            value={currentStats.coinsEarned}
            color="yellow"
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            icon="⭐"
            label="经验值"
            value={currentStats.expGained}
            color="purple"
            trend="up"
            trendValue="+8%"
          />
        </motion.div>

        {/* 今日亮点 */}
        <motion.div className="reports-module__section" variants={staggerItem}>
          <div className="reports-module__section-header">
            <h3 className="reports-module__section-title">🏆 今日亮点</h3>
          </div>
          <Card padding="md">
            <div className="reports-module__highlights">
              {currentStats.tasksCompleted > 0 ? (
                <>
                  <div className="reports-module__highlight-item">
                    <span className="reports-module__highlight-icon">🎯</span>
                    <span className="reports-module__highlight-text">
                      完成了 {currentStats.tasksCompleted} 个任务
                    </span>
                  </div>
                  <div className="reports-module__highlight-item">
                    <span className="reports-module__highlight-icon">⏱️</span>
                    <span className="reports-module__highlight-text">
                      专注工作 {currentStats.timeSpent}
                    </span>
                  </div>
                  <div className="reports-module__highlight-item">
                    <span className="reports-module__highlight-icon">💪</span>
                    <span className="reports-module__highlight-text">
                      获得 {currentStats.expGained} 经验值
                    </span>
                  </div>
                </>
              ) : (
                <div className="reports-module__empty-hint">
                  暂无数据，开始完成任务吧！
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 待改进 */}
        <motion.div className="reports-module__section" variants={staggerItem}>
          <div className="reports-module__section-header">
            <h3 className="reports-module__section-title">⚠️ 待改进</h3>
          </div>
          <Card padding="md">
            <div className="reports-module__improvements">
              {completionRate < 100 ? (
                <>
                  <div className="reports-module__improvement-item">
                    <Badge color="pink" variant="soft" size="sm">待完成</Badge>
                    <span className="reports-module__improvement-text">
                      还有 {currentStats.tasksTotal - currentStats.tasksCompleted} 个任务未完成
                    </span>
                  </div>
                  {completionRate < 70 && (
                    <div className="reports-module__improvement-item">
                      <Badge color="yellow" variant="soft" size="sm">效率</Badge>
                      <span className="reports-module__improvement-text">
                        任务完成率偏低，建议优化时间管理
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="reports-module__empty-hint">
                  太棒了！没有需要改进的地方 🎉
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 明日建议 */}
        <motion.div className="reports-module__section" variants={staggerItem}>
          <div className="reports-module__section-header">
            <h3 className="reports-module__section-title">💡 明日建议</h3>
          </div>
          <Card padding="md">
            <div className="reports-module__suggestions">
              <div className="reports-module__suggestion-item">
                <span className="reports-module__suggestion-icon">📅</span>
                <span className="reports-module__suggestion-text">
                  提前规划明天的任务清单
                </span>
              </div>
              <div className="reports-module__suggestion-item">
                <span className="reports-module__suggestion-icon">⏰</span>
                <span className="reports-module__suggestion-text">
                  设置合理的任务时间，避免过度安排
                </span>
              </div>
              <div className="reports-module__suggestion-item">
                <span className="reports-module__suggestion-icon">🎯</span>
                <span className="reports-module__suggestion-text">
                  优先完成重要且紧急的任务
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </ModuleContainer>
  );
};

