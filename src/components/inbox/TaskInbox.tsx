import { useState, useEffect } from 'react';
import { Inbox, Sparkles, Trash2, Calendar, Clock } from 'lucide-react';
import { InboxManager, type TaskInInbox } from '@/services/aiSmartService';
import { useTaskStore } from '@/stores/taskStore';

interface TaskInboxProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function TaskInbox({ isDark = false, bgColor = '#ffffff' }: TaskInboxProps) {
  const [inboxTasks, setInboxTasks] = useState<TaskInInbox[]>([]);
  const { createTask } = useTaskStore();
  
  const textColor = isDark ? '#ffffff' : '#000000';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';

  // 加载收集箱任务
  useEffect(() => {
    loadInboxTasks();
  }, []);

  const loadInboxTasks = () => {
    const tasks = InboxManager.getInboxTasks();
    setInboxTasks(tasks);
  };

  // 删除任务
  const handleDelete = (taskId: string) => {
    InboxManager.removeFromInbox(taskId);
    loadInboxTasks();
  };

  // 手动安排任务
  const handleSchedule = async (task: TaskInInbox) => {
    const now = new Date();
    const scheduledStart = new Date(now.getTime() + 30 * 60000); // 30分钟后

    await createTask({
      title: task.title,
      description: task.description,
      durationMinutes: task.estimatedDuration,
      taskType: task.taskType,
      scheduledStart: scheduledStart.toISOString(),
      priority: task.priority,
      tags: task.tags,
      status: 'pending',
    });

    // 从收集箱移除
    InboxManager.removeFromInbox(task.id);
    loadInboxTasks();
  };

  // 智能分配所有任务
  const handleSmartSchedule = async () => {
    const existingTasks = useTaskStore.getState().tasks || [];
    const scheduledTasks = InboxManager.smartScheduleInboxTasks(existingTasks);

    // 批量创建任务
    for (const task of scheduledTasks) {
      await createTask({
        title: task.title,
        description: task.description,
        durationMinutes: task.estimatedDuration,
        taskType: task.taskType,
        scheduledStart: task.scheduledStart,
        priority: task.priority,
        tags: task.tags,
        status: 'pending',
      });

      // 从收集箱移除
      InboxManager.removeFromInbox(task.id);
    }

    loadInboxTasks();
  };

  return (
    <div className="h-full flex flex-col p-6" style={{ color: textColor }}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Inbox className="w-5 h-5" />
          <h3 className="text-lg font-semibold">收集箱</h3>
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: cardBg }}
          >
            {inboxTasks.length}
          </span>
        </div>

        {inboxTasks.length > 0 && (
          <button
            onClick={handleSmartSchedule}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
            style={{ backgroundColor: cardBg }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>智能分配</span>
          </button>
        )}
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {inboxTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: accentColor }}>
            <Inbox className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-sm">收集箱为空</p>
            <p className="text-xs mt-1">时间冲突的任务会自动放入这里</p>
          </div>
        ) : (
          inboxTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg transition-all hover:scale-[1.02]"
              style={{ backgroundColor: cardBg }}
            >
              {/* 第一行：标题和时长 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{task.title}</h4>
                  <div className="flex items-center space-x-3 mt-1 text-xs" style={{ color: accentColor }}>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{task.estimatedDuration}分钟</span>
                    </span>
                    <span>🏷️ {task.category}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        task.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 第二行：操作按钮 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSchedule(task)}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    color: textColor 
                  }}
                >
                  <Calendar className="w-3 h-3" />
                  <span>安排</span>
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="px-2 py-1.5 rounded text-xs transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,100,100,0.2)' : 'rgba(239,68,68,0.1)',
                    color: '#EF4444'
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部提示 */}
      {inboxTasks.length > 0 && (
        <div 
          className="mt-4 p-3 rounded-lg text-xs"
          style={{ backgroundColor: cardBg, color: accentColor }}
        >
          💡 提示：点击"智能分配"可自动将所有任务安排到合适的时间段
        </div>
      )}
    </div>
  );
}

