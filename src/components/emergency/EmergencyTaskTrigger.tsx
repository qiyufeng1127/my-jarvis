/**
 * 紧急任务触发器组件
 * 监听紧急任务触发事件，显示弹窗
 */

import React, { useState, useEffect } from 'react';
import { useEmergencyTaskStore } from '@/stores/emergencyTaskStore';
import EmergencyTaskModal from './EmergencyTaskModal';

export default function EmergencyTaskTrigger() {
  const { currentTask } = useEmergencyTaskStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 监听紧急任务触发事件
    const handleEmergencyTask = (event: CustomEvent) => {
      console.log('🚨 收到紧急任务触发事件:', event.detail);
      setShowModal(true);
    };

    window.addEventListener('emergencyTaskTriggered', handleEmergencyTask as EventListener);

    return () => {
      window.removeEventListener('emergencyTaskTriggered', handleEmergencyTask as EventListener);
    };
  }, []);

  // 如果有当前任务但弹窗未显示，自动显示
  useEffect(() => {
    if (currentTask && !showModal) {
      setShowModal(true);
    }
  }, [currentTask]);

  if (!showModal || !currentTask) {
    return null;
  }

  return <EmergencyTaskModal onClose={() => setShowModal(false)} />;
}

