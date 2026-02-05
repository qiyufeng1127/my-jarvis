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
        // 获取当前登录用户
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('⚠️ 未登录，使用本地数据');
          set({ isLoading: false });
          return;
        }
        
        const userId = session.user.id;
        console.log('📥 从 Supabase 加载任务，用户ID:', userId);
        
        // 获取本地任务（用于合并）
        const localTasks = get().tasks;
        console.log('📦 本地任务数量:', localTasks.length);
        
        const { data, error } = await supabase
          .from(TABLES.TASKS)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Supabase 加载失败:', error);
          throw error;
        }
        
        const cloudTasks: Task[] = (data || []).map((row: any) => ({
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
        
        console.log('☁️ 从 Supabase 加载了', cloudTasks.length, '个任务');
        
        // 合并本地和云端任务（去重，优先使用云端数据）
        const cloudTaskIds = new Set(cloudTasks.map(t => t.id));
        const localOnlyTasks = localTasks.filter(t => 
          !cloudTaskIds.has(t.id) && t.userId !== 'local-user'
        );
        
        // 将本地独有的任务上传到云端
        if (localOnlyTasks.length > 0) {
          console.log('📤 上传', localOnlyTasks.length, '个本地任务到云端');
          for (const task of localOnlyTasks) {
            try {
              await supabase.from(TABLES.TASKS).insert({
                id: task.id,
                user_id: userId,
                title: task.title,
                description: task.description,
                task_type: task.taskType,
                priority: task.priority,
                duration_minutes: task.durationMinutes,
                scheduled_start: task.scheduledStart?.toISOString(),
                scheduled_end: task.scheduledEnd?.toISOString(),
                actual_start: task.actualStart?.toISOString(),
                actual_end: task.actualEnd?.toISOString(),
                status: task.status,
                growth_dimensions: task.growthDimensions,
                long_term_goals: task.longTermGoals,
                identity_tags: task.identityTags,
                enable_progress_check: task.enableProgressCheck,
                progress_checks: task.progressChecks,
                penalty_gold: task.penaltyGold,
                gold_earned: task.goldEarned,
                tags: task.tags,
                color: task.color,
                location: task.location,
                gold_reward: task.goldReward,
              });
            } catch (uploadError) {
              console.warn('⚠️ 上传任务失败:', task.title, uploadError);
            }
          }
        }
        
        // 合并所有任务
        const mergedTasks = [...cloudTasks, ...localOnlyTasks];
        console.log('✅ 合并后共', mergedTasks.length, '个任务');
        set({ tasks: mergedTasks, isLoading: false });
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
      // 获取当前登录用户（如果未登录，使用本地ID）
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'local-user';
      
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
        userId: newTask.userId,
      });
      
      // 先添加到本地状态
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));
      
      // 异步保存到 Supabase（仅在已登录且配置了 Supabase 时）
      if (isSupabaseConfigured() && session) {
        // 在后台异步执行，不等待结果
        (async () => {
          try {
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
              tags: newTask.tags,
              color: newTask.color,
              location: newTask.location,
              gold_reward: newTask.goldReward,
            });
            
            if (error) {
              console.warn('⚠️ 云端保存失败:', error.message);
            } else {
              console.log('✅ 任务已同步到云端');
            }
          } catch (error: any) {
            console.warn('⚠️ 云端同步异常:', error?.message || error);
          }
        })();
      } else {
        console.log('💾 任务仅保存到本地存储（未登录或未配置云端）');
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
      
      // 先更新本地状态
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
      
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
        
        if (error) {
          console.warn('⚠️ 任务更新云端同步失败:', error);
        } else {
          console.log('✅ 任务更新已同步到云端');
        }
      }
    } catch (error) {
      set({ error: '更新任务失败' });
      console.error('更新任务失败:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      // 先从本地删除
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
      
      // 从 Supabase 删除（如果已配置）
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from(TABLES.TASKS)
          .delete()
          .eq('id', id);
        
        if (error) {
          console.warn('⚠️ 任务删除云端同步失败:', error);
        } else {
          console.log('✅ 任务删除已同步到云端');
        }
      }
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

