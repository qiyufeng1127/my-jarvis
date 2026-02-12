import { useState } from 'react';
import { X, ChevronUp, ChevronDown, Clock, Coins, Plus } from 'lucide-react';
import { useGoalStore } from '@/stores/goalStore';
import { AISmartProcessor } from '@/services/aiSmartService';

interface UnifiedTaskEditorProps {
  tasks: any[];
  onClose: () => void;
  onConfirm: (tasks: any[]) => void;
  isDark?: boolean;
}

/**
 * 统一任务编辑器
 * 用于万能收集箱和AI智能助手，提供一致的任务编辑体验
 */
export default function UnifiedTaskEditor({ 
  tasks, 
  onClose, 
  onConfirm,
  isDark = false 
}: UnifiedTaskEditorProps) {
  const [editingTasks, setEditingTasks] = useState<any[]>(tasks);
  const [editingField, setEditingField] = useState<{taskIndex: number, field: string} | null>(null);
  const { goals, addGoal } = useGoalStore();

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
      newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
      
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

  // 删除任务
  const deleteTask = (index: number) => {
    const newTasks = editingTasks.filter((_, i) => i !== index);
    // 重新计算序号和时间
    const recalculated = recalculateTaskTimes(newTasks, 0);
    setEditingTasks(recalculated);
  };

  // 添加新任务
  const addNewTask = () => {
    const lastTask = editingTasks[editingTasks.length - 1];
    const lastEnd = new Date(lastTask.scheduled_start_iso);
    lastEnd.setMinutes(lastEnd.getMinutes() + lastTask.estimated_duration);
    
    const newTask = {
      sequence: editingTasks.length + 1,
      title: '新任务',
      description: '新任务',
      estimated_duration: 30,
      scheduled_start: lastEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      scheduled_end: new Date(lastEnd.getTime() + 30 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      scheduled_start_iso: lastEnd.toISOString(),
      task_type: 'life',
      category: '生活事务',
      location: '全屋',
      tags: ['日常'],
      goal: null,
      gold: 45,
      color: '#6A7334',
      priority: 'medium',
    };
    
    setEditingTasks([...editingTasks, newTask]);
  };

  const handleConfirm = async () => {
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

    onConfirm(editingTasks);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 md:p-3" style={{ zIndex: 10000 }}>
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl w-full h-full md:max-w-3xl md:h-[96%] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* 头部 - 紧凑设计 */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✏️</span>
            <div>
              <h3 className="text-base font-bold text-white">任务编辑器</h3>
              <p className="text-xs text-purple-100">💡 双击编辑 · 🔼🔽 调整顺序</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 任务卡片列表 - 紧凑布局 */}
        <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-1.5">
          {editingTasks.map((task, index) => (
            <div
              key={index}
              className="rounded-xl p-2.5 border-2 shadow-sm hover:shadow-lg transition-all bg-white/95 backdrop-blur-sm"
              style={{
                borderColor: task.color,
                background: `linear-gradient(135deg, white 0%, ${task.color}08 100%)`,
              }}
            >
              {/* 第一行：序号 + 任务名称 + 操作按钮 - 紧凑布局 */}
              <div className="flex items-center gap-2 mb-1.5">
                {/* 序号 - 更小更精致 */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: task.color }}>
                  {index + 1}
                </div>

                {/* 任务名称 - 双击编辑 */}
                <div className="flex-1 min-w-0">
                  {editingField?.taskIndex === index && editingField?.field === 'title' ? (
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTaskField(index, 'title', e.target.value)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingField(null);
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      autoFocus
                      className="w-full px-2 py-1 text-sm font-bold rounded-lg focus:outline-none focus:ring-2 bg-white text-gray-900 border-2"
                      style={{
                        borderColor: task.color,
                      }}
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingField({ taskIndex: index, field: 'title' });
                      }}
                      className="text-sm font-bold cursor-pointer px-2 py-1 rounded-lg transition-colors text-gray-900 select-none"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${task.color}15`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="💡 双击编辑"
                    >
                      📝 {task.title}
                    </div>
                  )}
                </div>

                {/* 操作按钮 - 更紧凑 */}
                <div className="flex-shrink-0 flex items-center gap-0.5">
                  <button
                    onClick={() => moveTaskUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded-md disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 hover:scale-110"
                    style={{
                      backgroundColor: `${task.color}20`,
                    }}
                    title="⬆️ 上移"
                  >
                    <ChevronUp className="w-4 h-4" style={{ color: task.color }} />
                  </button>
                  <button
                    onClick={() => moveTaskDown(index)}
                    disabled={index === editingTasks.length - 1}
                    className="p-1 rounded-md disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 hover:scale-110"
                    style={{
                      backgroundColor: `${task.color}20`,
                    }}
                    title="⬇️ 下移"
                  >
                    <ChevronDown className="w-4 h-4" style={{ color: task.color }} />
                  </button>
                  <button
                    onClick={() => deleteTask(index)}
                    className="p-1 rounded-md transition-all active:scale-90 hover:scale-110 bg-red-50 hover:bg-red-100"
                    title="🗑️ 删除"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* 第二行：所有详细信息 - 紧凑布局 */}
              <div className="flex items-center gap-1 flex-wrap">
                {/* 时间 - 双击编辑 */}
                <div className="flex-shrink-0">
                  {editingField?.taskIndex === index && editingField?.field === 'start_time' ? (
                    <input
                      type="time"
                      value={task.scheduled_start}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newStart = new Date(task.scheduled_start_iso);
                        newStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        
                        const newTasks = [...editingTasks];
                        newTasks[index].scheduled_start_iso = newStart.toISOString();
                        newTasks[index].scheduled_start = e.target.value;
                        
                        const recalculated = recalculateTaskTimes(newTasks, index);
                        setEditingTasks(recalculated);
                      }}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingField(null);
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      autoFocus
                      className="px-2 py-0.5 text-xs rounded-md focus:outline-none focus:ring-2 bg-white text-gray-900 border-2"
                      style={{ borderColor: task.color }}
                    />
                  ) : (
                    <div 
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingField({ taskIndex: index, field: 'start_time' });
                      }}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 cursor-pointer transition-colors select-none"
                      style={{ backgroundColor: `${task.color}15` }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${task.color}30`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${task.color}15`}
                      title="⏰ 双击编辑时间"
                    >
                      <Clock className="w-3 h-3" style={{ color: task.color }} />
                      <span className="text-xs font-semibold text-gray-900">{task.scheduled_start}</span>
                      <span className="text-xs text-gray-400">→</span>
                      <span className="text-xs font-semibold text-gray-900">{task.scheduled_end}</span>
                    </div>
                  )}
                </div>

                {/* 时长 - 双击编辑 */}
                <div className="flex-shrink-0">
                  {editingField?.taskIndex === index && editingField?.field === 'duration' ? (
                    <input
                      type="number"
                      value={task.estimated_duration}
                      onChange={(e) => updateTaskField(index, 'estimated_duration', parseInt(e.target.value) || 0)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingField(null);
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      autoFocus
                      min="1"
                      className="w-14 px-2 py-0.5 text-xs rounded-md focus:outline-none focus:ring-2 bg-white text-gray-900 border-2"
                      style={{ borderColor: task.color }}
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingField({ taskIndex: index, field: 'duration' });
                      }}
                      className="cursor-pointer px-1.5 py-0.5 rounded-md transition-colors select-none flex items-center gap-0.5"
                      style={{ backgroundColor: `${task.color}15` }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${task.color}30`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${task.color}15`}
                      title="⏱️ 双击编辑时长"
                    >
                      <span className="text-xs font-bold text-gray-900">⏱️{task.estimated_duration}分</span>
                    </div>
                  )}
                </div>

                {/* 金币 - 双击编辑 */}
                <div className="flex-shrink-0">
                  {editingField?.taskIndex === index && editingField?.field === 'gold' ? (
                    <input
                      type="number"
                      value={task.gold}
                      onChange={(e) => updateTaskField(index, 'gold', parseInt(e.target.value) || 0)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingField(null);
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      autoFocus
                      className="w-14 px-2 py-0.5 text-xs border-2 border-yellow-400 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-900"
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingField({ taskIndex: index, field: 'gold' });
                      }}
                      className="flex items-center gap-0.5 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-md px-1.5 py-0.5 cursor-pointer hover:from-yellow-100 hover:to-amber-100 transition-all select-none shadow-sm"
                      title="💰 双击编辑金币"
                    >
                      <span className="text-xs">💰</span>
                      <span className="text-xs font-bold text-yellow-700">{task.gold}</span>
                    </div>
                  )}
                </div>

                {/* 位置 */}
                <div className="flex-shrink-0">
                  <span 
                    className="px-1.5 py-0.5 rounded-md text-xs font-medium inline-flex items-center gap-0.5"
                    style={{
                      backgroundColor: `${task.color}15`,
                      color: task.color,
                    }}
                  >
                    📍{task.location}
                  </span>
                </div>

                {/* 标签 */}
                {task.tags && task.tags.map((tag: string, tagIndex: number) => (
                  <span
                    key={tagIndex}
                    className="px-1.5 py-0.5 rounded-md text-xs font-medium flex items-center gap-0.5 shadow-sm"
                    style={{
                      backgroundColor: `${AISmartProcessor.getColorForTag(tag)}20`,
                      color: AISmartProcessor.getColorForTag(tag),
                    }}
                  >
                    🏷️{tag}
                    <button
                      onClick={() => {
                        const newTasks = [...editingTasks];
                        newTasks[index].tags = newTasks[index].tags.filter((_: any, i: number) => i !== tagIndex);
                        newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
                        setEditingTasks(newTasks);
                      }}
                      className="rounded-full p-0.5 hover:bg-black/10 active:bg-black/20"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                
                {/* 添加标签按钮 */}
                <button
                  onClick={() => {
                    const newTag = prompt('✨ 输入新标签：');
                    if (newTag) {
                      const newTasks = [...editingTasks];
                      newTasks[index].tags.push(newTag);
                      newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
                      setEditingTasks(newTasks);
                    }
                  }}
                  className="px-1.5 py-0.5 border border-dashed rounded-md text-xs font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  style={{
                    borderColor: task.color,
                    color: task.color,
                  }}
                  title="➕ 添加标签"
                >
                  ➕
                </button>

                {/* 目标 */}
                {task.goal ? (
                  editingField?.taskIndex === index && editingField?.field === 'goal' ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={task.goal}
                        onChange={(e) => updateTaskField(index, 'goal', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                        autoFocus
                        className="px-2 py-0.5 text-xs border-2 border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      />
                      <button
                        onClick={() => {
                          updateTaskField(index, 'goal', null);
                          setEditingField(null);
                        }}
                        className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingField({ taskIndex: index, field: 'goal' });
                      }}
                      className="flex items-center gap-0.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md px-1.5 py-0.5 cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-all select-none shadow-sm"
                      title="🎯 双击编辑目标"
                    >
                      <span className="text-xs">🎯</span>
                      <span className="text-xs font-medium text-green-700">{task.goal}</span>
                    </div>
                  )
                ) : (
                  <select
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        const newGoal = prompt('🎯 输入新的长期目标：');
                        if (newGoal) {
                          updateTaskField(index, 'goal', newGoal);
                          updateTaskField(index, 'isNewGoal', true);
                        }
                      } else if (e.target.value) {
                        updateTaskField(index, 'goal', e.target.value);
                      }
                      e.target.value = '';
                    }}
                    className="px-1.5 py-0.5 bg-gray-50 border rounded-md text-xs focus:outline-none focus:ring-2 text-gray-900"
                    style={{ borderColor: task.color }}
                  >
                    <option value="">🎯目标</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.title}>
                        {goal.title}
                      </option>
                    ))}
                    <option value="new">➕ 新目标</option>
                  </select>
                )}
              </div>

              {/* 子任务列表（如果有） */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-bold text-gray-700">📋 子任务 ({task.subtasks.length}个)</span>
                    <span className="text-xs text-gray-500">展开查看详情</span>
                  </div>
                  <div className="space-y-1.5">
                    {task.subtasks.map((subtask: any, subIndex: number) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-300 text-gray-700 text-xs font-bold flex items-center justify-center">
                          {subtask.order}
                        </span>
                        <span className="flex-1 text-xs md:text-sm text-gray-800">{subtask.title}</span>
                        <span className="flex-shrink-0 text-xs text-gray-500">{subtask.durationMinutes}分钟</span>
                        <button
                          onClick={() => {
                            const newTasks = [...editingTasks];
                            newTasks[index].subtasks = newTasks[index].subtasks.filter((_: any, i: number) => i !== subIndex);
                            setEditingTasks(newTasks);
                          }}
                          className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                          title="删除子任务"
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const title = prompt('输入子任务标题：');
                      if (title) {
                        const duration = parseInt(prompt('输入子任务时长（分钟）：') || '10');
                        const newTasks = [...editingTasks];
                        if (!newTasks[index].subtasks) {
                          newTasks[index].subtasks = [];
                        }
                        newTasks[index].subtasks.push({
                          id: crypto.randomUUID(),
                          title,
                          isCompleted: false,
                          durationMinutes: duration,
                          order: newTasks[index].subtasks.length + 1,
                        });
                        setEditingTasks(newTasks);
                      }
                    }}
                    className="mt-2 w-full py-1.5 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 text-gray-600"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="text-xs font-medium">添加子任务</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* 添加新任务按钮 */}
          <button
            onClick={addNewTask}
            className="w-full py-2.5 md:py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-600"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-medium">添加新任务</span>
          </button>
        </div>

        {/* 底部按钮 */}
        <div className="flex-shrink-0 border-t border-gray-200 px-3 md:px-6 py-3 md:py-4 flex space-x-2 md:space-x-3">
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm md:text-base font-medium transition-colors"
          >
            ❌ 取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white text-sm md:text-base font-bold transition-all transform active:scale-95 md:hover:scale-105 shadow-lg"
          >
            🚀 推送到时间轴 ({editingTasks.length})
          </button>
        </div>
      </div>
    </div>
  );
}

