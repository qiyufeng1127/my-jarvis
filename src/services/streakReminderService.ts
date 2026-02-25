/**
 * 连胜中断提醒服务
 * 在连胜即将中断时提醒用户
 */

import { useDriveStore } from '@/stores/driveStore';
import { notificationService } from './notificationService';

class StreakReminderService {
  private reminderTimer: NodeJS.Timeout | null = null;
  private hasRemindedToday = false;

  /**
   * 启动提醒服务
   */
  start() {
    // 每小时检查一次
    this.reminderTimer = setInterval(() => {
      this.checkAndRemind();
    }, 60 * 60 * 1000); // 1小时

    // 立即检查一次
    this.checkAndRemind();

    console.log('🔔 连胜提醒服务已启动');
  }

  /**
   * 停止提醒服务
   */
  stop() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }
    console.log('🔔 连胜提醒服务已停止');
  }

  /**
   * 检查并发送提醒
   */
  private checkAndRemind() {
    const driveStore = useDriveStore.getState();
    const { winStreak } = driveStore;

    // 如果没有连胜，不需要提醒
    if (winStreak.currentStreak === 0) {
      this.hasRemindedToday = false;
      return;
    }

    // 如果今天已经提醒过，不再提醒
    if (this.hasRemindedToday) {
      return;
    }

    // 检查今天是否已完成3个任务
    if (winStreak.todayCompleted >= 3) {
      this.hasRemindedToday = false;
      return;
    }

    // 获取当前时间
    const now = new Date();
    const hour = now.getHours();

    // 在晚上8点后提醒
    if (hour >= 20) {
      this.sendReminder(winStreak.currentStreak, winStreak.todayCompleted);
      this.hasRemindedToday = true;
    }
  }

  /**
   * 发送提醒
   */
  private sendReminder(streakDays: number, todayCompleted: number) {
    const remaining = 3 - todayCompleted;

    // 浏览器通知
    notificationService.show({
      title: '⚠️ 连胜即将中断！',
      body: `你已经连续${streakDays}天保持自律，今天还需完成${remaining}个任务才能保持连胜！`,
      icon: '🔥',
      tag: 'streak-reminder',
    });

    // 语音播报
    notificationService.speak(
      `注意！你已经连续${streakDays}天保持自律，今天还需完成${remaining}个任务才能保持连胜！加油！`
    );

    console.log(`🔔 已发送连胜提醒：${streakDays}天连胜，还需完成${remaining}个任务`);
  }

  /**
   * 重置今日提醒状态（用于测试）
   */
  resetTodayReminder() {
    this.hasRemindedToday = false;
  }

  /**
   * 手动触发提醒（用于测试）
   */
  triggerReminder() {
    const driveStore = useDriveStore.getState();
    const { winStreak } = driveStore;
    
    if (winStreak.currentStreak > 0 && winStreak.todayCompleted < 3) {
      this.sendReminder(winStreak.currentStreak, winStreak.todayCompleted);
    }
  }
}

export const streakReminderService = new StreakReminderService();

