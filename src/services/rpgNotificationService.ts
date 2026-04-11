import { notificationService } from './notificationService';

/**
 * RPG 通知服务
 * 已精简为语音播报
 */
export class RPGNotificationService {
  static showTaskComplete(taskTitle: string, expReward: number, goldReward: number) {
    notificationService.speak(`${taskTitle}已完成，获得${expReward}经验和${goldReward}金币。`);
  }

  static showLevelUp(newLevel: number, newTitle: string) {
    notificationService.speak(`恭喜升级，当前等级是${newLevel}级，获得新称号${newTitle}。`);
  }

  static showImprovementComplete(improvementName: string) {
    notificationService.speak(`${improvementName}改进成功，继续保持。`);
  }

  static showWarning(title: string, message: string) {
    notificationService.speak(`${title}。${message}`);
  }

  static showAchievementUnlocked(achievementTitle: string, achievementIcon: string) {
    notificationService.speak(`成就解锁，${achievementIcon} ${achievementTitle}。`);
  }

  static showTaskReminder(taskTitle: string, minutesLeft: number) {
    notificationService.speak(`${taskTitle}还有${minutesLeft}分钟开始。`);
  }

  static show(notification: {
    type: 'success' | 'warning' | 'info' | 'level-up';
    title: string;
    message: string;
    duration?: number;
    actions?: Array<{
      label: string;
      onClick?: () => void | Promise<void>;
    }>;
  }) {
    void notification.type;
    void notification.duration;
    void notification.actions;
    notificationService.speak(`${notification.title}。${notification.message}`);
  }

  static clearAll() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
