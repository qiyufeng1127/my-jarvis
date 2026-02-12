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
import TaskStatusIndicator from './TaskStatusIndicator';
import NowTimeline from './NowTimeline';
import { useAIStore } from '@/stores/aiStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTagStore } from '@/stores/tagStore';
import CelebrationEffect from '@/components/effects/CelebrationEffect';
import { 
  adjustTaskStartTime, 
  adjustTaskEndTime, 
  calculateActualDuration 
} from '@/utils/timelineAdjuster';
import { 
  calculateActualGoldReward, 
  smartDetectTaskPosture,
  calculateGoldReward
} from '@/utils/goldCalculator';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';
import { notificationService } from '@/services/notificationService';
import TaskVerificationExtension from './TaskVerificationExtension';
import eventBus from '@/utils/eventBus';
import TaskVerificationCountdownContent from './TaskVerificationCountdownContent';

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
  // 检测是否为移动设备
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
  const [verifyingTask, setVerifyingTask] = useState<string | null>(null); // 正在验证的任务
  const [verifyingType, setVerifyingType] = useState<'start' | 'complete' | null>(null); // 验证类型
  const [taskStartTimeouts, setTaskStartTimeouts] = useState<Record<string, boolean>>({}); // 启动验证超时标记
  const [taskFinishTimeouts, setTaskFinishTimeouts] = useState<Record<string, boolean>>({}); // 完成验证超时标记
  const [taskActualStartTimes, setTaskActualStartTimes] = useState<Record<string, Date>>({}); // 任务实际启动时间
  const [editingVerification, setEditingVerification] = useState<string | null>(null);
  const [addingSubTask, setAddingSubTask] = useState<string | null>(null);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRefs = useRef<Record<string, HTMLInputElement>>({});
  
  // 智能识别任务类型：是否为照片任务
  const detectPhotoTaskType = (title: string): { isPhotoTask: boolean; targetCount: number; unit: string } => {
    // 匹配模式：数字 + 量词（张、个、次、幅、份等）
    const patterns = [
      /(\d+)\s*张/,  // 10张、5张
      /(\d+)\s*个/,  // 10个、5个
      /(\d+)\s*次/,  // 10次、3次
      /(\d+)\s*幅/,  // 10幅、5幅
      /(\d+)\s*份/,  // 10份、5份
      /(\d+)\s*件/,  // 10件、5件
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        const unit = match[0].replace(/\d+\s*/, ''); // 提取量词
        return { isPhotoTask: true, targetCount: count, unit };
      }
    }
    
    return { isPhotoTask: false, targetCount: 0, unit: '' };
  };
  
  // 获取任务的照片进度
  const getPhotoTaskProgress = (taskId: string, targetCount: number) => {
    const images = taskImages[taskId] || [];
    const uploadedCount = images.length;
    const progress = Math.min(100, Math.round((uploadedCount / targetCount) * 100));
    return { uploadedCount, progress };
  };
  
  // 编辑任务的状态
  const [editedTaskData, setEditedTaskData] = useState<Task | null>(null);
  
  // 使用 AI Store 获取 API 配置
  const { config, isConfigured } = useAIStore();
  
  // 使用金币系统
  const { addGold, penaltyGold } = useGoldStore();
  
  // 使用标签系统
  const { recordTagUsage } = useTagStore();
  
  // 庆祝效果状态
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationGold, setCelebrationGold] = useState(0);
  
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
  
  // 使用真实任务（不再需要示范任务）
  const allTasks = tasks;

  // 根据任务内容智能分配颜色 - 优化版，避免重复
  const getTaskColor = (task: Task): string => {
    const title = task.title.toLowerCase();
    const tags = task.tags || [];
    const description = (task.description || '').toLowerCase();
    
    // 优先级从高到低，确保精确匹配
    
    // 1. 照相馆/小红书工作 - 紫色系（最高优先级，避免被其他规则覆盖）
    if (
      title.includes('照相馆') || title.includes('小红书') || 
      title.includes('修图') || title.includes('摄影') ||
      tags.some(t => t.includes('照相馆') || t.includes('摄影') || t.includes('小红书'))
    ) {
      return '#9B59B6'; // 紫色
    }
    
    // 2. ins穿搭/社交媒体运营 - 玫红色
    if (
      title.includes('ins') || title.includes('穿搭') || 
      title.includes('推广') || title.includes('营销') ||
      tags.some(t => t.includes('ins') || t.includes('穿搭') || t.includes('运营'))
    ) {
      return '#C85A7C'; // 玫红色
    }
    
    // 3. 文创设计工作 - 橙色系
    if (
      title.includes('设计') || title.includes('文创') || title.includes('创意') ||
      title.includes('作品') || title.includes('绘画') ||
      tags.some(t => t.includes('设计') || t.includes('文创') || t.includes('创意'))
    ) {
      return '#E67E22'; // 橙色
    }
    
    // 4. 家务类 - 蓝色系
    if (
      title.includes('收拾') || title.includes('打扫') || title.includes('整理') ||
      title.includes('洗碗') || title.includes('做饭') || title.includes('垃圾') ||
      title.includes('厨房') || title.includes('客厅') || title.includes('卧室') ||
      tags.some(t => t.includes('家务') || t.includes('清洁'))
    ) {
      return '#4A90E2'; // 蓝色
    }
    
    // 5. 学习成长 - 绿色系
    if (
      title.includes('学习') || title.includes('读书') || title.includes('课程') ||
      title.includes('成长') || title.includes('技能') ||
      tags.some(t => t.includes('学习') || t.includes('成长') || t.includes('读书'))
    ) {
      return '#27AE60'; // 绿色
    }
    
    // 6. 日常生活 - 粉色系
    if (
      title.includes('起床') || title.includes('洗漱') || title.includes('吃饭') ||
      title.includes('睡觉') || title.includes('休息') ||
      tags.some(t => t.includes('生活') || t.includes('日常'))
    ) {
      return '#E91E63'; // 粉色
    }
    
    // 7. 自我管理 - 青色系
    if (
      title.includes('计划') || title.includes('总结') || title.includes('反思') ||
      title.includes('目标') || title.includes('管理') ||
      tags.some(t => t.includes('管理') || t.includes('计划'))
    ) {
      return '#00BCD4'; // 青色
    }
    
    // 8. 创业相关（通用） - 深橙色
    if (
      title.includes('创业') || description.includes('创业') ||
      tags.some(t => t.includes('创业'))
    ) {
      return '#FF6B35'; // 深橙色
    }
    
    // 9. 默认：根据任务类型
  const categoryColors: Record<string, string> = {
    work: '#C85A7C',      // 玫红色 - 工作
      study: '#27AE60',     // 绿色 - 学习
      health: '#2ECC71',    // 浅绿色 - 健康
      life: '#E91E63',      // 粉色 - 生活
      social: '#FF6B35',    // 深橙色 - 社交
      finance: '#F39C12',   // 金色 - 财务
      creative: '#E67E22',  // 橙色 - 创意
      rest: '#95A5A6',      // 灰色 - 休息
      other: '#4A90E2',     // 蓝色 - 其他
    };
    
    return categoryColors[task.taskType] || '#4A90E2';
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

  // 根据任务标题智能获取 emoji
  const getTaskEmoji = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    
    // 家务类
    if (lowerTitle.includes('客厅')) return '🛋️';
    if (lowerTitle.includes('垃圾')) return '🗑️';
    if (lowerTitle.includes('打扫') || lowerTitle.includes('清洁')) return '🧹';
    if (lowerTitle.includes('洗碗')) return '🍽️';
    if (lowerTitle.includes('做饭') || lowerTitle.includes('厨房')) return '🍳';
    if (lowerTitle.includes('卧室')) return '🛏️';
    if (lowerTitle.includes('整理') || lowerTitle.includes('收拾')) return '📦';
    
    // 工作类
    if (lowerTitle.includes('照相馆') || lowerTitle.includes('摄影')) return '📷';
    if (lowerTitle.includes('小红书')) return '📱';
    if (lowerTitle.includes('设计')) return '🎨';
    if (lowerTitle.includes('文创')) return '✨';
    if (lowerTitle.includes('创意')) return '💡';
    
    // 学习类
    if (lowerTitle.includes('学习') || lowerTitle.includes('读书')) return '📚';
    if (lowerTitle.includes('课程')) return '🎓';
    if (lowerTitle.includes('写作')) return '✍️';
    
    // 生活类
    if (lowerTitle.includes('起床')) return '⏰';
    if (lowerTitle.includes('衣服') || lowerTitle.includes('穿搭')) return '👗';
    if (lowerTitle.includes('运动') || lowerTitle.includes('健身')) return '💪';
    if (lowerTitle.includes('吃饭')) return '🍽️';
    if (lowerTitle.includes('睡觉')) return '😴';
    
    // 创业类
    if (lowerTitle.includes('ins')) return '📸';
    if (lowerTitle.includes('运营')) return '📊';
    if (lowerTitle.includes('推广')) return '📢';
    if (lowerTitle.includes('营销')) return '💼';
    
    // 默认
    return '✅';
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
      
      // 使用任务自带的颜色、标签、金币，如果没有则使用智能分配
      const taskColor = task.color || getTaskColor(task);
      const taskTags = task.tags && task.tags.length > 0 ? task.tags : getTaskTags(task.taskType, task.title);
      // 使用新的金币计算器：站立15金币/分钟，坐着10金币/分钟
      const taskGold = task.goldReward || (() => {
        const duration = task.durationMinutes || 60;
        const posture = smartDetectTaskPosture(task.taskType, task.tags, task.title);
        return calculateGoldReward(duration, posture);
      })();
      
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
  
  // 【低侵入式集成】监听任务是否到时间，触发验证扩展组件（仅新增此段代码）
  useEffect(() => {
    const checkTaskTime = () => {
      const now = new Date();
      allTasks.forEach(task => {
        // 判断任务是否到时间且需要验证
        if (task.scheduledStart && task.verificationStart && task.status !== 'completed') {
          const taskStart = new Date(task.scheduledStart);
          if (now >= taskStart && !task.verificationStarted) {
            // 触发事件，传递必要数据给验证扩展组件
            eventBus.emit('taskTimeArrived', {
              taskId: task.id,
              taskTitle: task.title,
              subTasks: task.subTasks || [],
              durationMinutes: task.durationMinutes || 60,
              onStartVerify: () => handleStartVerification(task.id),
              onCompleteVerify: () => handleCompleteVerification(task.id)
            });
            // 标记已触发，避免重复触发
            onTaskUpdate(task.id, { verificationStarted: true });
          }
        }
      });
    };
    
    // 每秒检查一次
    const timer = setInterval(checkTaskTime, 1000);
    return () => clearInterval(timer);
  }, [allTasks, onTaskUpdate]);
  
  // 处理图片上传
  const handleImageUpload = async (taskId: string, files: FileList, type: 'cover' | 'attachment' = 'attachment') => {
    try {
      setUploadingImage(taskId);
      
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      
      const uploadedImages: TaskImage[] = [];
      
      // 上传所有选中的图片
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 压缩图片
        const compressedFile = await ImageUploader.compressImage(file);
        
        // 上传图片
        const imageUrl = await ImageUploader.uploadImage(compressedFile);
        
        // 保存图片信息
        const newImage: TaskImage = {
          id: `img-${Date.now()}-${i}`,
          url: imageUrl,
          type: 'attachment', // 统一管理封面，第一张自动为封面
          uploadedAt: new Date(),
        };
        
        uploadedImages.push(newImage);
      }
      
      setTaskImages(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), ...uploadedImages],
      }));
      
      // 检查是否为照片任务
      const { isPhotoTask, targetCount, unit } = detectPhotoTaskType(task.title);
      
      if (isPhotoTask) {
        const { uploadedCount, progress } = getPhotoTaskProgress(taskId, targetCount);
        const newCount = uploadedCount + uploadedImages.length;
        
        console.log(`📸 照片任务进度: ${newCount}/${targetCount} ${unit} (${Math.round((newCount / targetCount) * 100)}%)`);
        
        // 播放上传成功音效
        SoundEffects.playCoinSound();
        
        // 如果达到目标数量，自动完成任务
        if (newCount >= targetCount) {
          console.log('🎉 照片任务已完成！');
          
          // 计算金币奖励 - 使用新的金币计算器
          const duration = task.durationMinutes || 60;
          const posture = smartDetectTaskPosture(task.taskType, task.tags, task.title);
          const goldReward = task.goldReward || calculateGoldReward(duration, posture);
          
          // 添加金币
          addGold(goldReward, `完成任务：${task.title}`, taskId, task.title);
          
          // 显示庆祝效果
          setCelebrationGold(goldReward);
          setShowCelebration(true);
          
          // 播放音效
          SoundEffects.playSuccessSound();
          SoundEffects.playCoinSound();
          
          // 语音提示
          VoiceReminder.congratulateCompletion(task.title, goldReward);
          
          // 更新任务状态为完成
          onTaskUpdate(taskId, { status: 'completed', isCompleted: true });
        } else {
          // 显示进度提示
          console.log(`✅ 成功上传 ${uploadedImages.length} 张图片！还需 ${targetCount - newCount} ${unit}`);
        }
      } else {
      console.log(`✅ 成功上传 ${uploadedImages.length} 张图片`);
      }
    } catch (error) {
      console.error('❌ 图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImage(null);
    }
  };
  
  // 打开图片选择器
  const handleOpenImagePicker = (taskId: string) => {
    // 创建或获取该任务的 input 元素
    if (!imageInputRefs.current[taskId]) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true; // 支持多选
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          handleImageUpload(taskId, files, 'attachment');
        }
      };
      imageInputRefs.current[taskId] = input;
    }
    
    imageInputRefs.current[taskId].click();
  };
  
  // 添加手动子任务
  const handleAddManualSubTask = (taskId: string) => {
    if (!newSubTaskTitle.trim()) {
      alert('请输入子任务标题');
      return;
    }
    
    const newSubTask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: newSubTaskTitle.trim(),
      completed: false,
      createdAt: new Date(),
    };
    
    setTaskSubTasks(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), newSubTask],
    }));
    
    setNewSubTaskTitle('');
    setAddingSubTask(null);
    
    console.log('✅ 手动添加子任务成功');
  };
  
  // 切换子任务完成状态
  const handleToggleSubTask = (taskId: string, subTaskId: string) => {
    setTaskSubTasks(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(st => 
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      ),
    }));
  };
  
  // AI 生成子任务
  const handleGenerateSubTasks = async (taskId: string, taskTitle: string, taskDescription?: string) => {
    try {
      setGeneratingSubTasks(taskId);
      
      // 使用 AI Store 的配置
      if (!isConfigured()) {
        alert('请先在 AI 智能输入中配置 API Key');
        return;
      }
      
      const subTaskTitles = await generateSubTasks(taskTitle, taskDescription || '', config.apiKey, config.apiEndpoint);
      
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
      // 使用 AI Store 的配置
      if (!isConfigured()) {
        alert('请先在 AI 智能输入中配置 API Key');
        return;
      }
      
      // 立即生成启动和完成验证关键词
      const { startKeywords, completionKeywords } = await generateVerificationKeywords(
        taskTitle, 
        taskType, 
        config.apiKey, 
        config.apiEndpoint
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
        startPenaltyGold: 0, // 启动阶段扣除的金币
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
  // 启动验证超时处理
  const handleStartVerificationTimeout = (taskId: string) => {
    setTaskStartTimeouts(prev => ({ ...prev, [taskId]: true }));
    console.log(`任务 ${taskId} 启动验证超时，完成时将扣除30%金币`);
  };

  // 完成验证超时处理
  const handleFinishVerificationTimeout = (taskId: string) => {
    setTaskFinishTimeouts(prev => ({ ...prev, [taskId]: true }));
    console.log(`任务 ${taskId} 完成超时，将无金币奖励`);
  };

  const handleStartTask = async (taskId: string) => {
    console.log('🎯 [handleStartTask] 点击开始按钮，任务ID:', taskId);
    const verification = taskVerifications[taskId];
    const task = allTasks.find(t => t.id === taskId);
    
    console.log('📋 [handleStartTask] 任务信息:', task);
    console.log('🔧 [handleStartTask] 验证信息:', verification);
    
    if (!task) {
      console.log('❌ [handleStartTask] 任务不存在');
      return;
    }
    
    // 🔧 验证开关判断：如果任务没有设置验证，直接开始
    if (!verification || !verification.enabled) {
      console.log('⚡ [handleStartTask] 无验证或验证未启用，直接开始任务');
      onTaskUpdate(taskId, { status: 'in_progress' });
      return;
    }
    
    console.log('✅ [handleStartTask] 验证已启用，显示验证界面');
    
    if (verification && verification.enabled) {
      // 需要验证 - 拍照验证启动
      setStartingTask(taskId);
      
      // 创建一个带关键词提示的相机界面
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 bg-black/90 flex flex-col';
      modal.innerHTML = `
        <div class="flex-1 flex flex-col">
          <!-- 关键词提示区域 -->
          <div class="bg-gradient-to-b from-black/80 to-transparent p-4">
            <div class="flex flex-wrap gap-2 justify-center mb-2">
              ${verification.startKeywords.map(keyword => `
                <div class="flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                  <span class="text-2xl">📸</span>
                  <span class="text-white font-semibold text-sm">${keyword}</span>
                </div>
              `).join('')}
            </div>
            <p class="text-white/90 text-center text-sm">📷 请拍摄或上传包含以上内容的照片</p>
          </div>
          
          <!-- 按钮区域 -->
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <button id="camera-btn" class="mb-4 px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg">
                📷 拍照验证
              </button>
              <br>
              <button id="upload-btn" class="px-8 py-4 bg-green-600 text-white rounded-2xl text-lg font-bold hover:bg-green-700 transition-all shadow-lg">
                🖼️ 相册上传
              </button>
              <br>
              <button id="cancel-btn" class="mt-4 px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all">
                取消
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // 处理拍照
      const cameraBtn = modal.querySelector('#camera-btn');
      cameraBtn?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
        input.capture = 'environment' as any;
        input.onchange = (e) => handleVerificationImage(e, taskId, 'start');
        input.click();
        document.body.removeChild(modal);
      });
      
      // 处理上传
      const uploadBtn = modal.querySelector('#upload-btn');
      uploadBtn?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => handleVerificationImage(e, taskId, 'start');
        input.click();
        document.body.removeChild(modal);
      });
      
      // 处理取消
      const cancelBtn = modal.querySelector('#cancel-btn');
      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
        setStartingTask(null);
      });
    } else {
      // 无需验证，直接启动
      onTaskUpdate(taskId, { status: 'in_progress' });
    }
  };
  
  // 处理验证图片
  const handleVerificationImage = async (e: Event, taskId: string, type: 'start' | 'complete') => {
    const verification = taskVerifications[taskId];
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
        // 防止重复验证
        if (type === 'start' && verification.status === 'started') {
          alert('⚠️ 该任务已经完成启动验证，不能重复验证！');
          setStartingTask(null);
          setVerifyingTask(null);
          setVerifyingType(null);
          return;
        }
        
        if (type === 'complete' && verification.status === 'completed') {
          alert('⚠️ 该任务已经完成验证，不能重复验证！');
          setCompletingTask(null);
          setVerifyingTask(null);
          setVerifyingType(null);
          return;
        }
        
        // 设置验证状态 - 显示"正在验证..."
        setVerifyingTask(taskId);
        setVerifyingType(type);
        
        const keywords = type === 'start' ? verification.startKeywords : verification.completionKeywords;
        
        // 检查是否需要验证（如果没有关键词，直接通过）
        const needsVerification = keywords.length > 0;
        
        if (needsVerification) {
          // 使用百度AI进行宽松的图像识别验证
          console.log(`🔍 开始${type === 'start' ? '启动' : '完成'}验证（宽松模式）`);
          console.log(`📝 您设定的规则关键词:`, keywords);
          
          const verifyResult = await baiduImageRecognition.smartVerifyImage(
            file,
            keywords,
            0.3 // 30%匹配率（超宽松）
          );
          
          console.log(`✅ ${type === 'start' ? '启动' : '完成'}验证结果:`, verifyResult);
          
          if (!verifyResult.success) {
            // 验证失败（极少发生）
            setVerifyingTask(null);
            setVerifyingType(null);
            throw new Error(verifyResult.description);
          }
          
          // 验证成功 - 显示简洁提示
          console.log(`✅ ${type === 'start' ? '启动' : '完成'}验证通过！`);
        }
        
        // 保存验证照片到任务图片列表（统一管理）
        try {
          const compressedFile = await ImageUploader.compressImage(file);
          const imageUrl = await ImageUploader.uploadImage(compressedFile);
          
          const newImage: TaskImage = {
            id: `img-${Date.now()}-verification`,
            url: imageUrl,
            type: 'attachment',
            uploadedAt: new Date(),
          };
          
          setTaskImages(prev => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), newImage],
          }));
          
          console.log('📸 验证照片已保存到任务图片列表');
        } catch (error) {
          console.error('⚠️ 验证照片保存失败，但验证已通过:', error);
            }
            
            const now = new Date();
        const totalGold = task.goldReward || Math.floor((task.durationMinutes || 60) * 0.8);
            
        if (type === 'start') {
          // 启动验证通过 - 修正任务开始时间
          const scheduledStart = new Date(task.scheduledStart!);
          const delayMinutes = Math.floor((now.getTime() - scheduledStart.getTime()) / 60000);
          
          console.log(`⏰ 预设开始时间: ${scheduledStart.toLocaleTimeString()}`);
          console.log(`⏰ 实际开始时间: ${now.toLocaleTimeString()}`);
          console.log(`⏰ 延迟时间: ${delayMinutes} 分钟`);
          
          // 计算启动超时扣除的金币（已经在超时回调中扣除）
          const timeoutCount = verification.startTimeoutCount || 0;
          let totalPenalty = 0;
          for (let i = 1; i <= timeoutCount; i++) {
            totalPenalty += Math.round(totalGold * (i * 0.1)); // 10%, 20%, 30%...
          }
          
          // 启动阶段奖励40%金币
          const startGold = Math.round(totalGold * 0.4);
          
          console.log(`💰 启动验证通过奖励：${startGold} 金币`);
          if (totalPenalty > 0) {
            console.log(`⚠️ 启动超时已扣除：${totalPenalty} 金币（完成任务后会返还）`);
          }
          
          // 更新验证状态
            setTaskVerifications(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                status: 'started',
                actualStartTime: now,
                startFailedAttempts: 0,
              startGoldEarned: startGold,
              startPenaltyGold: totalPenalty, // 记录启动阶段扣除的金币
              },
            }));
            
          // 记录实际启动时间并调整时间轴位置
          setTaskActualStartTimes(prev => ({ ...prev, [taskId]: now }));
          adjustTaskStartTime(taskId, now, allTasks, onTaskUpdate);
            
          // 播放音效
            SoundEffects.playSuccessSound();
            SoundEffects.playCoinSound();
          
          // 添加金币
          addGold(startGold, `启动任务：${task.title}`, taskId, task.title);
          
          // 显示庆祝效果
          setCelebrationGold(startGold);
          setShowCelebration(true);
          
          // 语音提示
          VoiceReminder.congratulateCompletion(task.title, startGold);
          
          // 修正任务开始时间和结束时间
          const newEndTime = new Date(now.getTime() + (task.durationMinutes || 60) * 60000);
          onTaskUpdate(taskId, { 
            status: 'in_progress',
            scheduledStart: now.toISOString(),
            scheduledEnd: newEndTime.toISOString(),
          });
          
          // 发送任务开始通知
          notificationService.notifyTaskStart(task.title, false).catch(err => 
            console.error('发送任务开始通知失败:', err)
          );
            
          console.log('✅ 任务启动验证成功，时间已自动修正');
        } else {
          // 完成验证通过 - 计算提前完成奖励
          const actualStartTime = verification.actualStartTime || new Date(task.scheduledStart!);
          const actualDuration = Math.floor((now.getTime() - actualStartTime.getTime()) / 60000);
          const scheduledDuration = task.durationMinutes || 60;
          const savedMinutes = scheduledDuration - actualDuration;
          const savedPercentage = (savedMinutes / scheduledDuration) * 100;
          
          console.log(`⏰ 预设时长: ${scheduledDuration} 分钟`);
          console.log(`⏰ 实际时长: ${actualDuration} 分钟`);
          console.log(`⏰ 提前完成: ${savedMinutes} 分钟 (${savedPercentage.toFixed(1)}%)`);
          
          // 完成阶段基础奖励60%金币
          let completionGold = Math.round(totalGold * 0.6);
          let bonusGold = 0;
          let bonusMessage = '';
          
          // 计算提前完成奖励
          if (savedPercentage >= 50) {
            // 提前50%以上：额外奖励100%金币
            bonusGold = totalGold;
            bonusMessage = '🎉 提前50%以上完成！额外奖励100%金币！';
          } else if (savedPercentage >= 20) {
            // 提前20%-50%：额外奖励33%金币
            bonusGold = Math.round(totalGold * 0.33);
            bonusMessage = '🎉 提前20%-50%完成！额外奖励33%金币！';
          }
          
          // 返还启动阶段扣除的金币
          const startPenalty = verification.startPenaltyGold || 0;
          
          // 总金币 = 完成奖励 + 提前奖励 + 返还启动扣除
          const finalGold = completionGold + bonusGold + startPenalty;
          
          console.log(`💰 完成验证通过奖励：${completionGold} 金币`);
          if (bonusGold > 0) {
            console.log(`🎁 提前完成奖励：${bonusGold} 金币`);
          }
          if (startPenalty > 0) {
            console.log(`💰 返还启动扣除：${startPenalty} 金币`);
          }
          console.log(`💰 总计获得：${finalGold} 金币`);
          
          // 更新验证状态
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'completed',
              actualCompletionTime: now,
              completionFailedAttempts: 0,
              completionGoldEarned: finalGold,
            },
          }));
          
          // 调整任务结束时间
          adjustTaskEndTime(taskId, now, allTasks, onTaskUpdate);
          
          // 播放音效
          SoundEffects.playSuccessSound();
          SoundEffects.playCoinSound();
          
          // 添加金币
          addGold(finalGold, `完成任务：${task.title}${bonusMessage}`, taskId, task.title);
          
          // 显示庆祝效果
          setCelebrationGold(finalGold);
          setShowCelebration(true);
          
          // 语音提示
          if (bonusMessage) {
            VoiceReminder.speak(bonusMessage);
          }
          VoiceReminder.congratulateCompletion(task.title, finalGold);
          
          // 修正任务结束时间
          onTaskUpdate(taskId, { 
            status: 'completed', 
            isCompleted: true,
            scheduledEnd: now.toISOString(),
          });
          
          // 发送任务完成通知
          notificationService.notifyTaskEnd(task.title, false).catch(err => 
            console.error('发送任务完成通知失败:', err)
          );
          
          // 记录标签使用时长
          if (task.tags && task.tags.length > 0) {
            task.tags.forEach(tagName => {
              recordTagUsage(tagName, taskId, task.title, actualDuration);
              console.log(`📊 记录标签使用: ${tagName} - ${actualDuration}分钟`);
            });
          }
          
          console.log('✅ 任务完成验证成功，时间已自动修正');
        }
        
        // 清除验证状态
        setVerifyingTask(null);
        setVerifyingType(null);
          } catch (error) {
        // 清除验证状态
        setVerifyingTask(null);
        setVerifyingType(null);
        
            // 验证失败
        const failedAttemptsKey = type === 'start' ? 'startFailedAttempts' : 'completionFailedAttempts';
        const newFailedAttempts = (verification[failedAttemptsKey] || 0) + 1;
            
            setTaskVerifications(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
            [failedAttemptsKey]: newFailedAttempts,
              },
            }));
            
            SoundEffects.playFailSound();
            
            if (newFailedAttempts >= 3) {
              SoundEffects.playAlarmSound();
              VoiceReminder.speak('连续三次验证失败！扣除50金币！请认真完成任务！');
          penaltyGold(50, `${type === 'start' ? '启动' : '完成'}验证失败：${task.title}`, taskId, task.title);
              alert('⚠️ 连续三次验证失败！扣除50金币！');
            } else {
          const errorMsg = error instanceof Error ? error.message : '验证失败';
          alert(`❌ ${errorMsg}\n\n剩余尝试次数：${3 - newFailedAttempts}`);
            }
          }
        }
      
    if (type === 'start') {
      setStartingTask(null);
    } else {
      setCompletingTask(null);
    }
  };
  
  // 完成任务（带验证）
  const handleCompleteTask = async (taskId: string) => {
    const verification = taskVerifications[taskId];
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // 🔧 验证开关判断：如果任务没有设置验证，直接完成
    if (task.status === 'in_progress' && (!verification || !verification.enabled)) {
      const goldReward = task.goldReward || Math.floor((task.durationMinutes || 60) * 0.8);
      addGold(goldReward, `完成任务：${task.title}`, taskId, task.title);
      setCelebrationGold(goldReward);
      setShowCelebration(true);
      SoundEffects.playSuccessSound();
      SoundEffects.playCoinSound();
      onTaskUpdate(taskId, { status: 'completed' });
      
      // 记录标签使用时长
      if (task.tags && task.tags.length > 0) {
        const duration = task.durationMinutes || 60;
        task.tags.forEach(tagName => {
          recordTagUsage(tagName, taskId, task.title, duration);
          console.log(`📊 记录标签使用: ${tagName} - ${duration}分钟`);
        });
      }
      return;
    }
    
    // 如果任务已完成，点击取消完成
    if (task.status === 'completed') {
      if (confirm('确定要取消完成这个任务吗？')) {
        onTaskUpdate(taskId, { status: 'in_progress' });
        
        // 更新验证状态
        if (verification && verification.enabled) {
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'started',
              actualCompletionTime: null,
            },
          }));
        }
      }
      return;
    }
    
    // 如果启用了验证但还没有开始任务，不能完成
    if (verification && verification.enabled && verification.status !== 'started') {
      alert('⚠️ 请先完成启动验证才能标记完成！');
      return;
    }
    
    if (verification && verification.enabled && verification.status === 'started') {
      // 需要完成验证 - 拍照验证完成
      setCompletingTask(taskId);
      
      // 创建一个带关键词提示的相机界面
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 bg-black/90 flex flex-col';
      modal.innerHTML = `
        <div class="flex-1 flex flex-col">
          <!-- 关键词提示区域 -->
          <div class="bg-gradient-to-b from-black/80 to-transparent p-4">
            <div class="flex flex-wrap gap-2 justify-center mb-2">
              ${verification.completionKeywords.map(keyword => `
                <div class="flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                  <span class="text-2xl">✅</span>
                  <span class="text-white font-semibold text-sm">${keyword}</span>
                </div>
              `).join('')}
            </div>
            <p class="text-white/90 text-center text-sm">✅ 请拍摄或上传包含以上内容的照片</p>
          </div>
          
          <!-- 按钮区域 -->
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <button id="camera-btn-complete" class="mb-4 px-8 py-4 bg-green-600 text-white rounded-2xl text-lg font-bold hover:bg-green-700 transition-all shadow-lg">
                📷 拍照验证
              </button>
              <br>
              <button id="upload-btn-complete" class="px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg">
                🖼️ 相册上传
              </button>
              <br>
              <button id="cancel-btn-complete" class="mt-4 px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all">
                取消
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // 处理拍照
      const cameraBtn = modal.querySelector('#camera-btn-complete');
      cameraBtn?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment' as any;
        input.onchange = (e) => handleVerificationImage(e, taskId, 'complete');
        input.click();
        document.body.removeChild(modal);
      });
      
      // 处理上传
      const uploadBtn = modal.querySelector('#upload-btn-complete');
      uploadBtn?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => handleVerificationImage(e, taskId, 'complete');
        input.click();
        document.body.removeChild(modal);
      });
      
      // 处理取消
      const cancelBtn = modal.querySelector('#cancel-btn-complete');
      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
        setCompletingTask(null);
      });
    } else {
      // 无需验证，直接完成
      const goldReward = task.goldReward || Math.floor((task.durationMinutes || 60) * 0.8);
      
      // 添加金币
      addGold(goldReward, `完成任务：${task.title}`, taskId, task.title);
      
      // 显示庆祝效果
      setCelebrationGold(goldReward);
      setShowCelebration(true);
            
      // 播放音效
      SoundEffects.playSuccessSound();
      SoundEffects.playCoinSound();
            
      onTaskUpdate(taskId, { status: 'completed' });
      
      // 记录标签使用时长
      if (task.tags && task.tags.length > 0) {
        const duration = task.durationMinutes || 60;
        task.tags.forEach(tagName => {
          recordTagUsage(tagName, taskId, task.title, duration);
          console.log(`📊 记录标签使用: ${tagName} - ${duration}分钟`);
        });
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
  
  // 计算今日已过去的时间
  const calculateTimePassedToday = () => {
    if (timeBlocks.length === 0) return null;
    
    const now = new Date();
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const firstBlock = timeBlocks[0];
    const firstStartTime = firstBlock.startTime;
    
    // 如果第一个任务还没开始，计算从今天0点到第一个任务开始的时间
    if (firstStartTime > now) {
      const passedMinutes = Math.floor((now.getTime() - startOfDay.getTime()) / 60000);
      const hours = Math.floor(passedMinutes / 60);
      const mins = passedMinutes % 60;
      return { hours, mins, totalMinutes: passedMinutes, endTime: now };
    }
    
    // 如果第一个任务已经开始，计算从今天0点到第一个任务开始的时间
    const passedMinutes = Math.floor((firstStartTime.getTime() - startOfDay.getTime()) / 60000);
    const hours = Math.floor(passedMinutes / 60);
    const mins = passedMinutes % 60;
    return { hours, mins, totalMinutes: passedMinutes, endTime: firstStartTime };
  };

  const timeUntilEnd = calculateTimeUntilEndOfDay();
  const timePassed = calculateTimePassedToday();

  return (
    <div className="space-y-3 pb-4 relative">
      {/* 今日已过去提示 - 在第一个任务前 */}
      {timePassed && timePassed.totalMinutes > 0 && (
        <div className="flex items-center gap-3 mb-2">
          {/* 左侧时间对齐 */}
          <div className="w-12 flex-shrink-0 text-left">
            <div className="text-sm font-semibold" style={{ color: accentColor }}>
              00:00
            </div>
          </div>

          {/* 今日已过去按钮 */}
          <button
            onClick={() => {
              // 可以添加一些交互，比如显示详细统计
              alert(`今天已经过去了 ${timePassed.hours}小时${timePassed.mins}分钟`);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                border: `2px dashed ${borderColor}`,
              }}
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#3B82F6' }}
              >
                <Clock className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: textColor }}>
              今日已过去
              {timePassed.hours > 0 && ` ${timePassed.hours}小时`}
              {timePassed.mins > 0 && ` ${timePassed.mins}分钟`}
            </span>
          </button>
        </div>
      )}
      
      {/* 庆祝效果 */}
      <CelebrationEffect 
        show={showCelebration} 
        goldAmount={celebrationGold}
        onComplete={() => setShowCelebration(false)}
      />
      
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
      
      {/* 【低侵入式集成】验证扩展组件 - 完全独立，不影响原有代码 */}
      <TaskVerificationExtension />
      
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
      

      {/* 编辑任务弹窗 - 完整编辑功能 */}
      {editingTask && (() => {
        const task = allTasks.find(t => t.id === editingTask);
        if (!task) return null;
        
        // 初始化编辑数据
        if (!editedTaskData || editedTaskData.id !== editingTask) {
          setEditedTaskData(task);
          return null;
        }
        
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[70vh] overflow-y-auto" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b" style={{ 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb'
            }}>
                <h3 className="text-base font-bold" style={{ color: isDark ? '#ffffff' : '#000000' }}>编辑任务</h3>
              <button
                  onClick={() => {
                    setEditingTask(null);
                    setEditedTaskData(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                style={{ color: isDark ? '#ffffff' : '#000000' }}
              >
                  <X className="w-4 h-4" />
              </button>
            </div>
            
              <div className="p-3 space-y-2.5">(
                  {/* 任务标题 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>任务标题</label>
                    <input
                      type="text"
                    value={editedTaskData.title}
                    onChange={(e) => setEditedTaskData({ ...editedTaskData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border text-base"
                      style={{ 
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    />
                  </div>
                  
                  {/* 任务描述 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>任务描述</label>
                    <textarea
                    value={editedTaskData.description || ''}
                    onChange={(e) => setEditedTaskData({ ...editedTaskData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border text-base resize-none"
                      style={{ 
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                      placeholder="详细描述这个任务..."
                    />
                  </div>
                  
                  {/* 时间和时长 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>开始时间</label>
                      <input
                        type="time"
                      value={editedTaskData.scheduledStart ? new Date(editedTaskData.scheduledStart).toTimeString().slice(0, 5) : ''}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(editedTaskData.scheduledStart || new Date());
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                        setEditedTaskData({ ...editedTaskData, scheduledStart: newDate.toISOString() });
                        }}
                        className="w-full px-4 py-2 rounded-lg border text-base"
                        style={{ 
                          borderColor: isDark ? '#4b5563' : '#d1d5db',
                          backgroundColor: isDark ? '#374151' : '#ffffff',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>时长（分钟）</label>
                      <input
                        type="number"
                      value={editedTaskData.durationMinutes}
                      onChange={(e) => setEditedTaskData({ ...editedTaskData, durationMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-lg border text-base"
                        style={{ 
                          borderColor: isDark ? '#4b5563' : '#d1d5db',
                          backgroundColor: isDark ? '#374151' : '#ffffff',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        min={5}
                        max={480}
                      />
                    </div>
                  </div>
                  
                  {/* 金币奖励 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>💰 金币奖励</label>
                    <input
                      type="number"
                    value={editedTaskData.goldReward || 0}
                    onChange={(e) => setEditedTaskData({ ...editedTaskData, goldReward: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-lg border text-base"
                      style={{ 
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                      min={0}
                    />
                  </div>
                  
                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>🏷️ 标签</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                    {(editedTaskData.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                          style={{
                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                            color: isDark ? '#ffffff' : '#000000'
                          }}
                        >
                          {tag}
                          <button
                            onClick={() => {
                            const newTags = [...(editedTaskData.tags || [])];
                              newTags.splice(idx, 1);
                            setEditedTaskData({ ...editedTaskData, tags: newTags });
                            }}
                            className="hover:bg-red-500/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={() => {
                          const newTag = prompt('输入新标签：');
                          if (newTag) {
                          setEditedTaskData({ 
                            ...editedTaskData, 
                            tags: [...(editedTaskData.tags || []), newTag] 
                            });
                          }
                        }}
                        className="px-3 py-1 rounded-full text-sm font-medium border-2 border-dashed"
                        style={{
                          borderColor: isDark ? '#4b5563' : '#d1d5db',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      >
                        + 添加标签
                      </button>
                    </div>
                  </div>
                  
                  {/* 关联目标 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>🎯 关联目标</label>
                    <input
                      type="text"
                    value={editedTaskData.description || ''}
                    onChange={(e) => setEditedTaskData({ ...editedTaskData, description: e.target.value })}
                      placeholder="例如：月入5w、坚持100天..."
                      className="w-full px-4 py-2 rounded-lg border text-base"
                      style={{ 
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    />
                  </div>
                  
                  {/* 位置 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>📍 位置</label>
                    <input
                      type="text"
                    value={editedTaskData.location || ''}
                    onChange={(e) => setEditedTaskData({ ...editedTaskData, location: e.target.value })}
                      placeholder="例如：厨房、卧室、办公室..."
                      className="w-full px-4 py-2 rounded-lg border text-base"
                      style={{ 
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    />
                  </div>
                  
                  {/* 照片上传 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>📷 照片</label>
                    <div className="grid grid-cols-4 gap-2">
                      {taskImages[editingTask] && taskImages[editingTask].map((image, idx) => (
                        <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={image.url} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => {
                              setTaskImages(prev => ({
                                ...prev,
                                [editingTask]: prev[editingTask].filter(img => img.id !== image.id)
                              }));
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleOpenImagePicker(editingTask)}
                        className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center"
                        style={{
                          borderColor: isDark ? '#4b5563' : '#d1d5db',
                          backgroundColor: isDark ? '#374151' : '#f9fafb'
                        }}
                      >
                        <Camera className="w-6 h-6" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
                      </button>
                    </div>
                  </div>
                  
                  {/* 按钮 */}
                <div className="flex gap-2 pt-3 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                    <button
                      onClick={() => {
                        if (onTaskDelete && confirm('确定要删除这个任务吗？')) {
                          onTaskDelete(editingTask);
                          setEditingTask(null);
                        setEditedTaskData(null);
                        }
                      }}
                    className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      style={{ backgroundColor: '#EF4444', color: 'white' }}
                    >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                    删除
                    </button>
                    
                    <button
                    onClick={() => {
                      setEditingTask(null);
                      setEditedTaskData(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      style={{ 
                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    >
                      取消
                    </button>
                    
                    <button
                      onClick={() => {
                      onTaskUpdate(editingTask, editedTaskData);
                        setEditingTask(null);
                      setEditedTaskData(null);
                      }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      style={{ backgroundColor: '#10B981', color: 'white' }}
                    >
                    保存
                    </button>
                  </div>
                </div>
          </div>
        </div>
        );
      })()}
      
      {console.log('📊 [timeBlocks] 总数:', timeBlocks.length, '任务:', timeBlocks.map(b => b.title))}
        {timeBlocks.map((block, index) => {
        const isExpanded = expandedCards.has(block.id);
        const gap = gaps.find(g => g.id === `gap-${index}`);

        return (
          <div key={block.id}>
              {/* 🔧 零侵入添加：验证倒计时组件（独立模块，高优先级显示） */}
              
              
            {/* 任务卡片 */}
            <div className="relative flex items-start gap-3 mb-0">
              {/* 左侧时间列 */}
              <div className={`${isMobile ? 'w-10' : 'w-12'} flex-shrink-0 text-left flex flex-col`}>
                {/* 开始时间 */}
                <div className={`${isMobile ? 'text-sm' : 'text-base'} font-bold leading-none mb-1`} style={{ color: textColor }}>
                  {formatTime(block.startTime)}
                </div>
                {/* 占位，让结束时间对齐卡片底部 */}
                <div className="flex-1"></div>
                {/* 结束时间 - 对齐卡片底部 */}
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold leading-none`} style={{ color: accentColor }}>
                  {formatTime(block.endTime)}
                </div>
              </div>

              {/* 任务卡片主体 - 手机版缩小 */}
              <div 
                data-task-id={block.id}
                className={`flex-1 ${isMobile ? 'rounded-xl' : 'rounded-2xl'} shadow-lg overflow-hidden relative`}
                style={{ 
                  backgroundColor: block.isCompleted ? 'rgba(156, 163, 175, 0.5)' : block.color,
                  opacity: block.isCompleted ? 0.7 : 1,
                }}
              >
                
                {/* 🔥 验证倒计时组件 - 只在任务时间范围内且未完成时显示 */}
                {(() => {
                  const now = new Date();
                  const hasScheduledStart = !!block.startTime;
                  const hasScheduledEnd = !!block.endTime;
                  const scheduledStartTime = block.startTime ? new Date(block.startTime) : null;
                  const scheduledEndTime = block.endTime ? new Date(block.endTime) : null;
                  const isInTimeRange = scheduledStartTime && scheduledEndTime && 
                                       now >= scheduledStartTime && 
                                       now < scheduledEndTime;
                  const isNotCompleted = !block.isCompleted;
                  const shouldRender = hasScheduledStart && hasScheduledEnd && isInTimeRange && isNotCompleted;
                  
                  // 调试日志
                  console.log('🔍 倒计时渲染检查:', {
                    title: block.title,
                    now: now.toLocaleTimeString(),
                    startTime: scheduledStartTime?.toLocaleTimeString(),
                    endTime: scheduledEndTime?.toLocaleTimeString(),
                    hasScheduledStart,
                    hasScheduledEnd,
                    isInTimeRange,
                    isNotCompleted,
                    isCompleted: block.isCompleted,
                    shouldRender
                  });
                  
                  return shouldRender;
                })() && (
                  <TaskVerificationCountdownContent
                     taskId={block.id}
                     taskTitle={block.title}
                     scheduledStart={block.startTime}
                     scheduledEnd={block.endTime}
                     onComplete={(actualEndTime) => {
                       // 更新任务的实际结束时间
                       console.log('✅ 任务完成，更新结束时间:', actualEndTime);
                       onTaskUpdate(block.id, {
                         endTime: actualEndTime,
                         isCompleted: true,
                         status: 'completed'
                       });
                     }}
                     hasVerification={!!taskVerifications[block.id]?.enabled}
                     startKeywords={taskVerifications[block.id]?.startKeywords || ['启动', '开始']}
                     completeKeywords={taskVerifications[block.id]?.completionKeywords || ['完成', '结束']}
                   />
                )}
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

                {/* 验证中遮罩层 */}
                {verifyingTask === block.id && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-3 animate-pulse">⏳</div>
                      <div className="text-lg font-bold mb-2">
                        正在进行{verifyingType === 'start' ? '启动' : '完成'}验证...
                      </div>
                      <div className="text-sm opacity-80">
                        AI正在识别图片内容
                      </div>
                    </div>
                  </div>
                )}

                {/* 未展开：横向长条形布局 - 完全按照设计图，手机版缩小并压缩空白 */}
                {!isExpanded && (
                  <div className={`${isMobile ? 'p-1.5' : 'p-2.5'} text-white`} style={{ color: getTextColor(block.color) }}>
                    {/* 第一行：拖拽手柄 + 标签 + 时长 + 编辑按钮 - 减少下边距 */}
                    <div className={`flex items-center justify-between ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        {/* 拖拽手柄 */}
                        <div
                          className="cursor-move p-0.5 rounded hover:bg-white/20 transition-colors"
                          onMouseDown={(e) => handleDragStart(e, block.id, block.startTime)}
                          onTouchStart={(e) => handleDragStart(e, block.id, block.startTime)}
                        >
                          <GripVertical className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} opacity-60`} />
                        </div>
                        
                        <div className={`flex ${isMobile ? 'gap-1' : 'gap-1'} flex-wrap`}>
                          {block.tags.map((tag, idx) => (
                            <span 
                              key={idx}
                              className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-semibold ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full`}
                              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold`} style={{ color: '#ff69b4' }}>
                          *{block.duration} min
                        </div>
                        
                        {/* 编辑按钮 */}
                        <button
                          onClick={() => setEditingTask(block.id)}
                          className={`${isMobile ? 'p-0.5' : 'p-1'} rounded-full hover:bg-white/20 transition-colors`}
                          title="编辑任务"
                        >
                          <Edit2 className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                        </button>
                      </div>
                    </div>

                    {/* 第二行：图片 + 标题区域 - 手机版缩小并减少边距 */}
                    <div className={`flex ${isMobile ? 'gap-1.5 mb-0.5' : 'gap-2 mb-1'}`}>
                      {/* 圆形图片 */}
                      <div 
                        onClick={() => handleOpenImagePicker(block.id)}
                        className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative`}
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        title="点击上传照片（支持多选）"
                      >
                        {taskImages[block.id] && taskImages[block.id].length > 0 ? (
                          <img 
                            src={taskImages[block.id][0].url} 
                            alt="封面"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Camera className={`${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'} opacity-60`} />
                        )}
                        {uploadingImage === block.id && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <span className={`text-white ${isMobile ? 'text-[8px]' : 'text-[10px]'}`}>上传中</span>
                          </div>
                        )}
                      </div>

                      {/* 标题 + 目标 + 状态指示器 */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className={`flex items-center ${isMobile ? 'gap-1 mb-0' : 'gap-1 mb-0.5'}`}>
                          <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${block.isCompleted ? 'line-through' : ''}`}>
                            {block.title}
                          </h3>
                          <span className={`${isMobile ? 'text-base' : 'text-lg'}`}>{block.emoji}</span>
                        </div>
                        
                        {/* 照片任务进度条 */}
                        {(() => {
                          const { isPhotoTask, targetCount, unit } = detectPhotoTaskType(block.title);
                          if (isPhotoTask) {
                            const { uploadedCount, progress } = getPhotoTaskProgress(block.id, targetCount);
                            return (
                              <div className={`${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                                <div className="flex items-center gap-1">
                                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-bold whitespace-nowrap`}>
                                    {uploadedCount}/{targetCount}{unit}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* 状态指示器 */}
                        {block.status === 'in_progress' && (
                          <div className="mb-1">
                            <TaskStatusIndicator
                              status={block.status}
                              taskTitle={block.title}
                              taskColor={block.color}
                              isProcrastinating={taskVerifications[block.id]?.isProcrastinating}
                              isLowEfficiency={taskVerifications[block.id]?.isLowEfficiency}
                            />
                          </div>
                        )}
                        
                        <div className={`${isMobile ? 'text-[9px]' : 'text-xs'} opacity-90`}>
                          {block.goalText}
                        </div>
                      </div>
                    </div>

                    {/* 第三行：按钮 + 金币 + start - 手机版缩小 */}
                    <div className="flex items-center justify-between">
                      {/* 左侧：三个圆形按钮 */}
                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        {/* AI拆解子任务 */}
                        <button
                          onClick={() => handleGenerateSubTasks(block.id, block.title, block.description)}
                          disabled={generatingSubTasks === block.id}
                          className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50`}
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="AI拆解子任务"
                        >
                          <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>{generatingSubTasks === block.id ? '⏳' : '⭐'}</span>
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
                          className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} rounded-full flex items-center justify-center transition-all hover:scale-110`}
                          style={{ 
                            backgroundColor: taskVerifications[block.id]?.enabled 
                              ? 'rgba(34,197,94,0.4)' 
                              : 'rgba(255,255,255,0.25)' 
                          }}
                          title={taskVerifications[block.id]?.enabled ? '编辑验证关键词' : '启用拖延验证'}
                        >
                          <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>⏱️</span>
                        </button>
                        
                        {/* 笔记和附件 */}
                        <button
                          onClick={() => toggleExpand(block.id)}
                          className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} rounded-full flex items-center justify-center transition-all hover:scale-110`}
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="笔记和附件"
                        >
                          <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>📝</span>
                        </button>
                      </div>

                      {/* 右侧：金币 + start + 展开 */}
                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        <div className={`flex items-center gap-1 ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full`} style={{ backgroundColor: 'rgba(255,215,0,0.3)' }}>
                          <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>💰</span>
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold`}>{block.goldReward}</span>
                        </div>

                        {!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && (
                          <button
                            onClick={() => handleStartTask(block.id)}
                            disabled={startingTask === block.id}
                            className={`${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-bold transition-all hover:scale-105 disabled:opacity-50`}
                            style={{ 
                              backgroundColor: taskVerifications[block.id]?.status === 'started' 
                                ? 'rgba(34,197,94,0.3)' 
                                : 'rgba(255,255,255,0.95)',
                              color: taskVerifications[block.id]?.status === 'started'
                                ? 'rgba(255,255,255,0.95)'
                                : block.color,
                            }}
                            title={
                              taskVerifications[block.id]?.status === 'started'
                                ? '已启动验证'
                                : taskVerifications[block.id]?.enabled 
                                ? '拍照验证启动' 
                                : '开始任务'
                            }
                          >
                            {startingTask === block.id 
                              ? '⏳' 
                              : taskVerifications[block.id]?.status === 'started'
                              ? '✅已启动'
                              : '*start'}
                          </button>
                        )}
                        
                        {/* 宸插惎鍔ㄦ爣璇?*/}
                        {taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (
                          <div 
                            className={` rounded-full font-bold`}
                            style={{ 
                              backgroundColor: 'rgba(34,197,94,0.3)',
                              color: 'rgba(255,255,255,0.95)',
                            }}
                          >
                            鉁呭凡鍚姩
                          </div>
                        )}
                        
                        {block.status === 'in_progress' && (
                          <div 
                            className={`${isMobile ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'} rounded-full font-bold`}
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
                          className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-full flex items-center justify-center transition-all hover:scale-110`}
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                        >
                          <ChevronDown className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 验证中遮罩层（展开状态） */}
                {verifyingTask === block.id && isExpanded && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-3 animate-pulse">⏳</div>
                      <div className="text-lg font-bold mb-2">
                        正在进行{verifyingType === 'start' ? '启动' : '完成'}验证...
                      </div>
                      <div className="text-sm opacity-80">
                        AI正在识别图片内容
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
                        onClick={() => handleOpenImagePicker(block.id)}
                        className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        title="点击上传照片（支持多选）"
                      >
                        {taskImages[block.id] && taskImages[block.id].length > 0 ? (
                          <img 
                            src={taskImages[block.id][0].url} 
                            alt="封面"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Camera className="w-6 h-6 opacity-60" />
                        )}
                        {uploadingImage === block.id && (
                          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                            <span className="text-white text-xs">上传中...</span>
                          </div>
                        )}
                      </div>

                      {/* 标题区 */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className={`text-base font-bold ${block.isCompleted ? 'line-through' : ''}`}>
                            {block.title}
                          </h3>
                          <span className="text-xl">{block.emoji}</span>
                        </div>
                        
                        {/* 照片任务进度条（展开状态） */}
                        {(() => {
                          const { isPhotoTask, targetCount, unit } = detectPhotoTaskType(block.title);
                          if (isPhotoTask) {
                            const { uploadedCount, progress } = getPhotoTaskProgress(block.id, targetCount);
                            return (
                              <div className="mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold whitespace-nowrap">
                                    {uploadedCount}/{targetCount}{unit}
                                  </span>
                                </div>
                                <div className="text-[10px] opacity-80">
                                  📸 每上传1张照片 = 完成{Math.round(100/targetCount)}%任务
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
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

                      {/* 倒计时显示 - 整合到卡片内，不展开时也显示 */}
                      {taskVerifications[block.id]?.enabled && (
                        <>
                          {/* 启动验证倒计时 - 仅在等待启动时显示 */}
                          {taskVerifications[block.id]?.status === 'waiting_start' && (() => {
                            const now = new Date();
                            const scheduledStart = new Date(block.scheduledStart || block.startTime);
                            const diffMs = scheduledStart.getTime() - now.getTime();
                            const diffMinutes = Math.floor(diffMs / 60000);
                            const diffSeconds = Math.floor((diffMs % 60000) / 1000);
                            
                            if (diffMs <= 0) {
                              // 时间到了，显示启动提示
                              return (
                                <div className="mt-2 text-center">
                                  <div className="text-lg font-bold mb-1">⏰ 马上进行启动验证</div>
                                  <div className="text-xs opacity-80 mb-2">
                                    请拍摄包含【{taskVerifications[block.id]?.startKeywords?.join('、')}】的照片
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          
                          {/* 完成验证倒计时 - 仅在已启动未完成时显示 */}
                          {taskVerifications[block.id]?.status === 'started' && (() => {
                            const startTime = taskActualStartTimes[block.id] || taskVerifications[block.id]?.actualStartTime || new Date(block.startTime);
                            const estimatedMinutes = block.duration || block.durationMinutes || 30;
                            const endTime = new Date(startTime.getTime() + estimatedMinutes * 60000);
                            const now = new Date();
                            const remainingMs = endTime.getTime() - now.getTime();
                            const remainingMinutes = Math.floor(remainingMs / 60000);
                            const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
                            
                            return (
                              <div className="mt-2 text-center">
                                <div className="text-lg font-bold mb-1">
                                  ⏱️ 距离任务完成还有 {remainingMinutes}分{remainingSeconds}秒
                                </div>
                                <div className="text-xs opacity-80">
                                  完成后请拍摄包含【{taskVerifications[block.id]?.completionKeywords?.join('、')}】的照片
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}

                      {/* 右侧：金币和完成按钮 */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.3)' }}>
                          <span className="text-base">💰</span>
                          <span className="text-xs font-bold">{block.goldReward}</span>
                        </div>

                        {/* 完成验证按钮 */}
                        <button
                          onClick={() => handleCompleteTask(block.id)}
                          disabled={
                            completingTask === block.id || 
                            (taskVerifications[block.id]?.enabled && taskVerifications[block.id]?.status !== 'started')
                          }
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                          style={{ 
                            backgroundColor: block.isCompleted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                            borderColor: 'rgba(255,255,255,0.8)',
                          }}
                          title={
                            block.isCompleted 
                              ? '点击取消完成'
                              : taskVerifications[block.id]?.enabled 
                                ? (taskVerifications[block.id]?.status === 'started' ? '拍照验证完成' : '请先完成启动验证')
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
                      {!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && (
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
                       
                       {/* 宸插惎鍔ㄦ爣璇?*/}
                       {taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (
                         <div 
                           className="px-4 py-1.5 rounded-full font-bold text-sm"
                           style={{ 
                             backgroundColor: 'rgba(34,197,94,0.3)',
                             color: 'rgba(255,255,255,0.95)',
                           }}
                         >
                           鉁?宸插惎鍔?                         </div>
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
                      {/* 照片任务：显示照片网格 */}
                      {(() => {
                        const { isPhotoTask, targetCount, unit } = detectPhotoTaskType(block.title);
                        if (isPhotoTask) {
                          const images = taskImages[block.id] || [];
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium opacity-90">
                                  📸 照片任务进度
                                </div>
                                <div className="text-xs opacity-80">
                                  {images.length}/{targetCount}{unit}
                                </div>
                              </div>
                              
                              {/* 照片网格 */}
                              <div className="grid grid-cols-3 gap-2">
                                {images.map((image, idx) => (
                                  <div 
                                    key={image.id}
                                    className="relative aspect-square rounded-lg overflow-hidden group"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                                  >
                                    <img 
                                      src={image.url} 
                                      alt={`照片 ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    {idx === 0 && (
                                      <div 
                                        className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                      >
                                        封面
                                      </div>
                                    )}
                                    <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/80 text-white">
                                      ✓ {idx + 1}
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (confirm('确定要删除这张照片吗？')) {
                                          setTaskImages(prev => ({
                                            ...prev,
                                            [block.id]: prev[block.id].filter(img => img.id !== image.id)
                                          }));
                                        }
                                      }}
                                      className="absolute bottom-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3 text-white" />
                                    </button>
                                  </div>
                                ))}
                                
                                {/* 添加照片按钮 */}
                                {images.length < targetCount && (
                                  <div 
                                    onClick={() => handleOpenImagePicker(block.id)}
                                    className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ 
                                      backgroundColor: 'rgba(255,255,255,0.15)',
                                      border: '2px dashed rgba(255,255,255,0.4)'
                                    }}
                                  >
                                    <Camera className="w-6 h-6 mb-1 opacity-60" />
                                    <span className="text-[10px] opacity-80">
                                      还需{targetCount - images.length}{unit}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {images.length >= targetCount && (
                                <div className="text-center py-2 px-3 rounded-lg bg-green-500/20">
                                  <span className="text-sm font-bold">🎉 已完成所有照片上传！</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* 普通任务：显示文字子任务 */}
                      {!detectPhotoTaskType(block.title).isPhotoTask && (
                      <div className="space-y-1.5">
                        {/* 显示已有子任务 */}
                        {(taskSubTasks[block.id] || []).map((subtask) => (
                          <div 
                            key={subtask.id}
                            className="flex items-center gap-2 pl-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                            onClick={() => handleToggleSubTask(block.id, subtask.id)}
                          >
                            <div 
                              className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                              style={{ 
                                borderColor: 'rgba(255,255,255,0.8)',
                                backgroundColor: subtask.completed ? 'rgba(255,255,255,0.9)' : 'transparent',
                              }}
                            >
                              {subtask.completed && <Check className="w-3 h-3" style={{ color: block.color }} />}
                            </div>
                            <span className={`text-xs ${subtask.completed ? 'line-through opacity-60' : ''}`}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                        
                        {/* 显示默认子任务 */}
                        {(taskSubTasks[block.id] || []).length === 0 && block.subtasks.map((subtask, idx) => (
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
                        
                        {/* 添加子任务输入框 */}
                        {addingSubTask === block.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newSubTaskTitle}
                              onChange={(e) => setNewSubTaskTitle(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddManualSubTask(block.id);
                                }
                              }}
                              placeholder="输入子任务标题..."
                              className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: getTextColor(block.color),
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddManualSubTask(block.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setAddingSubTask(null);
                                setNewSubTaskTitle('');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingSubTask(block.id)}
                            className="w-full py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                          >
                            + 添加子任务
                          </button>
                        )}
                      </div>
                      )}

                      {/* 附件列表（仅普通任务显示） */}
                      {!detectPhotoTaskType(block.title).isPhotoTask && taskImages[block.id] && taskImages[block.id].length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium opacity-80">附件列表</div>
                          <div className="grid grid-cols-3 gap-2">
                            {taskImages[block.id].map((image, idx) => (
                              <div 
                                key={image.id}
                                className="relative aspect-square rounded-lg overflow-hidden group"
                                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                              >
                                <img 
                                  src={image.url} 
                                  alt={`附件 ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 0 && (
                                  <div 
                                    className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                  >
                                    封面
                                  </div>
                                )}
                                {/* 删除按钮 - 长按或点击删除 */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('确定要删除这张图片吗？')) {
                                      setTaskImages(prev => ({
                                        ...prev,
                                        [block.id]: prev[block.id].filter(img => img.id !== image.id)
                                      }));
                                    }
                                  }}
                                  className="absolute bottom-1 right-1 p-1.5 bg-red-500/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="删除图片"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 文件上传区（仅普通任务显示） */}
                      {!detectPhotoTaskType(block.title).isPhotoTask && (
                      <div 
                        onClick={() => handleOpenImagePicker(block.id)}
                        className="rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-80"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          border: '2px dashed rgba(255,255,255,0.4)'
                        }}
                      >
                        <Plus className="w-6 h-6 mb-1 opacity-60" />
                        <span className="text-xs font-medium opacity-80">点击添加照片/附件</span>
                        <span className="text-[10px] opacity-60 mt-1">支持多选，第一张为封面</span>
                      </div>
                      )}
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
                    // 使用当前时间作为开始时间
                    const now = new Date();
                    const newTask = {
                      title: '新任务',
                      scheduledStart: now.toISOString(),
                      durationMinutes: 30, // 默认30分钟
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
              // 使用当前时间作为开始时间
              const now = new Date();
              const newTask = {
                title: '新任务',
                scheduledStart: now.toISOString(),
                durationMinutes: 30, // 默认30分钟
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
              // 使用当前时间作为开始时间
              const now = new Date();
              const newTask = {
                title: '新任务',
                scheduledStart: now.toISOString(),
                durationMinutes: 30, // 默认30分钟
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



