// ============================================
// 用户画像服务 - 动态了解用户
// ============================================

import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useBadHabitStore } from '@/stores/badHabitStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';

/**
 * 用户画像数据结构
 */
export interface UserProfile {
  // 基础信息
  userId: string;
  createdAt: string; // 首次使用时间
  lastUpdated: string; // 最后更新时间
  usageDays: number; // 使用天数
  
  // 了解度
  understandingLevel: number; // 0-100
  understandingStage: string; // 初识/熟悉/了解/深度了解/知心/灵魂伴侣
  
  // 性格特征
  personality: {
    traits: string[]; // 性格特征列表
    workStyle: string; // 工作风格
    emotionType: string; // 情绪类型
    socialPattern: string; // 社交模式
    decisionStyle: string; // 决策风格
  };
  
  // 行为模式
  patterns: {
    timePatterns: TimePattern[]; // 时间模式
    emotionPatterns: EmotionPattern[]; // 情绪模式
    workPatterns: WorkPattern[]; // 工作模式
    habitPatterns: HabitPattern[]; // 习惯模式
  };
  
  // 目标体系
  goals: {
    coreGoals: string[]; // 核心目标
    motivations: string[]; // 深层动机
    values: string[]; // 价值观
    beliefs: string[]; // 信念
  };
  
  // 优势与挑战
  strengths: Strength[]; // 优势列表
  challenges: Challenge[]; // 挑战列表
  
  // AI观察
  observations: string[]; // AI的观察记录
  insights: string[]; // AI的洞察
  concerns: string[]; // AI的担忧
  
  // 成长轨迹
  growthHistory: GrowthRecord[]; // 成长记录
}

export interface TimePattern {
  type: string; // golden/low/sleep
  timeRange: string; // 时间范围
  description: string; // 描述
  confidence: number; // 置信度
}

export interface EmotionPattern {
  trigger: string; // 触发因素
  emotion: string; // 情绪
  behavior: string; // 行为反应
  frequency: number; // 出现频率
}

export interface WorkPattern {
  condition: string; // 条件
  efficiency: number; // 效率
  description: string; // 描述
}

export interface HabitPattern {
  habit: string; // 习惯
  trigger: string; // 触发场景
  frequency: number; // 频率
  impact: string; // 影响
}

export interface Strength {
  name: string;
  type: 'talent' | 'skill' | 'character'; // 天赋/技能/品质
  description: string;
  evidence: string[]; // 证据
  application: string; // 应用建议
}

export interface Challenge {
  name: string;
  severity: number; // 1-5星
  manifestation: string; // 表现
  rootCause: string; // 根本原因
  impact: string; // 影响
  solution: string; // 解决方案
}

export interface GrowthRecord {
  date: string;
  metric: string; // 指标
  before: number;
  after: number;
  improvement: number; // 提升百分比
  description: string;
}

/**
 * 用户画像服务
 */
export class UserProfileService {
  private static readonly STORAGE_KEY = 'user_profile';
  
