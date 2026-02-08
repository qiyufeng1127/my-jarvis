/**
 * 全局任务验证管理器组件
 * 负责监听验证事件并显示验证界面
 */

import React, { useState, useEffect } from 'react';
import TaskVerificationModal from '@/components/task/TaskVerificationModal';
import { useTaskVerificationManager } from '@/hooks/useTaskVerificationManager';

interface VerificationModalState {
  isOpen: boolean;
  taskId: string;
  taskTitle: string;
  verificationType: 'start' | 'complete';
  requirement: string;
  timeout: number;
}

export default function GlobalVerificationManager() {
  // 启动验证管理器
  useTaskVerificationManager();

  const [modalState, setModalState] = useState<VerificationModalState>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
    verificationType: 'start',
    requirement: '',
    timeout: 120,
  });

  const [baiduApiKey, setBaiduApiKey] = useState<string | undefined>();
  const [baiduSecretKey, setBaiduSecretKey] = useState<string | undefined>();

  // 读取百度API配置
  useEffect(() => {
    try {
      const settingsStr = localStorage.getItem('user-settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        setBaiduApiKey(settings.baiduApiKey);
        setBaiduSecretKey(settings.baiduSecretKey);
      }
    } catch (e) {
      console.warn('读取百度API配置失败:', e);
    }
  }, []);

  // 监听显示验证界面事件
  useEffect(() => {
    const handleShowModal = (event: CustomEvent) => {
      const { taskId, taskTitle, verificationType, requirement, timeout } = event.detail;

      setModalState({
        isOpen: true,
        taskId,
        taskTitle,
        verificationType,
        requirement,
        timeout,
      });
    };

    window.addEventListener('show-verification-modal', handleShowModal as EventListener);

    return () => {
      window.removeEventListener('show-verification-modal', handleShowModal as EventListener);
    };
  }, []);

  // 处理验证结果
  const handleVerify = (result: { success: boolean; evidence?: string; reason?: string }) => {
    // 触发验证结果事件
    const event = new CustomEvent('verification-result', {
      detail: {
        taskId: modalState.taskId,
        verificationType: modalState.verificationType,
        success: result.success,
        evidence: result.evidence,
        reason: result.reason,
      },
    });
    window.dispatchEvent(event);

    // 关闭弹窗
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // 处理取消
  const handleCancel = () => {
    // 取消视为验证失败
    handleVerify({
      success: false,
      reason: '用户取消验证',
    });
  };

  return (
    <TaskVerificationModal
      isOpen={modalState.isOpen}
      verificationType={modalState.verificationType}
      taskTitle={modalState.taskTitle}
      requirement={modalState.requirement}
      timeout={modalState.timeout}
      onVerify={handleVerify}
      onCancel={handleCancel}
      baiduApiKey={baiduApiKey}
      baiduSecretKey={baiduSecretKey}
    />
  );
}

