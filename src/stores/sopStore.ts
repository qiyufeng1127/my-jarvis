import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SOPFolder, SOPTask, SOPState } from '@/types/sop';
import { useTaskStore } from './taskStore';

export const useSOPStore = create<SOPState>()(
  persist(
    (set, get) => ({
      folders: [],
      tasks: [],
      
      // 文件夹操作
      createFolder: (name, emoji = '📁', color = '#007AFF') => {
        const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const folder: SOPFolder = {
          id,
          name,
          emoji,
          color,
          order: get().folders.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set({ folders: [...get().folders, folder] });
        return id;
      },
      
      updateFolder: (id, updates) => {
        set({
          folders: get().folders.map(f =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f
          ),
        });
      },
      
      deleteFolder: (id) => {
        // 删除文件夹及其所有任务
        set({
          folders: get().folders.filter(f => f.id !== id),
          tasks: get().tasks.filter(t => t.folderId !== id),
        });
      },
      
      reorderFolders: (folderIds) => {
        const folders = get().folders;
        const reordered = folderIds.map((id, index) => {
          const folder = folders.find(f => f.id === id);
          return folder ? { ...folder, order: index } : null;
        }).filter(Boolean) as SOPFolder[];
        
        set({ folders: reordered });
      },
      
      // 任务操作
      createTask: (folderId, task) => {
        const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const folderTasks = get().tasks.filter(t => t.folderId === folderId);
        
        const newTask: SOPTask = {
          ...task,
          id,
          folderId,
          order: folderTasks.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set({ tasks: [...get().tasks, newTask] });
        return id;
      },
      
      updateTask: (id, updates) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        });
      },
      
      deleteTask: (id) => {
        set({
          tasks: get().tasks.filter(t => t.id !== id),
        });
      },
      
      reorderTasks: (folderId, taskIds) => {
        const tasks = get().tasks;
        const updatedTasks = tasks.map(task => {
          if (task.folderId === folderId) {
            const newOrder = taskIds.indexOf(task.id);
            return newOrder >= 0 ? { ...task, order: newOrder } : task;
          }
          return task;
        });
        
        set({ tasks: updatedTasks });
      },
      
      // 查询
      getFolderById: (id) => {
        return get().folders.find(f => f.id === id);
      },
      
      getTaskById: (id) => {
        return get().tasks.find(t => t.id === id);
      },
      
      getTasksByFolder: (folderId) => {
        return get().tasks
          .filter(t => t.folderId === folderId)
          .sort((a, b) => a.order - b.order);
      },
      
      // 推送到时间轴
      pushToTimeline: (taskId) => {
        const task = get().getTaskById(taskId);
        if (!task) return;
        
        const taskStore = useTaskStore.getState();
        const now = new Date();
        
        // 计算结束时间
        const endTime = new Date(now.getTime() + task.durationMinutes * 60 * 1000);
        
        // 创建新任务
        taskStore.addTask({
          title: task.title,
          description: task.description,
          taskType: 'work',
          priority: 2,
          durationMinutes: task.durationMinutes,
          scheduledStart: now,
          scheduledEnd: endTime,
          tags: task.tags || [],
          location: task.location,
          goldReward: task.goldReward,
          longTermGoals: task.longTermGoals || {},
          identityTags: [],
          growthDimensions: {},
          status: 'scheduled',
          goldEarned: 0,
          penaltyGold: 0,
          progressChecks: [],
          enableProgressCheck: false,
          verificationStart: task.verificationStart,
          verificationComplete: task.verificationComplete,
          subtasks: task.subtasks,
        });
      },
    }),
    {
      name: 'sop-storage',
      partialize: (state) => ({
        folders: state.folders,
        tasks: state.tasks,
      }),
    }
  )
);

