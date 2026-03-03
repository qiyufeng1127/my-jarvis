/**
 * RPG通知服务 - iOS风格的通知提示
 */
export class RPGNotificationService {
  private static notificationQueue: Array<{
    id: string;
    type: 'success' | 'warning' | 'info' | 'level-up';
    title: string;
    message: string;
    duration: number;
  }> = [];

  private static isShowing = false;

  /**
   * 显示任务完成通知
   */
  static showTaskComplete(taskTitle: string, expReward: number, goldReward: number) {
    this.show({
      type: 'success',
      title: '✅ 任务完成',
      message: `${taskTitle}\n+${expReward} 经验 +${goldReward} 金币`,
      duration: 3000,
    });

    // 播放成功音效
    this.playSound('success');
  }

  /**
   * 显示升级通知
   */
  static showLevelUp(newLevel: number, newTitle: string) {
    this.show({
      type: 'level-up',
      title: '🎉 恭喜升级！',
      message: `等级提升至 Lv.${newLevel}\n获得新称号：${newTitle}`,
      duration: 5000,
    });

    // 播放升级音效
    this.playSound('level-up');
  }

  /**
   * 显示改进任务完成通知
   */
  static showImprovementComplete(improvementName: string) {
    this.show({
      type: 'success',
      title: '✨ 改进成功',
      message: `${improvementName}行为又改善了一点，继续加油！`,
      duration: 3000,
    });

    this.playSound('success');
  }

  /**
   * 显示警示通知
   */
  static showWarning(title: string, message: string) {
    this.show({
      type: 'warning',
      title: `⚠️ ${title}`,
      message,
      duration: 3000,
    });

    this.playSound('warning');
  }

  /**
   * 显示成就解锁通知
   */
  static showAchievementUnlocked(achievementTitle: string, achievementIcon: string) {
    this.show({
      type: 'success',
      title: '🏆 成就解锁',
      message: `${achievementIcon} ${achievementTitle}`,
      duration: 4000,
    });

    this.playSound('achievement');
  }

  /**
   * 显示任务提醒
   */
  static showTaskReminder(taskTitle: string, minutesLeft: number) {
    this.show({
      type: 'info',
      title: '⏰ 任务提醒',
      message: `${taskTitle}\n还有 ${minutesLeft} 分钟开始`,
      duration: 3000,
    });

    this.playSound('reminder');
  }

  /**
   * 通用显示方法
   */
  private static show(notification: {
    type: 'success' | 'warning' | 'info' | 'level-up';
    title: string;
    message: string;
    duration: number;
  }) {
    const id = `notification-${Date.now()}`;
    
    this.notificationQueue.push({
      id,
      ...notification,
    });

    if (!this.isShowing) {
      this.showNext();
    }
  }

  /**
   * 显示下一个通知
   */
  private static showNext() {
    if (this.notificationQueue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const notification = this.notificationQueue.shift()!;

    // 创建通知元素
    const notificationEl = document.createElement('div');
    notificationEl.id = notification.id;
    notificationEl.className = 'rpg-notification';
    notificationEl.style.cssText = `
      position: fixed;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      min-width: 300px;
      max-width: 90%;
      padding: 16px 20px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      ${this.getNotificationStyle(notification.type)}
    `;

    // 设置内容
    notificationEl.innerHTML = `
      <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px; color: inherit;">
        ${notification.title}
      </div>
      <div style="font-size: 13px; opacity: 0.9; white-space: pre-line; color: inherit;">
        ${notification.message}
      </div>
    `;

    document.body.appendChild(notificationEl);

    // 动画：滑入
    requestAnimationFrame(() => {
      notificationEl.style.top = '20px';
    });

    // 自动消失
    setTimeout(() => {
      notificationEl.style.top = '-100px';
      notificationEl.style.opacity = '0';

      setTimeout(() => {
        document.body.removeChild(notificationEl);
        this.showNext();
      }, 300);
    }, notification.duration);
  }

  /**
   * 获取通知样式
   */
  private static getNotificationStyle(type: string): string {
    const styles = {
      'success': 'background: linear-gradient(135deg, #C8D5B9 0%, #8F9E25 100%); color: #fff;',
      'warning': 'background: linear-gradient(135deg, #F5D5CB 0%, #C97064 100%); color: #43302E;',
      'info': 'background: linear-gradient(135deg, #C1DBE8 0%, #6B9AC4 100%); color: #fff;',
      'level-up': 'background: linear-gradient(135deg, #EAA239 0%, #D4AF37 100%); color: #fff;',
    };
    return styles[type] || styles.info;
  }

  /**
   * 播放音效
   */
  private static playSound(type: 'success' | 'warning' | 'reminder' | 'level-up' | 'achievement') {
    // 使用Web Audio API播放简单的提示音
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 根据类型设置不同的音调
      const frequencies = {
        'success': [523.25, 659.25, 783.99], // C5-E5-G5
        'warning': [440, 392], // A4-G4
        'reminder': [523.25, 587.33], // C5-D5
        'level-up': [523.25, 659.25, 783.99, 1046.50], // C5-E5-G5-C6
        'achievement': [659.25, 783.99, 1046.50], // E5-G5-C6
      };

      const notes = frequencies[type] || frequencies.success;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.05, audioContext.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.2);
        
        osc.start(audioContext.currentTime + index * 0.1);
        osc.stop(audioContext.currentTime + index * 0.1 + 0.2);
      });

    } catch (error) {
      console.warn('音效播放失败：', error);
    }
  }

  /**
   * 请求通知权限
   */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * 发送系统通知（需要权限）
   */
  static async sendSystemNotification(title: string, body: string, icon?: string) {
    const hasPermission = await this.requestPermission();
    
    if (hasPermission) {
      new Notification(title, {
        body,
        icon: icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'rpg-notification',
        requireInteraction: false,
      });
    }
  }

  /**
   * 清除所有通知
   */
  static clearAll() {
    this.notificationQueue = [];
    const notifications = document.querySelectorAll('.rpg-notification');
    notifications.forEach(el => el.remove());
    this.isShowing = false;
  }
}

