import { useTaskStore } from '@/stores/taskStore';
import type { DailyTask } from '@/stores/rpgStore';

/**
 * RPG任务同步服务 - 将RPG任务同步到时间轴
 */
export class RPGTaskSyncService {
  /**
   * 将单个RPG任务同步到时间轴
   */
  static async syncTaskToTimeline(rpgTask: DailyTask): Promise<string> {
    const taskStore = useTaskStore.getState();
    
    // 计算任务开始时间（默认为当前时间后1小时）
    const scheduledStart = new Date();
    scheduledStart.setHours(scheduledStart.getHours() + 1);
    scheduledStart.setMinutes(0);
    scheduledStart.setSeconds(0);
    
    // 根据难度设置任务时长
    const durationMap = {
      easy: 30,
      medium: 60,
      hard: 120,
    };
    const duration = durationMap[rpgTask.difficulty];
    
    // 创建时间轴任务
    const timelineTask = {
      id: `rpg-sync-${rpgTask.id}`,
      title: rpgTask.title,
      description: rpgTask.description,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: new Date(scheduledStart.getTime() + duration * 60000).toISOString(),
      durationMinutes: duration,
      status: 'pending' as const,
      priority: rpgTask.isImprovement ? 'high' as const : 'medium' as const,
      tags: rpgTask.isImprovement ? ['改进任务'] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // 关联RPG任务信息
      metadata: {
        rpgTaskId: rpgTask.id,
        rpgTaskType: rpgTask.type,
        expReward: rpgTask.expReward,
        goldReward: rpgTask.goldReward,
      },
    };
    
    // 添加到时间轴
    await taskStore.createTask(timelineTask);
    
    return timelineTask.id;
  }

