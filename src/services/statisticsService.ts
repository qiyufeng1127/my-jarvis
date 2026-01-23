// ============================================
// 数据统计服务
// ============================================

import { Task, GoldTransaction, BadHabitOccurrence, GrowthHistory } from '@/types';

export interface DailyStatistics {
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  totalTimeSpent: number; // 分钟
  goldEarned: number;
  goldSpent: number;
  goldBalance: number;
  growthPoints: number;
  badHabitCount: number;
  topDimensions: Array<{ name: string; value: number }>;
  tasksByType: Record<string, number>;
  tasksByStatus: Record<string, number>;
  hourlyDistribution: number[]; // 24小时分布
  // 验证统计
  verificationStats?: {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    skippedVerifications: number;
    successRate: number;
    averageVerificationTime: number; // 秒
    verificationsByType: Record<'photo' | 'upload' | 'file', number>;
  };
}

export interface WeeklyStatistics extends DailyStatistics {
  weekStart: string;
  weekEnd: string;
  dailyStats: DailyStatistics[];
  averageCompletionRate: number;
  totalGoldEarned: number;
  totalGoldSpent: number;
  mostProductiveDay: string;
  leastProductiveDay: string;
  peakHours: number[];
  improvementRate: number;
}

export interface MonthlyStatistics extends WeeklyStatistics {
  monthStart: string;
  monthEnd: string;
  weeklyStats: WeeklyStatistics[];
  growthTrend: Array<{ date: string; value: number }>;
  habitTrend: Array<{ date: string; count: number }>;
  predictions: {
    nextMonthGrowth: number;
    nextMonthGold: number;
    riskAreas: string[];
  };
}

