/**
 * 启动验证倒计时组件
 * 独立模块，仅在"已生成启动验证关键词"的任务卡片中挂载
 * 不影响其他任务卡片
 */

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface StartVerificationCountdownProps {
  taskId: string;
  onTimeout: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  keywords: string[];
  isStarted: boolean;
}

export default function StartVerificationCountdown({
  taskId,
  onTimeout,
  onComplete,
  keywords,
  isStarted,
}: StartVerificationCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(120); // 2分钟 = 120秒
  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    // 只有在任务未启动时才开始倒计时
    if (isStarted || isTimeout) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeout(true);
          onTimeout(taskId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [taskId, isStarted, isTimeout, onTimeout]);

  // 如果已经启动，不显示倒计时
  if (isStarted) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="mt-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        <span className="font-medium text-yellow-700 dark:text-yellow-300">
          {isTimeout ? (
            '启动验证超时！完成任务将扣除30%金币'
          ) : (
            <>
              启动倒计时：
              <span className="font-mono text-lg">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
            </>
          )}
        </span>
      </div>
      <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
        请拍摄包含【{keywords.join('、')}】的照片完成启动验证
      </div>
    </div>
  );
}

