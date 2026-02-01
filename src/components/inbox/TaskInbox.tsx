import { useState, useEffect } from 'react';
import { Plus, Sparkles, Trash2, Calendar, Clock, Coins, X } from 'lucide-react';
import { InboxManager, type TaskInInbox } from '@/services/aiSmartService';
import { useTaskStore } from '@/stores/taskStore';

interface TaskInboxProps {
  isDark?: boolean;
  bgColor?: string;
}

interface ExtendedInboxTask extends TaskInInbox {
  goldReward?: number;
  isScheduled?: boolean;
}

export default function TaskInbox({ isDark = false, bgColor = '#ffffff' }: TaskInboxProps) {
  const [inboxTasks, setInboxTasks] = useState<ExtendedInboxTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [scheduledTasks, setScheduledTasks] = useState<ExtendedInboxTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTasks, setConfirmationTasks] = useState<any[]>([]);
  const { createTask, tasks: existingTasks } = useTaskStore();
  
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
      goldReward: task.goldReward || calculateGoldReward(task.estimatedDuration, task.category),
      isScheduled: false,
    }));
    setInboxTasks(extendedTasks);
  };

  // 计算金币奖励
  const calculateGoldReward = (duration: number, category: string): number => {
    let baseReward = 50;
    
    // 根据类别调整
    if (category === '学习' || category === '工作') baseReward = 80;
    else if (category === '运动' || category === '健康') baseReward = 60;
    else if (category === '社交' || category === '娱乐') baseReward = 40;
    
    // 根据时长调整
    return Math.floor(baseReward * (duration / 30));
  };

  // 智能分析任务（识别持续时间和金币）
  const analyzeTask = (title: string): { duration: number; goldReward: number; category: string } => {
    let duration = 30; // 默认30分钟
    let category = '其他';

    // 识别时间关键词
    if (title.includes('小时') || title.includes('hour')) {
      const match = title.match(/(\d+)\s*(小时|hour)/);
      if (match) duration = parseInt(match[1]) * 60;
    } else if (title.includes('分钟') || title.includes('min')) {
      const match = title.match(/(\d+)\s*(分钟|min)/);
      if (match) duration = parseInt(match[1]);
    }

    // 识别类别
    if (title.includes('学习') || title.includes('阅读') || title.includes('练习') || title.includes('复习')) {
      category = '学习';
    } else if (title.includes('工作') || title.includes('报告') || title.includes('会议') || title.includes('项目')) {
      category = '工作';
    } else if (title.includes('运动') || title.includes('健身') || title.includes('跑步')) {
      category = '运动';
    } else if (title.includes('吃饭') || title.includes('睡觉') || title.includes('休息')) {
      category = '生活';
    }

    const goldReward = calculateGoldReward(duration, category);

    return { duration, goldReward, category };
  };

  // 添加任务到收集箱
  const handleAddToInbox = () => {
    if (!newTaskTitle.trim()) return;

    const { duration, goldReward, category } = analyzeTask(newTaskTitle);
    
    const newTask: ExtendedInboxTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      description: '',
      estimatedDuration: duration,
      goldReward: goldReward,
      category: category,
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

  // 智能分配任务到时间轴
  const handleSmartSchedule = async () => {
    if (scheduledTasks.length === 0) {
      alert('请先添加任务到待安排列表');
      return;
    }

    setIsAnalyzing(true);
    
    // 模拟 AI 分析（实际应该调用 AI API）
    setTimeout(() => {
      // 生成智能分配建议
      const now = new Date();
      const suggestions = scheduledTasks.map((task, index) => {
        const suggestedStart = new Date(now);
        suggestedStart.setHours(now.getHours() + index + 1);
        suggestedStart.setMinutes(0);
        
        return {
          ...task,
          suggestedStart,
          suggestedDate: suggestedStart.toLocaleDateString('zh-CN'),
          suggestedTime: suggestedStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
      });
      
      setConfirmationTasks(suggestions);
      setIsAnalyzing(false);
      setShowConfirmation(true);
    }, 1500);
  };

  // 确认并推送到时间轴
  const handleConfirmSchedule = async () => {
    for (const task of confirmationTasks) {
      await createTask({
        title: task.title,
        description: task.description,
        durationMinutes: task.estimatedDuration,
        goldReward: task.goldReward,
        scheduledStart: task.suggestedStart,
        taskType: task.taskType,
        priority: task.priority,
        tags: task.tags,
        status: 'pending',
      });
    }

    // 清空待安排列表和收集箱中已安排的任务
    const scheduledIds = scheduledTasks.map(t => t.id);
    setInboxTasks(inboxTasks.filter(t => !scheduledIds.includes(t.id)));
    setScheduledTasks([]);
    setShowConfirmation(false);
    setConfirmationTasks([]);
    
    alert('✅ 任务已推送到时间轴！');
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-3 p-3 pb-24 md:pb-3" style={{ backgroundColor: bgColor }}>
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
                  <div className="font-medium text-sm mb-1 truncate" style={{ color: textColor }}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: secondaryColor }}>
                    <span className="flex items-center gap-1">
                      ⏱️ {task.estimatedDuration}分钟
                    </span>
                    <span className="flex items-center gap-1">
                      💰 {task.goldReward}金币
                    </span>
                    <span>🏷️ {task.category}</span>
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
              <div className="font-medium text-sm mb-1 truncate" style={{ color: textColor }}>
                {task.title}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: secondaryColor }}>
                <span>⏱️ {task.estimatedDuration}分</span>
                <span>💰 {task.goldReward}</span>
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
            className="rounded-2xl shadow-2xl max-w-2xl w-full p-6"
            style={{ backgroundColor: bgColor }}
          >
            <div className="flex items-center justify-between mb-4">
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

            <div className="space-y-2 mb-4 max-h-96 overflow-auto">
              {confirmationTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Calendar size={18} style={{ color: '#007AFF' }} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1" style={{ color: textColor }}>
                        {task.title}
                      </div>
                      <div className="text-xs mb-2" style={{ color: secondaryColor }}>
                        建议时间：{task.suggestedDate} {task.suggestedTime}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={task.title}
                          onChange={(e) => {
                            const updated = [...confirmationTasks];
                            updated[index].title = e.target.value;
                            setConfirmationTasks(updated);
                          }}
                          className="flex-1 px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: textColor,
                          }}
                        />
                        <input
                          type="time"
                          defaultValue={task.suggestedTime}
                          onChange={(e) => {
                            const updated = [...confirmationTasks];
                            const [hours, minutes] = e.target.value.split(':');
                            const newStart = new Date(task.suggestedStart);
                            newStart.setHours(parseInt(hours), parseInt(minutes));
                            updated[index].suggestedStart = newStart;
                            setConfirmationTasks(updated);
                          }}
                          className="px-2 py-1 rounded text-xs"
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

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor: cardBg,
                  color: textColor,
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="flex-1 py-2 rounded-lg font-semibold text-sm"
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


