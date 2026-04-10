import { useState, useEffect } from 'react';
import { Plus, Sparkles, Calendar, Clock, Coins, ChevronRight, Trash2, CheckCircle, Brain } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { SmartScheduleService } from '@/services/smartScheduleService';
import { aiService } from '@/services/aiService';
import { useAIStore } from '@/stores/aiStore';
import type { Task } from '@/types';
import type { ScheduleTask, ScheduledResult } from '@/services/smartScheduleService';

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
  const { addMemory, addJournal } = useMemoryStore();
  const { createSideHustle, addIncome, addExpense } = useSideHustleStore();
  const { isConfigured } = useAIStore();
  
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
  
  const [scheduledResults, setScheduledResults] = useState<ScheduledResult[]>([]);
  
  // AI智能分析结果
  const [aiAnalysisResults, setAiAnalysisResults] = useState<Array<{
    task: InboxTask;
    classification: {
      contentType: string;
      targetComponent: string;
      emotionTags: string[];
      categoryTags: string[];
      confidence: number;
    };
  }>>([]);

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

    // 识别时间关键词
    if (title.includes('小时') || title.includes('hour')) {
      const match = title.match(/(\d+)\s*(小时|hour)/);
      if (match) duration = parseInt(match[1]) * 60;
    } else if (title.includes('分钟') || title.includes('min')) {
      const match = title.match(/(\d+)\s*(分钟|min)/);
      if (match) duration = parseInt(match[1]);
    }

    const goldReward = Math.round(duration / 30) * 100;

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

  // 智能分配任务到时间轴（增强版：使用AI助手的完整逻辑）
  const handleSmartSchedule = async () => {
    if (scheduledTasks.length === 0) {
      alert('请先添加任务到待安排列表');
      return;
    }

    // 检查是否配置了AI
    if (!isConfigured()) {
      const confirmConfig = confirm('AI智能分析需要配置API Key。\n\n配置后可以：\n• 智能识别内容类型（任务/心情/想法/副业）\n• 自动分配到对应组件\n• 更准确的标签识别\n\n是否现在配置？');
      if (confirmConfig) {
        // 这里可以打开配置弹窗
        alert('请在AI助手中点击右上角⚙️进行配置');
      }
      return;
    }

    setIsAnalyzing(true);
    
    try {
      console.log('🤖 开始AI智能分析...');
      
      // 第一步：使用AI分析每个任务的内容类型
      const analysisResults = [];
      
      for (const task of scheduledTasks) {
        console.log(`📝 分析任务: ${task.title}`);
        
        // 调用AI助手的内容分类服务（和AI助手使用同一个AI逻辑）
        const classification = await aiService.classifyContent(task.title);
        
        console.log(`✅ 分析结果:`, classification);
        
        analysisResults.push({
          task,
          classification,
        });
      }
      
      setAiAnalysisResults(analysisResults);
      
      // 第二步：按目标组件分组
      const grouped: Record<string, any[]> = {
        timeline: [],
        memory: [],
        journal: [],
        sidehustle: [],
      };

      analysisResults.forEach(({ task, classification }) => {
        grouped[classification.targetComponent].push({
          task,
          classification,
        });
      });
      
      console.log('📊 分组结果:', grouped);
      
      // 第三步：对于时间轴任务，进行智能排期
      if (grouped.timeline.length > 0) {
        const existingTasks = useTaskStore.getState().tasks;
        
        // 转换为 ScheduleTask 格式
        const tasksToSchedule: ScheduleTask[] = grouped.timeline.map(({ task }) => ({
          id: task.id,
          title: task.title,
          durationMinutes: task.durationMinutes || 30,
          priority: 2,
          tags: task.tags || [],
          goldReward: task.goldReward || 0,
          taskType: 'life',
        }));
        
        // 提取时间信息
        const tasksWithTime = SmartScheduleService.extractTimesFromTasks(tasksToSchedule);
        
        // 智能分配
        const results = SmartScheduleService.scheduleTasks(tasksWithTime, existingTasks);
        
        setScheduledResults(results);
      }
      
      setIsAnalyzing(false);
      setShowConfirmation(true);
    } catch (error) {
      console.error('❌ AI智能分析失败:', error);
      alert('AI分析失败，请检查API配置或稍后重试');
      setIsAnalyzing(false);
    }
  };

  // 确认并推送到各个组件（增强版：支持多组件分配）
  const handleConfirmSchedule = async () => {
    try {
      let distributedCount = 0;
      
      // 1. 分配到时间轴
      for (const result of scheduledResults) {
        if (!result.isConflict) {
          await createTask({
            title: result.task.title,
            durationMinutes: result.task.durationMinutes,
            goldReward: result.task.goldReward || 0,
            scheduledStart: result.scheduledStart,
            scheduledEnd: result.scheduledEnd,
            status: 'pending',
            tags: result.task.tags || [],
            taskType: result.task.taskType || 'life',
            priority: result.task.priority || 2,
            color: result.task.color,
            location: result.task.location,
          });
          distributedCount++;
        }
      }
      
      // 2. 分配到记忆库（心情/想法）
      const memoryItems = aiAnalysisResults.filter(r => r.classification.targetComponent === 'memory');
      for (const item of memoryItems) {
        addMemory({
          type: item.classification.contentType === 'mood' ? 'mood' : 'thought',
          content: item.task.title,
          emotionTags: item.classification.emotionTags,
          categoryTags: item.classification.categoryTags,
          rewards: { gold: 20, growth: 5 },
        });
        distributedCount++;
      }
      
      // 3. 分配到日记（成功/感恩）
      const journalItems = aiAnalysisResults.filter(r => r.classification.targetComponent === 'journal');
      for (const item of journalItems) {
        addJournal({
          type: item.classification.contentType === 'success' ? 'success' : 'gratitude',
          content: item.task.title,
          tags: item.classification.categoryTags,
          rewards: item.classification.contentType === 'success' 
            ? { gold: 50, growth: 10 }
            : { gold: 30, growth: 5 },
        });
        distributedCount++;
      }
      
      // 4. 分配到副业追踪器（创业想法）
      const sideHustleItems = aiAnalysisResults.filter(r => r.classification.targetComponent === 'sidehustle');
      for (const item of sideHustleItems) {
        await createSideHustle({
          name: item.task.title.slice(0, 50),
          icon: '💡',
          color: '#f59e0b',
          status: 'idea',
          aiAnalysis: item.task.title,
        });
        distributedCount++;
      }

      // 清空待安排列表和收集箱中已安排的任务
      setScheduledTasks([]);
      setInboxTasks(inboxTasks.filter(t => !t.isScheduled));
      setScheduledResults([]);
      setAiAnalysisResults([]);
      setShowConfirmation(false);
      
      // 显示分配结果
      const timelineCount = scheduledResults.filter(r => !r.isConflict).length;
      const memoryCount = memoryItems.length;
      const journalCount = journalItems.length;
      const sideHustleCount = sideHustleItems.length;
      
      let message = `✅ AI智能分配完成！\n\n共处理 ${distributedCount} 条内容：\n`;
      if (timelineCount > 0) message += `📅 时间轴: ${timelineCount} 个任务\n`;
      if (memoryCount > 0) message += `🧠 记忆库: ${memoryCount} 条记录\n`;
      if (journalCount > 0) message += `📖 日记: ${journalCount} 条记录\n`;
      if (sideHustleCount > 0) message += `💡 副业追踪器: ${sideHustleCount} 个想法\n`;
      
      alert(message);
    } catch (error) {
      console.error('推送失败:', error);
      alert('❌ 推送失败，请重试');
    }
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

        {/* 添加任务输入框 - 增加底部内边距避免被导航栏遮挡 */}
        <div className="flex gap-2 pb-24">
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
              <Brain size={18} className="animate-pulse" />
              <span>AI 智能分析中...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>AI智能分配（多组件）</span>
            </>
          )}
        </button>
        
        {/* 提示文字 */}
        <div className="mt-2 text-xs text-center" style={{ color: secondaryColor }}>
          💡 使用AI助手的完整逻辑
          <br />
          自动识别并分配到对应组件
        </div>
      </div>

      {/* 确认弹窗 */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl shadow-2xl max-w-2xl w-full p-6"
            style={{ backgroundColor: bgColor }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: textColor }}>
              ✨ AI 智能分析结果
            </h3>

            {/* AI分析统计 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: cardBg }}>
                <div className="text-2xl mb-1">📅</div>
                <div className="text-xs" style={{ color: secondaryColor }}>时间轴</div>
                <div className="text-lg font-bold" style={{ color: textColor }}>
                  {aiAnalysisResults.filter(r => r.classification.targetComponent === 'timeline').length}
                </div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: cardBg }}>
                <div className="text-2xl mb-1">🧠</div>
                <div className="text-xs" style={{ color: secondaryColor }}>记忆库</div>
                <div className="text-lg font-bold" style={{ color: textColor }}>
                  {aiAnalysisResults.filter(r => r.classification.targetComponent === 'memory').length}
                </div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: cardBg }}>
                <div className="text-2xl mb-1">📖</div>
                <div className="text-xs" style={{ color: secondaryColor }}>日记</div>
                <div className="text-lg font-bold" style={{ color: textColor }}>
                  {aiAnalysisResults.filter(r => r.classification.targetComponent === 'journal').length}
                </div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: cardBg }}>
                <div className="text-2xl mb-1">💡</div>
                <div className="text-xs" style={{ color: secondaryColor }}>副业</div>
                <div className="text-lg font-bold" style={{ color: textColor }}>
                  {aiAnalysisResults.filter(r => r.classification.targetComponent === 'sidehustle').length}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-auto">
              {/* 显示所有分析结果 */}
              {aiAnalysisResults.map((item, index) => {
                const { task, classification } = item;
                const componentEmoji = {
                  timeline: '📅',
                  memory: '🧠',
                  journal: '📖',
                  sidehustle: '💡',
                }[classification.targetComponent] || '📋';
                
                const componentName = {
                  timeline: '时间轴',
                  memory: '记忆库',
                  journal: '日记',
                  sidehustle: '副业追踪器',
                }[classification.targetComponent] || '未知';
                
                // 如果是时间轴任务，显示排期信息
                const scheduleResult = classification.targetComponent === 'timeline' 
                  ? scheduledResults.find(r => r.task.id === task.id)
                  : null;
                
                return (
                  <div
                    key={index}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: scheduleResult?.isConflict ? 'rgba(239, 68, 68, 0.1)' : cardBg,
                      border: `1px solid ${scheduleResult?.isConflict ? '#EF4444' : borderColor}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl">{componentEmoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold" style={{ color: textColor }}>
                            {task.title}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                            backgroundColor: isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)',
                            color: '#007AFF'
                          }}>
                            {componentName}
                          </span>
                        </div>
                        
                        {/* AI识别的内容类型 */}
                        <div className="text-xs mb-2" style={{ color: secondaryColor }}>
                          🤖 AI识别: {classification.contentType} (置信度 {Math.round(classification.confidence * 100)}%)
                        </div>
                        
                        {/* 如果是时间轴任务，显示排期 */}
                        {scheduleResult && (
                          <>
                            {scheduleResult.isConflict ? (
                              <div className="text-sm text-red-500 mb-2">
                                ⚠️ 时间冲突：与任务「{scheduleResult.conflictWith?.title}」冲突
                              </div>
                            ) : (
                              <div className="text-sm mb-2" style={{ color: secondaryColor }}>
                                {scheduleResult.task.hasExplicitTime ? '🎯 精准时间：' : '💡 智能插空：'}
                                {scheduleResult.scheduledStart.toLocaleDateString('zh-CN')} {scheduleResult.scheduledStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - {scheduleResult.scheduledEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* 标签 */}
                        {classification.emotionTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {classification.emotionTags.map(tag => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ 
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                color: secondaryColor
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
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
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                💡 <strong>AI智能分配说明：</strong>
                <br />
                • 使用AI助手的完整逻辑，自动识别内容类型
                <br />
                • 任务 → 时间轴（自动找空闲时间段）
                <br />
                • 心情/想法 → 记忆库
                <br />
                • 成功/感恩 → 日记
                <br />
                • 创业想法 → 副业追踪器
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setScheduledResults([]);
                  setAiAnalysisResults([]);
                }}
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
                确认分配 ({aiAnalysisResults.length} 条)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

