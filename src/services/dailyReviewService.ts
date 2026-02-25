// ============================================
// 日复盘服务 - 每日深度分析
// ============================================

import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { useUserProfileStore } from '@/stores/userProfileStore';

/**
 * 日复盘数据结构
 */
export interface DailyReview {
  // 基础信息
  date: string; // 复盘日期
  createdAt: string; // 生成时间
  
  // 今日画像
  todayProfile: {
    timeInvestment: TimeInvestment; // 时间投入分析
    emotionCurve: EmotionPoint[]; // 情绪波动曲线
    badHabitMonitor: BadHabitRecord[]; // 坏习惯监控
    sideHustleProgress: SideHustleProgress[]; // 副业进度追踪
  };
  
  // 深度剖析
  deepAnalysis: {
    behaviorPatterns: string[]; // 行为模式
    efficiencyAnalysis: string; // 效率分析
    emotionAnalysis: string; // 情绪分析
    focusAnalysis: string; // 专注度分析
  };
  
  // 改进方案
  improvements: Improvement[]; // 5个具体改进建议
  
  // 温暖寄语
  warmMessage: string;
  
  // 统计数据
  stats: {
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
    totalTimeSpent: number; // 分钟
    goldEarned: number;
    sideHustleIncome: number;
  };
}

export interface TimeInvestment {
  categories: {
    name: string; // 类别名称
    time: number; // 分钟
    percentage: number; // 百分比
    color: string; // 显示颜色
  }[];
  totalTime: number; // 总时间（分钟）
  mostProductiveHour: number; // 最高效的小时
  leastProductiveHour: number; // 最低效的小时
}

export interface EmotionPoint {
  time: string; // 时间
  emotion: string; // 情绪
  intensity: number; // 强度 1-5
  trigger?: string; // 触发因素
}

export interface BadHabitRecord {
  habitName: string;
  occurrences: number; // 今日发生次数
  triggerScenarios: string[]; // 触发场景
  impact: string; // 影响评估
  suggestion: string; // 改进建议
}

export interface SideHustleProgress {
  name: string;
  todayIncome: number;
  todayTime: number; // 分钟
  progress: string; // 进度描述
  nextStep: string; // 下一步行动
}

export interface Improvement {
  id: string;
  priority: number; // 1-5，5最高
  category: string; // 类别：时间管理/习惯养成/目标推进/情绪管理/效率提升
  title: string; // 标题
  problem: string; // 问题描述
  solution: string; // 解决方案
  actionSteps: string[]; // 具体行动步骤
  expectedResult: string; // 预期效果
}

/**
 * 日复盘服务
 */
export class DailyReviewService {
  private static readonly STORAGE_KEY_PREFIX = 'daily_review_';
  
  /**
   * 获取指定日期的复盘
   */
  static getDailyReview(date: Date): DailyReview | null {
    try {
      const dateStr = this.formatDate(date);
      const data = localStorage.getItem(this.STORAGE_KEY_PREFIX + dateStr);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('读取日复盘失败:', error);
      return null;
    }
  }
  
  /**
   * 保存日复盘
   */
  static saveDailyReview(review: DailyReview): void {
    try {
      const dateStr = this.formatDate(new Date(review.date));
      localStorage.setItem(this.STORAGE_KEY_PREFIX + dateStr, JSON.stringify(review));
    } catch (error) {
      console.error('保存日复盘失败:', error);
    }
  }
  
  /**
   * 生成今日复盘
   */
  static async generateTodayReview(): Promise<DailyReview> {
    const today = new Date();
    const dateStr = this.formatDate(today);
    
    // 分析今日画像
    const todayProfile = await this.analyzeTodayProfile(today);
    
    // 深度剖析
    const deepAnalysis = await this.performDeepAnalysis(today, todayProfile);
    
    // 生成改进方案
    const improvements = await this.generateImprovements(today, todayProfile, deepAnalysis);
    
    // 生成温暖寄语
    const warmMessage = await this.generateWarmMessage(today, todayProfile, deepAnalysis);
    
    // 统计数据
    const stats = this.calculateStats(today);
    
    const review: DailyReview = {
      date: dateStr,
      createdAt: new Date().toISOString(),
      todayProfile,
      deepAnalysis,
      improvements,
      warmMessage,
      stats,
    };
    
    this.saveDailyReview(review);
    return review;
  }
  
