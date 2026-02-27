import { useState, useEffect } from 'react';
import { getVerificationModeSettings } from '@/components/settings/VerificationModeSettings';
import RealtimeVerificationFlow from '@/components/verification/RealtimeVerificationFlow';
import TaskVerification from './TaskVerification';

interface UnifiedTaskVerificationProps {
  task: {
    id: string;
    title: string;
    verificationType: 'photo' | 'upload' | 'file';
    requirement: string;
    acceptedFileTypes?: string[];
    maxFileSize?: number;
  };
  verificationType: 'start' | 'complete';
  keywords?: string[]; // 百度AI使用的关键词
  realtimeObjects?: string[]; // 实时识别使用的物品类名
  onSuccess: () => void;
  onFail: () => void;
  onSkip: () => void;
  timeLimit?: number;
}

/**
 * 统一任务验证组件
 * 根据用户设置自动选择使用百度AI识别或实时物品识别
 */
export default function UnifiedTaskVerification({
  task,
  verificationType,
  keywords = [],
  realtimeObjects = [],
  onSuccess,
  onFail,
  onSkip,
  timeLimit = 120,
}: UnifiedTaskVerificationProps) {
  const [mode, setMode] = useState<'baidu' | 'realtime'>('baidu');
  const [config, setConfig] = useState({
    requireAll: false,
    minConfidence: 0.5,
    maxSelection: 10,
  });

  // 加载用户设置
  useEffect(() => {
    const settings = getVerificationModeSettings();
    setMode(settings.mode);
    setConfig(settings.realtimeConfig);
  }, []);

  // 如果用户选择实时识别模式
  if (mode === 'realtime') {
    return (
      <RealtimeVerificationFlow
        onSuccess={onSuccess}
        onFail={onFail}
        onClose={onSkip}
        preSelectedObjects={realtimeObjects}
        maxSelection={config.maxSelection}
        requireAll={config.requireAll}
        minConfidence={config.minConfidence}
      />
    );
  }

  // 默认使用百度AI识别
  return (
    <TaskVerification
      task={task}
      verificationType={verificationType}
      keywords={keywords}
      onSuccess={onSuccess}
      onFail={onFail}
      onSkip={onSkip}
      timeLimit={timeLimit}
    />
  );
}

