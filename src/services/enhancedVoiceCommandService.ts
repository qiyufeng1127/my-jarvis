/**
 * 增强版语音指令服务
 * 支持模糊匹配和任务控制的所有场景
 */

import type { Task } from '@/types';

export interface VoiceCommandResult {
  type: 'query' | 'action' | 'navigation' | 'unknown';
  action?: string;
  message: string;
  data?: any;
}

export class EnhancedVoiceCommandService {
  /**
   * 处理语音指令 - 支持模糊匹配
   */
  static async processCommand(
    command: string,
    tasks: Task[],
    currentTask?: Task | null
  ): Promise<VoiceCommandResult> {
    const normalized = command.toLowerCase().trim();
    console.log('🎤 处理语音指令:', normalized);

    // 1. 查询下一个任务
    if (this.matchPattern(normalized, ['下个任务', '下一个任务', '接下来', '下面'])) {
      return this.getNextTask(tasks, currentTask);
    }

    // 2. 查询当前任务剩余时间
    if (this.matchPattern(normalized, ['还有多长时间', '还剩多久', '剩余时间', '还要多久'])) {
      return this.getRemainingTime(currentTask);
    }

    // 3. 查询下个任务开始时间
    if (this.matchPattern(normalized, ['下个任务几点', '下一个任务什么时候', '接下来几点'])) {
      return this.getNextTaskTime(tasks, currentTask);
    }

    // 4. 查询明天任务数量
    if (this.matchPattern(normalized, ['明天有多少', '明天几个任务', '明天的任务'])) {
      return this.getTomorrowTaskCount(tasks);
    }

    // 5. 删除今天的任务
    if (this.matchPattern(normalized, ['删除今天', '清空今天', '删掉今天'])) {
      return this.deleteTodayTasks(tasks);
    }

    // 6. 移动昨天的任务到今天
    if (this.matchPattern(normalized, ['昨天的任务移到今天', '昨天移到今天', '把昨天挪到今天'])) {
      return this.moveYesterdayToToday(tasks);
    }

    // 7. 移动今天的任务到明天
    if (this.matchPattern(normalized, ['今天的任务移到明天', '今天移到明天', '把今天挪到明天'])) {
      return this.moveTodayToTomorrow(tasks);
    }

    // 8. 移动特定日期的任务
    const dateMove = this.matchDateMove(normalized);
    if (dateMove) {
      return this.moveTasksByDate(tasks, dateMove.from, dateMove.to);
    }

    // 9. 当前任务已完成 - 跳转到完成验证
    if (this.matchPattern(normalized, ['当前任务完成', '任务完成', '完成了', '做完了', '结束了'])) {
      return {
        type: 'navigation',
        action: 'complete_verification',
        message: '好的，开始完成验证',
        data: { taskId: currentTask?.id }
      };
    }

    // 10. 启动当前任务 / 开始验证
    if (this.matchPattern(normalized, ['启动', '开始', '开始验证', '启动验证'])) {
      return {
        type: 'navigation',
        action: 'start_verification',
        message: '好的，开始启动验证',
        data: { taskId: currentTask?.id }
      };
    }

    // 11. 下个任务可以开始了 - 启动下一个任务
    if (this.matchPattern(normalized, ['下个任务开始', '下一个任务开始', '开始下一个', '下个可以开始'])) {
      return this.startNextTask(tasks, currentTask);
    }

    // 12. 查询当前任务
    if (this.matchPattern(normalized, ['当前任务', '现在做什么', '正在做什么', '当前是什么'])) {
      return this.getCurrentTask(currentTask);
    }

    // 未识别的指令
    return {
      type: 'unknown',
      message: '抱歉，我没有理解您的指令，请再说一遍'
    };
  }

  /**
   * 模糊匹配 - 只要包含任一关键词即可
   */
  private static matchPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * 匹配日期移动指令 (如：把16号的任务移到15号)
   */
  private static matchDateMove(text: string): { from: number; to: number } | null {
    const match = text.match(/(\d+)号.*?移.*?(\d+)号|(\d+)号.*?挪.*?(\d+)号/);
    if (match) {
      const from = parseInt(match[1] || match[3]);
      const to = parseInt(match[2] || match[4]);
      return { from, to };
    }
    return null;
  }

  /**
   * 获取下一个任务
   */
  private static getNextTask(tasks: Task[], currentTask?: Task | null): VoiceCommandResult {
    const now = new Date();
    const futureTasks = tasks
      .filter(t => t.scheduledStart && new Date(t.scheduledStart) > now)
      .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime());

    if (futureTasks.length === 0) {
      return {
        type: 'query',
        message: '后面没有安排任务了',
        data: null
      };
    }

    const nextTask = futureTasks[0];
    const startTime = new Date(nextTask.scheduledStart!);
    const timeStr = `${startTime.getHours()}点${startTime.getMinutes() > 0 ? startTime.getMinutes() + '分' : ''}`;