  /**
   * 分析今日画像
   */
  private static async analyzeTodayProfile(date: Date): Promise<DailyReview['todayProfile']> {
    const timeInvestment = this.analyzeTimeInvestment(date);
    const emotionCurve = this.analyzeEmotionCurve(date);
    const badHabitMonitor = this.analyzeBadHabits(date);
    const sideHustleProgress = this.analyzeSideHustleProgress(date);
    
    return {
      timeInvestment,
      emotionCurve,
      badHabitMonitor,
      sideHustleProgress,
    };
  }
  
  /**
   * 分析时间投入
   */
  private static analyzeTimeInvestment(date: Date): TimeInvestment {
    const tasks = useTaskStore.getState().tasks;
    const todayTasks = tasks.filter(t => this.isSameDay(new Date(t.createdAt), date));
    
    // 按类别统计时间
    const categoryTime: { [key: string]: number } = {};
    let totalTime = 0;
    
    todayTasks.forEach(task => {
      const time = task.estimatedTime || 30; // 默认30分钟
      const category = task.tags?.[0] || '其他';
      categoryTime[category] = (categoryTime[category] || 0) + time;
      totalTime += time;
    });
    
    // 转换为数组并计算百分比
    const categories = Object.entries(categoryTime).map(([name, time], index) => ({
      name,
      time,
      percentage: totalTime > 0 ? (time / totalTime) * 100 : 0,
      color: this.getCategoryColor(index),
    })).sort((a, b) => b.time - a.time);
    
    // 分析最高效和最低效的小时
    const hourlyTasks: { [hour: number]: number } = {};
    todayTasks.filter(t => t.completed && t.completedAt).forEach(task => {
      const hour = new Date(task.completedAt!).getHours();
      hourlyTasks[hour] = (hourlyTasks[hour] || 0) + 1;
    });
    
    const hours = Object.entries(hourlyTasks).sort(([, a], [, b]) => b - a);
    const mostProductiveHour = hours.length > 0 ? parseInt(hours[0][0]) : 9;
    const leastProductiveHour = hours.length > 0 ? parseInt(hours[hours.length - 1][0]) : 15;
    
    return {
      categories,
      totalTime,
      mostProductiveHour,
      leastProductiveHour,
    };
  }
  
  /**
   * 分析情绪波动曲线
   */
  private static analyzeEmotionCurve(date: Date): EmotionPoint[] {
    const memories = useMemoryStore.getState().memories;
    const todayMemories = memories.filter(m => 
      m.type === 'mood' && this.isSameDay(new Date(m.createdAt), date)
    );
    
    return todayMemories.map(m => ({
      time: new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      emotion: m.content || '平静',
      intensity: 3, // 默认强度
      trigger: m.tags?.[0],
    }));
  }
  
  /**
   * 分析坏习惯 - 暂时返回空数组，等待原有坏习惯系统集成
   */
  private static analyzeBadHabits(date: Date): BadHabitRecord[] {
    // TODO: 集成原有的坏习惯系统
    return [];
  }
  
  /**
   * 分析副业进度
   */
  private static analyzeSideHustleProgress(date: Date): SideHustleProgress[] {
    const sideHustles = useSideHustleStore.getState().sideHustles;
    
    return sideHustles.map(sh => ({
      name: sh.name,
      todayIncome: 0, // TODO: 计算今日收入
      todayTime: 0, // TODO: 计算今日投入时间
      progress: '稳步推进中',
      nextStep: '继续保持',
    }));
  }
  
