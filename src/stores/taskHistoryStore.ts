// ============================================
// 任务历史记录 Store - 用于时长预估
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cloudSyncService } from '@/services/cloudSyncService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface TaskHistoryRecord {
  id: string;
  userId?: string;
  taskTitle: string;
  taskType: string;
  category: string;
  location: string;
  estimatedDuration: number; // 预估时长（分钟）
  actualDuration: number; // 实际时长（分钟）
  completedAt: Date;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskHistoryState {
  records: TaskHistoryRecord[];
  
  // Actions
  addRecord: (record: Omit<TaskHistoryRecord, 'id' | 'completedAt' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  getAverageDuration: (taskTitle: string) => number | null;
  getAverageDurationByType: (taskType: string) => number | null;
  getAverageDurationByCategory: (category: string) => number | null;
  getSimilarTasks: (taskTitle: string, limit?: number) => TaskHistoryRecord[];
  clearHistory: () => void;
  loadFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;
}

export const useTaskHistoryStore = create<TaskHistoryState>()(
  persist(
    (set, get) => ({
      records: [],
      
      // 添加历史记录
      addRecord: async (record) => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || 'local-user';
        
        const newRecord: TaskHistoryRecord = {
          ...record,
          id: crypto.randomUUID(),
          userId,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          records: [...state.records, newRecord],
        }));
        
        console.log('📊 任务历史已记录:', newRecord);
        
        // 同步到云端
        if (isSupabaseConfigured() && session) {
          cloudSyncService.addToQueue('taskHistoryStore', 'upsert', {
            id: newRecord.id,
            user_id: userId,
            task_title: newRecord.taskTitle,
            task_type: newRecord.taskType,
            category: newRecord.category,
            location: newRecord.location,
            estimated_duration: newRecord.estimatedDuration,
            actual_duration: newRecord.actualDuration,
            completed_at: newRecord.completedAt.toISOString(),
            tags: newRecord.tags,
            created_at: newRecord.createdAt?.toISOString(),
          });
        }
      },
      
      // 获取特定任务的平均时长
      getAverageDuration: (taskTitle) => {
        const { records } = get();
        const similarTasks = records.filter(r => 
          r.taskTitle.toLowerCase().includes(taskTitle.toLowerCase()) ||
          taskTitle.toLowerCase().includes(r.taskTitle.toLowerCase())
        );
        
        if (similarTasks.length === 0) return null;
        
        const totalDuration = similarTasks.reduce((sum, r) => sum + r.actualDuration, 0);
        return Math.round(totalDuration / similarTasks.length);
      },
      
      // 获取特定类型任务的平均时长
      getAverageDurationByType: (taskType) => {
        const { records } = get();
        const typeTasks = records.filter(r => r.taskType === taskType);
        
        if (typeTasks.length === 0) return null;
        
        const totalDuration = typeTasks.reduce((sum, r) => sum + r.actualDuration, 0);
        return Math.round(totalDuration / typeTasks.length);
      },
      
      // 获取特定分类任务的平均时长
      getAverageDurationByCategory: (category) => {
        const { records } = get();
        const categoryTasks = records.filter(r => r.category === category);
        
        if (categoryTasks.length === 0) return null;
        
        const totalDuration = categoryTasks.reduce((sum, r) => sum + r.actualDuration, 0);
        return Math.round(totalDuration / categoryTasks.length);
      },
      
      // 获取相似任务
      getSimilarTasks: (taskTitle, limit = 5) => {
        const { records } = get();
        
        // 计算相似度分数
        const scored = records.map(record => {
          let score = 0;
          const title1 = taskTitle.toLowerCase();
          const title2 = record.taskTitle.toLowerCase();
          
          // 完全匹配
          if (title1 === title2) score += 100;
          
          // 包含关系
          if (title1.includes(title2) || title2.includes(title1)) score += 50;
          
          // 关键词匹配
          const words1 = title1.split(/\s+/);
          const words2 = title2.split(/\s+/);
          const commonWords = words1.filter(w => words2.includes(w));
          score += commonWords.length * 10;
          
          return { record, score };
        });
        
        // 按分数排序并返回前N个
        return scored
          .filter(s => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(s => s.record);
      },
      
      // 清空历史记录
      clearHistory: () => {
        set({ records: [] });
      },
      
      // 从云端加载
      loadFromCloud: async () => {
        if (!isSupabaseConfigured()) {
          console.log('⚠️ Supabase 未配置，使用本地数据');
          return;
        }
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.log('⚠️ 未登录，使用本地数据');
            return;
          }
          
          const cloudData = await cloudSyncService.loadFromCloud<TaskHistoryRecord>(
            'taskHistoryStore',
            (row: any) => ({
              id: row.id,
              userId: row.user_id,
              taskTitle: row.task_title,
              taskType: row.task_type,
              category: row.category,
              location: row.location,
              estimatedDuration: row.estimated_duration,
              actualDuration: row.actual_duration,
              completedAt: new Date(row.completed_at),
              tags: row.tags || [],
              createdAt: row.created_at ? new Date(row.created_at) : undefined,
              updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
            })
          );
          
          if (cloudData.length > 0) {
            const localRecords = get().records;
            const merged = cloudSyncService.mergeData(localRecords, cloudData);
            set({ records: merged });
            console.log(`✅ 任务历史已从云端加载: ${merged.length}条`);
          }
        } catch (error) {
          console.error('❌ 加载任务历史失败:', error);
        }
      },
      
      // 同步到云端
      syncToCloud: async () => {
        if (!isSupabaseConfigured()) {
          return;
        }
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            return;
          }
          
          const records = get().records;
          for (const record of records) {
            cloudSyncService.addToQueue('taskHistoryStore', 'upsert', {
              id: record.id,
              user_id: session.user.id,
              task_title: record.taskTitle,
              task_type: record.taskType,
              category: record.category,
              location: record.location,
              estimated_duration: record.estimatedDuration,
              actual_duration: record.actualDuration,
              completed_at: record.completedAt.toISOString(),
              tags: record.tags,
              created_at: record.createdAt?.toISOString(),
            });
          }
        } catch (error) {
          console.error('❌ 同步任务历史失败:', error);
        }
      },
    }),
    {
      name: 'manifestos-task-history-storage',
      version: 1,
      partialize: (state) => ({
        records: state.records,
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // 恢复日期对象
            if (parsed?.state?.records) {
              parsed.state.records = parsed.state.records.map((r: any) => ({
                ...r,
                completedAt: new Date(r.completedAt),
              }));
            }
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取任务历史存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
            console.log('💾 任务历史已保存，共', value?.state?.records?.length || 0, '条记录');
          } catch (error) {
            console.error('❌ 保存任务历史失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除任务历史失败:', error);
          }
        },
      },
      merge: (persistedState: any, currentState: any) => {
        console.log('🔄 合并任务历史数据...');
        return {
          ...currentState,
          records: persistedState?.records || currentState.records,
        };
      },
    }
  )
);

