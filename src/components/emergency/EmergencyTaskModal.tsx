/**
 * 紧急任务弹窗
 * 显示当前紧急任务，支持完成验证和替换任务
 */

import React, { useState } from 'react';
import { useEmergencyTaskStore } from '@/stores/emergencyTaskStore';
import EmergencyVerification from '@/components/calendar/EmergencyVerification';
import { activityMonitorService } from '@/services/activityMonitorService';

interface EmergencyTaskModalProps {
  onClose: () => void;
}

export default function EmergencyTaskModal({ onClose }: EmergencyTaskModalProps) {
  const { currentTask, completeCurrentTask, failCurrentTask } = useEmergencyTaskStore();
  const [showVerification, setShowVerification] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [remainingReplaces, setRemainingReplaces] = useState(activityMonitorService.getRemainingReplaces());

  if (!currentTask) {
    return null;
  }

  const handleReplace = () => {
    const result = activityMonitorService.tryReplaceTask();
    
    if (result.success) {
      setIsReplacing(true);
      setRemainingReplaces(activityMonitorService.getRemainingReplaces());
      
      setTimeout(() => {
        setIsReplacing(false);
        alert(result.message);
      }, 500);
    } else {
      alert(result.message);
    }
  };

  const handleStartVerification = () => {
    setShowVerification(true);
  };

  const handleVerificationSuccess = () => {
    completeCurrentTask();
    setShowVerification(false);
    onClose();
  };

  const handleVerificationFail = () => {
    failCurrentTask();
    setShowVerification(false);
    onClose();
  };

  const handleGiveUp = () => {
    if (confirm('确定要放弃这个任务吗？将扣除 ' + currentTask.goldPenalty + ' 金币')) {
      failCurrentTask();
      onClose();
    }
  };

  // 获取频率文本
  const getFrequencyText = () => {
    switch (currentTask.frequency) {
      case 'daily':
        return '每天一次';
      case 'every-2-days':
        return '每两天一次';
      case 'weekly':
        return '每周一次';
      case 'custom':
        return `每${currentTask.customDays}天一次`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="bg-red-500 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              <h2 className="text-xl font-bold">紧急任务</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm mt-1 text-red-100">
            1小时无活动触发 · 完成任务获得奖励
          </p>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {!showVerification ? (
            <>
              {/* 任务信息 */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {currentTask.title}
                </h3>
                
                {currentTask.description && (
                  <p className="text-gray-600 mb-3">
                    {currentTask.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    📅 {getFrequencyText()}
                  </span>
                </div>
              </div>

              {/* 奖励和惩罚 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                  <div className="text-xs text-green-600 mb-1">完成奖励</div>
                  <div className="text-xl font-bold text-green-700">
                    +{currentTask.goldReward} 💰
                  </div>
                </div>
                <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                  <div className="text-xs text-red-600 mb-1">失败惩罚</div>
                  <div className="text-xl font-bold text-red-700">
                    -{currentTask.goldPenalty} 💰
                  </div>
                </div>
              </div>

              {/* 验证关键词 */}
              {currentTask.keywords && currentTask.keywords.length > 0 && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <div className="text-xs font-bold text-yellow-800 mb-2">
                    📷 需要拍照验证
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentTask.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={handleStartVerification}
                  disabled={isReplacing}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
                >
                  ✅ 开始完成任务
                </button>

                <button
                  onClick={handleReplace}
                  disabled={isReplacing || remainingReplaces === 0}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReplacing ? '🔄 替换中...' : `🔄 换一个任务 (剩余${remainingReplaces}次)`}
                </button>

                <button
                  onClick={handleGiveUp}
                  disabled={isReplacing}
                  className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  ❌ 放弃任务（扣除金币）
                </button>
              </div>

              {/* 提示 */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 提示：完成任务后需要拍照验证。每日最多可替换3次任务，当前剩余 {remainingReplaces} 次。
                </p>
              </div>
            </>
          ) : (
            <>
              {/* 验证界面 */}
              <EmergencyVerification
                taskId={currentTask.id}
                taskTitle={currentTask.title}
                keywords={currentTask.keywords || []}
                goldReward={currentTask.goldReward}
                onSuccess={handleVerificationSuccess}
                onFail={handleVerificationFail}
              />

              <button
                onClick={() => setShowVerification(false)}
                className="w-full mt-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                ← 返回
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