  /**
   * 批量同步所有RPG任务到时间轴
   */
  static async syncAllTasksToTimeline(rpgTasks: DailyTask[]): Promise<{
    success: number;
    failed: number;
    taskIds: string[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      taskIds: [] as string[],
    };

    // 按优先级排序：改进任务优先
    const sortedTasks = [...rpgTasks].sort((a, b) => {
      if (a.isImprovement && !b.isImprovement) return -1;
      if (!a.isImprovement && b.isImprovement) return 1;
      return 0;
    });

    // 计算任务开始时间（从当前时间后1小时开始，依次排列）
    let currentTime = new Date();
    currentTime.setHours(currentTime.getHours() + 1);
    currentTime.setMinutes(0);
    currentTime.setSeconds(0);

    for (const rpgTask of sortedTasks) {
      try {
        const taskStore = useTaskStore.getState();
        
        // 根据难度设置任务时长
        const durationMap = {
          easy: 30,
          medium: 60,
          hard: 120,
        };
        const duration = durationMap[rpgTask.difficulty];
        
        // 创建时间轴任务
        const timelineTask = {
          id: `rpg-sync-${rpgTask.id}`,
          title: rpgTask.title,
          description: rpgTask.description,
          scheduledStart: currentTime.toISOString(),
          scheduledEnd: new Date(currentTime.getTime() + duration * 60000).toISOString(),
          durationMinutes: duration,
          status: 'pending' as const,
          priority: rpgTask.isImprovement ? 'high' as const : 'medium' as const,
          tags: rpgTask.isImprovement ? ['改进任务'] : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            rpgTaskId: rpgTask.id,
            rpgTaskType: rpgTask.type,
            expReward: rpgTask.expReward,
            goldReward: rpgTask.goldReward,
          },
        };
        
        await taskStore.createTask(timelineTask);
        
        results.success++;
        results.taskIds.push(timelineTask.id);
        
        // 更新下一个任务的开始时间（加上当前任务时长+15分钟休息）
        currentTime = new Date(currentTime.getTime() + (duration + 15) * 60000);
        
      } catch (error) {
        console.error('同步任务失败：', rpgTask.title, error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * 智能安排任务时间（根据用户习惯）
   */
  static async smartScheduleTasks(rpgTasks: DailyTask[]): Promise<{
    success: number;
    failed: number;
    taskIds: string[];
  }> {
    const taskStore = useTaskStore.getState();
    const results = {
      success: 0,
      failed: 0,
      taskIds: [] as string[],
    };

    // 分析用户的时间偏好
    const recentTasks = taskStore.tasks.slice(-30);
    const timePreference = this.analyzeTimePreference(recentTasks);

    // 按优先级和类型分组
    const improvementTasks = rpgTasks.filter(t => t.isImprovement);
    const normalTasks = rpgTasks.filter(t => !t.isImprovement && t.type === 'normal');
    const surpriseTasks = rpgTasks.filter(t => t.type === 'surprise');

    // 改进任务安排在用户最高效的时间段
    let currentTime = new Date();
    currentTime.setHours(timePreference.mostProductiveHour);
    currentTime.setMinutes(0);
    currentTime.setSeconds(0);

    // 如果最高效时间已过，安排到明天
    if (currentTime < new Date()) {
      currentTime.setDate(currentTime.getDate() + 1);
    }

    // 安排改进任务
    for (const task of improvementTasks) {
      try {
        await this.scheduleTask(task, currentTime);
        results.success++;
        results.taskIds.push(`rpg-sync-${task.id}`);
        
        const duration = this.getDuration(task.difficulty);
        currentTime = new Date(currentTime.getTime() + (duration + 15) * 60000);
      } catch (error) {
        console.error('安排任务失败：', task.title, error);
        results.failed++;
      }
    }

    // 普通任务分散在一天中
    for (const task of normalTasks) {
      try {
        await this.scheduleTask(task, currentTime);
        results.success++;
        results.taskIds.push(`rpg-sync-${task.id}`);
        
        const duration = this.getDuration(task.difficulty);
        currentTime = new Date(currentTime.getTime() + (duration + 30) * 60000);
      } catch (error) {
        console.error('安排任务失败：', task.title, error);
        results.failed++;
      }
    }

    // 惊喜任务安排在晚上
    currentTime.setHours(19, 0, 0, 0);
    for (const task of surpriseTasks) {
      try {
        await this.scheduleTask(task, currentTime);
        results.success++;
        results.taskIds.push(`rpg-sync-${task.id}`);
      } catch (error) {
        console.error('安排任务失败：', task.title, error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * 分析用户的时间偏好
   */
  private static analyzeTimePreference(tasks: any[]) {
    const hourStats: Record<number, number> = {};
    
    tasks.forEach(task => {
      if (task.scheduledStart && task.status === 'completed') {
        const hour = new Date(task.scheduledStart).getHours();
        hourStats[hour] = (hourStats[hour] || 0) + 1;
      }
    });

    // 找出最常完成任务的时间段
    const mostProductiveHour = Object.entries(hourStats)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 9; // 默认9点

    return {
      mostProductiveHour: parseInt(mostProductiveHour as string),
      hourStats,
    };
  }

  /**
   * 安排单个任务
   */
  private static async scheduleTask(rpgTask: DailyTask, scheduledStart: Date) {
    const taskStore = useTaskStore.getState();
    const duration = this.getDuration(rpgTask.difficulty);
    
    const timelineTask = {
      id: `rpg-sync-${rpgTask.id}`,
      title: rpgTask.title,
      description: rpgTask.description,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: new Date(scheduledStart.getTime() + duration * 60000).toISOString(),
      durationMinutes: duration,
      status: 'pending' as const,
      priority: rpgTask.isImprovement ? 'high' as const : 'medium' as const,
      tags: rpgTask.isImprovement ? ['改进任务'] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        rpgTaskId: rpgTask.id,
        rpgTaskType: rpgTask.type,
        expReward: rpgTask.expReward,
        goldReward: rpgTask.goldReward,
      },
    };
    
    await taskStore.createTask(timelineTask);
  }

  /**
   * 根据难度获取任务时长
   */
  private static getDuration(difficulty: 'easy' | 'medium' | 'hard'): number {
    const durationMap = {
      easy: 30,
      medium: 60,
      hard: 120,
    };
    return durationMap[difficulty];
  }

  /**
   * 检查任务是否已同步
   */
  static isTaskSynced(rpgTaskId: string): boolean {
    const taskStore = useTaskStore.getState();
    return taskStore.tasks.some(t => t.id === `rpg-sync-${rpgTaskId}`);
  }

  /**
   * 取消同步（删除时间轴中的任务）
   */
  static async unsyncTask(rpgTaskId: string): Promise<void> {
    const taskStore = useTaskStore.getState();
    const timelineTaskId = `rpg-sync-${rpgTaskId}`;
    
    const task = taskStore.tasks.find(t => t.id === timelineTaskId);
    if (task) {
      await taskStore.deleteTask(timelineTaskId);
    }
  }
}

