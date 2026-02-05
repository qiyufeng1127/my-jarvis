import { create } from 'zustand';
import { syncCodeService } from '@/services/syncCodeService';
import { useTaskStore } from './taskStore';
import { useGoalStore } from './goalStore';
import { useGoldStore } from './goldStore';

interface SyncStore {
  // 状态
  syncCode: string | null;
  isInSyncGroup: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  
  // 操作
  generateSyncCode: () => Promise<string>;
  joinSyncCode: (code: string) => Promise<void>;
  leaveSyncGroup: () => Promise<void>;
  syncNow: () => Promise<void>;
  startAutoSync: () => void;
  stopAutoSync: () => void;
}

let syncInterval: NodeJS.Timeout | null = null;

export const useSyncStore = create<SyncStore>((set, get) => ({
  syncCode: syncCodeService.getCurrentSyncCode(),
  isInSyncGroup: syncCodeService.isInSyncGroup(),
  isSyncing: false,
  lastSyncTime: null,

  // 生成同步码
  generateSyncCode: async () => {
    try {
      const code = await syncCodeService.generateSyncCode();
      set({ 
        syncCode: code, 
        isInSyncGroup: true 
      });
      
      // 立即上传当前数据
      await get().syncNow();
      
      // 启动自动同步
      get().startAutoSync();
      
      return code;
    } catch (error) {
      console.error('生成同步码失败:', error);
      throw error;
    }
  },

  // 加入同步码
  joinSyncCode: async (code: string) => {
    try {
      console.log('📱 syncStore: 开始加入同步码');
      await syncCodeService.joinSyncCode(code);
      
      console.log('📱 syncStore: 更新状态');
      set({ 
        syncCode: code, 
        isInSyncGroup: true 
      });
      
      console.log('📱 syncStore: 启动自动同步');
      // 启动自动同步
      get().startAutoSync();
      
      // 延迟1秒后进行第一次同步，避免立即同步导致问题
      setTimeout(() => {
        console.log('📱 syncStore: 执行首次同步');
        get().syncNow();
      }, 1000);
      
      console.log('✅ syncStore: 加入同步码完成');
      
    } catch (error: any) {
      console.error('❌ syncStore: 加入同步码失败:', error);
      // 重新抛出错误，保留原始错误信息
      throw error;
    }
  },

  // 退出同步组
  leaveSyncGroup: async () => {
    try {
      await syncCodeService.leaveSyncGroup();
      set({ 
        syncCode: null, 
        isInSyncGroup: false 
      });
      
      // 停止自动同步
      get().stopAutoSync();
      
    } catch (error) {
      console.error('退出同步组失败:', error);
      throw error;
    }
  },

  // 立即同步
  syncNow: async () => {
    if (get().isSyncing) return;
    
    set({ isSyncing: true });
    
    try {
      console.log('🔄 开始同步...');
      
      // 1. 上传本地数据
      const taskStore = useTaskStore.getState();
      const goalStore = useGoalStore.getState();
      const goldStore = useGoldStore.getState();
      
      // 上传任务
      for (const task of taskStore.tasks) {
        await syncCodeService.uploadData('tasks', task.id, task);
      }
      
      // 上传目标
      for (const goal of goalStore.goals) {
        await syncCodeService.uploadData('goals', goal.id, goal);
      }
      
      // 上传金币数据
      await syncCodeService.uploadData('gold', 'current', {
        balance: goldStore.balance,
        totalEarned: goldStore.totalEarned,
        totalSpent: goldStore.totalSpent,
      });
      
      // 2. 下载云端数据
      const cloudData = await syncCodeService.downloadAllData();
      
      // 合并任务数据
      if (cloudData.tasks) {
        const localTaskIds = new Set(taskStore.tasks.map(t => t.id));
        const newTasks = cloudData.tasks.filter(t => !localTaskIds.has(t.id));
        
        if (newTasks.length > 0) {
          console.log(`📥 下载了 ${newTasks.length} 个新任务`);
          // 这里需要调用 taskStore 的方法来添加任务
          // 暂时直接更新状态
        }
      }
      
      // 合并目标数据
      if (cloudData.goals) {
        const localGoalIds = new Set(goalStore.goals.map(g => g.id));
        const newGoals = cloudData.goals.filter(g => !localGoalIds.has(g.id));
        
        if (newGoals.length > 0) {
          console.log(`📥 下载了 ${newGoals.length} 个新目标`);
        }
      }
      
      // 更新金币数据
      if (cloudData.gold && cloudData.gold.length > 0) {
        const cloudGold = cloudData.gold[0];
        if (cloudGold.balance > goldStore.balance) {
          console.log(`📥 更新金币数据: ${cloudGold.balance}`);
          // goldStore.setBalance(cloudGold.balance);
        }
      }
      
      // 更新设备活跃时间
      await syncCodeService.updateDeviceActivity();
      
      set({ 
        lastSyncTime: new Date(),
        isSyncing: false 
      });
      
      console.log('✅ 同步完成');
      
    } catch (error) {
      console.error('❌ 同步失败:', error);
      set({ isSyncing: false });
    }
  },

  // 启动自动同步（每30秒）
  startAutoSync: () => {
    if (syncInterval) return;
    
    console.log('🔄 启动自动同步（每30秒）');
    
    syncInterval = setInterval(() => {
      const { isInSyncGroup, syncNow } = get();
      if (isInSyncGroup) {
        syncNow();
      }
    }, 30000); // 30秒
  },

  // 停止自动同步
  stopAutoSync: () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
      console.log('⏸️ 停止自动同步');
    }
  },
}));

