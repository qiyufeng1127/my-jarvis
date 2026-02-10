/**
 * 浏览器通知服务 - 增强版
 * 用于任务开始、结束等事件的通知
 * 支持声音、震动、语音播报
 */

interface NotificationSettings {
  taskReminder: boolean;
  taskStartReminder: boolean;
  taskEndReminder: boolean;
  verificationReminder: boolean;
  urgentReminder: boolean;
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
      taskReminder: true,
      taskStartReminder: true,
      taskEndReminder: true,
      verificationReminder: true,
      urgentReminder: true,
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
  playSound(type: 'start' | 'end' | 'warning' = 'start') {
    // 检查设置
    if (!this.settings.taskReminder) {
      console.log('⏭️ 任务提醒已关闭，跳过音效');
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

      // 如果是警告音，播放两次
      if (type === 'warning') {
        setTimeout(() => {
          this.playSound('warning');
        }, 300);
      }
    } catch (error) {
      console.error('播放提示音失败:', error);
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
   * 语音播报
   */
  speak(text: string) {
    // 检查设置
    if (!this.settings.voiceEnabled) {
      console.log('⏭️ 语音播报已关闭');
      return;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // 取消之前的播报
        
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
          console.error('语音播报失败:', e);
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('语音播报失败:', error);
      }
    }
  }

  /**
   * 任务开始通知 - 增强版
   */
  async notifyTaskStart(taskTitle: string, hasVerification: boolean = false) {
    console.log('📢 任务开始通知:', taskTitle);

    // 检查设置
    if (!this.settings.taskReminder || !this.settings.taskStartReminder) {
      console.log('⏭️ 任务开始提醒已关闭');
      return;
    }

    const body = hasVerification
      ? `${taskTitle} 现在已开始，请进行启动验证哦！`
      : `${taskTitle} 现在已开始`;

    // 1. 发送浏览器通知
    await this.sendNotification('📋 任务开始', {
      body,
      tag: 'task-start',
      requireInteraction: hasVerification,
      vibrate: [200, 100, 200],
    });

    // 2. 播放音效
    this.playSound('start');

    // 3. 震动反馈
    this.vibrate([200, 100, 200]);

    // 4. 语音播报
    this.speak(body);
  }

  /**
   * 任务即将结束通知 - 增强版
   */
  async notifyTaskEnding(taskTitle: string, minutesLeft: number, hasVerification: boolean = false) {
    console.log('📢 任务即将结束通知:', taskTitle, minutesLeft);

    // 检查设置
    if (!this.settings.taskReminder || !this.settings.taskEndReminder) {
      console.log('⏭️ 任务结束提醒已关闭');
      return;
    }

    const body = hasVerification
      ? `${taskTitle} 还有${minutesLeft}分钟结束，准备进行完成验证哦！`
      : `${taskTitle} 还有${minutesLeft}分钟结束`;

    // 1. 发送浏览器通知
    await this.sendNotification('⏰ 任务即将结束', {
      body,
      tag: 'task-ending',
      requireInteraction: hasVerification,
      vibrate: [100, 50, 100, 50, 100],
    });

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

    // 检查设置
    if (!this.settings.taskReminder) {
      console.log('⏭️ 任务提醒已关闭');
      return;
    }

    const body = hasVerification
      ? `${taskTitle} 已结束，请进行完成验证！`
      : `${taskTitle} 已结束`;

    // 1. 发送浏览器通知
    await this.sendNotification('✅ 任务结束', {
      body,
      tag: 'task-end',
      requireInteraction: hasVerification,
      vibrate: [300, 100, 300],
    });

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

    if (!this.settings.verificationReminder) {
      console.log('⏭️ 验证提醒已关闭');
      return;
    }

    const typeText = type === 'start' ? '启动' : '完成';
    const body = `${taskTitle} ${typeText}验证通过！`;

    await this.sendNotification('✅ 验证成功', {
      body,
      tag: 'verification-success',
      vibrate: [200],
    });

    this.playSound('start');
    this.vibrate([200]);
    this.speak(body);
  }

  /**
   * 验证失败通知
   */
  async notifyVerificationFailed(taskTitle: string, type: 'start' | 'completion', reason: string) {
    console.log('📢 验证失败通知:', taskTitle, type, reason);

    if (!this.settings.verificationReminder) {
      console.log('⏭️ 验证提醒已关闭');
      return;
    }

    const typeText = type === 'start' ? '启动' : '完成';
    const body = `${taskTitle} ${typeText}验证失败：${reason}`;

    await this.sendNotification('❌ 验证失败', {
      body,
      tag: 'verification-failed',
      requireInteraction: true,
      vibrate: [100, 50, 100, 50, 100],
    });

    this.playSound('warning');
    this.vibrate([100, 50, 100, 50, 100]);
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
