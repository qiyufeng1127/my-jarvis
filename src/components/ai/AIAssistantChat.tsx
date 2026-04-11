import React, { useState, useRef, useEffect } from 'react';
import { Check, Send, Settings, Sparkles, Target } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useTaskStore } from '@/stores/taskStore';
import { useKeyboardAvoidance } from '@/hooks';
import type { TaskType } from '@/types';
import eventBus from '@/utils/eventBus';
import UnifiedTaskEditor from '@/components/shared/UnifiedTaskEditor';
import AIPersonalitySettings from './AIPersonalitySettings';
import { aiAssistantService } from '@/services/aiAssistantService';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';

type AIInputMode = 'auto' | 'goal' | 'task' | 'timeline' | 'thought';

interface GoalDocumentDailyInvestment {
  raw?: string;
  hours?: number;
  minutes?: number;
}

interface GoalDocumentKeyResult {
  name: string;
  targetValue?: number;
  unit?: string;
}

interface GoalDocumentItem {
  goalTitle: string;
  description?: string;
  deadline?: string | null;
  dailyInvestment?: GoalDocumentDailyInvestment;
  dailyInvestmentHours?: number;
  keyResults?: GoalDocumentKeyResult[];
}

function formatDailyInvestment(goal: GoalDocumentItem) {
  if (goal.dailyInvestment?.raw) return goal.dailyInvestment.raw;

  const hours = goal.dailyInvestment?.hours ?? goal.dailyInvestmentHours;
  const minutes = goal.dailyInvestment?.minutes;

  if (typeof hours === 'number' && typeof minutes === 'number') {
    return `${hours} 小时（${minutes} 分钟）`;
  }

  if (typeof hours === 'number') return `${hours} 小时`;
  if (typeof minutes === 'number') return `${minutes} 分钟`;
  return '未提取';
}

