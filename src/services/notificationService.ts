/**
 * 浏览器通知服务 - 增强版
 * 用于任务开始、结束等事件的通知
 * 支持声音、震动、语音播报
 */

interface NotificationSettings {
  // 任务开始前提醒
  taskStartBeforeReminder: boolean;
  taskStartBeforeMinutes: number;
  // 任务开始时提醒
  taskStartReminder: boolean;
  // 任务进行中提醒
  taskDuringReminder: boolean;
  taskDuringMinutes: number;
  // 任务结束前提醒
  taskEndBeforeReminder: boolean;
  taskEndBeforeMinutes: number;
  // 任务结束时提醒
  taskEndReminder: boolean;
  // 验证提醒
  verificationStartReminder: boolean;
  verificationCompleteReminder: boolean;
  verificationUrgentReminder: boolean;
  // 其他提醒
  growthReminder: boolean;
  dailyReport: boolean;
  badHabitWarning: boolean;
  goldChange: boolean;
  // 新增：超时、扣币、拖延提醒
  overtimeReminder: boolean;
  goldDeductionReminder: boolean;
  procrastinationReminder: boolean;
  // 语音设置
  voiceEnabled: boolean;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  browserNotification: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private settings: NotificationSettings;
  private audioContext: AudioContext | null = null;
  private isPlayingSound: boolean = false; // 🔧 防止音效重复播放

  constructor() {
    this.checkPermission();
    this.loadSettings();
    this.initAudioContext();
  }

  /**
   * 加载用户设置
   */
  private loadSettings() {
    const saved = localStorage.getItem('notification_settings');
    if (saved) {
      try {
        this.settings = JSON.parse(saved);
      } catch (e) {
        console.error('加载通知设置失败:', e);
        this.settings = this.getDefaultSettings();
      }
    } else {
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * 获取默认设置
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      taskStartBeforeReminder: true,
      taskStartBeforeMinutes: 2,
      taskStartReminder: true,
      taskDuringReminder: false,
      taskDuringMinutes: 10,
      taskEndBeforeReminder: true,
      taskEndBeforeMinutes: 5,
      taskEndReminder: true,
      verificationStartReminder: true,
      verificationCompleteReminder: true,
      verificationUrgentReminder: true,
      growthReminder: true,
      dailyReport: true,
      badHabitWarning: true,
      goldChange: true,
      overtimeReminder: true,
      goldDeductionReminder: true,
      procrastinationReminder: true,
      voiceEnabled: true,
      voiceRate: 1.0,
      voicePitch: 1.0,
      voiceVolume: 0.8,
      browserNotification: true,
    };
  }

