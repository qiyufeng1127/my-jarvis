import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 紧急任务频率类型
export type TaskFrequency = 'daily' | 'every-2-days' | 'weekly' | 'custom';

// 紧急任务定义
export interface EmergencyTask {
  id: string;
  title: string;
  description?: string;
  frequency: TaskFrequency;
  customDays?: number; // 自定义天数（当frequency为custom时使用）
  lastCompletedDate?: string; // 最后完成日期（YYYY-MM-DD）
  goldReward: number; // 完成奖励
  goldPenalty: number; // 未完成惩罚
  keywords?: string[]; // 图片验证关键词
  enabled: boolean; // 是否启用
  createdAt: Date;
}

// 紧急任务记录
export interface EmergencyTaskRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  triggeredAt: Date;
  completedAt?: Date;
  skipped: boolean; // 是否被替换
  goldChange: number; // 金币变化（正数为奖励，负数为惩罚）
  status: 'pending' | 'completed' | 'failed' | 'skipped';
}

interface EmergencyTaskState {
  // 任务库
  tasks: EmergencyTask[];
  
  // 当前激活的紧急任务
  currentTask: EmergencyTask | null;
  currentTaskTriggeredAt: Date | null;
  
  // 历史记录
  records: EmergencyTaskRecord[];
  
  // 统计
  totalCompleted: number;
  totalFailed: number;
  totalSkipped: number;
  
  // Actions - 任务管理
  addTask: (task: Omit<EmergencyTask, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<EmergencyTask>) => void;
  deleteTask: (id: string) => void;
  toggleTaskEnabled: (id: string) => void;
  
  // Actions - 任务触发
  getAvailableTasks: () => EmergencyTask[];
  triggerRandomTask: () => EmergencyTask | null;
  replaceCurrentTask: () => EmergencyTask | null;
  
  // Actions - 任务完成
  completeCurrentTask: () => void;
  failCurrentTask: () => void;
  skipCurrentTask: () => void;
  
  // Actions - 查询
  getTaskHistory: (days?: number) => EmergencyTaskRecord[];
  canTaskBeTriggered: (task: EmergencyTask) => boolean;
}

