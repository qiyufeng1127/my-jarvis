/**
 * 紧急任务触发器
 * 负责显示紧急任务弹窗，并从设置中读取语音播报配置
 */

import React, { useState, useEffect } from 'react';
import EmergencyTaskModal from './EmergencyTaskModal';

export default function EmergencyTaskTrigger() {
  const [enableVoice, setEnableVoice] = useState(false);

  // 从 localStorage 读取语音播报设置
  useEffect(() => {
    try {
      const settings = localStorage.getItem('emergency-task-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setEnableVoice(parsed.enableVoice || false);
      }
    } catch (error) {
      console.warn('⚠️ 读取紧急任务设置失败:', error);
    }
  }, []);

  return <EmergencyTaskModal enableVoice={enableVoice} />;
}