  /**
   * 初始化音频上下文
   */
  private initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (e) {
      console.warn('无法初始化音频上下文:', e);
    }
  }

  /**
   * 检查通知权限
   */
  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * 重新加载设置（当用户修改设置时调用）
   */
  reloadSettings() {
    this.loadSettings();
    console.log('✅ 通知设置已重新加载:', this.settings);
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持通知功能');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }

  /**
   * 发送通知（支持后台）
   */
  async sendNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      silent?: boolean;
      vibrate?: number[];
    }
  ): Promise<void> {
    // 检查权限
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('通知权限未授予');
        return;
      }
    }

    try {
      // 优先使用 Service Worker 发送通知（支持后台）
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            icon: options?.icon || '/favicon.ico',
            badge: options?.badge || '/favicon.ico',
            body: options?.body,
            tag: options?.tag,
            requireInteraction: options?.requireInteraction || false,
            silent: options?.silent || false,
            vibrate: options?.vibrate || [200, 100, 200], // 振动模式
            data: {
              url: window.location.href,
            },
          });
          
          console.log('✅ 通过 Service Worker 发送通知');
          return;
        } catch (swError) {
          console.warn('Service Worker 通知失败，使用普通通知:', swError);
        }
      }

      // 降级：使用普通通知
      const notification = new Notification(title, {
        icon: options?.icon || '/favicon.ico',
        badge: options?.badge || '/favicon.ico',
        body: options?.body,
        tag: options?.tag,
        requireInteraction: options?.requireInteraction || false,
        silent: options?.silent || false,
      });

      // 点击通知时聚焦窗口
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 自动关闭（5秒后）
      if (!options?.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
      
      // 振动反馈
      if ('vibrate' in navigator && options?.vibrate) {
        navigator.vibrate(options.vibrate);
      }
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  /**
   * 播放提示音（使用 Web Audio API，更可靠）
   */
  playSound(type: 'start' | 'end' | 'warning' | 'coin' = 'start') {
    console.log('🔊 [playSound] 被调用:', type);
    
    // 🔧 检查是否有音频正在播放，避免重复播放
    if (this.isPlayingSound) {
      console.log('⏭️ [playSound] 音效正在播放中，跳过');
      return;
    }
    
    try {
      if (!this.audioContext) {
        console.warn('音频上下文未初始化');
        return;
      }

      // 恢复音频上下文（如果被暂停）
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // 🔧 标记正在播放
      this.isPlayingSound = true;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // 根据类型设置不同的音效
      let frequency = 800;
      let duration = 0.3;
      
      switch (type) {
        case 'start':
          frequency = 800; // 高音
          duration = 0.3;
          break;
        case 'end':
          frequency = 400; // 低音
          duration = 0.4;
          break;
        case 'warning':
          frequency = 1000; // 急促高音
          duration = 0.2;
          break;
        case 'coin':
          // 金币音效 - 上升的音调
          frequency = 600;
          duration = 0.4;
          
          // 创建上升音调效果
          const now = this.audioContext.currentTime;
          oscillator.frequency.setValueAtTime(600, now);
          oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
          
          oscillator.start(now);
          oscillator.stop(now + duration);
          
          // 🔧 播放完成后解除锁定
          setTimeout(() => {
            this.isPlayingSound = false;
          }, duration * 1000);
          
          console.log('✅ 金币音效播放成功');
          return;
      }

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // 音量包络
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);

      console.log('✅ 音效播放成功:', type);

      // 🔧 播放完成后解除锁定（警告音不播放两次了）
      setTimeout(() => {
        this.isPlayingSound = false;
      }, duration * 1000);
    } catch (error) {
      console.error('播放提示音失败:', error);
      this.isPlayingSound = false;
    }
  }

  /**
   * 震动反馈
   */
  vibrate(pattern: number | number[] = [200, 100, 200]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        console.log('✅ 震动反馈成功');
      } catch (e) {
        console.warn('震动失败:', e);
      }
    }
  }

  /**
   * 语音播报 - 增强版（支持移动端）
   */
  speak(text: string) {
    // 检查设置
    if (!this.settings.voiceEnabled) {
      console.log('⏭️ 语音播报已关闭');
      return;
    }

    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ 浏览器不支持语音播报');
      return;
    }

    try {
      // 取消之前的播报
      window.speechSynthesis.cancel();
      
      // 等待一小段时间，确保取消完成
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = this.settings.voiceRate;
        utterance.pitch = this.settings.voicePitch;
        utterance.volume = this.settings.voiceVolume;

        utterance.onstart = () => {
          console.log('🔊 开始语音播报:', text);
        };

        utterance.onend = () => {
          console.log('✅ 语音播报完成');
        };

        utterance.onerror = (e) => {
          console.error('❌ 语音播报失败:', e);
          
          // 如果是移动端Safari，尝试重新播报
          if (e.error === 'not-allowed' || e.error === 'interrupted') {
            console.log('🔄 尝试重新播报...');
            setTimeout(() => {
              window.speechSynthesis.speak(utterance);
            }, 100);
          }
        };

        // 移动端需要确保语音合成器已准备好
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.addEventListener('voiceschanged', () => {
            console.log('🎤 语音列表已加载');
            window.speechSynthesis.speak(utterance);
          }, { once: true });
        } else {
          window.speechSynthesis.speak(utterance);
        }
      }, 100);
    } catch (error) {
      console.error('❌ 语音播报异常:', error);
    }
  }
  
  /**
   * 初始化语音播报（需要用户交互）
   * 在用户第一次点击时调用，激活语音功能
   */
  async initSpeech(): Promise<boolean> {
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ 浏览器不支持语音播报');
      return false;
    }

    try {
      // 播放一个空的语音来激活
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      
      console.log('✅ 语音播报已激活');
      return true;
    } catch (error) {
      console.error('❌ 语音播报激活失败:', error);
      return false;
    }
  }

  /**
   * 任务开始通知 - 增强版
   */
  async notifyTaskStart(taskTitle: string, hasVerification: boolean = false) {
    console.log('📢 任务开始通知:', taskTitle);

    // 检查设置 - 使用正确的设置项
    if (!this.settings.taskStartReminder) {
      console.log('⏭️ 任务开始提醒已关闭');
      return;
    }

    const body = hasVerification
      ? `${taskTitle} 现在已开始，请进行启动验证哦！`
      : `${taskTitle} 现在已开始`;

    // 1. 发送浏览器通知
    if (this.settings.browserNotification) {
      await this.sendNotification('📋 任务开始', {
        body,
        tag: 'task-start',
        requireInteraction: hasVerification,
        vibrate: [200, 100, 200],
      });
    }

    // 2. 播放音效
    this.playSound('start');

    // 3. 震动反馈
    this.vibrate([200, 100, 200]);

    // 4. 语音播报
    this.speak(body);
  }

  /**
   * 任务即将结束通知 - 增强版（完全遵循用户设置）
   */
  async notifyTaskEnding(taskTitle: string, minutesLeft: number, hasVerification: boolean = false) {
    console.log('📢 [notifyTaskEnding] 被调用:', { taskTitle, minutesLeft, hasVerification });
    console.log('📢 [notifyTaskEnding] 当前设置:', this.settings);

    // 🔧 重新加载设置，确保使用最新的用户设置
    this.loadSettings();

    // 检查设置 - 使用正确的设置项
    if (!this.settings.taskEndBeforeReminder) {
      console.log('⏭️ [notifyTaskEnding] 任务结束前提醒已关闭（用户设置）');
      return;
    }

    // 检查是否匹配用户设置的提醒时间
    if (minutesLeft !== this.settings.taskEndBeforeMinutes) {
      console.log(`⏭️ [notifyTaskEnding] 不匹配用户设置的提醒时间（用户设置：${this.settings.taskEndBeforeMinutes}分钟，当前：${minutesLeft}分钟）`);
      return;
    }

    console.log(`✅ [notifyTaskEnding] 匹配用户设置，触发提醒（${minutesLeft}分钟）`);

    const body = hasVerification
      ? `${taskTitle} 还有${minutesLeft}分钟结束，准备进行完成验证哦！`
      : `${taskTitle} 还有${minutesLeft}分钟结束`;

    // 1. 发送浏览器通知
    if (this.settings.browserNotification) {
      await this.sendNotification('⏰ 任务即将结束', {
        body,
        tag: 'task-ending',
        requireInteraction: hasVerification,
        vibrate: [100, 50, 100, 50, 100],
      });
    }

    // 2. 播放警告音
    this.playSound('warning');

    // 3. 急促震动
    this.vibrate([100, 50, 100, 50, 100]);

    // 4. 语音播报
    this.speak(body);
  }

  /**
   * 任务结束通知 - 增强版
   */
  async notifyTaskEnd(taskTitle: string, hasVerification: boolean = false) {
    console.log('📢 任务结束通知:', taskTitle);

    // 检查设置 - 使用正确的设置项
    if (!this.settings.taskEndReminder) {
      console.log('⏭️ 任务结束提醒已关闭');
      return;
    }

    const body = hasVerification
      ? `${taskTitle} 已结束，请进行完成验证！`
      : `${taskTitle} 已结束`;

    // 1. 发送浏览器通知
    if (this.settings.browserNotification) {
      await this.sendNotification('✅ 任务结束', {
        body,
        tag: 'task-end',
        requireInteraction: hasVerification,
        vibrate: [300, 100, 300],
      });
    }

    // 2. 播放结束音
    this.playSound('end');

    // 3. 长震动
    this.vibrate([300, 100, 300]);

    // 4. 语音播报
    this.speak(body);
  }

  /**
   * 验证成功通知
   */
  async notifyVerificationSuccess(taskTitle: string, type: 'start' | 'completion') {
    console.log('📢 验证成功通知:', taskTitle, type);

    // 检查设置
    const shouldNotify = type === 'start' 
      ? this.settings.verificationStartReminder 
      : this.settings.verificationCompleteReminder;
    
    if (!shouldNotify) {
      console.log('⏭️ 验证提醒已关闭');
      return;
    }

    const typeText = type === 'start' ? '启动' : '完成';
    const body = `${taskTitle} ${typeText}验证通过！`;

    if (this.settings.browserNotification) {
      await this.sendNotification('✅ 验证成功', {
        body,
        tag: 'verification-success',
        vibrate: [200],
      });
    }

    this.playSound('start');
    this.vibrate([200]);
    this.speak(body);
  }

  /**
   * 验证失败通知
   */
  async notifyVerificationFailed(taskTitle: string, type: 'start' | 'completion', reason: string) {
    console.log('📢 验证失败通知:', taskTitle, type, reason);

    // 检查设置
    const shouldNotify = type === 'start' 
      ? this.settings.verificationStartReminder 
      : this.settings.verificationCompleteReminder;
    
    if (!shouldNotify) {
      console.log('⏭️ 验证提醒已关闭');
      return;
    }

    const typeText = type === 'start' ? '启动' : '完成';
    const body = `${taskTitle} ${typeText}验证失败：${reason}`;

    if (this.settings.browserNotification) {
      await this.sendNotification('❌ 验证失败', {
        body,
        tag: 'verification-failed',
        requireInteraction: true,
        vibrate: [100, 50, 100, 50, 100],
      });
    }

    this.playSound('warning');
    this.vibrate([100, 50, 100, 50, 100]);
    this.speak(body);
  }

  /**
   * 金币获得通知
   */
  async notifyGoldEarned(taskTitle: string, goldAmount: number) {
    console.log('📢 金币获得通知:', taskTitle, goldAmount);

    // 检查设置
    if (!this.settings.goldChange) {
      console.log('⏭️ 金币变动提醒已关闭');
      return;
    }

    const body = `完成 ${taskTitle}，获得 ${goldAmount} 金币！`;

    // 1. 发送浏览器通知
    if (this.settings.browserNotification) {
      await this.sendNotification('💰 获得金币', {
        body,
        tag: 'gold-earned',
        vibrate: [200, 100, 200],
      });
    }

    // 2. 播放金币音效
    this.playSound('coin');

    // 3. 震动反馈
    this.vibrate([200, 100, 200]);

    // 4. 语音播报
    this.speak(body);
  }

  /**
   * 金币扣除通知
   */
  async notifyGoldDeducted(reason: string, goldAmount: number) {
    console.log('📢 金币扣除通知:', reason, goldAmount);

    // 检查设置
    if (!this.settings.goldDeductionReminder) {
      console.log('⏭️ 扣除金币提醒已关闭');
      return;
    }

    const body = `${reason}，扣除 ${goldAmount} 金币`;

    // 1. 发送浏览器通知
    if (this.settings.browserNotification) {
      await this.sendNotification('⚠️ 扣除金币', {
        body,
        tag: 'gold-deducted',
        requireInteraction: true,
        vibrate: [100, 50, 100, 50, 100],
      });
    }

    // 2. 播放警告音
    this.playSound('warning');

    // 3. 急促震动
    this.vibrate([100, 50, 100, 50, 100]);

    // 4. 语音播报
    this.speak(body);
  }

  /**
   * 超时提醒通知
   */
  async notifyOvertime(taskTitle: string, type: 'start' | 'completion') {
    console.log('📢 超时提醒通知:', taskTitle, type);

    // 检查设置
    if (!this.settings.overtimeReminder) {
      console.log('⏭️ 超时提醒已关闭');
      return;
    }

    const typeText = type === 'start' ? '启动' : '完成';
    const body = `${taskTitle} ${typeText}超时，请尽快处理！`;

    // 1. 发送浏览器通知
    if (this.settings.browserNotification) {
      await this.sendNotification('⏰ 超时提醒', {
        body,
        tag: 'overtime',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
      });
    }

    // 2. 播放警告音
    this.playSound('warning');

    // 3. 震动反馈
    this.vibrate([200, 100, 200, 100, 200]);

    // 4. 语音播报
    this.speak(body);
  }

  /**
   * 拖延提醒通知
   */
  async notifyProcrastination(taskTitle: string, count: number) {
    console.log('📢 拖延提醒通知:', taskTitle, count);

    // 检查设置
    if (!this.settings.procrastinationReminder) {
      console.log('⏭️ 拖延提醒已关闭');
      return;
    }

    const body = `${taskTitle} 已拖延 ${count} 次，加油完成吧！`;

    // 1. 发送浏览器通知
    if (this.settings.browserNotification) {
      await this.sendNotification('🐢 拖延提醒', {
        body,
        tag: 'procrastination',
        requireInteraction: false,
        vibrate: [100, 50, 100],
      });
    }

    // 2. 播放提示音
    this.playSound('warning');

    // 3. 震动反馈
    this.vibrate([100, 50, 100]);

    // 4. 语音播报
    this.speak(body);
  }

  /**
   * 检查是否支持通知
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * 获取当前权限状态
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();
