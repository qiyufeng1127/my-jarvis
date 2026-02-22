import React, { useState, useEffect, useCallback } from 'react';
import { useGoldStore } from '@/stores/goldStore';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';
import { ImageUploader } from '@/services/taskVerificationService';

interface TaskVerificationCountdownContentProps {
  taskId: string;
  taskTitle: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  goldReward?: number;
  hasVerification: boolean;
  startKeywords?: string[];
  completeKeywords?: string[];
  onStart?: (actualStartTime: Date, calculatedEndTime: Date) => void;
  onComplete?: (actualEndTime: Date) => void;
  onTimeoutUpdate?: (startTimeoutCount: number, completeTimeoutCount: number) => void;
}

// 倒计时状态：等待启动 -> 启动倒计时(2分钟) -> 上传验证中 -> 完成倒计时(任务总时长) -> 已完成
type CountdownStatus = 'waiting_start' | 'start_countdown' | 'uploading_start' | 'task_countdown' | 'uploading_complete' | 'completed';

// 持久化状态接口
interface CountdownState {
  status: CountdownStatus;
  startDeadline: string | null; // 启动倒计时截止时间（时间戳）
  taskDeadline: string | null; // 任务倒计时截止时间（时间戳）
  startTimeoutCount: number; // 启动超时次数
  completeTimeoutCount: number; // 完成超时次数
  actualStartTime: string | null; // 实际启动时间
}

