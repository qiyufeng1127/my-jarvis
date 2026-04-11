import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, TaskType } from '@/types';
import { backgroundTaskScheduler } from '@/services/backgroundTaskScheduler';

const hasTaskVerification = (task: Partial<Task>) => Boolean(
  task.verificationEnabled || task.verificationStart || task.verificationComplete
);

const syncTaskSchedule = (task: Task) => {
  backgroundTaskScheduler.unscheduleTask(task.id);

  if (!task.scheduledStart || !task.scheduledEnd) {
    return;
  }

  backgroundTaskScheduler.scheduleTask({
    taskId: task.id,
    taskTitle: task.title,
    scheduledStart: new Date(task.scheduledStart).toISOString(),
    scheduledEnd: new Date(task.scheduledEnd).toISOString(),
    goldReward: task.goldReward || 0,
    hasVerification: hasTaskVerification(task),
    startKeywords: task.startKeywords,
    completeKeywords: task.completeKeywords,
  });
};

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
  
  // 验证相关
  startVerificationCountdown: (taskId: string) => void;
  completeStartVerification: (taskId: string) => void;
  completeTask: (taskId: string) => Promise<void>;
  
  // 效率追踪
  updateTaskEfficiency: (taskId: string, efficiency: number, actualImageCount: number) => void;
  
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

    const tasks = get().tasks;
    tasks.forEach((task) => syncTaskSchedule(task));
  },

  createTask: async (taskData) => {
    try {
      console.log('🧭 [taskStore] createTask called', taskData);
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

      const scheduledStartDate = scheduledStartStr ? new Date(scheduledStartStr) : undefined;
      const isBackfillRecord = (taskData.identityTags || []).includes('system:backfill-record');
      const identityTags = isBackfillRecord
        ? Array.from(new Set([...(taskData.identityTags || []), 'system:backfill-record']))
        : (taskData.identityTags || []);
      const taskTitle = (taskData.title || '').trim();
      if (!taskTitle) {
        throw new Error('任务标题不能为空');
      }
      const taskDescription = taskData.description || '';
      const { smartCalculateGoldReward } = await import('@/utils/goldCalculator');
      const { useTagStore } = await import('@/stores/tagStore');
      const tagStore = useTagStore.getState();
      const taskTags = tagStore.resolveAutoTags(`${taskTitle} ${taskDescription}`.trim(), taskData.tags || [], 3);
      const ensuredTaskTags = taskTags.length > 0 ? tagStore.ensureTagsExist(taskTags) : taskTags;
      const autoGoldReward = smartCalculateGoldReward(
        taskData.durationMinutes || 30,
        taskData.taskType || 'work',
        ensuredTaskTags,
        taskTitle
      );
      const taskGoldReward = isBackfillRecord ? 0 : (taskData.goldReward ?? autoGoldReward);
      
      const newTask: Task = {
        id: crypto.randomUUID(),
        userId,
        title: taskTitle,
        description: taskData.description,
        taskType: taskData.taskType || 'work',
        priority: taskData.priority || 2,
        durationMinutes: taskData.durationMinutes || 30,
        scheduledStart: scheduledStartStr ? new Date(scheduledStartStr) : undefined,
        scheduledEnd: scheduledEndStr ? new Date(scheduledEndStr) : undefined,
        growthDimensions: taskData.growthDimensions || {},
        longTermGoals: taskData.longTermGoals || {},
        identityTags,
        enableProgressCheck: taskData.enableProgressCheck || false,
        progressChecks: [],
        penaltyGold: 0,
        status: taskData.status || 'pending',
        goldEarned: 0,
        tags: ensuredTaskTags,
        color: taskData.color,
        location: taskData.location,
        goldReward: taskGoldReward,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('💾 保存任务到本地:', newTask.title);
      
      // 添加到本地状态
      set((state) => ({
        tasks: [...state.tasks, newTask],
      }));

      if (ensuredTaskTags.length > 0) {
        tagStore.learnTagSelection(`${taskTitle} ${taskDescription}`.trim(), ensuredTaskTags);
      }
      
      // 记录用户活动（添加任务）
      const { activityMonitorService } = await import('@/services/activityMonitorService');
      activityMonitorService.recordActivity();
      
      // 同步任务提醒调度
      syncTaskSchedule(newTask);
      
      return newTask;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const existingTask = get().tasks.find((t) => t.id === id);
      if (!existingTask) return;

      const nextTitle = updates.title ?? existingTask.title;
      const nextDescription = updates.description ?? existingTask.description ?? '';
      const shouldRefreshTags = Array.isArray(updates.tags) || updates.title !== undefined || updates.description !== undefined;
      let nextTags = updates.tags ?? existingTask.tags ?? [];

      if (shouldRefreshTags) {
        const { useTagStore } = await import('@/stores/tagStore');
        const tagStore = useTagStore.getState();
        nextTags = tagStore.resolveAutoTags(`${nextTitle} ${nextDescription}`.trim(), nextTags, 3);
        nextTags = nextTags.length > 0 ? tagStore.ensureTagsExist(nextTags) : nextTags;

        if (nextTags.length > 0) {
          tagStore.learnTagSelection(
            `${nextTitle} ${nextDescription}`.trim(),
            nextTags,
            existingTask.tags || []
          );
        }
      }

      const updatedTask = {
        ...existingTask,
        ...updates,
        tags: nextTags,
        updatedAt: new Date(),
      } as Task;
      
      // 更新本地状态
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
      
      // 重新同步任务提醒调度
      syncTaskSchedule(updatedTask);
      
      // 如果任务完成，触发习惯识别
      if (updates.status === 'completed') {
        const { habitRecognitionService } = await import('@/services/habitRecognitionService');
        habitRecognitionService.autoLogTaskToHabit(updatedTask);
      }
      
      console.log('✅ 任务已更新:', id);
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      // 停止监控并取消后台调度
      backgroundTaskScheduler.unscheduleTask(id);
      
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

  // 开始启动验证倒计时（2分钟）
  startVerificationCountdown: (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + 2); // 2分钟后
    
    set((state) => ({
      tasks: state.tasks.map((t) => 
        t.id === taskId 
          ? { 
              ...t, 
              status: 'verifying_start',
              startVerificationDeadline: deadline,
              startVerificationTimeout: false,
            } 
          : t
      ),
    }));
    
    console.log('⏱️ 启动验证倒计时开始:', taskId, '截止时间:', deadline);
    
    // 2分钟后检查是否超时
    setTimeout(() => {
      const currentTask = get().tasks.find(t => t.id === taskId);
      if (currentTask && currentTask.status === 'verifying_start') {
        // 仍在验证中，说明超时了
        set((state) => ({
          tasks: state.tasks.map((t) => 
            t.id === taskId 
              ? { ...t, startVerificationTimeout: true } 
              : t
          ),
        }));
        console.log('⚠️ 启动验证超时:', taskId);
      }
    }, 2 * 60 * 1000); // 2分钟
  },

  // 完成启动验证
  completeStartVerification: (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const now = new Date();
    const completionDeadline = new Date(now);
    completionDeadline.setMinutes(completionDeadline.getMinutes() + task.durationMinutes);
    
    set((state) => ({
      tasks: state.tasks.map((t) => 
        t.id === taskId 
          ? { 
              ...t, 
              status: 'in_progress',
              actualStart: now,
              completionDeadline,
            } 
          : t
      ),
    }));
    
    console.log('✅ 启动验证完成:', taskId, '完成截止时间:', completionDeadline);
  },

  // 完成任务（计算金币）
  completeTask: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const isBackfillRecord = (task.identityTags || []).includes('system:backfill-record') || task.title === '补录记录';
    const now = new Date();

    if (isBackfillRecord) {
      const completedTask = {
        ...task,
        status: 'completed' as TaskStatus,
        actualEnd: now,
        goldEarned: 0,
        penaltyGold: 0,
      };

      set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === taskId ? completedTask : t
        ),
      }));

      console.log('📝 补录记录完成，不发金币、不记拖延税:', taskId);

      return {
        goldEarned: 0,
        multiplier: 1,
        delayTax: 0,
      };
    }
    
    const actualStart = task.actualStart || now;
    const actualMinutes = Math.round((now.getTime() - actualStart.getTime()) / 60000);
    
    // 导入金币计算器
    const { calculateActualGoldReward, smartDetectTaskPosture } = await import('@/utils/goldCalculator');
    
    // 判断任务姿势
    const posture = smartDetectTaskPosture(task.taskType, task.tags, task.title);
    
    // 计算金币
    const goldResult = calculateActualGoldReward(
      actualMinutes,
      task.durationMinutes,
      posture,
      task.startVerificationTimeout || false
    );
    
    console.log('💰 任务完成金币计算:', {
      taskId,
      actualMinutes,
      estimatedMinutes: task.durationMinutes,
      posture,
      startVerificationTimeout: task.startVerificationTimeout,
      result: goldResult,
    });
    
    // 🎯 新增：驱动力系统集成
    const { useDriveStore } = await import('@/stores/driveStore');
    const driveStore = useDriveStore.getState();
    
    // 1. 增加连击
    const multiplier = driveStore.incrementCombo();
    
    // 2. 应用连击倍率
    const finalGold = Math.round(goldResult.finalGold * multiplier);
    
    // 3. 更新连胜
    driveStore.updateWinStreak();
    
    // 4. 检查拖延税
    let delayTax = 0;
    if (task.scheduledEnd) {
      delayTax = driveStore.calculateDelayTax(taskId, task.title, task.scheduledEnd);
      if (delayTax > 0) {
        driveStore.recordDelayTax(taskId, task.title, delayTax, 
          (now.getTime() - task.scheduledEnd.getTime()) / (1000 * 60 * 60)
        );
      }
    }
    
    console.log('🎯 驱动力系统:', {
      原始金币: goldResult.finalGold,
      连击倍率: multiplier,
      最终金币: finalGold,
      拖延税: delayTax,
    });
    
    // 更新任务状态
    const completedTask = {
      ...task,
      status: 'completed' as TaskStatus,
      actualEnd: now,
      goldEarned: finalGold,
      penaltyGold: goldResult.penalty + delayTax,
    };
    
    set((state) => ({
      tasks: state.tasks.map((t) => 
        t.id === taskId ? completedTask : t
      ),
    }));
    
    // 更新金币余额
    const { useGoldStore } = await import('@/stores/goldStore');
    const goldStore = useGoldStore.getState();
    goldStore.addGold(finalGold, 'task_completion', taskId, task.title, `task-completion:${taskId}`);
    
    // 同步到标签统计
    const { tagSyncService } = await import('@/services/tagSyncService');
    tagSyncService.syncTaskToTags(completedTask);
    
    // 🐾 宠物获得经验
    const { usePetStore } = await import('@/stores/petStore');
    const petStore = usePetStore.getState();
    if (petStore.currentPet) {
      const expAmount = Math.max(20, Math.floor(actualMinutes / 2)); // 至少20经验，或每2分钟1经验
      petStore.gainExp(expAmount);
      console.log(`🐾 宠物获得 ${expAmount} 经验`);
    }
    
    // 🏆 检查成就
    const { useLeaderboardStore } = await import('@/stores/leaderboardStore');
    const leaderboardStore = useLeaderboardStore.getState();
    leaderboardStore.checkAchievements();
    
    // 📊 P0-5: 更新RPG雷达图
    try {
      const { RPGRadarUpdater } = await import('@/services/rpgRadarUpdater');
      
      // 检查是否是RPG任务
      const isRPGTask = task.metadata?.rpgTaskId;
      
      if (isRPGTask) {
        console.log('📊 检测到RPG任务完成，更新雷达图');
        
        // 构造RPG任务数据
        const rpgTask = {
          id: task.metadata.rpgTaskId,
          title: task.title,
          description: task.description || '',
          type: task.metadata.rpgTaskType || 'normal',
          difficulty: task.priority === 'high' ? 'hard' : task.priority === 'low' ? 'easy' : 'medium',
          expReward: task.metadata.expReward || 50,
          goldReward: task.metadata.goldReward || 30,
          completed: true,
          isImprovement: task.tags?.includes('改进任务'),
        };
        
        RPGRadarUpdater.updateRadarOnTaskComplete(rpgTask, {
          taskType: task.taskType,
          completionEfficiency: task.completionEfficiency,
        });
      }
    } catch (error) {
      console.warn('⚠️ 更新雷达图失败:', error);
    }
    
    console.log('✅ 任务完成:', taskId, goldResult.reason);
    
    // 🎯 返回金币信息，用于触发动画
    return {
      goldEarned: finalGold,
      multiplier,
      delayTax,
    };
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
  
  // 更新任务效率
  updateTaskEfficiency: (taskId, efficiency, actualImageCount) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 计算效率等级
    let efficiencyLevel: 'excellent' | 'good' | 'average' | 'poor';
    if (efficiency >= 90) {
      efficiencyLevel = 'excellent';
    } else if (efficiency >= 70) {
      efficiencyLevel = 'good';
    } else if (efficiency >= 50) {
      efficiencyLevel = 'average';
    } else {
      efficiencyLevel = 'poor';
    }
    
    // 更新任务
    set((state) => ({
      tasks: state.tasks.map((t) => 
        t.id === taskId 
          ? { 
              ...t, 
              completionEfficiency: efficiency,
              efficiencyLevel,
              actualImageCount,
              updatedAt: new Date(),
            } 
          : t
      ),
    }));
    
    console.log('📊 任务效率已更新:', {
      taskId,
      taskTitle: task.title,
      efficiency: `${efficiency}%`,
      efficiencyLevel,
      plannedImageCount: task.plannedImageCount,
      actualImageCount,
    });
    
    // 如果效率低于50%，记录到坏习惯罐头
    if (efficiency < 50) {
      import('@/stores/habitCanStore').then(({ useHabitCanStore }) => {
        const habitCanStore = useHabitCanStore.getState();
        
        // 查找"低效率"预设习惯
        const lowEfficiencyHabit = habitCanStore.habits.find(
          h => h.rule.id === 'low-efficiency' && h.enabled
        );
        
        if (lowEfficiencyHabit) {
          const today = new Date().toISOString().split('T')[0];
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          habitCanStore.recordOccurrence(
            lowEfficiencyHabit.id,
            today,
            {
              time: timeStr,
              reason: `${task.title} - 完成效率${efficiency}%（低于50%）`,
              relatedTaskId: taskId,
            }
          );
          
          console.log('🐢 记录低效率坏习惯:', task.title, `${efficiency}%`);
        }
      });
    }
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

