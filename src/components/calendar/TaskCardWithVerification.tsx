/**
 * 带验证开关的任务卡片组件
 * 核心功能：根据任务的验证开关决定点击 start/完成 按钮的行为
 * - 开启验证：触发完整验证流程（拍照 + 倒计时）
 * - 关闭验证：仅记录真实时间，无验证流程
 */

import React from 'react';
import { Clock, Camera, Check, Play } from 'lucide-react';
import { useTaskVerificationManager } from '@/hooks/useTaskVerificationManager';
import type { Task } from '@/types';

interface TaskCardWithVerificationProps {
  task: Task;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  className?: string;
}

export default function TaskCardWithVerification({
  task,
  onTaskUpdate,
  className = '',
}: TaskCardWithVerificationProps) {
  const { manualStartTask, manualCompleteTask } = useTaskVerificationManager();

  // 判断任务状态
  const isScheduled = task.status === 'scheduled' || task.status === 'pending';
  const isInProgress = task.status === 'in_progress';
  const isCompleted = task.status === 'completed';

  // 判断是否开启验证
  const hasStartVerification = !!task.verificationStart;
  const hasCompleteVerification = !!task.verificationComplete;

  // 处理开始按钮点击
  const handleStartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🎯 [任务卡片] 点击开始按钮:', task.title);
    console.log('🔧 [任务卡片] 验证开关状态:', hasStartVerification ? '开启' : '关闭');
    
    await manualStartTask(task.id);
  };

  // 处理完成按钮点击
  const handleCompleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🎯 [任务卡片] 点击完成按钮:', task.title);
    console.log('🔧 [任务卡片] 验证开关状态:', hasCompleteVerification ? '开启' : '关闭');
    
    await manualCompleteTask(task.id);
  };

  // 渲染开始按钮
  const renderStartButton = () => {
    if (!isScheduled) return null;

    return (
      <button
        onClick={handleStartClick}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        title={hasStartVerification ? '启动验证（拍照 + 倒计时）' : '直接开始任务'}
      >
        {hasStartVerification ? (
          <>
            <Camera className="w-4 h-4" />
            <span>start</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>start</span>
          </>
        )}
      </button>
    );
  };

  // 渲染完成按钮
  const renderCompleteButton = () => {
    if (!isInProgress) return null;

    return (
      <button
        onClick={handleCompleteClick}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        title={hasCompleteVerification ? '完成验证（拍照 + 倒计时）' : '直接完成任务'}
      >
        {hasCompleteVerification ? (
          <>
            <Camera className="w-4 h-4" />
            <span>完成</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>完成</span>
          </>
        )}
      </button>
    );
  };

  // 渲染已完成标记
  const renderCompletedMark = () => {
    if (!isCompleted) return null;

    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
        <Check className="w-4 h-4" />
        <span>已完成</span>
      </div>
    );
  };

  return (
    <div className={`task-card-with-verification ${className}`}>
      {/* 任务信息区域 */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
        {/* 左侧：任务标题和时间 */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
          {task.scheduledStart && (
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                {new Date(task.scheduledStart).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {task.durationMinutes && (
                <span className="ml-2">· {task.durationMinutes} 分钟</span>
              )}
            </div>
          )}
          
          {/* 验证开关状态提示 */}
          <div className="flex gap-2 mt-2">
            {hasStartVerification && (
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                📸 启动验证
              </span>
            )}
            {hasCompleteVerification && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                📸 完成验证
              </span>
            )}
            {!hasStartVerification && !hasCompleteVerification && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                ⚡ 快速模式
              </span>
            )}
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-3 ml-4">
          {renderStartButton()}
          {renderCompleteButton()}
          {renderCompletedMark()}
        </div>
      </div>
    </div>
  );
}

