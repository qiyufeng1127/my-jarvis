import { useRPGStore } from '@/stores/rpgStore';
import type { Achievement } from '@/stores/rpgStore';
import { RPGNotificationService } from './rpgNotificationService';

/**
 * RPG成就系统联动服务（P1核心功能）
 * 自动检测并解锁成就
 */
export class RPGAchievementService {
  // 预定义成就列表
  private static readonly ACHIEVEMENTS: Achievement[] = [
    // 成长类
    {
      id: 'first-task',
      title: '初次尝试',
      description: '完成第一个RPG任务',
      icon: '🎯',
      category: 'growth',
      unlocked: false,
    },
    {
      id: 'task-master-10',
      title: '任务达人',
      description: '累计完成10个任务',
      icon: '⭐',
      category: 'growth',
      unlocked: false,
    },
    {
      id: 'task-master-50',
      title: '任务专家',
      description: '累计完成50个任务',
      icon: '🌟',
      category: 'growth',
      unlocked: false,
    },
    {
      id: 'task-master-100',
      title: '任务大师',
      description: '累计完成100个任务',
      icon: '💫',
      category: 'growth',
      unlocked: false,
    },
    {
      id: 'level-5',
      title: '初露锋芒',
      description: '达到5级',
      icon: '🔰',
      category: 'growth',
      unlocked: false,
    },
    {
      id: 'level-10',
      title: '小有成就',
      description: '达到10级',
      icon: '🏅',
      category: 'growth',
      unlocked: false,
    },
    {
      id: 'level-20',
      title: '卓越成长',
      description: '达到20级',
      icon: '🏆',
      category: 'growth',
      unlocked: false,
    },
    
    // 改进类
    {
      id: 'improvement-first',
      title: '改过自新',
      description: '完成第一个改进任务',
      icon: '✨',
      category: 'improvement',
      unlocked: false,
    },
    {
      id: 'improvement-10',
      title: '改进达人',
      description: '完成10个改进任务',
      icon: '💪',
      category: 'improvement',
      unlocked: false,
    },
    {
      id: 'improvement-streak-3',
      title: '持续改进',
      description: '连续3天完成改进任务',
      icon: '🔥',
      category: 'improvement',
      unlocked: false,
    },
    {
      id: 'improvement-streak-7',
      title: '自律大师',
      description: '连续7天完成改进任务',
      icon: '👑',
      category: 'improvement',
      unlocked: false,
    },
    {
      id: 'no-delay-week',
      title: '准时达人',
      description: '一周内没有拖延任务',
      icon: '⏰',
      category: 'improvement',
      unlocked: false,
    },
    
    // 习惯类
    {
      id: 'daily-complete-7',
      title: '每日坚持',
      description: '连续7天完成所有任务',
      icon: '📅',
      category: 'habit',
      unlocked: false,
    },
    {
      id: 'daily-complete-30',
      title: '月度冠军',
      description: '连续30天完成所有任务',
      icon: '🎖️',
      category: 'habit',
      unlocked: false,
    },
    {
      id: 'efficiency-master',
      title: '效率之王',
      description: '连续10个任务效率超过90%',
      icon: '⚡',
      category: 'habit',
      unlocked: false,
    },
    {
      id: 'early-bird',
      title: '早起鸟儿',
      description: '连续7天在8点前完成第一个任务',
      icon: '🌅',
      category: 'habit',
      unlocked: false,
    },
    
    // 财富类
    {
      id: 'gold-1000',
      title: '小富即安',
      description: '累计赚取1000金币',
      icon: '💰',
      category: 'wealth',
      unlocked: false,
    },
    {
      id: 'gold-5000',
      title: '财源广进',
      description: '累计赚取5000金币',
      icon: '💎',
      category: 'wealth',
      unlocked: false,
    },
    {
      id: 'gold-10000',
      title: '富甲一方',
      description: '累计赚取10000金币',
      icon: '👑',
      category: 'wealth',
      unlocked: false,
    },
    
    // 隐藏成就
    {
      id: 'surprise-master',
      title: '惊喜收集家',
      description: '完成10个惊喜任务',
      icon: '🎁',
      category: 'hidden',
      unlocked: false,
    },
    {
      id: 'midnight-warrior',
      title: '午夜战士',
      description: '在凌晨完成一个任务',
      icon: '🌙',
      category: 'hidden',
      unlocked: false,
    },
    {
      id: 'perfect-day',
      title: '完美的一天',
      description: '一天内完成所有任务且效率都超过90%',
      icon: '🌈',
      category: 'hidden',
      unlocked: false,
    },
  ];
  