export const useEmergencyTaskStore = create<EmergencyTaskState>()(
  persist(
    (set, get) => ({
      // 初始状态
      tasks: [],
      currentTask: null,
      currentTaskTriggeredAt: null,
      records: [],
      totalCompleted: 0,
      totalFailed: 0,
      totalSkipped: 0,
      
      // 添加任务
      addTask: (task) => {
        const newTask: EmergencyTask = {
          ...task,
          id: `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
        
        console.log('✅ 添加紧急任务:', newTask.title);
      },
      
      // 更新任务
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
        
        console.log('✅ 更新紧急任务:', id);
      },
      
      // 删除任务
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
        
        console.log('✅ 删除紧急任务:', id);
      },
      
      // 切换任务启用状态
      toggleTaskEnabled: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, enabled: !task.enabled } : task
          ),
        }));
      },
      
      // 检查任务是否可以被触发
      canTaskBeTriggered: (task) => {
        if (!task.enabled) return false;
        if (!task.lastCompletedDate) return true;
        
        const today = new Date().toISOString().split('T')[0];
        const lastCompleted = new Date(task.lastCompletedDate);
        const daysSinceCompleted = Math.floor(
          (new Date(today).getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        switch (task.frequency) {
          case 'daily':
            return daysSinceCompleted >= 1;
          case 'every-2-days':
            return daysSinceCompleted >= 2;
          case 'weekly':
            return daysSinceCompleted >= 7;
          case 'custom':
            return daysSinceCompleted >= (task.customDays || 1);
          default:
            return true;
        }
      },
      
      // 获取可用的任务列表
      getAvailableTasks: () => {
        const state = get();
        return state.tasks.filter((task) => state.canTaskBeTriggered(task));
      },
      
      // 触发随机任务
      triggerRandomTask: () => {
        const availableTasks = get().getAvailableTasks();
        
        if (availableTasks.length === 0) {
          console.log('⚠️ 没有可用的紧急任务');
          return null;
        }
        
        // 随机选择一个任务
        const randomIndex = Math.floor(Math.random() * availableTasks.length);
        const selectedTask = availableTasks[randomIndex];
        
        set({
          currentTask: selectedTask,
          currentTaskTriggeredAt: new Date(),
        });
        
        console.log('🚨 触发紧急任务:', selectedTask.title);
        return selectedTask;
      },
      
      // 替换当前任务
      replaceCurrentTask: () => {
        const state = get();
        
        if (!state.currentTask) {
          console.log('⚠️ 没有当前任务可替换');
          return null;
        }
        
        // 记录当前任务被跳过
        if (state.currentTask) {
          const record: EmergencyTaskRecord = {
            id: `record-${Date.now()}`,
            taskId: state.currentTask.id,
            taskTitle: state.currentTask.title,
            triggeredAt: state.currentTaskTriggeredAt || new Date(),
            skipped: true,
            goldChange: 0,
            status: 'skipped',
          };
          
          set((state) => ({
            records: [record, ...state.records].slice(0, 100),
            totalSkipped: state.totalSkipped + 1,
          }));
        }
        
        // 获取可用任务（排除当前任务）
        const availableTasks = get().getAvailableTasks().filter(
          (task) => task.id !== state.currentTask?.id
        );
        
        if (availableTasks.length === 0) {
          console.log('⚠️ 没有其他可用任务');
          return state.currentTask;
        }
        
        // 随机选择新任务
        const randomIndex = Math.floor(Math.random() * availableTasks.length);
        const newTask = availableTasks[randomIndex];
        
        set({
          currentTask: newTask,
          currentTaskTriggeredAt: new Date(),
        });
        
        console.log('🔄 替换紧急任务:', newTask.title);
        return newTask;
      },
      
      // 完成当前任务
      completeCurrentTask: () => {
        const state = get();
        
        if (!state.currentTask) {
          console.log('⚠️ 没有当前任务');
          return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        // 更新任务的最后完成日期
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === state.currentTask?.id
              ? { ...task, lastCompletedDate: today }
              : task
          ),
        }));
        
        // 记录完成
        const record: EmergencyTaskRecord = {
          id: `record-${Date.now()}`,
          taskId: state.currentTask.id,
          taskTitle: state.currentTask.title,
          triggeredAt: state.currentTaskTriggeredAt || new Date(),
          completedAt: new Date(),
          skipped: false,
          goldChange: state.currentTask.goldReward,
          status: 'completed',
        };
        
        // 奖励金币
        const { useGoldStore } = require('@/stores/goldStore');
        useGoldStore.getState().addGold(
          state.currentTask.goldReward,
          `紧急任务: ${state.currentTask.title}`
        );
        
        set((state) => ({
          records: [record, ...state.records].slice(0, 100),
          totalCompleted: state.totalCompleted + 1,
          currentTask: null,
          currentTaskTriggeredAt: null,
        }));
        
        console.log('✅ 完成紧急任务，获得金币:', state.currentTask.goldReward);
      },
      
      // 任务失败
      failCurrentTask: () => {
        const state = get();
        
        if (!state.currentTask) {
          console.log('⚠️ 没有当前任务');
          return;
        }
        
        // 记录失败
        const record: EmergencyTaskRecord = {
          id: `record-${Date.now()}`,
          taskId: state.currentTask.id,
          taskTitle: state.currentTask.title,
          triggeredAt: state.currentTaskTriggeredAt || new Date(),
          completedAt: new Date(),
          skipped: false,
          goldChange: -state.currentTask.goldPenalty,
          status: 'failed',
        };
        
        // 扣除金币
        const { useGoldStore } = require('@/stores/goldStore');
        useGoldStore.getState().penaltyGold(
          state.currentTask.goldPenalty,
          `紧急任务失败: ${state.currentTask.title}`
        );
        
        set((state) => ({
          records: [record, ...state.records].slice(0, 100),
          totalFailed: state.totalFailed + 1,
          currentTask: null,
          currentTaskTriggeredAt: null,
        }));
        
        console.log('❌ 紧急任务失败，扣除金币:', state.currentTask.goldPenalty);
      },
      
      // 跳过当前任务
      skipCurrentTask: () => {
        const state = get();
        
        if (!state.currentTask) return;
        
        const record: EmergencyTaskRecord = {
          id: `record-${Date.now()}`,
          taskId: state.currentTask.id,
          taskTitle: state.currentTask.title,
          triggeredAt: state.currentTaskTriggeredAt || new Date(),
          skipped: true,
          goldChange: 0,
          status: 'skipped',
        };
        
        set((state) => ({
          records: [record, ...state.records].slice(0, 100),
          totalSkipped: state.totalSkipped + 1,
          currentTask: null,
          currentTaskTriggeredAt: null,
        }));
      },
      
      // 获取任务历史
      getTaskHistory: (days = 7) => {
        const state = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return state.records.filter(
          (record) => new Date(record.triggeredAt) >= cutoffDate
        );
      },
    }),
    {
      name: 'manifestos-emergency-task-storage',
      version: 1,
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            
            // 恢复日期对象
            if (parsed?.state) {
              if (parsed.state.tasks) {
                parsed.state.tasks = parsed.state.tasks.map((task: any) => ({
                  ...task,
                  createdAt: new Date(task.createdAt),
                }));
              }
              if (parsed.state.currentTaskTriggeredAt) {
                parsed.state.currentTaskTriggeredAt = new Date(parsed.state.currentTaskTriggeredAt);
              }
              if (parsed.state.records) {
                parsed.state.records = parsed.state.records.map((record: any) => ({
                  ...record,
                  triggeredAt: new Date(record.triggeredAt),
                  completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
                }));
              }
            }
            
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取紧急任务存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('❌ 保存紧急任务存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除紧急任务存储失败:', error);
          }
        },
      },
    }
  )
);

