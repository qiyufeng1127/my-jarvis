/**
 * 任务验证倒计时组件（统一版本）
 * 核心功能：
 * 1. 到达设定时间自动触发启动验证
 * 2. 启动验证后只显示一个放大的任务剩余倒计时
 * 3. 完成时自动更新任务的实际结束时间
 */

import React, { useState, useEffect } from 'react';
import { Camera, Upload } from 'lucide-react';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';
import { useGoldStore } from '@/stores/goldStore';

interface TaskVerificationCountdownContentProps {
  taskId: string;
  taskTitle: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  onComplete?: (actualEndTime: Date) => void;
  hasVerification?: boolean;
  startKeywords?: string[];
  completeKeywords?: string[];
}

type VerificationStatus = 'waiting' | 'ready_to_start' | 'in_progress' | 'completed';

export default function TaskVerificationCountdownContent({
  taskId,
  taskTitle,
  scheduledStart,
  scheduledEnd,
  onComplete,
  hasVerification = false,
  startKeywords = ['启动', '开始'],
  completeKeywords = ['完成', '结束'],
}: TaskVerificationCountdownContentProps) {
  const { penaltyGold, addGold } = useGoldStore(); // 使用金币store
  const [status, setStatus] = useState<VerificationStatus>('waiting');
  const [startCountdown, setStartCountdown] = useState(120); // 启动倒计时2分钟
  const [taskTimeLeft, setTaskTimeLeft] = useState(0);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [startPenaltyCount, setStartPenaltyCount] = useState(0); // 启动超时次数
  const [completePenaltyCount, setCompletePenaltyCount] = useState(0);
  const [actualStartTime, setActualStartTime] = useState<Date | null>(null); // 实际开始时间
  const [dynamicEndTime, setDynamicEndTime] = useState<Date>(scheduledEnd); // 动态结束时间
  const [baseGoldReward, setBaseGoldReward] = useState(0); // 基础金币奖励
  const [earlyStartBonus, setEarlyStartBonus] = useState(false); // 是否获得早启动奖励
  const [onTimeCompleteBonus, setOnTimeCompleteBonus] = useState(false); // 是否获得按时完成奖励

  // 自动触发：检查是否到达设定时间（只在当前时间范围内触发）
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const startTime = new Date(scheduledStart);
      const endTime = new Date(scheduledEnd);
      
      // 只有在任务时间范围内才触发（当前时间在开始和结束之间）
      if (now >= startTime && now < endTime && status === 'waiting') {
        console.log('⏰ 任务到达设定时间，显示启动按钮:', taskTitle);
        setStatus('ready_to_start');
      }
    };

    // 立即检查一次
    checkTime();
    
    // 每秒检查一次
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [scheduledStart, scheduledEnd, status, taskTitle]);

  // 启动倒计时：2分钟倒计时，超时扣20%金币并重置
  useEffect(() => {
    if (status === 'ready_to_start' && startCountdown > 0) {
      const timer = setTimeout(() => {
        setStartCountdown(startCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // 倒计时结束，扣金币并重置
    if (status === 'ready_to_start' && startCountdown === 0) {
      setStartPenaltyCount(prev => prev + 1);
      
      // 计算扣除的金币（基础金币的20%）
      const taskDuration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
      const baseReward = Math.floor(taskDuration * 0.8);
      const penaltyAmount = Math.floor(baseReward * 0.2);
      
      // 真正扣除金币
      penaltyGold(penaltyAmount, `启动验证超时（第${startPenaltyCount + 1}次）`, taskId, taskTitle);
      
      alert(`⚠️ 启动验证超时！扣除${penaltyAmount}金币（第${startPenaltyCount + 1}次）`);
      setStartCountdown(120); // 重置为2分钟，继续循环
    }
  }, [status, startCountdown, startPenaltyCount, taskId, taskTitle, scheduledStart, scheduledEnd, penaltyGold]);

  // 任务剩余时间倒计时（任务进行中阶段）
  useEffect(() => {
    if (status === 'in_progress') {
      const calculateTimeLeft = () => {
        const now = new Date();
        const endTime = dynamicEndTime;
        const diff = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        const timeLeft = Math.max(0, diff);
        setTaskTimeLeft(timeLeft);
        
        // 如果时间到了，延长10分钟并扣除20%金币
        if (timeLeft === 0 && completePenaltyCount < 100) { // 最多扣100次
          setCompletePenaltyCount(prev => prev + 1);
          
          // 计算扣除的金币（基础金币的20%）
          const taskDuration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
          const baseReward = Math.floor(taskDuration * 0.8);
          const penaltyAmount = Math.floor(baseReward * 0.2);
          
          // 真正扣除金币
          penaltyGold(penaltyAmount, `任务超时延长10分钟（第${completePenaltyCount + 1}次）`, taskId, taskTitle);
          
          alert(`⚠️ 任务超时！延长10分钟，扣除${penaltyAmount}金币（第${completePenaltyCount + 1}次）`);
          
          // 延长10分钟
          const newEndTime = new Date(endTime.getTime() + 10 * 60 * 1000);
          setDynamicEndTime(newEndTime);
          setTaskTimeLeft(600); // 重置为10分钟（600秒）
          
          console.log('⚠️ 任务超时，延长10分钟至:', newEndTime.toLocaleTimeString());
        }
      };

      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [status, dynamicEndTime, completePenaltyCount, taskId, taskTitle, scheduledStart, scheduledEnd, penaltyGold]);

  // 处理照片拍摄/上传
  const handlePhotoCapture = async (type: 'camera' | 'upload') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (type === 'camera') {
      input.capture = 'environment' as any;
    }
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      if (hasVerification) {
        try {
          const keywords = status === 'ready_to_start' ? startKeywords : completeKeywords;
          const result = await baiduImageRecognition.smartVerifyImage(file, keywords, 0.2);
          
          if (result.success) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setUploadedPhoto(event.target?.result as string);
              alert(`✅ 验证通过！\n\n${result.description}`);
            };
            reader.readAsDataURL(file);
          } else {
            const message = `${result.description}\n\n${result.matchDetails}${result.suggestions ? '\n\n建议：\n' + result.suggestions.join('\n') : ''}`;
            alert(message);
          }
        } catch (error) {
          alert('⚠️ 图像识别服务异常，请重试或跳过验证');
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedPhoto(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const handleStart = () => {
    if (hasVerification && !uploadedPhoto) {
      alert('⚠️ 请先拍摄或上传照片！');
      return;
    }
    
    // 记录实际开始时间
    const now = new Date();
    setActualStartTime(now);
    
    // 检查是否在第一个2分钟内启动（获得50%奖励）
    if (startCountdown > 0 && startPenaltyCount === 0) {
      setEarlyStartBonus(true);
      console.log('🎉 在第一个2分钟内启动，获得50%金币奖励！');
    }
    
    // 计算动态结束时间：实际开始时间 + 任务时长
    const taskDuration = new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime();
    const calculatedEndTime = new Date(now.getTime() + taskDuration);
    setDynamicEndTime(calculatedEndTime);
    
    console.log('✅ 启动任务，开始倒计时:', taskTitle);
    console.log('   实际开始时间:', now.toLocaleTimeString());
    console.log('   计划结束时间:', calculatedEndTime.toLocaleTimeString());
    console.log('   任务时长:', Math.floor(taskDuration / 60000), '分钟');
    console.log('   早启动奖励:', earlyStartBonus ? '是' : '否');
    
    setStatus('in_progress');
    setUploadedPhoto(null);
  };

  const handleComplete = () => {
    if (hasVerification && !uploadedPhoto) {
      alert('⚠️ 请先拍摄或上传完成照片！');
      return;
    }
    
    // 记录实际完成时间
    const actualEndTime = new Date();
    console.log('✅ 任务完成，实际结束时间:', actualEndTime);
    
    // 计算金币奖励
    const taskDuration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
    const baseReward = Math.floor(taskDuration * 0.8);
    
    // 检查是否在原定时间内完成（没有延长过）
    const isOnTime = completePenaltyCount === 0;
    if (isOnTime) {
      setOnTimeCompleteBonus(true);
      console.log('🎉 在原定时间内完成，获得50%金币奖励！');
    }
    
    // 计算总扣除百分比
    const totalPenaltyPercent = (startPenaltyCount + completePenaltyCount) * 20;
    
    // 计算奖励百分比
    let bonusPercent = 0;
    if (earlyStartBonus) bonusPercent += 50;
    if (onTimeCompleteBonus) bonusPercent += 50;
    
    // 最终金币 = 基础金币 * (1 - 扣除% + 奖励%)
    const finalReward = Math.max(0, Math.floor(baseReward * (1 - totalPenaltyPercent / 100 + bonusPercent / 100)));
    
    // 添加金币
    if (finalReward > 0) {
      let reason = '完成任务';
      if (earlyStartBonus && onTimeCompleteBonus) {
        reason += '（早启动+按时完成）';
      } else if (earlyStartBonus) {
        reason += '（早启动奖励）';
      } else if (onTimeCompleteBonus) {
        reason += '（按时完成奖励）';
      }
      
      addGold(finalReward, reason, taskId, taskTitle);
      console.log(`💰 获得金币: ${finalReward} (基础${baseReward} - 扣除${totalPenaltyPercent}% + 奖励${bonusPercent}%)`);
    }
    
    setStatus('completed');
    onComplete?.(actualEndTime); // 传递实际完成时间
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 等待状态：时间未到，不显示任何内容
  if (status === 'waiting') {
    return null;
  }

  // 准备启动状态：显示2分钟倒计时和启动按钮
  if (status === 'ready_to_start') {
    return (
      <div className="text-center py-4">
        <div className="text-xs font-bold text-gray-800 mb-2">⏰ 请开始启动</div>
        
        {/* 2分钟启动倒计时 */}
        <div className="text-4xl font-bold text-gray-900 mb-3">
          {Math.floor(startCountdown / 60)}:{(startCountdown % 60).toString().padStart(2, '0')}
        </div>
        
        {hasVerification && (
          <>
            <div className="mb-3">
              <p className="text-gray-700 text-sm mb-2">📸 请拍摄包含以下内容：</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {startKeywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-white bg-opacity-90 text-gray-800 rounded-full text-sm font-semibold shadow-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            {uploadedPhoto && (
              <div className="mb-3">
                <img src={uploadedPhoto} alt="预览" className="w-20 h-20 object-cover rounded-lg mx-auto border-2 border-white shadow-md" />
              </div>
            )}
            
            <div className="flex gap-2 justify-center mb-3">
              <button onClick={() => handlePhotoCapture('camera')} className="flex items-center gap-1 px-3 py-2 bg-white text-gray-700 rounded-full text-sm font-bold shadow hover:scale-105 transition-all">
                <Camera className="w-4 h-4" />
                拍照
              </button>
              <button onClick={() => handlePhotoCapture('upload')} className="flex items-center gap-1 px-3 py-2 bg-white text-gray-700 rounded-full text-sm font-bold shadow hover:scale-105 transition-all">
                <Upload className="w-4 h-4" />
                上传
              </button>
            </div>
          </>
        )}
        
        <button onClick={handleStart} disabled={hasVerification && !uploadedPhoto} className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {hasVerification ? '🚀 启动验证' : '🚀 启动任务'}
        </button>
        
        {/* 显示已扣除的金币 */}
        {startPenaltyCount > 0 && (
          <p className="text-red-600 text-sm mt-2">⚠️ 已扣除 {startPenaltyCount * 20}% 金币</p>
        )}
      </div>
    );
  }

  // 任务进行中状态 - 只显示一个放大的任务剩余倒计时
  if (status === 'in_progress') {
    return (
      <div className="text-center py-4">
        <div className="text-sm font-bold text-gray-800 mb-2">⏱️ 任务剩余</div>
        
        {/* 放大显示的任务剩余倒计时 */}
        <div className="text-5xl font-bold text-gray-900 mb-4">
          {formatTime(taskTimeLeft)}
        </div>
        
        {hasVerification && (
          <>
            <div className="mb-3">
              <p className="text-gray-700 text-sm mb-2">📸 请拍摄包含以下内容：</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {completeKeywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-white bg-opacity-90 text-gray-800 rounded-full text-sm font-semibold shadow-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            {uploadedPhoto && (
              <div className="mb-3">
                <img src={uploadedPhoto} alt="预览" className="w-20 h-20 object-cover rounded-lg mx-auto border-2 border-white shadow-md" />
              </div>
            )}
            
            <div className="flex gap-2 justify-center mb-3">
              <button onClick={() => handlePhotoCapture('camera')} className="flex items-center gap-1 px-3 py-2 bg-white text-gray-700 rounded-full text-sm font-bold shadow hover:scale-105 transition-all">
                <Camera className="w-4 h-4" />
                拍照
              </button>
              <button onClick={() => handlePhotoCapture('upload')} className="flex items-center gap-1 px-3 py-2 bg-white text-gray-700 rounded-full text-sm font-bold shadow hover:scale-105 transition-all">
                <Upload className="w-4 h-4" />
                上传
              </button>
            </div>
          </>
        )}
        
        <button onClick={handleComplete} disabled={hasVerification && !uploadedPhoto} className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {hasVerification ? '✅ 完成验证' : '✅ 完成任务'}
        </button>
        
        {completePenaltyCount > 0 && (
          <p className="text-red-600 text-sm mt-2">⚠️ 已扣除 {completePenaltyCount * 20}% 金币</p>
        )}
      </div>
    );
  }

  // 任务完成状态
  const taskDuration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
  const baseReward = Math.floor(taskDuration * 0.8);
  const totalPenaltyPercent = (startPenaltyCount + completePenaltyCount) * 20;
  let bonusPercent = 0;
  if (earlyStartBonus) bonusPercent += 50;
  if (onTimeCompleteBonus) bonusPercent += 50;
  const finalReward = Math.max(0, Math.floor(baseReward * (1 - totalPenaltyPercent / 100 + bonusPercent / 100)));
  
  return (
    <div className="text-center py-4">
      <div className="text-4xl mb-2">✅</div>
      <div className="text-sm font-bold text-gray-800">任务已完成</div>
      <p className="text-gray-700 text-sm mt-1">{taskTitle}</p>
      <p className="text-green-600 text-sm font-bold mt-2">💰 获得 {finalReward} 金币</p>
      {(totalPenaltyPercent > 0 || bonusPercent > 0) && (
        <p className="text-xs mt-1">
          {totalPenaltyPercent > 0 && <span className="text-red-600">（扣除 {totalPenaltyPercent}%）</span>}
          {bonusPercent > 0 && <span className="text-green-600">（奖励 +{bonusPercent}%）</span>}
        </p>
      )}
      {earlyStartBonus && (
        <p className="text-green-600 text-xs mt-1">🎉 早启动奖励</p>
      )}
      {onTimeCompleteBonus && (
        <p className="text-green-600 text-xs mt-1">🎉 按时完成奖励</p>
      )}
    </div>
  );
}
