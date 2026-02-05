import { useState, useEffect } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { aiUnified } from '@/services/aiUnifiedService';
import { useTaskStore } from '@/stores/taskStore';
import { useAIStore } from '@/stores/aiStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { AISmartProcessor } from '@/services/aiSmartService';
import UnifiedTaskEditor from '@/components/shared/UnifiedTaskEditor';

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
  
  const { createTask } = useTaskStore();
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
    try {
      const saved = localStorage.getItem('universal_inbox_items');
      console.log('📂 尝试加载收集箱数据...');
      console.log('📦 localStorage 中的数据:', saved);
      
      if (saved) {
        const items = JSON.parse(saved);
        const loadedItems = items.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
        setInboxItems(loadedItems);
        console.log('✅ 收集箱加载成功，共', loadedItems.length, '个项目');
      } else {
        console.log('📭 收集箱为空');
      }
    } catch (error) {
      console.error('❌ 加载收集箱失败:', error);
    }
  };

  const saveInboxItems = (items: InboxItem[]) => {
    try {
      localStorage.setItem('universal_inbox_items', JSON.stringify(items));
      console.log('💾 收集箱已保存，共', items.length, '个项目');
      console.log('📦 保存的数据:', items);
    } catch (error) {
      console.error('❌ 保存收集箱失败:', error);
      alert('⚠️ 保存失败！\n\n可能原因：\n1. 浏览器隐私模式\n2. localStorage 已满\n3. 浏览器禁用了存储');
    }
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
        // 使用新的统一服务进行内容分类
        const classifyResult = await aiUnified.classifyContent(item.content);
        
        let contentType = 'unknown';
        let targetComponent = 'none';
        let emotionTags: string[] = [];
        let categoryTags: string[] = [];
        
        if (classifyResult.success && classifyResult.data) {
          contentType = classifyResult.data.contentType;
          targetComponent = classifyResult.data.targetComponent;
          emotionTags = classifyResult.data.emotionTags || [];
          categoryTags = classifyResult.data.categoryTags || [];
        }
        
        results.push({
          item,
          classification: {
            contentType,
            targetComponent,
            emotionTags,
            categoryTags,
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

      // 处理任务（分配到时间轴）- 每个收集箱项目生成一个独立的大任务
      if (grouped.timeline.length > 0) {
        console.log('📋 收集箱任务数量:', grouped.timeline.length);
        
        try {
          const allTasks: any[] = [];
          let currentTime = new Date(Date.now() + 5 * 60000); // 5分钟后开始
          
          // 为每个收集箱项目单独调用 AI 分析
          for (const { item } of grouped.timeline) {
            console.log(`📝 分析任务: "${item.content}"`);
            
            const aiResponse = await AISmartProcessor.handleTaskDecomposition(
              item.content, // 直接传入任务内容，不添加时间前缀
              {
                user_id: 'current-user',
                current_time: currentTime.toLocaleTimeString('zh-CN'),
                current_date: currentTime.toLocaleDateString('zh-CN'),
                existing_tasks: useTaskStore.getState().tasks || [],
              }
            );
            
            // 检查是否有任务分解结果
            if (aiResponse.data && aiResponse.data.decomposed_tasks) {
              const tasks = aiResponse.data.decomposed_tasks;
              console.log(`✅ 任务 "${item.content}" 分析完成，生成 ${tasks.length} 个任务`);
              
              // 更新每个任务的开始时间
              tasks.forEach((task: any) => {
                task.scheduled_start_iso = currentTime.toISOString();
                const duration = task.estimated_duration || 30;
                const endTime = new Date(currentTime.getTime() + duration * 60000);
                task.scheduled_start = currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                task.scheduled_end = endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                
                // 下一个任务的开始时间
                currentTime = new Date(endTime.getTime());
              });
              
              allTasks.push(...tasks);
            }
          }
          
          if (allTasks.length > 0) {
            console.log(`🎯 打开任务编辑器，总共 ${allTasks.length} 个任务`);
            
            // 打开统一任务编辑器
            setEditingTasks(allTasks);
            setShowTaskEditor(true);
            setIsAnalyzing(false);
            // 直接返回，不显示 alert，不删除项目
            return;
          }
        } catch (error) {
          console.error('AI 分析失败:', error);
        }
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
    <div className="h-full flex flex-col bg-white dark:bg-black">
      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-auto p-3">
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
      <div className="space-y-2 mb-3">
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
      </div>

      {/* 底部操作区 - 固定在底部导航栏上方 */}
      <div className="fixed bottom-24 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-3 space-y-2 shadow-lg">
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

        {/* 输入框 - 改为 textarea 支持自动增高 */}
        <div className="flex gap-2 items-end">
          <textarea
            value={newItemContent}
            onChange={(e) => {
              setNewItemContent(e.target.value);
              // 自动调整高度
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddToInbox();
              }
            }}
            placeholder="输入任何内容：任务、心情、想法、感恩..."
            className="flex-1 px-3 py-2.5 rounded-lg text-sm resize-none overflow-hidden"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
              minHeight: '42px',
              maxHeight: '120px',
            }}
            rows={1}
          />
          <button
            onClick={handleAddToInbox}
            className="px-4 py-2.5 rounded-lg transition-all flex-shrink-0"
            style={{
              backgroundColor: '#34C759',
              color: '#ffffff',
            }}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 统一任务编辑器 */}
      {showTaskEditor && (
        <UnifiedTaskEditor
          tasks={editingTasks}
          onClose={() => {
            setShowTaskEditor(false);
            setEditingTasks([]);
          }}
          onConfirm={async (tasks) => {
            // 创建任务并推送到时间轴
            for (const task of tasks) {
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
            
            // 删除已分配的项目
            const updatedItems = inboxItems.filter(item => !selectedItems.includes(item.id));
            setInboxItems(updatedItems);
            saveInboxItems(updatedItems);
            setSelectedItems([]);
            
            alert(`✅ 已成功添加 ${tasks.length} 个任务到时间轴！`);
          }}
          isDark={isDark}
        />
      )}
    </div>
  );
}


