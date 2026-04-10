/**
 * 紧急任务设置组件
 * 包含紧急任务库管理和活动监控规则设置
 */

import React, { useState } from 'react';
import { useEmergencyTaskStore, EmergencyTask, TaskFrequency } from '@/stores/emergencyTaskStore';
import { activityMonitorService } from '@/services/activityMonitorService';
import { AlertCircle, Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';

export default function EmergencyTaskSettings() {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskEnabled, triggerRandomTask } = useEmergencyTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [remainingReplaces, setRemainingReplaces] = useState(activityMonitorService.getRemainingReplaces());
  const [enableVoice, setEnableVoice] = useState(false);

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

  // 加载语音播报设置
  React.useEffect(() => {
    try {
      const settings = localStorage.getItem('emergency-task-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setEnableVoice(parsed.enableVoice || false);
      }
    } catch (error) {
      console.warn('⚠️ 读取紧急任务设置失败:', error);
    }
  }, []);

  // 保存语音播报设置
  const saveVoiceSetting = (enabled: boolean) => {
    setEnableVoice(enabled);
    try {
      const settings = { enableVoice: enabled };
      localStorage.setItem('emergency-task-settings', JSON.stringify(settings));
      console.log('✅ 语音播报设置已保存:', enabled);
    } catch (error) {
      console.error('❌ 保存语音播报设置失败:', error);
    }
  };

  // 手动测试触发
  const handleTestTrigger = () => {
    if (tasks.length === 0) {
      return;
    }

    triggerRandomTask();
  };

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
    deleteTask(id);
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
    <div className="space-y-6">
      {/* 标题和说明 */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          🚨 紧急任务系统
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          当1小时无活动时，系统会随机抽取一个任务让你完成
        </p>
      </div>

      {/* 规则说明卡片 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
              触发规则
            </h3>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 连续1小时未在时间轴添加任务 → 触发紧急任务</li>
              <li>• 每日 0:00-9:00 期间不触发（豁免时段）</li>
              <li>• 添加任务后计时器自动重置</li>
              <li>• 每日最多替换任务 3 次（今日剩余：{remainingReplaces}次）</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 系统设置 */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">
          ⚙️ 系统设置
        </h3>

        {/* 语音播报开关 */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🔊 语音播报
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              触发任务时自动语音提醒
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={enableVoice}
              onChange={(e) => saveVoiceSetting(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
        </label>

        {/* 测试按钮 */}
        <button
          onClick={handleTestTrigger}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2"
        >
          🧪 测试触发紧急任务
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          点击后会立即触发一个随机紧急任务，用于测试功能
        </p>
      </div>

      {/* 添加按钮 */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          添加紧急任务
        </button>
      )}

      {/* 添加/编辑表单 */}
      {isAdding && (
        <div className="bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
            {editingId ? '编辑任务' : '添加新任务'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* 任务标题 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                任务标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：洗碗、整理书桌、做10个俯卧撑"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 任务描述 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                任务描述（可选）
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="详细说明任务要求..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* 频率 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                任务频率 *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as TaskFrequency })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  自定义天数
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.customDays}
                  onChange={(e) => setFormData({ ...formData, customDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* 奖励和惩罚 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  完成奖励（金币）
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goldReward}
                  onChange={(e) => setFormData({ ...formData, goldReward: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  失败惩罚（金币）
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goldPenalty}
                  onChange={(e) => setFormData({ ...formData, goldPenalty: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* 验证关键词 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                图片验证关键词（可选）
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="用逗号分隔，例如：碗,水槽,厨房"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                完成任务时需要拍照，AI会识别照片中是否包含这些关键词
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold transition-colors text-sm"
              >
                {editingId ? '保存修改' : '添加任务'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-bold transition-colors text-sm"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 任务列表 */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
          任务库 ({tasks.length}个)
        </h3>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm mb-2">📭 还没有紧急任务</p>
            <p className="text-xs">点击上方按钮添加你的第一个紧急任务</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 border-2 rounded-lg transition-all ${
                task.enabled
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                      {task.title}
                    </h4>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded flex-shrink-0">
                      {getFrequencyText(task)}
                    </span>
                    {!task.enabled && (
                      <span className="px-2 py-0.5 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded flex-shrink-0">
                        已禁用
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="text-green-600 dark:text-green-400">
                      +{task.goldReward} 💰
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      -{task.goldPenalty} 💰
                    </span>
                    {task.keywords && task.keywords.length > 0 && (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        📷 {task.keywords.length}个关键词
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleTaskEnabled(task.id)}
                    className={`p-1.5 rounded text-xs transition-colors ${
                      task.enabled
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                    }`}
                    title={task.enabled ? '禁用' : '启用'}
                  >
                    {task.enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
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

