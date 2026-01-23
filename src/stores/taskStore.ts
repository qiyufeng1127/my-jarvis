import { create } from 'zustand';
import type { Task, TaskStatus, TaskType } from '@/types';

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

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // TODO: 从 Supabase 加载任务
      const tasks: Task[] = [];
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: '加载任务失败', isLoading: false });
      console.error('加载任务失败:', error);
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        userId: '', // TODO: 从 userStore 获取
        title: taskData.title || '',
        description: taskData.description,
        taskType: taskData.taskType || 'work',
        priority: taskData.priority || 2,
        durationMinutes: taskData.durationMinutes || 30,
        scheduledStart: taskData.scheduledStart,
        scheduledEnd: taskData.scheduledEnd,
        growthDimensions: taskData.growthDimensions || {},
        longTermGoals: taskData.longTermGoals || {},
        identityTags: taskData.identityTags || [],
        enableProgressCheck: taskData.enableProgressCheck || false,
        progressChecks: [],
        penaltyGold: 0,
        status: 'pending',
        goldEarned: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // TODO: 保存到 Supabase
      
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));
      
      return newTask;
    } catch (error) {
      set({ error: '创建任务失败', isLoading: false });
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
      
      // TODO: 更新到 Supabase
      
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
    } catch (error) {
      set({ error: '更新任务失败' });
      console.error('更新任务失败:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      // TODO: 从 Supabase 删除
      
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({ error: '删除任务失败' });
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
}));