    return {
      type: 'query',
      message: `下一个任务是${nextTask.title}，${timeStr}开始`,
      data: nextTask
    };
  }

  /**
   * 获取当前任务剩余时间
   */
  private static getRemainingTime(currentTask?: Task | null): VoiceCommandResult {
    if (!currentTask || !currentTask.scheduledEnd) {
      return {
        type: 'query',
        message: '当前没有正在进行的任务'
      };
    }

    const now = new Date();
    const end = new Date(currentTask.scheduledEnd);
    const remainingMs = end.getTime() - now.getTime();

    if (remainingMs <= 0) {
      return {
        type: 'query',
        message: '当前任务已经超时了'
      };
    }

    const minutes = Math.floor(remainingMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
    } else {
      timeStr = `${mins}分钟`;
    }

    return {
      type: 'query',
      message: `当前任务还剩${timeStr}`,
      data: { remainingMs, minutes }
    };
  }

  /**
   * 获取下个任务开始时间
   */
  private static getNextTaskTime(tasks: Task[], currentTask?: Task | null): VoiceCommandResult {
    const now = new Date();
    const futureTasks = tasks
      .filter(t => t.scheduledStart && new Date(t.scheduledStart) > now)
      .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime());

    if (futureTasks.length === 0) {
      return {
        type: 'query',
        message: '后面没有安排任务了'
      };
    }

    const nextTask = futureTasks[0];
    const startTime = new Date(nextTask.scheduledStart!);
    const timeStr = `${startTime.getHours()}点${startTime.getMinutes() > 0 ? startTime.getMinutes() + '分' : ''}`;

    return {
      type: 'query',
      message: `下个任务${nextTask.title}，${timeStr}开始`,
      data: { task: nextTask, startTime }
    };
  }

  /**
   * 获取明天任务数量
   */
  private static getTomorrowTaskCount(tasks: Task[]): VoiceCommandResult {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const tomorrowTasks = tasks.filter(t => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return taskDate >= tomorrow && taskDate < dayAfter;
    });

    return {
      type: 'query',
      message: `明天有${tomorrowTasks.length}个任务`,
      data: { count: tomorrowTasks.length, tasks: tomorrowTasks }
    };
  }

  /**
   * 删除今天的所有任务
   */
  private static deleteTodayTasks(tasks: Task[]): VoiceCommandResult {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(t => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return taskDate >= today && taskDate < tomorrow;
    });

    return {
      type: 'action',
      action: 'delete_tasks',
      message: `确定要删除今天的${todayTasks.length}个任务吗？`,
      data: { taskIds: todayTasks.map(t => t.id) }
    };
  }

  /**
   * 移动昨天的任务到今天
   */
  private static moveYesterdayToToday(tasks: Task[]): VoiceCommandResult {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayTasks = tasks.filter(t => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return taskDate >= yesterday && taskDate < today;
    });

    return {
      type: 'action',
      action: 'move_tasks',
      message: `好的，将昨天的${yesterdayTasks.length}个任务移到今天`,
      data: {
        taskIds: yesterdayTasks.map(t => t.id),
        offset: 1 // 向后移动1天
      }
    };
  }

  /**
   * 移动今天的任务到明天
   */
  private static moveTodayToTomorrow(tasks: Task[]): VoiceCommandResult {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(t => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return taskDate >= today && taskDate < tomorrow;
    });

    return {
      type: 'action',
      action: 'move_tasks',
      message: `好的，将今天的${todayTasks.length}个任务移到明天`,
      data: {
        taskIds: todayTasks.map(t => t.id),
        offset: 1 // 向后移动1天
      }
    };
  }

  /**
   * 移动特定日期的任务
   */
  private static moveTasksByDate(tasks: Task[], fromDay: number, toDay: number): VoiceCommandResult {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const fromDate = new Date(currentYear, currentMonth, fromDay, 0, 0, 0, 0);
    const fromDateEnd = new Date(currentYear, currentMonth, fromDay, 23, 59, 59, 999);

    const targetTasks = tasks.filter(t => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return taskDate >= fromDate && taskDate <= fromDateEnd;
    });

    const offset = toDay - fromDay;

    return {
      type: 'action',
      action: 'move_tasks',
      message: `好的，将${fromDay}号的${targetTasks.length}个任务移到${toDay}号`,
      data: {
        taskIds: targetTasks.map(t => t.id),
        offset: offset
      }
    };
  }

  /**
   * 启动下一个任务
   */
  private static startNextTask(tasks: Task[], currentTask?: Task | null): VoiceCommandResult {
    const now = new Date();
    const futureTasks = tasks
      .filter(t => t.scheduledStart && new Date(t.scheduledStart) > now)
      .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime());

    if (futureTasks.length === 0) {
      return {
        type: 'query',
        message: '后面没有任务了'
      };
    }

    const nextTask = futureTasks[0];

    return {
      type: 'navigation',
      action: 'start_verification',
      message: `好的，开始${nextTask.title}的启动验证`,
      data: { taskId: nextTask.id, task: nextTask }
    };
  }

  /**
   * 获取当前任务
   */
  private static getCurrentTask(currentTask?: Task | null): VoiceCommandResult {
    if (!currentTask) {
      return {
        type: 'query',
        message: '当前没有正在进行的任务'
      };
    }

    return {
      type: 'query',
      message: `当前任务是${currentTask.title}`,
      data: currentTask
    };
  }
}

