/**
 * 活动监控服务
 * 监控用户在时间轴添加任务的活动，1小时无活动则触发紧急任务
 */

import { useEmergencyTaskStore } from '@/stores/emergencyTaskStore';

class ActivityMonitorService {
  private lastActivityTime: number = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_THRESHOLD = 60 * 60 * 1000; // 1小时（毫秒）
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 每5分钟检查一次
  private dailyReplaceCount: number = 0;
  private lastResetDate: string = new Date().toISOString().split('T')[0];
  private readonly MAX_DAILY_REPLACES = 3; // 每日最多替换3次

  constructor() {
    this.loadState();
  }

  /**
   * 从localStorage加载状态
   */
  private loadState() {
    try {
      const saved = localStorage.getItem('activity-monitor-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.lastActivityTime = state.lastActivityTime || Date.now();
        this.dailyReplaceCount = state.dailyReplaceCount || 0;
        this.lastResetDate = state.lastResetDate || new Date().toISOString().split('T')[0];
        
        // 检查是否需要重置每日计数
        const today = new Date().toISOString().split('T')[0];
        if (this.lastResetDate !== today) {
          this.dailyReplaceCount = 0;
          this.lastResetDate = today;
          this.saveState();
        }
      }
    } catch (error) {
      console.error('❌ 加载活动监控状态失败:', error);
    }
  }

  /**
   * 保存状态到localStorage
   */
  private saveState() {
    try {
      const state = {
        lastActivityTime: this.lastActivityTime,
        dailyReplaceCount: this.dailyReplaceCount,
        lastResetDate: this.lastResetDate,
      };
      localStorage.setItem('activity-monitor-state', JSON.stringify(state));
    } catch (error) {
      console.error('❌ 保存活动监控状态失败:', error);
    }
  }

  /**
   * 检查当前时间是否在豁免时段（24:00-9:00）
   */
  private isInExemptPeriod(): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // 0:00 - 9:00 之间不触发
    return hour >= 0 && hour < 9;
  }

  /**
   * 记录用户活动（添加任务）
   */
  recordActivity() {
    this.lastActivityTime = Date.now();
    this.saveState();
    console.log('✅ 记录用户活动，重置计时器');
  }

  /**
   * 检查是否需要触发紧急任务
   */
  private checkInactivity() {
    const now = Date.now();
    const inactiveDuration = now - this.lastActivityTime;

    console.log('🔍 检查用户活动状态...');
    console.log('🔍 上次活动时间:', new Date(this.lastActivityTime).toLocaleString());
    console.log('🔍 无活动时长:', Math.floor(inactiveDuration / 1000 / 60), '分钟');

    // 检查是否在豁免时段
    if (this.isInExemptPeriod()) {
      console.log('⏰ 当前在豁免时段（0:00-9:00），不触发紧急任务');
      return;
    }

    // 检查是否超过1小时无活动
    if (inactiveDuration >= this.INACTIVITY_THRESHOLD) {
      console.log('🚨 检测到1小时无活动，触发紧急任务');
      this.triggerEmergencyTask();
      
      // 重置计时器，避免重复触发
      this.lastActivityTime = Date.now();
      this.saveState();
    }
  }

  /**
   * 触发紧急任务
   */
  private triggerEmergencyTask() {
    const emergencyStore = useEmergencyTaskStore.getState();
    
    // 检查是否已有当前任务
    if (emergencyStore.currentTask) {
      console.log('⚠️ 已有紧急任务进行中，不重复触发');
      return;
    }

    // 触发随机任务
    const task = emergencyStore.triggerRandomTask();
    
    if (task) {
      console.log('✅ 成功触发紧急任务:', task.title);
      
      // 发送自定义事件通知UI
      const event = new CustomEvent('emergencyTaskTriggered', {
        detail: { task },
      });
      window.dispatchEvent(event);
    } else {
      console.log('⚠️ 没有可用的紧急任务');
    }
  }

  /**
   * 尝试替换当前任务
   * @returns 是否成功替换
   */
  tryReplaceTask(): { success: boolean; message: string } {
    // 检查是否需要重置每日计数
    const today = new Date().toISOString().split('T')[0];
    if (this.lastResetDate !== today) {
      this.dailyReplaceCount = 0;
      this.lastResetDate = today;
    }

    // 检查是否超过每日限制
    if (this.dailyReplaceCount >= this.MAX_DAILY_REPLACES) {
      return {
        success: false,
        message: `今日替换次数已用完（${this.MAX_DAILY_REPLACES}/${this.MAX_DAILY_REPLACES}）`,
      };
    }

    // 执行替换
    const emergencyStore = useEmergencyTaskStore.getState();
    const newTask = emergencyStore.replaceCurrentTask();

    if (newTask) {
      this.dailyReplaceCount++;
      this.saveState();
      
      const remaining = this.MAX_DAILY_REPLACES - this.dailyReplaceCount;
      return {
        success: true,
        message: `已替换任务，今日还可替换 ${remaining} 次`,
      };
    } else {
      return {
        success: false,
        message: '没有其他可用任务',
      };
    }
  }

  /**
   * 获取今日剩余替换次数
   */
  getRemainingReplaces(): number {
    const today = new Date().toISOString().split('T')[0];
    if (this.lastResetDate !== today) {
      return this.MAX_DAILY_REPLACES;
    }
    return Math.max(0, this.MAX_DAILY_REPLACES - this.dailyReplaceCount);
  }

  /**
   * 启动监控
   */
  start() {
    if (this.checkInterval) {
      console.log('⚠️ 活动监控已在运行');
      return;
    }

    console.log('✅ 启动活动监控服务');
    
    // 立即检查一次
    this.checkInactivity();
    
    // 定期检查
    this.checkInterval = setInterval(() => {
      this.checkInactivity();
    }, this.CHECK_INTERVAL);
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('✅ 停止活动监控服务');
    }
  }

  /**
   * 重置监控（用于测试）
   */
  reset() {
    this.lastActivityTime = Date.now();
    this.dailyReplaceCount = 0;
    this.lastResetDate = new Date().toISOString().split('T')[0];
    this.saveState();
    console.log('✅ 重置活动监控状态');
  }
}

// 导出单例
export const activityMonitorService = new ActivityMonitorService();
