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
   * 智能安排任务时间（P0-3增强版）
   * 根据用户习惯和空闲时段智能调度
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

    console.log('🎯 开始智能调度任务，共', rpgTasks.length, '个任务');

    // 1. 获取今日已有任务，找出空闲时段
    const today = new Date();
    const todayTasks = taskStore.tasks.filter(t => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return taskDate.toDateString() === today.toDateString();
    });

    // 2. 分析用户的时间偏好
    const recentTasks = taskStore.tasks.slice(-30);
    const timePreference = this.analyzeTimePreference(recentTasks);

    // 3. 找出空闲时段
    const freeSlots = this.findFreeTimeSlots(todayTasks, today);
    console.log('📅 找到', freeSlots.length, '个空闲时段');

    // 4. 按优先级和类型分组
    const improvementTasks = rpgTasks.filter(t => t.isImprovement);
    const normalTasks = rpgTasks.filter(t => !t.isImprovement && t.type === 'normal');
    const surpriseTasks = rpgTasks.filter(t => t.type === 'surprise');

    // 5. 优先安排改进任务到最高效时段
    for (const task of improvementTasks) {
      try {
        const duration = this.getDuration(task.difficulty);
        const bestSlot = this.findBestSlot(freeSlots, duration, timePreference.mostProductiveHour);
        
        if (bestSlot) {
          await this.scheduleTask(task, bestSlot.start);
          results.success++;
          results.taskIds.push(`rpg-sync-${task.id}`);
          
          // 从空闲时段中移除已使用的时间
          this.removeUsedSlot(freeSlots, bestSlot.start, duration);
          console.log('✅ 改进任务已安排:', task.title, '时间:', bestSlot.start.toLocaleTimeString());
        } else {
          console.warn('⚠️ 没有合适的时段安排改进任务:', task.title);
          results.failed++;
        }
      } catch (error) {
        console.error('❌ 安排任务失败：', task.title, error);
        results.failed++;
      }
    }

    // 6. 安排普通任务到其他空闲时段
    for (const task of normalTasks) {
      try {
        const duration = this.getDuration(task.difficulty);
        const bestSlot = this.findBestSlot(freeSlots, duration);
        
        if (bestSlot) {
          await this.scheduleTask(task, bestSlot.start);
          results.success++;
          results.taskIds.push(`rpg-sync-${task.id}`);
          
          this.removeUsedSlot(freeSlots, bestSlot.start, duration);
          console.log('✅ 普通任务已安排:', task.title, '时间:', bestSlot.start.toLocaleTimeString());
        } else {
          console.warn('⚠️ 没有合适的时段安排普通任务:', task.title);
          results.failed++;
        }
      } catch (error) {
        console.error('❌ 安排任务失败：', task.title, error);
        results.failed++;
      }
    }

    // 7. 惊喜任务安排在晚上空闲时段
    for (const task of surpriseTasks) {
      try {
        const duration = this.getDuration(task.difficulty);
        const eveningSlot = this.findEveningSlot(freeSlots, duration);
        
        if (eveningSlot) {
          await this.scheduleTask(task, eveningSlot.start);
          results.success++;
          results.taskIds.push(`rpg-sync-${task.id}`);
          console.log('✅ 惊喜任务已安排:', task.title, '时间:', eveningSlot.start.toLocaleTimeString());
        } else {
          console.warn('⚠️ 没有合适的晚间时段安排惊喜任务:', task.title);
          results.failed++;
        }
      } catch (error) {
        console.error('❌ 安排任务失败：', task.title, error);
        results.failed++;
      }
    }

    console.log('🎉 任务调度完成，成功:', results.success, '失败:', results.failed);

    return results;
  }
  
  /**
   * 找出今日空闲时段
   */
  private static findFreeTimeSlots(todayTasks: any[], today: Date): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    
    // 工作时间：8:00 - 22:00
    const workStart = new Date(today);
    workStart.setHours(8, 0, 0, 0);
    
    const workEnd = new Date(today);
    workEnd.setHours(22, 0, 0, 0);
    
    // 如果当前时间已过8点，从当前时间开始
    const now = new Date();
    const startTime = now > workStart ? now : workStart;
    
    // 按时间排序已有任务
    const sortedTasks = todayTasks
      .filter(t => t.scheduledStart && t.scheduledEnd)
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    
    // 找出空闲时段
    let currentTime = startTime;
    
    for (const task of sortedTasks) {
      const taskStart = new Date(task.scheduledStart);
      const taskEnd = new Date(task.scheduledEnd);
      
      // 如果当前时间和任务开始时间之间有空隙（至少30分钟）
      if (taskStart.getTime() - currentTime.getTime() >= 30 * 60 * 1000) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(taskStart),
        });
      }
      
      // 更新当前时间为任务结束时间
      if (taskEnd > currentTime) {
        currentTime = taskEnd;
      }
    }
    
    // 最后一个任务到工作结束时间的空闲
    if (workEnd.getTime() - currentTime.getTime() >= 30 * 60 * 1000) {
      slots.push({
        start: new Date(currentTime),
        end: new Date(workEnd),
      });
    }
    
    // 如果没有空闲时段，创建默认时段
    if (slots.length === 0) {
      const defaultStart = new Date(startTime);
      defaultStart.setMinutes(defaultStart.getMinutes() + 30);
      
      slots.push({
        start: defaultStart,
        end: workEnd,
      });
    }
    
    return slots;
  }
  
  /**
   * 找出最佳时段（优先考虑偏好时间）
   */
  private static findBestSlot(
    freeSlots: Array<{ start: Date; end: Date }>,
    durationMinutes: number,
    preferredHour?: number
  ): { start: Date; end: Date } | null {
    // 找出能容纳该任务的时段
    const suitableSlots = freeSlots.filter(slot => {
      const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
      return slotDuration >= durationMinutes;
    });
    
    if (suitableSlots.length === 0) return null;
    
    // 如果有偏好时间，优先选择包含该时间的时段
    if (preferredHour !== undefined) {
      const preferredSlot = suitableSlots.find(slot => {
        const slotHour = slot.start.getHours();
        return slotHour === preferredHour || slotHour === preferredHour - 1;
      });
      
      if (preferredSlot) return preferredSlot;
    }
    
    // 否则返回第一个合适的时段
    return suitableSlots[0];
  }
  
  /**
   * 找出晚间时段（18:00-22:00）
   */
  private static findEveningSlot(
    freeSlots: Array<{ start: Date; end: Date }>,
    durationMinutes: number
  ): { start: Date; end: Date } | null {
    const eveningSlots = freeSlots.filter(slot => {
      const hour = slot.start.getHours();
      const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
      return hour >= 18 && hour < 22 && slotDuration >= durationMinutes;
    });
    
    return eveningSlots.length > 0 ? eveningSlots[0] : null;
  }
  
  /**
   * 从空闲时段中移除已使用的时间
   */
  private static removeUsedSlot(
    freeSlots: Array<{ start: Date; end: Date }>,
    usedStart: Date,
    durationMinutes: number
  ): void {
    const usedEnd = new Date(usedStart.getTime() + durationMinutes * 60 * 1000);
    
    for (let i = 0; i < freeSlots.length; i++) {
      const slot = freeSlots[i];
      
      // 如果使用的时间在这个时段内
      if (usedStart >= slot.start && usedEnd <= slot.end) {
        // 分割时段
        const beforeSlot = {
          start: slot.start,
          end: usedStart,
        };
        
        const afterSlot = {
          start: usedEnd,
          end: slot.end,
        };
        
        // 移除原时段
        freeSlots.splice(i, 1);
        
        // 添加分割后的时段（如果足够长）
        if ((beforeSlot.end.getTime() - beforeSlot.start.getTime()) >= 30 * 60 * 1000) {
          freeSlots.splice(i, 0, beforeSlot);
          i++;
        }
        
        if ((afterSlot.end.getTime() - afterSlot.start.getTime()) >= 30 * 60 * 1000) {
          freeSlots.splice(i, 0, afterSlot);
        }
        
        break;
      }
    }
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