export default function TaskVerificationCountdownContent({
  taskId,
  taskTitle,
  scheduledStart,
  scheduledEnd,
  goldReward = 0,
  hasVerification,
  startKeywords = [],
  completeKeywords = [],
  onStart,
  onComplete,
  onTimeoutUpdate,
}: TaskVerificationCountdownContentProps) {
  const { penaltyGold, addGold } = useGoldStore();
  
  // 持久化key
  const storageKey = `countdown_${taskId}`;
  
  // 从localStorage加载状态
  const loadState = useCallback((): CountdownState | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved) as CountdownState;
        console.log(`📦 加载倒计时状态: ${taskTitle}`, state);
        return state;
      }
    } catch (error) {
      console.error('❌ 加载倒计时状态失败:', error);
    }
    return null;
  }, [storageKey, taskTitle]);
  
  // 保存状态到localStorage
  const saveState = useCallback((state: CountdownState) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      console.log(`💾 保存倒计时状态: ${taskTitle}`, state);
      
      // 通知父组件超时次数更新
      if (onTimeoutUpdate) {
        onTimeoutUpdate(state.startTimeoutCount, state.completeTimeoutCount);
      }
    } catch (error) {
      console.error('❌ 保存倒计时状态失败:', error);
    }
  }, [storageKey, taskTitle, onTimeoutUpdate]);
  
  // 初始化状态
  const initState = useCallback((): CountdownState => {
    const saved = loadState();
    if (saved) {
      // 直接返回保存的状态，不需要计算经过时间
      return saved;
    }
    
    // 默认状态
    return {
      status: 'waiting_start',
      startDeadline: null,
      taskDeadline: null,
      startTimeoutCount: 0,
      completeTimeoutCount: 0,
      actualStartTime: null,
    };
  }, [loadState]);
  
  // 核心状态
  const [state, setState] = useState<CountdownState>(initState);
  const [isUploading, setIsUploading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);
  
  // 实时计算剩余时间（基于截止时间）- 使用时间戳确保后台运行
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const startCountdownLeft = state.startDeadline 
    ? Math.max(0, Math.floor((new Date(state.startDeadline).getTime() - currentTime) / 1000))
    : 120;
    
  const taskCountdownLeft = state.taskDeadline
    ? Math.max(0, Math.floor((new Date(state.taskDeadline).getTime() - currentTime) / 1000))
    : 0;

  // 检查是否到达预设开始时间，自动触发启动倒计时
  useEffect(() => {
    const now = new Date();
    const start = new Date(scheduledStart);
    
    // 如果当前时间 >= 预设开始时间，且状态为等待启动，则触发启动倒计时
    if (now >= start && state.status === 'waiting_start') {
      console.log(`⏰ 任务到达预设时间，触发启动倒计时: ${taskTitle}`);
      
      // 触发语音播报和通知
      notificationService.notifyTaskStart(taskTitle, hasVerification);
      
      const deadline = new Date(now.getTime() + 2 * 60 * 1000); // 2分钟后
      const newState = {
        ...state,
        status: 'start_countdown' as CountdownStatus,
        startDeadline: deadline.toISOString(),
      };
      setState(newState);
      saveState(newState);
    }
  }, [scheduledStart, state.status, taskTitle, state, saveState, hasVerification]);
  
  // 每秒更新当前时间，用于实时计算剩余时间（使用requestAnimationFrame确保后台运行）
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = Date.now();
    
    const updateTime = () => {
      const now = Date.now();
      // 即使页面在后台，也要更新时间（基于实际时间戳）
      if (now - lastUpdate >= 1000) {
        setCurrentTime(now);
        lastUpdate = now;
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };
    
    animationFrameId = requestAnimationFrame(updateTime);
    
    // 额外添加一个定时器作为后备，确保后台也能更新
    const backupTimer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(backupTimer);
    };
  }, []);
  
  // 检查超时并处理
  useEffect(() => {
    // 只在启动倒计时或任务倒计时阶段检查
    if (state.status !== 'start_countdown' && state.status !== 'task_countdown') {
      return;
    }
    
    // 启动倒计时超时
    if (state.status === 'start_countdown' && startCountdownLeft === 0 && state.startDeadline) {
      const penaltyAmount = Math.floor(goldReward * 0.2);
      penaltyGold(penaltyAmount, `启动超时（第${state.startTimeoutCount + 1}次）`, taskId, taskTitle);
      console.log(`⚠️ 启动超时！扣除${penaltyAmount}金币（${state.startTimeoutCount + 1}次）`);
      
      // 触发语音播报和通知
      notificationService.notifyVerificationFailed(taskTitle, 'start', `启动超时，已扣除${penaltyAmount}金币`);
      
      const newDeadline = new Date(Date.now() + 2 * 60 * 1000); // 重置为2分钟
      const newState = {
        ...state,
        startTimeoutCount: state.startTimeoutCount + 1,
        startDeadline: newDeadline.toISOString(),
      };
      setState(newState);
      saveState(newState);
    }
    
    // 任务倒计时超时
    if (state.status === 'task_countdown' && taskCountdownLeft === 0 && state.taskDeadline) {
      const penaltyAmount = Math.floor(goldReward * 0.2);
      penaltyGold(penaltyAmount, `完成超时（第${state.completeTimeoutCount + 1}次）`, taskId, taskTitle);
      console.log(`⚠️ 完成超时！扣除${penaltyAmount}金币（${state.completeTimeoutCount + 1}次）`);
      
      // 触发语音播报和通知
      notificationService.notifyVerificationFailed(taskTitle, 'completion', `完成超时，已扣除${penaltyAmount}金币`);
      
      const newDeadline = new Date(Date.now() + 10 * 60 * 1000); // 重置为10分钟
      const newState = {
        ...state,
        completeTimeoutCount: state.completeTimeoutCount + 1,
        taskDeadline: newDeadline.toISOString(),
      };
      setState(newState);
      saveState(newState);
    }
  }, [state, startCountdownLeft, taskCountdownLeft, goldReward, penaltyGold, taskId, taskTitle, saveState]);
  
  // 任务即将结束提醒（最后1分钟或10分钟）
  useEffect(() => {
    if (state.status !== 'task_countdown') {
      return;
    }
    
    const duration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
    
    // 短任务（<10分钟）：最后1分钟提醒
    if (duration < 10 && taskCountdownLeft === 60) {
      console.log(`⏰ 任务即将结束（1分钟）: ${taskTitle}`);
      notificationService.notifyTaskEnding(taskTitle, 1, hasVerification);
    }
    
    // 长任务（>=10分钟）：最后10分钟提醒
    if (duration >= 10 && taskCountdownLeft === 600) {
      console.log(`⏰ 任务即将结束（10分钟）: ${taskTitle}`);
      notificationService.notifyTaskEnding(taskTitle, 10, hasVerification);
    }
  }, [state.status, taskCountdownLeft, scheduledStart, scheduledEnd, taskTitle, hasVerification]);

  // 启动任务（无验证直接启动，有验证需上传照片）
  const handleStartTask = useCallback(async (useCamera: boolean = false) => {
    if (!hasVerification) {
      // 无验证：直接启动任务
      const now = new Date();
      const duration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
      const taskSeconds = duration * 60;
      
      // 判断是否在启动倒计时内（2分钟内）
      const isWithinStartWindow = state.status === 'start_countdown';
      
      if (isWithinStartWindow) {
        // 2分钟内完成启动，奖励50%金币
        const bonusGold = Math.floor(goldReward * 0.5);
        addGold(bonusGold, `按时启动任务（奖励50%）`, taskId, taskTitle);
        console.log(`✅ 按时启动任务，获得${bonusGold}金币奖励`);
      } else {
        // 提前启动，无奖励
        console.log(`✅ 提前启动任务: ${taskTitle}`);
      }
      
      setState(prev => ({
        ...prev,
        status: 'task_countdown',
        taskDeadline: new Date(now.getTime() + taskSeconds * 1000).toISOString(),
        actualStartTime: now.toISOString(),
      }));
      
      // 通知父组件更新开始时间和结束时间（从当前时间开始计算）
      if (onStart) {
        const calculatedEndTime = new Date(now.getTime() + duration * 60000);
        onStart(now, calculatedEndTime);
        console.log(`📅 任务时间已更新: 开始=${now.toLocaleString('zh-CN')}, 结束=${calculatedEndTime.toLocaleString('zh-CN')}`);
      }
      
      console.log(`✅ 启动任务成功: ${taskTitle}，任务时长${duration}分钟`);
      return;
    }
    
    // 有验证：上传照片并验证
    setState(prev => ({ ...prev, status: 'uploading_start' }));
    setIsUploading(true);
    setVerificationMessage('');
    setVerificationSuccess(null);
    
    // 创建文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) {
      input.capture = 'environment' as any; // 直接打开相机
    }
    
    // 处理用户点击叉叉取消上传
    input.oncancel = () => {
      console.log('❌ 用户取消上传，返回启动倒计时');
      setState(prev => ({ ...prev, status: 'start_countdown' }));
      setIsUploading(false);
      setVerificationMessage('');
      setVerificationSuccess(null);
    };
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.log('❌ 未选择文件，返回启动倒计时');
        setState(prev => ({ ...prev, status: 'start_countdown' }));
        setIsUploading(false);
        setVerificationMessage('');
        setVerificationSuccess(null);
        return;
      }
      
      try {
        console.log('📷 [百度API] 开始识别');
        setVerificationMessage('📤 正在上传图片...');
        
        // 添加超时控制：10秒超时
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.error('❌ [百度API] 验证超时（10秒）');
            reject(new Error('TIMEOUT'));
          }, 10000);
        });
        
        // 1. 压缩并上传图片
        const compressedFile = await ImageUploader.compressImage(file);
        setVerificationMessage('📤 图片上传中...');
        
        const uploadedImageUrl = await ImageUploader.uploadImage(compressedFile);
        
        if (!uploadedImageUrl) {
          setVerificationMessage('❌ 照片上传失败，请重新拍摄');
          setVerificationSuccess(false);
          setIsUploading(false);
          console.log('❌ [百度API] 照片上传失败');
          return;
        }
        
        // 2. 调用百度API验证（阈值设为0.1，只要匹配到一个关键词就通过）
        // 使用Promise.race实现超时控制
        const verifyResult = await Promise.race([
          (async () => {
            setVerificationMessage('🔗 正在连接百度AI...');
            await new Promise(resolve => setTimeout(resolve, 300)); // 短暂延迟，让用户看到状态
            
            setVerificationMessage('🤖 百度AI识别中...');
            const result = await baiduImageRecognition.smartVerifyImage(
              file,
              startKeywords,
              0.1  // 降低阈值到0.1，表示只要匹配10%（即1个关键词）就通过
            );
            
            setVerificationMessage('✨ AI分析完成，正在匹配关键词...');
            await new Promise(resolve => setTimeout(resolve, 300)); // 短暂延迟
            return result;
          })(),
          timeoutPromise
        ]) as any;
        
        console.log('📷 [百度API] 验证结果:', verifyResult);
        
        if (!verifyResult.success) {
          setVerificationMessage(verifyResult.description || `❌ 验证未通过，请重新拍摄（需包含：${startKeywords.join('、')}）`);
          setVerificationSuccess(false);
          setIsUploading(false);
          // 保持在uploading_start状态，不要回到start_countdown
          console.log(`❌ [百度API] 识别失败:`, verifyResult.matchDetails);
          if (verifyResult.suggestions) {
            console.log('💡 拍摄建议:', verifyResult.suggestions.join('\n'));
          }
          return;
        }
        
        // 3. 验证成功，自动进入任务倒计时
        const now = new Date();
        const duration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
        const taskSeconds = duration * 60;
        
        const recognizedItems = verifyResult.matchedKeywords?.join('、') || '相关内容';
        setVerificationMessage(`✅ 验证成功！已识别到：${recognizedItems}`);
        setVerificationSuccess(true);
        console.log(`✅ [百度API] 识别成功，匹配关键词：${recognizedItems}`);
        console.log('📝 详细匹配信息:', verifyResult.matchDetails);
        
        // 2分钟内完成启动，奖励50%金币
        const bonusGold = Math.floor(goldReward * 0.5);
        addGold(bonusGold, `按时启动任务（奖励50%）`, taskId, taskTitle);
        console.log(`✅ 按时启动任务，获得${bonusGold}金币奖励`);
        
        // 触发语音播报和通知
        notificationService.notifyVerificationSuccess(taskTitle, 'start');
        
        // 延迟2秒后进入任务倒计时，让用户看到验证成功消息
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            status: 'task_countdown',
            taskDeadline: new Date(now.getTime() + taskSeconds * 1000).toISOString(),
            actualStartTime: now.toISOString(),
          }));
          
          setIsUploading(false);
          setVerificationMessage('');
          setVerificationSuccess(null);
          
          // 通知父组件更新开始时间
          if (onStart) {
            const calculatedEndTime = new Date(now.getTime() + duration * 60000);
            onStart(now, calculatedEndTime);
          }
          
          console.log(`✅ 启动验证成功: ${taskTitle}，任务时长${duration}分钟`);
        }, 2000);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        console.error('❌ [百度API] 验证异常:', error);
        
        // 根据错误类型给出详细的提示
        let userMessage = '';
        if (errorMsg === 'TIMEOUT') {
          userMessage = '❌ 验证超时（10秒）\n\n可能原因：\n1️⃣ 百度API未配置\n   • 请前往【设置→AI】配置百度API\n   • 需要填写API Key和Secret Key\n\n2️⃣ 网络连接问题\n   • 请检查网络连接\n   • 尝试切换网络后重试\n\n3️⃣ 百度服务响应慢\n   • 请稍后重试\n\n💡 提示：如果持续失败，请检查API配置是否正确';
        } else if (errorMsg.includes('网络')) {
          userMessage = '❌ 网络错误\n\n请检查网络连接后重试\n\n如果网络正常，可能是：\n• 百度API配置错误\n• 防火墙拦截\n• 代理设置问题';
        } else if (errorMsg.includes('API')) {
          userMessage = '❌ API配置错误\n\n请检查【设置→AI】中的百度API配置：\n• API Key是否正确\n• Secret Key是否正确\n• 是否已开通图像识别服务';
        } else {
          userMessage = `❌ 验证失败\n\n错误信息：${errorMsg}\n\n请检查：\n• 百度API配置（设置→AI）\n• 网络连接\n• 图片质量`;
        }
        
        setVerificationMessage(userMessage);
        setVerificationSuccess(false);
        setIsUploading(false);
      }
    };
    
    input.click();
  }, [hasVerification, startKeywords, scheduledStart, scheduledEnd, goldReward, addGold, taskId, taskTitle, onStart]);

  // 完成任务（无验证直接完成，有验证需上传照片）
  const handleCompleteTask = useCallback(async (useCamera: boolean = false) => {
    if (!hasVerification) {
      // 无验证：直接完成任务
      const now = new Date();
      
      // 计算是否提前完成（奖励50%）
      const scheduledEndTime = new Date(scheduledEnd);
      const isEarly = now < scheduledEndTime;
      
      if (isEarly) {
        const bonusGold = Math.floor(goldReward * 0.5);
        addGold(bonusGold, `提前完成任务（奖励50%）`, taskId, taskTitle);
        console.log(`✅ 提前完成任务，获得${bonusGold}金币奖励`);
      }
      
      // 扣除超时惩罚金
      const totalPenalty = Math.floor(goldReward * 0.2) * state.completeTimeoutCount;
      if (totalPenalty > 0) {
        console.log(`⚠️ 累计扣除${totalPenalty}金币（${state.completeTimeoutCount}次超时）`);
      }
      
      setState(prev => ({
        ...prev,
        status: 'completed',
      }));
      
      // 通知父组件更新结束时间
      if (onComplete) {
        onComplete(now);
      }
      
      // 清除持久化状态
      localStorage.removeItem(storageKey);
      console.log(`✅ 完成任务: ${taskTitle}`);
      return;
    }
    
    // 有验证：上传照片并验证
    setState(prev => ({ ...prev, status: 'uploading_complete' }));
    setIsUploading(true);
    setVerificationMessage('');
    setVerificationSuccess(null);
    
    // 创建文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) {
      input.capture = 'environment' as any; // 直接打开相机
    }
    
    // 处理用户点击叉叉取消上传
    input.oncancel = () => {
      console.log('❌ 用户取消上传，返回任务倒计时');
      setState(prev => ({ ...prev, status: 'task_countdown' }));
      setIsUploading(false);
      setVerificationMessage('');
      setVerificationSuccess(null);
    };
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.log('❌ 未选择文件，返回任务倒计时');
        setState(prev => ({ ...prev, status: 'task_countdown' }));
        setIsUploading(false);
        setVerificationMessage('');
        setVerificationSuccess(null);
        return;
      }
      
      try {
        setVerificationMessage('📤 正在上传图片...');
        console.log('📷 [百度API] 开始识别');
        setVerificationMessage('📤 正在上传图片...');
        
        // 添加超时控制：10秒超时
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.error('❌ [百度API] 验证超时（10秒）');
            reject(new Error('TIMEOUT'));
          }, 10000);
        });
        
        // 1. 压缩并上传图片
        const compressedFile = await ImageUploader.compressImage(file);
        setVerificationMessage('📤 图片上传中...');
        
        const uploadedImageUrl = await ImageUploader.uploadImage(compressedFile);
        
        if (!uploadedImageUrl) {
          setVerificationMessage('❌ 照片上传失败，请重新拍摄');
          setVerificationSuccess(false);
          setIsUploading(false);
          console.log('❌ [百度API] 照片上传失败');
          return;
        }
        
        setVerificationMessage('🔗 正在连接百度AI...');
        
        // 2. 调用百度API验证（从localStorage读取用户设置的阈值）
        // 使用Promise.race实现超时控制
        const savedThreshold = localStorage.getItem('baidu_verification_threshold');
        const threshold = savedThreshold ? parseFloat(savedThreshold) : 0.3; // 默认0.3
        
        console.log(`🎯 [百度API] 使用验证阈值: ${(threshold * 100).toFixed(0)}%`);
        
        const verifyResult = await Promise.race([
          (async () => {
            setVerificationMessage('🤖 百度AI识别中...');
            await new Promise(resolve => setTimeout(resolve, 300)); // 短暂延迟
            
            const result = await baiduImageRecognition.smartVerifyImage(
              file,
              completeKeywords,
              threshold  // 使用用户设置的阈值
            );
            
            setVerificationMessage('✨ AI分析完成，正在匹配关键词...');
            await new Promise(resolve => setTimeout(resolve, 300)); // 短暂延迟
            return result;
          })(),
          timeoutPromise
        ]) as any;
        
        console.log('📷 [百度API] 验证结果:', verifyResult);
        
        if (!verifyResult.success) {
          setVerificationMessage(verifyResult.description || `❌ 验证未通过，请重新拍摄（需包含：${completeKeywords.join('、')}）`);
          setVerificationSuccess(false);
          setIsUploading(false);
          // 保持在uploading_complete状态，不要回到task_countdown
          console.log(`❌ [百度API] 识别失败:`, verifyResult.matchDetails);
          if (verifyResult.suggestions) {
            console.log('💡 拍摄建议:', verifyResult.suggestions.join('\n'));
          }
          return;
        }
        
        // 3. 验证成功，自动完成任务
        const now = new Date();
        
        const recognizedItems = verifyResult.matchedKeywords?.join('、') || '相关内容';
        setVerificationMessage(`✅ 验证成功！已识别到：${recognizedItems}`);
        setVerificationSuccess(true);
        console.log(`✅ [百度API] 识别成功，匹配关键词：${recognizedItems}`);
        console.log('📝 详细匹配信息:', verifyResult.matchDetails);
        
        // 计算是否提前完成（奖励50%）
        const scheduledEndTime = new Date(scheduledEnd);
        const isEarly = now < scheduledEndTime;
        
        if (isEarly) {
          const bonusGold = Math.floor(goldReward * 0.5);
          addGold(bonusGold, `提前完成任务（奖励50%）`, taskId, taskTitle);
          console.log(`✅ 提前完成任务，获得${bonusGold}金币奖励`);
        }
        
        // 扣除超时惩罚金
        const totalPenalty = Math.floor(goldReward * 0.2) * state.completeTimeoutCount;
        if (totalPenalty > 0) {
          console.log(`⚠️ 累计扣除${totalPenalty}金币（${state.completeTimeoutCount}次超时）`);
        }
        
        // 触发语音播报和通知
        notificationService.notifyVerificationSuccess(taskTitle, 'completion');
        
        // 延迟2秒后完成任务，让用户看到验证成功消息
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            status: 'completed',
          }));
          
          setIsUploading(false);
          setVerificationMessage('');
          setVerificationSuccess(null);
          
          // 通知父组件更新结束时间
          if (onComplete) {
            onComplete(now);
          }
          
          // 清除持久化状态
          localStorage.removeItem(storageKey);
          console.log(`✅ 完成验证成功: ${taskTitle}`);
        }, 2000);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        console.error('❌ [百度API] 验证异常:', error);
        
        // 根据错误类型给出详细的提示
        let userMessage = '';
        if (errorMsg === 'TIMEOUT') {
          userMessage = '❌ 验证超时（10秒）\n\n可能原因：\n1️⃣ 百度API未配置\n   • 请前往【设置→AI】配置百度API\n   • 需要填写API Key和Secret Key\n\n2️⃣ 网络连接问题\n   • 请检查网络连接\n   • 尝试切换网络后重试\n\n3️⃣ 百度服务响应慢\n   • 请稍后重试\n\n💡 提示：如果持续失败，请检查API配置是否正确';
        } else if (errorMsg.includes('网络')) {
          userMessage = '❌ 网络错误\n\n请检查网络连接后重试\n\n如果网络正常，可能是：\n• 百度API配置错误\n• 防火墙拦截\n• 代理设置问题';
        } else if (errorMsg.includes('API')) {
          userMessage = '❌ API配置错误\n\n请检查【设置→AI】中的百度API配置：\n• API Key是否正确\n• Secret Key是否正确\n• 是否已开通图像识别服务';
        } else {
          userMessage = `❌ 验证失败\n\n错误信息：${errorMsg}\n\n请检查：\n• 百度API配置（设置→AI）\n• 网络连接\n• 图片质量`;
        }
        
        setVerificationMessage(userMessage);
        setVerificationSuccess(false);
        setIsUploading(false);
      }
    };
    
    input.click();
  }, [hasVerification, completeKeywords, scheduledEnd, goldReward, addGold, state.completeTimeoutCount, taskId, taskTitle, onComplete, storageKey]);

  // 格式化倒计时显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 等待启动状态：显示提前启动按钮
  if (state.status === 'waiting_start') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent">
        {/* 提示文字 */}
        <div className="text-xs font-medium mb-2 text-gray-500">
          任务尚未开始，可以提前启动
        </div>
        
        {/* 提前启动按钮 - 无验证任务 */}
        {!hasVerification && (
          <button 
            onClick={() => handleStartTask()}
            className="px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: '#10B981',
              color: '#ffffff',
            }}
          >
            <span>✅</span>
            <span>提前启动</span>
          </button>
        )}
        
        {/* 提前启动按钮 - 验证任务 */}
        {hasVerification && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleStartTask(true)}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#3B82F6',
                color: '#ffffff',
              }}
            >
              <span>📷</span>
              <span>拍摄照片</span>
            </button>
            <button 
              onClick={() => handleStartTask(false)}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
              }}
            >
              <span>🖼️</span>
              <span>上传照片</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 启动倒计时阶段（2分钟）
  if (state.status === 'start_countdown') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角拖延标记 */}
        {state.startTimeoutCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 shadow-sm">
            <span className="text-base">🐢</span>
            <span className="text-xs font-bold text-yellow-800">拖延 {state.startTimeoutCount} 次</span>
          </div>
        )}
        
        {/* 顶部状态文字 */}
        <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#666' }}>
          <span>⏰</span>
          <span>启动倒计时</span>
        </div>
        
        {/* 启动倒计时（无背景） */}
        <div 
          className="text-4xl font-black mb-2 px-2 py-1"
          style={{
            color: '#000000',
          }}
        >
          {formatTime(startCountdownLeft)}
        </div>
        
        {/* 超时惩罚提示 */}
        {state.startTimeoutCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-red-500 shadow-lg mb-2">
            <span className="text-sm">⚠️</span>
            <p className="text-white text-xs font-bold">
              已扣除 {Math.floor(goldReward * 0.2) * state.startTimeoutCount} 金币（{state.startTimeoutCount}次超时）
            </p>
          </div>
        )}
        
        {/* 验证关键词提示（醒目样式） */}
        {hasVerification && startKeywords.length > 0 && (
          <div className="mb-2 px-4 py-2 rounded-lg shadow-md" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <p className="text-xs font-semibold text-center" style={{ color: '#92400E' }}>
              📷 请拍摄包含：<span className="font-bold">{startKeywords.join(' / ')}</span> 的照片
            </p>
          </div>
        )}
        
        {/* 启动按钮 - 仅无验证任务显示 */}
        {!hasVerification && (
          <button 
            onClick={handleStartTask}
            disabled={isUploading}
            className="px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-1.5"
            style={{
              backgroundColor: '#10B981',
              color: '#ffffff',
            }}
          >
            <span>✅</span>
            <span>启动任务</span>
          </button>
        )}
        
        {/* 上传照片按钮 - 仅验证任务显示 */}
        {hasVerification && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleStartTask(true)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#3B82F6',
                color: '#ffffff',
              }}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>📷</span>
                  <span>拍摄照片</span>
                </>
              )}
            </button>
            <button 
              onClick={() => handleStartTask(false)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
              }}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>🖼️</span>
                  <span>上传照片</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 上传启动验证中 - 在卡片内显示
  if (state.status === 'uploading_start') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角拖延标记 */}
        {state.startTimeoutCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 shadow-sm">
            <span className="text-base">🐢</span>
            <span className="text-xs font-bold text-yellow-800">拖延 {state.startTimeoutCount} 次</span>
          </div>
        )}
        
        {/* 顶部状态文字 */}
        <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#666' }}>
          <span>⏰</span>
          <span>启动倒计时</span>
        </div>
        
        {/* 启动倒计时（无背景） */}
        <div 
          className="text-4xl font-black mb-2 px-2 py-1"
          style={{
            color: '#000000',
          }}
        >
          {formatTime(startCountdownLeft)}
        </div>
        
        {/* 验证状态提示 */}
        <div className="mb-2 px-4 py-2 rounded-lg shadow-md flex items-center gap-2" 
             style={{ 
               backgroundColor: verificationSuccess === false ? '#FEE2E2' : '#DBEAFE', 
               border: verificationSuccess === false ? '1px solid #FCA5A5' : '1px solid #93C5FD' 
             }}>
          {verificationSuccess === null && (
            <>
              <span className="animate-spin text-lg">⏳</span>
              <p className="text-xs font-semibold" style={{ color: '#1E40AF' }}>
                {verificationMessage || '正在验证中，请稍后...'}
              </p>
            </>
          )}
          {verificationSuccess === true && (
            <>
              <span className="text-lg">✅</span>
              <p className="text-xs font-semibold" style={{ color: '#065F46' }}>
                {verificationMessage}
              </p>
            </>
          )}
          {verificationSuccess === false && (
            <>
              <span className="text-lg">❌</span>
              <p className="text-xs font-semibold" style={{ color: '#991B1B' }}>
                {verificationMessage}
              </p>
            </>
          )}
        </div>
        
        {/* 上传照片按钮 - 验证失败时可重新上传 */}
        {verificationSuccess === false && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleStartTask(true)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#3B82F6',
                color: '#ffffff',
              }}
            >
              <span>📷</span>
              <span>重新拍摄</span>
            </button>
            <button 
              onClick={() => handleStartTask(false)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
              }}
            >
              <span>🖼️</span>
              <span>重新上传</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 任务倒计时阶段（任务总时长）
  if (state.status === 'task_countdown') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角超时标记 */}
        {state.completeTimeoutCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 border border-red-400 shadow-sm">
            <span className="text-base">⚠️</span>
            <span className="text-xs font-bold text-red-800">超时 {state.completeTimeoutCount} 次</span>
          </div>
        )}
        
        {/* 顶部状态文字 */}
        <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#666' }}>
          <span>⏱️</span>
          <span>任务剩余</span>
        </div>
        
        {/* 任务倒计时（无背景） */}
        <div 
          className="text-4xl font-black mb-2 px-2 py-1"
          style={{
            color: '#000000',
          }}
        >
          {formatTime(taskCountdownLeft)}
        </div>
        
        {/* 超时惩罚提示 */}
        {state.completeTimeoutCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-red-500 shadow-lg mb-2">
            <span className="text-sm">⚠️</span>
            <p className="text-white text-xs font-bold">
              已扣除 {Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 金币（{state.completeTimeoutCount}次超时）
            </p>
          </div>
        )}
        
        {/* 验证关键词提示（醒目样式） */}
        {hasVerification && completeKeywords.length > 0 && (
          <div className="mb-2 px-4 py-2 rounded-lg shadow-md" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <p className="text-xs font-semibold text-center" style={{ color: '#92400E' }}>
              📷 请拍摄包含：<span className="font-bold">{completeKeywords.join(' / ')}</span> 的照片
            </p>
          </div>
        )}
        
        {/* 完成按钮 - 仅无验证任务显示 */}
        {!hasVerification && (
          <button 
            onClick={handleCompleteTask}
            disabled={isUploading}
            className="px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-1.5"
            style={{
              backgroundColor: '#10B981',
              color: '#ffffff',
            }}
          >
            <span>✅</span>
            <span>完成任务</span>
          </button>
        )}
        
        {/* 上传照片按钮 - 仅验证任务显示 */}
        {hasVerification && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleCompleteTask(true)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#3B82F6',
                color: '#ffffff',
              }}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>📷</span>
                  <span>拍摄照片</span>
                </>
              )}
            </button>
            <button 
              onClick={() => handleCompleteTask(false)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
              }}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>🖼️</span>
                  <span>上传照片</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 上传完成验证中 - 在卡片内显示
  if (state.status === 'uploading_complete') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角超时标记 */}
        {state.completeTimeoutCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 border border-red-400 shadow-sm">
            <span className="text-base">⚠️</span>
            <span className="text-xs font-bold text-red-800">超时 {state.completeTimeoutCount} 次</span>
          </div>
        )}
        
        {/* 顶部状态文字 */}
        <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#666' }}>
          <span>⏱️</span>
          <span>任务剩余</span>
        </div>
        
        {/* 任务倒计时（无背景） */}
        <div 
          className="text-4xl font-black mb-2 px-2 py-1"
          style={{
            color: '#000000',
          }}
        >
          {formatTime(taskCountdownLeft)}
        </div>
        
        {/* 验证状态提示 */}
        <div className="mb-2 px-4 py-2 rounded-lg shadow-md flex items-center gap-2" 
             style={{ 
               backgroundColor: verificationSuccess === false ? '#FEE2E2' : '#DBEAFE', 
               border: verificationSuccess === false ? '1px solid #FCA5A5' : '1px solid #93C5FD' 
             }}>
          {verificationSuccess === null && (
            <>
              <span className="animate-spin text-lg">⏳</span>
              <p className="text-xs font-semibold" style={{ color: '#1E40AF' }}>
                {verificationMessage || '正在验证中，请稍后...'}
              </p>
            </>
          )}
          {verificationSuccess === true && (
            <>
              <span className="text-lg">✅</span>
              <p className="text-xs font-semibold" style={{ color: '#065F46' }}>
                {verificationMessage}
              </p>
            </>
          )}
          {verificationSuccess === false && (
            <>
              <span className="text-lg">❌</span>
              <p className="text-xs font-semibold" style={{ color: '#991B1B' }}>
                {verificationMessage}
              </p>
            </>
          )}
        </div>
        
        {/* 上传照片按钮 - 验证失败时可重新上传 */}
        {verificationSuccess === false && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleCompleteTask(true)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#3B82F6',
                color: '#ffffff',
              }}
            >
              <span>📷</span>
              <span>重新拍摄</span>
            </button>
            <button 
              onClick={() => handleCompleteTask(false)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
              }}
            >
              <span>🖼️</span>
              <span>重新上传</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 已完成状态：不显示
  return null;
}