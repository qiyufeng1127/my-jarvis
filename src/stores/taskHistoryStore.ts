// ============================================
// 任务历史记录 Store - 用于时长预估
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addRecord: (record: Omit<TaskHistoryRecord, 'id' | 'completedAt' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  getAverageDuration: (taskTitle: string) => number | null;
  getAverageDurationByType: (taskType: string) => number | null;
  getAverageDurationByCategory: (category: string) => number | null;
  getSimilarTasks: (taskTitle: string, limit?: number) => TaskHistoryRecord[];
  clearHistory: () => void;
}

export const useTaskHistoryStore = create<TaskHistoryState>()(
  persist(
    (set, get) => ({
      records: [],
      
      // 添加历史记录
      addRecord: (record) => {
        const userId = 'local-user';
        
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

