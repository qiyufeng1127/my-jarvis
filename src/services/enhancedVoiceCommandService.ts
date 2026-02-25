/**
 * 增强版语音指令服务
 * 支持口语化/模糊化指令识别
 */

import type { Task } from '@/types';

interface CommandResult {
  type: 'navigation' | 'action' | 'query' | 'unknown';
  action?: string;
  message: string;
  data?: any;
}

export class EnhancedVoiceCommandService {
  /**
   * 处理语音指令
   */
  static async processCommand(
    command: string,
    tasks: Task[],
    currentTask?: Task | null
  ): Promise<CommandResult> {
    const cmd = command.toLowerCase().trim();
    console.log('🎤 [增强版指令处理]:', cmd);

    // 1. 查询类指令
    if (this.isQueryCommand(cmd)) {
      return this.handleQueryCommand(cmd, tasks, currentTask);
    }

    // 2. 删除类指令
    if (this.isDeleteCommand(cmd)) {
      return this.handleDeleteCommand(cmd, tasks);
    }

    // 3. 移动类指令
    if (this.isMoveCommand(cmd)) {
      return this.handleMoveCommand(cmd, tasks);
    }

    // 4. 任务控制指令
    if (this.isTaskControlCommand(cmd)) {
      return this.handleTaskControlCommand(cmd, tasks, currentTask);
    }

    // 5. 未识别的指令
    return {
      type: 'unknown',
      message: '不好意思，未识别到有效指令。\n\n您可以尝试说：\n• 下一个任务是什么\n• 删除今天的任务\n• 把昨天的任务移到今天\n• 当前任务已完成',
    };
  }

  /**
   * 判断是否为查询指令
   */
  private static isQueryCommand(cmd: string): boolean {
    const queryPatterns = [
      /下(一个|个|1个)任务/,
      /下(一步|1步)/,
      /接下来/,
      /还有多(长|久)/,
      /剩余时间/,
      /几点开始/,
      /什么时候开始/,
      /今天.*任务/,
      /明天.*任务/,
      /有多少.*任务/,
      /任务.*进度/,
      /当前任务/,
    ];

    return queryPatterns.some(pattern => pattern.test(cmd));
  }

  /**
   * 判断是否为删除指令
   */
  private static isDeleteCommand(cmd: string): boolean {
    const deletePatterns = [
      /删除.*任务/,
      /清空.*任务/,
      /删掉.*任务/,
    ];

    return deletePatterns.some(pattern => pattern.test(cmd));
  }

  /**
   * 判断是否为移动指令
   */
  private static isMoveCommand(cmd: string): boolean {
    const movePatterns = [
      /移到/,
      /挪到/,
      /改到/,
      /调到/,
      /迁移/,
    ];

    return movePatterns.some(pattern => pattern.test(cmd));
  }

  /**
   * 判断是否为任务控制指令
   */
  private static isTaskControlCommand(cmd: string): boolean {
    const controlPatterns = [
      /启动/,
      /开始/,
      /完成/,
      /结束/,
      /标记.*完成/,
    ];

    return controlPatterns.some(pattern => pattern.test(cmd));
  }

  /**
   * 处理查询指令
   */
  private static handleQueryCommand(
    cmd: string,
    tasks: Task[],
    currentTask?: Task | null
  ): CommandResult {
    const now = new Date();

    // 查询下一个任务
    if (/下(一个|个|1个)任务|下(一步|1步)|接下来/.test(cmd)) {
      const nextTask = this.getNextTask(tasks, now);
      
      if (!nextTask) {
        return {
          type: 'query',
          message: '没有找到下一个任务',
        };
      }

      const startTime = nextTask.scheduledStart 
        ? new Date(nextTask.scheduledStart).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        : '未设置';

      return {
        type: 'query',
        message: `下一个任务是：${nextTask.title}\n开始时间：${startTime}\n时长：${nextTask.durationMinutes}分钟`,
        data: { task: nextTask },
      };
    }

    // 查询剩余时间
    if (/还有多(长|久)|剩余时间/.test(cmd)) {
      if (!currentTask || !currentTask.scheduledEnd) {
        return {
          type: 'query',
          message: '当前没有正在进行的任务',
        };
      }

      const endTime = new Date(currentTask.scheduledEnd);
      const remainingMs = endTime.getTime() - now.getTime();
      const remainingMinutes = Math.floor(remainingMs / 60000);

      if (remainingMinutes <= 0) {
        return {
          type: 'query',
          message: '当前任务已超时',
        };
      }

      return {
        type: 'query',
        message: `当前任务还剩 ${remainingMinutes} 分钟`,
      };
    }

    // 查询下个任务几点开始
    if (/几点开始|什么时候开始/.test(cmd)) {
      const nextTask = this.getNextTask(tasks, now);
      
      if (!nextTask || !nextTask.scheduledStart) {
        return {
          type: 'query',
          message: '没有找到下一个任务',
        };
      }

      const startTime = new Date(nextTask.scheduledStart).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      return {
        type: 'query',
        message: `下一个任务"${nextTask.title}"将在 ${startTime} 开始`,
        data: { task: nextTask },
      };
    }

    // 查询今天/明天的任务数量
    if (/今天.*任务|明天.*任务|有多少.*任务/.test(cmd)) {
      const isToday = /今天/.test(cmd);
      const targetDate = new Date();
      if (!isToday) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      const targetTasks = this.getTasksByDate(tasks, targetDate);
      const completed = targetTasks.filter(t => t.status === 'completed').length;

      return {
        type: 'query',
        message: `${isToday ? '今天' : '明天'}共有 ${targetTasks.length} 个任务\n已完成：${completed} 个\n未完成：${targetTasks.length - completed} 个`,
      };
    }

    return {
      type: 'unknown',
      message: '未能理解您的查询',
    };
  }