  /**
   * 初始化成就系统
   */
  static initializeAchievements(): void {
    const rpgStore = useRPGStore.getState();
    
    // 如果成就列表为空或不完整，初始化
    if (rpgStore.achievements.length < this.ACHIEVEMENTS.length) {
      const existingIds = new Set(rpgStore.achievements.map(a => a.id));
      const newAchievements = this.ACHIEVEMENTS.filter(a => !existingIds.has(a.id));
      
      useRPGStore.setState({
        achievements: [...rpgStore.achievements, ...newAchievements],
      });
      
      console.log('✅ 成就系统已初始化，共', this.ACHIEVEMENTS.length, '个成就');
    }
  }
  
  /**
   * 检查并解锁成就
   */
  static async checkAndUnlockAchievements(): Promise<void> {
    const rpgStore = useRPGStore.getState();
    const { useTaskStore } = await import('@/stores/taskStore');
    const taskStore = useTaskStore.getState();
    
    // 获取所有RPG任务
    const allRPGTasks = taskStore.tasks.filter(t => t.metadata?.rpgTaskId);
    const completedRPGTasks = allRPGTasks.filter(t => t.status === 'completed');
    const improvementTasks = completedRPGTasks.filter(t => t.tags?.includes('改进任务'));
    const surpriseTasks = completedRPGTasks.filter(t => t.metadata?.rpgTaskType === 'surprise');
    
    // 计算累计金币
    const totalGold = completedRPGTasks.reduce((sum, t) => sum + (t.goldEarned || 0), 0);
    
    // 检查各类成就
    const achievementsToUnlock: string[] = [];
    
    // 1. 成长类成就
    if (completedRPGTasks.length >= 1) {
      achievementsToUnlock.push('first-task');
    }
    if (completedRPGTasks.length >= 10) {
      achievementsToUnlock.push('task-master-10');
    }
    if (completedRPGTasks.length >= 50) {
      achievementsToUnlock.push('task-master-50');
    }
    if (completedRPGTasks.length >= 100) {
      achievementsToUnlock.push('task-master-100');
    }
    
    if (rpgStore.character.level >= 5) {
      achievementsToUnlock.push('level-5');
    }
    if (rpgStore.character.level >= 10) {
      achievementsToUnlock.push('level-10');
    }
    if (rpgStore.character.level >= 20) {
      achievementsToUnlock.push('level-20');
    }
    
    // 2. 改进类成就
    if (improvementTasks.length >= 1) {
      achievementsToUnlock.push('improvement-first');
    }
    if (improvementTasks.length >= 10) {
      achievementsToUnlock.push('improvement-10');
    }
    
    // 检查连续改进
    const improvementStreak = this.calculateImprovementStreak(improvementTasks);
    if (improvementStreak >= 3) {
      achievementsToUnlock.push('improvement-streak-3');
    }
    if (improvementStreak >= 7) {
      achievementsToUnlock.push('improvement-streak-7');
    }
    
    // 检查一周无拖延
    if (this.checkNoDelayWeek(allRPGTasks)) {
      achievementsToUnlock.push('no-delay-week');
    }
    
    // 3. 习惯类成就
    const dailyStreak = this.calculateDailyCompleteStreak(completedRPGTasks);
    if (dailyStreak >= 7) {
      achievementsToUnlock.push('daily-complete-7');
    }
    if (dailyStreak >= 30) {
      achievementsToUnlock.push('daily-complete-30');
    }
    
    // 检查效率连击
    if (this.checkEfficiencyStreak(completedRPGTasks, 10, 90)) {
      achievementsToUnlock.push('efficiency-master');
    }
    
    // 检查早起
    if (this.checkEarlyBirdStreak(completedRPGTasks, 7)) {
      achievementsToUnlock.push('early-bird');
    }
    
    // 4. 财富类成就
    if (totalGold >= 1000) {
      achievementsToUnlock.push('gold-1000');
    }
    if (totalGold >= 5000) {
      achievementsToUnlock.push('gold-5000');
    }
    if (totalGold >= 10000) {
      achievementsToUnlock.push('gold-10000');
    }
    
    // 5. 隐藏成就
    if (surpriseTasks.length >= 10) {
      achievementsToUnlock.push('surprise-master');
    }
    
    // 检查午夜战士
    if (this.checkMidnightWarrior(completedRPGTasks)) {
      achievementsToUnlock.push('midnight-warrior');
    }
    
    // 检查完美的一天
    if (this.checkPerfectDay(completedRPGTasks)) {
      achievementsToUnlock.push('perfect-day');
    }
    
    // 解锁成就
    for (const achievementId of achievementsToUnlock) {
      const achievement = rpgStore.achievements.find(a => a.id === achievementId);
      if (achievement && !achievement.unlocked) {
        this.unlockAchievement(achievementId);
      }
    }
  }
  
