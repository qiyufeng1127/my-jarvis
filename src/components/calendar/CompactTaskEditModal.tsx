import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  
  const { goals } = useGoalStore();
  const { deductGold } = useGoldStore();
  
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
    
    // 如果任务有金币奖励，需要扣除相应金币
    if (confirm(`删除任务"${task.title}"将扣除 ${taskGold} 金币，确定要删除吗？`)) {
      // 扣除金币
      const success = deductGold(taskGold, `删除任务: ${task.title}`);
      
      if (!success) {
        alert('金币不足，无法删除任务');
        return;
      }
      
      // 删除任务
      if (onDelete) {
        onDelete(task.id);
      }
      onClose();
    }
  };

  // AI智能分配
  const handleAIAssign = async () => {
    if (!title.trim()) {
      alert('请先输入任务标题');
      return;
    }

    setIsAIAssigning(true);

    try {
      // 调用AI服务进行智能分配
      const { aiService } = await import('@/services/aiService');
      
      const prompt = `你是一个任务管理助手。请根据任务标题智能分配以下信息：

任务标题：${title}
${description ? `任务描述：${description}` : ''}

请分析任务内容，返回以下信息（JSON格式）：
{
  "goldReward": 金币奖励（数字，根据任务难度和时长估算，范围10-500），
  "tags": ["标签1", "标签2"]（最多3个相关标签，例如：工作、学习、生活、运动、创作等），
  "goalId": "关联目标ID"（如果能匹配到现有目标则返回ID，否则返回空字符串），
  "location": "位置"（如果任务涉及特定地点则填写，例如：厨房、卧室、办公室、健身房等，否则返回空字符串）
}

现有目标列表：
${goals.map(g => `- ${g.id}: ${g.title}`).join('\n')}

只返回JSON，不要有其他说明文字。`;

      const response = await aiService.chat([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      if (!response.success || !response.content) {
        throw new Error(response.error || 'AI调用失败');
      }

      // 解析AI返回的JSON
      let aiResult: {
        goldReward: number;
        tags: string[];
        goalId: string;
        location: string;
      };

      try {
        let jsonStr = response.content.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        aiResult = JSON.parse(jsonStr);
      } catch (e) {
        console.error('解析AI返回的JSON失败:', e);
        throw new Error('AI返回格式错误，请重试');
      }

      // 应用AI分配的结果
      setGold(aiResult.goldReward || 0);
      setTags(aiResult.tags || []);
      setSelectedGoalId(aiResult.goalId || '');
      setLocation(aiResult.location || '');

      console.log('✅ AI智能分配完成:', aiResult);
    } catch (error) {
      console.error('AI智能分配失败:', error);
      alert(`AI智能分配失败：${error instanceof Error ? error.message : '未知错误'}`);
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

        {/* 表单内容 - 紧凑布局，添加底部内边距避免被导航栏遮挡 */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-3">
          {/* 任务标题 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📝 任务标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ⏱️ 时长（分钟）
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
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
              type="number"
              value={gold}
              onChange={(e) => setGold(parseInt(e.target.value) || 0)}
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
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              🎯 关联目标
            </label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            >
              <option value="">无关联目标</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </div>

          {/* 位置 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📍 位置
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例如：厨房、卧室、办公室..."
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            />
          </div>
        </div>

        {/* 底部按钮 - 固定在底部，避免被导航栏遮挡 */}
        <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 px-3 py-2 flex gap-2 bg-gray-50 dark:bg-gray-800/50 sticky bottom-0 z-10 shadow-lg">
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

