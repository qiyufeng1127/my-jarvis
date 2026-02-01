import { useState, useEffect } from 'react';
import { Plus, Sparkles, Trash2, Calendar, Clock, Coins, X, Brain, BookHeart, Lightbulb, ChevronUp, ChevronDown, Edit2 } from 'lucide-react';
import { AISmartProcessor, type TaskInInbox } from '@/services/aiSmartService';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useAIStore } from '@/stores/aiStore';
import { aiService } from '@/services/aiService';
import { matchTaskToGoals } from '@/services/aiGoalMatcher';
import { useMemoryStore } from '@/stores/memoryStore';
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

// 万能收集箱项目
interface InboxItem {
  id: string;
  content: string;
  contentType?: 'task' | 'mood' | 'thought' | 'gratitude' | 'success' | 'startup' | 'unknown';
  targetComponent?: 'timeline' | 'memory' | 'journal' | 'sidehustle' | 'none';
  emotionTags?: string[];
  categoryTags?: string[];
  confidence?: number;
  isAnalyzed?: boolean;
  createdAt: Date;
}

export default function TaskInbox({ isDark = false, bgColor = '#ffffff' }: TaskInboxProps) {
  // 万能收集箱项目
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [newItemContent, setNewItemContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTasks, setEditingTasks] = useState<any[]>([]);
  const [editingField, setEditingField] = useState<{taskIndex: number, field: string} | null>(null);
  
  const { createTask } = useTaskStore();
  const { goals, addGoal } = useGoalStore();
  const { isConfigured } = useAIStore();
  const { addMemory } = useMemoryStore();
  
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  // 加载收集箱项目
  useEffect(() => {
    loadInboxItems();
  }, []);

  const loadInboxItems = () => {
    const saved = localStorage.getItem('universal_inbox_items');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        setInboxItems(items.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })));
      } catch (error) {
        console.error('加载收集箱失败:', error);
      }
    }
  };

  const saveInboxItems = (items: InboxItem[]) => {
    localStorage.setItem('universal_inbox_items', JSON.stringify(items));
  };

  // 添加项目到收集箱
  const handleAddToInbox = () => {
    if (!newItemContent.trim()) return;
    
    const newItem: InboxItem = {
      id: crypto.randomUUID(),
      content: newItemContent.trim(),
      contentType: 'unknown',
      isAnalyzed: false,
      createdAt: new Date(),
    };

    const updatedItems = [...inboxItems, newItem];
    setInboxItems(updatedItems);
    saveInboxItems(updatedItems);
    setNewItemContent('');
  };

  // 选择/取消选择项目
  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // 删除项目
  const handleDelete = (itemId: string) => {
    const updatedItems = inboxItems.filter(item => item.id !== itemId);
    setInboxItems(updatedItems);
    saveInboxItems(updatedItems);
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  // 智能分析并分配
  const handleSmartDistribute = async () => {
    if (selectedItems.length === 0) {
      alert('请先选择要分配的项目');
      return;
    }

    // 使用 AI Store 的配置检查
    const hasAI = isConfigured();
    if (!hasAI) {
      alert('AI 功能需要配置 API Key 才能使用智能分配。\n\n请在 AI 智能助手的设置中配置 API Key 后再试。');
      return;
    }

    setIsAnalyzing(true);

    try {
      const itemsToAnalyze = inboxItems.filter(item => selectedItems.includes(item.id));
      
      // 使用 AISmartProcessor 处理（与 AI 智能助手相同的逻辑）
      const results: Array<{
        item: InboxItem;
        classification: any;
      }> = [];

      for (const item of itemsToAnalyze) {
        // 调用 AISmartProcessor 进行分类
        const request = {
          user_input: item.content,
          context: {
            user_id: 'current-user',
            current_time: new Date().toLocaleTimeString('zh-CN'),
            current_date: new Date().toLocaleDateString('zh-CN'),
            timeline_summary: {},
            user_preferences: {},
            conversation_history: [],
            existing_tasks: [],
          },
        };

        const response = await AISmartProcessor.process(request);
        
        // 根据响应判断分类
        let contentType = 'unknown';
        let targetComponent = 'none';
        
        if (response.actions && response.actions.length > 0) {
          const action = response.actions[0];
          if (action.type === 'create_task') {
            contentType = 'task';
            targetComponent = 'timeline';
          } else if (action.type === 'record_memory') {
            contentType = 'thought';
            targetComponent = 'memory';
          }
        }
        
        results.push({
          item,
          classification: {
            contentType,
            targetComponent,
            emotionTags: [],
            categoryTags: [],
          },
        });
      }

      // 按目标组件分组
      const grouped: Record<string, Array<{ item: InboxItem; classification: any }>> = {
        timeline: [],
        memory: [],
        journal: [],
        sidehustle: [],
        none: [],
      };

      results.forEach(result => {
        const target = result.classification.targetComponent;
        grouped[target].push(result);
      });

      // 显示分析结果并执行分配
      let message = '✨ AI 智能分析完成！\n\n';
      let successCount = 0;

      // 处理任务（分配到时间轴）- 使用 AI 智能分析
      if (grouped.timeline.length > 0) {
        message += `📅 **时间轴任务** (${grouped.timeline.length}个):\n`;
        
        // 收集所有任务内容，用逗号分隔（让 AI 识别为任务分解）
        const taskContents = grouped.timeline.map(({ item }) => item.content).join('、');
        message += `${taskContents}\n\n`;
        message += `💡 正在使用 AI 智能分析任务...\n`;
        
        try {
          // 调用 AISmartProcessor 进行任务分解
          const request = {
            user_input: `5分钟后${taskContents}`,
            context: {
              user_id: 'current-user',
              current_time: new Date().toLocaleTimeString('zh-CN'),
              current_date: new Date().toLocaleDateString('zh-CN'),
              timeline_summary: {},
              user_preferences: {},
              conversation_history: [],
              existing_tasks: useTaskStore.getState().tasks || [],
            },
          };

          const response = await AISmartProcessor.process(request);
          
          // 检查是否有任务分解结果
          if (response.actions && response.actions.length > 0) {
            const taskAction = response.actions.find(a => a.type === 'create_task' && a.data.tasks);
            if (taskAction && taskAction.data.tasks) {
              // 打开任务编辑器
              setEditingTasks(taskAction.data.tasks);
              setShowTaskEditor(true);
              successCount = taskAction.data.tasks.length;
            }
          }
        } catch (error) {
          console.error('AI 分析失败:', error);
        }
        
        message += '\n';
      }

      // 处理记忆（分配到全景记忆栏）
      if (grouped.memory.length > 0) {
        message += `🧠 **全景记忆** (${grouped.memory.length}个):\n`;
        for (const { item, classification } of grouped.memory) {
          message += `• ${item.content}\n`;
          
          // 添加到记忆
          addMemory({
            type: classification.contentType === 'mood' ? 'mood' : 'thought',
            content: item.content,
            emotionTags: classification.emotionTags,
            categoryTags: classification.categoryTags,
            rewards: { gold: 15, growth: 3 },
          });
          successCount++;
        }
        message += '\n';
      }

      // 处理日记（分配到成功&感恩日记）
      if (grouped.journal.length > 0) {
        message += `📔 **成功&感恩日记** (${grouped.journal.length}个):\n`;
        for (const { item, classification } of grouped.journal) {
          message += `• ${item.content}\n`;
          
          // 添加到记忆（日记也保存在记忆中）
          addMemory({
            type: classification.contentType === 'success' ? 'success' : 'gratitude',
            content: item.content,
            emotionTags: classification.emotionTags,
            categoryTags: classification.categoryTags,
            rewards: classification.contentType === 'success' 
              ? { gold: 50, growth: 10 }
              : { gold: 30, growth: 5 },
          });
          successCount++;
        }
        message += '\n';
      }

      // 处理创业想法（分配到副业追踪）
      if (grouped.sidehustle.length > 0) {
        message += `💡 **副业追踪** (${grouped.sidehustle.length}个):\n`;
        for (const { item } of grouped.sidehustle) {
          message += `• ${item.content}\n`;
          // TODO: 添加到副业追踪（需要副业追踪支持想法记录）
          successCount++;
        }
        message += '\n';
      }

      message += `\n✅ 成功分配 ${successCount} 个项目！`;
      alert(message);

      // 删除已分配的项目
      const updatedItems = inboxItems.filter(item => !selectedItems.includes(item.id));
      setInboxItems(updatedItems);
      saveInboxItems(updatedItems);
      setSelectedItems([]);

    } catch (error) {
      console.error('智能分配失败:', error);
      
      // 显示详细的错误信息
      let errorMessage = '❌ AI 分析失败\n\n';
      
      if (error instanceof Error) {
        errorMessage += `错误详情：${error.message}\n\n`;
      }
      
      errorMessage += '可能的原因：\n';
      errorMessage += '1. API Key 不正确\n';
      errorMessage += '2. 网络连接问题\n';
      errorMessage += '3. API 接口地址错误\n';
      errorMessage += '4. API 配额已用完\n\n';
      errorMessage += '请检查 AI 智能助手的设置，或稍后再试。';
      
      alert(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 获取内容类型图标和颜色
  const getContentTypeInfo = (type?: string) => {
    switch (type) {
      case 'task':
        return { icon: '📅', color: '#007AFF', label: '任务' };
      case 'mood':
        return { icon: '😊', color: '#FF9500', label: '心情' };
      case 'thought':
        return { icon: '💭', color: '#8B5CF6', label: '想法' };
      case 'gratitude':
        return { icon: '🙏', color: '#34C759', label: '感恩' };
      case 'success':
        return { icon: '🎉', color: '#FF2D55', label: '成功' };
      case 'startup':
        return { icon: '💡', color: '#FFD60A', label: '创业' };
      default:
        return { icon: '📝', color: secondaryColor, label: '未分类' };
    }
  };

  return (
    <div className="h-full flex flex-col p-3 pb-32 md:pb-3" style={{ backgroundColor: bgColor }}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: textColor }}>
          📥 万能收集箱
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cardBg, color: secondaryColor }}>
            {inboxItems.length}
          </span>
        </h2>
        
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: secondaryColor }}>
              已选 {selectedItems.length} 项
            </span>
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs px-2 py-1 rounded"
              style={{ color: secondaryColor }}
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 说明 */}
      <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: cardBg }}>
        <p className="text-xs" style={{ color: secondaryColor }}>
          💡 可以收集：任务、心情、想法、感恩、成功、创业想法等，AI会智能识别并分配到相应组件
        </p>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-auto space-y-2 mb-3">
        {inboxItems.map((item) => {
          const typeInfo = getContentTypeInfo(item.contentType);
          const isSelected = selectedItems.includes(item.id);
          
          return (
            <div
              key={item.id}
              className="p-3 rounded-lg cursor-pointer transition-all"
              style={{
                backgroundColor: isSelected ? (isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)') : cardBg,
                border: `1px solid ${isSelected ? '#007AFF' : borderColor}`,
              }}
              onClick={() => toggleSelectItem(item.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.isAnalyzed && (
                      <span className="text-sm">{typeInfo.icon}</span>
                    )}
                    <div className="font-medium text-sm" style={{ color: textColor }}>
                      {item.content}
                    </div>
                  </div>
                  
                  {item.isAnalyzed && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: secondaryColor }}>
                      <span style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                      {item.confidence && (
                        <span>• 置信度 {Math.round(item.confidence * 100)}%</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-1 rounded transition-all"
                    style={{ color: '#FF3B30' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {inboxItems.length === 0 && (
          <div className="text-center py-12" style={{ color: secondaryColor }}>
            <div className="text-4xl mb-3">📥</div>
            <p className="text-sm font-medium mb-1">收集箱是空的</p>
            <p className="text-xs">在下方输入任何内容开始收集</p>
          </div>
        )}
      </div>

      {/* 底部操作区 */}
      <div className="space-y-2">
        {/* 智能分配按钮 */}
        {selectedItems.length > 0 && (
          <button
            onClick={handleSmartDistribute}
            disabled={isAnalyzing}
            className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: '#007AFF',
              color: '#ffffff',
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
                <span>智能分析并分配 ({selectedItems.length})</span>
              </>
            )}
          </button>
        )}

        {/* 输入框 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddToInbox()}
            placeholder="输入任何内容：任务、心情、想法、感恩..."
            className="flex-1 px-3 py-2.5 rounded-lg text-sm"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
          />
          <button
            onClick={handleAddToInbox}
            className="px-4 py-2.5 rounded-lg transition-all"
            style={{
              backgroundColor: '#34C759',
              color: '#ffffff',
            }}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 任务编辑器弹窗 - 与 AI 智能助手相同的编辑器 */}
      {showTaskEditor && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2">
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
                    backgroundColor: `${task.color}15`,
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
                        onClick={() => {
                          if (index === 0) return;
                          const newTasks = [...editingTasks];
                          [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
                          setEditingTasks(newTasks);
                        }}
                        disabled={index === 0}
                        className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        style={{ backgroundColor: `${task.color}20` }}
                        title="上移"
                      >
                        <ChevronUp className="w-5 h-5" style={{ color: task.color }} />
                      </button>
                      <button
                        onClick={() => {
                          if (index === editingTasks.length - 1) return;
                          const newTasks = [...editingTasks];
                          [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
                          setEditingTasks(newTasks);
                        }}
                        disabled={index === editingTasks.length - 1}
                        className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        style={{ backgroundColor: `${task.color}20` }}
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
                        onChange={(e) => {
                          const newTasks = [...editingTasks];
                          newTasks[index].title = e.target.value;
                          setEditingTasks(newTasks);
                        }}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                        autoFocus
                        className="w-full px-3 py-2 text-lg font-bold rounded-lg focus:outline-none focus:ring-2"
                        style={{ border: `2px solid ${task.color}`, color: task.color }}
                      />
                    ) : (
                      <div
                        onDoubleClick={() => setEditingField({ taskIndex: index, field: 'title' })}
                        className="text-lg font-bold cursor-pointer px-3 py-2 rounded-lg transition-colors"
                        style={{ color: task.color }}
                      >
                        {task.title}
                      </div>
                    )}
                  </div>

                  {/* 时间和时长 */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center space-x-2 rounded-lg px-3 py-2" style={{ backgroundColor: `${task.color}20` }}>
                      <Clock className="w-4 h-4" style={{ color: task.color }} />
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">{task.scheduled_start}</div>
                        <div className="text-xs text-gray-500">→ {task.scheduled_end}</div>
                      </div>
                    </div>

                    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: `${task.color}20` }}>
                      {editingField?.taskIndex === index && editingField?.field === 'duration' ? (
                        <input
                          type="number"
                          value={task.estimated_duration}
                          onChange={(e) => {
                            const newTasks = [...editingTasks];
                            newTasks[index].estimated_duration = parseInt(e.target.value) || 0;
                            setEditingTasks(newTasks);
                          }}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          autoFocus
                          className="w-full px-2 py-1 rounded focus:outline-none focus:ring-2"
                          style={{ border: `2px solid ${task.color}` }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => setEditingField({ taskIndex: index, field: 'duration' })}
                          className="cursor-pointer px-2 py-1 rounded transition-colors"
                        >
                          <div className="text-xs text-gray-500">时长</div>
                          <div className="font-semibold text-gray-900">{task.estimated_duration} 分钟</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 金币 */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 bg-yellow-50 rounded-lg px-3 py-2">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span className="font-bold text-yellow-700">{task.gold} 金币</span>
                    </div>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2">
                    {task.tags && task.tags.map((tag: string, tagIndex: number) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${AISmartProcessor.getColorForTag(tag)}30`,
                          color: AISmartProcessor.getColorForTag(tag),
                        }}
                      >
                        🏷️ {tag}
                      </span>
                    ))}
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
                  // 创建任务并推送到时间轴
                  for (const task of editingTasks) {
                    const scheduledStart = task.scheduled_start_iso 
                      ? new Date(task.scheduled_start_iso)
                      : new Date();
                    
                    await createTask({
                      title: task.title,
                      description: task.description || '',
                      durationMinutes: task.estimated_duration || 30,
                      goldReward: task.gold || Math.floor((task.estimated_duration || 30) * 1.5),
                      scheduledStart,
                      scheduledEnd: new Date(scheduledStart.getTime() + (task.estimated_duration || 30) * 60000),
                      taskType: task.task_type || 'life',
                      priority: task.priority === 'high' ? 1 : task.priority === 'medium' ? 2 : 3,
                      tags: task.tags || [],
                      status: 'pending',
                      color: task.color,
                      location: task.location,
                    });
                  }
                  
                  // 关闭编辑器
                  setShowTaskEditor(false);
                  setEditingTasks([]);
                  setEditingField(null);
                  
                  // 删除已分配的项目
                  const updatedItems = inboxItems.filter(item => !selectedItems.includes(item.id));
                  setInboxItems(updatedItems);
                  saveInboxItems(updatedItems);
                  setSelectedItems([]);
                  
                  alert(`✅ 已成功添加 ${editingTasks.length} 个任务到时间轴！`);
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


