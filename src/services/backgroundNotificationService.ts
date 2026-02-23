/**
 * 后台通知服务 - PWA 增强版
 * 支持后台运行、语音播报、持久化通知
 */

import { notificationService } from './notificationService';

interface TaskReminder {
  taskId: string;
  taskTitle: string;
  startTime: Date;
  endTime: Date;
  hasVerification: boolean;
  notified: boolean;
}

class BackgroundNotificationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private wakeLock: any = null;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  /**
   * 初始化服务
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔔 初始化后台通知服务...');
    
    // 1. 请求通知权限
    await this.requestPermissions();
    
    // 2. 注册 Service Worker
    await this.registerServiceWorker();
    
    // 3. 请求屏幕常亮（防止后台休眠）
    await this.requestWakeLock();
    
    // 4. 初始化音频上下文（用于后台音效）
    this.initAudioContext();
    
    // 5. 启动定时检查
    this.startPeriodicCheck();
    
    // 6. 监听页面可见性变化
    this.setupVisibilityListener();
    
    this.isInitialized = true;
    console.log('✅ 后台通知服务已启动');
  }

  /**
   * 请求所有必要的权限
   */
  private async requestPermissions() {
    // 1. 通知权限
    if ('Notification' in window && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      console.log('📢 通知权限:', permission);
    }
    
    // 2. 后台同步权限（如果支持）
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      console.log('✅ 支持后台同步');
    }
    
    // 3. 持久化存储权限
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const isPersisted = await navigator.storage.persist();
      console.log('💾 持久化存储:', isPersisted);
    }
  }

  /**
   * 注册 Service Worker
   */
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/my-jarvis/service-worker.js', {
          scope: '/my-jarvis/'
        });
        console.log('✅ Service Worker 已注册:', registration.scope);
        
        // 监听 Service Worker 更新
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker 更新中...');
        });
      } catch (error) {
        console.error('❌ Service Worker 注册失败:', error);
      }
    }
  }

  /**
   * 请求屏幕常亮（防止后台休眠）
   */
  private async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('✅ 屏幕常亮已启用');
        
        // 监听释放事件
        this.wakeLock.addEventListener('release', () => {
          console.log('⚠️ 屏幕常亮已释放');
        });
      } catch (error) {
        console.warn('⚠️ 无法启用屏幕常亮:', error);
      }
    }
  }

  /**
   * 初始化音频上下文
   */
  private initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        
        // 用户交互后恢复音频上下文
        const resumeAudio = () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
            console.log('🔊 音频上下文已恢复');
          }
        };
        
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
      }
    } catch (error) {
      console.warn('⚠️ 音频上下文初始化失败:', error);
    }
  }

  /**
   * 启动定时检查（每30秒检查一次）
   */
  private startPeriodicCheck() {
    // 立即执行一次
    this.checkTasks();
    
    // 每30秒检查一次
    this.checkInterval = setInterval(() => {
      this.checkTasks();
    }, 30000);
    
    console.log('⏰ 定时检查已启动（每30秒）');
  }

  /**
   * 检查任务并发送通知
   */
  private async checkTasks() {
    try {
      // 从 localStorage 读取任务数据
      const tasksStr = localStorage.getItem('manifestos-tasks-storage');
      if (!tasksStr) return;
      
      const tasksData = JSON.parse(tasksStr);
      const tasks = tasksData?.state?.tasks || [];
      
      const now = new Date();
      
      for (const task of tasks) {
        if (!task.scheduledStart || !task.scheduledEnd) continue;
        
        const startTime = new Date(task.scheduledStart);
        const endTime = new Date(task.scheduledEnd);
        
        // 检查是否需要发送开始通知（提前5分钟）
        const timeUntilStart = startTime.getTime() - now.getTime();
        if (timeUntilStart > 0 && timeUntilStart <= 5 * 60 * 1000) {
          const notifiedKey = `notified_start_${task.id}`;
          if (!localStorage.getItem(notifiedKey)) {
            await this.sendTaskStartReminder(task);
            localStorage.setItem(notifiedKey, 'true');
          }
        }
        
        // 检查是否需要发送结束通知（提前5分钟）
        const timeUntilEnd = endTime.getTime() - now.getTime();
        if (timeUntilEnd > 0 && timeUntilEnd <= 5 * 60 * 1000) {
          const notifiedKey = `notified_end_${task.id}`;
          if (!localStorage.getItem(notifiedKey)) {
            await this.sendTaskEndReminder(task);
            localStorage.setItem(notifiedKey, 'true');
          }
        }
      }
    } catch (error) {
      console.error('❌ 检查任务失败:', error);
    }
  }

  /**
   * 发送任务开始提醒
   */
  private async sendTaskStartReminder(task: any) {
    console.log('📢 发送任务开始提醒:', task.title);
    
    const startTime = new Date(task.scheduledStart);
    const minutesUntilStart = Math.ceil((startTime.getTime() - Date.now()) / 60000);
    
    const body = `${task.title} 将在 ${minutesUntilStart} 分钟后开始`;
    
    // 1. 发送通知
    await notificationService.sendNotification('⏰ 任务即将开始', {
      body,
      tag: `task-start-${task.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });
    
    // 2. 播放音效
    notificationService.playSound('start');
    
    // 3. 语音播报
    notificationService.speak(body);
    
    // 4. 震动
    notificationService.vibrate([200, 100, 200]);
  }

  /**
   * 发送任务结束提醒
   */
  private async sendTaskEndReminder(task: any) {
    console.log('📢 发送任务结束提醒:', task.title);
    
    const endTime = new Date(task.scheduledEnd);
    const minutesUntilEnd = Math.ceil((endTime.getTime() - Date.now()) / 60000);
    
    const body = `${task.title} 还有 ${minutesUntilEnd} 分钟结束`;
    
    // 1. 发送通知
    await notificationService.sendNotification('⏰ 任务即将结束', {
      body,
      tag: `task-end-${task.id}`,
      requireInteraction: true,
      vibrate: [100, 50, 100, 50, 100],
    });
    
    // 2. 播放警告音
    notificationService.playSound('warning');
    
    // 3. 语音播报
    notificationService.speak(body);
    
    // 4. 震动
    notificationService.vibrate([100, 50, 100, 50, 100]);
  }

  /**
   * 监听页面可见性变化
   */
  private setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 应用进入后台');
        // 应用进入后台时，确保通知服务继续运行
      } else {
        console.log('📱 应用回到前台');
        // 应用回到前台时，恢复音频上下文
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      }
    });
  }

  /**
   * 立即发送测试通知
   */
  async sendTestNotification() {
    console.log('🧪 发送测试通知');
    
    await notificationService.sendNotification('🧪 测试通知', {
      body: '如果你看到这条通知，说明通知功能正常工作！',
      tag: 'test',
      requireInteraction: false,
      vibrate: [200, 100, 200],
    });
    
    notificationService.playSound('start');
    notificationService.speak('测试通知，如果你听到这段语音，说明语音播报功能正常工作');
    notificationService.vibrate([200, 100, 200]);
  }

  /**
   * 停止服务
   */
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    console.log('🔕 后台通知服务已停止');
  }
}

export const backgroundNotificationService = new BackgroundNotificationService();

