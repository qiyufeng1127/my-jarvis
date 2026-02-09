import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, TaskType } from '@/types';
import { taskMonitorService } from '@/services/taskMonitorService';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  selectTask: (task: Task | null) => void;
  
  // Filters
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByType: (type: TaskType) => Task[];
  getTasksByDate: (date: Date) => Task[];
  getTodayTasks: () => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,

  loadTasks: async () => {
    // 纯本地模式，不需要加载
    // persist 中间件会自动从 localStorage 加载
    console.log('📦 使用本地存储的任务');
  },

  createTask: async (taskData) => {
    try {
      // 纯本地模式，使用本地ID
      const userId = 'local-user';
      
      // 处理日期
      const scheduledStartStr = typeof taskData.scheduledStart === 'string' 
        ? taskData.scheduledStart 
        : taskData.scheduledStart instanceof Date 
        ? taskData.scheduledStart.toISOString() 
        : undefined;
      
      const scheduledEndStr = typeof taskData.scheduledEnd === 'string' 
        ? taskData.scheduledEnd 
        : taskData.scheduledEnd instanceof Date 
        ? taskData.scheduledEnd.toISOString() 
        : undefined;
      
      const newTask: Task = {
        id: crypto.randomUUID(),
        userId,
        title: taskData.title || '',
        description: taskData.description,
        taskType: taskData.taskType || 'work',
        priority: taskData.priority || 2,
        durationMinutes: taskData.durationMinutes || 30,
        scheduledStart: scheduledStartStr ? new Date(scheduledStartStr) : undefined,
        scheduledEnd: scheduledEndStr ? new Date(scheduledEndStr) : undefined,
        growthDimensions: taskData.growthDimensions || {},
        longTermGoals: taskData.longTermGoals || {},
        identityTags: taskData.identityTags || [],
        enableProgressCheck: taskData.enableProgressCheck || false,
        progressChecks: [],
        penaltyGold: 0,
        status: taskData.status || 'pending',
        goldEarned: 0,
        tags: taskData.tags || [],
        color: taskData.color,
        location: taskData.location,
        goldReward: taskData.goldReward || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('💾 保存任务到本地:', newTask.title);
      
      // 添加到本地状态
      set((state) => ({
        tasks: [...state.tasks, newTask],
      }));
      
      // 开始监控任务
      if (newTask.scheduledStart && newTask.scheduledEnd) {
        taskMonitorService.startMonitoring(newTask);
      }
      
      return newTask;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const updatedTask = {
        ...get().tasks.find((t) => t.id === id),
        ...updates,
        updatedAt: new Date(),
      } as Task;
      
      // 更新本地状态
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
      
      // 重新监控任务（如果时间有变化）
      if (updatedTask.scheduledStart && updatedTask.scheduledEnd) {
        taskMonitorService.startMonitoring(updatedTask);
      }
      
      console.log('✅ 任务已更新:', id);
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      // 停止监控
      taskMonitorService.stopMonitoring(id);
      
      // 从本地删除
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
      
      console.log('✅ 任务已删除:', id);
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  },

  selectTask: (task) => {
    set({ selectedTask: task });
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter((t) => t.status === status);
  },

  getTasksByType: (type) => {
    return get().tasks.filter((t) => t.taskType === type);
  },

  getTasksByDate: (date) => {
    return get().tasks.filter((t) => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  },

  getTodayTasks: () => {
    return get().getTasksByDate(new Date());
  },
    }),
    {
      name: 'manifestos-tasks-storage', // 使用唯一的存储 key
      version: 1, // 添加版本号，防止数据格式冲突
      partialize: (state) => ({ 
        tasks: state.tasks, // 只持久化 tasks，不持久化临时状态
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // 恢复日期对象
            if (parsed?.state?.tasks) {
              parsed.state.tasks = parsed.state.tasks.map((task: any) => ({
                ...task,
                scheduledStart: task.scheduledStart ? new Date(task.scheduledStart) : undefined,
                scheduledEnd: task.scheduledEnd ? new Date(task.scheduledEnd) : undefined,
                actualStart: task.actualStart ? new Date(task.actualStart) : undefined,
                actualEnd: task.actualEnd ? new Date(task.actualEnd) : undefined,
                createdAt: new Date(task.createdAt),
                updatedAt: new Date(task.updatedAt),
              }));
            }
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取任务存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
            console.log('💾 任务已保存到本地存储，共', value?.state?.tasks?.length || 0, '个任务');
          } catch (error) {
            console.error('❌ 保存任务存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除任务存储失败:', error);
          }
        },
      },
      // 合并策略：保留本地数据，不被云端覆盖
      merge: (persistedState: any, currentState: any) => {
        console.log('🔄 合并任务数据...');
        return {
          ...currentState,
          tasks: persistedState?.tasks || currentState.tasks,
        };
      },
    }
  )
);

