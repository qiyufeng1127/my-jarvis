import { useState } from 'react';
import { X, Edit, Trash2, Copy, Clock, Star, Tag, Target, Lock, DollarSign, Calendar } from 'lucide-react';

interface TaskDetailPanelProps {
  task: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    priority: 'low' | 'medium' | 'high';
    category: string;
    description?: string;
    growth: { dimension: string; value: number; description: string }[];
    goals?: { name: string; contribution: number }[];
    verification?: {
      start?: { type: string; description: string };
      end?: { type: string; description: string };
    };
    rewards: {
      gold: number;
      baseGold: number;
      difficulty: number;
    };
    status: string;
  };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

export default function TaskDetailPanel({
  task,
  onClose,
  onEdit,
  onDelete,
  onCopy,
}: TaskDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'growth' | 'verification'>('info');

  // 优先级配置
  const priorityConfig = {
    low: { label: '低', color: 'text-gray-600', bg: 'bg-gray-100' },
    medium: { label: '中', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    high: { label: '高', color: 'text-red-600', bg: 'bg-red-100' },
  };

  // 类型配置
  const categoryConfig: Record<string, { label: string; color: string; emoji: string }> = {
    work: { label: '工作类', color: 'text-blue-600', emoji: '💼' },
    study: { label: '学习类', color: 'text-green-600', emoji: '📚' },
    health: { label: '健康类', color: 'text-orange-600', emoji: '💪' },
    life: { label: '生活类', color: 'text-purple-600', emoji: '🏠' },
    social: { label: '社交类', color: 'text-pink-600', emoji: '👥' },
    other: { label: '其他', color: 'text-gray-600', emoji: '📌' },
  };

  const priority = priorityConfig[task.priority];
  const category = categoryConfig[task.category] || categoryConfig.other;
  const duration = Math.round((task.endTime.getTime() - task.startTime.getTime()) / 60000);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-white/90">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {task.startTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {task.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {task.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-white/70">({duration}分钟)</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 标签 */}
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${priority.bg} ${priority.color}`}>
              ⭐ 优先级: {priority.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white`}>
              {category.emoji} {category.label}
            </span>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-neutral-200 bg-neutral-50">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            📝 基本信息
          </button>
          <button
            onClick={() => setActiveTab('growth')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'growth'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            📈 成长 & 目标
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'verification'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            🔒 验证 & 奖励
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 基本信息标签页 */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* 描述 */}
              {task.description && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    任务描述
                  </h3>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="text-neutral-800 whitespace-pre-wrap">{task.description}</p>
                  </div>
                </div>
              )}

              {/* 时间信息 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  时间安排
                </h3>
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">开始时间</span>
                    <span className="font-semibold text-blue-900">
                      {task.startTime.toLocaleString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">结束时间</span>
                    <span className="font-semibold text-blue-900">
                      {task.endTime.toLocaleString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                    <span className="text-sm text-blue-800">持续时长</span>
                    <span className="font-bold text-blue-900 text-lg">{duration} 分钟</span>
                  </div>
                </div>
              </div>

              {/* 状态 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-2">当前状态</h3>
                <div className="bg-neutral-50 rounded-lg p-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                    {task.status === 'completed' ? '✅ 已完成' : '⏳ 进行中'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 成长 & 目标标签页 */}
          {activeTab === 'growth' && (
            <div className="space-y-4">
              {/* 成长关联 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  成长关联
                </h3>
                <div className="space-y-3">
                  {task.growth.map((item, index) => (
                    <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-green-900">{item.dimension}</span>
                        <span className="text-2xl font-bold text-green-600">+{item.value}</span>
                      </div>
                      <p className="text-sm text-green-700">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 目标贡献 */}
              {task.goals && task.goals.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    目标贡献
                  </h3>
                  <div className="space-y-2">
                    {task.goals.map((goal, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-purple-900">🎯 {goal.name}</span>
                          <span className="text-xl font-bold text-purple-600">+{goal.contribution}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 验证 & 奖励标签页 */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              {/* 验证设置 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  验证设置
                </h3>
                <div className="space-y-3">
                  {task.verification?.start && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold text-yellow-900">🔓 开始验证</span>
                      </div>
                      <p className="text-sm text-yellow-800">
                        类型: {task.verification.start.type}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        {task.verification.start.description}
                      </p>
                    </div>
                  )}

                  {task.verification?.end && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold text-blue-900">✅ 完成验证</span>
                      </div>
                      <p className="text-sm text-blue-800">
                        类型: {task.verification.end.type}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {task.verification.end.description}
                      </p>
                    </div>
                  )}

                  {!task.verification?.start && !task.verification?.end && (
                    <div className="bg-neutral-50 rounded-lg p-4 text-center text-neutral-600">
                      未设置验证要求
                    </div>
                  )}
                </div>
              </div>

              {/* 奖励预估 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  奖励预估
                </h3>
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-yellow-800">总奖励</span>
                    <span className="text-3xl font-bold text-yellow-600">{task.rewards.gold} 💰</span>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-yellow-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-700">基础奖励</span>
                      <span className="font-semibold text-yellow-800">{task.rewards.baseGold} 💰</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-700">难度系数</span>
                      <span className="font-semibold text-yellow-800">× {task.rewards.difficulty}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <p className="text-xs text-yellow-700">
                      💡 完成任务后将获得金币奖励和成长值提升
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-neutral-200 p-4 bg-neutral-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>编辑</span>
              </button>
              <button
                onClick={onCopy}
                className="flex items-center space-x-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>复制</span>
              </button>
            </div>
            <button
              onClick={() => {
                if (confirm('确定要删除这个任务吗？')) {
                  onDelete();
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