  /**
   * 解锁成就
   */
  private static unlockAchievement(achievementId: string): void {
    const rpgStore = useRPGStore.getState();
    const achievement = rpgStore.achievements.find(a => a.id === achievementId);
    
    if (!achievement || achievement.unlocked) return;
    
    console.log('🏆 解锁成就:', achievement.title);
    
    // 更新store
    rpgStore.unlockAchievement(achievementId);
    
    // 显示语音提示
    RPGNotificationService.showAchievementUnlocked(achievement.title, achievement.icon);
    
    // 奖励经验和金币
    const expReward = 100;
    const goldReward = 50;
    
    rpgStore.addExp(expReward);
    rpgStore.addGold(goldReward);
    
    console.log('🎁 成就奖励: +', expReward, '经验, +', goldReward, '金币');
  }
  
  /**
   * 计算改进任务连续天数
   */
  private static calculateImprovementStreak(improvementTasks: any[]): number {
    if (improvementTasks.length === 0) return 0;
    
    // 按日期分组
    const dateMap = new Map<string, boolean>();
    improvementTasks.forEach(task => {
      const date = task.actualEnd ? new Date(task.actualEnd).toDateString() : '';
      if (date) {
        dateMap.set(date, true);
      }
    });
    
    // 计算连续天数
    let streak = 0;
    let currentDate = new Date();
    
    while (dateMap.has(currentDate.toDateString())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }
  
  /**
   * 检查一周无拖延
   */
  private static checkNoDelayWeek(tasks: any[]): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentTasks = tasks.filter(t => {
      const taskDate = t.actualEnd ? new Date(t.actualEnd) : null;
      return taskDate && taskDate >= oneWeekAgo;
    });
    
    if (recentTasks.length === 0) return false;
    
    // 检查是否有拖延
    const hasDelay = recentTasks.some(t => {
      if (!t.scheduledStart || !t.actualStart) return false;
      const scheduled = new Date(t.scheduledStart);
      const actual = new Date(t.actualStart);
      return actual.getTime() - scheduled.getTime() > 15 * 60 * 1000; // 超过15分钟
    });
    
    return !hasDelay;
  }
  
  /**
   * 计算每日完成连续天数
   */
  private static calculateDailyCompleteStreak(completedTasks: any[]): number {
    // 按日期分组，统计每天完成的任务数
    const dateMap = new Map<string, number>();
    completedTasks.forEach(task => {
      const date = task.actualEnd ? new Date(task.actualEnd).toDateString() : '';
      if (date) {
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });
    
    // 计算连续天数（每天至少完成1个任务）
    let streak = 0;
    let currentDate = new Date();
    
    while (dateMap.has(currentDate.toDateString()) && (dateMap.get(currentDate.toDateString()) || 0) > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }
  
  /**
   * 检查效率连击
   */
  private static checkEfficiencyStreak(tasks: any[], count: number, threshold: number): boolean {
    const recentTasks = tasks
      .filter(t => t.completionEfficiency !== undefined)
      .sort((a, b) => new Date(b.actualEnd).getTime() - new Date(a.actualEnd).getTime())
      .slice(0, count);
    
    if (recentTasks.length < count) return false;
    
    return recentTasks.every(t => t.completionEfficiency >= threshold);
  }
  
  /**
   * 检查早起连击
   */
  private static checkEarlyBirdStreak(tasks: any[], days: number): boolean {
    // 按日期分组，找出每天第一个完成的任务
    const dateMap = new Map<string, any>();
    tasks.forEach(task => {
      const date = task.actualEnd ? new Date(task.actualEnd).toDateString() : '';
      if (date) {
        const existing = dateMap.get(date);
        if (!existing || new Date(task.actualEnd) < new Date(existing.actualEnd)) {
          dateMap.set(date, task);
        }
      }
    });
    
    // 检查连续天数，每天第一个任务在8点前完成
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const dateStr = currentDate.toDateString();
      const firstTask = dateMap.get(dateStr);
      
      if (firstTask) {
        const hour = new Date(firstTask.actualEnd).getHours();
        if (hour < 8) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak >= days;
  }
  
  /**
   * 检查午夜战士
   */
  private static checkMidnightWarrior(tasks: any[]): boolean {
    return tasks.some(t => {
      if (!t.actualEnd) return false;
      const hour = new Date(t.actualEnd).getHours();
      return hour >= 0 && hour < 6; // 凌晨0-6点
    });
  }
  
  /**
   * 检查完美的一天
   */
  private static checkPerfectDay(tasks: any[]): boolean {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(t => {
      const date = t.actualEnd ? new Date(t.actualEnd).toDateString() : '';
      return date === today;
    });
    
    if (todayTasks.length === 0) return false;
    
    // 所有任务都完成且效率都超过90%
    return todayTasks.every(t => 
      t.status === 'completed' && 
      t.completionEfficiency !== undefined && 
      t.completionEfficiency >= 90
    );
  }
}

