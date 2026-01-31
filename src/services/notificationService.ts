// ============================================
// 统一通知提醒系统
// 支持：语音播报、浏览器通知、弹窗提醒
// ============================================

export interface NotificationSettings {
  // 通知类型开关
  taskReminder: boolean; // 任务提醒
  growthReminder: boolean; // 成长提醒
  dailyReport: boolean; // 每日报告
  badHabitWarning: boolean; // 坏习惯警告
  goldChange: boolean; // 金币变动
  
  // 语音设置
  voiceEnabled: boolean; // 启用语音
  voiceRate: number; // 语速 (0.5-2.0)
  voicePitch: number; // 音调 (0.5-2.0)
  voiceVolume: number; // 音量 (0-1)
  
  // 系统通知
  browserNotification: boolean; // 浏览器通知
  
  // 提醒时机
  taskStartReminder: boolean; // 任务开始时提醒
  taskEndReminder: boolean; // 任务结束前提醒
  taskEndReminderMinutes: number; // 提前多少分钟提醒 (1, 5, 10)
  verificationReminder: boolean; // 验证提醒
  urgentReminder: boolean; // 紧急提醒（10秒倒计时）
}

export type NotificationType = 
  | 'task_start' // 任务开始
  | 'task_ending' // 任务即将结束
  | 'task_end' // 任务结束
  | 'verification_start' // 启动验证
  | 'verification_completion' // 完成验证
  | 'verification_urgent' // 验证紧急（10秒倒计时）
  | 'verification_timeout' // 验证超时
  | 'verification_retry' // 验证重试
  | 'verification_success' // 验证成功
  | 'verification_failed' // 验证失败
  | 'gold_earned' // 获得金币
  | 'gold_penalty' // 扣除金币
  | 'critical_failure' // 严重失败（连续3次）
  | 'daily_report' // 每日报告
  | 'growth_milestone' // 成长里程碑
  | 'bad_habit_warning'; // 坏习惯警告

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  taskTitle?: string;
  goldAmount?: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  autoClose?: boolean; // 是否自动关闭
  autoCloseDelay?: number; // 自动关闭延迟（毫秒）
}

// ============================================
// 通知管理器
// ============================================
export class NotificationManager {
  private static instance: NotificationManager;
  private settings: NotificationSettings;
  private synth = window.speechSynthesis;
  private notificationPermission: NotificationPermission = 'default';
  
