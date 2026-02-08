// ============================================
// 智能分配服务 - 统一的时间轴智能插空逻辑
// ============================================

import type { Task } from '@/types';

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // 分钟
}

export interface ScheduleTask {
  id?: string;
  title: string;
  durationMinutes: number;
  priority?: number; // 1=低, 2=中, 3=高
  hasExplicitTime?: boolean; // 是否有明确的时间要求
  explicitTime?: Date; // 明确的时间点
  tags?: string[];
  location?: string;
  goldReward?: number;
  taskType?: string;
  category?: string;
  color?: string;
  description?: string;
  subtasks?: any[];
}

export interface ScheduledResult {
  task: ScheduleTask;
  scheduledStart: Date;
  scheduledEnd: Date;
  isConflict: boolean;
  conflictWith?: Task;
}

/**
 * 智能分配服务
 * 统一处理 AI 助手和收集箱的智能分配逻辑
 */
export class SmartScheduleService {
  /**
   * 查找时间轴中的所有空闲时间段
   * @param existingTasks 现有任务列表
   * @param startFrom 开始查找的时间点
   * @param endAt 结束查找的时间点（默认为当天23:59）
   * @returns 空闲时间段列表
   */
  static findFreeSlots(
    existingTasks: Task[],
    startFrom: Date = new Date(),
    endAt?: Date
  ): TimeSlot[] {
    const freeSlots: TimeSlot[] = [];
    
    // 默认结束时间为当天23:59
    if (!endAt) {
      endAt = new Date(startFrom);
      endAt.setHours(23, 59, 59, 999);
    }
    
    // 过滤出有效的任务（有开始时间的）
    const validTasks = existingTasks
      .filter(t => t.scheduledStart)
      .map(t => ({
        start: new Date(t.scheduledStart!),
        end: t.scheduledEnd 
          ? new Date(t.scheduledEnd) 
          : new Date(new Date(t.scheduledStart!).getTime() + (t.durationMinutes || 30) * 60000),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // 如果没有任务，整个时间段都是空闲的
    if (validTasks.length === 0) {
      freeSlots.push({
        start: new Date(startFrom),
        end: new Date(endAt),
        duration: Math.floor((endAt.getTime() - startFrom.getTime()) / 60000),
      });
      return freeSlots;
    }
    
    // 检查第一个任务之前是否有空闲时间
    if (validTasks[0].start.getTime() > startFrom.getTime()) {
      const duration = Math.floor((validTasks[0].start.getTime() - startFrom.getTime()) / 60000);
      if (duration >= 5) { // 至少5分钟的空闲时间才算
        freeSlots.push({
          start: new Date(startFrom),
          end: new Date(validTasks[0].start),
          duration,
        });
      }
    }
    
    // 检查任务之间的空闲时间
    for (let i = 0; i < validTasks.length - 1; i++) {
      const currentEnd = validTasks[i].end;
      const nextStart = validTasks[i + 1].start;
      
      const duration = Math.floor((nextStart.getTime() - currentEnd.getTime()) / 60000);
      if (duration >= 5) { // 至少5分钟的空闲时间才算
        freeSlots.push({
          start: new Date(currentEnd),
          end: new Date(nextStart),
          duration,
        });
      }
    }
    
    // 检查最后一个任务之后是否有空闲时间
    const lastTaskEnd = validTasks[validTasks.length - 1].end;
    if (lastTaskEnd.getTime() < endAt.getTime()) {
      const duration = Math.floor((endAt.getTime() - lastTaskEnd.getTime()) / 60000);
      if (duration >= 5) {
        freeSlots.push({
          start: new Date(lastTaskEnd),
          end: new Date(endAt),
          duration,
        });
      }
    }
    
    return freeSlots;
  }

  /**
   * 检测时间冲突
   * @param proposedStart 拟定的开始时间
   * @param proposedEnd 拟定的结束时间
   * @param existingTasks 现有任务列表
   * @returns 冲突的任务（如果有）
   */
  static detectConflict(
    proposedStart: Date,
    proposedEnd: Date,
    existingTasks: Task[]
  ): Task | null {
    return existingTasks.find(task => {
      if (!task.scheduledStart) return false;
      
      const taskStart = new Date(task.scheduledStart);
      const taskEnd = task.scheduledEnd 
        ? new Date(task.scheduledEnd)
        : new Date(taskStart.getTime() + (task.durationMinutes || 30) * 60000);
      
      // 检测时间重叠
      return (
        (proposedStart >= taskStart && proposedStart < taskEnd) ||
        (proposedEnd > taskStart && proposedEnd <= taskEnd) ||
        (proposedStart <= taskStart && proposedEnd >= taskEnd)
      );
    }) || null;
  }

  /**
   * 为单个任务找到最佳时间段
   * @param task 待安排的任务
   * @param existingTasks 现有任务列表
   * @param preferredStart 优先的开始时间（可选）
   * @returns 调度结果
   */
  static scheduleTask(
    task: ScheduleTask,
    existingTasks: Task[],
    preferredStart?: Date
  ): ScheduledResult {
    // 如果任务有明确的时间要求，优先使用
    if (task.hasExplicitTime && task.explicitTime) {
      const start = new Date(task.explicitTime);
      const end = new Date(start.getTime() + task.durationMinutes * 60000);
      const conflict = this.detectConflict(start, end, existingTasks);
      
      return {
        task,
        scheduledStart: start,
        scheduledEnd: end,
        isConflict: !!conflict,
        conflictWith: conflict || undefined,
      };
    }
    
    // 查找空闲时间段
    const startFrom = preferredStart || new Date(Date.now() + 5 * 60000); // 默认从5分钟后开始
    const freeSlots = this.findFreeSlots(existingTasks, startFrom);
    
    // 找到第一个足够长的空闲时间段
    const suitableSlot = freeSlots.find(slot => slot.duration >= task.durationMinutes);
    
    if (suitableSlot) {
      const start = new Date(suitableSlot.start);
      const end = new Date(start.getTime() + task.durationMinutes * 60000);
      
      return {
        task,
        scheduledStart: start,
        scheduledEnd: end,
        isConflict: false,
      };
    }
    
    // 如果没有找到合适的空闲时间段，安排到最后一个任务之后
    const lastTask = existingTasks
      .filter(t => t.scheduledStart)
      .sort((a, b) => {
        const aTime = new Date(a.scheduledStart!).getTime();
        const bTime = new Date(b.scheduledStart!).getTime();
        return bTime - aTime;
      })[0];
    
    let start: Date;
    if (lastTask && lastTask.scheduledStart) {
      const lastEnd = lastTask.scheduledEnd 
        ? new Date(lastTask.scheduledEnd)
        : new Date(new Date(lastTask.scheduledStart).getTime() + (lastTask.durationMinutes || 30) * 60000);
      start = new Date(lastEnd);
    } else {
      start = new Date(startFrom);
    }
    
    const end = new Date(start.getTime() + task.durationMinutes * 60000);
    
    return {
      task,
      scheduledStart: start,
      scheduledEnd: end,
      isConflict: false,
    };
  }

  /**
   * 批量智能分配任务
   * @param tasks 待安排的任务列表
   * @param existingTasks 现有任务列表
   * @param startFrom 开始时间（可选）
   * @returns 调度结果列表
   */
  static scheduleTasks(
    tasks: ScheduleTask[],
    existingTasks: Task[],
    startFrom?: Date
  ): ScheduledResult[] {
    const results: ScheduledResult[] = [];
    let currentTasks = [...existingTasks];
    
    // 按优先级排序（高优先级优先）
    const sortedTasks = [...tasks].sort((a, b) => {
      // 有明确时间的任务优先
      if (a.hasExplicitTime && !b.hasExplicitTime) return -1;
      if (!a.hasExplicitTime && b.hasExplicitTime) return 1;
      
      // 按优先级排序
      const aPriority = a.priority || 2;
      const bPriority = b.priority || 2;
      return bPriority - aPriority;
    });
    
    for (const task of sortedTasks) {
      const result = this.scheduleTask(task, currentTasks, startFrom);
      results.push(result);
      
      // 如果没有冲突，将这个任务添加到现有任务列表中，供后续任务参考
      if (!result.isConflict) {
        currentTasks.push({
          id: task.id || `temp-${Date.now()}-${Math.random()}`,
          title: task.title,
          durationMinutes: task.durationMinutes,
          scheduledStart: result.scheduledStart,
          scheduledEnd: result.scheduledEnd,
          status: 'pending',
          priority: task.priority || 2,
          tags: task.tags || [],
          goldReward: task.goldReward || 0,
          taskType: task.taskType || 'life',
          userId: 'local-user',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Task);
      }
    }
    
    return results;
  }

  /**
   * 解析自然语言中的时间表达
   * @param text 文本内容
   * @returns 解析出的时间（如果有）
   */
  static parseTimeFromText(text: string): Date | null {
    const now = new Date();
    
    // 匹配 "今天下午7:30"、"明天上午9点"、"6号下午" 等
    
    // 1. 匹配具体时间（如 "7:30"、"19:30"）
    const timeMatch = text.match(/(\d{1,2})[：:点](\d{0,2})/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      
      // 智能判断上午/下午
      if (text.includes('下午') || text.includes('晚上')) {
        if (hours < 12) hours += 12;
      } else if (text.includes('上午') || text.includes('早上')) {
        // 保持原样
      } else {
        // 没有明确指定，根据小时数判断
        if (hours >= 1 && hours <= 6) {
          hours += 12; // 1-6点默认为下午
        }
      }
      
      const targetDate = new Date(now);
      
      // 判断日期
      if (text.includes('明天')) {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (text.includes('后天')) {
        targetDate.setDate(targetDate.getDate() + 2);
      }
      // 匹配 "X号"
      else {
        const dayMatch = text.match(/(\d{1,2})号/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          targetDate.setDate(day);
          // 如果日期已过，设置为下个月
          if (targetDate < now) {
            targetDate.setMonth(targetDate.getMonth() + 1);
          }
        }
      }
      
      targetDate.setHours(hours, minutes, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetDate < now && !text.includes('明天') && !text.includes('后天') && !text.match(/(\d{1,2})号/)) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      return targetDate;
    }
    
    // 2. 匹配相对时间（如 "5分钟后"）
    const relativeMatch = text.match(/(\d+)分钟[后之]后?/);
    if (relativeMatch) {
      const minutes = parseInt(relativeMatch[1]);
      return new Date(now.getTime() + minutes * 60000);
    }
    
    return null;
  }

  /**
   * 从任务标题中提取明确的时间信息
   * @param task 任务对象
   * @returns 更新后的任务对象（包含时间信息）
   */
  static extractTimeFromTask(task: ScheduleTask): ScheduleTask {
    const explicitTime = this.parseTimeFromText(task.title);
    
    if (explicitTime) {
      return {
        ...task,
        hasExplicitTime: true,
        explicitTime,
      };
    }
    
    return task;
  }

  /**
   * 批量提取任务的时间信息
   * @param tasks 任务列表
   * @returns 更新后的任务列表
   */
  static extractTimesFromTasks(tasks: ScheduleTask[]): ScheduleTask[] {
    return tasks.map(task => this.extractTimeFromTask(task));
  }
}






