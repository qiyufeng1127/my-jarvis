/**
 * 任务验证倒计时组件（独立模块，零侵入）
 * 功能：到时间自动触发启动验证 → 任务倒计时 → 完成打勾
 */

import React, { useState, useEffect } from 'react';
import { Camera, Upload, Check } from 'lucide-react';

interface TaskVerificationCountdownProps {
  taskId: string;
  taskTitle: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  startPhotoHint?: string; // 启动照片提示
  endPhotoHint?: string;   // 完成照片提示
  onComplete?: () => void; // 完成回调
}

type VerificationStatus = 'waiting' | 'start_verification' | 'in_progress' | 'completed';

export default function TaskVerificationCountdown({
  taskId,
  taskTitle,
  scheduledStart,
  scheduledEnd,
  startPhotoHint = '请拍摄任务开始的照片',
  endPhotoHint = '请拍摄任务完成的照片',
  onComplete,
}: TaskVerificationCountdownProps) {
  const [status, setStatus] = useState<VerificationStatus>('waiting');
  const [countdown, setCountdown] = useState(60); // 启动验证倒计时（60秒）
  const [taskTimeLeft, setTaskTimeLeft] = useState(0); // 任务剩余时间（秒）
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  // 组件挂载时立即检查并触发
  useEffect(() => {
    console.log('🔍 [验证倒计时] 组件已挂载:', taskTitle);
    console.log('📅 [验证倒计时] 预设时间:', scheduledStart);
    console.log('🕐 [验证倒计时] 当前时间:', new Date());
    
    const now = new Date();
    const startTime = new Date(scheduledStart);
    
    console.log('⏰ [验证倒计时] 时间比较:', {
      now: now.toLocaleString(),
      startTime: startTime.toLocaleString(),
      isTimeReached: now >= startTime
    });
    
    // 立即检查时间，如果已到达则直接触发
    if (now >= startTime) {
      console.log('✅ [验证倒计时] 时间已到达，立即触发启动验证!');
      setStatus('start_verification');
    } else {
      console.log('⏳ [验证倒计时] 时间未到，等待中...');
    }
  }, []);

  // 检查是否到达预设时间
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const startTime = new Date(scheduledStart);
      
      // 仅当到达预设时间且状态为 waiting 时，触发启动验证
      if (now >= startTime && status === 'waiting') {
        console.log('⏰ [验证倒计时] 定时检查：到达预设时间，触发启动验证:', taskTitle);
        setStatus('start_verification');
      }
    };

    // 每秒检查一次
    const interval = setInterval(checkTime, 1000);

    return () => clearInterval(interval);
  }, [scheduledStart, status, taskTitle]);

  // 启动验证倒计时
  useEffect(() => {
    if (status === 'start_verification' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, countdown]);

  // 任务进行中倒计时
  useEffect(() => {
    if (status === 'in_progress') {
      const calculateTimeLeft = () => {
        const now = new Date();
        const endTime = new Date(scheduledEnd);
        const diff = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        setTaskTimeLeft(Math.max(0, diff));
      };

      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [status, scheduledEnd]);

  // 处理照片拍摄/上传
  const handlePhotoCapture = (type: 'camera' | 'upload') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (type === 'camera') {
      input.capture = 'environment' as any;
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const photoUrl = event.target?.result as string;
          setUploadedPhoto(photoUrl);
          console.log('📸 [验证倒计时] 照片已上传:', taskTitle);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  // 处理启动按钮点击
  const handleStart = () => {
    if (!uploadedPhoto) {
      alert('⚠️ 请先拍摄或上传照片！');
      return;
    }
    
    console.log('✅ [验证倒计时] 启动验证完成，开始任务:', taskTitle);
    setStatus('in_progress');
    setUploadedPhoto(null); // 重置照片，准备完成验证
  };

  // 处理完成按钮点击
  const handleComplete = () => {
    if (!uploadedPhoto) {
      alert('⚠️ 请先拍摄或上传完成照片！');
      return;
    }
    
    console.log('🎉 [验证倒计时] 任务完成:', taskTitle);
    setStatus('completed');
    onComplete?.();
  };

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 调试：显示等待状态
  if (status === 'waiting') {
    console.log('⏳ [验证倒计时] 当前状态: waiting，组件已渲染但不显示界面');
    return null;
  }
  
  console.log('🎨 [验证倒计时] 渲染验证界面，当前状态:', status);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg shadow-2xl p-4"
      style={{ minHeight: '200px' }}
    >
      {/* 启动验证状态 */}
      {status === 'start_verification' && (
        <div className="text-center w-full">
          <h3 className="text-2xl font-bold text-white mb-2">
            ⏰ 请开始启动
          </h3>
          
          {/* 倒计时 */}
          <div className="text-6xl font-bold text-white mb-4">
            {countdown}s
          </div>
          
          {/* 照片提示 */}
          <p className="text-white text-lg mb-4">
            📸 {startPhotoHint}
          </p>
          
          {/* 照片预览 */}
          {uploadedPhoto && (
            <div className="mb-4">
              <img 
                src={uploadedPhoto} 
                alt="预览" 
                className="w-32 h-32 object-cover rounded-lg mx-auto border-4 border-white"
              />
            </div>
          )}
          
          {/* 拍摄/上传按钮 */}
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => handlePhotoCapture('camera')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-full font-bold shadow-lg hover:scale-105 transition-all"
            >
              <Camera className="w-5 h-5" />
              拍照
            </button>
            <button
              onClick={() => handlePhotoCapture('upload')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-full font-bold shadow-lg hover:scale-105 transition-all"
            >
              <Upload className="w-5 h-5" />
              上传
            </button>
          </div>
          
          {/* 启动按钮 */}
          <button
            onClick={handleStart}
            disabled={!uploadedPhoto}
            className="px-8 py-4 bg-yellow-400 text-gray-900 rounded-full text-xl font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚀 启动任务
          </button>
        </div>
      )}

      {/* 任务进行中状态 */}
      {status === 'in_progress' && (
        <div className="text-center w-full">
          <h3 className="text-2xl font-bold text-white mb-2">
            ⏱️ 任务进行中
          </h3>
          
          {/* 剩余时间倒计时 */}
          <div className="text-5xl font-bold text-white mb-2">
            离任务结束还有
          </div>
          <div className="text-7xl font-bold text-yellow-300 mb-4">
            {formatTime(taskTimeLeft)}
          </div>
          
          {/* 照片提示 */}
          <p className="text-white text-lg mb-4">
            📸 {endPhotoHint}
          </p>
          
          {/* 照片预览 */}
          {uploadedPhoto && (
            <div className="mb-4">
              <img 
                src={uploadedPhoto} 
                alt="预览" 
                className="w-32 h-32 object-cover rounded-lg mx-auto border-4 border-white"
              />
            </div>
          )}
          
          {/* 拍摄/上传按钮 */}
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => handlePhotoCapture('camera')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-full font-bold shadow-lg hover:scale-105 transition-all"
            >
              <Camera className="w-5 h-5" />
              拍照
            </button>
            <button
              onClick={() => handlePhotoCapture('upload')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-full font-bold shadow-lg hover:scale-105 transition-all"
            >
              <Upload className="w-5 h-5" />
              上传
            </button>
          </div>
          
          {/* 完成按钮 */}
          <button
            onClick={handleComplete}
            disabled={!uploadedPhoto}
            className="px-8 py-4 bg-yellow-400 text-gray-900 rounded-full text-xl font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ 完成任务
          </button>
        </div>
      )}

      {/* 任务完成状态 */}
      {status === 'completed' && (
        <div className="text-center w-full">
          <div className="text-8xl mb-4">✅</div>
          <h3 className="text-3xl font-bold text-white">
            任务已完成
          </h3>
          <p className="text-white text-lg mt-2">
            {taskTitle}
          </p>
        </div>
      )}
    </div>
  );
}

