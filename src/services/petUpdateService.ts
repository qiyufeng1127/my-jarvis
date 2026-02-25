import { usePetStore } from '@/stores/petStore';

class PetUpdateService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 每5分钟更新一次

  start() {
    if (this.intervalId) {
      console.log('⚠️ 宠物更新服务已在运行');
      return;
    }

    console.log('🐾 启动宠物状态更新服务');
    
    // 立即执行一次
    this.updatePetStatus();
    
    // 定时更新
    this.intervalId = setInterval(() => {
      this.updatePetStatus();
    }, this.UPDATE_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 停止宠物状态更新服务');
    }
  }

  private updatePetStatus() {
    const petStore = usePetStore.getState();
    petStore.updatePetStatus();
  }
}

export const petUpdateService = new PetUpdateService();

