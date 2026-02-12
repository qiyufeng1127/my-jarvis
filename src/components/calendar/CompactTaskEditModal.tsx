import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useGoalStore } from '@/stores/goalStore';
import type { Task } from '@/types';

interface CompactTaskEditModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
}

/**
 * 紧凑型任务编辑弹窗
 * 优化间距，信息密度更高，一屏显示所有内容
 */
export default function CompactTaskEditModal({ task, onClose, onSave }: CompactTaskEditModalProps) {
  const { goals } = useGoalStore();
  
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [startTime, setStartTime] = useState(() => {
    if (task.scheduledStart) {
      const date = new Date(task.scheduledStart);
      return date.toTimeString().slice(0, 5);
    }
    return '';
  });
  const [duration, setDuration] = useState(task.estimatedDuration || 30);
  const [gold, setGold] = useState(task.gold || 0);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [goalId, setGoalId] = useState(task.goalId || '');
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    const updates: Partial<Task> = {
      title,
      description,
      estimatedDuration: duration,
      gold,
      tags,
      goalId: goalId || undefined,
    };

    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      const date = task.scheduledStart ? new Date(task.scheduledStart) : new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      updates.scheduledStart = date.toISOString();
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border-2 border-purple-200 dark:border-purple-800">
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

        {/* 表单内容 - 紧凑布局 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              💰 金币奖励
            </label>
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
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            >
              <option value="">无关联目标</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 底部按钮 - 紧凑布局 */}
        <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-2 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-all active:scale-95"
          >
            ❌ 取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold transition-all active:scale-95 shadow-lg"
          >
            ✅ 保存
          </button>
        </div>
      </div>
    </div>
  );
}

