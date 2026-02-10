/**
 * 任务验证倒计时内容组件
 * 用于替换卡片内容区域，不是覆盖层
 */

import React, { useState, useEffect } from 'react';
import { Camera, Upload } from 'lucide-react';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';

interface TaskVerificationCountdownContentProps {
  taskId: string;
  taskTitle: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  onComplete?: () => void;
  hasVerification?: boolean;
  startKeywords?: string[];
  completeKeywords?: string[];
}

type VerificationStatus = 'start_verification' | 'in_progress' | 'completed';

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
  const [status, setStatus] = useState<VerificationStatus>('start_verification');
  const [countdown, setCountdown] = useState(120);
  const [taskTimeLeft, setTaskTimeLeft] = useState(0);
  const [completeCountdown, setCompleteCountdown] = useState(120);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [penaltyCount, setPenaltyCount] = useState(0);
  const [completePenaltyCount, setCompletePenaltyCount] = useState(0);

  // 启动验证倒计时
  useEffect(() => {
    if (status === 'start_verification' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    
    if (status === 'start_verification' && countdown === 0) {
      setPenaltyCount(prev => prev + 1);
      alert(`⚠️ 验证超时！扣除20%金币（第${penaltyCount + 1}次）`);
      setCountdown(120);
    }
  }, [status, countdown, penaltyCount]);

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
      
      if (completeCountdown > 0) {
        const timer = setTimeout(() => setCompleteCountdown(completeCountdown - 1), 1000);
        return () => {
          clearInterval(interval);
          clearTimeout(timer);
        };
      }
      
      if (completeCountdown === 0) {
        setCompletePenaltyCount(prev => prev + 1);
        alert(`⚠️ 完成验证超时！扣除20%金币（第${completePenaltyCount + 1}次）`);
        setCompleteCountdown(120);
      }
      
      return () => clearInterval(interval);
    }
  }, [status, scheduledEnd, completeCountdown, completePenaltyCount]);

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
          const keywords = status === 'start_verification' ? startKeywords : completeKeywords;
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
    setStatus('in_progress');
    setUploadedPhoto(null);
  };

  const handleComplete = () => {
    if (hasVerification && !uploadedPhoto) {
      alert('⚠️ 请先拍摄或上传完成照片！');
      return;
    }
    setStatus('completed');
    onComplete?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 启动验证状态
  if (status === 'start_verification') {
    return (
      <div className="text-center py-2">
        <div className="text-xs font-bold text-gray-800 mb-1">⏰ 请开始启动</div>
        <div className="text-2xl font-bold text-gray-900 mb-2">
          {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
        </div>
        
        {hasVerification && (
          <>
            <div className="mb-2">
              <p className="text-gray-700 text-xs mb-1">📸 请拍摄包含以下内容：</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {startKeywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-0.5 bg-white bg-opacity-80 text-gray-800 rounded-full text-xs font-semibold shadow-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            {uploadedPhoto && (
              <div className="mb-2">
                <img src={uploadedPhoto} alt="预览" className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-md" />
              </div>
            )}
            
            <div className="flex gap-1 justify-center mb-2">
              <button onClick={() => handlePhotoCapture('camera')} className="flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold shadow hover:scale-105 transition-all">
                <Camera className="w-3 h-3" />
                拍照
              </button>
              <button onClick={() => handlePhotoCapture('upload')} className="flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold shadow hover:scale-105 transition-all">
                <Upload className="w-3 h-3" />
                上传
              </button>
            </div>
          </>
        )}
        
        <button onClick={handleStart} disabled={hasVerification && !uploadedPhoto} className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {hasVerification ? '🚀 启动验证' : '🚀 启动任务'}
        </button>
        
        {penaltyCount > 0 && (
          <p className="text-red-600 text-xs mt-1">⚠️ 已扣除 {penaltyCount * 20}% 金币</p>
        )}
      </div>
    );
  }

  // 任务进行中状态
  if (status === 'in_progress') {
    return (
      <div className="text-center py-2">
        <div className="text-xs font-bold text-gray-800 mb-1">⏱️ 任务进行中</div>
        <div className="text-xs text-gray-700">完成验证倒计时</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {Math.floor(completeCountdown / 60)}:{(completeCountdown % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-600 mb-2">任务剩余: {formatTime(taskTimeLeft)}</div>
        
        {hasVerification && (
          <>
            <div className="mb-2">
              <p className="text-gray-700 text-xs mb-1">📸 请拍摄包含以下内容：</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {completeKeywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-0.5 bg-white bg-opacity-80 text-gray-800 rounded-full text-xs font-semibold shadow-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            {uploadedPhoto && (
              <div className="mb-2">
                <img src={uploadedPhoto} alt="预览" className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-md" />
              </div>
            )}
            
            <div className="flex gap-1 justify-center mb-2">
              <button onClick={() => handlePhotoCapture('camera')} className="flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold shadow hover:scale-105 transition-all">
                <Camera className="w-3 h-3" />
                拍照
              </button>
              <button onClick={() => handlePhotoCapture('upload')} className="flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold shadow hover:scale-105 transition-all">
                <Upload className="w-3 h-3" />
                上传
              </button>
            </div>
          </>
        )}
        
        <button onClick={handleComplete} disabled={hasVerification && !uploadedPhoto} className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {hasVerification ? '✅ 完成验证' : '✅ 完成任务'}
        </button>
        
        {completePenaltyCount > 0 && (
          <p className="text-red-600 text-xs mt-1">⚠️ 已扣除 {completePenaltyCount * 20}% 金币</p>
        )}
      </div>
    );
  }

  // 任务完成状态
  return (
    <div className="text-center py-2">
      <div className="text-3xl mb-1">✅</div>
      <div className="text-xs font-bold text-gray-800">任务已完成</div>
      <p className="text-gray-700 text-xs mt-1">{taskTitle}</p>
      <p className="text-green-600 text-xs font-bold mt-1">💰 获得金币</p>
    </div>
  );
}

