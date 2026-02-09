/**
 * 完成验证倒计时组件
 * 独立模块，仅在"完成启动验证"的任务卡片中挂载
 * 不影响其他任务卡片
 */

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface FinishVerificationCountdownProps {
  taskId: string;
  estimatedMinutes: number;
  onTimeout: (taskId: string) => void;
  keywords: string[];
  isCompleted: boolean;
  startTime: Date;
}

export default function FinishVerificationCountdown({
  taskId,
  estimatedMinutes,
  onTimeout,
  keywords,
  isCompleted,
  startTime,
}: FinishVerificationCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(estimatedMinutes * 60);
  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    // 只有在任务未完成时才开始倒计时
    if (isCompleted || isTimeout) return;

    const timer = setInterval(() => {
      // 计算从开始时间到现在的实际耗时
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = estimatedMinutes * 60 - elapsedSeconds;

      if (remaining <= 0) {
        clearInterval(timer);
        setIsTimeout(true);
        setRemainingSeconds(0);
        onTimeout(taskId);
      } else {
        setRemainingSeconds(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [taskId, estimatedMinutes, isCompleted, isTimeout, startTime, onTimeout]);

  // 如果已经完成，不显示倒计时
  if (isCompleted) return null;

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-blue-700 dark:text-blue-300">
          {isTimeout ? (
            '任务超时！完成将无金币奖励'
          ) : (
            <>
              剩余时间：
              <span className="font-mono text-lg">
                {hours > 0 && `${hours}时 `}
                {minutes.toString().padStart(2, '0')}分 {seconds.toString().padStart(2, '0')}秒
              </span>
            </>
          )}
        </span>
      </div>
      <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
        请拍摄包含【{keywords.join('、')}】的照片完成任务
      </div>
    </div>
  );
}

