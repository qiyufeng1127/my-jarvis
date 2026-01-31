import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, TaskType } from '@/types';
import { supabase, TABLES, isSupabaseConfigured, getCurrentUserId, ensureUserExists } from '@/lib/supabase';

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
    set({ isLoading: true, error: null });
    
    try {
      if (isSupabaseConfigured()) {
        // 从 Supabase 加载任务
        const userId = getCurrentUserId();
        console.log('📥 从 Supabase 加载任务，用户ID:', userId);
        
        const { data, error } = await supabase
          .from(TABLES.TASKS)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Supabase 加载失败:', error);
          throw error;
        }
        
        const tasks: Task[] = (data || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          description: row.description,
          taskType: row.task_type,
          priority: row.priority,
          durationMinutes: row.duration_minutes,
          scheduledStart: row.scheduled_start ? new Date(row.scheduled_start) : undefined,
          scheduledEnd: row.scheduled_end ? new Date(row.scheduled_end) : undefined,
          actualStart: row.actual_start ? new Date(row.actual_start) : undefined,
          actualEnd: row.actual_end ? new Date(row.actual_end) : undefined,
          status: row.status,
          growthDimensions: row.growth_dimensions || {},
          longTermGoals: row.long_term_goals || {},
          identityTags: row.identity_tags || [],
          enableProgressCheck: row.enable_progress_check || false,
          progressChecks: row.progress_checks || [],
          penaltyGold: row.penalty_gold || 0,
          goldEarned: row.gold_earned || 0,
          tags: row.tags || [],
          color: row.color,
          location: row.location,
          goldReward: row.gold_reward || 0,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));
        
        console.log('✅ 从 Supabase 加载了', tasks.length, '个任务');
        set({ tasks, isLoading: false });
      } else {
        // Supabase 未配置，使用本地存储
        console.log('⚠️ Supabase 未配置，使用本地存储');
        // 不需要手动加载，persist 中间件会自动处理
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('❌ 加载任务失败:', error);
      // 如果 Supabase 加载失败，回退到本地存储
      console.log('🔄 回退到本地存储');
      set({ error: '从云端加载失败，使用本地数据', isLoading: false });
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    
    try {
      const userId = getCurrentUserId();
      
      // 处理日期：如果是字符串就直接使用，如果是 Date 对象就转换
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
        // AI 智能助手添加的字段
        tags: taskData.tags || [],
        color: taskData.color,
        location: taskData.location,
        goldReward: taskData.goldReward || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('💾 保存任务到本地:', {
        title: newTask.title,
        tags: newTask.tags,
        color: newTask.color,
        location: newTask.location,
        goldReward: newTask.goldReward,
      });
      
      // 先添加到本地状态
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));
      
      // 尝试保存到 Supabase（如果已配置）
      if (isSupabaseConfigured()) {
        try {
          // 确保用户存在
          await ensureUserExists(userId);
          
          // 保存任务
          const { error } = await supabase.from(TABLES.TASKS).insert({
            id: newTask.id,
            user_id: newTask.userId,
            title: newTask.title,
            description: newTask.description,
            task_type: newTask.taskType,
            priority: newTask.priority,
            duration_minutes: newTask.durationMinutes,
            scheduled_start: scheduledStartStr,
            scheduled_end: scheduledEndStr,
            status: newTask.status,
            growth_dimensions: newTask.growthDimensions,
            long_term_goals: newTask.longTermGoals,
            identity_tags: newTask.identityTags,
            enable_progress_check: newTask.enableProgressCheck,
            progress_checks: newTask.progressChecks,
            penalty_gold: newTask.penaltyGold,
            gold_earned: newTask.goldEarned,
            // AI 智能助手字段
            tags: newTask.tags,
            color: newTask.color,
            location: newTask.location,
            gold_reward: newTask.goldReward,
          });
          
          if (error) {
            console.warn('⚠️ 保存到 Supabase 失败，但任务已保存到本地:', error);
          } else {
            console.log('✅ 任务已保存到 Supabase');
          }
        } catch (error) {
          console.warn('⚠️ Supabase 同步失败，但任务已保存到本地:', error);
        }
      }
      
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
      
      // 更新到 Supabase（如果已配置）
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from(TABLES.TASKS)
          .update({
            title: updatedTask.title,
            description: updatedTask.description,
            task_type: updatedTask.taskType,
            priority: updatedTask.priority,
            duration_minutes: updatedTask.durationMinutes,
            scheduled_start: updatedTask.scheduledStart?.toISOString(),
            scheduled_end: updatedTask.scheduledEnd?.toISOString(),
            actual_start: updatedTask.actualStart?.toISOString(),
            actual_end: updatedTask.actualEnd?.toISOString(),
            status: updatedTask.status,
            growth_dimensions: updatedTask.growthDimensions,
            long_term_goals: updatedTask.longTermGoals,
            identity_tags: updatedTask.identityTags,
            enable_progress_check: updatedTask.enableProgressCheck,
            progress_checks: updatedTask.progressChecks,
            penalty_gold: updatedTask.penaltyGold,
            gold_earned: updatedTask.goldEarned,
            updated_at: updatedTask.updatedAt.toISOString(),
          })
          .eq('id', id);
        
        if (error) throw error;
      }
      
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
      // 从 Supabase 删除（如果已配置）
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from(TABLES.TASKS)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
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
    }),
    {
      name: 'tasks-storage',
    }
  )
);

