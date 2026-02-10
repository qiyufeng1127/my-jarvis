/**
 * 任务卡片内的验证界面组件
 * 启动验证和完成验证时，任务卡片变大并只显示验证相关内容
 */

import React, { useState, useEffect } from 'react';

interface TaskCardVerificationProps {
  type: 'start' | 'complete';
  taskTitle: string;
  timeLeft: number; // 剩余秒数
  onVerify: () => void;
}

export default function TaskCardVerification({
  type,
  taskTitle,
  timeLeft,
  onVerify,
}: TaskCardVerificationProps) {
  const [displayTime, setDisplayTime] = useState(timeLeft);

  useEffect(() => {
    setDisplayTime(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    if (type === 'start') {
      // 启动验证：MM:SS
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      // 完成验证：X分X秒
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins > 0) {
        return `${mins}分${secs}秒`;
      }
      return `${secs}秒`;
    }
  };

  const isTimeout = displayTime <= 0;
  const bgColor = type === 'start' 
    ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
    : 'bg-gradient-to-br from-blue-500 to-purple-600';
  const buttonText = type === 'start' ? 'START' : 'COMPLETE';
  const promptText = type === 'start' 
    ? '请完成启动验证' 
    : '距离任务完成';

  return (
    <div className={`w-full h-full min-h-[400px] ${bgColor} rounded-2xl flex flex-col items-center justify-center text-white p-8`}>
      {/* 任务标题 */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold">{taskTitle}</h2>
      </div>

      {/* 提示文字 */}
      <div className="text-center mb-4">
        <p className="text-xl font-semibold opacity-90">{promptText}</p>
      </div>

      {/* 倒计时 - 超大字体 */}
      <div className="mb-8">
        <div className={`text-8xl font-bold ${isTimeout ? 'text-red-300 animate-pulse' : ''}`}>
          {formatTime(displayTime)}
        </div>
        {isTimeout && (
          <div className="text-center mt-3">
            <p className="text-xl font-semibold text-red-200">
              {type === 'start' ? '启动验证超时！' : '任务超时！'}
            </p>
            <p className="text-sm opacity-80 mt-1">
              {type === 'start' ? '完成任务将扣除30%金币' : '完成将无金币奖励'}
            </p>
          </div>
        )}
      </div>

      {/* 验证按钮 - 大按钮 */}
      <button
        onClick={onVerify}
        className="px-12 py-4 bg-white text-gray-900 rounded-xl text-2xl font-bold hover:bg-gray-100 active:scale-95 transition-all shadow-xl"
      >
        {buttonText}
      </button>
    </div>
  );
}

