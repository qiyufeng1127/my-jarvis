import { useState, useEffect, useRef } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { useGoalStore } from '@/stores/goalStore';
import { useGoldStore } from '@/stores/goldStore';
import type { Task } from '@/types';

interface CompactTaskEditModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

/**
 * 紧凑型任务编辑弹窗
 * 优化间距，信息密度更高，一屏显示所有内容
 */
export default function CompactTaskEditModal({ task, onClose, onSave, onDelete }: CompactTaskEditModalProps) {
  console.log('🎨 CompactTaskEditModal 已渲染 - 智能分配按钮应该可见');
  console.log('📝 任务数据:', task);
  
  const { goals, createGoal } = useGoalStore();
  const { deductGold, balance } = useGoldStore();
  
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [startTime, setStartTime] = useState(() => {
    if (task.scheduledStart) {
      const date = new Date(task.scheduledStart);
      return date.toTimeString().slice(0, 5);
    }
    return '';
  });
  const [duration, setDuration] = useState(task.durationMinutes || 30);
  const [gold, setGold] = useState(task.goldReward || 0);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [selectedGoalId, setSelectedGoalId] = useState(() => {
    // 从 longTermGoals 中获取第一个目标ID
    const goalIds = Object.keys(task.longTermGoals || {});
    return goalIds.length > 0 ? goalIds[0] : '';
  });
  const [location, setLocation] = useState(task.location || '');
  const [newTag, setNewTag] = useState('');
  const [isAIAssigning, setIsAIAssigning] = useState(false);
  
  // 关联目标选择弹窗状态
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [goalSearchQuery, setGoalSearchQuery] = useState('');
  const [showNewGoalInput, setShowNewGoalInput] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  
  // 用于自动滚动的引用
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const goldRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  
  // 自动滚动到编辑项的函数
  const scrollToElement = (element: HTMLElement | null) => {
    if (!element) return;
    
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    
    // 延迟聚焦，确保滚动完成
    setTimeout(() => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.focus();
      }
    }, 300);
  };
  
  // 过滤后的目标列表
  const filteredGoals = goals.filter(goal => 
    goal.name.toLowerCase().includes(goalSearchQuery.toLowerCase())
  );
  
  // 处理选择目标
  const handleSelectGoal = (goalId: string) => {
    setSelectedGoalId(goalId);
    setShowGoalSelector(false);
    setGoalSearchQuery('');
  };
  
  // 处理新增目标
  const handleCreateNewGoal = () => {
    if (!newGoalName.trim()) {
      alert('请输入目标名称');
      return;
    }
    
    const newGoal = createGoal({
      name: newGoalName.trim(),
      description: '',
      goalType: 'boolean',
      isActive: true,
    });
    
    setSelectedGoalId(newGoal.id);
    setNewGoalName('');
    setShowNewGoalInput(false);
    setShowGoalSelector(false);
    setGoalSearchQuery('');
  };

  const handleSave = () => {
    const updates: Partial<Task> = {
      title,
      description,
      durationMinutes: duration,
      goldReward: gold,
      tags,
      location: location || undefined,
    };

    // 更新关联目标
    if (selectedGoalId) {
      updates.longTermGoals = { [selectedGoalId]: 100 }; // 100% 贡献度
    } else {
      updates.longTermGoals = {};
    }

    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      const date = task.scheduledStart ? new Date(task.scheduledStart) : new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      updates.scheduledStart = date;
      
      // 计算结束时间
      const endDate = new Date(date);
      endDate.setMinutes(endDate.getMinutes() + duration);
      updates.scheduledEnd = endDate;
    }

    onSave(updates);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // 删除任务处理
  const handleDelete = () => {
    const taskGold = task.goldReward || 0;
    
    if (taskGold <= 0) {
      // 如果任务没有金币奖励，直接删除
      if (confirm(`确定要删除任务"${task.title}"吗？`)) {
        if (onDelete) {
          onDelete(task.id);
        }
        onClose();
      }
      return;
    }
    
    // 校验金币余额
    if (balance < taskGold) {
      alert(`余额不足，无法删除此任务。\n需要: ${taskGold} 金币\n当前余额: ${balance} 金币`);
      return;
    }
    
    // 如果任务有金币奖励，需要扣除相应金币
    if (confirm(`删除任务"${task.title}"将扣除 ${taskGold} 金币，确定要删除吗？\n当前余额: ${balance} 金币`)) {
      try {
        // 扣除金币
        const success = deductGold(taskGold, `删除任务: ${task.title}`, task.id, task.title);
        
        if (!success) {
          alert('余额不足，无法删除此任务');
          return;
        }
        
        // 删除任务
        if (onDelete) {
          onDelete(task.id);
        }
        
        // 显示成功提示
        alert(`任务已删除，扣除 ${taskGold} 金币`);
        onClose();
      } catch (error) {
        console.error('删除任务失败:', error);
        alert(`删除失败，请重试。错误: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  };

  // AI智能分配 - 使用与AI助手相同的逻辑
  const handleAIAssign = async () => {
    if (!title.trim()) {
      alert('请先输入任务标题');
      return;
    }

    setIsAIAssigning(true);

    try {
      // 导入AI智能处理服务（与AI助手使用相同的服务）
      const { AISmartProcessor } = await import('@/services/aiSmartService');
      const { useTaskHistoryStore } = await import('@/stores/taskHistoryStore');
      
      console.log('🤖 开始AI智能分析任务:', title);
      
      // 调用AI智能分析（与AI助手分解任务使用相同的方法）
      const aiAnalysis = await AISmartProcessor.analyzeTaskWithAI(
        title,
        duration || undefined,
        description || undefined
      );
      
      console.log('✅ AI智能分析完成:', aiAnalysis);
      
      // 应用AI分配的结果
      setGold(aiAnalysis.duration ? AISmartProcessor.calculateGold({
        estimated_duration: aiAnalysis.duration,
        task_type: aiAnalysis.taskType,
        title: title,
        tags: aiAnalysis.tags,
      }) : gold);
      
      setTags(aiAnalysis.tags || []);
      setLocation(aiAnalysis.location || '');
      
      // 如果AI优化了标题，询问是否使用
      if (aiAnalysis.optimizedTitle && aiAnalysis.optimizedTitle !== title) {
        if (confirm(`AI建议优化标题为：\n\n"${aiAnalysis.optimizedTitle}"\n\n是否采用？`)) {
          setTitle(aiAnalysis.optimizedTitle);
        }
      }
      
      // 尝试从历史记录中获取平均时长
      try {
        const historyStore = useTaskHistoryStore.getState();
        const avgDuration = historyStore.getAverageDuration(title);
        if (avgDuration && avgDuration !== duration) {
          if (confirm(`根据历史记录，"${title}"平均需要 ${avgDuration} 分钟\n\n是否采用？`)) {
            setDuration(avgDuration);
          }
        }
      } catch (e) {
        console.warn('无法获取历史记录');
      }
      
      // 尝试匹配关联目标
      const goalName = AISmartProcessor.identifyGoal(title);
      if (goalName) {
        const matchedGoal = goals.find(g => g.name.includes(goalName) || goalName.includes(g.name));
        if (matchedGoal) {
          setSelectedGoalId(matchedGoal.id);
          console.log('🎯 自动关联目标:', matchedGoal.name);
        }
      }
      
      alert('✅ AI智能分配完成！\n\n已根据你的历史习惯和任务内容智能分配了时长、金币、标签和位置。');
      
    } catch (error) {
      console.error('AI智能分配失败:', error);
      alert(`AI智能分配失败：${error instanceof Error ? error.message : '未知错误'}\n\n请检查AI配置是否正确。`);
    } finally {
      setIsAIAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden border-2 border-purple-200 dark:border-purple-800">
        {/* 头部 - 紧凑设计 */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <h3 className="text-base font-bold text-white">编辑任务</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 表单内容 - 紧凑布局，添加底部内边距避免被按钮遮挡 */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
          {/* 任务标题 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📝 任务标题
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => scrollToElement(titleRef.current)}
              placeholder="输入任务名称..."
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* 任务描述 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📄 任务描述
            </label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => scrollToElement(descriptionRef.current)}
              placeholder="详细描述任务内容..."
              rows={2}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none transition-all"
            />
          </div>

          {/* 时间和时长 - 并排显示 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ⏰ 开始时间
              </label>
              <input
                ref={startTimeRef}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onFocus={() => scrollToElement(startTimeRef.current)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ⏱️ 时长（分钟）
              </label>
              <input
                ref={durationRef}
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                onFocus={() => scrollToElement(durationRef.current)}
                min="1"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* 金币奖励 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                💰 金币奖励
              </label>
              <button
                onClick={handleAIAssign}
                disabled={isAIAssigning || !title.trim()}
                className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md text-xs font-semibold hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="AI智能分配金币、标签、目标和位置"
              >
                {isAIAssigning ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>分配中...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>智能分配</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={goldRef}
              type="number"
              value={gold}
              onChange={(e) => setGold(parseInt(e.target.value) || 0)}
              onFocus={() => scrollToElement(goldRef.current)}
              min="0"
              className="w-full px-3 py-2 text-sm border-2 border-yellow-300 dark:border-yellow-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 text-gray-900 dark:text-white font-semibold transition-all"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              🏷️ 标签
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium shadow-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="添加标签..."
                className="flex-1 px-3 py-1.5 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
              <button
                onClick={addTag}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-semibold hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-all shadow-sm"
              >
                ➕ 添加
              </button>
            </div>
          </div>

          {/* 关联目标 */}
          <div ref={goalRef}>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              🎯 关联目标
            </label>
            <div
              onClick={() => {
                scrollToElement(goalRef.current);
                setShowGoalSelector(true);
              }}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all cursor-pointer hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {selectedGoalId ? (
                <span className="font-medium">
                  {goals.find(g => g.id === selectedGoalId)?.name || '选择目标...'}
                </span>
              ) : (
                <span className="text-gray-400">点击选择或新增目标...</span>
              )}
            </div>
          </div>

          {/* 位置 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📍 位置
            </label>
            <input
              ref={locationRef}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => scrollToElement(locationRef.current)}
              placeholder="例如：厨房、卧室、办公室..."
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            />
          </div>
        </div>

        {/* 关联目标选择弹窗 */}
        {showGoalSelector && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden border-2 border-purple-300 dark:border-purple-700">
              {/* 弹窗头部 */}
              <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 flex items-center justify-between">
                <h4 className="text-base font-bold text-white">🎯 选择关联目标</h4>
                <button
                  onClick={() => {
                    setShowGoalSelector(false);
                    setGoalSearchQuery('');
                    setShowNewGoalInput(false);
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* 搜索框 */}
              <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={goalSearchQuery}
                    onChange={(e) => setGoalSearchQuery(e.target.value)}
                    placeholder="搜索目标..."
                    className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    autoFocus
                  />
                </div>
              </div>

              {/* 目标列表 */}
              <div className="flex-1 overflow-y-auto p-3">
                {/* 无关联目标选项 */}
                <div
                  onClick={() => handleSelectGoal('')}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                    selectedGoalId === ''
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    无关联目标
                  </div>
                </div>

                {filteredGoals.length > 0 ? (
                  filteredGoals.map((goal) => (
                    <div
                      key={goal.id}
                      onClick={() => handleSelectGoal(goal.id)}
                      className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                        selectedGoalId === goal.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {goal.name}
                      </div>
                      {goal.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {goal.description}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    {goalSearchQuery ? '未找到匹配的目标' : '暂无已创建目标'}
                  </div>
                )}
              </div>

              {/* 新增目标区域 */}
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                {showNewGoalInput ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateNewGoal()}
                      placeholder="输入新目标名称..."
                      className="w-full px-3 py-2 text-sm border-2 border-purple-300 dark:border-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateNewGoal}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                      >
                        确认新增
                      </button>
                      <button
                        onClick={() => {
                          setShowNewGoalInput(false);
                          setNewGoalName('');
                        }}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewGoalInput(true)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新增目标</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 - 固定在底部，避免被导航栏遮挡，增加z-index确保在最上层 */}
        <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 px-3 py-3 flex gap-2 bg-white dark:bg-gray-800 sticky bottom-0 z-[100] shadow-2xl">
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg font-semibold transition-all active:scale-95 text-sm"
            style={{ backgroundColor: '#EF4444', color: 'white' }}
            title={`删除任务将扣除 ${task.goldReward || 0} 金币`}
          >
            删除此任务
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-all active:scale-95"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold transition-all active:scale-95 shadow-lg"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

