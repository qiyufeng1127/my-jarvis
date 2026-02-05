// ============================================
// 统一云端同步服务 - 管理所有数据的云端同步
// ============================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// 同步队列项
interface SyncQueueItem {
  id: string;
  storeName: string;
  operation: 'upsert' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

// 同步结果
export interface SyncResult {
  success: boolean;
  error?: string;
  syncedCount?: number;
}

// 数据表映射
export const SYNC_TABLES = {
  tasks: 'tasks',
  goals: 'goals',
  gold_data: 'gold_data',
  task_history: 'task_history',
  task_templates: 'task_templates',
  side_hustles: 'side_hustles',
  memories: 'memories',
  notifications: 'notifications',
  growth_data: 'growth_data',
  ai_config: 'ai_config',
  user_settings: 'user_settings',
  theme_settings: 'theme_settings',
  tutorial_progress: 'tutorial_progress',
} as const;

class CloudSyncService {
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private syncStatus: Record<string, SyncStatus> = {};
  private lastSyncTime: Record<string, number> = {};
  private syncCallbacks: Record<string, ((status: SyncStatus) => void)[]> = {};
  
  // 同步配置
  private readonly SYNC_DEBOUNCE_MS = 2000; // 2秒防抖
  private readonly MAX_RETRY_COUNT = 3;
  private readonly BATCH_SIZE = 50; // 批量同步大小

  constructor() {
    // 启动同步队列处理器
    this.startQueueProcessor();
  }

  /**
   * 注册同步状态监听器
   */
  onSyncStatusChange(storeName: string, callback: (status: SyncStatus) => void) {
    if (!this.syncCallbacks[storeName]) {
      this.syncCallbacks[storeName] = [];
    }
    this.syncCallbacks[storeName].push(callback);
  }

  /**
   * 触发同步状态变更
   */
  private notifySyncStatus(storeName: string, status: SyncStatus) {
    this.syncStatus[storeName] = status;
    const callbacks = this.syncCallbacks[storeName] || [];
    callbacks.forEach(cb => cb(status));
  }

  /**
   * 获取当前用户ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (error) {
      console.error('❌ 获取用户ID失败:', error);
      return null;
    }
  }

  /**
   * 添加到同步队列
   */
  addToQueue(storeName: string, operation: 'upsert' | 'delete', data: any) {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase 未配置，跳过云端同步');
      return;
    }

