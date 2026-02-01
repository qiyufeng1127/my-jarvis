import { useState, useEffect } from 'react';
import { Plus, Sparkles, Trash2, Calendar, Clock, Coins, X } from 'lucide-react';
import { InboxManager, type TaskInInbox } from '@/services/aiSmartService';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useAIStore } from '@/stores/aiStore';
import { aiService } from '@/services/aiService';
import { matchTaskToGoals } from '@/services/aiGoalMatcher';
import {
  detectTaskLocation,
  detectTaskDuration,
  LOCATION_NAMES,
  LOCATION_ICONS,
  getPriorityEmoji,
} from '@/utils/taskUtils';

interface TaskInboxProps {
  isDark?: boolean;
  bgColor?: string;
}

interface ExtendedInboxTask extends TaskInInbox {
  goldReward?: number;
  isScheduled?: boolean;
}

interface DecomposedTask {
  id: string;
  title: string;
  duration: number;
  startTime?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  location?: string;
  goldReward?: number;
}

export default function TaskInbox({ isDark = false, bgColor = '#ffffff' }: TaskInboxProps) {
  const [inboxTasks, setInboxTasks] = useState<ExtendedInboxTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [scheduledTasks, setScheduledTasks] = useState<ExtendedInboxTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTasks, setConfirmationTasks] = useState<DecomposedTask[]>([]);
  const { createTask, tasks: existingTasks } = useTaskStore();
  const { goals } = useGoalStore();
  const { isConfigured } = useAIStore();
  
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  // 加载收集箱任务
  useEffect(() => {
    loadInboxTasks();
  }, []);

  const loadInboxTasks = () => {
    const tasks = InboxManager.getInboxTasks();
    const extendedTasks: ExtendedInboxTask[] = tasks.map(task => ({
      ...task,
      isScheduled: false,
    }));
    setInboxTasks(extendedTasks);
  };

  // 添加任务到收集箱（简化版，不分析）
  const handleAddToInbox = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: ExtendedInboxTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      description: '',
      estimatedDuration: 30, // 默认值，稍后AI会分析
      category: '其他',
      priority: 'medium',
      taskType: 'work',
      tags: [],
      isScheduled: false,
    };

    setInboxTasks([...inboxTasks, newTask]);
    setNewTaskTitle('');
  };

  // 添加到待安排
  const handleAddToScheduled = (taskId: string) => {
    const task = inboxTasks.find(t => t.id === taskId);
    if (!task) return;

    // 更新任务状态
    setInboxTasks(inboxTasks.map(t => 
      t.id === taskId ? { ...t, isScheduled: true } : t
    ));

    // 添加到待安排列表
    setScheduledTasks([...scheduledTasks, { ...task, isScheduled: true }]);
  };

  // 从待安排移除
  const handleRemoveFromScheduled = (taskId: string) => {
    setInboxTasks(inboxTasks.map(t => 
      t.id === taskId ? { ...t, isScheduled: false } : t
    ));
    setScheduledTasks(scheduledTasks.filter(t => t.id !== taskId));
  };

  // 删除任务
  const handleDelete = (taskId: string) => {
    setInboxTasks(inboxTasks.filter(t => t.id !== taskId));
    setScheduledTasks(scheduledTasks.filter(t => t.id !== taskId));
  };

  // 智能分配任务到时间轴（使用与 AI 智能输入相同的逻辑）
  const handleSmartSchedule = async () => {
    if (scheduledTasks.length === 0) {
      alert('请先添加任务到待安排列表');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 检查是否配置了 AI
      const hasAI = isConfigured();
      
      if (!hasAI) {
        alert('AI 功能需要配置 API Key 才能使用智能分配。\n\n请在设置中配置 API Key 后再试。');
        setIsAnalyzing(false);
        return;
      }

      // 构建任务描述
      const taskDescriptions = scheduledTasks.map(t => t.title).join('，然后');
      
      // 使用与 AI 智能输入相同的增强提示词
      const enhancedPrompt = `${taskDescriptions}

请帮我把这段话分解成多个独立的任务，并注意：

1. **仔细识别每个独立的动作**，例如：
   - "洗漱" 是一个任务
   - "洗衣服" 是另一个任务
   - "吃饭" 是另一个任务
   - "收拾垃圾" 是另一个任务
   - 不要把多个动作合并成一个任务！

2. **识别每个任务的位置**（厕所、工作区、厨房、客厅、卧室、拍摄间）

3. **按照家里格局优化动线**：
   - 进门左手边是厕所，右手边是工作区
   - 往前走左手边是厨房，右手边是客厅
   - 从厨房楼梯上去左手边是卧室，右手边是拍摄间

4. **根据任务类型智能分配时长**：
   - 工作相关：60分钟起步
   - 打扫收拾：10分钟
   - 在家吃饭：30分钟
   - 外出吃饭：120分钟
   - 外出喝酒：240分钟
   - 上楼睡觉：5分钟
   - 吃药：2分钟
   - 洗漱：5-10分钟
   - 洗碗、倒猫粮、洗衣服等简单家务：5-15分钟

请返回JSON格式的任务数组，每个任务包含：
- title: 任务标题（简洁明确）
- duration: 时长（分钟）
- category: 类型（work/life/health等）
- priority: 优先级（high/medium/low）
- location: 位置（bathroom/workspace/kitchen/livingroom/bedroom/studio）

**重要**：一定要把每个独立的动作分解成单独的任务！`;

      // 调用 AI 服务进行任务分解
      const currentTime = new Date();
      const decomposeResult = await aiService.decomposeTask(enhancedPrompt, currentTime);
      
      if (decomposeResult.success && decomposeResult.tasks && decomposeResult.tasks.length > 0) {
        // 为每个任务添加 ID 和位置信息
        const tasksWithMetadata: DecomposedTask[] = decomposeResult.tasks.map((task) => ({
          id: crypto.randomUUID(),
          title: task.title,
          duration: task.duration || detectTaskDuration(task.title),
          category: task.category,
          priority: task.priority,
          location: task.location || detectTaskLocation(task.title),
          startTime: task.startTime,
          goldReward: Math.floor((task.duration || 30) * 1.5), // 根据时长计算金币
        }));

        setConfirmationTasks(tasksWithMetadata);
        setIsAnalyzing(false);
        setShowConfirmation(true);
      } else {
        throw new Error('AI 分析失败');
      }
    } catch (error) {
      console.error('智能分配失败:', error);
      alert('❌ AI 分析失败，请稍后再试。');
      setIsAnalyzing(false);
    }
  };

  // 确认并推送到时间轴
  const handleConfirmSchedule = async () => {
    try {
      // 匹配长期目标
      for (const task of confirmationTasks) {
        const goalMatches: Record<string, number> = {};
        
        if (goals.length > 0) {
          const matches = matchTaskToGoals(
            { title: task.title, description: '' },
            goals
          );
          matches.forEach(match => {
            goalMatches[match.goalId] = match.confidence;
          });
        }

        // 解析开始时间
        const scheduledStart = task.startTime ? (() => {
          const [hours, minutes] = task.startTime.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return date;
        })() : new Date();

        const scheduledEnd = new Date(scheduledStart);
        scheduledEnd.setMinutes(scheduledEnd.getMinutes() + task.duration);

        await createTask({
          title: task.title,
          description: '',
          durationMinutes: task.duration,
          goldReward: task.goldReward,
          scheduledStart,
          scheduledEnd,
          taskType: task.category as any,
          priority: task.priority === 'high' ? 1 : task.priority === 'medium' ? 2 : 3,
          tags: task.location ? [task.location] : [],
          status: 'pending',
          longTermGoals: goalMatches,
        });
      }

      // 清空待安排列表和收集箱中已安排的任务
      const scheduledIds = scheduledTasks.map(t => t.id);
      setInboxTasks(inboxTasks.filter(t => !scheduledIds.includes(t.id)));
      setScheduledTasks([]);
      setShowConfirmation(false);
      setConfirmationTasks([]);
      
      alert('✅ 任务已推送到时间轴！');
    } catch (error) {
      console.error('推送任务失败:', error);
      alert('❌ 推送任务失败，请稍后再试。');
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-3 p-3 pb-32 md:pb-3" style={{ backgroundColor: bgColor }}>
      {/* 左侧：收集箱 */}
      <div className="flex-1 flex flex-col min-w-0">
        <h2 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: textColor }}>
          📥 收集箱
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cardBg, color: secondaryColor }}>
            {inboxTasks.length}
          </span>
        </h2>

        {/* 任务列表 */}
        <div className="flex-1 overflow-auto space-y-2 mb-2">
          {inboxTasks.map((task) => (
            <div
              key={task.id}
              className="p-2 rounded-lg"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: textColor }}>
                    {task.title}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {!task.isScheduled ? (
                    <button
                      onClick={() => handleAddToScheduled(task.id)}
                      className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all"
                      style={{
                        backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
                        color: '#34C759',
                      }}
                    >
                      添加到待安排
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemoveFromScheduled(task.id)}
                      className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: '#34C759',
                        color: '#ffffff',
                      }}
                    >
                      ✓ 已添加
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 rounded transition-all"
                    style={{ color: '#FF3B30' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {inboxTasks.length === 0 && (
            <div className="text-center py-8" style={{ color: secondaryColor }}>
              <div className="text-3xl mb-2">📥</div>
              <p className="text-sm">收集箱是空的</p>
              <p className="text-xs mt-1">在下方添加任务</p>
            </div>
          )}
        </div>

        {/* 添加任务输入框 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddToInbox()}
            placeholder="输入任务，如：学习英语1小时"
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
          />
          <button
            onClick={handleAddToInbox}
            className="px-3 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: '#007AFF',
              color: '#ffffff',
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* 右侧：待安排任务 */}
      <div className="w-full md:w-64 flex flex-col">
        <h2 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: textColor }}>
          📋 待安排
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cardBg, color: secondaryColor }}>
            {scheduledTasks.length}
          </span>
        </h2>

        {/* 待安排列表 */}
        <div className="flex-1 overflow-auto space-y-2 mb-2">
          {scheduledTasks.map((task) => (
            <div
              key={task.id}
              className="p-2 rounded-lg"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
              }}
            >
              <div className="font-medium text-sm truncate" style={{ color: textColor }}>
                {task.title}
              </div>
            </div>
          ))}

          {scheduledTasks.length === 0 && (
            <div className="text-center py-8" style={{ color: secondaryColor }}>
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">暂无待安排</p>
              <p className="text-xs mt-1">从左侧添加</p>
            </div>
          )}
        </div>

        {/* 智能分配按钮 */}
        <button
          onClick={handleSmartSchedule}
          disabled={scheduledTasks.length === 0 || isAnalyzing}
          className="w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: scheduledTasks.length > 0 ? '#007AFF' : cardBg,
            color: scheduledTasks.length > 0 ? '#ffffff' : secondaryColor,
            opacity: isAnalyzing ? 0.6 : 1,
          }}
        >
          {isAnalyzing ? (
            <>
              <Sparkles size={16} className="animate-spin" />
              <span>AI 分析中...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>智能分配到时间轴</span>
            </>
          )}
        </button>
      </div>

      {/* 确认弹窗 */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            style={{ backgroundColor: bgColor }}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: borderColor }}>
              <h3 className="text-lg font-bold" style={{ color: textColor }}>
                ✨ AI 智能分配结果
              </h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="p-1 rounded-lg transition-all"
                style={{ color: secondaryColor }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {confirmationTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getPriorityEmoji(task.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-2" style={{ color: textColor }}>
                        {index + 1}. {task.title}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3" style={{ color: secondaryColor }}>
                        <div className="flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{task.duration} 分钟</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🕐</span>
                          <span>{task.startTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{LOCATION_ICONS[task.location || ''] || '📍'}</span>
                          <span>{task.location ? LOCATION_NAMES[task.location] : '未指定'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>💰</span>
                          <span>{task.goldReward} 金币</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => {
                            const updated = [...confirmationTasks];
                            updated[index].title = e.target.value;
                            setConfirmationTasks(updated);
                          }}
                          className="flex-1 px-2 py-1 rounded text-sm"
                          style={{
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: textColor,
                          }}
                        />
                        <input
                          type="time"
                          value={task.startTime}
                          onChange={(e) => {
                            const updated = [...confirmationTasks];
                            updated[index].startTime = e.target.value;
                            setConfirmationTasks(updated);
                          }}
                          className="px-2 py-1 rounded text-sm"
                          style={{
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: textColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 p-6 border-t" style={{ borderColor: borderColor }}>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor: cardBg,
                  color: textColor,
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="flex-1 py-3 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor: '#007AFF',
                  color: '#ffffff',
                }}
              >
                推送到时间轴
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


