/**
 * 紧急任务全屏弹窗组件
 * 当触发紧急任务时全屏显示，强制用户处理
 */

import React, { useEffect, useState } from 'react';
import { useEmergencyTaskStore } from '@/stores/emergencyTaskStore';
import { useTaskStore } from '@/stores/taskStore';
import { activityMonitorService } from '@/services/activityMonitorService';
import { AlertCircle, RefreshCw, X, Camera, CheckCircle } from 'lucide-react';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';

interface EmergencyTaskModalProps {
  enableVoice?: boolean; // 是否启用语音播报
}

export default function EmergencyTaskModal({ enableVoice = false }: EmergencyTaskModalProps) {
  const { currentTask, completeCurrentTask, failCurrentTask, replaceCurrentTask } = useEmergencyTaskStore();
  const { createTask } = useTaskStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [remainingReplaces, setRemainingReplaces] = useState(3);
  const [showImageVerification, setShowImageVerification] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<string>('');

  // 监听紧急任务触发事件
  useEffect(() => {
    const handleEmergencyTask = (event: CustomEvent) => {
      console.log('🚨 收到紧急任务触发事件:', event.detail);
      setIsVisible(true);
      setRemainingReplaces(activityMonitorService.getRemainingReplaces());
      
      // 语音播报
      if (enableVoice && event.detail?.task) {
        speakTask(event.detail.task.title);
      }
    };

    window.addEventListener('emergencyTaskTriggered', handleEmergencyTask as EventListener);

    return () => {
      window.removeEventListener('emergencyTaskTriggered', handleEmergencyTask as EventListener);
    };
  }, [enableVoice]);

  // 监听 currentTask 变化
  useEffect(() => {
    if (currentTask) {
      setIsVisible(true);
      setRemainingReplaces(activityMonitorService.getRemainingReplaces());
      
      // 语音播报
      if (enableVoice) {
        speakTask(currentTask.title);
      }
    } else {
      setIsVisible(false);
    }
  }, [currentTask, enableVoice]);

  // 语音播报
  const speakTask = (taskTitle: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `检测到您已1小时未添加任务，紧急任务已触发：${taskTitle}`
      );
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 处理完成任务
  const handleComplete = () => {
    if (!currentTask) return;

    // 如果任务有关键词验证要求，打开图片验证
    if (currentTask.keywords && currentTask.keywords.length > 0) {
      setShowImageVerification(true);
    } else {
      // 没有验证要求，直接完成
      completeTaskAndSync();
    }
  };

  // 完成任务并同步到事件卡片
  const completeTaskAndSync = () => {
    if (!currentTask) return;

    // 1. 创建事件卡片
    const now = new Date();
    createTask({
      title: `🚨 ${currentTask.title}`,
      description: currentTask.description || '紧急任务',
      taskType: 'emergency', // 标记为紧急任务
      status: 'completed',
      scheduledStart: now,
      scheduledEnd: now,
      actualStart: now,
      actualEnd: now,
      tags: ['紧急任务'],
      priority: 1, // 最高优先级
      durationMinutes: 0,
      growthDimensions: {},
      longTermGoals: {},
      identityTags: [],
      enableProgressCheck: false,
      progressChecks: [],
      penaltyGold: 0,
      goldReward: currentTask.goldReward,
    });

    // 2. 完成紧急任务（奖励金币）
    completeCurrentTask();

    // 3. 关闭弹窗
    setIsVisible(false);
    setShowImageVerification(false);
    setSelectedImage(null);
    setVerificationResult('');

    console.log('✅ 紧急任务已完成并同步到事件卡片');
  };

  // 处理图片验证
  const handleImageVerification = async () => {
    if (!selectedImage || !currentTask) return;

    setIsVerifying(true);
    setVerificationResult('');

    try {
      const result = await baiduImageRecognition.recognizeImage(
        selectedImage,
        currentTask.keywords || []
      );

      if (result.success) {
        setVerificationResult('✅ 验证通过！');
        
        // 延迟1秒后完成任务
        setTimeout(() => {
          completeTaskAndSync();
        }, 1000);
      } else {
        setVerificationResult(`❌ 验证失败：${result.message}`);
      }
    } catch (error) {
      console.error('图片验证失败:', error);
      setVerificationResult('❌ 验证失败，请重试');
    } finally {
      setIsVerifying(false);
    }
  };

  // 处理替换任务
  const handleReplace = () => {
    const result = activityMonitorService.tryReplaceTask();
    
    if (result.success) {
      setRemainingReplaces(activityMonitorService.getRemainingReplaces());
      
      // 语音播报新任务
      if (enableVoice && currentTask) {
        speakTask(currentTask.title);
      }
      
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  // 处理放弃任务
  const handleFail = () => {
    if (!currentTask) return;

    if (confirm(`确定要放弃任务吗？将扣除 ${currentTask.goldPenalty} 金币`)) {
      failCurrentTask();
      setIsVisible(false);
    }
  };

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setVerificationResult('');
    }
  };

  if (!isVisible || !currentTask) {
    return null;
  }

  // 图片验证界面
  if (showImageVerification) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">📸</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              任务验证
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              请上传包含以下内容的图片：
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {currentTask.keywords?.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* 图片选择 */}
          <div className="mb-4">
            <label className="block w-full">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                {selectedImage ? (
                  <div>
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedImage.name}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      点击拍照或上传图片
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* 验证结果 */}
          {verificationResult && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              verificationResult.includes('✅')
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {verificationResult}
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowImageVerification(false);
                setSelectedImage(null);
                setVerificationResult('');
              }}
              className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleImageVerification}
              disabled={!selectedImage || isVerifying}
              className="flex-1 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '验证中...' : '提交验证'}
            </button>
          </div>

          {/* 跳过验证选项 */}
          <button
            onClick={completeTaskAndSync}
            className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            跳过验证直接完成
          </button>
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-8 shadow-2xl transform animate-in zoom-in-95 duration-300">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">🚨</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            紧急任务触发
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            检测到您已1小时未添加任务
          </p>
        </div>

        {/* 任务内容 */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 mb-6 border-2 border-red-200 dark:border-red-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {currentTask.title}
          </h2>
          {currentTask.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {currentTask.description}
            </p>
          )}
          
          {/* 奖励和惩罚 */}
          <div className="flex items-center justify-between pt-4 border-t border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✅</span>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">完成奖励</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  +{currentTask.goldReward} 💰
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">❌</span>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">放弃惩罚</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  -{currentTask.goldPenalty} 💰
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 验证要求 */}
        {currentTask.keywords && currentTask.keywords.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  完成需要图片验证
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  需包含：{currentTask.keywords.join('、')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleComplete}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            ✅ 完成任务
          </button>

          <button
            onClick={handleReplace}
            disabled={remainingReplaces === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>换一个任务 ({remainingReplaces}/3)</span>
          </button>

          <button
            onClick={handleFail}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>放弃任务 (-{currentTask.goldPenalty} 💰)</span>
          </button>
        </div>

        {/* 提示 */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          必须处理此任务才能继续使用系统
        </div>
      </div>
    </div>
  );
}
