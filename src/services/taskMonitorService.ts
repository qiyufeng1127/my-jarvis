/**
 * 任务监控服务
 * 监控任务状态变化，发送通知和语音提醒
 */

import { notificationService } from './notificationService';
import type { Task } from '@/types';

class TaskMonitorService {
  private monitoredTasks: Map<string, NodeJS.Timeout> = new Map();
  private notifiedTasks: Set<string> = new Set(); // 记录已通知的任务

  /**
   * 开始监控任务
   */
  startMonitoring(task: Task) {
    // 如果已经在监控，先停止
    this.stopMonitoring(task.id);

    if (!task.scheduledStart || !task.scheduledEnd) {
      return;
    }

    const now = new Date();
    const startTime = new Date(task.scheduledStart);
    const endTime = new Date(task.scheduledEnd);

    // 检查任务是否需要验证
    const hasVerification = task.verification?.enabled || false;

    // 1. 任务开始通知
    if (startTime > now) {
      const timeUntilStart = startTime.getTime() - now.getTime();
      const startTimer = setTimeout(() => {
        if (!this.notifiedTasks.has(`${task.id}-start`)) {
          notificationService.notifyTaskStart(task.title, hasVerification);
          this.notifiedTasks.add(`${task.id}-start`);
        }
      }, timeUntilStart);

      this.monitoredTasks.set(`${task.id}-start`, startTimer);
    }

    // 2. 任务即将结束通知（提前2分钟）
    const warningTime = new Date(endTime.getTime() - 2 * 60 * 1000);
    if (warningTime > now) {
      const timeUntilWarning = warningTime.getTime() - now.getTime();
      const warningTimer = setTimeout(() => {
        if (!this.notifiedTasks.has(`${task.id}-warning`)) {
          notificationService.notifyTaskEnding(task.title, 2, hasVerification);
          this.notifiedTasks.add(`${task.id}-warning`);
        }
      }, timeUntilWarning);

      this.monitoredTasks.set(`${task.id}-warning`, warningTimer);
    }

    // 3. 任务结束通知
    if (endTime > now) {
      const timeUntilEnd = endTime.getTime() - now.getTime();
      const endTimer = setTimeout(() => {
        if (!this.notifiedTasks.has(`${task.id}-end`)) {
          notificationService.notifyTaskEnd(task.title, hasVerification);
          this.notifiedTasks.add(`${task.id}-end`);
        }
      }, timeUntilEnd);

      this.monitoredTasks.set(`${task.id}-end`, endTimer);
    }

    console.log(`✅ [任务监控] 开始监控任务: ${task.title}`);
  }

  /**
   * 停止监控任务
   */
  stopMonitoring(taskId: string) {
    // 清除所有相关的定时器
    const timers = [
      `${taskId}-start`,
      `${taskId}-warning`,
      `${taskId}-end`,
    ];

    timers.forEach(key => {
      const timer = this.monitoredTasks.get(key);
      if (timer) {
        clearTimeout(timer);
        this.monitoredTasks.delete(key);
      }
    });

    // 清除通知记录
    timers.forEach(key => {
      this.notifiedTasks.delete(key);
    });

    console.log(`🛑 [任务监控] 停止监控任务: ${taskId}`);
  }

  /**
   * 批量监控任务
   */
  monitorTasks(tasks: Task[]) {
    tasks.forEach(task => {
      if (task.scheduledStart && task.scheduledEnd) {
        this.startMonitoring(task);
      }
    });
  }

  /**
   * 清除所有监控
   */
  clearAll() {
    this.monitoredTasks.forEach(timer => clearTimeout(timer));
    this.monitoredTasks.clear();
    this.notifiedTasks.clear();
    console.log('🧹 [任务监控] 清除所有监控');
  }

  /**
   * 请求通知权限
   */
  async requestNotificationPermission() {
    return await notificationService.requestPermission();
  }
}

export const taskMonitorService = new TaskMonitorService();





