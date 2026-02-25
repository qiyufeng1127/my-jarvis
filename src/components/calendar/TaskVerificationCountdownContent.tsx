import React, { useState, useEffect, useCallback } from 'react';
import { useGoldStore } from '@/stores/goldStore';
import { ImageUploader } from '@/services/taskVerificationService';
import { notificationService } from '@/services/notificationService';
import VerificationFeedback, { VerificationLog } from '@/components/shared/VerificationFeedback';
import TaskCompletionCelebration from '@/components/shared/TaskCompletionCelebration';

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
  const [showBadHabitHistory, setShowBadHabitHistory] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationGold, setCelebrationGold] = useState(0);
  
  // 验证流程日志（用于实时反馈）
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  
  // 添加验证日志
  const addVerificationLog = useCallback((message: string, type: VerificationLog['type']) => {
    const log: VerificationLog = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date(),
    };
    setVerificationLogs(prev => [...prev, log]);
  }, []);
  
  // 清空验证日志
  const clearVerificationLogs = useCallback(() => {
    setVerificationLogs([]);
  }, []);
  
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
      
      // 触发超时提醒
      notificationService.notifyOvertime(taskTitle, 'start');
      
      // 触发扣币提醒
      notificationService.notifyGoldDeducted(`${taskTitle} 启动超时`, penaltyAmount);
      
      // 触发拖延提醒
      notificationService.notifyProcrastination(taskTitle, state.startTimeoutCount + 1);
      
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
      
      // 触发超时提醒
      notificationService.notifyOvertime(taskTitle, 'completion');
      
      // 触发扣币提醒
      notificationService.notifyGoldDeducted(`${taskTitle} 完成超时`, penaltyAmount);
      
      // 触发拖延提醒
      notificationService.notifyProcrastination(taskTitle, state.completeTimeoutCount + 1);
      
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
  
  // 任务即将结束提醒（完全遵循用户设置）
  useEffect(() => {
    if (state.status !== 'task_countdown') {
      return;
    }
    
    // 从 localStorage 读取用户设置
    const settingsStr = localStorage.getItem('notification_settings');
    if (!settingsStr) {
      return;
    }
    
    try {
      const settings = JSON.parse(settingsStr);
      
      // 检查是否开启了任务结束前提醒
      if (!settings.taskEndBeforeReminder) {
        console.log('⏭️ 任务结束前提醒已关闭（用户设置）');
        return;
      }
      
      // 获取用户设置的提醒时间（分钟）
      const reminderMinutes = settings.taskEndBeforeMinutes || 5;
      
      // 只在用户设置的时间点提醒（转换为秒）
      if (taskCountdownLeft === reminderMinutes * 60) {
        console.log(`⏰ 任务即将结束（${reminderMinutes}分钟）- 遵循用户设置: ${taskTitle}`);
        notificationService.notifyTaskEnding(taskTitle, reminderMinutes, hasVerification);
      }
    } catch (error) {
      console.error('读取通知设置失败:', error);
    }
  }, [state.status, taskCountdownLeft, taskTitle, hasVerification]);

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
      
      const newState = {
        ...state,
        status: 'task_countdown' as CountdownStatus,
        taskDeadline: new Date(now.getTime() + taskSeconds * 1000).toISOString(),
        actualStartTime: now.toISOString(),
      };
      setState(newState);
      saveState(newState);
      
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
    const newState = { ...state, status: 'uploading_start' as CountdownStatus };
    setState(newState);
    saveState(newState);
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
      const cancelState = state.status === 'waiting_start' 
        ? { ...state, status: 'waiting_start' as CountdownStatus }
        : { ...state, status: 'start_countdown' as CountdownStatus };
      setState(cancelState);
      saveState(cancelState);
      setIsUploading(false);
      setVerificationMessage('');
      setVerificationSuccess(null);
    };
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.log('❌ 未选择文件，返回启动倒计时');
        const cancelState = state.status === 'waiting_start' 
          ? { ...state, status: 'waiting_start' as CountdownStatus }
          : { ...state, status: 'start_countdown' as CountdownStatus };
        setState(cancelState);
        saveState(cancelState);
        setIsUploading(false);
        setVerificationMessage('');
        setVerificationSuccess(null);
        return;
      }
      
      try {
        console.log('📷 [Vercel API] 开始识别');
        console.log('📷 [Vercel API] 关键词:', startKeywords);
        setVerificationMessage('📤 正在上传图片...');
        
        // 检查百度API配置
        const apiKey = localStorage.getItem('baidu_api_key');
        const secretKey = localStorage.getItem('baidu_secret_key');
        console.log('📷 [Vercel API] 配置检查:', {
          hasApiKey: !!apiKey,
          hasSecretKey: !!secretKey,
          apiKeyLength: apiKey?.length || 0,
        });
        
        if (!apiKey || !secretKey) {
          throw new Error('百度API未配置');
        }
        
        // 添加超时控制：30秒超时
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.error('❌ [Vercel API] 验证超时（30秒）');
            reject(new Error('TIMEOUT'));
          }, 30000);
        });
        
        // 1. 将图片转换为 base64
        const reader = new FileReader();
        const imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        setVerificationMessage('🔗 正在连接百度AI...');
        
        // 2. 调用 Vercel Serverless API 验证
        const verifyResult = await Promise.race([
          (async () => {
            setVerificationMessage('🤖 百度AI识别中...');
            
            console.log('📷 [Vercel API] 调用 /api/baidu-image-recognition');
            const response = await fetch('/api/baidu-image-recognition', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image: imageBase64,
                keywords: startKeywords,
                apiKey: apiKey,
                secretKey: secretKey,
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ [Vercel API] 请求失败:', response.status, errorText);
              throw new Error(`API请求失败: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📷 [Vercel API] 返回结果:', result);
            
            setVerificationMessage('✨ AI分析完成，正在匹配关键词...');
            await new Promise(resolve => setTimeout(resolve, 300));
            return result;
          })(),
          timeoutPromise
        ]) as any;
        
        console.log('📷 [Vercel API] 验证结果:', verifyResult);
        
        if (!verifyResult.success) {
          // 验证失败：扣金币，返回倒计时，重置为2分钟
          const penaltyAmount = Math.floor(goldReward * 0.2);
          penaltyGold(penaltyAmount, `启动验证失败（第${state.startTimeoutCount + 1}次）`, taskId, taskTitle);
          console.log(`❌ 启动验证失败！扣除${penaltyAmount}金币`);
          
          // 🔧 修复：立即返回启动倒计时状态，重置为2分钟，确保倒计时继续运行
          const newDeadline = new Date(Date.now() + 2 * 60 * 1000);
          const newState = {
            ...state,
            status: 'start_countdown' as CountdownStatus,
            startDeadline: newDeadline.toISOString(),
            startTimeoutCount: state.startTimeoutCount + 1,
          };
          setState(newState);
          saveState(newState);
          
          // 显示验证失败消息
          setVerificationMessage(verifyResult.message || `❌ 验证未通过（需包含：${startKeywords.join('、')}）`);
          setVerificationSuccess(false);
          
          console.log(`❌ [Vercel API] 识别失败:`, verifyResult);
          
          // 🔧 修复：立即结束上传状态，返回倒计时界面
          setIsUploading(false);
          
          // 3秒后清除错误消息
          setTimeout(() => {
            setVerificationMessage('');
            setVerificationSuccess(null);
          }, 3000);
          
          return;
        }
        
        // 3. 验证成功，自动进入任务倒计时
        const now = new Date();
        const duration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
        const taskSeconds = duration * 60;
        
        const recognizedItems = verifyResult.matchedKeywords?.join('、') || verifyResult.recognizedObjects?.join('、') || '相关内容';
        setVerificationMessage(`✅ 验证成功！已识别到：${recognizedItems}`);
        setVerificationSuccess(true);
        console.log(`✅ [Vercel API] 识别成功，匹配关键词：${recognizedItems}`);
        console.log('📝 详细匹配信息:', verifyResult);
        
        // 2分钟内完成启动，奖励50%金币
        const bonusGold = Math.floor(goldReward * 0.5);
        addGold(bonusGold, `按时启动任务（奖励50%）`, taskId, taskTitle);
        console.log(`✅ 按时启动任务，获得${bonusGold}金币奖励`);
        
        // 触发语音播报和通知
        notificationService.notifyVerificationSuccess(taskTitle, 'start');
        
        // 延迟2秒后进入任务倒计时，让用户看到验证成功消息
        setTimeout(() => {
          const newState = {
            ...state,
            status: 'task_countdown' as CountdownStatus,
            taskDeadline: new Date(now.getTime() + taskSeconds * 1000).toISOString(),
            actualStartTime: now.toISOString(),
          };
          setState(newState);
          saveState(newState);
          
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
        console.error('❌ [Vercel API] 验证异常:', error);
        
        // 🔧 修复：验证异常时，立即返回启动倒计时状态，重置为2分钟
        const newDeadline = new Date(Date.now() + 2 * 60 * 1000);
        const newState = {
          ...state,
          status: 'start_countdown' as CountdownStatus,
          startDeadline: newDeadline.toISOString(),
          startTimeoutCount: state.startTimeoutCount + 1,
        };
        setState(newState);
        saveState(newState);
        
        // 扣除金币
        const penaltyAmount = Math.floor(goldReward * 0.2);
        penaltyGold(penaltyAmount, `启动验证异常（第${state.startTimeoutCount + 1}次）`, taskId, taskTitle);
        
        // 根据错误类型给出详细的提示
        let userMessage = '';
        if (errorMsg === 'TIMEOUT') {
          userMessage = '❌ 验证超时（30秒）\n\n可能原因：\n1️⃣ 百度API未配置\n   • 请前往【设置→AI】配置百度API\n   • 需要填写API Key和Secret Key\n\n2️⃣ 网络连接问题\n   • 请检查网络连接\n   • 尝试切换网络后重试\n\n3️⃣ 百度服务响应慢\n   • 请稍后重试\n\n💡 提示：如果持续失败，请检查API配置是否正确';
        } else if (errorMsg.includes('网络')) {
          userMessage = '❌ 网络错误\n\n请检查网络连接后重试\n\n如果网络正常，可能是：\n• 百度API配置错误\n• 防火墙拦截\n• 代理设置问题';
        } else if (errorMsg.includes('API')) {
          userMessage = '❌ API配置错误\n\n请检查【设置→AI】中的百度API配置：\n• API Key是否正确\n• Secret Key是否正确\n• 是否已开通图像识别服务';
        } else {
          userMessage = `❌ 验证失败\n\n错误信息：${errorMsg}\n\n请检查：\n• 百度API配置（设置→AI）\n• 网络连接\n• 图片质量`;
        }
        
        setVerificationMessage(userMessage);
        setVerificationSuccess(false);
        
        // 🔧 修复：立即结束上传状态，返回倒计时界面
        setIsUploading(false);
        
        // 5秒后清除错误消息
        setTimeout(() => {
          setVerificationMessage('');
          setVerificationSuccess(null);
        }, 5000);
      }
    };
    
    input.click();
  }, [hasVerification, startKeywords, scheduledStart, scheduledEnd, goldReward, addGold, taskId, taskTitle, onStart]);

  // 完成任务（无验证直接完成，有验证需上传照片）
  const handleCompleteTask = useCallback(async (useCamera: boolean = false) => {
    if (!hasVerification) {
      // 无验证：直接完成任务
      const now = new Date();
      
      // 🎯 动态更新完成时间：如果提前完成，使用当前时间作为结束时间
      const scheduledEndTime = new Date(scheduledEnd);
      const isEarly = now < scheduledEndTime;
      
      if (isEarly) {
        const bonusGold = Math.floor(goldReward * 0.5);
        addGold(bonusGold, `提前完成任务（奖励50%）`, taskId, taskTitle);
        console.log(`✅ 提前完成任务，获得${bonusGold}金币奖励`);
        
        // 显示庆祝特效
        setCelebrationGold(bonusGold);
        setShowCelebration(true);
        
        // 触发金币获得通知
        notificationService.notifyGoldEarned(taskTitle, bonusGold);
      }
      
      // 扣除超时惩罚金
      const totalPenalty = Math.floor(goldReward * 0.2) * state.completeTimeoutCount;
      if (totalPenalty > 0) {
        console.log(`⚠️ 累计扣除${totalPenalty}金币（${state.completeTimeoutCount}次超时）`);
      }
      
      const newState = {
        ...state,
        status: 'completed' as CountdownStatus,
      };
      setState(newState);
      saveState(newState);
      
      // 🎯 通知父组件更新结束时间（使用当前时间，实现动态完成）
      if (onComplete) {
        onComplete(now);
        console.log(`📅 任务完成时间已更新: ${now.toLocaleString('zh-CN')}`);
      }
      
      // 清除持久化状态
      localStorage.removeItem(storageKey);
      console.log(`✅ 完成任务: ${taskTitle}`);
      return;
    }
    
    // 有验证：上传照片并验证
    const newState = { ...state, status: 'uploading_complete' as CountdownStatus };
    setState(newState);
    saveState(newState);
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
      const newState = { ...state, status: 'task_countdown' as CountdownStatus };
      setState(newState);
      saveState(newState);
      setIsUploading(false);
      setVerificationMessage('');
      setVerificationSuccess(null);
    };
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.log('❌ 未选择文件，返回任务倒计时');
        const newState = { ...state, status: 'task_countdown' as CountdownStatus };
        setState(newState);
        saveState(newState);
        setIsUploading(false);
        setVerificationMessage('');
        setVerificationSuccess(null);
        return;
      }
      
      try {
        console.log('📷 [Vercel API] 开始识别');
        console.log('📷 [Vercel API] 关键词:', completeKeywords);
        
        // 检查百度API配置
        const apiKey = localStorage.getItem('baidu_api_key');
        const secretKey = localStorage.getItem('baidu_secret_key');
        
        console.log('📷 [Vercel API] 配置检查:', {
          hasApiKey: !!apiKey,
          hasSecretKey: !!secretKey,
          apiKeyLength: apiKey?.length || 0,
        });
        
        if (!apiKey || !secretKey) {
          throw new Error('百度API未配置');
        }
        
        setVerificationMessage('📤 正在上传图片...');
        
        // 添加超时控制：30秒超时
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.error('❌ [Vercel API] 验证超时（30秒）');
            reject(new Error('TIMEOUT'));
          }, 30000);
        });
        
        // 1. 将图片转换为 base64
        const reader = new FileReader();
        const imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        setVerificationMessage('🔗 正在连接百度AI...');
        
        // 2. 调用 Vercel Serverless API 验证
        const verifyResult = await Promise.race([
          (async () => {
            setVerificationMessage('🤖 百度AI识别中...');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            console.log('📷 [Vercel API] 调用 /api/baidu-image-recognition');
            const response = await fetch('/api/baidu-image-recognition', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image: imageBase64,
                keywords: completeKeywords,
                apiKey: apiKey,
                secretKey: secretKey,
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ [Vercel API] 请求失败:', response.status, errorText);
              throw new Error(`API请求失败: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📷 [Vercel API] 返回结果:', result);
            
            setVerificationMessage('✨ AI分析完成，正在匹配关键词...');
            await new Promise(resolve => setTimeout(resolve, 300));
            return result;
          })(),
          timeoutPromise
        ]) as any;
        
        console.log('📷 [Vercel API] 验证结果:', verifyResult);
        
        if (!verifyResult.success) {
          // 验证失败：扣金币，返回倒计时，重置为10分钟
          const penaltyAmount = Math.floor(goldReward * 0.2);
          penaltyGold(penaltyAmount, `完成验证失败（第${state.completeTimeoutCount + 1}次）`, taskId, taskTitle);
          console.log(`❌ 完成验证失败！扣除${penaltyAmount}金币`);
          
          // 🔧 修复：立即返回任务倒计时状态，重置为10分钟，确保倒计时继续运行
          const newDeadline = new Date(Date.now() + 10 * 60 * 1000);
          const newState = {
            ...state,
            status: 'task_countdown' as CountdownStatus,
            taskDeadline: newDeadline.toISOString(),
            completeTimeoutCount: state.completeTimeoutCount + 1,
          };
          setState(newState);
          saveState(newState);
          
          // 显示验证失败消息
          setVerificationMessage(verifyResult.message || `❌ 验证未通过（需包含：${completeKeywords.join('、')}）`);
          setVerificationSuccess(false);
          
          console.log(`❌ [Vercel API] 识别失败:`, verifyResult);
          
          // 🔧 修复：立即结束上传状态，返回倒计时界面
          setIsUploading(false);
          
          // 3秒后清除错误消息
          setTimeout(() => {
            setVerificationMessage('');
            setVerificationSuccess(null);
          }, 3000);
          
          return;
        }
        
        // 3. 验证成功，自动完成任务
        const now = new Date();
        
        const recognizedItems = verifyResult.matchedKeywords?.join('、') || verifyResult.recognizedObjects?.join('、') || '相关内容';
        setVerificationMessage(`✅ 验证成功！已识别到：${recognizedItems}`);
        setVerificationSuccess(true);
        console.log(`✅ [Vercel API] 识别成功，匹配关键词：${recognizedItems}`);
        console.log('📝 详细匹配信息:', verifyResult);
        
        // 🎯 动态更新完成时间：如果提前完成，使用当前时间作为结束时间
        const scheduledEndTime = new Date(scheduledEnd);
        const isEarly = now < scheduledEndTime;
        
        if (isEarly) {
          const bonusGold = Math.floor(goldReward * 0.5);
          addGold(bonusGold, `提前完成任务（奖励50%）`, taskId, taskTitle);
          console.log(`✅ 提前完成任务，获得${bonusGold}金币奖励`);
          
          // 显示庆祝特效
          setCelebrationGold(bonusGold);
          setShowCelebration(true);
          
          // 触发金币获得通知
          notificationService.notifyGoldEarned(taskTitle, bonusGold);
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
          const newState = {
            ...state,
            status: 'completed' as CountdownStatus,
          };
          setState(newState);
          saveState(newState);
          
          setIsUploading(false);
          setVerificationMessage('');
          setVerificationSuccess(null);
          
          // 🎯 通知父组件更新结束时间（使用当前时间，实现动态完成）
          if (onComplete) {
            onComplete(now);
            console.log(`📅 任务完成时间已更新: ${now.toLocaleString('zh-CN')}`);
          }
          
          // 清除持久化状态
          localStorage.removeItem(storageKey);
          console.log(`✅ 完成验证成功: ${taskTitle}`);
        }, 2000);
        
        // 触发语音播报和通知
        notificationService.notifyVerificationSuccess(taskTitle, 'completion');
        
        // 延迟2秒后完成任务，让用户看到验证成功消息
        setTimeout(() => {
          const newState = {
            ...state,
            status: 'completed' as CountdownStatus,
          };
          setState(newState);
          saveState(newState);
          
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
        console.error('❌ [Vercel API] 验证异常:', error);
        
        // 🔧 修复：验证异常时，立即返回任务倒计时状态，重置为10分钟
        const newDeadline = new Date(Date.now() + 10 * 60 * 1000);
        const newState = {
          ...state,
          status: 'task_countdown' as CountdownStatus,
          taskDeadline: newDeadline.toISOString(),
          completeTimeoutCount: state.completeTimeoutCount + 1,
        };
        setState(newState);
        saveState(newState);
        
        // 扣除金币
        const penaltyAmount = Math.floor(goldReward * 0.2);
        penaltyGold(penaltyAmount, `完成验证异常（第${state.completeTimeoutCount + 1}次）`, taskId, taskTitle);
        
        // 根据错误类型给出详细的提示
        let userMessage = '';
        if (errorMsg === 'TIMEOUT') {
          userMessage = '❌ 验证超时（30秒）\n\n可能原因：\n1️⃣ 百度API未配置\n   • 请前往【设置→AI】配置百度API\n   • 需要填写API Key和Secret Key\n\n2️⃣ 网络连接问题\n   • 请检查网络连接\n   • 尝试切换网络后重试\n\n3️⃣ 百度服务响应慢\n   • 请稍后重试\n\n💡 提示：如果持续失败，请检查API配置是否正确';
        } else if (errorMsg.includes('网络')) {
          userMessage = '❌ 网络错误\n\n请检查网络连接后重试\n\n如果网络正常，可能是：\n• 百度API配置错误\n• 防火墙拦截\n• 代理设置问题';
        } else if (errorMsg.includes('API')) {
          userMessage = '❌ API配置错误\n\n请检查【设置→AI】中的百度API配置：\n• API Key是否正确\n• Secret Key是否正确\n• 是否已开通图像识别服务';
        } else {
          userMessage = `❌ 验证失败\n\n错误信息：${errorMsg}\n\n请检查：\n• 百度API配置（设置→AI）\n• 网络连接\n• 图片质量`;
        }
        
        setVerificationMessage(userMessage);
        setVerificationSuccess(false);
        
        // 🔧 修复：立即结束上传状态，返回倒计时界面
        setIsUploading(false);
        
        // 5秒后清除错误消息
        setTimeout(() => {
          setVerificationMessage('');
          setVerificationSuccess(null);
        }, 5000);
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
        {/* 右上角按钮组 */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* 坏习惯历史按钮 */}
          {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 shadow-sm hover:bg-yellow-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">🐢</span>
              <span className="text-xs font-bold text-yellow-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
          )}
        </div>
        
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
        
        {/* 坏习惯历史弹窗 */}
        {showBadHabitHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🐢</span>
                  <span>坏习惯历史</span>
                </h3>
                <button
                  onClick={() => setShowBadHabitHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* 启动拖延记录 */}
                {state.startTimeoutCount > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐢</span>
                      <span className="font-semibold text-yellow-800">启动拖延</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                    </div>
                  </div>
                )}
                
                {/* 完成超时记录 */}
                {state.completeTimeoutCount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-red-800">完成超时</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                    </div>
                  </div>
                )}
                
                {/* 总计 */}
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                    </span>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  💡 按时完成验证可避免扣金币哦！
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 上传启动验证中 - 在卡片内显示
  if (state.status === 'uploading_start') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角按钮组 */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* 坏习惯历史按钮 */}
          {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 shadow-sm hover:bg-yellow-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">🐢</span>
              <span className="text-xs font-bold text-yellow-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
          )}
        </div>
        
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
        
        {/* 坏习惯历史弹窗 */}
        {showBadHabitHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🐢</span>
                  <span>坏习惯历史</span>
                </h3>
                <button
                  onClick={() => setShowBadHabitHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* 启动拖延记录 */}
                {state.startTimeoutCount > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐢</span>
                      <span className="font-semibold text-yellow-800">启动拖延</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                    </div>
                  </div>
                )}
                
                {/* 完成超时记录 */}
                {state.completeTimeoutCount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-red-800">完成超时</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                    </div>
                  </div>
                )}
                
                {/* 总计 */}
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                    </span>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  💡 按时完成验证可避免扣金币哦！
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 任务倒计时阶段（任务总时长）
  if (state.status === 'task_countdown') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角按钮组 */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* 坏习惯历史按钮 */}
          {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 border border-red-400 shadow-sm hover:bg-red-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">⚠️</span>
              <span className="text-xs font-bold text-red-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
          )}
        </div>
        
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
        
        {/* 坏习惯历史弹窗 */}
        {showBadHabitHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🐢</span>
                  <span>坏习惯历史</span>
                </h3>
                <button
                  onClick={() => setShowBadHabitHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* 启动拖延记录 */}
                {state.startTimeoutCount > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐢</span>
                      <span className="font-semibold text-yellow-800">启动拖延</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                    </div>
                  </div>
                )}
                
                {/* 完成超时记录 */}
                {state.completeTimeoutCount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-red-800">完成超时</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                    </div>
                  </div>
                )}
                
                {/* 总计 */}
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                    </span>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  💡 按时完成验证可避免扣金币哦！
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 上传完成验证中 - 在卡片内显示
  if (state.status === 'uploading_complete') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角按钮组 */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* 坏习惯历史按钮 */}
          {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 border border-red-400 shadow-sm hover:bg-red-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">⚠️</span>
              <span className="text-xs font-bold text-red-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
          )}
        </div>
        
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
        
        {/* 坏习惯历史弹窗 */}
        {showBadHabitHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🐢</span>
                  <span>坏习惯历史</span>
                </h3>
                <button
                  onClick={() => setShowBadHabitHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* 启动拖延记录 */}
                {state.startTimeoutCount > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐢</span>
                      <span className="font-semibold text-yellow-800">启动拖延</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                    </div>
                  </div>
                )}
                
                {/* 完成超时记录 */}
                {state.completeTimeoutCount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-red-800">完成超时</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                    </div>
                  </div>
                )}
                
                {/* 总计 */}
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                    </span>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  💡 按时完成验证可避免扣金币哦！
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 已完成状态：不显示
  return (
    <>
      {/* 任务完成庆祝特效 */}
      {showCelebration && (
        <TaskCompletionCelebration
          taskTitle={taskTitle}
          goldAmount={celebrationGold}
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </>
  );
}