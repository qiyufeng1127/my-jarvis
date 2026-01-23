// ============================================
// 通知服务
// ============================================

import { Task } from '@/types';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  data?: any;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private notificationQueue: NotificationOptions[] = [];
  private isProcessing = false;

  constructor() {
    this.checkPermission();
  }

  // 检查通知权限
  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知');
      return 'denied';
    }

    this.permission = Notification.permission;
    return this.permission;
  }

  // 请求通知权限
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission;
  }

  // 发送通知
  async sendNotification(options: NotificationOptions): Promise<void> {
    // 检查权限
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('用户拒绝了通知权限');
        return;
      }
    }

    // 创建通知
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      data: options.data,
    });

    // 点击通知时的处理
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // 执行自定义操作
      if (options.data?.onClick) {
        options.data.onClick();
      }
    };

    // 自动关闭（5秒后）
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // 任务提醒通知
  async notifyTaskReminder(task: Task, minutesBefore: number = 5): Promise<void> {
    await this.sendNotification({
      title: `📅 任务提醒`,
      body: `"${task.title}" 将在 ${minutesBefore} 分钟后开始`,
      tag: `task-reminder-${task.id}`,
      requireInteraction: false,
      data: {
        taskId: task.id,
        onClick: () => {
          // 跳转到任务详情
          window.location.hash = `#/task/${task.id}`;
        },
      },
    });
  }

  // 任务开始通知
  async notifyTaskStart(task: Task): Promise<void> {
    await this.sendNotification({
      title: `🚀 任务开始`,
      body: `"${task.title}" 现在开始！`,
      tag: `task-start-${task.id}`,
      requireInteraction: true,
      data: {
        taskId: task.id,
      },
    });

    // 播放语音提醒
    this.speakNotification(`任务"${task.title}"现在开始`);
  }

  // 任务完成通知
  async notifyTaskComplete(task: Task, goldEarned: number): Promise<void> {
    await this.sendNotification({
      title: `✅ 任务完成`,
      body: `恭喜完成"${task.title}"！获得 ${goldEarned} 金币`,
      tag: `task-complete-${task.id}`,
      requireInteraction: false,
      data: {
        taskId: task.id,
      },
    });

    // 播放语音提醒
    this.speakNotification(`恭喜完成任务，获得${goldEarned}金币`);
  }

  // 任务逾期通知
  async notifyTaskOverdue(task: Task): Promise<void> {
    await this.sendNotification({
      title: `⚠️ 任务逾期`,
      body: `"${task.title}" 已逾期，请尽快完成`,
      tag: `task-overdue-${task.id}`,
      requireInteraction: true,
      data: {
        taskId: task.id,
      },
    });
  }

  // 成长提醒通知
  async notifyGrowthMilestone(dimensionName: string, value: number): Promise<void> {
    await this.sendNotification({
      title: `🎉 成长里程碑`,
      body: `${dimensionName} 达到 ${value} 点！`,
      tag: `growth-milestone`,
      requireInteraction: false,
    });

    // 播放语音提醒
    this.speakNotification(`恭喜，${dimensionName}达到${value}点`);
  }

  // 升级通知
  async notifyLevelUp(levelName: string): Promise<void> {
    await this.sendNotification({
      title: `👑 身份升级`,
      body: `恭喜升级到 ${levelName}！`,
      tag: `level-up`,
      requireInteraction: true,
    });

    // 播放语音提醒
    this.speakNotification(`恭喜升级到${levelName}`);
  }

  // 坏习惯警告
  async notifyBadHabit(habitName: string): Promise<void> {
    await this.sendNotification({
      title: `⚠️ 坏习惯警告`,
      body: `检测到 ${habitName}，请注意调整`,
      tag: `bad-habit-warning`,
      requireInteraction: true,
    });
  }

  // 每日报告通知
  async notifyDailyReport(completedTasks: number, totalTasks: number, goldEarned: number): Promise<void> {
    await this.sendNotification({
      title: `📊 今日报告`,
      body: `完成 ${completedTasks}/${totalTasks} 个任务，获得 ${goldEarned} 金币`,
      tag: `daily-report`,
      requireInteraction: false,
      data: {
        onClick: () => {
          window.location.hash = '#/reports';
        },
      },
    });
  }

  // 语音播报
  private speakNotification(text: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    // 检查是否启用语音
    const voiceEnabled = localStorage.getItem('voice_notifications_enabled') === 'true';
    if (!voiceEnabled) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
  }

  // 取消所有通知
  clearAllNotifications(): void {
    // 浏览器通知无法批量清除，只能通过 tag 清除
    console.log('清除所有通知');
  }

  // 检查是否在免打扰时段
  isQuietHours(): boolean {
    const quietHoursStr = localStorage.getItem('quiet_hours');
    if (!quietHoursStr) return false;

    try {
      const quietHours = JSON.parse(quietHoursStr);
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startHour, startMin] = quietHours.start.split(':').map(Number);
      const [endHour, endMin] = quietHours.end.split(':').map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (startTime < endTime) {
        return currentTime >= startTime && currentTime < endTime;
      } else {
        // 跨天的情况
        return currentTime >= startTime || currentTime < endTime;
      }
    } catch {
      return false;
    }
  }

  // 调度任务提醒
  scheduleTaskReminders(tasks: Task[]): void {
    const now = new Date();

    tasks.forEach((task) => {
      if (!task.scheduledStart || task.status !== 'scheduled') return;

      const startTime = new Date(task.scheduledStart);
      const timeDiff = startTime.getTime() - now.getTime();

      // 提前5分钟提醒
      const reminderTime = timeDiff - 5 * 60 * 1000;
      if (reminderTime > 0 && reminderTime < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          if (!this.isQuietHours()) {
            this.notifyTaskReminder(task, 5);
          }
        }, reminderTime);
      }

      // 任务开始时提醒
      if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          if (!this.isQuietHours()) {
            this.notifyTaskStart(task);
          }
        }, timeDiff);
      }
    });
  }
}

export const notificationService = new NotificationService();

