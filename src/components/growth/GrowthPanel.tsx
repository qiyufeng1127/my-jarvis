import { useState } from 'react';
import { useGrowthStore } from '@/stores/growthStore';
import { Card, Progress } from '@/components/ui';
import { TrendingUp, Plus, Edit2, X, Save, ChevronRight, Target, Crown, BarChart3 } from 'lucide-react';
import GrowthDimensions from './GrowthDimensions';
import IdentitySystem from './IdentitySystem';
import LongTermGoals from './LongTermGoals';
import LevelRoadmap from './LevelRoadmap';
import DimensionDetail from './DimensionDetail';
import GoalDetail from './GoalDetail';
import GoalForm from './GoalForm';

interface GrowthPanelProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function GrowthPanel({ isDark = false, bgColor = '#ffffff' }: GrowthPanelProps) {
  const { dimensions, currentLevel, totalGrowth } = useGrowthStore();
  const [showAddDimension, setShowAddDimension] = useState(false);
  const [editingDimension, setEditingDimension] = useState<string | null>(null);
  const [newDimension, setNewDimension] = useState({
    name: '',
    description: '',
    icon: '⚡',
    color: '#991B1B',
    value: 0
  });

  // 视图状态
  const [currentView, setCurrentView] = useState<'overview' | 'dimensions' | 'identity' | 'goals' | 'levelRoadmap' | 'dimensionDetail' | 'goalDetail'>('overview');
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);

  // 颜色适配
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 计算到下一级的进度
  const nextLevel = currentLevel ? currentLevel.levelOrder + 1 : 2;
  const currentRequired = currentLevel?.requiredGrowth || 0;
  const nextRequired = 500; // 示例值，应该从 levels 中获取
  const progress = ((totalGrowth - currentRequired) / (nextRequired - currentRequired)) * 100;

  // 默认维度数据
  const defaultDimensions = [
    { id: '1', name: '执行力', icon: '⚡', value: 82, color: '#991B1B' },
    { id: '2', name: '专注力', icon: '🎯', value: 73, color: '#7C3AED' },
    { id: '3', name: '健康力', icon: '❤️', value: 65, color: '#047857' },
    { id: '4', name: '财富力', icon: '💰', value: 89, color: '#d97706' },
    { id: '5', name: '魅力值', icon: '✨', value: 80, color: '#ec4899' },
  ];

  const displayDimensions = dimensions.length > 0 ? dimensions : defaultDimensions;

  const handleAddDimension = () => {
    // 这里应该调用 store 的方法添加维度
    console.log('添加维度:', newDimension);
    setShowAddDimension(false);
    setNewDimension({
      name: '',
      description: '',
      icon: '⚡',
      color: '#991B1B',
      value: 0
    });
  };

  const iconOptions = ['⚡', '🎯', '❤️', '💰', '✨', '🧠', '💪', '🎨', '📚', '🌟'];
  const colorOptions = ['#991B1B', '#7C3AED', '#047857', '#d97706', '#ec4899', '#0891b2', '#ea580c', '#84cc16'];

  // 模拟数据
  const mockDimensionsData = displayDimensions.map(dim => ({
    id: dim.id,
    name: dim.name,
    icon: dim.icon,
    color: dim.color,
    currentValue: dim.value || dim.currentValue || 0,
    weeklyChange: Math.floor(Math.random() * 20) - 5,
    description: `${dim.name}的成长追踪`,
    weight: 1.0,
    relatedTaskTypes: ['work', 'study'],
    history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 100)
    }))
  }));

  const mockGoals = [
    {
      id: '1',
      name: '完成100个任务',
      type: 'numeric' as const,
      currentValue: 65,
      targetValue: 100,
      unit: '个',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      relatedDimensions: ['1', '2'],
      description: '提升执行力和专注力',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      recentProgress: [{ date: new Date(), value: 5 }]
    },
    {
      id: '2',
      name: '坚持早起21天',
      type: 'habit' as const,
      currentValue: 14,
      targetValue: 21,
      unit: '天',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      relatedDimensions: ['3'],
      description: '养成健康作息习惯',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      recentProgress: [{ date: new Date(), value: 1 }]
    }
  ];

  // 根据当前视图渲染不同内容
  if (currentView === 'dimensions') {
    return (
      <div className="h-full overflow-auto">
        <GrowthDimensions
          dimensions={mockDimensionsData}
          onDimensionClick={(id) => {
            setSelectedDimensionId(id);
            setCurrentView('dimensionDetail');
          }}
          onAdd={() => setShowAddDimension(true)}
          isEditMode={false}
        />
      </div>
    );
  }

  if (currentView === 'dimensionDetail' && selectedDimensionId) {
    const dimension = mockDimensionsData.find(d => d.id === selectedDimensionId);
    if (dimension) {
      return (
        <div className="h-full overflow-auto">
          <button
            onClick={() => setCurrentView('dimensions')}
            className="mb-4 flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>返回维度列表</span>
          </button>
          <DimensionDetail
            dimension={dimension}
            relatedTasks={[]}
            relatedGoals={[]}
            onEdit={() => {}}
            onClose={() => setCurrentView('dimensions')}
          />
        </div>
      );
    }
  }

  if (currentView === 'identity') {
    return (
      <div className="h-full overflow-auto">
        <IdentitySystem
          currentGrowth={totalGrowth || 650}
          onViewAllLevels={() => setCurrentView('levelRoadmap')}
        />
      </div>
    );
  }

  if (currentView === 'levelRoadmap') {
    return (
      <div className="h-full overflow-auto">
        <button
          onClick={() => setCurrentView('identity')}
          className="mb-4 flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>返回身份系统</span>
        </button>
        <LevelRoadmap
          currentGrowth={totalGrowth || 650}
          onClose={() => setCurrentView('identity')}
        />
      </div>
    );
  }

  if (currentView === 'goals') {
    return (
      <div className="h-full overflow-auto">
        {showGoalForm ? (
          <>
            <button
              onClick={() => setShowGoalForm(false)}
              className="mb-4 flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>返回目标列表</span>
            </button>
            <GoalForm
              onSave={() => setShowGoalForm(false)}
              onCancel={() => setShowGoalForm(false)}
            />
          </>
        ) : (
          <LongTermGoals
            goals={mockGoals}
            onCreateGoal={() => setShowGoalForm(true)}
            onGoalClick={(id) => {
              setSelectedGoalId(id);
              setCurrentView('goalDetail');
            }}
            onEdit={(id) => setShowGoalForm(true)}
            onDelete={(id) => console.log('删除目标', id)}
          />
        )}
      </div>
    );
  }

  if (currentView === 'goalDetail' && selectedGoalId) {
    const goal = mockGoals.find(g => g.id === selectedGoalId);
    if (goal) {
      return (
        <div className="h-full overflow-auto">
          <button
            onClick={() => setCurrentView('goals')}
            className="mb-4 flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>返回目标列表</span>
          </button>
          <GoalDetail
            goal={goal}
            contributingTasks={[]}
            onUpdate={() => {}}
            onEdit={() => setShowGoalForm(true)}
            onDelete={() => setCurrentView('goals')}
            onClose={() => setCurrentView('goals')}
          />
        </div>
      );
    }
  }

  // 默认概览视图
  return (
    <div className="space-y-6">
      {/* 成长总览 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: textColor }}>我的成长</h2>
        
        {/* 成长进度环 */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={borderColor}
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={isDark ? '#60a5fa' : '#3b82f6'}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                className="transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: textColor }}>
                {Math.round(progress)}%
              </span>
              <span className="text-xs" style={{ color: accentColor }}>成长进度</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: accentColor }}>当前身份</span>
            <span className="font-semibold" style={{ color: textColor }}>{currentLevel?.name || '成长探索者'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: accentColor }}>总成长值</span>
            <span className="font-semibold" style={{ color: textColor }}>{totalGrowth || 650}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: accentColor }}>本周增长</span>
            <span className="font-semibold flex items-center" style={{ color: isDark ? '#4ade80' : '#16a34a' }}>
              <TrendingUp className="w-4 h-4 mr-1" />
              +85
            </span>
          </div>
        </div>
      </div>

      {/* 身份系统快捷入口 */}
      <div 
        className="rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg"
        style={{ backgroundColor: cardBg }}
        onClick={() => setCurrentView('identity')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
              👑
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: textColor }}>
                {currentLevel?.name || '成长探索者'}
              </h3>
              <p className="text-xs" style={{ color: accentColor }}>
                点击查看身份系统
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>

      {/* 长期目标快捷入口 */}
      <div 
        className="rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg"
        style={{ backgroundColor: cardBg }}
        onClick={() => setCurrentView('goals')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
              🎯
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: textColor }}>
                长期目标
              </h3>
              <p className="text-xs" style={{ color: accentColor }}>
                2个进行中 · 点击查看
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>

      {/* 成长维度 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: textColor }}>核心维度</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('dimensions')}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors text-sm"
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: textColor
              }}
            >
              <BarChart3 className="w-4 h-4" />
              <span>查看全部</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddDimension(true)}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors text-sm"
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: textColor
              }}
            >
              <Plus className="w-4 h-4" />
              <span>添加</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {displayDimensions.map((dim: any) => (
            <div key={dim.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: textColor }}>
                  {dim.icon} {dim.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold" style={{ color: textColor }}>{dim.value || dim.currentValue}</span>
                  <button
                    onClick={() => setEditingDimension(dim.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  >
                    <Edit2 className="w-3 h-3" style={{ color: accentColor }} />
                  </button>
                </div>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: borderColor }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${dim.value || dim.currentValue}%`,
                    backgroundColor: dim.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 添加维度弹窗 */}
      {showAddDimension && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddDimension(false)}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">添加成长维度</h3>
              <button onClick={() => setShowAddDimension(false)}>
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">维度名称</label>
                <input
                  type="text"
                  value={newDimension.name}
                  onChange={(e) => setNewDimension({ ...newDimension, name: e.target.value })}
                  placeholder="如：创造力"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">描述（可选）</label>
                <textarea
                  value={newDimension.description}
                  onChange={(e) => setNewDimension({ ...newDimension, description: e.target.value })}
                  placeholder="描述这个维度..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-700">选择图标</label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewDimension({ ...newDimension, icon })}
                      className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                        newDimension.icon === icon
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-700">选择颜色</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewDimension({ ...newDimension, color })}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        newDimension.color === color
                          ? 'border-neutral-900 scale-110'
                          : 'border-neutral-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">初始值</label>
                <input
                  type="number"
                  value={newDimension.value}
                  onChange={(e) => setNewDimension({ ...newDimension, value: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                onClick={handleAddDimension}
                className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>保存维度</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

