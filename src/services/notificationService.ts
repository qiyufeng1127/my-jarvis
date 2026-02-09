/**
 * 浏览器通知服务
 * 用于任务开始、结束等事件的通知
 */

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkPermission();
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
   * 播放提示音（支持后台）
   */
  playSound(type: 'start' | 'end' | 'warning' = 'start') {
    try {
      const audio = new Audio();
      
      // 根据类型选择不同的音频
      switch (type) {
        case 'start':
          // 任务开始音（高音）
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKfj8LZjHAU5kdfy0HotBSJ1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z3I4+CRZluevrpVINC0yl4/G4ZRwGOpLY89F7LgUgcsXv45hEDBBYr+ftrVoWCECY3PLEcSYGLIHO8tyJNggZZ7vs551LDA9Qp+PwtmMcBTmR1/LQei0FInXF7+CUQgsSXLHo7KtYFQhDnN3ywW4kBS6Ez/PcjjwJFmW56+ulUg0LTKXj8bhlHAY6ktjz0XsuBSByxe/jmEQMEFiv5+2tWhYIQJjc8sRxJgYsgc7y3Ik2CBlnu+znnUsLD1Cn4/C2YxwFOZHX8tB6LQUidcXv4JRCCR';
          break;
        case 'end':
          // 任务结束音（低音）
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKfj8LZjHAU5kdfy0HotBSJ1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z3I4+CRZluevrpVINC0yl4/G4ZRwGOpLY89F7LgUgcsXv45hEDBBYr+ftrVoWCECY3PLEcSYGLIHO8tyJNggZZ7vs551LDA9Qp+PwtmMcBTmR1/LQei0FInXF7+CUQgsSXLHo7KtYFQhDnN3ywW4kBS6Ez/PcjjwJFmW56+ulUg0LTKXj8bhlHAY6ktjz0XsuBSByxe/jmEQMEFiv5+2tWhYIQJjc8sRxJgYsgc7y3Ik2CBlnu+znnUsLD1Cn4/C2YxwFOZHX8tB6LQUidcXv4JRCCR';
          break;
        case 'warning':
          // 警告音（急促）
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKfj8LZjHAU5kdfy0HotBSJ1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z3I4+CRZluevrpVINC0yl4/G4ZRwGOpLY89F7LgUgcsXv45hEDBBYr+ftrVoWCECY3PLEcSYGLIHO8tyJNggZZ7vs551LDA9Qp+PwtmMcBTmR1/LQei0FInXF7+CUQgsSXLHo7KtYFQhDnN3ywW4kBS6Ez/PcjjwJFmW56+ulUg0LTKXj8bhlHAY6ktjz0XsuBSByxe/jmEQMEFiv5+2tWhYIQJjc8sRxJgYsgc7y3Ik2CBlnu+znnUsLD1Cn4/C2YxwFOZHX8tB6LQUidcXv4JRCCR';
          break;
      }
      
      audio.volume = 0.8; // 提高音量确保能听到
      
      // 尝试播放，即使在后台
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ 音效播放成功');
          })
          .catch(err => {
            console.warn('播放提示音失败:', err);
            // 如果自动播放失败，尝试通过用户交互触发
            document.addEventListener('click', () => {
              audio.play().catch(e => console.warn('重试播放失败:', e));
            }, { once: true });
          });
      }
    } catch (error) {
      console.error('播放提示音失败:', error);
    }
  }

  /**
   * 任务开始通知
   */
  async notifyTaskStart(taskTitle: string, hasVerification: boolean = false) {
    const body = hasVerification
      ? `${taskTitle} 现在已开始，请进行启动验证哦！`
      : `${taskTitle} 现在已开始`;

    await this.sendNotification('📋 任务开始', {
      body,
      tag: 'task-start',
      requireInteraction: hasVerification,
      vibrate: [200, 100, 200], // 振动模式
    });

    this.playSound('start');
  }

  /**
   * 任务即将结束通知
   */
  async notifyTaskEnding(taskTitle: string, minutesLeft: number, hasVerification: boolean = false) {
    const body = hasVerification
      ? `${taskTitle} 还有${minutesLeft}分钟结束，准备进行完成验证哦！`
      : `${taskTitle} 还有${minutesLeft}分钟结束`;

    await this.sendNotification('⏰ 任务即将结束', {
      body,
      tag: 'task-ending',
      requireInteraction: hasVerification,
      vibrate: [100, 50, 100, 50, 100], // 急促振动
    });

    this.playSound('warning');
  }

  /**
   * 任务结束通知
   */
  async notifyTaskEnd(taskTitle: string, hasVerification: boolean = false) {
    const body = hasVerification
      ? `${taskTitle} 已结束，请进行完成验证！`
      : `${taskTitle} 已结束`;

    await this.sendNotification('✅ 任务结束', {
      body,
      tag: 'task-end',
      requireInteraction: hasVerification,
      vibrate: [300, 100, 300], // 长振动
    });

    this.playSound('end');
  }

  /**
   * 验证成功通知
   */
  async notifyVerificationSuccess(taskTitle: string, type: 'start' | 'completion') {
    const typeText = type === 'start' ? '启动' : '完成';
    await this.sendNotification('✅ 验证成功', {
      body: `${taskTitle} ${typeText}验证通过！`,
      tag: 'verification-success',
    });

    this.playSound('start');
  }

  /**
   * 验证失败通知
   */
  async notifyVerificationFailed(taskTitle: string, type: 'start' | 'completion', reason: string) {
    const typeText = type === 'start' ? '启动' : '完成';
    await this.sendNotification('❌ 验证失败', {
      body: `${taskTitle} ${typeText}验证失败：${reason}`,
      tag: 'verification-failed',
      requireInteraction: true,
    });

    this.playSound('warning');
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
