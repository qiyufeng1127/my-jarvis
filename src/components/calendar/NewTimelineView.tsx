import { useState, useRef, useEffect } from 'react';
import { Plus, Camera, Check, ChevronDown, ChevronUp, Edit2, Trash2, GripVertical, Star, Clock, FileText, Upload, X } from 'lucide-react';
import type { Task } from '@/types';
import { 
  generateVerificationKeywords, 
  generateSubTasks, 
  SoundEffects, 
  ImageUploader,
  VoiceReminder,
  TaskMonitor,
  TaskTimeAdjuster,
  type TaskImage,
  type SubTask,
  type TaskVerification
} from '@/services/taskVerificationService';
import TaskVerificationDialog from './TaskVerificationDialog';
import NowTimeline from './NowTimeline';

interface NewTimelineViewProps {
  tasks: Task[];
  selectedDate: Date;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  bgColor?: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  isDark: boolean;
}

export default function NewTimelineView({
  tasks,
  selectedDate,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  bgColor = '#ffffff',
  textColor,
  accentColor,
  borderColor,
  isDark,
}: NewTimelineViewProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartTime, setDragStartTime] = useState<Date | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  
  // 新增状态
  const [taskImages, setTaskImages] = useState<Record<string, TaskImage[]>>({});
  const [taskSubTasks, setTaskSubTasks] = useState<Record<string, SubTask[]>>({});
  const [taskVerifications, setTaskVerifications] = useState<Record<string, TaskVerification>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [generatingSubTasks, setGeneratingSubTasks] = useState<string | null>(null);
  const [startingTask, setStartingTask] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [editingVerification, setEditingVerification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 判断颜色是否为深色
  const isColorDark = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };
  
  // 根据背景色获取文字颜色
  const getTextColor = (bgColor: string): string => {
    return isColorDark(bgColor) ? '#ffffff' : '#000000';
  };
  
  // 🎨 示例任务数据（仅用于预览效果）
  const [demoTasks, setDemoTasks] = useState<Task[]>([
    {
      id: 'demo-1',
      userId: 'demo',
      title: '起床穿好衣服',
      description: '早起第一件事',
      scheduledStart: new Date(new Date().setHours(9, 0, 0, 0)),
      durationMinutes: 5,
      taskType: 'life',
      status: 'pending',
      priority: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'demo-2',
      userId: 'demo',
      title: '做好两套ins穿搭图',
      description: '@ins穿搭账号100天1w粉丝',
      scheduledStart: new Date(new Date().setHours(9, 30, 0, 0)), // 改为9:30，制造间隔
      durationMinutes: 60,
      taskType: 'work',
      status: 'pending',
      priority: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'demo-3',
      userId: 'demo',
      title: '发照相馆小红书',
      description: '@坚持100天每天发照相馆小红书 @月入5w',
      scheduledStart: new Date(new Date().setHours(11, 0, 0, 0)), // 改为11:00，制造间隔
      durationMinutes: 30,
      taskType: 'creative',
      status: 'pending',
      priority: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  
  // 合并真实任务和示例任务
  const allTasks = [...tasks, ...demoTasks];

  // 任务类别颜色（根据设计图）
  const categoryColors: Record<string, string> = {
    work: '#C85A7C',      // 玫红色 - 工作
    study: '#C85A7C',     // 玫红色 - 学习/运营
    health: '#6BA56D',    // 绿色 - 健康
    life: '#8B1538',      // 深红色 - 生活
    social: '#C85A7C',    // 玫红色 - 社交
    finance: '#8B1538',   // 深红色 - 财务
    creative: '#C85A7C',  // 玫红色 - 创意
    rest: '#6BA56D',      // 绿色 - 休息
    other: '#C85A7C',     // 玫红色 - 其他
  };

  // 根据任务类型获取标签
  const getTaskTags = (taskType: string, title: string): string[] => {
    const tags: string[] = [];
    
    // 根据任务类型添加标签
    if (taskType === 'life') tags.push('#生活');
    if (taskType === 'work') tags.push('#运营');
    if (taskType === 'creative') tags.push('#照相馆工作');
    
    // 根据标题添加更多标签
    if (title.includes('起床')) tags.push('#起床');
    if (title.includes('ins') || title.includes('穿搭')) {
      tags.push('#ins穿搭账号');
      tags.push('#创业');
    }
    if (title.includes('小红书') || title.includes('照相馆')) {
      tags.push('#运营');
      tags.push('#创业');
    }
    
    return tags.slice(0, 3); // 最多显示3个标签
  };

  // 根据任务标题获取 emoji
  const getTaskEmoji = (title: string): string => {
    if (title.includes('起床') || title.includes('衣服')) return '👔';
    if (title.includes('ins') || title.includes('穿搭')) return '👗';
    if (title.includes('照相馆') || title.includes('小红书')) return '💄';
    if (title.includes('运动') || title.includes('健身')) return '💪';
    if (title.includes('学习') || title.includes('读书')) return '📚';
    return '📝';
  };

  // 根据任务获取关联目标文本
  const getGoalText = (title: string, description?: string): string => {
    if (title.includes('起床')) return '@挑战早起30天';
    if (title.includes('ins') || title.includes('穿搭')) return '@ins穿搭账号100天1w粉丝';
    if (title.includes('照相馆') || title.includes('小红书')) return '@坚持100天每天发照相馆小红书 @月入5w';
    if (description) return `@${description}`;
    return '@完成目标';
  };

  // 转换任务为时间块（使用合并后的任务列表）
  const timeBlocks = allTasks
    .filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    })
    .map((task) => {
      const startTime = new Date(task.scheduledStart!);
      const endTime = new Date(startTime.getTime() + (task.durationMinutes || 60) * 60000);
      
      // 默认子任务（如果任务没有子任务）
      const defaultSubtasks = task.title.includes('ins') || task.title.includes('穿搭') ? [
        '先收集两套穿搭图',
        '更收集两套场景动作图',
        '把穿搭图换成正面站立的动作以及平头',
        '把服装穿在准备好的模特身上',
        '使用换好衣服的模特换背景和动作',
      ] : [];
      
      // 使用任务自带的颜色、标签、金币，如果没有则使用默认值
      const taskColor = task.color || categoryColors[task.taskType] || categoryColors.other;
      const taskTags = task.tags && task.tags.length > 0 ? task.tags : getTaskTags(task.taskType, task.title);
      const taskGold = task.goldReward || Math.floor((task.durationMinutes || 60) * 0.8);
      
      console.log('🎨 任务显示信息:', {
        title: task.title,
        color: taskColor,
        tags: taskTags,
        goldReward: taskGold,
        原始任务: task,
      });
      
      return {
        id: task.id,
        title: task.title,
        startTime,
        endTime,
        duration: task.durationMinutes || 60,
        color: taskColor, // 使用任务的颜色
        category: task.taskType,
        description: task.description,
        isCompleted: task.status === 'completed',
        goldReward: taskGold, // 使用任务的金币
        tags: taskTags, // 使用任务的标签
        goalText: getGoalText(task.title, task.description),
        emoji: getTaskEmoji(task.title),
        subtasks: task.subtasks?.map(st => st.title) || defaultSubtasks,
      };
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // 计算间隔
  const gaps: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
  }> = [];

  for (let i = 0; i < timeBlocks.length - 1; i++) {
    const currentEnd = timeBlocks[i].endTime;
    const nextStart = timeBlocks[i + 1].startTime;
    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;
    
    if (gapMinutes > 0) {
      gaps.push({
        id: `gap-${i}`,
        startTime: currentEnd,
        endTime: nextStart,
        durationMinutes: Math.round(gapMinutes),
      });
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  // 处理长按开始拖拽
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, taskId: string, startTime: Date) => {
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDraggedTask(taskId);
    setDragStartY(clientY);
    setDragStartTime(startTime);
  };
  
  // 处理拖拽移动
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!draggedTask || !dragStartTime) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartY;
    
    // 每60px代表30分钟
    const minutesChange = Math.round((deltaY / 60) * 30);
    
    if (Math.abs(minutesChange) >= 5) {
      const newStartTime = new Date(dragStartTime.getTime() + minutesChange * 60000);
      
      // 更新任务时间
      onTaskUpdate(draggedTask, {
        scheduledStart: newStartTime,
      });
      
      // 重置拖拽起点
      setDragStartY(clientY);
      setDragStartTime(newStartTime);
    }
  };
  
  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragStartY(0);
    setDragStartTime(null);
  };
  
  // 添加全局事件监听
  useEffect(() => {
    if (draggedTask) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggedTask]);
  
  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      TaskMonitor.stopAll();
    };
  }, []);
  
  // 处理图片上传
  const handleImageUpload = async (taskId: string, file: File, type: 'cover' | 'attachment' = 'attachment') => {
    try {
      setUploadingImage(taskId);
      
      // 压缩图片
      const compressedFile = await ImageUploader.compressImage(file);
      
      // 上传图片
      const imageUrl = await ImageUploader.uploadImage(compressedFile);
      
      // 保存图片信息
      const newImage: TaskImage = {
        id: `img-${Date.now()}`,
        url: imageUrl,
        type,
        uploadedAt: new Date(),
      };
      
      setTaskImages(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), newImage],
      }));
      
      console.log('✅ 图片上传成功');
    } catch (error) {
      console.error('❌ 图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImage(null);
    }
  };
  
  // AI 生成子任务
  const handleGenerateSubTasks = async (taskId: string, taskTitle: string, taskDescription?: string) => {
    try {
      setGeneratingSubTasks(taskId);
      
      const apiKey = localStorage.getItem('ai_api_key') || '';
      const apiEndpoint = localStorage.getItem('ai_api_endpoint') || 'https://api.deepseek.com/v1/chat/completions';
      
      if (!apiKey) {
        alert('请先配置 API Key');
        return;
      }
      
      const subTaskTitles = await generateSubTasks(taskTitle, taskDescription || '', apiKey, apiEndpoint);
      
      const newSubTasks: SubTask[] = subTaskTitles.map(title => ({
        id: `subtask-${Date.now()}-${Math.random()}`,
        title,
        completed: false,
        createdAt: new Date(),
      }));
      
      setTaskSubTasks(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), ...newSubTasks],
      }));
      
      console.log('✅ AI 生成子任务成功');
    } catch (error) {
      console.error('❌ AI 生成子任务失败:', error);
      alert('AI 生成失败，请重试');
    } finally {
      setGeneratingSubTasks(null);
    }
  };
  
  // 启用任务验证（点击立即生成关键词）
  const handleEnableVerification = async (taskId: string, taskTitle: string, taskType: string) => {
    try {
      const apiKey = localStorage.getItem('ai_api_key') || '';
      const apiEndpoint = localStorage.getItem('ai_api_endpoint') || 'https://api.deepseek.com/v1/chat/completions';
      
      if (!apiKey) {
        alert('请先配置 API Key');
        return;
      }
      
      // 立即生成启动和完成验证关键词
      const { startKeywords, completionKeywords } = await generateVerificationKeywords(
        taskTitle, 
        taskType, 
        apiKey, 
        apiEndpoint
      );
      
      // 获取任务的开始和结束时间
      const task = allTasks.find(t => t.id === taskId);
      if (!task || !task.scheduledStart) {
        alert('任务缺少时间信息');
        return;
      }
      
      const scheduledStart = new Date(task.scheduledStart);
      const scheduledEnd = task.scheduledEnd 
        ? new Date(task.scheduledEnd) 
        : new Date(scheduledStart.getTime() + (task.durationMinutes || 30) * 60 * 1000);
      
      const verification: TaskVerification = {
        enabled: true,
        startKeywords,
        completionKeywords,
        startDeadline: new Date(scheduledStart.getTime() + 2 * 60 * 1000),
        completionDeadline: scheduledEnd,
        
        // 启动验证追踪
        startFailedAttempts: 0,
        startTimeoutCount: 0,
        startRetryDeadline: null,
        
        // 完成验证追踪
        completionFailedAttempts: 0,
        completionTimeoutCount: 0,
        completionExtensionCount: 0,
        
        status: 'pending',
        actualStartTime: null,
        actualCompletionTime: null,
        
        // 金币追踪
        startGoldEarned: 0,
        completionGoldEarned: 0,
        totalGoldPenalty: 0,
      };
      
      setTaskVerifications(prev => ({
        ...prev,
        [taskId]: verification,
      }));
      
      // 开始监控任务
      TaskMonitor.startMonitoring(
        taskId,
        taskTitle,
        scheduledStart,
        scheduledEnd,
        task.durationMinutes || 30,
        task.goldReward || 100, // 任务总金币
        verification,
        () => {
          // 任务开始提醒回调
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'waiting_start',
            },
          }));
        },
        () => {
          // 任务结束提醒回调
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'waiting_completion',
            },
          }));
        },
        (timeoutCount, penalty) => {
          // 启动超时回调
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              startTimeoutCount: timeoutCount,
              totalGoldPenalty: prev[taskId].totalGoldPenalty + penalty,
              status: timeoutCount < 3 ? 'start_retry' : 'failed',
              startRetryDeadline: timeoutCount < 3 
                ? new Date(Date.now() + 2 * 60 * 1000) 
                : null,
            },
          }));
        },
        (extensionCount, penalty) => {
          // 完成超时回调
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              completionExtensionCount: extensionCount,
              totalGoldPenalty: prev[taskId].totalGoldPenalty + penalty,
              status: extensionCount < 3 ? 'completion_extension' : 'failed',
              completionDeadline: extensionCount < 3
                ? new Date(Date.now() + 10 * 60 * 1000)
                : null,
            },
          }));
        }
      );
      
      console.log('✅ 任务验证已启用');
      console.log('启动关键词:', startKeywords);
      console.log('完成关键词:', completionKeywords);
      
      // 打开编辑对话框
      setEditingVerification(taskId);
    } catch (error) {
      console.error('❌ 启用验证失败:', error);
      alert('启用验证失败，请重试');
    }
  };
  
  // 启动任务（带验证）
  const handleStartTask = async (taskId: string) => {
    const verification = taskVerifications[taskId];
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    if (verification && verification.enabled) {
      // 需要验证 - 拍照验证启动
      setStartingTask(taskId);
      
      // 打开文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment' as any; // 优先使用相机
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            // 上传验证图片
            await handleImageUpload(taskId, file, 'verification');
            
            // 简化验证：假设上传成功就是验证成功
            // 实际项目中应该调用图像识别 API
            
            const now = new Date();
            
            // 更新验证状态
            setTaskVerifications(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                status: 'started',
                actualStartTime: now,
                startFailedAttempts: 0,
              },
            }));
            
            // 播放成功音效
            SoundEffects.playSuccessSound();
            SoundEffects.playCoinSound();
            
            // 语音祝贺
            VoiceReminder.congratulateCompletion(task.title, 10);
            
            // 更新任务状态
            if (taskId.startsWith('demo-')) {
              setDemoTasks(prev => prev.map(t => 
                t.id === taskId ? { ...t, status: 'in_progress' as const } : t
              ));
            } else {
              onTaskUpdate(taskId, { status: 'in_progress' });
            }
            
            console.log('✅ 任务启动验证成功');
          } catch (error) {
            // 验证失败
            const newFailedAttempts = (verification.startFailedAttempts || 0) + 1;
            
            setTaskVerifications(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                startFailedAttempts: newFailedAttempts,
              },
            }));
            
            SoundEffects.playFailSound();
            
            if (newFailedAttempts >= 3) {
              // 连续三次失败，播放警报
              SoundEffects.playAlarmSound();
              VoiceReminder.speak('连续三次验证失败！扣除50金币！请认真完成任务！');
              alert('⚠️ 连续三次验证失败！扣除50金币！');
            } else {
              alert(`❌ 验证失败！请重新拍摄包含以下内容的照片：\n${verification.startKeywords.join('、')}\n\n剩余尝试次数：${3 - newFailedAttempts}`);
            }
          }
        }
        setStartingTask(null);
      };
      
      input.click();
    } else {
      // 无需验证，直接启动
      if (taskId.startsWith('demo-')) {
        setDemoTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'in_progress' as const } : t
        ));
      } else {
        onTaskUpdate(taskId, { status: 'in_progress' });
      }
    }
  };
  
  // 完成任务（带验证）
  const handleCompleteTask = async (taskId: string) => {
    const verification = taskVerifications[taskId];
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    if (verification && verification.enabled && verification.status === 'started') {
      // 需要完成验证 - 拍照验证完成
      setCompletingTask(taskId);
      
      // 打开文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment' as any;
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            // 上传验证图片
            await handleImageUpload(taskId, file, 'verification');
            
            const now = new Date();
            const scheduledEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : null;
            
            // 检查是否提前完成
            const isEarlyCompletion = scheduledEnd && now < scheduledEnd;
            
            // 更新验证状态
            setTaskVerifications(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                status: 'completed',
                actualCompletionTime: now,
                completionFailedAttempts: 0,
              },
            }));
            
            // 播放成功音效
            SoundEffects.playSuccessSound();
            SoundEffects.playCoinSound();
            
            // 语音祝贺
            if (isEarlyCompletion) {
              VoiceReminder.congratulateEarlyCompletion(task.title, 20);
            } else {
              VoiceReminder.congratulateCompletion(task.title, 10);
            }
            
            // 更新任务状态为已完成
            if (taskId.startsWith('demo-')) {
              setDemoTasks(prev => prev.map(t => 
                t.id === taskId ? { 
                  ...t, 
                  status: 'completed' as const,
                  scheduledEnd: isEarlyCompletion ? now : t.scheduledEnd,
                } : t
              ));
            } else {
              onTaskUpdate(taskId, { 
                status: 'completed',
                scheduledEnd: isEarlyCompletion ? now : task.scheduledEnd,
              });
            }
            
            // 如果提前完成，自动调整后续任务时间
            if (isEarlyCompletion && scheduledEnd) {
              TaskTimeAdjuster.adjustFollowingTasks(
                taskId,
                now,
                allTasks,
                (id, updates) => {
                  if (id.startsWith('demo-')) {
                    setDemoTasks(prev => prev.map(t => 
                      t.id === id ? { ...t, ...updates } : t
                    ));
                  } else {
                    onTaskUpdate(id, updates);
                  }
                }
              );
            }
            
            // 停止监控
            TaskMonitor.stopMonitoring(taskId);
            
            console.log('✅ 任务完成验证成功');
          } catch (error) {
            // 验证失败
            const newFailedAttempts = (verification.completionFailedAttempts || 0) + 1;
            
            setTaskVerifications(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                completionFailedAttempts: newFailedAttempts,
              },
            }));
            
            SoundEffects.playFailSound();
            
            if (newFailedAttempts >= 3) {
              SoundEffects.playAlarmSound();
              VoiceReminder.speak('连续三次验证失败！扣除50金币！请认真完成任务！');
              alert('⚠️ 连续三次验证失败！扣除50金币！');
            } else {
              alert(`❌ 验证失败！请重新拍摄包含以下内容的照片：\n${verification.completionKeywords.join('、')}\n\n剩余尝试次数：${3 - newFailedAttempts}`);
            }
          }
        }
        setCompletingTask(null);
      };
      
      input.click();
    } else {
      // 无需验证，直接完成
      if (taskId.startsWith('demo-')) {
        setDemoTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'completed' as const } : t
        ));
      } else {
        onTaskUpdate(taskId, { status: 'completed' });
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  // 计算距离今日结束的剩余时间
  const calculateTimeUntilEndOfDay = () => {
    if (timeBlocks.length === 0) return null;
    
    const lastBlock = timeBlocks[timeBlocks.length - 1];
    const lastEndTime = lastBlock.endTime;
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const remainingMinutes = Math.floor((endOfDay.getTime() - lastEndTime.getTime()) / 60000);
    
    if (remainingMinutes <= 0) return null;
    
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    
    return { hours, mins, totalMinutes: remainingMinutes, startTime: lastEndTime };
  };

  const timeUntilEnd = calculateTimeUntilEndOfDay();

  return (
    <div className="space-y-3 pb-4 relative">
      {/* NOW时间线 */}
      <NowTimeline 
        timeBlocks={timeBlocks.map(block => ({
          id: block.id,
          startTime: block.startTime,
          endTime: block.endTime,
          title: block.title,
        }))}
        isDark={isDark}
      />
      
      {/* 验证关键词编辑对话框 */}
      {editingVerification && taskVerifications[editingVerification] && (
        <TaskVerificationDialog
          taskId={editingVerification}
          taskTitle={allTasks.find(t => t.id === editingVerification)?.title || ''}
          verification={taskVerifications[editingVerification]}
          onClose={() => setEditingVerification(null)}
          onUpdate={(verification) => {
            setTaskVerifications(prev => ({
              ...prev,
              [editingVerification]: verification,
            }));
          }}
          isDark={isDark}
          accentColor={accentColor}
        />
      )}
      
      {/* 编辑任务弹窗 */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" style={{ backgroundColor: bgColor, color: textColor }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">编辑任务</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            {(() => {
              const task = allTasks.find(t => t.id === editingTask);
              if (!task) return null;
              
              return (
                <div className="space-y-4">
                  {/* 任务标题 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">任务标题</label>
                    <input
                      type="text"
                      defaultValue={task.title}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{ borderColor, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }}
                      onBlur={(e) => {
                        if (task.id.startsWith('demo-')) {
                          setDemoTasks(prev => prev.map(t => 
                            t.id === editingTask ? { ...t, title: e.target.value } : t
                          ));
                        } else {
                          onTaskUpdate(editingTask, { title: e.target.value });
                        }
                      }}
                    />
                  </div>
                  
                  {/* 时长 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">时长（分钟）</label>
                    <input
                      type="number"
                      defaultValue={task.durationMinutes}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{ borderColor, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }}
                      onBlur={(e) => {
                        const minutes = parseInt(e.target.value);
                        if (task.id.startsWith('demo-')) {
                          setDemoTasks(prev => prev.map(t => 
                            t.id === editingTask ? { ...t, durationMinutes: minutes } : t
                          ));
                        } else {
                          onTaskUpdate(editingTask, { durationMinutes: minutes });
                        }
                      }}
                    />
                  </div>
                  
                  {/* 开始时间 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">开始时间</label>
                    <input
                      type="time"
                      defaultValue={task.scheduledStart ? new Date(task.scheduledStart).toTimeString().slice(0, 5) : ''}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{ borderColor, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }}
                      onBlur={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(task.scheduledStart || new Date());
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        
                        if (task.id.startsWith('demo-')) {
                          setDemoTasks(prev => prev.map(t => 
                            t.id === editingTask ? { ...t, scheduledStart: newDate } : t
                          ));
                        } else {
                          onTaskUpdate(editingTask, { scheduledStart: newDate });
                        }
                      }}
                    />
                  </div>
                  
                  {/* 按钮 */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        if (task.id.startsWith('demo-')) {
                          setDemoTasks(prev => prev.filter(t => t.id !== editingTask));
                        } else if (onTaskDelete) {
                          onTaskDelete(editingTask);
                        }
                        setEditingTask(null);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: '#EF4444', color: 'white' }}
                    >
                      <Trash2 className="w-4 h-4 inline mr-2" />
                      删除任务
                    </button>
                    
                    <button
                      onClick={() => setEditingTask(null)}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: '#10B981', color: 'white' }}
                    >
                      完成
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      {timeBlocks.map((block, index) => {
        const isExpanded = expandedCards.has(block.id);
        const gap = gaps.find(g => g.id === `gap-${index}`);

        return (
          <div key={block.id}>
            {/* 任务卡片 */}
            <div className="relative flex items-start gap-3 mb-0">
              {/* 左侧时间列 */}
              <div className="w-12 flex-shrink-0 text-left flex flex-col">
                {/* 开始时间 */}
                <div className="text-base font-bold leading-none mb-1" style={{ color: textColor }}>
                  {formatTime(block.startTime)}
                </div>
                {/* 占位，让结束时间对齐卡片底部 */}
                <div className="flex-1"></div>
                {/* 结束时间 - 对齐卡片底部 */}
                <div className="text-sm font-semibold leading-none" style={{ color: accentColor }}>
                  {formatTime(block.endTime)}
                </div>
              </div>

              {/* 任务卡片主体 */}
              <div 
                data-task-id={block.id}
                className="flex-1 rounded-2xl shadow-lg overflow-hidden relative"
                style={{ 
                  backgroundColor: block.isCompleted ? 'rgba(156, 163, 175, 0.5)' : block.color,
                  opacity: block.isCompleted ? 0.7 : 1,
                }}
              >
                {/* 完成划线 */}
                {block.isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div 
                      className="w-full h-1.5 bg-white opacity-90"
                      style={{ 
                        transform: 'rotate(-8deg)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    />
                  </div>
                )}

                {/* 未展开：横向长条形布局 - 完全按照设计图 */}
                {!isExpanded && (
                  <div className="p-3 text-white" style={{ color: getTextColor(block.color) }}>
                    {/* 第一行：拖拽手柄 + 标签 + 时长 + 编辑按钮 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* 拖拽手柄 */}
                        <div
                          className="cursor-move p-1 rounded hover:bg-white/20 transition-colors"
                          onMouseDown={(e) => handleDragStart(e, block.id, block.startTime)}
                          onTouchStart={(e) => handleDragStart(e, block.id, block.startTime)}
                        >
                          <GripVertical className="w-4 h-4 opacity-60" />
                        </div>
                        
                        <div className="flex gap-1.5">
                          {block.tags.slice(0, 2).map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold" style={{ color: '#ff69b4' }}>
                          *{block.duration} min
                        </div>
                        
                        {/* 编辑按钮 */}
                        <button
                          onClick={() => setEditingTask(block.id)}
                          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                          title="编辑任务"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 第二行：图片 + 标题区域 */}
                    <div className="flex gap-3 mb-2">
                      {/* 圆形图片 */}
                      <div 
                        className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      >
                        <Camera className="w-6 h-6 opacity-60" />
                      </div>

                      {/* 标题 + 目标 */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className={`text-base font-bold ${block.isCompleted ? 'line-through' : ''}`}>
                            {block.title}
                          </h3>
                          <span className="text-lg">{block.emoji}</span>
                        </div>
                        <div className="text-xs opacity-90">
                          {block.goalText}
                        </div>
                      </div>
                    </div>

                    {/* 第三行：按钮 + 金币 + start */}
                    <div className="flex items-center justify-between">
                      {/* 左侧：三个圆形按钮 */}
                      <div className="flex items-center gap-2">
                        {/* AI拆解子任务 */}
                        <button
                          onClick={() => handleGenerateSubTasks(block.id, block.title, block.description)}
                          disabled={generatingSubTasks === block.id}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="AI拆解子任务"
                        >
                          <span className="text-base">{generatingSubTasks === block.id ? '⏳' : '⭐'}</span>
                        </button>
                        
                        {/* 启用/编辑验证 */}
                        <button
                          onClick={() => {
                            const verification = taskVerifications[block.id];
                            if (verification && verification.enabled) {
                              setEditingVerification(block.id);
                            } else {
                              handleEnableVerification(block.id, block.title, block.taskType || 'work');
                            }
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: taskVerifications[block.id]?.enabled 
                              ? 'rgba(34,197,94,0.4)' 
                              : 'rgba(255,255,255,0.25)' 
                          }}
                          title={taskVerifications[block.id]?.enabled ? '编辑验证关键词' : '启用拖延验证'}
                        >
                          <span className="text-base">⏱️</span>
                        </button>
                        
                        {/* 笔记和附件 */}
                        <button
                          onClick={() => toggleExpand(block.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="笔记和附件"
                        >
                          <span className="text-base">📝</span>
                        </button>
                      </div>

                      {/* 右侧：金币 + start + 展开 */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.3)' }}>
                          <span className="text-base">💰</span>
                          <span className="text-sm font-bold">{block.goldReward}</span>
                        </div>

                        {!block.isCompleted && block.status !== 'in_progress' && (
                          <button
                            onClick={() => handleStartTask(block.id)}
                            disabled={startingTask === block.id}
                            className="px-4 py-1.5 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              color: block.color,
                            }}
                            title={
                              taskVerifications[block.id]?.enabled 
                                ? '拍照验证启动' 
                                : '开始任务'
                            }
                          >
                            {startingTask === block.id ? '⏳' : '*start'}
                          </button>
                        )}
                        
                        {block.status === 'in_progress' && (
                          <div 
                            className="px-3 py-1 rounded-full font-bold text-xs"
                            style={{ 
                              backgroundColor: 'rgba(34,197,94,0.3)',
                              color: 'rgba(255,255,255,0.95)',
                            }}
                          >
                            进行中
                          </div>
                        )}

                        <button
                          onClick={() => toggleExpand(block.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 展开：竖向长方形布局 */}
                {isExpanded && (
                  <div className="p-4 text-white" style={{ color: getTextColor(block.color) }}>
                    {/* 顶部：拖拽手柄 + 标签和时长 + 编辑按钮 */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        {/* 拖拽手柄 */}
                        <div
                          className="cursor-move p-1 rounded hover:bg-white/20 transition-colors mt-1"
                          onMouseDown={(e) => handleDragStart(e, block.id, block.startTime)}
                          onTouchStart={(e) => handleDragStart(e, block.id, block.startTime)}
                        >
                          <GripVertical className="w-4 h-4 opacity-60" />
                        </div>
                        
                        <div className="flex gap-1.5 flex-wrap">
                          {block.tags.map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: '#ff69b4' }}>
                          *{block.duration} min
                        </span>
                        
                        {/* 编辑按钮 */}
                        <button
                          onClick={() => setEditingTask(block.id)}
                          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                          title="编辑任务"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 主体：图片+标题 */}
                    <div className="flex gap-2 mb-2">
                      {/* 图片上传区 */}
                      <div 
                        className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      >
                        <Camera className="w-6 h-6 opacity-60" />
                      </div>

                      {/* 标题区 */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className={`text-base font-bold ${block.isCompleted ? 'line-through' : ''}`}>
                            {block.title}
                          </h3>
                          <span className="text-xl">{block.emoji}</span>
                        </div>
                        
                        {/* 虚线 */}
                        <div 
                          className="w-full my-1"
                          style={{ borderTop: '2px dashed rgba(255,255,255,0.4)' }}
                        />

                        {/* 关联目标 */}
                        <div className="text-xs opacity-90">
                          <span className="font-medium">{block.goalText}</span>
                        </div>
                      </div>
                    </div>

                    {/* 功能按钮栏 */}
                    <div className="flex items-center justify-between mb-2">
                      {/* 左侧功能图标 */}
                      <div className="flex items-center gap-1.5">
                        {/* AI拆解子任务 */}
                        <button
                          onClick={() => handleGenerateSubTasks(block.id, block.title, block.description)}
                          disabled={generatingSubTasks === block.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="AI拆解子任务"
                        >
                          <span className="text-sm">{generatingSubTasks === block.id ? '⏳' : '⭐'}</span>
                        </button>
                        
                        {/* 启用/编辑验证 */}
                        <button
                          onClick={() => {
                            const verification = taskVerifications[block.id];
                            if (verification && verification.enabled) {
                              // 已启用，打开编辑对话框
                              setEditingVerification(block.id);
                            } else {
                              // 未启用，启用验证
                              handleEnableVerification(block.id, block.title, block.taskType || 'work');
                            }
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: taskVerifications[block.id]?.enabled 
                              ? 'rgba(34,197,94,0.4)' 
                              : 'rgba(255,255,255,0.25)' 
                          }}
                          title={taskVerifications[block.id]?.enabled ? '编辑验证关键词' : '启用拖延验证'}
                        >
                          <span className="text-sm">⏱️</span>
                        </button>
                        
                        {/* 笔记和附件 */}
                        <button
                          onClick={() => toggleExpand(block.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="笔记和附件"
                        >
                          <span className="text-sm">📝</span>
                        </button>
                      </div>

                      {/* 右侧：金币和完成按钮 */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.3)' }}>
                          <span className="text-base">💰</span>
                          <span className="text-xs font-bold">{block.goldReward}</span>
                        </div>

                        {/* 完成验证按钮 */}
                        <button
                          onClick={() => handleCompleteTask(block.id)}
                          disabled={completingTask === block.id}
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                          style={{ 
                            backgroundColor: block.isCompleted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                            borderColor: 'rgba(255,255,255,0.8)',
                          }}
                          title={
                            taskVerifications[block.id]?.enabled 
                              ? '拍照验证完成' 
                              : '标记完成'
                          }
                        >
                          {completingTask === block.id ? (
                            <span className="text-sm">⏳</span>
                          ) : block.isCompleted ? (
                            <Check className="w-5 h-5" style={{ color: block.color }} />
                          ) : null}
                        </button>
                      </div>
                    </div>

                    {/* Start按钮和收起按钮 */}
                    <div className="flex items-center justify-end gap-2">
                      {!block.isCompleted && block.status !== 'in_progress' && (
                        <button
                          onClick={() => handleStartTask(block.id)}
                          disabled={startingTask === block.id}
                          className="px-4 py-1.5 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            color: block.color,
                          }}
                          title={
                            taskVerifications[block.id]?.enabled 
                              ? '拍照验证启动' 
                              : '开始任务'
                          }
                        >
                          {startingTask === block.id ? '⏳' : '*start'}
                        </button>
                      )}
                      
                      {block.status === 'in_progress' && (
                        <div 
                          className="px-4 py-1.5 rounded-full font-bold text-sm"
                          style={{ 
                            backgroundColor: 'rgba(34,197,94,0.3)',
                            color: 'rgba(255,255,255,0.95)',
                          }}
                        >
                          进行中...
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleExpand(block.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 展开区域：子任务和文件 */}
                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '2px dashed rgba(255,255,255,0.3)' }}>
                      {/* 子任务 */}
                      <div className="space-y-1.5">
                        {block.subtasks.map((subtask, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-2 pl-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                          >
                            <div 
                              className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                              style={{ borderColor: 'rgba(255,255,255,0.8)' }}
                            />
                            <span className="text-xs">{subtask}</span>
                          </div>
                        ))}
                        
                        <button
                          className="w-full py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        >
                          + 添加子任务
                        </button>
                      </div>

                      {/* 文件上传区 */}
                      <div 
                        className="rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-80"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          border: '2px dashed rgba(255,255,255,0.4)'
                        }}
                      >
                        <Plus className="w-6 h-6 mb-1 opacity-60" />
                        <span className="text-xs font-medium opacity-80">拖拽添加文件</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧完成圆圈 - 靠右不占卡片空间 */}
              <div className="w-8 flex-shrink-0 flex justify-end pt-3">
                <div 
                  className="w-6 h-6 rounded-full border-2"
                  style={{ 
                    borderColor: block.isCompleted ? block.color : borderColor,
                    backgroundColor: block.isCompleted ? block.color : 'transparent',
                  }}
                />
              </div>
            </div>

            {/* 间隔添加按钮 */}
            {gap && (
              <div className="flex items-center gap-3 my-2">
                {/* 左侧时间对齐 */}
                <div className="w-12 flex-shrink-0 text-left">
                  <div className="text-sm font-semibold" style={{ color: accentColor }}>
                    {formatTime(gap.startTime)}
                  </div>
                </div>

                {/* 间隔按钮 */}
                <button
                  onClick={() => {
                    const newTask = {
                      title: '新任务',
                      scheduledStart: gap.startTime.toISOString(),
                      durationMinutes: Math.min(60, gap.durationMinutes),
                      taskType: 'work',
                      status: 'pending' as const,
                    };
                    onTaskCreate(newTask);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                    border: `2px dashed ${borderColor}`,
                  }}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#C85A7C' }}
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: textColor }}>
                    (间隔{formatDuration(gap.durationMinutes)})
                  </span>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* 今日结束剩余时间按钮 - 在最后一个任务后面 */}
      {timeUntilEnd && (
        <div className="flex items-center gap-3 mt-2">
          {/* 左侧时间对齐 */}
          <div className="w-12 flex-shrink-0 text-left">
            <div className="text-sm font-semibold" style={{ color: accentColor }}>
              {formatTime(timeUntilEnd.startTime)}
            </div>
          </div>

          {/* 今日结束按钮 */}
          <button
            onClick={() => {
              const newTask = {
                title: '新任务',
                scheduledStart: timeUntilEnd.startTime.toISOString(),
                durationMinutes: Math.min(60, timeUntilEnd.totalMinutes),
                taskType: 'work',
                status: 'pending' as const,
              };
              onTaskCreate(newTask);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
            style={{ 
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
              border: `2px dashed ${borderColor}`,
            }}
          >
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#C85A7C' }}
            >
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: textColor }}>
              今日结束还剩
              {timeUntilEnd.hours > 0 && ` ${timeUntilEnd.hours}小时`}
              {timeUntilEnd.mins > 0 && ` ${timeUntilEnd.mins}分钟`}
            </span>
          </button>
        </div>
      )}

      {/* 空状态 */}
      {timeBlocks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-3xl mb-3">📅</div>
          <p className="text-base font-semibold mb-2" style={{ color: textColor }}>
            今天还没有任务
          </p>
          <p className="text-xs mb-3" style={{ color: accentColor }}>
            点击下方按钮添加第一个任务
          </p>
          <button
            onClick={() => {
              const newTask = {
                title: '新任务',
                scheduledStart: new Date(selectedDate.setHours(9, 0, 0, 0)).toISOString(),
                durationMinutes: 60,
                taskType: 'work',
                status: 'pending' as const,
              };
              onTaskCreate(newTask);
            }}
            className="px-5 py-2 rounded-full font-semibold text-sm transition-all hover:scale-105"
            style={{ 
              backgroundColor: '#C85A7C',
              color: 'white',
            }}
          >
            + 添加任务
          </button>
        </div>
      )}
    </div>
  );
}

