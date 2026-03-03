import { useTaskStore } from '@/stores/taskStore';
import { useTagStore } from '@/stores/tagStore';
import { useAIStore } from '@/stores/aiStore';
import type { DailyTask, RPGCharacter } from '@/stores/rpgStore';

interface AnalysisResult {
  personality: string[];
  strengths: Array<{ label: string; description: string }>;
  improvements: Array<{ label: string; description: string; progress: number }>;
  suggestedTasks: DailyTask[];
  todayStatus: string[];
}

interface UserBehaviorPattern {
  // 时间偏好
  timePreference: {
    peakHours: number[]; // 高效时段（小时）
    lowHours: number[]; // 低效时段
    preferredStartTime: number; // 偏好开始时间
    avgTaskDuration: number; // 平均任务时长（分钟）
  };
  
  // 任务类型偏好
  taskPreference: {
    highCompletionTypes: string[]; // 高完成率的任务类型
    lowCompletionTypes: string[]; // 低完成率的任务类型
    favoriteTaskTypes: string[]; // 最常做的任务类型
  };
  
  // 标签使用习惯
  tagPreference: {
    topTags: Array<{ name: string; count: number; completionRate: number }>;
    unusedTags: string[];
  };
  
  // 行为模式
  behaviorPatterns: {
    delayPattern: { count: number; avgDelayMinutes: number }; // 拖延模式
    efficientPattern: { count: number; avgEfficiency: number }; // 高效模式
    lowEfficiencyPattern: { count: number; reasons: string[] }; // 低效模式
    consistencyScore: number; // 一致性评分（0-100）
  };
}

/**
 * AI分析服务 - 基于时间轴和标签历史数据生成RPG角色信息
 */
export class RPGAIAnalyzer {
  /**
   * 深度分析用户行为模式（P0-1核心功能）
   */
  static async analyzeUserBehavior(): Promise<UserBehaviorPattern> {
    const taskStore = useTaskStore.getState();
    const tagStore = useTagStore.getState();
    
    // 获取最近30天的任务数据
    const recentTasks = this.getRecentTasks(taskStore.tasks, 30);
    
    console.log('🔍 开始深度分析用户行为，任务数量:', recentTasks.length);
    
    // 1. 分析时间偏好
    const timePreference = this.analyzeDetailedTimePatterns(recentTasks);
    
    // 2. 分析任务类型偏好
    const taskPreference = this.analyzeTaskTypePreference(recentTasks);
    
    // 3. 分析标签使用习惯
    const tagPreference = this.analyzeDetailedTagUsage(recentTasks, tagStore.tags);
    
    // 4. 分析行为模式
    const behaviorPatterns = this.analyzeBehaviorPatterns(recentTasks);
    
    const pattern = {
      timePreference,
      taskPreference,
      tagPreference,
      behaviorPatterns,
    };
    
    console.log('✅ 用户行为分析完成:', pattern);
    
    return pattern;
  }
  
  /**
   * 分析用户的时间轴和标签数据，生成完整的角色画像和任务建议
   */
  static async analyzeUserData(): Promise<AnalysisResult> {
    const taskStore = useTaskStore.getState();
    const tagStore = useTagStore.getState();
    const aiStore = useAIStore.getState();

    // 获取最近30天的任务数据
    const recentTasks = this.getRecentTasks(taskStore.tasks, 30);
    
    // 获取标签使用统计
    const tagStats = this.analyzeTagUsage(recentTasks, tagStore.tags);
    
    // 分析任务完成情况
    const completionStats = this.analyzeTaskCompletion(recentTasks);
    
    // 分析时间使用模式
    const timePatterns = this.analyzeTimePatterns(recentTasks);

    // 如果配置了AI，使用AI生成；否则使用规则生成
    if (aiStore.isConfigured()) {
      return await this.generateWithAI(recentTasks, tagStats, completionStats, timePatterns);
    } else {
      return this.generateWithRules(recentTasks, tagStats, completionStats, timePatterns);
    }
  }

  /**
   * 获取最近N天的任务
   */
  private static getRecentTasks(tasks: any[], days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return tasks.filter(task => {
      const taskDate = task.scheduledStart ? new Date(task.scheduledStart) : new Date(task.createdAt);
      return taskDate >= cutoffDate;
    });
  }
  
