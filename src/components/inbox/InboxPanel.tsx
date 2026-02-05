import { useState, useEffect } from 'react';
import { Plus, Sparkles, Calendar, Clock, Coins, ChevronRight } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';

interface InboxPanelProps {
  isDark?: boolean;
  bgColor?: string;
}

interface InboxTask extends Partial<Task> {
  id: string;
  title: string;
  isScheduled?: boolean; // 是否已添加到待安排
}

// localStorage 存储键
const INBOX_STORAGE_KEY = 'task_inbox_panel';
const SCHEDULED_STORAGE_KEY = 'task_scheduled_panel';

export default function InboxPanel({ isDark = false, bgColor = '#ffffff' }: InboxPanelProps) {
  const { createTask } = useTaskStore();
  
  // 从 localStorage 加载数据
  const [inboxTasks, setInboxTasks] = useState<InboxTask[]>(() => {
    try {
      const saved = localStorage.getItem(INBOX_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [scheduledTasks, setScheduledTasks] = useState<InboxTask[]>(() => {
    try {
      const saved = localStorage.getItem(SCHEDULED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 保存收集箱数据到 localStorage
  useEffect(() => {
    localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(inboxTasks));
  }, [inboxTasks]);

  // 保存待安排数据到 localStorage
  useEffect(() => {
    localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  // iOS 风格颜色
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  // 智能分析任务（识别持续时间和金币）
  const analyzeTask = (title: string): { duration: number; goldReward: number } => {
    let duration = 30; // 默认30分钟
    let goldReward = 50; // 默认50金币

    // 识别时间关键词
    if (title.includes('小时') || title.includes('hour')) {
      const match = title.match(/(\d+)\s*(小时|hour)/);
      if (match) duration = parseInt(match[1]) * 60;
    } else if (title.includes('分钟') || title.includes('min')) {
      const match = title.match(/(\d+)\s*(分钟|min)/);
      if (match) duration = parseInt(match[1]);
    }

    // 根据关键词判断任务类型和金币
    if (title.includes('学习') || title.includes('阅读') || title.includes('练习')) {
      goldReward = 80;
    } else if (title.includes('工作') || title.includes('报告') || title.includes('会议')) {
      goldReward = 100;
    } else if (title.includes('运动') || title.includes('健身')) {
      goldReward = 60;
    }

    // 根据时长调整金币
    goldReward = Math.floor(goldReward * (duration / 30));

    return { duration, goldReward };
  };

  // 添加任务到收集箱
  const handleAddToInbox = () => {
    if (!newTaskTitle.trim()) return;

    const { duration, goldReward } = analyzeTask(newTaskTitle);
    
    const newTask: InboxTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      durationMinutes: duration,
      goldReward: goldReward,
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

  // 智能分配任务到时间轴
  const handleSmartSchedule = async () => {
    if (scheduledTasks.length === 0) {
      alert('请先添加任务到待安排列表');
      return;
    }

    setIsAnalyzing(true);
    
    // 模拟 AI 分析（实际应该调用 AI API）
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowConfirmation(true);
    }, 1500);
  };

  // 确认并推送到时间轴
  const handleConfirmSchedule = async () => {
    for (const task of scheduledTasks) {
      // 这里应该根据 AI 分析结果设置时间
      const scheduledStart = new Date();
      scheduledStart.setHours(scheduledStart.getHours() + 1);
      
      await createTask({
        title: task.title,
        durationMinutes: task.durationMinutes,
        goldReward: task.goldReward,
        scheduledStart: scheduledStart,
        status: 'pending',
      });
    }

    // 清空待安排列表
    setScheduledTasks([]);
    setInboxTasks(inboxTasks.filter(t => !t.isScheduled));
    setShowConfirmation(false);
    alert('✅ 任务已推送到时间轴！');
  };

  return (
    <div className="h-full flex gap-3 p-3" style={{ backgroundColor: bgColor }}>
      {/* 左侧：收集箱 */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-lg font-semibold mb-3" style={{ color: textColor }}>
          📥 收集箱
        </h2>

        {/* 任务列表 */}
        <div className="flex-1 overflow-auto space-y-2 mb-3">
          {inboxTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg"
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
                  <div className="flex items-center gap-3 text-xs" style={{ color: secondaryColor }}>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {task.durationMinutes}分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins size={12} />
                      {task.goldReward}金币
                    </span>
                  </div>
                </div>
                
                {!task.isScheduled ? (
                  <button
                    onClick={() => handleAddToScheduled(task.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: '#34C759',
                      color: '#ffffff',
                    }}
                  >
                    ✓ 已添加
                  </button>
                )}
              </div>
            </div>
          ))}

          {inboxTasks.length === 0 && (
            <div className="text-center py-12" style={{ color: secondaryColor }}>
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
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: '#007AFF',
              color: '#ffffff',
            }}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 右侧：待安排任务 */}
      <div className="w-80 flex flex-col">
        <h2 className="text-lg font-semibold mb-3" style={{ color: textColor }}>
          📋 待安排任务
        </h2>

        {/* 待安排列表 */}
        <div className="flex-1 overflow-auto space-y-2 mb-3">
          {scheduledTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
              }}
            >
              <div className="font-medium text-sm mb-1" style={{ color: textColor }}>
                {task.title}
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: secondaryColor }}>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {task.durationMinutes}分钟
                </span>
                <span className="flex items-center gap-1">
                  <Coins size={12} />
                  {task.goldReward}金币
                </span>
              </div>
            </div>
          ))}

          {scheduledTasks.length === 0 && (
            <div className="text-center py-12" style={{ color: secondaryColor }}>
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">暂无待安排任务</p>
              <p className="text-xs mt-1">从左侧添加</p>
            </div>
          )}
        </div>

        {/* 智能分配按钮 */}
        <button
          onClick={handleSmartSchedule}
          disabled={scheduledTasks.length === 0 || isAnalyzing}
          className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: scheduledTasks.length > 0 ? '#007AFF' : cardBg,
            color: scheduledTasks.length > 0 ? '#ffffff' : secondaryColor,
            opacity: isAnalyzing ? 0.6 : 1,
          }}
        >
          {isAnalyzing ? (
            <>
              <Sparkles size={18} className="animate-spin" />
              <span>AI 分析中...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
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
            <h3 className="text-xl font-bold mb-4" style={{ color: textColor }}>
              ✨ AI 智能分配结果
            </h3>

            <div className="space-y-3 mb-6 max-h-96 overflow-auto">
              {scheduledTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Calendar size={20} style={{ color: '#007AFF' }} />
                    <div className="flex-1">
                      <div className="font-semibold mb-1" style={{ color: textColor }}>
                        {task.title}
                      </div>
                      <div className="text-sm mb-2" style={{ color: secondaryColor }}>
                        建议时间：今天 {14 + index}:00 - {14 + index}:{task.durationMinutes}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={task.title}
                          className="flex-1 px-2 py-1 rounded text-sm"
                          style={{
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${borderColor}`,
                            color: textColor,
                          }}
                        />
                        <input
                          type="time"
                          defaultValue={`${14 + index}:00`}
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

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 rounded-lg font-semibold"
                style={{
                  backgroundColor: cardBg,
                  color: textColor,
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="flex-1 py-3 rounded-lg font-semibold"
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

