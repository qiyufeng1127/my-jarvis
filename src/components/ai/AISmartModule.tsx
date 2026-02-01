import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles, Settings, X, Edit2, Plus, ChevronUp, ChevronDown, Clock, Coins } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useAIStore } from '@/stores/aiStore';
import { AISmartProcessor } from '@/services/aiSmartService';
import type { AIProcessRequest } from '@/services/aiSmartService';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  actions?: AIAction[];
  timestamp: Date;
}

interface AIAction {
  type: 'create_task' | 'update_timeline' | 'add_tags' | 'record_memory' | 'calculate_gold';
  data: any;
  label: string;
}

interface AISmartModuleProps {
  isDark?: boolean;
  bgColor?: string;
  className?: string;
  height?: string;
}

export default function AISmartModule({ 
  isDark = false, 
  bgColor = '#ffffff',
  className = '',
  height = '100%'
}: AISmartModuleProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTasks, setEditingTasks] = useState<any[]>([]);
  const [editingField, setEditingField] = useState<{taskIndex: number, field: string} | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  
  const { createTask } = useTaskStore();
  const { goals, addGoal } = useGrowthStore();
  const { config, setApiKey, setApiEndpoint, isConfigured } = useAIStore();

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 测试API连接
  const testConnection = async () => {
    if (!config.apiKey) {
      return false;
    }

    setIsTesting(true);
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 50, // 增加到 50，避免太小导致失败
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 测试失败:', response.status, errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('API连接测试失败:', error);
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = text || inputValue.trim();
    if (!message || isProcessing) return;

    // 检查API配置 - 使用 AI Store
    if (!isConfigured()) {
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ 请先配置API Key。点击右上角设置按钮进行配置。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

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
      const existingTasks = useTaskStore.getState().tasks || [];
      
      // 构建系统提示词
      const systemPrompt = `你是ManifestOS的AI助手，专门帮助用户管理任务和时间。

核心功能：
1. 任务分解：识别用户输入的多个任务（支持顿号、逗号、"然后"等分隔符）
2. 时间安排：解析时间表达式（如"5分钟后"、"13:17"）
3. 冲突检测：检查时间冲突并提供解决方案
4. 智能估算：估算任务时长和金币奖励

当前时间：${new Date().toLocaleString('zh-CN')}
现有任务数：${existingTasks.length}

请用简洁、友好的语气回复用户。`;

      // 调用DeepSeek API - 使用 AI Store 配置
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(m => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: message },
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // 同时使用本地AI处理器分析任务
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
        },
      };

      const localResponse = await AISmartProcessor.process(request);
      
      // 调试日志
      console.log('🔍 AI处理结果:', localResponse);
      console.log('📋 Actions:', localResponse.actions);
      console.log('📊 Data:', localResponse.data);
      
      // 如果是任务分解，直接打开编辑器，不显示按钮
      if (localResponse.actions && localResponse.actions.length > 0) {
        const taskAction = localResponse.actions.find(a => a.type === 'create_task' && a.data.tasks);
        if (taskAction && taskAction.data.tasks) {
          console.log('🎯 检测到任务分解，直接打开编辑器');
          
          // 显示AI消息（不带按钮）
          const aiMessage: AIMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: localResponse.message || aiResponse,
            data: localResponse.data,
            actions: undefined, // 不显示按钮
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // 直接打开任务编辑器
          setEditingTasks(taskAction.data.tasks);
          setShowTaskEditor(true);
          return;
        }
      }
      
      // 其他情况：正常显示消息和按钮
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: localResponse.message || aiResponse,
        data: localResponse.data,
        actions: localResponse.actions,
        timestamp: new Date(),
      };

      console.log('💬 最终消息:', aiMessage);
      setMessages(prev => [...prev, aiMessage]);

      if (localResponse.autoExecute && localResponse.actions) {
        await executeActions(localResponse.actions);
      }
    } catch (error) {
      console.error('AI处理错误:', error);
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，处理时出现了问题。请检查API配置或重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeActions = async (actions: AIAction[]) => {
    for (const action of actions) {
      if (action.type === 'create_task') {
        if (action.data.tasks && Array.isArray(action.data.tasks)) {
          for (const task of action.data.tasks) {
            const scheduledStart = task.scheduled_start_iso 
              ? new Date(task.scheduled_start_iso)
              : new Date();
            
            console.log('📝 创建任务:', {
              title: task.title,
              tags: task.tags,
              gold: task.gold,
              color: task.color,
              duration: task.estimated_duration,
            });
            
            await createTask({
              title: task.title,
              description: task.description || '',
              durationMinutes: task.estimated_duration || 30,
              taskType: task.task_type || 'life',
              scheduledStart: scheduledStart.toISOString(),
              priority: task.priority || 2, // 1=低, 2=中, 3=高
              tags: task.tags || [],
              status: 'pending',
              goldReward: task.gold || 0, // 传递金币
              color: task.color, // 传递颜色
              location: task.location, // 传递位置
            });
          }
        } else {
          const scheduledStart = action.data.scheduled_time 
            ? new Date(action.data.scheduled_time)
            : new Date();
          
          await createTask({
            title: action.data.title,
            description: action.data.description || '',
            durationMinutes: action.data.estimated_duration || 60,
            taskType: action.data.task_type || 'life',
            scheduledStart: scheduledStart.toISOString(),
            priority: action.data.priority || 2, // 1=低, 2=中, 3=高
            tags: action.data.tags || [],
            status: 'pending',
            goldReward: action.data.gold || 0,
            color: action.data.color,
            location: action.data.location,
          });
        }
      } else if (action.type === 'update_timeline') {
        // 处理时间轴操作
        const { operation, taskIds, delayMinutes } = action.data;
        const { tasks, deleteTask, updateTask } = useTaskStore.getState();
        
        if (operation === 'delete') {
          // 删除任务
          console.log('🗑️ 删除任务:', taskIds);
          for (const taskId of taskIds) {
            await deleteTask(taskId);
          }
          
          // 显示成功消息
          const successMessage: AIMessage = {
            id: `success-${Date.now()}`,
            role: 'assistant',
            content: `✅ 已成功删除 ${taskIds.length} 个任务！`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, successMessage]);
        } else if (operation === 'delay') {
          // 顺延任务
          console.log('⏰ 顺延任务:', taskIds, '延迟:', delayMinutes, '分钟');
          for (const taskId of taskIds) {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.scheduledStart) {
              const newStart = new Date(task.scheduledStart);
              newStart.setMinutes(newStart.getMinutes() + delayMinutes);
              await updateTask(taskId, {
                scheduledStart: newStart.toISOString(),
              });
            }
          }
          
          // 显示成功消息
          const successMessage: AIMessage = {
            id: `success-${Date.now()}`,
            role: 'assistant',
            content: `✅ 已成功将 ${taskIds.length} 个任务往后推 ${delayMinutes} 分钟！`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, successMessage]);
        }
      }
    }
  };

  const handleQuickCommand = (command: string) => {
    const commands: Record<string, string> = {
      decompose: '帮我分解任务：',
      timeline: '修改时间轴：',
      gold: '计算金币：',
      mood: '记录心情：',
      tags: '生成标签：',
    };
    setInputValue(commands[command] || '');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const saveApiSettings = () => {
    // 直接保存，不测试
    setShowSettings(false);
    alert('✅ API 配置已保存！\n\n如果使用时遇到问题，请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. API 接口地址是否正确');
  };

  // 重新计算所有任务的时间
  const recalculateTaskTimes = (tasks: any[], startFromIndex: number = 0) => {
    const newTasks = [...tasks];
    
    console.log('🔄 开始重新计算时间，从索引:', startFromIndex);
    
    for (let i = startFromIndex; i < newTasks.length; i++) {
      if (i === 0) {
        // 第一个任务：保持开始时间，但更新结束时间（因为时长可能改了）
        const start = new Date(newTasks[i].scheduled_start_iso);
        const end = new Date(start.getTime() + newTasks[i].estimated_duration * 60000);
        newTasks[i].scheduled_start = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        newTasks[i].scheduled_end = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        console.log(`✅ 任务${i + 1}: ${newTasks[i].scheduled_start} - ${newTasks[i].scheduled_end} (${newTasks[i].estimated_duration}分钟)`);
      } else {
        // 后续任务：紧接着前一个任务的结束时间开始（无间隔）
        const prevStart = new Date(newTasks[i - 1].scheduled_start_iso);
        const prevEnd = new Date(prevStart.getTime() + newTasks[i - 1].estimated_duration * 60000);
        const start = new Date(prevEnd.getTime()); // 前一个任务结束时间，无间隔
        const end = new Date(start.getTime() + newTasks[i].estimated_duration * 60000);
        
        newTasks[i].scheduled_start_iso = start.toISOString();
        newTasks[i].scheduled_start = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        newTasks[i].scheduled_end = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        console.log(`✅ 任务${i + 1}: ${newTasks[i].scheduled_start} - ${newTasks[i].scheduled_end} (${newTasks[i].estimated_duration}分钟)`);
      }
    }
    
    return newTasks;
  };

  // 上移任务
  const moveTaskUp = (index: number) => {
    if (index === 0) return;
    
    const newTasks = [...editingTasks];
    [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
    
    // 重新计算时间
    const recalculated = recalculateTaskTimes(newTasks, 0);
    setEditingTasks(recalculated);
  };

  // 下移任务
  const moveTaskDown = (index: number) => {
    if (index === editingTasks.length - 1) return;
    
    const newTasks = [...editingTasks];
    [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
    
    // 重新计算时间
    const recalculated = recalculateTaskTimes(newTasks, 0);
    setEditingTasks(recalculated);
  };

  // 更新任务字段
  const updateTaskField = (index: number, field: string, value: any) => {
    const newTasks = [...editingTasks];
    newTasks[index][field] = value;
    
    // 如果修改了任务名称，自动重新计算所有相关属性
    if (field === 'title') {
      console.log(`✏️ 修改任务${index + 1}的名称为: ${value}`);
      
      // 重新推断所有属性
      newTasks[index].location = AISmartProcessor.inferLocation(value);
      newTasks[index].tags = AISmartProcessor.generateTags(value);
      newTasks[index].task_type = AISmartProcessor.inferTaskType(value);
      newTasks[index].category = AISmartProcessor.inferCategory(value);
      newTasks[index].goal = AISmartProcessor.identifyGoal(value);
      newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags); // 更新颜色
      
      // 重新估算时长
      const newDuration = AISmartProcessor.estimateTaskDuration(value);
      newTasks[index].estimated_duration = newDuration;
      
      // 重新计算金币
      newTasks[index].gold = AISmartProcessor.calculateGold(newTasks[index]);
      
      console.log(`🔄 自动更新: 位置=${newTasks[index].location}, 标签=${newTasks[index].tags.join(',')}, 颜色=${newTasks[index].color}, 时长=${newDuration}分钟, 金币=${newTasks[index].gold}`);
      
      // 从当前任务开始重新计算所有时间
      const recalculated = recalculateTaskTimes(newTasks, index);
      setEditingTasks(recalculated);
    }
    // 如果修改了时长，重新计算金币和后续任务时间
    else if (field === 'estimated_duration') {
      console.log(`⚡ 修改任务${index + 1}的时长为: ${value}分钟`);
      newTasks[index].gold = AISmartProcessor.calculateGold(newTasks[index]);
      
      // 从当前任务开始重新计算所有时间（包括当前任务的结束时间）
      const recalculated = recalculateTaskTimes(newTasks, index);
      setEditingTasks(recalculated);
    } else {
      setEditingTasks(newTasks);
    }
  };

  return (
    <div 
      className={`flex flex-col ${className}`}
      style={{ 
        backgroundColor: bgColor,
        height: '100%',
        width: '100%',
      }}
    >
      {/* 头部 - 固定，减少内边距 */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4" style={{ color: textColor }} />
          <span className="font-semibold text-sm" style={{ color: textColor }}>AI智能助手</span>
          {/* 连接状态指示器 */}
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: isConfigured() ? '#10B981' : '#EF4444',
              boxShadow: isConfigured() ? '0 0 4px #10B981' : '0 0 4px #EF4444',
            }}
            title={isConfigured() ? 'API已配置' : 'API未配置'}
          />
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 rounded-lg transition-all hover:scale-110"
          style={{ backgroundColor: buttonBg }}
        >
          <Settings className="w-4 h-4" style={{ color: textColor }} />
        </button>
      </div>

      {/* API 设置弹窗 */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">API 设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 接口地址
                </label>
                <input
                  type="text"
                  value={config.apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 支持 OpenAI、DeepSeek 等兼容 API。配置后将在所有 AI 功能中生效（收集箱、智能分析等）。
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    setIsTesting(true);
                    const success = await testConnection();
                    setIsTesting(false);
                    if (success) {
                      alert('✅ 连接成功！API配置正确。');
                    } else {
                      alert('❌ 连接失败！请检查API Key和接口地址。');
                    }
                  }}
                  disabled={!config.apiKey || isTesting}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? '测试中...' : '🔌 测试连接'}
                </button>
                <button
                  onClick={saveApiSettings}
                  disabled={!config.apiKey}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 对话区域 - 可滚动，自动填充剩余空间，减少内边距 */}
      <div 
        ref={conversationRef} 
        className="flex-1 overflow-y-auto p-2 space-y-1.5"
        style={{
          minHeight: 0,
          flex: '1 1 0',
        }}
      >
        {/* 空状态提示 - 只显示示例按钮，减少间距 */}
        {messages.length === 0 && (
          <div className="space-y-1">
            {[
              '5分钟后洗漱然后吃早餐',
              '明天上午9点学习2小时',
              '今天心情很好',
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputValue(example);
                  textareaRef.current?.focus();
                }}
                className="w-full rounded-lg p-2 text-sm transition-all hover:scale-[1.02] text-left"
                style={{ backgroundColor: cardBg, color: textColor }}
              >
                💬 {example}
              </button>
            ))}
          </div>
        )}

        {/* 对话消息 */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[80%] rounded-lg p-1.5"
              style={{
                backgroundColor: message.role === 'user' ? buttonBg : cardBg,
                color: textColor,
              }}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
              
              {/* 操作按钮 */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-1 space-y-1">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        console.log('🖱️ 按钮点击:', action);
                        console.log('📋 Action type:', action.type);
                        console.log('📊 Action data:', action.data);
                        console.log('✅ Has tasks?', action.data?.tasks);
                        
                        // 如果是创建任务，打开编辑器
                        if (action.type === 'create_task' && action.data.tasks) {
                          console.log('🎯 打开任务编辑器，任务数量:', action.data.tasks.length);
                          setEditingTasks(action.data.tasks);
                          setShowTaskEditor(true);
                        } else {
                          console.log('⚡ 直接执行操作');
                          executeActions([action]);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: buttonBg, color: textColor }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="text-xs mt-1" style={{ color: accentColor }}>
                {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {/* 处理中状态 */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="rounded-lg p-1.5" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px]" style={{ color: accentColor }}>AI正在思考...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 快速指令 - 固定，减少内边距 */}
      <div className="flex-shrink-0 px-2 py-1 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center space-x-1 overflow-x-auto">
          <span className="text-[9px] whitespace-nowrap" style={{ color: accentColor }}>快速：</span>
          {[
            { key: 'decompose', label: '分解', icon: '📅' },
            { key: 'timeline', label: '时间轴', icon: '🕒' },
            { key: 'gold', label: '金币', icon: '💰' },
            { key: 'mood', label: '心情', icon: '📝' },
            { key: 'tags', label: '标签', icon: '🏷️' },
          ].map((cmd) => (
            <button
              key={cmd.key}
              onClick={() => handleQuickCommand(cmd.key)}
              className="px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all hover:scale-105 whitespace-nowrap"
              style={{ backgroundColor: buttonBg, color: textColor }}
            >
              {cmd.icon} {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* 输入区域 - 固定在底部，减少内边距 */}
      <div className="flex-shrink-0 p-1.5 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-stretch space-x-1.5">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="对我说点什么..."
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-opacity-50 text-sm"
            style={{
              backgroundColor: cardBg,
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isProcessing}
            className="px-4 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
            style={{ 
              backgroundColor: '#10B981', // 绿色背景
              color: '#ffffff', // 白色图标
              minWidth: '60px',
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 任务编辑器弹窗 - 事件卡片形式 */}
      {showTaskEditor && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full h-[95%] flex flex-col">
            {/* 头部 */}
            <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">编辑任务</h3>
                <p className="text-sm text-gray-500 mt-1">双击任意字段进行编辑，使用上下箭头调整顺序</p>
              </div>
              <button
                onClick={() => {
                  setShowTaskEditor(false);
                  setEditingTasks([]);
                  setEditingField(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="关闭编辑器"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* 任务卡片列表 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {editingTasks.map((task, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4 border-2 shadow-sm hover:shadow-md transition-all"
                  style={{
                    backgroundColor: `${task.color}15`, // 15% 透明度作为背景
                    borderColor: task.color,
                  }}
                >
                  {/* 卡片头部：序号、位置、上下移动 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold" style={{ color: task.color }}>#{index + 1}</span>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${task.color}30`,
                          color: task.color,
                        }}
                      >
                        📍 {task.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveTaskUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        style={{
                          backgroundColor: `${task.color}20`,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${task.color}40`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${task.color}20`}
                        title="上移"
                      >
                        <ChevronUp className="w-5 h-5" style={{ color: task.color }} />
                      </button>
                      <button
                        onClick={() => moveTaskDown(index)}
                        disabled={index === editingTasks.length - 1}
                        className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        style={{
                          backgroundColor: `${task.color}20`,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${task.color}40`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${task.color}20`}
                        title="下移"
                      >
                        <ChevronDown className="w-5 h-5" style={{ color: task.color }} />
                      </button>
                    </div>
                  </div>

                  {/* 任务名称 - 双击编辑 */}
                  <div className="mb-3">
                    {editingField?.taskIndex === index && editingField?.field === 'title' ? (
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTaskField(index, 'title', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                        autoFocus
                        className="w-full px-3 py-2 text-lg font-bold rounded-lg focus:outline-none focus:ring-2"
                        style={{
                          border: `2px solid ${task.color}`,
                          color: task.color,
                        }}
                      />
                    ) : (
                      <div
                        onDoubleClick={() => setEditingField({ taskIndex: index, field: 'title' })}
                        className="text-lg font-bold cursor-pointer px-3 py-2 rounded-lg transition-colors"
                        style={{ color: task.color }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${task.color}10`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {task.title}
                      </div>
                    )}
                  </div>

                  {/* 时间和时长 */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* 时间显示 */}
                    <div 
                      className="flex items-center space-x-2 rounded-lg px-3 py-2"
                      style={{ backgroundColor: `${task.color}20` }}
                    >
                      <Clock className="w-4 h-4" style={{ color: task.color }} />
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">{task.scheduled_start}</div>
                        <div className="text-xs text-gray-500">→ {task.scheduled_end}</div>
                      </div>
                    </div>

                    {/* 时长 - 双击编辑 */}
                    <div 
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: `${task.color}20` }}
                    >
                      {editingField?.taskIndex === index && editingField?.field === 'duration' ? (
                        <input
                          type="number"
                          value={task.estimated_duration}
                          onChange={(e) => updateTaskField(index, 'estimated_duration', parseInt(e.target.value) || 0)}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          autoFocus
                          className="w-full px-2 py-1 rounded focus:outline-none focus:ring-2"
                          style={{
                            border: `2px solid ${task.color}`,
                          }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => setEditingField({ taskIndex: index, field: 'duration' })}
                          className="cursor-pointer px-2 py-1 rounded transition-colors"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${task.color}30`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div className="text-xs text-gray-500">时长</div>
                          <div className="font-semibold text-gray-900">{task.estimated_duration} 分钟</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 金币 - 双击编辑 */}
                  <div className="mb-3">
                    {editingField?.taskIndex === index && editingField?.field === 'gold' ? (
                      <input
                        type="number"
                        value={task.gold}
                        onChange={(e) => updateTaskField(index, 'gold', parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                        autoFocus
                        className="w-full px-3 py-2 border-2 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    ) : (
                      <div
                        onDoubleClick={() => setEditingField({ taskIndex: index, field: 'gold' })}
                        className="flex items-center space-x-2 bg-yellow-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-yellow-100 transition-colors"
                      >
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span className="font-bold text-yellow-700">{task.gold} 金币</span>
                      </div>
                    )}
                  </div>

                  {/* 标签 */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag: string, tagIndex: number) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{
                            backgroundColor: `${AISmartProcessor.getColorForTag(tag)}30`,
                            color: AISmartProcessor.getColorForTag(tag),
                          }}
                        >
                          🏷️ {tag}
                          <button
                            onClick={() => {
                              const newTasks = [...editingTasks];
                              newTasks[index].tags = newTasks[index].tags.filter((_: any, i: number) => i !== tagIndex);
                              // 更新任务颜色
                              newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
                              setEditingTasks(newTasks);
                            }}
                            className="rounded-full p-0.5"
                            style={{
                              backgroundColor: `${AISmartProcessor.getColorForTag(tag)}20`,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${AISmartProcessor.getColorForTag(tag)}40`}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${AISmartProcessor.getColorForTag(tag)}20`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={() => {
                          const newTag = prompt('输入新标签：');
                          if (newTag) {
                            const newTasks = [...editingTasks];
                            newTasks[index].tags.push(newTag);
                            // 更新任务颜色
                            newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
                            setEditingTasks(newTasks);
                          }
                        }}
                        className="px-2 py-1 border border-dashed rounded-full text-xs hover:border-solid"
                        style={{
                          borderColor: task.color,
                          color: task.color,
                          backgroundColor: `${task.color}10`,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${task.color}20`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${task.color}10`}
                      >
                        + 标签
                      </button>
                    </div>
                  </div>

                  {/* 关联目标 - 双击编辑 */}
                  <div>
                    {task.goal ? (
                      editingField?.taskIndex === index && editingField?.field === 'goal' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={task.goal}
                            onChange={(e) => updateTaskField(index, 'goal', e.target.value)}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                            autoFocus
                            className="flex-1 px-3 py-2 border-2 border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={() => {
                              updateTaskField(index, 'goal', null);
                              setEditingField(null);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDoubleClick={() => setEditingField({ taskIndex: index, field: 'goal' })}
                          className="flex items-center space-x-2 bg-green-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-green-100 transition-colors"
                        >
                          <span className="text-sm">🎯 目标: {task.goal}</span>
                        </div>
                      )
                    ) : (
                      <select
                        onChange={(e) => {
                          if (e.target.value === 'new') {
                            const newGoal = prompt('输入新的长期目标：');
                            if (newGoal) {
                              updateTaskField(index, 'goal', newGoal);
                              updateTaskField(index, 'isNewGoal', true);
                            }
                          } else if (e.target.value) {
                            updateTaskField(index, 'goal', e.target.value);
                          }
                          e.target.value = '';
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm"
                        style={{
                          borderColor: task.color,
                        }}
                      >
                        <option value="">🎯 点击添加目标...</option>
                        {goals.map((goal) => (
                          <option key={goal.id} value={goal.title}>
                            {goal.title}
                          </option>
                        ))}
                        <option value="new">+ 创建新目标</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 底部按钮 */}
            <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex space-x-3">
              <button
                onClick={() => {
                  setShowTaskEditor(false);
                  setEditingTasks([]);
                  setEditingField(null);
                }}
                className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                ❌ 取消
              </button>
              <button
                onClick={async () => {
                  // 添加新目标到长期目标系统
                  for (const task of editingTasks) {
                    if (task.goal && task.isNewGoal) {
                      const existingGoal = goals.find(g => g.title === task.goal);
                      if (!existingGoal) {
                        await addGoal({
                          title: task.goal,
                          description: `通过AI智能助手自动创建`,
                          category: 'personal',
                          priority: 'medium',
                          status: 'active',
                        });
                      }
                    }
                  }

                  // 创建任务并推送到时间轴
                  console.log('📤 开始推送任务到时间轴:', editingTasks);
                  await executeActions([{
                    type: 'create_task',
                    data: { tasks: editingTasks },
                    label: '确认',
                  }]);
                  
                  // 关闭编辑器
                  setShowTaskEditor(false);
                  setEditingTasks([]);
                  setEditingField(null);
                  
                  // 显示成功消息
                  const successMessage: AIMessage = {
                    id: `success-${Date.now()}`,
                    role: 'assistant',
                    content: `✅ 已成功添加 ${editingTasks.length} 个任务到时间轴！`,
                    timestamp: new Date(),
                  };
                  setMessages(prev => [...prev, successMessage]);
                }}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold transition-all transform hover:scale-105 shadow-lg"
              >
                🚀 全部推送到时间轴
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
