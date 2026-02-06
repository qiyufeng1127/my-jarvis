import { useState } from 'react';
import { AISmartProcessor } from '@/services/aiSmartService';

/**
 * 任务编辑 Hook
 * 处理任务编辑器的所有逻辑
 */
export function useTaskEditing() {
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTasks, setEditingTasks] = useState<any[]>([]);
  const [editingField, setEditingField] = useState<{taskIndex: number, field: string} | null>(null);

  // 重新计算所有任务的时间
  const recalculateTaskTimes = (tasks: any[], startFromIndex: number = 0) => {
    const newTasks = [...tasks];
    
    for (let i = startFromIndex; i < newTasks.length; i++) {
      if (i === 0) {
        // 第一个任务：保持开始时间，但更新结束时间
        const start = new Date(newTasks[i].scheduled_start_iso);
        const end = new Date(start.getTime() + newTasks[i].estimated_duration * 60000);
        newTasks[i].scheduled_start = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        newTasks[i].scheduled_end = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      } else {
        // 后续任务：紧接着前一个任务的结束时间开始
        const prevStart = new Date(newTasks[i - 1].scheduled_start_iso);
        const prevEnd = new Date(prevStart.getTime() + newTasks[i - 1].estimated_duration * 60000);
        const start = new Date(prevEnd.getTime());
        const end = new Date(start.getTime() + newTasks[i].estimated_duration * 60000);
        
        newTasks[i].scheduled_start_iso = start.toISOString();
        newTasks[i].scheduled_start = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        newTasks[i].scheduled_end = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
    }
    
    return newTasks;
  };

  // 上移任务
  const moveTaskUp = (index: number) => {
    if (index === 0) return;
    
    const newTasks = [...editingTasks];
    [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
    
    // 重新计算时间
    const recalculated = recalculateTaskTimes(newTasks, 0);
    setEditingTasks(recalculated);
  };

  // 下移任务
  const moveTaskDown = (index: number) => {
    if (index === editingTasks.length - 1) return;
    
    const newTasks = [...editingTasks];
    [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
    
    // 重新计算时间
    const recalculated = recalculateTaskTimes(newTasks, 0);
    setEditingTasks(recalculated);
  };

  // 更新任务字段
  const updateTaskField = (index: number, field: string, value: any) => {
    const newTasks = [...editingTasks];
    newTasks[index][field] = value;
    
    // 如果修改了任务名称，自动重新计算所有相关属性
    if (field === 'title') {
      // 重新推断所有属性
      newTasks[index].tags = ['日常']; // 简化版
      newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
      
      // 重新估算时长
      const newDuration = 30; // 默认30分钟
      newTasks[index].estimated_duration = newDuration;
      
      // 重新计算金币
      newTasks[index].gold = AISmartProcessor.calculateGold(newTasks[index]);
      
      // 从当前任务开始重新计算所有时间
      const recalculated = recalculateTaskTimes(newTasks, index);
      setEditingTasks(recalculated);
    }
    // 如果修改了时长，重新计算金币和后续任务时间
    else if (field === 'estimated_duration') {
      newTasks[index].gold = AISmartProcessor.calculateGold(newTasks[index]);
      
      // 从当前任务开始重新计算所有时间
      const recalculated = recalculateTaskTimes(newTasks, index);
      setEditingTasks(recalculated);
    } else {
      setEditingTasks(newTasks);
    }
  };

  // 删除任务
  const deleteTask = (index: number) => {
    const newTasks = editingTasks.filter((_, i) => i !== index);
    
    // 重新计算时间
    if (newTasks.length > 0) {
      const recalculated = recalculateTaskTimes(newTasks, 0);
      setEditingTasks(recalculated);
    } else {
      setEditingTasks([]);
    }
  };

  // 添加标签
  const addTag = (index: number, tag: string) => {
    const newTasks = [...editingTasks];
    if (!newTasks[index].tags.includes(tag)) {
      newTasks[index].tags = [...newTasks[index].tags, tag];
      // 更新颜色（使用第一个标签的颜色）
      newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
      setEditingTasks(newTasks);
    }
  };

  // 删除标签
  const removeTag = (index: number, tagIndex: number) => {
    const newTasks = [...editingTasks];
    newTasks[index].tags = newTasks[index].tags.filter((_: string, i: number) => i !== tagIndex);
    // 更新颜色（使用第一个标签的颜色）
    newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
    setEditingTasks(newTasks);
  };

  // 设置目标
  const setGoal = (index: number, goal: string | null, isNewGoal: boolean = false) => {
    const newTasks = [...editingTasks];
    newTasks[index].goal = goal;
    newTasks[index].isNewGoal = isNewGoal;
    setEditingTasks(newTasks);
  };

  // 开始编辑
  const startEditing = (tasks: any[]) => {
    setEditingTasks(tasks);
    setShowTaskEditor(true);
  };

  // 取消编辑
  const cancelEditing = () => {
    setShowTaskEditor(false);
    setEditingTasks([]);
    setEditingField(null);
  };

  return {
    showTaskEditor,
    setShowTaskEditor,
    editingTasks,
    setEditingTasks,
    editingField,
    setEditingField,
    moveTaskUp,
    moveTaskDown,
    updateTaskField,
    deleteTask,
    addTag,
    removeTag,
    setGoal,
    startEditing,
    cancelEditing,
    recalculateTaskTimes,
  };
}

