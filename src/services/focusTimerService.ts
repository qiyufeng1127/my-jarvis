import { useFocusStore } from '@/stores/focusStore';

class FocusTimerService {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalId) {
      console.log('⚠️ 专注计时器已在运行');
      return;
    }

    console.log('⏱️ 启动专注计时器服务');
    
    // 每秒更新一次
    this.intervalId = setInterval(() => {
      const focusStore = useFocusStore.getState();
      if (focusStore.isActive) {
        focusStore.tick();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 停止专注计时器服务');
    }
  }
}

export const focusTimerService = new FocusTimerService();

