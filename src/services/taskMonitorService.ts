/**
 * 任务监控服务
 * 监控任务状态变化，发送通知和语音提醒
 */

import { notificationService } from './notificationService';
import type { Task } from '@/types';

interface NotificationSettings {
  taskStartBeforeReminder: boolean;
  taskStartBeforeMinutes: number;
  taskEndBeforeReminder: boolean;
  taskEndBeforeMinutes: number;
}

class TaskMonitorService {
  private monitoredTasks: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private notifiedTasks: Set<string> = new Set();

  private getNotificationSettings(): NotificationSettings {
    const defaults: NotificationSettings = {
      taskStartBeforeReminder: true,
      taskStartBeforeMinutes: 2,
      taskEndBeforeReminder: true,
      taskEndBeforeMinutes: 0,
    };

    try {
      const saved = localStorage.getItem('notification_settings');
      if (!saved) return defaults;

      return {
        ...defaults,
        ...JSON.parse(saved),
      };
    } catch (error) {
      console.warn('⚠️ [任务监控] 读取通知设置失败，使用默认配置:', error);
      return defaults;
    }
  }

  private scheduleReminder(key: string, delay: number, callback: () => void) {
    if (delay <= 0) return;

    const timer = setTimeout(() => {
      if (this.notifiedTasks.has(key)) {
        this.monitoredTasks.delete(key);
        return;
      }

      callback();
      this.notifiedTasks.add(key);
      this.monitoredTasks.delete(key);
    }, delay);

    this.monitoredTasks.set(key, timer);
  }

  /**
   * 开始监控任务
   */
  startMonitoring(task: Task) {
    this.stopMonitoring(task.id);

    if (!task.scheduledStart || !task.scheduledEnd) {
      return;
    }

    const now = new Date();
    const startTime = new Date(task.scheduledStart);
    const endTime = new Date(task.scheduledEnd);
    const settings = this.getNotificationSettings();
    const hasVerification = Boolean(
      task.verificationEnabled || task.verificationStart || task.verificationComplete
    );

    if (settings.taskStartBeforeReminder) {
      const beforeStartTime = new Date(
        startTime.getTime() - settings.taskStartBeforeMinutes * 60 * 1000
      );
      this.scheduleReminder(
        `${task.id}-start-before`,
        beforeStartTime.getTime() - now.getTime(),
        () => {
          notificationService.notifyTaskStartBefore(
            task.title,
            settings.taskStartBeforeMinutes,
            hasVerification
          );
        }
      );
    }

    if (settings.taskEndBeforeReminder) {
      const beforeEndTime = new Date(
        endTime.getTime() - settings.taskEndBeforeMinutes * 60 * 1000
      );
      this.scheduleReminder(
        `${task.id}-warning`,
        beforeEndTime.getTime() - now.getTime(),
        () => {
          notificationService.notifyTaskEnding(
            task.title,
            settings.taskEndBeforeMinutes,
            hasVerification
          );
        }
      );
    }

    console.log(`✅ [任务监控] 开始监控任务: ${task.title}`);
  }

  /**
   * 停止监控任务
   */
  stopMonitoring(taskId: string) {
    const timers = [
      `${taskId}-start-before`,
      `${taskId}-warning`,
    ];

    timers.forEach((key) => {
      const timer = this.monitoredTasks.get(key);
      if (timer) {
        clearTimeout(timer);
        this.monitoredTasks.delete(key);
      }
    });

    timers.forEach((key) => {
      this.notifiedTasks.delete(key);
    });

    console.log(`🛑 [任务监控] 停止监控任务: ${taskId}`);
  }

  /**
   * 批量监控任务
   */
  monitorTasks(tasks: Task[]) {
    tasks.forEach((task) => {
      if (task.scheduledStart && task.scheduledEnd) {
        this.startMonitoring(task);
      }
    });
  }

  /**
   * 清除所有监控
   */
  clearAll() {
    this.monitoredTasks.forEach((timer) => clearTimeout(timer));
    this.monitoredTasks.clear();
    this.notifiedTasks.clear();
    console.log('🧹 [任务监控] 清除所有监控');
  }

}

export const taskMonitorService = new TaskMonitorService();