function GoalDocumentPreview({
  action,
  onCreate,
}: {
  action: { type: string; description: string; data?: any };
  onCreate: (goals: GoalDocumentItem[], document: string) => Promise<void>;
}) {
  const data = action.data;

  if (!data || data.mode !== 'document_analysis' || !Array.isArray(data.goals) || data.goals.length === 0) {
    return null;
  }

  const goals = data.goals as GoalDocumentItem[];
  const createdGoals = Array.isArray(data.createdGoals) ? data.createdGoals : [];
  const isCreated = createdGoals.length > 0;
  const [editableGoals, setEditableGoals] = useState<GoalDocumentItem[]>(() => goals);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>(() => goals.map((_, index) => index));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEditableGoals(goals);
    setSelectedIndexes(goals.map((_, index) => index));
  }, [data]);

  const updateGoal = (index: number, updates: Partial<GoalDocumentItem>) => {
    setEditableGoals((prev) => prev.map((goal, goalIndex) => (
      goalIndex === index ? { ...goal, ...updates } : goal
    )));
  };

  const updateKeyResult = (goalIndex: number, krIndex: number, updates: Partial<GoalDocumentKeyResult>) => {
    setEditableGoals((prev) => prev.map((goal, currentGoalIndex) => {
      if (currentGoalIndex !== goalIndex) return goal;
      return {
        ...goal,
        keyResults: (goal.keyResults || []).map((kr, currentKrIndex) => (
          currentKrIndex === krIndex ? { ...kr, ...updates } : kr
        )),
      };
    }));
  };

  const toggleGoalSelection = (index: number) => {
    setSelectedIndexes((prev) => (
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index].sort((a, b) => a - b)
    ));
  };

  const handleCreate = async () => {
    const selectedGoals = editableGoals.filter((_, index) => selectedIndexes.includes(index));
    if (selectedGoals.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreate(selectedGoals, data.document || '');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-[24px] border border-[#e7d7ff] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,245,255,0.96))] text-[#241438] shadow-[0_18px_40px_rgba(130,84,255,0.12)]">
      <div className="border-b border-[#eadcff] bg-[radial-gradient(circle_at_top_left,rgba(170,119,255,0.25),transparent_48%),linear-gradient(135deg,#fff8ff,#f7efff)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff]/70 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[#8d55ff] uppercase">
              <Target className="h-3.5 w-3.5" />
              目标智能拆解
            </div>
            <h4 className="mt-3 text-[18px] font-semibold text-[#26123d]">已识别 {editableGoals.length} 个总目标</h4>
            <p className="mt-1 text-sm text-[#70588f]">你可以直接修改标题、每日投入时间、关键结果数值，并只勾选需要创建的目标。</p>
          </div>

          {!isCreated && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={selectedIndexes.length === 0 || isSubmitting}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#8d55ff] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(141,85,255,0.35)] transition-transform hover:scale-[1.02] hover:bg-[#7c43f2] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <Check className="h-4 w-4" />
              {isSubmitting ? '创建中...' : `创建已勾选目标（${selectedIndexes.length}）`}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#f0e7ff] px-4 py-3 text-xs text-[#7a61a1]">
        <span>已勾选 {selectedIndexes.length} / {editableGoals.length} 个目标</span>
        {!isCreated && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIndexes(editableGoals.map((_, index) => index))}
              className="rounded-full bg-white px-3 py-1 text-[#7d49d9]"
            >
              全选
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndexes([])}
              className="rounded-full bg-white px-3 py-1 text-[#a06077]"
            >
              清空
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 px-3 py-3">
        {editableGoals.map((goal, index) => (
          <div key={`${goal.goalTitle}-${index}`} className="rounded-[20px] border border-[#eee4ff] bg-white/90 px-4 py-4 shadow-[0_8px_18px_rgba(116,78,160,0.06)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#5b3d89]">
                <input
                  type="checkbox"
                  checked={selectedIndexes.includes(index)}
                  onChange={() => toggleGoalSelection(index)}
                  disabled={isCreated}
                  className="h-4 w-4 rounded border-[#cfaeff] text-[#8d55ff] focus:ring-[#8d55ff]"
                />
                创建这个总目标
              </label>
              <div className="text-xs font-medium text-[#9b7bc0]">总目标 {index + 1}</div>
            </div>

            <div className="grid gap-3">
              <input
                type="text"
                value={goal.goalTitle}
                onChange={(e) => updateGoal(index, { goalTitle: e.target.value })}
                disabled={isCreated}
                className="w-full rounded-[16px] border border-[#e8dbff] bg-[#fcfaff] px-4 py-3 text-[15px] font-semibold text-[#221033] outline-none focus:border-[#b58aff]"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-[#8f74ba]">每日投入时间</div>
                  <input
                    type="text"
                    value={goal.dailyInvestment?.raw || formatDailyInvestment(goal)}
                    onChange={(e) => updateGoal(index, {
                      dailyInvestment: {
                        ...(goal.dailyInvestment || {}),
                        raw: e.target.value,
                      },
                    })}
                    disabled={isCreated}
                    className="w-full rounded-[14px] border border-[#eadfff] bg-white px-3 py-2 text-sm text-[#301a47] outline-none focus:border-[#b58aff]"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-[#8f74ba]">截止日期</div>
                  <input
                    type="text"
                    value={goal.deadline || ''}
                    onChange={(e) => updateGoal(index, { deadline: e.target.value || null })}
                    disabled={isCreated}
                    placeholder="如：4月13日前"
                    className="w-full rounded-[14px] border border-[#eadfff] bg-white px-3 py-2 text-sm text-[#301a47] outline-none focus:border-[#b58aff]"
                  />
                </div>
              </div>
            </div>

            {goal.description && (
              <p className="mt-3 text-sm leading-6 text-[#6f5a89]">{goal.description}</p>
            )}

            <div className="mt-4 rounded-[18px] bg-[#faf7ff] px-3 py-3">
              <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-[#9065d6] uppercase">关键结果</div>
              <div className="space-y-2">
                {(goal.keyResults || []).map((kr, krIndex) => (
                  <div key={`${kr.name}-${krIndex}`} className="rounded-[14px] bg-white px-3 py-3 text-sm text-[#301a47]">
                    <div className="grid gap-2 md:grid-cols-[1fr_110px_90px]">
                      <input
                        type="text"
                        value={kr.name}
                        onChange={(e) => updateKeyResult(index, krIndex, { name: e.target.value })}
                        disabled={isCreated}
                        className="w-full rounded-[12px] border border-[#eadfff] bg-[#fefcff] px-3 py-2 outline-none focus:border-[#b58aff]"
                      />
                      <input
                        type="number"
                        value={typeof kr.targetValue === 'number' ? kr.targetValue : ''}
                        onChange={(e) => updateKeyResult(index, krIndex, {
                          targetValue: e.target.value === '' ? undefined : Number(e.target.value),
                        })}
                        disabled={isCreated}
                        className="w-full rounded-[12px] border border-[#eadfff] bg-[#fefcff] px-3 py-2 outline-none focus:border-[#b58aff]"
                      />
                      <input
                        type="text"
                        value={kr.unit || ''}
                        onChange={(e) => updateKeyResult(index, krIndex, { unit: e.target.value })}
                        disabled={isCreated}
                        className="w-full rounded-[12px] border border-[#eadfff] bg-[#fefcff] px-3 py-2 outline-none focus:border-[#b58aff]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreated && (
        <div className="border-t border-[#eadcff] bg-[#faf6ff] px-4 py-3 text-sm text-[#6f4ca9]">
          已成功创建 {createdGoals.length} 个总目标，可前往目标板块继续微调。
        </div>
      )}
    </div>
  );
}


/**
 * AI 助手聊天界面（使用完整系统提示词）
 */
export default function AIAssistantChat() {
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<AIInputMode>('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTasks, setEditingTasks] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { handleFocusCapture, scrollIntoSafeView } = useKeyboardAvoidance(chatScrollRef);
  const { createTask } = useTaskStore();
  const addMessage = useAIPersonalityStore((state) => state.addMessage);
  
  const {
    isProcessing,
    error,
    personality,
    chatHistory,
    sendMessage,
    changePersonality,
    customizePersonality,
    clearHistory,
  } = useAIAssistant();
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const handleOpenTaskEditor = (payload?: { tasks?: any[] }) => {
      if (!payload?.tasks || payload.tasks.length === 0) return;
      setEditingTasks(payload.tasks);
      setShowTaskEditor(true);
    };

    eventBus.on('ai:open-task-editor', handleOpenTaskEditor);

    return () => {
      eventBus.off('ai:open-task-editor', handleOpenTaskEditor);
    };
  }, []);

  const handlePushToTimeline = async (tasks: any[]) => {
    if (!tasks.length) return;

    for (const task of tasks) {
      const scheduledStart = task.scheduled_start_iso ? new Date(task.scheduled_start_iso) : new Date();
      const scheduledEnd = new Date(scheduledStart.getTime() + (task.estimated_duration || 30) * 60000);

      await createTask({
        title: task.title,
        description: task.description || '',
        taskType: (task.task_type || 'life') as TaskType,
        priority: task.priority === 'high' ? 1 : task.priority === 'low' ? 3 : 2,
        durationMinutes: task.estimated_duration || 30,
        scheduledStart,
        scheduledEnd,
        tags: task.tags || [],
        color: task.color,
        location: task.location,
        goldReward: task.gold || 0,
        verificationEnabled: true,
        startKeywords: task.tags?.length ? task.tags : [task.title],
        completeKeywords: task.tags?.length ? task.tags : [task.title],
      });
    }

    setShowTaskEditor(false);
    setEditingTasks([]);
  };
  
  const handleCreateGoalsFromDocument = async (goals: GoalDocumentItem[], document: string) => {
    const result = await aiAssistantService.executeAction('goal_manage', 'create_from_document', {
      action: 'create_from_document',
      goals,
      document,
    });

    if (!result.success) return;

    addMessage({
      role: 'assistant',
      content: `✅ ${result.message || '已根据解析结果创建目标'}`,
      actions: [{
        type: 'goal_manage',
        description: result.message || '已根据解析结果创建目标',
        data: result.data,
      }],
    });
  };

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const message = input.trim();
    setInput('');
    
    const result = await sendMessage(message, activeMode);
    
    if (result?.actions && result.actions.length > 0) {
      // 显示操作结果
      console.log('执行的操作:', result.actions);
    }
  };
  
  const quickModes: { id: AIInputMode; label: string; hint: string }[] = [
    { id: 'auto', label: '自动识别', hint: '自由判断意图' },
    { id: 'goal', label: '关于目标', hint: '优先解析为目标' },
    { id: 'task', label: '任务分解', hint: '优先拆成任务' },
    { id: 'timeline', label: '时间轴操作', hint: '删除/移动/顺延任务' },
    { id: 'thought', label: '碎碎念', hint: '记录想法和心情' },
  ];
  
  const modePlaceholderMap: Record<AIInputMode, string> = {
    auto: `跟 ${personality.name} 说点什么...`,
    goal: '已进入“关于目标”模式，发送整段目标文档让我智能拆解...',
    task: '已进入“任务分解”模式，输入计划让我拆成任务...',
    timeline: '已进入“时间轴操作”模式，输入删除/顺延/移动指令...',
    thought: '已进入“碎碎念”模式，输入你的想法或心情...',
  };
  
  // 快捷输入示例
  const quickInputs = [
    '5分钟后洗漱，然后洗衣服',
    '今天心情不错',
    '记账：午餐花了50元',
    '查看今天的任务',
  ];
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 keyboard-safe-area-top">
      {showTaskEditor && editingTasks.length > 0 && (
        <UnifiedTaskEditor
          tasks={editingTasks}
          onClose={() => {
            setShowTaskEditor(false);
            setEditingTasks([]);
          }}
          onConfirm={handlePushToTimeline}
          isDark={true}
        />
      )}
      {/* 顶部栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{personality.avatar}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {personality.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {personality.type === 'gentle' && '温柔鼓励型'}
              {personality.type === 'strict' && '严格督促型'}
              {personality.type === 'humorous' && '幽默吐槽型'}
              {personality.type === 'analytical' && '理性分析型'}
              {personality.type === 'bestie' && '闺蜜陪伴型'}
              {personality.type === 'chill' && '佛系随和型'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="性格设置"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* 性格设置面板 */}
      {showSettings && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <AIPersonalitySettings />
        </div>
      )}
      
      {/* 消息列表 */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 keyboard-aware-scroll">
        <div className="flex flex-wrap gap-2">
          {quickModes.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveMode(mode.id)}
                className={`rounded-full px-3 py-2 text-sm transition-all ${
                  isActive
                    ? 'bg-[#8d55ff] text-white shadow-[0_8px_18px_rgba(141,85,255,0.28)]'
                    : 'bg-[#f3edff] text-[#6c43bb] hover:bg-[#eadfff]'
                }`}
                title={mode.hint}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {activeMode !== 'auto' && (
          <div className="rounded-[18px] border border-[#eadcff] bg-[#faf6ff] px-4 py-3 text-sm text-[#6e4aa6]">
            当前已开启“{quickModes.find((mode) => mode.id === activeMode)?.label}”模式。你现在发送的内容会优先按这个模式理解，而不是走自动混合识别。
          </div>
        )}

        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              你好！我是 {personality.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              我可以帮你管理任务、记录心情、记账等等
            </p>
            
            {/* 快捷输入 */}
            <div className="flex flex-wrap gap-2 justify-center">
              {quickInputs.map((text, index) => (
                <button
                  key={index}
                  onClick={() => setInput(text)}
                  className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {chatHistory.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              {/* 消息内容 */}
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* 执行的操作 */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-700/50 space-y-1">
                  {message.actions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 dark:text-green-300">✓</span>
                      <span className="flex-1">{action.description}</span>
                    </div>
                  ))}
                </div>
              )}

              {message.actions?.map((action, index) => (
                <GoalDocumentPreview
                  key={`goal-preview-${message.id}-${index}`}
                  action={action}
                  onCreate={handleCreateGoalsFromDocument}
                />
              ))}
              
              {/* 时间戳 */}
              <div className="text-xs opacity-50 mt-1">
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        
        {/* 处理中指示器 */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">思考中...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入框 */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 keyboard-aware-composer" onFocusCapture={handleFocusCapture}>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => scrollIntoSafeView(document.activeElement as HTMLElement | null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={modePlaceholderMap[activeMode]}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            按 Enter 发送，Shift + Enter 换行
          </p>
          
          {chatHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              清空对话
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