  /**
   * 处理删除指令
   */
  private static handleDeleteCommand(cmd: string, tasks: Task[]): CommandResult {
    let targetTasks: Task[] = [];
    let description = '';

    // 删除今天的任务
    if (/今天|今日/.test(cmd)) {
      targetTasks = this.getTasksByDate(tasks, new Date());
      description = '今天';
    }
    // 删除昨天的任务
    else if (/昨天|昨日/.test(cmd)) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetTasks = this.getTasksByDate(tasks, yesterday);
      description = '昨天';
    }
    // 删除明天的任务
    else if (/明天|明日/.test(cmd)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetTasks = this.getTasksByDate(tasks, tomorrow);
      description = '明天';
    }

    if (targetTasks.length === 0) {
      return {
        type: 'action',
        action: 'delete_tasks',
        message: `${description}没有找到任何任务`,
        data: { taskIds: [] },
      };
    }

    return {
      type: 'action',
      action: 'delete_tasks',
      message: `准备删除${description}的 ${targetTasks.length} 个任务`,
      data: { taskIds: targetTasks.map(t => t.id) },
    };
  }

  /**
   * 处理移动指令
   */
  private static handleMoveCommand(cmd: string, tasks: Task[]): CommandResult {
    // 把昨天的任务移到今天
    if (/昨天.*今天/.test(cmd)) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const targetTasks = this.getTasksByDate(tasks, yesterday);

      return {
        type: 'action',
        action: 'move_tasks',
        message: `准备把昨天的 ${targetTasks.length} 个任务移到今天`,
        data: { taskIds: targetTasks.map(t => t.id), offset: 1 },
      };
    }

    // 把今天的任务移到明天
    if (/今天.*明天/.test(cmd)) {
      const targetTasks = this.getTasksByDate(tasks, new Date());

      return {
        type: 'action',
        action: 'move_tasks',
        message: `准备把今天的 ${targetTasks.length} 个任务移到明天`,
        data: { taskIds: targetTasks.map(t => t.id), offset: 1 },
      };
    }

    // 把X号的任务移到Y号
    const dateMatch = cmd.match(/(\d+)号.*?(\d+)号/);
    if (dateMatch) {
      const fromDay = parseInt(dateMatch[1]);
      const toDay = parseInt(dateMatch[2]);
      const offset = toDay - fromDay;

      const fromDate = new Date();
      fromDate.setDate(fromDay);
      const targetTasks = this.getTasksByDate(tasks, fromDate);

      return {
        type: 'action',
        action: 'move_tasks',
        message: `准备把${fromDay}号的 ${targetTasks.length} 个任务移到${toDay}号`,
        data: { taskIds: targetTasks.map(t => t.id), offset },
      };
    }

    return {
      type: 'unknown',
      message: '未能理解移动指令',
    };
  }

  /**
   * 处理任务控制指令
   */
  private static handleTaskControlCommand(
    cmd: string,
    tasks: Task[],
    currentTask?: Task | null
  ): CommandResult {
    // 启动验证
    if (/启动|开始/.test(cmd) && !/完成/.test(cmd)) {
      const nextTask = this.getNextTask(tasks, new Date());
      
      if (!nextTask) {
        return {
          type: 'query',
          message: '没有找到要启动的任务',
        };
      }

      return {
        type: 'navigation',
        action: 'start_verification',
        message: `正在启动任务：${nextTask.title}`,
        data: { taskId: nextTask.id, task: nextTask },
      };
    }

    // 完成验证
    if (/完成|结束|标记.*完成/.test(cmd)) {
      if (!currentTask) {
        return {
          type: 'query',
          message: '当前没有正在进行的任务',
        };
      }

      return {
        type: 'navigation',
        action: 'complete_verification',
        message: `正在完成任务：${currentTask.title}`,
        data: { taskId: currentTask.id, task: currentTask },
      };
    }

    return {
      type: 'unknown',
      message: '未能理解任务控制指令',
    };
  }

  /**
   * 获取下一个任务
   */
  private static getNextTask(tasks: Task[], now: Date): Task | null {
    const upcomingTasks = tasks
      .filter(t => {
        if (!t.scheduledStart) return false;
        const start = new Date(t.scheduledStart);
        return start > now && t.status !== 'completed';
      })
      .sort((a, b) => {
        const aStart = new Date(a.scheduledStart!).getTime();
        const bStart = new Date(b.scheduledStart!).getTime();
        return aStart - bStart;
      });

    return upcomingTasks[0] || null;
  }

  /**
   * 根据日期获取任务
   */
  private static getTasksByDate(tasks: Task[], date: Date): Task[] {
    return tasks.filter(t => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  }
}
