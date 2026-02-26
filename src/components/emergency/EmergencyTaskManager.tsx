/**
 * 紧急任务管理界面
 * 用于添加、编辑、删除紧急任务
 */

import React, { useState } from 'react';
import { useEmergencyTaskStore, EmergencyTask, TaskFrequency } from '@/stores/emergencyTaskStore';

export default function EmergencyTaskManager() {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskEnabled } = useEmergencyTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily' as TaskFrequency,
    customDays: 1,
    goldReward: 50,
    goldPenalty: 20,
    keywords: '',
    enabled: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'daily',
      customDays: 1,
      goldReward: 50,
      goldPenalty: 20,
      keywords: '',
      enabled: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskData = {
      title: formData.title,
      description: formData.description,
      frequency: formData.frequency,
      customDays: formData.frequency === 'custom' ? formData.customDays : undefined,
      goldReward: formData.goldReward,
      goldPenalty: formData.goldPenalty,
      keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
      enabled: formData.enabled,
    };

    if (editingId) {
      updateTask(editingId, taskData);
    } else {
      addTask(taskData);
    }

    resetForm();
  };

  const handleEdit = (task: EmergencyTask) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      frequency: task.frequency,
      customDays: task.customDays || 1,
      goldReward: task.goldReward,
      goldPenalty: task.goldPenalty,
      keywords: task.keywords?.join(', ') || '',
      enabled: task.enabled,
    });
    setEditingId(task.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个紧急任务吗？')) {
      deleteTask(id);
    }
  };

  const getFrequencyText = (task: EmergencyTask) => {
    switch (task.frequency) {
      case 'daily':
        return '每天';
      case 'every-2-days':
        return '每两天';
      case 'weekly':
        return '每周';
      case 'custom':
        return `每${task.customDays}天`;
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🚨 紧急任务库</h1>
        <p className="text-gray-600">
          管理你的紧急任务。当1小时无活动时，系统会随机抽取一个任务让你完成。
        </p>
      </div>

      {/* 添加按钮 */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="mb-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
        >
          ➕ 添加紧急任务
        </button>
      )}

      {/* 添加/编辑表单 */}
      {isAdding && (
        <div className="mb-6 p-6 bg-white border-2 border-blue-300 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? '编辑任务' : '添加新任务'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 任务标题 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                任务标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：洗碗、整理书桌、做10个俯卧撑"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 任务描述 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                任务描述（可选）
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="详细说明任务要求..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 频率 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                任务频率 *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as TaskFrequency })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">每天一次</option>
                <option value="every-2-days">每两天一次</option>
                <option value="weekly">每周一次</option>
                <option value="custom">自定义天数</option>
              </select>
            </div>

            {/* 自定义天数 */}
            {formData.frequency === 'custom' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  自定义天数
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.customDays}
                  onChange={(e) => setFormData({ ...formData, customDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* 奖励和惩罚 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  完成奖励（金币）
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goldReward}
                  onChange={(e) => setFormData({ ...formData, goldReward: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  失败惩罚（金币）
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goldPenalty}
                  onChange={(e) => setFormData({ ...formData, goldPenalty: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 验证关键词 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                图片验证关键词（可选）
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="用逗号分隔，例如：碗,水槽,厨房"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                完成任务时需要拍照，AI会识别照片中是否包含这些关键词
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
              >
                {editingId ? '保存修改' : '添加任务'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 任务列表 */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">📭 还没有紧急任务</p>
            <p className="text-sm">点击上方按钮添加你的第一个紧急任务</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 border-2 rounded-lg transition-all ${
                task.enabled
                  ? 'bg-white border-gray-200 hover:border-blue-300'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-800">
                      {task.title}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      {getFrequencyText(task)}
                    </span>
                    {!task.enabled && (
                      <span className="px-2 py-0.5 bg-gray-300 text-gray-600 text-xs rounded">
                        已禁用
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      +{task.goldReward} 💰
                    </span>
                    <span className="text-red-600">
                      -{task.goldPenalty} 💰
                    </span>
                    {task.keywords && task.keywords.length > 0 && (
                      <span className="text-yellow-600">
                        📷 {task.keywords.length}个关键词
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleTaskEnabled(task.id)}
                    className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                      task.enabled
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {task.enabled ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleEdit(task)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-bold hover:bg-blue-200 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-bold hover:bg-red-200 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

