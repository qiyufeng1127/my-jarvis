import { useState, useCallback } from 'react';

interface DecomposedTask {
  id: string;
  title: string;
  duration: number;
  startTime?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  location?: string;
}

export function useTaskEditor() {
  const [editingTasks, setEditingTasks] = useState<DecomposedTask[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // 重新计算任务时间
  const recalculateTaskTimes = useCallback((tasks: DecomposedTask[], startTime?: Date): DecomposedTask[] => {
    const baseTime = startTime || new Date();
    let currentTime = new Date(baseTime);

    return tasks.map((task) => {
      const taskStartTime = new Date(currentTime);
      const hours = taskStartTime.getHours().toString().padStart(2, '0');
      const minutes = taskStartTime.getMinutes().toString().padStart(2, '0');
      
      currentTime = new Date(currentTime.getTime() + task.duration * 60000);
      
      return {
        ...task,
        startTime: `${hours}:${minutes}`,
      };
    });
  }, []);

  // 任务重新排序
  const handleTaskReorder = useCallback((fromIndex: number, toIndex: number) => {
    setEditingTasks((prev) => {
      const newTasks = [...prev];
      const [movedTask] = newTasks.splice(fromIndex, 1);
      newTasks.splice(toIndex, 0, movedTask);
      return recalculateTaskTimes(newTasks);
    });
  }, [recalculateTaskTimes]);

  // 修改任务时长
  const handleTaskDurationChange = useCallback((taskId: string, newDuration: number) => {
    setEditingTasks((prev) => {
      const newTasks = prev.map(task =>
        task.id === taskId ? { ...task, duration: newDuration } : task
      );
      return recalculateTaskTimes(newTasks);
    });
  }, [recalculateTaskTimes]);

  // 修改任务标题
  const handleTaskTitleChange = useCallback((taskId: string, newTitle: string) => {
    setEditingTasks((prev) =>
      prev.map(task =>
        task.id === taskId ? { ...task, title: newTitle } : task
      )
    );
  }, []);

  // 删除任务
  const handleDeleteTask = useCallback((taskId: string) => {
    setEditingTasks((prev) => {
      const newTasks = prev.filter(task => task.id !== taskId);
      return recalculateTaskTimes(newTasks);
    });
  }, [recalculateTaskTimes]);

  // 开始编辑
  const startEditing = useCallback((messageId: string, tasks: DecomposedTask[]) => {
    setEditingMessageId(messageId);
    setEditingTasks(tasks);
  }, []);

  // 取消编辑
  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
    setEditingTasks([]);
  }, []);

  return {
    editingTasks,
    editingMessageId,
    setEditingTasks,
    handleTaskReorder,
    handleTaskDurationChange,
    handleTaskTitleChange,
    handleDeleteTask,
    startEditing,
    cancelEditing,
    recalculateTaskTimes,
  };
}

