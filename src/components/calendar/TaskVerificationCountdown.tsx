/**
 * 任务验证倒计时组件（独立模块，零侵入）
 * 功能：到时间自动触发启动验证 → 任务倒计时 → 完成打勾
 */

import React, { useState, useEffect } from 'react';
import { Camera, Upload, Check } from 'lucide-react';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';

interface TaskVerificationCountdownProps {
  taskId: string;
  taskTitle: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  startPhotoHint?: string; // 启动照片提示
  endPhotoHint?: string;   // 完成照片提示
  onComplete?: () => void; // 完成回调
  cardColor?: string;      // 卡片颜色
  hasVerification?: boolean; // 是否设置了验证
  startKeywords?: string[]; // 启动验证关键词
  completeKeywords?: string[]; // 完成验证关键词
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
  cardColor = '#EFCE7B',
  hasVerification = false,
  startKeywords = ['启动', '开始'],
  completeKeywords = ['完成', '结束'],
}: TaskVerificationCountdownProps) {
  const [status, setStatus] = useState<VerificationStatus>('waiting');
  const [countdown, setCountdown] = useState(120); // 启动验证倒计时（120秒 = 2分钟）
  const [taskTimeLeft, setTaskTimeLeft] = useState(0); // 任务剩余时间（秒）
  const [completeCountdown, setCompleteCountdown] = useState(120); // 完成验证倒计时（120秒）
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [penaltyCount, setPenaltyCount] = useState(0); // 启动惩罚次数
  const [completePenaltyCount, setCompletePenaltyCount] = useState(0); // 完成惩罚次数

  // 所有任务都显示倒计时（移除验证检查）
  // if (!hasVerification) {
  //   return null;
  // }

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
    
    // 倒计时结束，扣金币并重置倒计时
    if (status === 'start_verification' && countdown === 0) {
      console.log('⚠️ [验证倒计时] 倒计时结束，扣除20%金币');
      setPenaltyCount(prev => prev + 1);
      // TODO: 调用扣金币接口
      alert(`⚠️ 验证超时！扣除20%金币（第${penaltyCount + 1}次）`);
      
      // 重置倒计时为2分钟
      setCountdown(120);
    }
  }, [status, countdown, penaltyCount]);

  // 任务进行中倒计时
  useEffect(() => {
    if (status === 'in_progress') {
      // 任务剩余时间倒计时
      const calculateTimeLeft = () => {
        const now = new Date();
        const endTime = new Date(scheduledEnd);
        const diff = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        setTaskTimeLeft(Math.max(0, diff));
      };

      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 1000);
      
      // 完成验证倒计时
      if (completeCountdown > 0) {
        const timer = setTimeout(() => {
          setCompleteCountdown(completeCountdown - 1);
        }, 1000);
        return () => {
          clearInterval(interval);
          clearTimeout(timer);
        };
      }
      
      // 完成倒计时结束，扣金币
      if (completeCountdown === 0) {
        console.log('⚠️ [验证倒计时] 完成倒计时结束，扣除20%金币');
        setCompletePenaltyCount(prev => prev + 1);
        alert(`⚠️ 完成验证超时！扣除20%金币（第${completePenaltyCount + 1}次）`);
        setCompleteCountdown(120); // 重置为2分钟
      }
      
      return () => clearInterval(interval);
    }
  }, [status, scheduledEnd, completeCountdown, completePenaltyCount]);

  // 处理照片拍摄/上传
  const handlePhotoCapture = (type: 'camera' | 'upload') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (type === 'camera') {
      input.capture = 'environment' as any;
    }
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // 显示加载状态
      console.log('📸 [验证倒计时] 开始处理照片:', taskTitle);
      
      // 如果有验证设置，使用百度API识别
      if (hasVerification) {
        try {
          // 获取验证关键词
          const keywords = status === 'start_verification' 
            ? startKeywords
            : completeKeywords;
          
          console.log('🔍 [验证倒计时] 开始百度API识别，关键词:', keywords);
          
          // 调用百度API识别
          const result = await baiduImageRecognition.smartVerifyImage(file, keywords, 0.2);
          
          console.log('✅ [验证倒计时] 识别结果:', result);
          
          if (result.success) {
            // 识别成功，保存照片
            const reader = new FileReader();
            reader.onload = (event) => {
              const photoUrl = event.target?.result as string;
              setUploadedPhoto(photoUrl);
              console.log('✅ [验证倒计时] 照片验证通过:', taskTitle);
              alert(`✅ 验证通过！\n\n${result.description}`);
            };
            reader.readAsDataURL(file);
          } else {
            // 识别失败，显示详细信息
            console.warn('❌ [验证倒计时] 照片验证失败:', result.description);
            const message = `${result.description}\n\n${result.matchDetails}${result.suggestions ? '\n\n建议：\n' + result.suggestions.join('\n') : ''}`;
            alert(message);
          }
        } catch (error) {
          console.error('❌ [验证倒计时] 百度API调用失败:', error);
          alert('⚠️ 图像识别服务异常，请重试或跳过验证');
        }
      } else {
        // 无验证设置，直接保存照片
        const reader = new FileReader();
        reader.onload = (event) => {
          const photoUrl = event.target?.result as string;
          setUploadedPhoto(photoUrl);
          console.log('📸 [验证倒计时] 照片已上传（无验证）:', taskTitle);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  // 处理启动按钮点击
  const handleStart = () => {
    // 有验证：需要上传照片
    if (hasVerification && !uploadedPhoto) {
      alert('⚠️ 请先拍摄或上传照片！');
      return;
    }
    
    console.log('✅ [验证倒计时] 启动验证完成，开始任务:', taskTitle);
    setStatus('in_progress');
    setUploadedPhoto(null); // 重置照片，准备完成验证
  };

  // 处理完成按钮点击
  const handleComplete = () => {
    if (hasVerification && !uploadedPhoto) {
      alert('⚠️ 请先拍摄或上传完成照片！');
      return;
    }
    
    console.log('🎉 [验证倒计时] 任务完成:', taskTitle);
    
    // 计算最终金币（扣除惩罚后仍可获得基础金币）
    const baseGold = 40; // TODO: 从任务数据中获取
    const totalPenalty = (penaltyCount + completePenaltyCount) * 20;
    const finalGold = Math.max(0, baseGold - (baseGold * totalPenalty / 100));
    
    console.log(`💰 获得金币: ${finalGold} (基础${baseGold} - 扣除${totalPenalty}%)`);
    
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

  // 返回普通内容块，不使用 absolute 覆盖层
  return (
    <div className="w-full py-2">
      {/* 启动验证状态 */}
      {status === 'start_verification' && (
        <div className="text-center w-full">
          <h3 className="text-xs font-bold text-gray-800 mb-1">
            ⏰ 请开始启动
          </h3>
          
          {/* 倒计时 */}
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
          </div>
          
          {/* 有验证：显示关键词和拍照/上传按钮 */}
          {hasVerification && (
            <>
              {/* 显示AI生成的关键词 */}
              <div className="mb-2">
                <p className="text-gray-700 text-xs mb-1">📸 请拍摄包含以下内容：</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {startKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-white bg-opacity-80 text-gray-800 rounded-full text-xs font-semibold shadow-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 照片预览 */}
              {uploadedPhoto && (
                <div className="mb-1">
                  <img 
                    src={uploadedPhoto} 
                    alt="预览" 
                    className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-md"
                  />
                </div>
              )}
              
              {/* 拍摄/上传按钮 */}
              <div className="flex gap-1 justify-center mb-1">
                <button
                  onClick={() => handlePhotoCapture('camera')}
                  className="flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold shadow hover:scale-105 transition-all"
                >
                  <Camera className="w-3 h-3" />
                  拍照
                </button>
                <button
                  onClick={() => handlePhotoCapture('upload')}
                  className="flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold shadow hover:scale-105 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  上传
                </button>
              </div>
            </>
          )}
          
          {/* 启动按钮 */}
          <button
            onClick={handleStart}
            disabled={hasVerification && !uploadedPhoto}
            className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasVerification ? '🚀 启动验证' : '🚀 启动任务'}
          </button>
          
          {/* 惩罚提示 */}
          {penaltyCount > 0 && (
            <p className="text-red-600 text-xs mt-1">
              ⚠️ 已扣除 {penaltyCount * 20}% 金币
            </p>
          )}
        </div>
      )}

      {/* 任务进行中状态 */}
      {status === 'in_progress' && (
        <div className="text-center w-full">
          <h3 className="text-xs font-bold text-gray-800 mb-1">
            ⏱️ 任务进行中
          </h3>
          
          {/* 完成验证倒计时 */}
          <div className="text-xs text-gray-700">
            完成验证倒计时
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Math.floor(completeCountdown / 60)}:{(completeCountdown % 60).toString().padStart(2, '0')}
          </div>
          
          {/* 任务剩余时间 */}
          <div className="text-xs text-gray-600 mb-1">
            任务剩余: {formatTime(taskTimeLeft)}
          </div>
          
          {/* 有验证：显示关键词和拍照/上传按钮 */}
          {hasVerification && (
            <>
              {/* 显示AI生成的关键词 */}
              <div className="mb-2">
                <p className="text-gray-700 text-xs mb-1">📸 请拍摄包含以下内容：</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {completeKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-white bg-opacity-80 text-gray-800 rounded-full text-xs font-semibold shadow-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 照片预览 */}
              {uploadedPhoto && (
                <div className="mb-1">
                  <img 
                    src={uploadedPhoto} 
                    alt="预览" 
                    className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-md"
                  />
                </div>
              )}
              
              {/* 拍摄/上传按钮 */}
              <div className="flex gap-1 justify-center mb-1">
                <button
                  onClick={() => handlePhotoCapture('camera')}
                  className="flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold shadow hover:scale-105 transition-all"
                >
                  <Camera className="w-3 h-3" />
                  拍照
                </button>
                <button
                  onClick={() => handlePhotoCapture('upload')}
                  className="flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold shadow hover:scale-105 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  上传
                </button>
              </div>
            </>
          )}
          
          {/* 完成按钮 */}
          <button
            onClick={handleComplete}
            disabled={hasVerification && !uploadedPhoto}
            className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasVerification ? '✅ 完成验证' : '✅ 完成任务'}
          </button>
          
          {/* 惩罚提示 */}
          {completePenaltyCount > 0 && (
            <p className="text-red-600 text-xs mt-1">
              ⚠️ 已扣除 {completePenaltyCount * 20}% 金币
            </p>
          )}
        </div>
      )}

      {/* 任务完成状态 */}
      {status === 'completed' && (
        <div className="text-center w-full">
          <div className="text-3xl mb-1">✅</div>
          <h3 className="text-xs font-bold text-gray-800">
            任务已完成
          </h3>
          <p className="text-gray-700 text-xs mt-1">
            {taskTitle}
          </p>
          {/* 显示获得的金币 */}
          <p className="text-green-600 text-xs font-bold mt-1">
            💰 获得金币
          </p>
        </div>
      )}
    </div>
  );
}