  /**
   * 详细分析时间偏好（P0-1新增）
   */
  private static analyzeDetailedTimePatterns(tasks: any[]) {
    const hourlyProductivity: number[] = new Array(24).fill(0);
    const hourlyTaskCount: number[] = new Array(24).fill(0);
    let totalDuration = 0;
    let taskCount = 0;
    const startTimes: number[] = [];
    
    tasks.forEach(task => {
      if (task.scheduledStart) {
        const hour = new Date(task.scheduledStart).getHours();
        hourlyTaskCount[hour]++;
        startTimes.push(hour);
        
        // 如果任务完成，计入生产力
        if (task.status === 'completed') {
          hourlyProductivity[hour]++;
        }
      }
      
      if (task.durationMinutes) {
        totalDuration += task.durationMinutes;
        taskCount++;
      }
    });
    
    // 找出高效时段（完成率 > 70%）
    const peakHours: number[] = [];
    const lowHours: number[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      if (hourlyTaskCount[hour] > 0) {
        const completionRate = (hourlyProductivity[hour] / hourlyTaskCount[hour]) * 100;
        if (completionRate >= 70) {
          peakHours.push(hour);
        } else if (completionRate < 40) {
          lowHours.push(hour);
        }
      }
    }
    
    // 计算偏好开始时间（众数）
    const preferredStartTime = startTimes.length > 0 
      ? startTimes.sort((a, b) => 
          startTimes.filter(v => v === a).length - startTimes.filter(v => v === b).length
        ).pop() || 9
      : 9;
    
    return {
      peakHours: peakHours.length > 0 ? peakHours : [9, 10, 14, 15], // 默认上午和下午
      lowHours: lowHours.length > 0 ? lowHours : [12, 13, 22, 23], // 默认午休和深夜
      preferredStartTime,
      avgTaskDuration: taskCount > 0 ? Math.round(totalDuration / taskCount) : 30,
    };
  }
  
  /**
   * 分析任务类型偏好（P0-1新增）
   */
  private static analyzeTaskTypePreference(tasks: any[]) {
    const typeStats: Record<string, { total: number; completed: number }> = {};
    
    tasks.forEach(task => {
      const type = task.taskType || 'other';
      if (!typeStats[type]) {
        typeStats[type] = { total: 0, completed: 0 };
      }
      typeStats[type].total++;
      if (task.status === 'completed') {
        typeStats[type].completed++;
      }
    });
    
    // 计算完成率
    const typeCompletionRates = Object.entries(typeStats).map(([type, stats]) => ({
      type,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      count: stats.total,
    }));
    
    // 高完成率类型（>= 70%）
    const highCompletionTypes = typeCompletionRates
      .filter(t => t.completionRate >= 70)
      .sort((a, b) => b.completionRate - a.completionRate)
      .map(t => t.type);
    
    // 低完成率类型（< 50%）
    const lowCompletionTypes = typeCompletionRates
      .filter(t => t.completionRate < 50 && t.count >= 3) // 至少3个任务才算
      .map(t => t.type);
    
    // 最常做的任务类型
    const favoriteTaskTypes = typeCompletionRates
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(t => t.type);
    
    return {
      highCompletionTypes: highCompletionTypes.length > 0 ? highCompletionTypes : ['work'],
      lowCompletionTypes,
      favoriteTaskTypes: favoriteTaskTypes.length > 0 ? favoriteTaskTypes : ['work', 'study'],
    };
  }
  