  private constructor() {
    // 从 localStorage 加载设置
    this.settings = this.loadSettings();
    
    // 请求通知权限
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
      if (this.notificationPermission === 'default') {
        Notification.requestPermission().then(permission => {
          this.notificationPermission = permission;
        });
      }
    }
  }
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  // 加载设置
  private loadSettings(): NotificationSettings {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // 默认设置
    return {
      taskReminder: true,
      growthReminder: true,
      dailyReport: true,
      badHabitWarning: true,
      goldChange: true,
      voiceEnabled: true,
      voiceRate: 1.0,
      voicePitch: 1.0,
      voiceVolume: 1.0,
      browserNotification: true,
      taskStartReminder: true,
      taskEndReminder: true,
      taskEndReminderMinutes: 5,
      verificationReminder: true,
      urgentReminder: true,
    };
  }
  
  // 保存设置
  saveSettings(settings: NotificationSettings) {
    this.settings = settings;
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }
  
  // 获取设置
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }
  
  // ============================================
  // 核心通知方法
  // ============================================
  
  notify(payload: NotificationPayload) {
    console.log('🔔 通知触发:', payload);
    
    // 检查是否启用对应类型的通知
    if (!this.shouldNotify(payload.type)) {
      console.log('⏭️ 通知已禁用:', payload.type);
      return;
    }
    
    // 1. 语音播报
    if (this.settings.voiceEnabled) {
      this.speakNotification(payload);
    }
    
    // 2. 浏览器通知
    if (this.settings.browserNotification && this.notificationPermission === 'granted') {
      this.showBrowserNotification(payload);
    }
    
    // 3. 页面内弹窗（高优先级和严重级别）
    if (payload.priority === 'high' || payload.priority === 'critical') {
      this.showInPageNotification(payload);
    }
  }
  
  // 检查是否应该发送通知
  private shouldNotify(type: NotificationType): boolean {
    switch (type) {
      case 'task_start':
      case 'task_ending':
      case 'task_end':
        return this.settings.taskReminder && this.settings.taskStartReminder;
      
      case 'verification_start':
      case 'verification_completion':
      case 'verification_timeout':
      case 'verification_retry':
      case 'verification_success':
      case 'verification_failed':
        return this.settings.taskReminder && this.settings.verificationReminder;
      
      case 'verification_urgent':
        return this.settings.taskReminder && this.settings.urgentReminder;
      
      case 'gold_earned':
      case 'gold_penalty':
        return this.settings.goldChange;
      
      case 'critical_failure':
        return this.settings.badHabitWarning;
      
      case 'daily_report':
        return this.settings.dailyReport;
      
      case 'growth_milestone':
        return this.settings.growthReminder;
      
      case 'bad_habit_warning':
        return this.settings.badHabitWarning;
      
      default:
        return true;
    }
  }
  
  // ============================================
  // 语音播报
  // ============================================
  
  private speakNotification(payload: NotificationPayload) {
    // 取消之前的语音
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(payload.message);
    utterance.lang = 'zh-CN';
    utterance.rate = this.getVoiceRate(payload.priority);
    utterance.pitch = this.settings.voicePitch;
    utterance.volume = this.settings.voiceVolume;
    
    // 根据优先级选择不同的语音
    const voices = this.synth.getVoices();
    const chineseVoice = voices.find(v => v.lang.includes('zh'));
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }
    
    this.synth.speak(utterance);
    console.log('🔊 语音播报:', payload.message);
  }
  
  private getVoiceRate(priority: string): number {
    const baseRate = this.settings.voiceRate;
    
    switch (priority) {
      case 'critical':
        return Math.min(baseRate * 1.3, 2.0); // 加快30%
      case 'high':
        return Math.min(baseRate * 1.15, 2.0); // 加快15%
      default:
        return baseRate;
    }
  }
  
  // ============================================
  // 浏览器通知
  // ============================================
  
  private showBrowserNotification(payload: NotificationPayload) {
    if (!('Notification' in window) || this.notificationPermission !== 'granted') {
      return;
    }
    
    const notification = new Notification(payload.title, {
      body: payload.message,
      icon: '/icon-192x192.png', // PWA 图标
      badge: '/icon-192x192.png',
      tag: payload.type,
      requireInteraction: payload.priority === 'critical' || payload.priority === 'high',
      silent: false,
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    // 自动关闭
    if (payload.autoClose !== false) {
      const delay = payload.autoCloseDelay || 5000;
      setTimeout(() => notification.close(), delay);
    }
  }
  
  // ============================================
  // 页面内弹窗
  // ============================================
  
  private showInPageNotification(payload: NotificationPayload) {
    // 触发自定义事件，由 UI 组件监听
    const event = new CustomEvent('app-notification', {
      detail: payload,
    });
    window.dispatchEvent(event);
  }
  
  // ============================================
  // 便捷方法 - 任务相关
  // ============================================
  
  notifyTaskStart(taskTitle: string, keywords: string[]) {
    this.notify({
      type: 'task_start',
      title: '任务开始',
      message: `您的任务"${taskTitle}"现在开始，请拍摄包含以下内容的照片：${keywords.join('、')}。两分钟倒计时开始。`,
      taskTitle,
      priority: 'high',
    });
  }
  
  notifyTaskEnding(taskTitle: string, minutesLeft: number) {
    this.notify({
      type: 'task_ending',
      title: '任务即将结束',
      message: `您的任务"${taskTitle}"还有${minutesLeft}分钟结束，准备收尾了哟。`,
      taskTitle,
      priority: 'normal',
    });
  }
  
  notifyTaskEnd(taskTitle: string, keywords: string[]) {
    this.notify({
      type: 'task_end',
      title: '任务结束',
      message: `任务"${taskTitle}"时间到，请拍摄完成验证照片，需要包含：${keywords.join('、')}。`,
      taskTitle,
      priority: 'high',
    });
  }
  
  notifyVerificationUrgent(taskTitle: string, secondsLeft: number) {
    this.notify({
      type: 'verification_urgent',
      title: '紧急提醒',
      message: `注意！任务"${taskTitle}"启动还剩${secondsLeft}秒，不要拖延了，快快快！`,
      taskTitle,
      priority: 'critical',
    });
  }
  
  notifyVerificationTimeout(taskTitle: string, penaltyGold: number, timeoutCount: number, isStart: boolean) {
    this.notify({
      type: 'verification_timeout',
      title: '验证超时',
      message: `任务"${taskTitle}"${isStart ? '启动' : '完成'}超时第${timeoutCount}次，扣除${penaltyGold}金币。${timeoutCount < 3 ? `再给您${isStart ? '2' : '10'}分钟${isStart ? '重试' : '延期'}机会。` : '连续3次超时，请认真对待任务！'}`,
      taskTitle,
      goldAmount: -penaltyGold,
      priority: timeoutCount >= 3 ? 'critical' : 'high',
    });
  }
  
  notifyVerificationSuccess(taskTitle: string, goldEarned: number, isStart: boolean) {
    this.notify({
      type: 'verification_success',
      title: '验证成功',
      message: `太棒了！任务"${taskTitle}"${isStart ? '启动' : '完成'}成功，获得${goldEarned}金币${isStart ? '（40%奖励）' : ''}！`,
      taskTitle,
      goldAmount: goldEarned,
      priority: 'normal',
    });
  }
  
  notifyCriticalFailure(taskTitle: string, totalPenalty: number) {
    this.notify({
      type: 'critical_failure',
      title: '严重警告',
      message: `警告！任务"${taskTitle}"连续3次失败，总共扣除${totalPenalty}金币！请立即认真完成任务！`,
      taskTitle,
      goldAmount: -totalPenalty,
      priority: 'critical',
      autoClose: false, // 不自动关闭
    });
  }
  
  notifyGoldChange(amount: number, reason: string) {
    this.notify({
      type: amount > 0 ? 'gold_earned' : 'gold_penalty',
      title: amount > 0 ? '获得金币' : '扣除金币',
      message: `${reason}，${amount > 0 ? '获得' : '扣除'}${Math.abs(amount)}金币`,
      goldAmount: amount,
      priority: 'normal',
    });
  }
  
  notifyDailyReport(summary: string) {
    this.notify({
      type: 'daily_report',
      title: '每日报告',
      message: summary,
      priority: 'normal',
    });
  }
  
  notifyGrowthMilestone(milestone: string) {
    this.notify({
      type: 'growth_milestone',
      title: '成长里程碑',
      message: milestone,
      priority: 'normal',
    });
  }
  
  notifyBadHabit(warning: string) {
    this.notify({
      type: 'bad_habit_warning',
      title: '坏习惯警告',
      message: warning,
      priority: 'high',
    });
  }
}

// 导出单例
export const notificationManager = NotificationManager.getInstance();