  /**
   * 获取用户画像
   */
  static getUserProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('读取用户画像失败:', error);
      return null;
    }
  }
  
  /**
   * 保存用户画像
   */
  static saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('保存用户画像失败:', error);
    }
  }
  
  /**
   * 初始化用户画像
   */
  static initializeProfile(): UserProfile {
    const now = new Date().toISOString();
    
    const profile: UserProfile = {
      userId: crypto.randomUUID(),
      createdAt: now,
      lastUpdated: now,
      usageDays: 1,
      understandingLevel: 2,
      understandingStage: '初识阶段',
      personality: {
        traits: [],
        workStyle: '观察中...',
        emotionType: '观察中...',
        socialPattern: '观察中...',
        decisionStyle: '观察中...',
      },
      patterns: {
        timePatterns: [],
        emotionPatterns: [],
        workPatterns: [],
        habitPatterns: [],
      },
      goals: {
        coreGoals: [],
        motivations: [],
        values: [],
        beliefs: [],
      },
      strengths: [],
      challenges: [],
      observations: [],
      insights: [],
      concerns: [],
      growthHistory: [],
    };
    
    this.saveUserProfile(profile);
    return profile;
  }
  
  /**
   * 更新用户画像
   */
  static async updateProfile(): Promise<UserProfile> {
    let profile = this.getUserProfile();
    
    if (!profile) {
      profile = this.initializeProfile();
    }
    
    // 更新使用天数
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    profile.usageDays = daysSinceCreation + 1;
    
    // 更新了解度
    profile.understandingLevel = this.calculateUnderstandingLevel(profile);
    profile.understandingStage = this.getUnderstandingStage(profile.understandingLevel);
    
    // 分析并更新各项数据
    await this.analyzePersonality(profile);
    await this.analyzePatterns(profile);
    await this.analyzeGoals(profile);
    await this.analyzeStrengthsAndChallenges(profile);
    await this.generateObservations(profile);
    
    profile.lastUpdated = new Date().toISOString();
    this.saveUserProfile(profile);
    
    return profile;
  }
  
  /**
   * 计算了解度
   */
  private static calculateUnderstandingLevel(profile: UserProfile): number {
    let level = 0;
    
    // 基础了解度 (0-40%)
    const usageDays = profile.usageDays;
    level += Math.min(20, usageDays * 0.5); // 使用天数，最高20%
    
    // 检查数据完整度
    const hasTagData = true; // TODO: 检查是否有标签数据
    const hasEmotionData = true; // TODO: 检查是否有情绪记录
    const hasGoalData = useGoalStore.getState().goals.length > 0;
    const hasSideHustleData = useSideHustleStore.getState().sideHustles.length > 0;
    
    if (hasTagData) level += 5;
    if (hasEmotionData) level += 5;
    if (hasGoalData) level += 5;
    if (hasSideHustleData) level += 5;
    
    // 深度了解度 (0-40%)
    const patternCount = 
      profile.patterns.timePatterns.length +
      profile.patterns.emotionPatterns.length +
      profile.patterns.workPatterns.length +
      profile.patterns.habitPatterns.length;
    
    if (patternCount >= 3) level += 10;
    if (profile.personality.traits.length >= 5) level += 10;
    if (profile.patterns.habitPatterns.length > 0) level += 10;
    if (profile.goals.motivations.length > 0) level += 10;
    
    // 时间加成 (0-20%)
    if (usageDays >= 7) level += 5;
    if (usageDays >= 30) level += 10;
    if (usageDays >= 90) level += 15;
    if (usageDays >= 180) level += 20;
    
    return Math.min(100, level);
  }
  
  /**
   * 获取了解度阶段
   */
  private static getUnderstandingStage(level: number): string {
    if (level <= 10) return '初识阶段';
    if (level <= 30) return '熟悉阶段';
    if (level <= 50) return '了解阶段';
    if (level <= 70) return '深度了解阶段';
    if (level <= 90) return '知心阶段';
    return '灵魂伴侣阶段';
  }
  
  /**
   * 分析性格特征
   */
  private static async analyzePersonality(profile: UserProfile): Promise<void> {
    const memories = useMemoryStore.getState().memories;
    const goals = useGoalStore.getState().goals;
    const tasks = useTaskStore.getState().tasks;
    const habits = useBadHabitStore.getState().habits;
    const sideHustles = useSideHustleStore.getState().sideHustles;
    
    const traits: string[] = [];
    
    // 基于目标数量分析
    if (goals.length > 5) {
      traits.push('雄心勃勃');
      traits.push('目标导向');
    } else if (goals.length > 2) {
      traits.push('有追求');
      traits.push('规划性强');
    } else if (goals.length > 0) {
      traits.push('有目标感');
    }
    
    // 基于任务完成情况分析
    const completedTasks = tasks.filter(t => t.completed);
    const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
    
    if (completionRate > 0.8) {
      traits.push('执行力强');
      traits.push('自律');
    } else if (completionRate > 0.5) {
      traits.push('有行动力');
    } else if (completionRate < 0.3 && tasks.length > 5) {
      traits.push('容易拖延');
    }
    
    // 基于情绪记录分析
    const moodMemories = memories.filter(m => m.type === 'mood');
    if (moodMemories.length > 10) {
      traits.push('情感丰富');
      traits.push('善于自我觉察');
    } else if (moodMemories.length > 5) {
      traits.push('关注内心');
    }
    
    // 基于副业追踪分析
    if (sideHustles.length > 2) {
      traits.push('多元发展');
      traits.push('探索精神');
    } else if (sideHustles.length > 0) {
      traits.push('有副业意识');
    }
    
    // 基于坏习惯管理分析
    if (habits.length > 0) {
      traits.push('勇于面对问题');
      traits.push('自我改进意识强');
    }
    
    // 基于使用天数分析
    if (profile.usageDays > 30) {
      traits.push('坚持不懈');
      traits.push('长期主义者');
    } else if (profile.usageDays > 7) {
      traits.push('有毅力');
    }
    
    // 去重
    profile.personality.traits = Array.from(new Set(traits));
    
    // 分析工作风格
    if (completionRate > 0.7) {
      profile.personality.workStyle = '高效执行型';
    } else if (goals.length > 3) {
      profile.personality.workStyle = '规划思考型';
    } else {
      profile.personality.workStyle = '探索成长型';
    }
    
    // 分析情绪类型
    if (moodMemories.length > 10) {
      profile.personality.emotionType = '情感敏感型';
    } else if (moodMemories.length > 5) {
      profile.personality.emotionType = '情感平衡型';
    } else {
      profile.personality.emotionType = '理性稳定型';
    }
    
    // 分析决策风格
    if (goals.length > 3 && completionRate > 0.6) {
      profile.personality.decisionStyle = '果断行动型';
    } else if (goals.length > 3) {
      profile.personality.decisionStyle = '谨慎规划型';
    } else {
      profile.personality.decisionStyle = '灵活适应型';
    }
  }
  
  /**
   * 分析行为模式
   */
  private static async analyzePatterns(profile: UserProfile): Promise<void> {
    const tasks = useTaskStore.getState().tasks;
    const habits = useBadHabitStore.getState().habits;
    const memories = useMemoryStore.getState().memories;
    
    // 分析时间模式
    const timePatterns: TimePattern[] = [];
    
    // 分析任务完成的时间分布
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);
    if (completedTasks.length > 10) {
      const hourCounts: { [hour: number]: number } = {};
      
      completedTasks.forEach(task => {
        if (task.completedAt) {
          const hour = new Date(task.completedAt).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      
      // 找出高效时段
      const sortedHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      
      if (sortedHours.length > 0) {
        const topHour = parseInt(sortedHours[0][0]);
        let timeRange = '';
        let type = '';
        
        if (topHour >= 6 && topHour < 12) {
          timeRange = '早上 6:00-12:00';
          type = 'golden';
        } else if (topHour >= 12 && topHour < 18) {
          timeRange = '下午 12:00-18:00';
          type = 'golden';
        } else if (topHour >= 18 && topHour < 24) {
          timeRange = '晚上 18:00-24:00';
          type = 'golden';
        } else {
          timeRange = '深夜 0:00-6:00';
          type = 'golden';
        }
        
        timePatterns.push({
          type,
          timeRange,
          description: `你在${timeRange}的效率最高，完成了${sortedHours[0][1]}个任务`,
          confidence: Math.min(0.9, sortedHours[0][1] / completedTasks.length),
        });
      }
    }
    
    profile.patterns.timePatterns = timePatterns;
    
    // 分析情绪模式
    const emotionPatterns: EmotionPattern[] = [];
    const moodMemories = memories.filter(m => m.type === 'mood');
    
    if (moodMemories.length > 5) {
      // 简单的情绪模式识别
      const emotionCounts: { [key: string]: number } = {};
      
      moodMemories.forEach(m => {
        const emotion = m.content || '未知';
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
      
      Object.entries(emotionCounts).forEach(([emotion, count]) => {
        if (count > 2) {
          emotionPatterns.push({
            trigger: '日常生活',
            emotion,
            behavior: '记录情绪',
            frequency: count,
          });
        }
      });
    }
    
    profile.patterns.emotionPatterns = emotionPatterns;
    
    // 分析工作模式
    const workPatterns: WorkPattern[] = [];
    
    if (tasks.length > 10) {
      const completionRate = tasks.filter(t => t.completed).length / tasks.length;
      
      if (completionRate > 0.7) {
        workPatterns.push({
          condition: '设定明确目标',
          efficiency: completionRate,
          description: '你在有明确目标时执行力很强',
        });
      }
      
      if (completionRate < 0.3) {
        workPatterns.push({
          condition: '任务过多',
          efficiency: completionRate,
          description: '任务过多时容易感到压力，完成率下降',
        });
      }
    }
    
    profile.patterns.workPatterns = workPatterns;
    
    // 分析习惯模式
    const habitPatterns: HabitPattern[] = [];
    
    habits.forEach(habit => {
      const recentOccurrences = habit.occurrences.filter(occ => {
        const daysSince = (Date.now() - new Date(occ.occurredAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });
      
      if (recentOccurrences.length > 0) {
        habitPatterns.push({
          habit: habit.name,
          trigger: habit.triggerScenarios.join('、') || '未知',
          frequency: recentOccurrences.length,
          impact: habit.severity > 3 ? '较大' : '一般',
        });
      }
    });
    
    profile.patterns.habitPatterns = habitPatterns;
  }
  
  /**
   * 分析目标体系
   */
  private static async analyzeGoals(profile: UserProfile): Promise<void> {
    const goals = useGoalStore.getState().goals;
    
    // 核心目标
    profile.goals.coreGoals = goals.map(g => g.name);
    
    // 分析深层动机
    const motivations: string[] = [];
    
    // 基于目标类型分析动机
    const goalDescriptions = goals.map(g => g.description?.toLowerCase() || '').join(' ');
    
    if (goalDescriptions.includes('财务') || goalDescriptions.includes('赚钱') || goalDescriptions.includes('收入')) {
      motivations.push('追求财务自由');
    }
    
    if (goalDescriptions.includes('健康') || goalDescriptions.includes('运动') || goalDescriptions.includes('身体')) {
      motivations.push('追求健康生活');
    }
    
    if (goalDescriptions.includes('学习') || goalDescriptions.includes('技能') || goalDescriptions.includes('成长')) {
      motivations.push('追求自我提升');
    }
    
    if (goalDescriptions.includes('事业') || goalDescriptions.includes('工作') || goalDescriptions.includes('职业')) {
      motivations.push('追求事业成功');
    }
    
    if (goalDescriptions.includes('家庭') || goalDescriptions.includes('关系') || goalDescriptions.includes('爱情')) {
      motivations.push('追求美好关系');
    }
    
    if (goals.length > 5) {
      motivations.push('渴望全面发展');
    }
    
    if (goals.some(g => g.deadline)) {
      motivations.push('有时间紧迫感');
    }
    
    profile.goals.motivations = motivations.length > 0 ? motivations : ['探索人生方向'];
    
    // 分析价值观
    const values: string[] = [];
    
    if (goals.length > 3) {
      values.push('成长');
      values.push('进步');
    }
    
    if (goals.some(g => g.description?.includes('帮助') || g.description?.includes('贡献'))) {
      values.push('利他');
    }
    
    if (goals.some(g => g.targetValue && g.targetValue > 0)) {
      values.push('目标导向');
    }
    
    profile.goals.values = values.length > 0 ? values : ['自我实现'];
    
    // 分析信念
    const beliefs: string[] = [];
    
    if (profile.usageDays > 7) {
      beliefs.push('相信坚持的力量');
    }
    
    if (goals.length > 0) {
      beliefs.push('相信目标能带来改变');
    }
    
    if (goals.some(g => g.currentValue > 0)) {
      beliefs.push('相信行动胜于空想');
    }
    
    profile.goals.beliefs = beliefs.length > 0 ? beliefs : ['相信自己能变得更好'];
  }
  
  /**
   * 分析优势与挑战
   */
  private static async analyzeStrengthsAndChallenges(profile: UserProfile): Promise<void> {
    const tasks = useTaskStore.getState().tasks;
    const goals = useGoalStore.getState().goals;
    const habits = useBadHabitStore.getState().habits;
    const sideHustles = useSideHustleStore.getState().sideHustles;
    
    const strengths: Strength[] = [];
    const challenges: Challenge[] = [];
    
    // 分析优势
    const completedTasks = tasks.filter(t => t.completed);
    const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
    
    // 执行力优势
    if (completionRate > 0.7 && tasks.length > 10) {
      strengths.push({
        name: '强大的执行力',
        type: 'skill',
        description: '你能够高效地完成任务，执行力很强',
        evidence: [
          `完成了 ${completedTasks.length} 个任务`,
          `任务完成率达到 ${(completionRate * 100).toFixed(0)}%`,
        ],
        application: '可以承担更有挑战性的项目，发挥你的执行优势',
      });
    }
    
    // 规划能力优势
    if (goals.length > 3) {
      strengths.push({
        name: '出色的规划能力',
        type: 'skill',
        description: '你善于设定目标和制定计划',
        evidence: [
          `设定了 ${goals.length} 个长期目标`,
          '目标清晰，有明确的方向',
        ],
        application: '可以尝试更长远的规划，制定3-5年的人生蓝图',
      });
    }
    
    // 自我觉察优势
    if (habits.length > 0) {
      strengths.push({
        name: '良好的自我觉察',
        type: 'character',
        description: '你能够认识到自己的问题并主动改进',
        evidence: [
          `识别了 ${habits.length} 个需要改进的习惯`,
          '勇于面对自己的不足',
        ],
        application: '继续保持这种自我觉察，定期反思和调整',
      });
    }
    
    // 多元发展优势
    if (sideHustles.length > 1) {
      strengths.push({
        name: '多元发展能力',
        type: 'talent',
        description: '你不满足于单一发展，勇于探索多个领域',
        evidence: [
          `正在追踪 ${sideHustles.length} 个副业项目`,
          '有探索精神和行动力',
        ],
        application: '可以尝试将不同领域的经验整合，创造独特价值',
      });
    }
    
    // 坚持优势
    if (profile.usageDays > 30) {
      strengths.push({
        name: '持之以恒的毅力',
        type: 'character',
        description: '你能够长期坚持使用系统，这是很难得的品质',
        evidence: [
          `已经坚持使用 ${profile.usageDays} 天`,
          '展现了长期主义的态度',
        ],
        application: '这种毅力是成功的关键，继续保持',
      });
    }
    
    profile.strengths = strengths;
    
    // 分析挑战
    
    // 拖延问题
    if (completionRate < 0.3 && tasks.length > 5) {
      challenges.push({
        name: '拖延倾向',
        severity: 4,
        manifestation: `任务完成率较低（${(completionRate * 100).toFixed(0)}%），很多任务没有完成`,
        rootCause: '可能是任务过多、缺乏动力、或者完美主义导致',
        impact: '影响目标达成，容易产生焦虑和自责',
        solution: '尝试番茄工作法，将大任务分解成小步骤，先完成再完美',
      });
    }
    
    // 目标过多
    if (goals.length > 8) {
      challenges.push({
        name: '目标分散',
        severity: 3,
        manifestation: `设定了 ${goals.length} 个目标，可能精力分散`,
        rootCause: '想要的太多，没有明确的优先级',
        impact: '容易感到疲惫，难以在某个领域深入',
        solution: '聚焦2-3个最重要的目标，其他的可以暂时搁置',
      });
    }
    
    // 坏习惯问题
    const recentHabitOccurrences = habits.reduce((sum, h) => {
      const recent = h.occurrences.filter(occ => {
        const daysSince = (Date.now() - new Date(occ.occurredAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });
      return sum + recent.length;
    }, 0);
    
    if (recentHabitOccurrences > 5) {
      challenges.push({
        name: '习惯改变困难',
        severity: habits.some(h => h.severity > 3) ? 4 : 3,
        manifestation: `最近7天内坏习惯发生了 ${recentHabitOccurrences} 次`,
        rootCause: '习惯的触发场景没有改变，缺乏替代行为',
        impact: '影响效率和心情，阻碍目标达成',
        solution: '识别触发场景，准备替代行为，寻求支持系统',
      });
    }
    
    // 缺乏行动
    if (goals.length > 0 && tasks.length < 5) {
      challenges.push({
        name: '目标与行动脱节',
        severity: 3,
        manifestation: '有目标但缺乏具体行动',
        rootCause: '目标太抽象，没有分解成可执行的任务',
        impact: '目标停留在想法层面，难以实现',
        solution: '将每个目标分解成具体的行动步骤，每天至少完成一个小任务',
      });
    }
    
    profile.challenges = challenges;
  }
  
  /**
   * 生成AI观察
   */
  private static async generateObservations(profile: UserProfile): Promise<void> {
    const observations: string[] = [];
    const insights: string[] = [];
    const concerns: string[] = [];
    
    const tasks = useTaskStore.getState().tasks;
    const goals = useGoalStore.getState().goals;
    const habits = useBadHabitStore.getState().habits;
    const memories = useMemoryStore.getState().memories;
    
    // 生成观察
    if (profile.usageDays === 1) {
      observations.push('今天是我们认识的第一天，你开始使用这个系统，说明你想要改变');
      observations.push('你愿意记录和追踪自己的行为，这是很好的开始');
    } else if (profile.usageDays <= 7) {
      observations.push(`我们已经认识 ${profile.usageDays} 天了，你还在坚持使用`);
      if (tasks.length > 0) {
        observations.push('你开始添加任务，将想法转化为行动');
      }
    } else if (profile.usageDays <= 30) {
      observations.push(`这 ${profile.usageDays} 天的相处，让我对你有了更多了解`);
      if (profile.personality.traits.length > 0) {
        observations.push(`我发现你是一个${profile.personality.traits.slice(0, 3).join('、')}的人`);
      }
    } else {
      observations.push(`我们已经一起走过了 ${profile.usageDays} 天`);
      observations.push('这段时间的陪伴，让我越来越懂你');
    }
    
    if (goals.length > 0) {
      observations.push(`你设定了 ${goals.length} 个目标，这些目标反映了你的追求`);
    }
    
    if (tasks.filter(t => t.completed).length > 10) {
      observations.push('你已经完成了很多任务，执行力不错');
    }
    
    if (memories.length > 20) {
      observations.push('你经常记录自己的想法和感受，这说明你很重视自我觉察');
    }
    
    profile.observations = observations;
    
    // 生成洞察
    const completionRate = tasks.length > 0 ? tasks.filter(t => t.completed).length / tasks.length : 0;
    
    if (completionRate > 0.7) {
      insights.push('你的执行力很强，这是成功的关键要素');
      insights.push('保持这种状态，你会实现更多目标');
    } else if (completionRate < 0.3 && tasks.length > 5) {
      insights.push('你可能在完成任务上遇到了困难');
      insights.push('建议从小任务开始，建立完成的正反馈');
    }
    
    if (goals.length > 5 && completionRate < 0.5) {
      insights.push('你的目标很多，但执行力跟不上');
      insights.push('建议聚焦1-2个最重要的目标，集中精力突破');
    }
    
    if (profile.patterns.timePatterns.length > 0) {
      const goldenTime = profile.patterns.timePatterns.find(p => p.type === 'golden');
      if (goldenTime) {
        insights.push(`你在${goldenTime.timeRange}效率最高，可以把重要任务安排在这个时段`);
      }
    }
    
    if (profile.strengths.length > 0) {
      insights.push(`你的优势是${profile.strengths[0].name}，要充分发挥这个优势`);
    }
    
    if (profile.usageDays > 30 && completionRate > 0.6) {
      insights.push('你已经建立了良好的习惯，继续保持');
      insights.push('现在可以尝试更有挑战性的目标');
    }
    
    profile.insights = insights;
    
    // 生成担忧
    if (completionRate < 0.2 && tasks.length > 10) {
      concerns.push('你的任务完成率很低，我有点担心你的状态');
      concerns.push('是不是遇到了什么困难？需要调整一下节奏吗？');
    }
    
    if (habits.length > 3) {
      concerns.push(`你记录了 ${habits.length} 个坏习惯，改变习惯不容易`);
      concerns.push('不要给自己太大压力，一个一个来');
    }
    
    const recentHabitOccurrences = habits.reduce((sum, h) => {
      const recent = h.occurrences.filter(occ => {
        const daysSince = (Date.now() - new Date(occ.occurredAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });
      return sum + recent.length;
    }, 0);
    
    if (recentHabitOccurrences > 10) {
      concerns.push('最近坏习惯发生得比较频繁');
      concerns.push('要不要一起分析一下触发原因？');
    }
    
    if (goals.length > 8) {
      concerns.push('你的目标有点多，担心你会感到疲惫');
      concerns.push('记得给自己留一些休息和放松的时间');
    }
    
    if (profile.usageDays > 7 && tasks.length === 0) {
      concerns.push('你已经使用了一段时间，但还没有添加任务');
      concerns.push('是不是在观望？还是遇到了什么困难？');
    }
    
    profile.concerns = concerns;
  }
}


