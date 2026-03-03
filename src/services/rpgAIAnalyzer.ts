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

/**
 * AI分析服务 - 基于时间轴和标签历史数据生成RPG角色信息
 */
export class RPGAIAnalyzer {
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
   * 快速生成今日任务（不需要完整分析）
   */
  static async generateDailyTasks(): Promise<DailyTask[]> {
    const result = await this.analyzeUserData();
    return result.suggestedTasks;
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