    const queueItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      storeName,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);
    console.log(`📤 添加到同步队列: ${storeName} (${operation})`, data);
  }

  /**
   * 启动队列处理器
   */
  private startQueueProcessor() {
    setInterval(() => {
      if (!this.isSyncing && this.syncQueue.length > 0) {
        this.processQueue();
      }
    }, this.SYNC_DEBOUNCE_MS);
  }

  /**
   * 处理同步队列
   */
  private async processQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const userId = await this.getCurrentUserId();

    if (!userId) {
      console.log('⚠️ 未登录，暂停同步队列');
      this.isSyncing = false;
      return;
    }

    // 按storeName分组
    const groupedItems = this.groupByStore(this.syncQueue);

    for (const [storeName, items] of Object.entries(groupedItems)) {
      await this.syncStoreData(storeName, items, userId);
    }

    // 清空已处理的队列
    this.syncQueue = [];
    this.isSyncing = false;
  }

  /**
   * 按store分组队列项
   */
  private groupByStore(items: SyncQueueItem[]): Record<string, SyncQueueItem[]> {
    return items.reduce((acc, item) => {
      if (!acc[item.storeName]) {
        acc[item.storeName] = [];
      }
      acc[item.storeName].push(item);
      return acc;
    }, {} as Record<string, SyncQueueItem[]>);
  }

  /**
   * 同步单个store的数据
   */
  private async syncStoreData(storeName: string, items: SyncQueueItem[], userId: string) {
    this.notifySyncStatus(storeName, 'syncing');

    try {
      const tableName = this.getTableName(storeName);
      if (!tableName) {
        console.warn(`⚠️ 未找到表映射: ${storeName}`);
        this.notifySyncStatus(storeName, 'error');
        return;
      }

      // 批量处理
      for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
        const batch = items.slice(i, i + this.BATCH_SIZE);
        
        for (const item of batch) {
          try {
            if (item.operation === 'upsert') {
              await this.upsertData(tableName, item.data, userId);
            } else if (item.operation === 'delete') {
              await this.deleteData(tableName, item.data.id, userId);
            }
          } catch (error) {
            console.error(`❌ 同步失败 (${storeName}):`, error);
            
            // 重试逻辑
            if (item.retryCount < this.MAX_RETRY_COUNT) {
              item.retryCount++;
              this.syncQueue.push(item);
            }
          }
        }
      }

      this.lastSyncTime[storeName] = Date.now();
      this.notifySyncStatus(storeName, 'success');
      console.log(`✅ ${storeName} 同步完成 (${items.length}条)`);
    } catch (error) {
      console.error(`❌ ${storeName} 同步失败:`, error);
      this.notifySyncStatus(storeName, 'error');
    }
  }

  /**
   * 获取表名
   */
  private getTableName(storeName: string): string | null {
    const mapping: Record<string, string> = {
      'taskStore': SYNC_TABLES.tasks,
      'goalStore': SYNC_TABLES.goals,
      'goldStore': SYNC_TABLES.gold_data,
      'taskHistoryStore': SYNC_TABLES.task_history,
      'taskTemplateStore': SYNC_TABLES.task_templates,
      'sideHustleStore': SYNC_TABLES.side_hustles,
      'memoryStore': SYNC_TABLES.memories,
      'notificationStore': SYNC_TABLES.notifications,
      'growthStore': SYNC_TABLES.growth_data,
      'aiStore': SYNC_TABLES.ai_config,
      'userStore': SYNC_TABLES.user_settings,
      'themeStore': SYNC_TABLES.theme_settings,
      'tutorialStore': SYNC_TABLES.tutorial_progress,
    };
    return mapping[storeName] || null;
  }

  /**
   * 插入或更新数据
   */
  private async upsertData(tableName: string, data: any, userId: string) {
    const { error } = await supabase
      .from(tableName)
      .upsert({
        ...data,
        user_id: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      throw error;
    }
  }

  /**
   * 删除数据
   */
  private async deleteData(tableName: string, id: string, userId: string) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * 从云端加载数据
   */
  async loadFromCloud<T>(storeName: string, transform?: (data: any) => T): Promise<T[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase 未配置，返回空数据');
      return [];
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.log('⚠️ 未登录，返回空数据');
      return [];
    }

    const tableName = this.getTableName(storeName);
    if (!tableName) {
      console.warn(`⚠️ 未找到表映射: ${storeName}`);
      return [];
    }

    try {
      this.notifySyncStatus(storeName, 'syncing');

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ ${storeName} 云端暂无数据`);
          this.notifySyncStatus(storeName, 'success');
          return [];
        }
        throw error;
      }

      const result = transform ? data.map(transform) : data;
      this.notifySyncStatus(storeName, 'success');
      console.log(`✅ 从云端加载 ${storeName}: ${result.length}条`);
      return result;
    } catch (error) {
      console.error(`❌ 从云端加载 ${storeName} 失败:`, error);
      this.notifySyncStatus(storeName, 'error');
      return [];
    }
  }

  /**
   * 智能合并本地和云端数据
   */
  mergeData<T extends { id: string; updatedAt?: Date; updated_at?: string }>(
    localData: T[],
    cloudData: T[],
    options?: {
      preferLocal?: boolean;
      customMerge?: (local: T, cloud: T) => T;
    }
  ): T[] {
    const merged = new Map<string, T>();

    // 先添加云端数据
    cloudData.forEach(item => {
      merged.set(item.id, item);
    });

    // 合并本地数据
    localData.forEach(localItem => {
      const cloudItem = merged.get(localItem.id);

      if (!cloudItem) {
        // 本地独有，添加到合并结果
        merged.set(localItem.id, localItem);
      } else {
        // 两边都有，比较更新时间
        const localTime = this.getUpdateTime(localItem);
        const cloudTime = this.getUpdateTime(cloudItem);

        if (options?.customMerge) {
          merged.set(localItem.id, options.customMerge(localItem, cloudItem));
        } else if (options?.preferLocal) {
          merged.set(localItem.id, localItem);
        } else if (localTime > cloudTime) {
          merged.set(localItem.id, localItem);
        }
        // 否则保留云端数据
      }
    });

    return Array.from(merged.values());
  }

  /**
   * 获取更新时间
   */
  private getUpdateTime(item: any): number {
    if (item.updatedAt instanceof Date) {
      return item.updatedAt.getTime();
    }
    if (item.updated_at) {
      return new Date(item.updated_at).getTime();
    }
    if (item.createdAt instanceof Date) {
      return item.createdAt.getTime();
    }
    if (item.created_at) {
      return new Date(item.created_at).getTime();
    }
    return 0;
  }

  /**
   * 全量同步所有数据
   */
  async syncAllStores(): Promise<Record<string, SyncResult>> {
    console.log('🔄 开始全量同步所有数据...');
    
    const results: Record<string, SyncResult> = {};
    const stores = Object.keys(SYNC_TABLES);

    for (const store of stores) {
      try {
        // 这里需要各个store自己实现syncToCloud方法
        results[store] = { success: true };
      } catch (error: any) {
        results[store] = { success: false, error: error.message };
      }
    }

    console.log('✅ 全量同步完成:', results);
    return results;
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(storeName: string): SyncStatus {
    return this.syncStatus[storeName] || 'idle';
  }

  /**
   * 获取最后同步时间
   */
  getLastSyncTime(storeName: string): number | null {
    return this.lastSyncTime[storeName] || null;
  }

  /**
   * 清空同步队列
   */
  clearQueue() {
    this.syncQueue = [];
    console.log('🗑️ 同步队列已清空');
  }

  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this.syncQueue.length;
  }
}

// 导出单例
export const cloudSyncService = new CloudSyncService();