class StatisticsService {
  // 计算每日统计
  calculateDailyStats(
    date: Date,
    tasks: Task[],
    transactions: GoldTransaction[],
    habits: BadHabitOccurrence[],
    growthHistory: GrowthHistory[]
  ): DailyStatistics {
    const dateStr = date.toISOString().split('T')[0];

    // 筛选当天的数据
    const dayTasks = tasks.filter((t) => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart).toISOString().split('T')[0];
      return taskDate === dateStr;
    });

    const dayTransactions = transactions.filter((t) => {
      const transDate = new Date(t.createdAt).toISOString().split('T')[0];
      return transDate === dateStr;
    });

    const dayHabits = habits.filter((h) => {
      const habitDate = new Date(h.occurredAt).toISOString().split('T')[0];
      return habitDate === dateStr;
    });

    const dayGrowth = growthHistory.filter((g) => {
      const growthDate = new Date(g.createdAt).toISOString().split('T')[0];
      return growthDate === dateStr;
    });

    // 计算任务统计
    const tasksCompleted = dayTasks.filter((t) => t.status === 'completed').length;
    const tasksTotal = dayTasks.length;
    const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

    // 计算总用时
    const totalTimeSpent = dayTasks.reduce((sum, task) => {
      if (task.actualStart && task.actualEnd) {
        const duration = (new Date(task.actualEnd).getTime() - new Date(task.actualStart).getTime()) / 60000;
        return sum + duration;
      }
      return sum;
    }, 0);

    // 计算金币
    const goldEarned = dayTransactions
      .filter((t) => t.transactionType === 'earn' || t.transactionType === 'bonus')
      .reduce((sum, t) => sum + t.amount, 0);

    const goldSpent = dayTransactions
      .filter((t) => t.transactionType === 'spend' || t.transactionType === 'penalty')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const goldBalance = dayTransactions.length > 0 
      ? dayTransactions[dayTransactions.length - 1].balanceAfter 
      : 0;

    // 计算成长值
    const growthPoints = dayGrowth.reduce((sum, g) => sum + g.changeAmount, 0);

    // 统计维度
    const dimensionMap = new Map<string, number>();
    dayGrowth.forEach((g) => {
      const current = dimensionMap.get(g.dimensionId) || 0;
      dimensionMap.set(g.dimensionId, current + g.changeAmount);
    });

    const topDimensions = Array.from(dimensionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 按类型统计任务
    const tasksByType: Record<string, number> = {};
    dayTasks.forEach((task) => {
      tasksByType[task.taskType] = (tasksByType[task.taskType] || 0) + 1;
    });

    // 按状态统计任务
    const tasksByStatus: Record<string, number> = {};
    dayTasks.forEach((task) => {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    });

    // 小时分布
    const hourlyDistribution = new Array(24).fill(0);
    dayTasks.forEach((task) => {
      if (task.scheduledStart) {
        const hour = new Date(task.scheduledStart).getHours();
        hourlyDistribution[hour]++;
      }
    });

    return {
      date: dateStr,
      tasksCompleted,
      tasksTotal,
      completionRate,
      totalTimeSpent,
      goldEarned,
      goldSpent,
      goldBalance,
      growthPoints,
      badHabitCount: dayHabits.length,
      topDimensions,
      tasksByType,
      tasksByStatus,
      hourlyDistribution,
    };
  }

  // 计算每周统计
  calculateWeeklyStats(
    weekStart: Date,
    tasks: Task[],
    transactions: GoldTransaction[],
    habits: BadHabitOccurrence[],
    growthHistory: GrowthHistory[]
  ): WeeklyStatistics {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // 计算每天的统计
    const dailyStats: DailyStatistics[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const stats = this.calculateDailyStats(date, tasks, transactions, habits, growthHistory);
      dailyStats.push(stats);
    }

    // 汇总统计
    const tasksCompleted = dailyStats.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const tasksTotal = dailyStats.reduce((sum, s) => sum + s.tasksTotal, 0);
    const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
    const totalTimeSpent = dailyStats.reduce((sum, s) => sum + s.totalTimeSpent, 0);
    const totalGoldEarned = dailyStats.reduce((sum, s) => sum + s.goldEarned, 0);
    const totalGoldSpent = dailyStats.reduce((sum, s) => sum + s.goldSpent, 0);
    const growthPoints = dailyStats.reduce((sum, s) => sum + s.growthPoints, 0);
    const badHabitCount = dailyStats.reduce((sum, s) => sum + s.badHabitCount, 0);

    // 找出最高效和最低效的一天
    const sortedByCompletion = [...dailyStats].sort((a, b) => b.completionRate - a.completionRate);
    const mostProductiveDay = sortedByCompletion[0]?.date || '';
    const leastProductiveDay = sortedByCompletion[sortedByCompletion.length - 1]?.date || '';

    // 计算高峰时段
    const hourlyTotal = new Array(24).fill(0);
    dailyStats.forEach((day) => {
      day.hourlyDistribution.forEach((count, hour) => {
        hourlyTotal[hour] += count;
      });
    });
    const peakHours = hourlyTotal
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((item) => item.hour);

    // 计算改进率（与上周对比）
    const averageCompletionRate = dailyStats.reduce((sum, s) => sum + s.completionRate, 0) / 7;
    const improvementRate = 0; // 需要上周数据才能计算

    // 汇总任务类型和状态
    const tasksByType: Record<string, number> = {};
    const tasksByStatus: Record<string, number> = {};
    dailyStats.forEach((day) => {
      Object.entries(day.tasksByType).forEach(([type, count]) => {
        tasksByType[type] = (tasksByType[type] || 0) + count;
      });
      Object.entries(day.tasksByStatus).forEach(([status, count]) => {
        tasksByStatus[status] = (tasksByStatus[status] || 0) + count;
      });
    });

    // 汇总维度
    const dimensionMap = new Map<string, number>();
    dailyStats.forEach((day) => {
      day.topDimensions.forEach((dim) => {
        const current = dimensionMap.get(dim.name) || 0;
        dimensionMap.set(dim.name, current + dim.value);
      });
    });
    const topDimensions = Array.from(dimensionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      date: weekStart.toISOString().split('T')[0],
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      dailyStats,
      tasksCompleted,
      tasksTotal,
      completionRate,
      totalTimeSpent,
      goldEarned: totalGoldEarned,
      goldSpent: totalGoldSpent,
      goldBalance: dailyStats[dailyStats.length - 1]?.goldBalance || 0,
      growthPoints,
      badHabitCount,
      topDimensions,
      tasksByType,
      tasksByStatus,
      hourlyDistribution: hourlyTotal,
      averageCompletionRate,
      totalGoldEarned,
      totalGoldSpent,
      mostProductiveDay,
      leastProductiveDay,
      peakHours,
      improvementRate,
    };
  }

  // 计算每月统计
  calculateMonthlyStats(
    monthStart: Date,
    tasks: Task[],
    transactions: GoldTransaction[],
    habits: BadHabitOccurrence[],
    growthHistory: GrowthHistory[]
  ): MonthlyStatistics {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    // 计算每周的统计
    const weeklyStats: WeeklyStatistics[] = [];
    let currentWeekStart = new Date(monthStart);

    while (currentWeekStart <= monthEnd) {
      const stats = this.calculateWeeklyStats(currentWeekStart, tasks, transactions, habits, growthHistory);
      weeklyStats.push(stats);

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    // 汇总统计
    const tasksCompleted = weeklyStats.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const tasksTotal = weeklyStats.reduce((sum, s) => sum + s.tasksTotal, 0);
    const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
    const totalTimeSpent = weeklyStats.reduce((sum, s) => sum + s.totalTimeSpent, 0);
    const totalGoldEarned = weeklyStats.reduce((sum, s) => sum + s.totalGoldEarned, 0);
    const totalGoldSpent = weeklyStats.reduce((sum, s) => sum + s.totalGoldSpent, 0);
    const growthPoints = weeklyStats.reduce((sum, s) => sum + s.growthPoints, 0);
    const badHabitCount = weeklyStats.reduce((sum, s) => sum + s.badHabitCount, 0);

    // 成长趋势
    const growthTrend = weeklyStats.map((week) => ({
      date: week.weekStart,
      value: week.growthPoints,
    }));

    // 习惯趋势
    const habitTrend = weeklyStats.map((week) => ({
      date: week.weekStart,
      count: week.badHabitCount,
    }));

    // 预测下个月
    const avgWeeklyGrowth = growthPoints / weeklyStats.length;
    const avgWeeklyGold = totalGoldEarned / weeklyStats.length;
    const predictions = {
      nextMonthGrowth: Math.round(avgWeeklyGrowth * 4),
      nextMonthGold: Math.round(avgWeeklyGold * 4),
      riskAreas: [] as string[],
    };

    // 识别风险区域
    if (completionRate < 70) {
      predictions.riskAreas.push('任务完成率偏低');
    }
    if (badHabitCount > 10) {
      predictions.riskAreas.push('坏习惯频率较高');
    }
    if (totalGoldSpent > totalGoldEarned * 0.8) {
      predictions.riskAreas.push('金币支出过高');
    }

    // 汇总数据
    const tasksByType: Record<string, number> = {};
    const tasksByStatus: Record<string, number> = {};
    const hourlyTotal = new Array(24).fill(0);

    weeklyStats.forEach((week) => {
      Object.entries(week.tasksByType).forEach(([type, count]) => {
        tasksByType[type] = (tasksByType[type] || 0) + count;
      });
      Object.entries(week.tasksByStatus).forEach(([status, count]) => {
        tasksByStatus[status] = (tasksByStatus[status] || 0) + count;
      });
      week.hourlyDistribution.forEach((count, hour) => {
        hourlyTotal[hour] += count;
      });
    });

    const dimensionMap = new Map<string, number>();
    weeklyStats.forEach((week) => {
      week.topDimensions.forEach((dim) => {
        const current = dimensionMap.get(dim.name) || 0;
        dimensionMap.set(dim.name, current + dim.value);
      });
    });
    const topDimensions = Array.from(dimensionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const peakHours = hourlyTotal
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((item) => item.hour);

    return {
      date: monthStart.toISOString().split('T')[0],
      weekStart: monthStart.toISOString().split('T')[0],
      weekEnd: monthEnd.toISOString().split('T')[0],
      monthStart: monthStart.toISOString().split('T')[0],
      monthEnd: monthEnd.toISOString().split('T')[0],
      dailyStats: [],
      weeklyStats,
      tasksCompleted,
      tasksTotal,
      completionRate,
      totalTimeSpent,
      goldEarned: totalGoldEarned,
      goldSpent: totalGoldSpent,
      goldBalance: weeklyStats[weeklyStats.length - 1]?.goldBalance || 0,
      growthPoints,
      badHabitCount,
      topDimensions,
      tasksByType,
      tasksByStatus,
      hourlyDistribution: hourlyTotal,
      averageCompletionRate: completionRate,
      totalGoldEarned,
      totalGoldSpent,
      mostProductiveDay: '',
      leastProductiveDay: '',
      peakHours,
      improvementRate: 0,
      growthTrend,
      habitTrend,
      predictions,
    };
  }

  // 获取实时统计
  getRealTimeStats(tasks: Task[], transactions: GoldTransaction[]): {
    todayCompleted: number;
    todayTotal: number;
    todayGold: number;
    currentStreak: number;
    totalGold: number;
  } {
    const today = new Date().toISOString().split('T')[0];

    const todayTasks = tasks.filter((t) => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart).toISOString().split('T')[0];
      return taskDate === today;
    });

    const todayCompleted = todayTasks.filter((t) => t.status === 'completed').length;
    const todayTotal = todayTasks.length;

    const todayTransactions = transactions.filter((t) => {
      const transDate = new Date(t.createdAt).toISOString().split('T')[0];
      return transDate === today;
    });

    const todayGold = todayTransactions
      .filter((t) => t.transactionType === 'earn' || t.transactionType === 'bonus')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalGold = transactions.length > 0 
      ? transactions[transactions.length - 1].balanceAfter 
      : 0;

    // 计算连续完成天数
    let currentStreak = 0;
    const sortedDates = Array.from(
      new Set(
        tasks
          .filter((t) => t.status === 'completed' && t.scheduledStart)
          .map((t) => new Date(t.scheduledStart!).toISOString().split('T')[0])
      )
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (sortedDates[i] === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      todayCompleted,
      todayTotal,
      todayGold,
      currentStreak,
      totalGold,
    };
  }

  // 计算验证统计
  calculateVerificationStats(tasks: Task[], dateRange?: { start: Date; end: Date }): {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    skippedVerifications: number;
    successRate: number;
    averageVerificationTime: number;
    verificationsByType: Record<'photo' | 'upload' | 'file', number>;
    goldLostToFailures: number;
    goldLostToSkips: number;
  } {
    let filteredTasks = tasks;

    // 如果指定了日期范围，筛选任务
    if (dateRange) {
      filteredTasks = tasks.filter((t) => {
        if (!t.scheduledStart) return false;
        const taskDate = new Date(t.scheduledStart);
        return taskDate >= dateRange.start && taskDate <= dateRange.end;
      });
    }

    // 统计需要验证的任务
    const tasksWithVerification = filteredTasks.filter(
      (t) => t.verificationStart || t.verificationComplete
    );

    let totalVerifications = 0;
    let successfulVerifications = 0;
    let failedVerifications = 0;
    let skippedVerifications = 0;
    let totalVerificationTime = 0;
    let verificationCount = 0;

    const verificationsByType: Record<'photo' | 'upload' | 'file', number> = {
      photo: 0,
      upload: 0,
      file: 0,
    };

    tasksWithVerification.forEach((task) => {
      // 统计开始验证
      if (task.verificationStart) {
        totalVerifications++;
        
        if (task.verificationStart.type !== 'none') {
          verificationsByType[task.verificationStart.type as 'photo' | 'upload' | 'file']++;
        }

        // 根据任务状态判断验证结果
        if (task.status === 'in_progress' || task.status === 'completed') {
          successfulVerifications++;
        } else if (task.status === 'failed') {
          failedVerifications++;
        } else if (task.status === 'cancelled') {
          skippedVerifications++;
        }
      }

      // 统计完成验证
      if (task.verificationComplete) {
        totalVerifications++;
        
        if (task.verificationComplete.type !== 'none') {
          verificationsByType[task.verificationComplete.type as 'photo' | 'upload' | 'file']++;
        }

        if (task.status === 'completed') {
          successfulVerifications++;
        } else if (task.status === 'verifying_complete') {
          // 正在验证中
        }
      }

      // 估算验证时间（基于任务实际开始时间和计划开始时间的差异）
      if (task.actualStart && task.scheduledStart) {
        const verificationTime = (new Date(task.actualStart).getTime() - new Date(task.scheduledStart).getTime()) / 1000;
        if (verificationTime > 0 && verificationTime < 300) { // 最多5分钟
          totalVerificationTime += verificationTime;
          verificationCount++;
        }
      }
    });

    const successRate = totalVerifications > 0 
      ? (successfulVerifications / totalVerifications) * 100 
      : 0;

    const averageVerificationTime = verificationCount > 0 
      ? totalVerificationTime / verificationCount 
      : 0;

    // 计算因验证失败和跳过而损失的金币
    const goldLostToFailures = failedVerifications * 20;
    const goldLostToSkips = skippedVerifications * 50;

    return {
      totalVerifications,
      successfulVerifications,
      failedVerifications,
      skippedVerifications,
      successRate,
      averageVerificationTime,
      verificationsByType,
      goldLostToFailures,
      goldLostToSkips,
    };
  }

  // 获取验证趋势（按天）
  getVerificationTrend(tasks: Task[], days: number = 7): Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    successRate: number;
  }> {
    const trend: Array<{
      date: string;
      total: number;
      successful: number;
      failed: number;
      skipped: number;
      successRate: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter((t) => {
        if (!t.scheduledStart) return false;
        const taskDate = new Date(t.scheduledStart).toISOString().split('T')[0];
        return taskDate === dateStr;
      });

      const stats = this.calculateVerificationStats(dayTasks);

      trend.push({
        date: dateStr,
        total: stats.totalVerifications,
        successful: stats.successfulVerifications,
        failed: stats.failedVerifications,
        skipped: stats.skippedVerifications,
        successRate: stats.successRate,
      });
    }

    return trend;
  }
}

export const statisticsService = new StatisticsService();

