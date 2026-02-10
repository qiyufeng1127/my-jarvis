/**
 * 任务验证状态管理 Hook
 * 负责验证状态的持久化和管理，防止状态反复跳回
 */

import { useState, useEffect, useCallback } from 'react';

interface VerificationState {
  status: 'pending' | 'started' | 'completed';
  startTime?: Date;
  actualStartTime?: Date;
}

const STORAGE_KEY = 'task_verification_states';

export function useVerificationStates() {
  // 从 localStorage 加载状态
  const [states, setStates] = useState<Record<string, VerificationState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 转换日期字符串为 Date 对象
        Object.keys(parsed).forEach(key => {
          if (parsed[key].startTime) {
            parsed[key].startTime = new Date(parsed[key].startTime);
          }
          if (parsed[key].actualStartTime) {
            parsed[key].actualStartTime = new Date(parsed[key].actualStartTime);
          }
        });
        console.log('✅ 从 localStorage 加载验证状态:', Object.keys(parsed).length, '个任务');
        return parsed;
      }
    } catch (e) {
      console.error('❌ 加载验证状态失败:', e);
    }
    return {};
  });

  // 保存状态到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
      console.log('💾 保存验证状态到 localStorage');
    } catch (e) {
      console.error('❌ 保存验证状态失败:', e);
    }
  }, [states]);

  // 获取任务的验证状态
  const getState = useCallback((taskId: string): VerificationState => {
    return states[taskId] || { status: 'pending' };
  }, [states]);

  // 更新任务的验证状态
  const updateState = useCallback((taskId: string, updates: Partial<VerificationState>) => {
    setStates(prev => {
      const newState = {
        ...prev,
        [taskId]: {
          ...prev[taskId],
          ...updates,
        }
      };
      console.log(`✅ 更新任务 ${taskId} 验证状态:`, updates);
      return newState;
    });
  }, []);

  // 标记启动验证开始
  const markStartVerificationBegin = useCallback((taskId: string) => {
    const now = new Date();
    updateState(taskId, {
      status: 'pending',
      startTime: new Date(now.getTime() + 2 * 60 * 1000), // 2分钟后超时
    });
    console.log(`🟡 任务 ${taskId} 进入启动验证倒计时`);
  }, [updateState]);

  // 标记启动验证完成
  const markStartVerificationComplete = useCallback((taskId: string) => {
    updateState(taskId, {
      status: 'started',
      actualStartTime: new Date(),
    });
    console.log(`🟢 任务 ${taskId} 启动验证完成`);
  }, [updateState]);

  // 标记完成验证完成
  const markCompleteVerificationComplete = useCallback((taskId: string) => {
    updateState(taskId, {
      status: 'completed',
    });
    console.log(`✅ 任务 ${taskId} 完成验证完成`);
  }, [updateState]);

  // 重置任务状态（用于删除任务时）
  const resetState = useCallback((taskId: string) => {
    setStates(prev => {
      const newStates = { ...prev };
      delete newStates[taskId];
      console.log(`🔄 重置任务 ${taskId} 验证状态`);
      return newStates;
    });
  }, []);

  // 清空所有状态
  const clearAll = useCallback(() => {
    setStates({});
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ 清空所有验证状态');
  }, []);

  return {
    getState,
    updateState,
    markStartVerificationBegin,
    markStartVerificationComplete,
    markCompleteVerificationComplete,
    resetState,
    clearAll,
  };
}