  /**
   * 深度剖析
   */
  private static async performDeepAnalysis(
    date: Date,
    todayProfile: DailyReview['todayProfile']
  ): Promise<DailyReview['deepAnalysis']> {
    const tasks = useTaskStore.getState().tasks;
    const todayTasks = tasks.filter(t => this.isSameDay(new Date(t.createdAt), date));
    const completedTasks = todayTasks.filter(t => t.completed);
    const completionRate = todayTasks.length > 0 ? completedTasks.length / todayTasks.length : 0;
    
    // 行为模式
    const behaviorPatterns: string[] = [];
    
    if (completionRate > 0.8) {
      behaviorPatterns.push('今天的执行力很强，完成率超过80%');
    } else if (completionRate < 0.3) {
      behaviorPatterns.push('今天完成率较低，可能遇到了一些困难');
    }
    
    if (todayProfile.timeInvestment.totalTime > 480) {
      behaviorPatterns.push('今天工作时间较长，注意劳逸结合');
    }
    

    
    // 效率分析
    const efficiencyAnalysis = completionRate > 0.7
      ? '今天的效率不错，保持这种状态'
      : '今天的效率有待提升，建议优化时间管理';
    
    // 情绪分析
    const emotionAnalysis = todayProfile.emotionCurve.length > 0
      ? `今天记录了${todayProfile.emotionCurve.length}次情绪，说明你在关注自己的内心状态`
      : '今天没有记录情绪，建议多关注自己的感受';
    
    // 专注度分析
    const focusAnalysis = todayTasks.length > 10
      ? '今天任务较多，可能影响专注度'
      : '今天任务量适中，有利于保持专注';
    
    return {
      behaviorPatterns,
      efficiencyAnalysis,
      emotionAnalysis,
      focusAnalysis,
    };
  }
  
  /**
   * 生成改进方案
   */
  private static async generateImprovements(
    date: Date,
    todayProfile: DailyReview['todayProfile'],
    deepAnalysis: DailyReview['deepAnalysis']
  ): Promise<Improvement[]> {
    const improvements: Improvement[] = [];
    const tasks = useTaskStore.getState().tasks;
    const todayTasks = tasks.filter(t => this.isSameDay(new Date(t.createdAt), date));
    const completionRate = todayTasks.length > 0 
      ? todayTasks.filter(t => t.completed).length / todayTasks.length 
      : 0;
    
    // 改进建议1：时间管理
    if (todayProfile.timeInvestment.totalTime > 480) {
      improvements.push({
        id: '1',
        priority: 5,
        category: '时间管理',
        title: '优化工作时长，避免过度疲劳',
        problem: `今天工作了${Math.round(todayProfile.timeInvestment.totalTime / 60)}小时，时间过长可能影响效率和健康`,
        solution: '设定合理的工作时长，每工作90分钟休息15分钟',
        actionSteps: [
          '使用番茄工作法，25分钟专注+5分钟休息',
          '设定每日工作时长上限（如8小时）',
          '晚上10点后不再工作',
        ],
        expectedResult: '提高工作效率，保持身心健康',
      });
    }
    
    // 改进建议2：任务完成率
    if (completionRate < 0.5) {
      improvements.push({
        id: '2',
        priority: 5,
        category: '效率提升',
        title: '提升任务完成率',
        problem: `今天完成率只有${(completionRate * 100).toFixed(0)}%，很多任务没有完成`,
        solution: '减少任务数量，提高单个任务的完成质量',
        actionSteps: [
          '每天只设定3-5个核心任务',
          '使用艾森豪威尔矩阵区分优先级',
          '先完成最重要的任务',
        ],
        expectedResult: '完成率提升到70%以上',
      });
    }
    
    // 改进建议3：情绪管理
    if (todayProfile.emotionCurve.length === 0) {
      improvements.push({
        id: '3',
        priority: 3,
        category: '情绪管理',
        title: '增加情绪觉察',
        problem: '今天没有记录情绪，可能忽略了内心感受',
        solution: '每天至少记录3次情绪状态',
        actionSteps: [
          '早上起床后记录一次',
          '中午休息时记录一次',
          '晚上睡前记录一次',
        ],
        expectedResult: '提高情绪觉察能力，更好地管理情绪',
      });
    }
    
    // 改进建议4：目标推进
    const goals = useGoalStore.getState().goals;
    if (goals.length > 0) {
      improvements.push({
        id: '4',
        priority: 4,
        category: '目标推进',
        title: '每天至少推进一个长期目标',
        problem: '长期目标需要持续推进，不能只关注日常任务',
        solution: '每天为长期目标分配至少1小时',
        actionSteps: [
          '早上确定今天要推进的目标',
          '在黄金时间段（高效时段）推进目标',
          '晚上复盘目标推进情况',
        ],
        expectedResult: '长期目标稳步推进，不再停滞',
      });
    }
    
    return improvements.slice(0, 4);
  }
  
