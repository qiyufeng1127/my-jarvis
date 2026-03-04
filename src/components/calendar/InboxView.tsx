import { useState } from 'react';
import { Play, Trash2, Edit2, Clock, Tag, Plus, X, Save } from 'lucide-react';
import type { Task, TaskType, TaskPriority } from '@/types';

interface InboxViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
  isDark?: boolean;
}

export default function InboxView({
  tasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onStartTask,
  bgColor = '#ffffff',
  textColor = '#000000',
  accentColor = '#666666',
  borderColor = 'rgba(0, 0, 0, 0.1)',
  isDark = false,
}: InboxViewProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // 新任务表单状态
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    taskType: 'work' as TaskType,
    priority: 3 as TaskPriority,
    durationMinutes: 30,
    tags: [] as string[],
  });

  // 任务类别颜色
  const categoryColors: Record<string, string> = {
    work: '#C85A7C',
    study: '#C85A7C',
    health: '#6BA56D',
    life: '#8B1538',
    social: '#C85A7C',
    finance: '#8B1538',
    creative: '#C85A7C',
    rest: '#6BA56D',
    emergency: '#FF4444',
    other: '#C85A7C',
  };

  // 筛选出没有安排时间的任务
  const inboxTasks = tasks.filter(task => !task.scheduledStart);

  const handleStartTask = (taskId: string) => {
    // 设置任务开始时间为当前时间
    const now = new Date();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const endTime = new Date(now.getTime() + task.durationMinutes * 60000);
    
    onTaskUpdate(taskId, {
      scheduledStart: now,
      scheduledEnd: endTime,
      status: 'scheduled',
    });
    
    onStartTask(taskId);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      alert('请输入任务标题');
      return;
    }

    onTaskCreate({
      title: newTask.title,
      description: newTask.description,
      taskType: newTask.taskType,
      priority: newTask.priority,
      durationMinutes: newTask.durationMinutes,
      tags: newTask.tags,
      status: 'pending',
      goldEarned: 0,
      penaltyGold: 0,
      growthDimensions: {},
      longTermGoals: {},
      identityTags: [],
      enableProgressCheck: false,
      progressChecks: [],
    });

    // 重置表单
    setNewTask({
      title: '',
      description: '',
      taskType: 'work',
      priority: 3,
      durationMinutes: 30,
      tags: [],
    });
    setIsCreating(false);
  };

  const taskTypeOptions = [
    { value: 'work', label: '工作', emoji: '💼' },
    { value: 'study', label: '学习', emoji: '📚' },
    { value: 'health', label: '健康', emoji: '💪' },
    { value: 'life', label: '生活', emoji: '🏠' },
    { value: 'social', label: '社交', emoji: '👥' },
    { value: 'finance', label: '财务', emoji: '💰' },
    { value: 'creative', label: '创意', emoji: '🎨' },
    { value: 'rest', label: '休息', emoji: '😴' },
    { value: 'emergency', label: '紧急', emoji: '🚨' },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      {/* 标题和添加按钮 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: textColor }}>
            收集箱
          </h2>
          <p className="text-sm mt-1" style={{ color: accentColor }}>
            {inboxTasks.length} 个待安排任务
          </p>
        </div>
        
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md active:scale-95"
            style={{
              backgroundColor: '#6BA56D',
              color: '#FFFFFF',
            }}
          >
            <Plus className="w-5 h-5" />
            <span>添加任务</span>
          </button>
        )}
      </div>

      {/* 创建任务表单 */}
      {isCreating && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border: `2px solid ${borderColor}`,
          }}
        >
          <div className="space-y-3">
            {/* 任务标题 */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                任务标题 *
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="输入任务标题..."
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  borderColor: borderColor,
                  color: textColor,
                }}
              />
            </div>

            {/* 任务描述 */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                任务描述
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="输入任务描述..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  borderColor: borderColor,
                  color: textColor,
                }}
              />
            </div>

            {/* 任务类型 */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                任务类型
              </label>
              <div className="grid grid-cols-3 gap-2">
                {taskTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setNewTask({ ...newTask, taskType: option.value as TaskType })}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: newTask.taskType === option.value
                        ? `${categoryColors[option.value]}20`
                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: newTask.taskType === option.value
                        ? categoryColors[option.value]
                        : 'transparent',
                      color: newTask.taskType === option.value
                        ? categoryColors[option.value]
                        : textColor,
                    }}
                  >
                    <span>{option.emoji}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 优先级和时长 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                  优先级
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) as TaskPriority })}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    borderColor: borderColor,
                    color: textColor,
                  }}
                >
                  <option value={1}>P1 - 最高</option>
                  <option value={2}>P2 - 高</option>
                  <option value={3}>P3 - 中</option>
                  <option value={4}>P4 - 低</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                  预计时长（分钟）
                </label>
                <input
                  type="number"
                  value={newTask.durationMinutes}
                  onChange={(e) => setNewTask({ ...newTask, durationMinutes: parseInt(e.target.value) || 30 })}
                  min={5}
                  step={5}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleCreateTask}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md active:scale-95"
                style={{
                  backgroundColor: '#6BA56D',
                  color: '#FFFFFF',
                }}
              >
                <Save className="w-4 h-4" />
                <span>保存</span>
              </button>

              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewTask({
                    title: '',
                    description: '',
                    taskType: 'work',
                    priority: 3,
                    durationMinutes: 30,
                    tags: [],
                  });
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md active:scale-95"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: textColor,
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 任务列表 */}
      {inboxTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📥</div>
          <p className="text-lg font-medium" style={{ color: accentColor }}>
            收集箱是空的
          </p>
          <p className="text-sm mt-2" style={{ color: accentColor }}>
            所有任务都已安排时间
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inboxTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl p-4 transition-all hover:shadow-md"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderLeft: `4px solid ${categoryColors[task.taskType] || categoryColors.other}`,
              }}
            >
              {/* 任务标题和类型 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" style={{ color: textColor }}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm mt-1" style={{ color: accentColor }}>
                      {task.description}
                    </p>
                  )}
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-xs font-medium ml-2"
                  style={{
                    backgroundColor: `${categoryColors[task.taskType] || categoryColors.other}20`,
                    color: categoryColors[task.taskType] || categoryColors.other,
                  }}
                >
                  {task.taskType}
                </div>
              </div>

              {/* 任务信息 */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1" style={{ color: accentColor }}>
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatDuration(task.durationMinutes)}</span>
                </div>
                
                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center gap-1" style={{ color: accentColor }}>
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">{task.tags.join(', ')}</span>
                  </div>
                )}
                
                <div
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: task.priority === 1 ? '#FF444420' : 
                                   task.priority === 2 ? '#FFA50020' : 
                                   task.priority === 3 ? '#FFD70020' : '#90EE9020',
                    color: task.priority === 1 ? '#FF4444' : 
                           task.priority === 2 ? '#FFA500' : 
                           task.priority === 3 ? '#FFD700' : '#90EE90',
                  }}
                >
                  P{task.priority}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartTask(task.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md active:scale-95"
                  style={{
                    backgroundColor: categoryColors[task.taskType] || categoryColors.other,
                    color: '#FFFFFF',
                  }}
                >
                  <Play className="w-4 h-4" />
                  <span>开始</span>
                </button>

                <button
                  onClick={() => setEditingTaskId(task.id)}
                  className="p-2 rounded-lg transition-all hover:shadow-md active:scale-95"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Edit2 className="w-4 h-4" style={{ color: textColor }} />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('确定要删除这个任务吗？')) {
                      onTaskDelete(task.id);
                    }
                  }}
                  className="p-2 rounded-lg transition-all hover:shadow-md active:scale-95"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: '#FF4444' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

