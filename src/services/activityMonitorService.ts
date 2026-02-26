/**
 * 活动监控服务
 * 监控用户是否在时间轴上添加任务，如果1小时无活动则触发紧急任务
 */

import { useEmergencyTaskStore } from '@/stores/emergencyTaskStore';
import { useDriveStore } from '@/stores/driveStore';

class ActivityMonitorService {
  private lastActivityTime: Date | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private inactivityThreshold = 60 * 60 * 1000; // 1小时（毫秒）
  private checkFrequency = 5 * 60 * 1000; // 每5分钟检查一次
  
  /**
   * 记录用户活动
   */
  recordActivity() {
    this.lastActivityTime = new Date();
    console.log('✅ 记录用户活动:', this.lastActivityTime.toLocaleTimeString());
  }
  
  /**
   * 检查是否需要触发紧急任务
   */
  private checkInactivity() {
    const emergencyTaskStore = useEmergencyTaskStore.getState();
    const driveStore = useDriveStore.getState();
    
    // 如果已经有紧急任务在进行中，不再触发
    if (emergencyTaskStore.currentTask) {
      console.log('⏳ 已有紧急任务进行中，跳过检查');
      return;
    }
    
    // 如果没有活动记录，记录当前时间作为初始活动
    if (!this.lastActivityTime) {
      this.lastActivityTime = new Date();
      console.log('🆕 初始化活动时间');
      return;
    }
    
    const now = new Date();
    const inactiveTime = now.getTime() - this.lastActivityTime.getTime();
    
    console.log(`🔍 检查活动状态: 已无活动 ${Math.floor(inactiveTime / 1000 / 60)} 分钟`);
    
    // 如果超过1小时无活动
    if (inactiveTime >= this.inactivityThreshold) {
      console.log('⚠️ 检测到1小时无活动，触发紧急任务');
      
      // 触发随机紧急任务
      const task = emergencyTaskStore.triggerRandomTask();
      
      if (task) {
        console.log('🚨 紧急任务已触发:', task.title);
        
        // 触发紧急任务事件
        window.dispatchEvent(new CustomEvent('emergencyTaskTriggered', {
          detail: { task }
        }));
        
        // 重置活动时间
        this.lastActivityTime = new Date();
      } else {
        console.log('⚠️ 没有可用的紧急任务');
      }
    }
  }
  
  /**
   * 启动监控
   */
  start() {
    if (this.checkInterval) {
      console.log('⚠️ 活动监控已在运行');
      return;
    }
    
    console.log('🔔 活动监控服务已启动');
    
    // 初始化活动时间
    this.lastActivityTime = new Date();
    
    // 定期检查
    this.checkInterval = setInterval(() => {
      this.checkInactivity();
    }, this.checkFrequency);
    
    // 立即执行一次检查
    this.checkInactivity();
  }
  
  /**
   * 停止监控
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 活动监控服务已停止');
    }
  }
  
  /**
   * 设置不活动阈值（分钟）
   */
  setInactivityThreshold(minutes: number) {
    this.inactivityThreshold = minutes * 60 * 1000;
    console.log(`⚙️ 设置不活动阈值: ${minutes} 分钟`);
  }
  
  /**
   * 获取距离上次活动的时间（分钟）
   */
  getInactiveMinutes(): number {
    if (!this.lastActivityTime) return 0;
    
    const now = new Date();
    const inactiveTime = now.getTime() - this.lastActivityTime.getTime();
    return Math.floor(inactiveTime / 1000 / 60);
  }
  
  /**
   * 获取距离触发紧急任务的剩余时间（分钟）
   */
  getRemainingMinutes(): number {
    const inactiveMinutes = this.getInactiveMinutes();
    const thresholdMinutes = this.inactivityThreshold / 1000 / 60;
    return Math.max(0, thresholdMinutes - inactiveMinutes);
  }
}

export const activityMonitorService = new ActivityMonitorService();

