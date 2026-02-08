import { create } from 'zustand';
import { DeviceIdentityService, type DeviceIdentity } from '@/services/deviceIdentityService';

interface DeviceState {
  identity: DeviceIdentity | null;
  isInitialized: boolean;
  
  // Actions
  initializeDevice: () => void;
  updateDeviceName: (name: string) => void;
  updateDeviceAvatar: (avatar: string) => void;
  clearAllData: () => void;
  
  // Getters
  getDeviceId: () => string | null;
  getDeviceName: () => string | null;
  getDeviceAvatar: () => string | null;
}

/**
 * 设备身份 Store
 * 
 * 管理设备唯一标识，确保数据持久化
 */
export const useDeviceStore = create<DeviceState>((set, get) => ({
  identity: null,
  isInitialized: false,

  // 初始化设备标识
  initializeDevice: () => {
    try {
      const identity = DeviceIdentityService.getOrCreateDeviceIdentity();
      set({ identity, isInitialized: true });
      console.log('✅ 设备标识初始化完成:', identity.deviceId);
    } catch (error) {
      console.error('❌ 设备标识初始化失败:', error);
      set({ isInitialized: true });
    }
  },

  // 更新设备名称
  updateDeviceName: (name: string) => {
    DeviceIdentityService.updateDeviceName(name);
    const identity = DeviceIdentityService.getCurrentIdentity();
    if (identity) {
      set({ identity });
    }
  },

  // 更新设备头像
  updateDeviceAvatar: (avatar: string) => {
    DeviceIdentityService.updateDeviceAvatar(avatar);
    const identity = DeviceIdentityService.getCurrentIdentity();
    if (identity) {
      set({ identity });
    }
  },

  // 清除所有数据（包括设备标识）
  clearAllData: () => {
    if (confirm('⚠️ 确认清除所有本地数据？\n\n此操作将删除：\n• 设备标识\n• 所有任务和时间轴数据\n• 收集箱内容\n• 标签配置\n• 系统设置\n• AI Key\n\n此操作不可恢复！')) {
      try {
        // 清除设备标识
        DeviceIdentityService.clearDeviceIdentity();
        
        // 清除所有 localStorage 数据
        const keysToKeep: string[] = []; // 可以保留某些关键配置
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
        
        // 重置状态
        set({ identity: null, isInitialized: false });
        
        alert('✅ 所有本地数据已清除！\n\n页面将在3秒后刷新...');
        
        // 3秒后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
        console.log('🗑️ 所有本地数据已清除');
      } catch (error) {
        console.error('❌ 清除数据失败:', error);
        alert('❌ 清除数据失败，请重试');
      }
    }
  },

  // 获取设备ID
  getDeviceId: () => {
    return get().identity?.deviceId || null;
  },

  // 获取设备名称
  getDeviceName: () => {
    return get().identity?.deviceName || null;
  },

  // 获取设备头像
  getDeviceAvatar: () => {
    return get().identity?.avatar || null;
  },
}));

// 自动初始化设备标识（应用启动时）
if (typeof window !== 'undefined') {
  // 延迟初始化，确保 DOM 已加载
  setTimeout(() => {
    useDeviceStore.getState().initializeDevice();
  }, 0);
}






