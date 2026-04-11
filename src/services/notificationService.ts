/**
 * 精简版语音提醒服务
 * 只保留：
 * 1. 任务开始前提醒
 * 2. 任务结束前提醒（支持 0 分钟）
 * 3. 超时提醒（超时 20 分钟后按间隔提醒）
 * 4. 拖延提醒（达到设定次数阈值时提醒）
 */

export interface VoiceNotificationSettings {
  voiceEnabled: boolean;
  taskStartBeforeReminder: boolean;
  taskStartBeforeMinutes: 1 | 2 | 3;
  taskEndBeforeReminder: boolean;
  taskEndBeforeMinutes: 0 | 1 | 2 | 3;
  overtimeReminder: boolean;
  overtimeReminderInterval: 20 | 30;
  procrastinationReminder: boolean;
  procrastinationReminderCount: 10 | 20 | 30;
}

const STORAGE_KEY = 'notification_settings';

const DEFAULT_SETTINGS: VoiceNotificationSettings = {
  voiceEnabled: true,
  taskStartBeforeReminder: true,
  taskStartBeforeMinutes: 2,
  taskEndBeforeReminder: true,
  taskEndBeforeMinutes: 0,
  overtimeReminder: true,
  overtimeReminderInterval: 20,
  procrastinationReminder: true,
  procrastinationReminderCount: 10,
};

class NotificationService {
  private settings: VoiceNotificationSettings = DEFAULT_SETTINGS;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        this.settings = DEFAULT_SETTINGS;
        return;
      }

      this.settings = {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(saved),
      };
    } catch (error) {
      console.error('加载语音提醒设置失败:', error);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  reloadSettings() {
    this.loadSettings();
  }

  getSettings(): VoiceNotificationSettings {
    this.loadSettings();
    return this.settings;
  }

  async initSpeech(): Promise<boolean> {
    if (!('speechSynthesis' in window)) {
      console.warn('当前浏览器不支持语音播报');
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      console.error('激活语音播报失败:', error);
      return false;
    }
  }

  speak(text: string) {
    this.loadSettings();

    if (!this.settings.voiceEnabled) {
      return;
    }

    if (!('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('语音播报失败:', error);
    }
  }

  async notifyTaskStartBefore(taskTitle: string, minutesBefore: number, _hasVerification = false) {
    this.loadSettings();

    if (!this.settings.taskStartBeforeReminder) return;
    if (minutesBefore !== this.settings.taskStartBeforeMinutes) return;

    this.speak(`还有${minutesBefore}分钟，${taskTitle}即将开始。`);
  }

  async notifyTaskStart(taskTitle: string, _hasVerification = false) {
    this.speak(`${taskTitle}开始了。`);
  }

  async notifyTaskEnding(taskTitle: string, minutesLeft: number, _hasVerification = false) {
    this.loadSettings();

    if (!this.settings.taskEndBeforeReminder) return;
    if (minutesLeft !== this.settings.taskEndBeforeMinutes) return;

    if (minutesLeft === 0) {
      this.speak(`${taskTitle}时间到了，请准备结束任务。`);
      return;
    }

    this.speak(`还有${minutesLeft}分钟，${taskTitle}即将结束。`);
  }

  async notifyOvertime(taskTitle: string, type: 'start' | 'completion', overtimeMinutes?: number) {
    this.loadSettings();

    if (!this.settings.overtimeReminder) return;

    const overdueMinutes = overtimeMinutes ?? 20;
    if (overdueMinutes < 20) return;
    if ((overdueMinutes - 20) % this.settings.overtimeReminderInterval !== 0) return;

    const typeText = type === 'start' ? '开始' : '完成';
    this.speak(`${taskTitle}${typeText}已超时${overdueMinutes}分钟，请尽快处理。`);
  }

  async notifyProcrastination(taskTitle: string, count: number) {
    this.loadSettings();

    if (!this.settings.procrastinationReminder) return;
    if (count <= 0) return;
    if (count % this.settings.procrastinationReminderCount !== 0) return;

    this.speak(`${taskTitle}已经拖延${count}次了，请马上开始。`);
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

export const notificationService = new NotificationService();