  /**
   * 详细分析标签使用习惯（P0-1新增）
   */
  private static analyzeDetailedTagUsage(tasks: any[], tags: any[]) {
    const tagStats: Record<string, { count: number; completed: number }> = {};
    
    tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach((tagId: string) => {
          if (!tagStats[tagId]) {
            tagStats[tagId] = { count: 0, completed: 0 };
          }
          tagStats[tagId].count++;
          if (task.status === 'completed') {
            tagStats[tagId].completed++;
          }
        });
      }
    });
    
    // 计算每个标签的完成率
    const topTags = Object.entries(tagStats)
      .map(([tagId, stats]) => {
        const tag = tags.find(t => t.id === tagId);
        return {
          name: tag?.name || tagId,
          count: stats.count,
          completionRate: stats.count > 0 ? (stats.completed / stats.count) * 100 : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 找出未使用的标签
    const usedTagIds = new Set(Object.keys(tagStats));
    const unusedTags = tags
      .filter(tag => !usedTagIds.has(tag.id))
      .map(tag => tag.name);
    
    return {
      topTags,
      unusedTags,
    };
  }
  
  /**
   * 分析行为模式（P0-1新增）
   */
  private static analyzeBehaviorPatterns(tasks: any[]) {
    let delayCount = 0;
    let totalDelayMinutes = 0;
    let efficientCount = 0;
    let totalEfficiency = 0;
    let lowEfficiencyCount = 0;
    const lowEfficiencyReasons: string[] = [];
    
    // 计算一致性：连续完成任务的天数
    const completionDates = new Set<string>();
    
    tasks.forEach(task => {
      // 检测拖延
      if (task.scheduledStart && task.actualStart) {
        const scheduled = new Date(task.scheduledStart);
        const actual = new Date(task.actualStart);
        const delayMinutes = (actual.getTime() - scheduled.getTime()) / (1000 * 60);
        
        if (delayMinutes > 15) { // 超过15分钟算拖延
          delayCount++;
          totalDelayMinutes += delayMinutes;
        }
      }
      
      // 检测高效
      if (task.completionEfficiency !== undefined) {
        if (task.completionEfficiency >= 80) {
          efficientCount++;
          totalEfficiency += task.completionEfficiency;
        } else if (task.completionEfficiency < 50) {
          lowEfficiencyCount++;
          if (task.efficiencyLevel) {
            lowEfficiencyReasons.push(`${task.title}: ${task.completionEfficiency}%`);
          }
        }
      }
      
      // 记录完成日期
      if (task.status === 'completed' && task.actualEnd) {
        const dateStr = new Date(task.actualEnd).toISOString().split('T')[0];
        completionDates.add(dateStr);
      }
    });
    
    // 计算一致性评分（基于完成天数占比）
    const totalDays = 30;
    const activeDays = completionDates.size;
    const consistencyScore = Math.round((activeDays / totalDays) * 100);
    
    return {
      delayPattern: {
        count: delayCount,
        avgDelayMinutes: delayCount > 0 ? Math.round(totalDelayMinutes / delayCount) : 0,
      },
      efficientPattern: {
        count: efficientCount,
        avgEfficiency: efficientCount > 0 ? Math.round(totalEfficiency / efficientCount) : 0,
      },
      lowEfficiencyPattern: {
        count: lowEfficiencyCount,
        reasons: lowEfficiencyReasons.slice(0, 3), // 只保留前3个
      },
      consistencyScore,
    };
  }

  /**
   * 分析标签使用情况
   */
  private static analyzeTagUsage(tasks: any[], tags: any[]) {
    const tagCount: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach((tagId: string) => {
          tagCount[tagId] = (tagCount[tagId] || 0) + 1;
        });
      }
    });

    // 找出最常用的标签
    const sortedTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tagId, count]) => {
        const tag = tags.find(t => t.id === tagId);
        return { tag, count };
      })
      .filter(item => item.tag);

    return sortedTags;
  }

  /**
   * 分析任务完成情况
   */
  private static analyzeTaskCompletion(tasks: any[]) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const delayed = tasks.filter(t => t.actualStartTime && t.scheduledStart && 
      new Date(t.actualStartTime) > new Date(t.scheduledStart)).length;
    const onTime = completed - delayed;
    
    return {
      total,
      completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      onTime,
      delayed,
      onTimeRate: completed > 0 ? (onTime / completed) * 100 : 0,
    };
  }

  /**
   * 分析时间使用模式
   */
  private static analyzeTimePatterns(tasks: any[]) {
    const patterns = {
      morningTasks: 0,
      afternoonTasks: 0,
      eveningTasks: 0,
      avgDuration: 0,
      focusTime: 0,
    };

    let totalDuration = 0;
    let taskCount = 0;

    tasks.forEach(task => {
      if (task.scheduledStart) {
        const hour = new Date(task.scheduledStart).getHours();
        if (hour >= 6 && hour < 12) patterns.morningTasks++;
        else if (hour >= 12 && hour < 18) patterns.afternoonTasks++;
        else patterns.eveningTasks++;
      }

      if (task.durationMinutes) {
        totalDuration += task.durationMinutes;
        taskCount++;
      }

      // 统计专注时间（假设标记为"专注"或"工作"的任务）
      if (task.title?.includes('专注') || task.title?.includes('工作')) {
        patterns.focusTime += task.durationMinutes || 0;
      }
    });

    patterns.avgDuration = taskCount > 0 ? totalDuration / taskCount : 0;

    return patterns;
  }

  /**
   * 使用AI生成分析结果
   */
  private static async generateWithAI(
    recentTasks: any[],
    tagStats: any[],
    completionStats: any,
    timePatterns: any
  ): Promise<AnalysisResult> {
    const aiStore = useAIStore.getState();
    
    // 构建提示词
    const prompt = `
你是一个专业的人生教练AI。请基于以下用户数据，生成RPG风格的角色画像和任务建议。

## 用户数据
- 最近30天任务数：${recentTasks.length}
- 任务完成率：${completionStats.completionRate.toFixed(1)}%
- 准时完成率：${completionStats.onTimeRate.toFixed(1)}%
- 拖延任务数：${completionStats.delayed}
- 平均任务时长：${timePatterns.avgDuration.toFixed(0)}分钟
- 专注时间：${(timePatterns.focusTime / 60).toFixed(1)}小时
- 常用标签：${tagStats.map(t => t.tag?.name).join('、')}

## 请生成以下内容（JSON格式）：
{
  "personality": ["性格特质1", "性格特质2", "性格特质3"],
  "strengths": [
    {"label": "优势名称", "description": "具体描述+数据支撑"}
  ],
  "improvements": [
    {"label": "待改进行为", "description": "具体描述+数据", "progress": 0}
  ],
  "todayStatus": ["今日状态标签1", "今日状态标签2"],
  "suggestedTasks": [
    {
      "title": "任务标题",
      "description": "任务描述",
      "type": "normal/improvement/surprise",
      "difficulty": "easy/medium/hard",
      "expReward": 50,
      "goldReward": 30,
      "isImprovement": false
    }
  ]
}

要求：
1. 性格特质要客观，兼顾正向与中性
2. 优势要有具体数据支撑
3. 待改进行为不贴负面标签，只描述具体行为
4. 生成5-7个任务，其中1-2个是改进任务
5. 任务要具体可执行，难度适中
`;

    try {
      const response = await fetch(aiStore.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiStore.config.apiKey}`,
        },
        body: JSON.stringify({
          model: aiStore.config.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: '你是一个专业的人生教练AI，擅长分析用户行为并给出建设性建议。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // 解析JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // 添加ID和其他必要字段
        result.suggestedTasks = result.suggestedTasks.map((task: any, index: number) => ({
          ...task,
          id: `ai-task-${Date.now()}-${index}`,
          completed: false,
        }));
        
        return result;
      }
    } catch (error) {
      console.error('AI生成失败，使用规则生成：', error);
    }

    // AI失败时回退到规则生成
    return this.generateWithRules(recentTasks, tagStats, completionStats, timePatterns);
  }

  /**
   * 智能生成任务（P0-2核心功能）
   * 基于用户行为模式生成个性化的正向任务和改进任务
   */
  static async generateSmartTasks(behaviorPattern: UserBehaviorPattern): Promise<DailyTask[]> {
    const tasks: DailyTask[] = [];
    
    console.log('🎯 开始智能生成任务，基于用户行为模式');
    
    // 1. 生成改进任务（1-2个）
    const improvementTasks = this.generateImprovementTasks(behaviorPattern);
    tasks.push(...improvementTasks);
    
    // 2. 生成正向任务（4-5个）
    const positiveTasks = this.generatePositiveTasks(behaviorPattern);
    tasks.push(...positiveTasks);
    
    // 3. 20%概率生成惊喜任务
    if (Math.random() < 0.2) {
      const surpriseTask = this.generateSurpriseTask();
      tasks.push(surpriseTask);
    }
    
    console.log('✅ 任务生成完成，共', tasks.length, '个任务');
    
    return tasks;
  }
  
  /**
   * 生成改进任务
   */
  private static generateImprovementTasks(pattern: UserBehaviorPattern): DailyTask[] {
    const tasks: DailyTask[] = [];
    
    // 检测拖延问题
    if (pattern.behaviorPatterns.delayPattern.count > 5) {
      tasks.push({
        id: `improvement-delay-${Date.now()}`,
        title: '⚠️ 改进拖延：立即开始第一个任务',
        description: `你最近${pattern.behaviorPatterns.delayPattern.count}次推迟任务，平均延迟${pattern.behaviorPatterns.delayPattern.avgDelayMinutes}分钟。今天尝试在计划时间立即开始！`,
        type: 'improvement',
        difficulty: 'medium',
        expReward: 100,
        goldReward: 60,
        completed: false,
        isImprovement: true,
      });
    }
    
    // 检测低效问题
    if (pattern.behaviorPatterns.lowEfficiencyPattern.count > 3) {
      tasks.push({
        id: `improvement-efficiency-${Date.now()}`,
        title: '⚠️ 提升效率：专注完成一个任务',
        description: `最近${pattern.behaviorPatterns.lowEfficiencyPattern.count}个任务效率较低。今天选择一个任务，排除干扰，专注完成！`,
        type: 'improvement',
        difficulty: 'medium',
        expReward: 100,
        goldReward: 60,
        completed: false,
        isImprovement: true,
      });
    }
    
    // 检测一致性问题
    if (pattern.behaviorPatterns.consistencyScore < 50) {
      tasks.push({
        id: `improvement-consistency-${Date.now()}`,
        title: '⚠️ 保持一致：连续3天完成任务',
        description: `你的一致性评分为${pattern.behaviorPatterns.consistencyScore}%。从今天开始，连续3天至少完成1个任务！`,
        type: 'improvement',
        difficulty: 'easy',
        expReward: 80,
        goldReward: 50,
        completed: false,
        isImprovement: true,
      });
    }
    
    // 检测低完成率任务类型
    if (pattern.taskPreference.lowCompletionTypes.length > 0) {
      const lowType = pattern.taskPreference.lowCompletionTypes[0];
      tasks.push({
        id: `improvement-tasktype-${Date.now()}`,
        title: `⚠️ 突破瓶颈：完成一个${lowType}任务`,
        description: `你在${lowType}类型任务上完成率较低。今天尝试完成一个，找到适合的方法！`,
        type: 'improvement',
        difficulty: 'hard',
        expReward: 120,
        goldReward: 80,
        completed: false,
        isImprovement: true,
      });
    }
    
    // 最多返回2个改进任务
    return tasks.slice(0, 2);
  }
  
  /**
   * 生成正向任务
   */
  private static generatePositiveTasks(pattern: UserBehaviorPattern): DailyTask[] {
    const tasks: DailyTask[] = [];
    
    // 基于高完成率任务类型生成
    const favoriteTypes = pattern.taskPreference.highCompletionTypes.length > 0
      ? pattern.taskPreference.highCompletionTypes
      : pattern.taskPreference.favoriteTaskTypes;
    
    // 基于常用标签生成
    const topTags = pattern.tagPreference.topTags.slice(0, 3);
    
    // 任务模板
    const templates = [
      {
        title: '晨间计划',
        description: '花10分钟规划今天的重点任务，设定优先级',
        exp: 40,
        gold: 25,
        difficulty: 'easy' as const,
      },
      {
        title: `专注${favoriteTypes[0] || '工作'}`,
        description: `完成一个${favoriteTypes[0] || '工作'}相关的重要任务`,
        exp: 80,
        gold: 50,
        difficulty: 'medium' as const,
      },
      {
        title: '高效时段冲刺',
        description: `在${pattern.timePreference.peakHours[0] || 9}:00-${(pattern.timePreference.peakHours[0] || 9) + 2}:00完成2个任务`,
        exp: 100,
        gold: 60,
        difficulty: 'medium' as const,
      },
      {
        title: topTags[0] ? `${topTags[0].name}任务` : '学习充电',
        description: topTags[0] ? `完成一个${topTags[0].name}相关任务` : '学习新知识或技能30分钟',
        exp: 60,
        gold: 40,
        difficulty: 'medium' as const,
      },
      {
        title: '每日复盘',
        description: '回顾今天的收获和不足，记录3个关键点',
        exp: 50,
        gold: 30,
        difficulty: 'easy' as const,
      },
    ];
    
    // 生成4-5个任务
    const count = Math.floor(Math.random() * 2) + 4;
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const template = templates[i];
      tasks.push({
        id: `positive-${Date.now()}-${i}`,
        title: template.title,
        description: template.description,
        type: 'normal',
        difficulty: template.difficulty,
        expReward: template.exp,
        goldReward: template.gold,
        completed: false,
        isImprovement: false,
      });
    }
    
    return tasks;
  }
  
  /**
   * 生成惊喜任务
   */
  private static generateSurpriseTask(): DailyTask {
    const surprises = [
      {
        title: '🎁 惊喜任务：做一件让自己开心的事',
        description: '今天给自己一个小奖励，做一件纯粹让自己开心的事情',
        exp: 100,
        gold: 80,
      },
      {
        title: '🎁 惊喜任务：帮助他人',
        description: '今天帮助一个人，可以是朋友、家人或陌生人',
        exp: 120,
        gold: 100,
      },
      {
        title: '🎁 惊喜任务：尝试新事物',
        description: '今天尝试一件从未做过的事情，突破舒适区',
        exp: 150,
        gold: 120,
      },
    ];
    
    const surprise = surprises[Math.floor(Math.random() * surprises.length)];
    
    return {
      id: `surprise-${Date.now()}`,
      title: surprise.title,
      description: surprise.description,
      type: 'surprise',
      difficulty: 'easy',
      expReward: surprise.exp,
      goldReward: surprise.gold,
      completed: false,
      isImprovement: false,
    };
  }
  
  /**
   * 使用规则生成分析结果（不依赖AI）
   */
  private static generateWithRules(
    recentTasks: any[],
    tagStats: any[],
    completionStats: any,
    timePatterns: any
  ): AnalysisResult {
    const personality: string[] = [];
    const strengths: Array<{ label: string; description: string }> = [];
    const improvements: Array<{ label: string; description: string; progress: number }> = [];
    const todayStatus: string[] = [];
    const suggestedTasks: DailyTask[] = [];

    // 生成性格特质
    if (completionStats.completionRate >= 80) {
      personality.push('自律');
    }
    if (completionStats.onTimeRate >= 70) {
      personality.push('守时');
    }
    if (timePatterns.focusTime > 120) {
      personality.push('专注');
    }
    personality.push('目标导向', '追求进步');

    // 生成优势
    if (completionStats.completionRate >= 80) {
      strengths.push({
        label: '执行力强',
        description: `最近30天完成率${completionStats.completionRate.toFixed(0)}%，按时完成${completionStats.onTime}个任务`
      });
    }
    if (timePatterns.focusTime > 120) {
      strengths.push({
        label: '专注能力',
        description: `累计专注时间${(timePatterns.focusTime / 60).toFixed(1)}小时，保持高效工作状态`
      });
    }

    // 生成待改进行为
    if (completionStats.delayed > 5) {
      improvements.push({
        label: '拖延',
        description: `最近${completionStats.delayed}次推迟任务，建议提前规划`,
        progress: Math.max(0, 100 - completionStats.delayed * 5)
      });
    }
    if (timePatterns.avgDuration < 30) {
      improvements.push({
        label: '任务时长规划',
        description: `平均任务时长${timePatterns.avgDuration.toFixed(0)}分钟，可能规划不够充分`,
        progress: 30
      });
    }

    // 生成今日状态
    const today = new Date();
    const todayTasks = recentTasks.filter(t => {
      const taskDate = new Date(t.scheduledStart || t.createdAt);
      return taskDate.toDateString() === today.toDateString();
    });
    
    if (todayTasks.length > 0) {
      todayStatus.push(`今日${todayTasks.length}个任务`);
    }
    todayStatus.push('精力充沛', '心情愉悦');

    // 生成建议任务
    const taskTemplates = [
      { title: '晨间计划', description: '花10分钟规划今天的重点任务', type: 'normal' as const, exp: 30, gold: 20 },
      { title: '专注工作', description: '完成一个重要工作任务', type: 'normal' as const, exp: 80, gold: 50 },
      { title: '运动健身', description: '进行30分钟运动', type: 'normal' as const, exp: 50, gold: 30 },
      { title: '学习充电', description: '学习新知识或技能', type: 'normal' as const, exp: 60, gold: 40 },
      { title: '整理复盘', description: '回顾今天的收获和不足', type: 'normal' as const, exp: 40, gold: 25 },
    ];

    // 添加改进任务
    if (completionStats.delayed > 5) {
      suggestedTasks.push({
        id: `task-${Date.now()}-improvement-1`,
        title: '⚠️ 改进拖延',
        description: '今日优先完成2个小任务，不推迟',
        type: 'improvement',
        difficulty: 'medium',
        expReward: 80,
        goldReward: 50,
        completed: false,
        isImprovement: true,
      });
    }

    // 添加普通任务
    const selectedTemplates = taskTemplates.slice(0, 5);
    selectedTemplates.forEach((template, index) => {
      suggestedTasks.push({
        id: `task-${Date.now()}-${index}`,
        title: template.title,
        description: template.description,
        type: template.type,
        difficulty: 'medium',
        expReward: template.exp,
        goldReward: template.gold,
        completed: false,
        isImprovement: false,
      });
    });

    // 添加惊喜任务（20%概率）
    if (Math.random() < 0.2) {
      suggestedTasks.push({
        id: `task-${Date.now()}-surprise`,
        title: '🎁 惊喜任务',
        description: '完成一件让自己开心的事',
        type: 'surprise',
        difficulty: 'easy',
        expReward: 100,
        goldReward: 80,
        completed: false,
        isImprovement: false,
      });
    }

    return {
      personality,
      strengths,
      improvements,
      suggestedTasks,
      todayStatus,
    };
  }

  /**
   * 快速生成今日任务（P0-2核心功能）
   * 基于用户行为模式智能生成
   */
  static async generateDailyTasks(): Promise<DailyTask[]> {
    console.log('🎯 开始生成今日任务...');
    
    try {
      // 1. 分析用户行为模式
      const behaviorPattern = await this.analyzeUserBehavior();
      
      // 2. 基于行为模式生成智能任务
      const tasks = await this.generateSmartTasks(behaviorPattern);
      
      console.log('✅ 今日任务生成完成:', tasks.length, '个任务');
      
      return tasks;
    } catch (error) {
      console.error('❌ 任务生成失败，使用默认任务:', error);
      
      // 失败时使用默认任务
      return this.generateDefaultTasks();
    }
  }
  
  /**
   * 生成默认任务（兜底方案）
   */
  private static generateDefaultTasks(): DailyTask[] {
    return [
      {
        id: `default-${Date.now()}-1`,
        title: '晨间计划',
        description: '花10分钟规划今天的重点任务',
        type: 'normal',
        difficulty: 'easy',
        expReward: 40,
        goldReward: 25,
        completed: false,
        isImprovement: false,
      },
      {
        id: `default-${Date.now()}-2`,
        title: '专注工作',
        description: '完成一个重要工作任务',
        type: 'normal',
        difficulty: 'medium',
        expReward: 80,
        goldReward: 50,
        completed: false,
        isImprovement: false,
      },
      {
        id: `default-${Date.now()}-3`,
        title: '学习充电',
        description: '学习新知识或技能30分钟',
        type: 'normal',
        difficulty: 'medium',
        expReward: 60,
        goldReward: 40,
        completed: false,
        isImprovement: false,
      },
      {
        id: `default-${Date.now()}-4`,
        title: '运动健身',
        description: '进行30分钟运动',
        type: 'normal',
        difficulty: 'medium',
        expReward: 50,
        goldReward: 30,
        completed: false,
        isImprovement: false,
      },
      {
        id: `default-${Date.now()}-5`,
        title: '每日复盘',
        description: '回顾今天的收获和不足',
        type: 'normal',
        difficulty: 'easy',
        expReward: 40,
        goldReward: 25,
        completed: false,
        isImprovement: false,
      },
    ];
  }

  /**
   * 更新角色画像
   */
  static async updateCharacterProfile(): Promise<Partial<RPGCharacter>> {
    const result = await this.analyzeUserData();
    
    return {
      personality: result.personality,
      strengths: result.strengths,
      improvements: result.improvements,
    };
  }
}

