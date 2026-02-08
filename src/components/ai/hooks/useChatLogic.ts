import { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { useAIStore } from '@/stores/aiStore';
import { AISmartProcessor } from '@/services/aiSmartService';
import { SmartScheduleService } from '@/services/smartScheduleService';
import type { AIProcessRequest } from '@/services/aiSmartService';
import type { ScheduleTask } from '@/services/smartScheduleService';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  actions?: AIAction[];
  timestamp: Date;
  thinkingProcess?: string[];
  isThinkingExpanded?: boolean;
  isSelected?: boolean;
}

export interface AIAction {
  type: 'create_task' | 'update_timeline' | 'add_tags' | 'record_memory' | 'calculate_gold' | 'add_income' | 'add_expense' | 'create_side_hustle' | 'add_debt' | 'smart_schedule';
  data: any;
  label: string;
}

/**
 * 聊天逻辑 Hook
 * 处理消息发送、AI 处理、操作执行等核心逻辑
 */
export function useChatLogic() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const conversationRef = useRef<HTMLDivElement>(null);
  
  const { createTask, updateTask, deleteTask, tasks: allTasks, getTodayTasks } = useTaskStore();
  const { goals, addGoal } = useGrowthStore();
  const { 
    getActiveSideHustles, 
    addIncome, 
    addExpense, 
    createSideHustle, 
    addDebt 
  } = useSideHustleStore();
  const { isConfigured } = useAIStore();

  // 自动滚动到底部
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息
  const handleSend = async (text?: string) => {
    const message = text || inputValue.trim();
    if (!message || isProcessing) return;

    // 检查 API 配置
    if (!isConfigured()) {
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ API Key 未配置\n\n请先在 AI 设置中配置 API Key 和 API 端点。\n\n点击右上角的 ⚙️ 图标进行配置。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // 立即显示用户消息
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // 调用 AI 处理器
      const existingTasks = allTasks || [];
      const existingSideHustles = getActiveSideHustles();
      
      const request: AIProcessRequest = {
        user_input: message,
        context: {
          user_id: 'current-user',
          current_time: new Date().toLocaleTimeString('zh-CN'),
          current_date: new Date().toLocaleDateString('zh-CN'),
          timeline_summary: {},
          user_preferences: {},
          conversation_history: messages.slice(-5),
          existing_tasks: existingTasks,
          existing_side_hustles: existingSideHustles,
        },
      };

      const response = await AISmartProcessor.process(request);
      
      // 显示 AI 消息
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        data: response.data,
        actions: response.actions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // 自动执行操作
      if (response.autoExecute && response.actions) {
        await executeActions(response.actions);
      }

      return response;
    } catch (error) {
      console.error('❌ AI处理失败:', error);
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ 抱歉，处理时出现了问题。请检查 AI 配置或稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 执行操作
  const executeActions = async (actions: AIAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'create_task':
          // 批量创建任务
          if (action.data.tasks && Array.isArray(action.data.tasks)) {
            for (const task of action.data.tasks) {
              const scheduledStart = task.scheduled_start_iso 
                ? new Date(task.scheduled_start_iso)
                : new Date();
              
              await createTask({
                title: task.title,
                description: task.description || '',
                durationMinutes: task.estimated_duration || 30,
                taskType: task.task_type || 'life',
                scheduledStart: scheduledStart.toISOString(),
                priority: task.priority || 2,
                tags: task.tags || [],
                status: 'pending',
                goldReward: task.gold || 0,
                color: task.color,
                location: task.location,
              });
            }
          } else {
            // 单任务创建
            const scheduledStart = action.data.scheduled_time 
              ? new Date(action.data.scheduled_time)
              : new Date();
            
            await createTask({
              title: action.data.title,
              description: action.data.description || '',
              durationMinutes: action.data.estimated_duration || 60,
              taskType: action.data.task_type || 'life',
              scheduledStart: scheduledStart.toISOString(),
              priority: action.data.priority || 2,
              tags: action.data.tags || [],
              status: 'pending',
              goldReward: action.data.gold || 0,
              color: action.data.color,
              location: action.data.location,
            });
          }
          break;
          
        case 'update_timeline':
          // 更新时间轴任务
          if (action.data.operation === 'delete') {
            const taskIds = action.data.taskIds || [];
            for (const taskId of taskIds) {
              await deleteTask(taskId);
            }
          } else if (action.data.operation === 'move') {
            const taskIds = action.data.taskIds || [];
            const targetDate = new Date(action.data.targetDate);
            
            for (const taskId of taskIds) {
              const task = allTasks.find(t => t.id === taskId);
              if (task && task.scheduledStart) {
                const oldStart = new Date(task.scheduledStart);
                const newStart = new Date(targetDate);
                newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
                
                const newEnd = task.scheduledEnd 
                  ? new Date(newStart.getTime() + (new Date(task.scheduledEnd).getTime() - oldStart.getTime()))
                  : undefined;
                
                await updateTask(taskId, {
                  scheduledStart: newStart,
                  scheduledEnd: newEnd,
                });
              }
            }
          } else if (action.data.operation === 'delay') {
            const taskIds = action.data.taskIds || [];
            const delayMinutes = action.data.delayMinutes || 60;
            
            for (const taskId of taskIds) {
              const task = allTasks.find(t => t.id === taskId);
              if (task && task.scheduledStart) {
                const newStart = new Date(new Date(task.scheduledStart).getTime() + delayMinutes * 60000);
                const newEnd = task.scheduledEnd 
                  ? new Date(new Date(task.scheduledEnd).getTime() + delayMinutes * 60000)
                  : undefined;
                
                await updateTask(taskId, {
                  scheduledStart: newStart,
                  scheduledEnd: newEnd,
                });
              }
            }
          }
          break;
          
        case 'add_income':
          await addIncome({
            sideHustleId: action.data.sideHustleId,
            amount: action.data.amount,
            description: action.data.description,
            date: action.data.date || new Date(),
          });
          break;
          
        case 'add_expense':
          await addExpense({
            sideHustleId: action.data.sideHustleId,
            amount: action.data.amount,
            description: action.data.description,
            date: action.data.date || new Date(),
          });
          break;
          
        case 'create_side_hustle':
          const newHustle = await createSideHustle({
            name: action.data.name,
            icon: action.data.icon || '💰',
            color: action.data.color || '#10b981',
            status: action.data.status || 'active',
            startDate: action.data.startDate,
          });
          
          if (action.data.thenAddIncome) {
            await addIncome({
              sideHustleId: newHustle.id,
              amount: action.data.thenAddIncome.amount,
              description: action.data.thenAddIncome.description,
              date: new Date(),
            });
          }
          
          if (action.data.thenAddExpense) {
            await addExpense({
              sideHustleId: newHustle.id,
              amount: action.data.thenAddExpense.amount,
              description: action.data.thenAddExpense.description,
              date: new Date(),
            });
          }
          break;
          
        case 'add_debt':
          await addDebt({
            amount: action.data.amount,
            description: action.data.description,
            dueDate: action.data.dueDate,
            isPaid: action.data.isPaid || false,
          });
          break;
          
        case 'smart_schedule':
          // 智能分配任务到时间轴
          if (action.data.tasks && Array.isArray(action.data.tasks)) {
            const tasksToSchedule: ScheduleTask[] = action.data.tasks.map((task: any) => ({
              id: task.id,
              title: task.title,
              durationMinutes: task.durationMinutes || task.estimated_duration || 30,
              priority: task.priority || 2,
              tags: task.tags || [],
              location: task.location,
              goldReward: task.goldReward || task.gold || 0,
              taskType: task.taskType || task.task_type || 'life',
              category: task.category,
              color: task.color,
              description: task.description,
              subtasks: task.subtasks,
            }));
            
            // 提取时间信息
            const tasksWithTime = SmartScheduleService.extractTimesFromTasks(tasksToSchedule);
            
            // 智能分配
            const results = SmartScheduleService.scheduleTasks(tasksWithTime, allTasks);
            
            // 创建任务
            for (const result of results) {
              if (!result.isConflict) {
                await createTask({
                  title: result.task.title,
                  description: result.task.description || '',
                  durationMinutes: result.task.durationMinutes,
                  taskType: result.task.taskType || 'life',
                  scheduledStart: result.scheduledStart.toISOString(),
                  scheduledEnd: result.scheduledEnd.toISOString(),
                  priority: result.task.priority || 2,
                  tags: result.task.tags || [],
                  status: 'pending',
                  goldReward: result.task.goldReward || 0,
                  color: result.task.color,
                  location: result.task.location,
                });
              }
            }
          }
          break;
      }
    }
  };

  // 切换消息选中状态
  const toggleMessageSelection = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isSelected: !msg.isSelected }
        : msg
    ));
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const userMessages = messages.filter(m => m.role === 'user');
    const allSelected = userMessages.every(m => m.isSelected);
    
    setMessages(prev => prev.map(msg => 
      msg.role === 'user' 
        ? { ...msg, isSelected: !allSelected }
        : msg
    ));
  };

  // 切换思考过程展开/折叠
  const toggleThinkingExpanded = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isThinkingExpanded: !msg.isThinkingExpanded }
        : msg
    ));
  };

  return {
    messages,
    setMessages,
    isProcessing,
    setIsProcessing,
    inputValue,
    setInputValue,
    conversationRef,
    handleSend,
    executeActions,
    toggleMessageSelection,
    toggleSelectAll,
    toggleThinkingExpanded,
    isConfigured: isConfigured(),
  };
}

