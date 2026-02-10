/**
 * 简易事件总线 - 用于组件间通信
 * 无需修改原有状态管理，完全解耦
 */

type EventCallback = (data: any) => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};

  // 监听事件
  on(eventName: string, callback: EventCallback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  // 触发事件
  emit(eventName: string, data?: any) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  }

  // 取消监听
  off(eventName: string, callback?: EventCallback) {
    if (!this.events[eventName]) return;
    
    if (callback) {
      // 移除特定回调
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    } else {
      // 移除所有回调
      delete this.events[eventName];
    }
  }

  // 清空所有事件
  clear() {
    this.events = {};
  }
}

export default new EventBus();