  /**
   * 生成温暖寄语
   */
  private static async generateWarmMessage(
    date: Date,
    todayProfile: DailyReview['todayProfile'],
    deepAnalysis: DailyReview['deepAnalysis']
  ): Promise<string> {
    const profile = useUserProfileStore.getState().profile;
    const tasks = useTaskStore.getState().tasks;
    const todayTasks = tasks.filter(t => this.isSameDay(new Date(t.createdAt), date));
    const completedTasks = todayTasks.filter(t => t.completed);
    
    let message = '';
    
    if (completedTasks.length > 5) {
      message = `宝，今天你完成了${completedTasks.length}个任务，真的很棒！`;
    } else if (completedTasks.length > 0) {
      message = `今天你完成了${completedTasks.length}个任务，虽然不多，但每一步都是进步。`;
    } else {
      message = '今天可能遇到了一些困难，没关系，明天继续加油！';
    }
    
    message += '\n\n';
    
    if (profile && profile.usageDays > 30) {
      message += `我们已经一起走过了${profile.usageDays}天，我看到了你的坚持和努力。`;
    } else if (profile && profile.usageDays > 7) {
      message += `这${profile.usageDays}天的陪伴，让我越来越懂你。`;
    } else {
      message += '虽然我们认识的时间还不长，但我能感受到你想要变好的决心。';
    }
    
    message += '\n\n';
    message += '记住，成长不是一蹴而就的，而是每天一点点的积累。';
    message += '\n';
    message += '我会一直陪着你，见证你的每一次进步。';
    message += '\n\n';
    message += '晚安，明天继续加油！💪❤️';
    
    return message;
  }
  
  /**
   * 计算统计数据
   */
  private static calculateStats(date: Date): DailyReview['stats'] {
    const tasks = useTaskStore.getState().tasks;
    const todayTasks = tasks.filter(t => this.isSameDay(new Date(t.createdAt), date));
    const completedTasks = todayTasks.filter(t => t.completed);
    
    return {
      completedTasks: completedTasks.length,
      totalTasks: todayTasks.length,
      completionRate: todayTasks.length > 0 ? completedTasks.length / todayTasks.length : 0,
      totalTimeSpent: todayTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
      goldEarned: 0, // TODO: 计算今日金币
      sideHustleIncome: 0, // TODO: 计算今日副业收入
    };
  }
  
  // 辅助方法
  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private static isSameDay(date1: Date, date2: Date): boolean {
    return this.formatDate(date1) === this.formatDate(date2);
  }
  
  private static getCategoryColor(index: number): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[index % colors.length];
  }
  
  private static getHabitSuggestion(habitName: string, occurrences: number): string {
    if (occurrences > 3) {
      return `今天「${habitName}」发生了${occurrences}次，建议重点关注触发场景`;
    } else if (occurrences > 1) {
      return `今天「${habitName}」发生了${occurrences}次，继续保持警惕`;
    } else {
      return `今天「${habitName}」只发生了1次，控制得不错`;
    }
  }
}

