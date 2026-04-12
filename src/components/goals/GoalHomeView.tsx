import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Copy, Pencil, Plus, Settings, Sparkles, Trash2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import eventBus, { type DashboardNavigatePayload } from '@/utils/eventBus';
import { useGoalStore } from '@/stores/goalStore';
import { useGoalContributionStore } from '@/stores/goalContributionStore';
import { useHQBridgeStore } from '@/stores/hqBridgeStore';
import { useHabitStore } from '@/stores/habitStore';
import GoalAnalyticsView from '@/components/goals/GoalAnalyticsView';
import GoalForm, { type GoalFormData } from '@/components/growth/GoalForm';
import { buildGoalPayloadFromForm } from '@/utils';
import HabitList from '@/components/habits/HabitList';
import AddHabitModal from '@/components/habits/AddHabitModal';
import HabitDetailModal from '@/components/habits/HabitDetailModal';
import HabitCandidateList from '@/components/habits/HabitCandidateList';
import HabitRuleSettingsModal from '@/components/habits/HabitRuleSettingsModal';
import type { LongTermGoal } from '@/types';

interface GoalHomeViewProps {
  isDark?: boolean;
  bgColor?: string;
}

type GoalSegment = 'active' | 'habit' | 'expired';

interface GoalCardGroup {
  key: Exclude<GoalSegment, 'habit'>;
  title: string;
  emptyText: string;
  goals: LongTermGoal[];
}

function getGoalProgress(goal: LongTermGoal) {
  if (goal.dimensions.length > 0) {
    const weightedProgress = goal.dimensions.reduce((sum, item) => {
      if (!item.targetValue) return sum;
      const rate = Math.max(0, Math.min(1, item.currentValue / item.targetValue));
      return sum + rate * item.weight;
    }, 0);
    return Math.round(weightedProgress);
  }

  if (!goal.targetValue || goal.targetValue <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)));
}

function getGoalSegment(goal: LongTermGoal): Exclude<GoalSegment, 'habit'> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (goal.isCompleted) {
    return 'expired';
  }

  if (goal.startDate) {
    const startDate = new Date(goal.startDate);
    startDate.setHours(0, 0, 0, 0);
    if (startDate > today) {
      return 'active';
    }
  }

  if (goal.endDate) {
    const endDate = new Date(goal.endDate);
    endDate.setHours(0, 0, 0, 0);
    if (endDate < today) {
      return 'expired';
    }
  }

  return 'active';
}

function getDateRangeLabel(goal: LongTermGoal) {
  if (!goal.startDate && !goal.endDate) return '未设置日期';
  const start = goal.startDate ? new Date(goal.startDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '未定';
  const end = goal.endDate ? new Date(goal.endDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '未定';
  return `${start} - ${end}`;
}

function getDeadlineLabel(goal: LongTermGoal) {
  if (!goal.endDate) return '未设置结束时间';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(goal.endDate);
  endDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (goal.startDate) {
    const startDate = new Date(goal.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate > today) {
      const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return `${daysUntilStart} 天后开始`;
    }

    const elapsedDays = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (diffDays > 0) return `已进行 ${elapsedDays} 天`;
  }

  if (diffDays === 0) return '今天结束';
  if (diffDays < 0) return `已经 ${Math.abs(diffDays)} 天`;
  return `剩余 ${diffDays} 天`;
}

function normalizeFormData(goal?: LongTermGoal | null): GoalFormData | undefined {
  if (!goal) return undefined;
  return {
    name: goal.name,
    description: goal.description,
    type: goal.goalType,
    startDate: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
    endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
    estimatedTotalHours: goal.estimatedTotalHours || 0,
    targetIncome: goal.targetIncome || 0,
    dimensions: goal.dimensions.length > 0 ? goal.dimensions : [{
      id: `metric-${goal.id}`,
      name: goal.name,
      unit: goal.unit || '',
      targetValue: goal.targetValue || 1,
      currentValue: goal.currentValue,
      weight: 100,
    }],
    projectBindings: goal.projectBindings,
    theme: goal.theme,
    showInFuture30Chart: goal.showInFuture30Chart,
    relatedDimensions: goal.relatedDimensions,
  };
}

export default function GoalHomeView({ isDark = false, bgColor = '#f3f2ef' }: GoalHomeViewProps) {
  const pageSurface = '#FFFFFF';
  const softSurface = '#F5F5F7';
  const pageText = '#1D1D1F';
  const mutedText = 'rgba(0, 0, 0, 0.5)';
  const accentPink = '#DD617C';
  const accentGreen = '#6D9978';
  const accentBlue = '#0A84FF';
  const accentPurple = '#8B5CF6';
  const accentDanger = '#FF5A7A';
  const cardShadow = '0 12px 32px rgba(15,23,42,0.06)';
  const activeTabShadow = '0 8px 18px rgba(221,97,124,0.24)';
  const { goals, loadGoals, createGoal, updateGoal, deleteGoal } = useGoalStore();
  const addContributionRecord = useGoalContributionStore((state) => state.addRecord);
  const activeLoop = useHQBridgeStore((state) => state.activeLoop);

  const accountabilitySummary = activeLoop?.accountabilityForm
    ? activeLoop.accountabilityForm.answers
        .filter((item) => item.answer?.trim())
        .slice(0, 2)
        .map((item) => item.answer.trim())
    : [];

  const habits = useHabitStore((state) => state.habits);
  const candidates = useHabitStore((state) => state.candidates.filter((c) => c.status === 'pending'));

  const [segment, setSegment] = useState<GoalSegment>('active');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LongTermGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<LongTermGoal | null>(null);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [habitTab, setHabitTab] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showRuleSettings, setShowRuleSettings] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    const handleNavigate = (payload?: DashboardNavigatePayload) => {
      if (payload?.module && payload.module !== 'goals') return;
      if (!payload?.goalId) return;

      setLinkedGoalId(payload.goalId);
      const matchedGoal = useGoalStore.getState().goals.find((goal) => goal.id === payload.goalId)
        || (activeLoop?.goalId === payload.goalId ? goals.find((goal) => goal.id === activeLoop.goalId) : undefined);
      if (matchedGoal) {
        setSelectedGoal(matchedGoal);
      }
    };

    eventBus.on('dashboard:navigate-module', handleNavigate);
    return () => {
      eventBus.off('dashboard:navigate-module', handleNavigate);
    };
  }, [activeLoop?.goalId, goals]);

  const activeGoals = useMemo(() => goals.filter((goal) => getGoalSegment(goal) === 'active'), [goals]);
  const expiredGoals = useMemo(() => goals.filter((goal) => getGoalSegment(goal) === 'expired'), [goals]);
  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archivedAt), [habits]);
  const filteredHabits = useMemo(() => {
    return activeHabits.filter((habit) => {
      if (habitTab === 'all') return true;
      return habit.frequency === habitTab;
    });
  }, [activeHabits, habitTab]);

  const groupedGoals: GoalCardGroup[] = [
    { key: 'active', title: '正在进行', emptyText: '暂无进行中目标。', goals: activeGoals },
    { key: 'expired', title: '已经过去', emptyText: '暂无已过期或已归档目标。', goals: expiredGoals },
  ];

  const currentGroup = groupedGoals.find((group) => group.key === segment) ?? groupedGoals[0];
  const totalHours = Math.round(goals.reduce((sum, goal) => sum + (goal.estimatedTotalHours || 0), 0) * 10) / 10;

  const tabs = [
    { id: 'all' as const, label: '所有', emoji: '📋' },
    { id: 'daily' as const, label: '日', emoji: '☀️' },
    { id: 'weekly' as const, label: '周', emoji: '📅' },
    { id: 'monthly' as const, label: '月', emoji: '🗓️' },
  ];

  const handleSaveGoal = (formData: GoalFormData) => {
    const payload = buildGoalPayloadFromForm(formData);

    if (editingGoal) {
      updateGoal(editingGoal.id, payload);
    } else {
      createGoal(payload);
    }

    setEditingGoal(null);
    setShowForm(false);
  };

  const handleEditGoal = (goal: LongTermGoal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDuplicateGoal = (goal: LongTermGoal) => {
    const duplicatedGoal = createGoal({
      name: `${goal.name}（副本）`,
      description: goal.description,
      goalType: goal.goalType,
      startDate: goal.startDate ? new Date(goal.startDate) : undefined,
      endDate: goal.endDate ? new Date(goal.endDate) : undefined,
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
      estimatedTotalHours: goal.estimatedTotalHours,
      estimatedDailyHours: goal.estimatedDailyHours,
      targetIncome: goal.targetIncome,
      currentIncome: goal.currentIncome,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      dimensions: goal.dimensions.map((dimension, index) => ({
        ...dimension,
        id: `metric-${Date.now()}-${index}`,
      })),
      projectBindings: goal.projectBindings.map((project, index) => ({
        ...project,
        id: `${project.id || 'project'}-copy-${Date.now()}-${index}`,
      })),
      theme: { ...goal.theme },
      showInFuture30Chart: goal.showInFuture30Chart,
      relatedDimensions: [...goal.relatedDimensions],
      milestones: goal.milestones ? goal.milestones.map((milestone) => ({ ...milestone })) : [],
      isActive: goal.isActive,
      isCompleted: false,
      completedAt: undefined,
    });

    setSegment(getGoalSegment(duplicatedGoal));
  };

  const handleInjectPreviewGoal = () => {
    const existingPreviewGoal = goals.find((goal) => goal.name === '30天打造穿搭账号增长实验');

    if (existingPreviewGoal) {
      setSelectedGoal(existingPreviewGoal);
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 9);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 21);
    endDate.setHours(0, 0, 0, 0);

    const previewGoal = createGoal({
      name: '30天打造穿搭账号增长实验',
      description: '验证内容产出、发布频次和私域转化是否能形成稳定增长。',
      goalType: 'numeric',
      startDate,
      endDate,
      deadline: endDate,
      estimatedTotalHours: 72,
      targetIncome: 50000,
      currentIncome: 18000,
      dimensions: [
        {
          id: 'preview-posts',
          name: '内容发布',
          unit: '条',
          targetValue: 30,
          currentValue: 12,
          weight: 35,
        },
        {
          id: 'preview-leads',
          name: '私信线索',
          unit: '个',
          targetValue: 80,
          currentValue: 26,
          weight: 40,
        },
        {
          id: 'preview-conversion',
          name: '成交转化',
          unit: '单',
          targetValue: 12,
          currentValue: 4,
          weight: 25,
        },
      ],
      projectBindings: [
        { id: 'preview-project-xhs', name: '小红书账号', color: '#FF5A5F' },
        { id: 'preview-project-wechat', name: '私域跟进', color: '#34C759' },
      ],
      theme: {
        color: '#FF5A5F',
        label: '落日珊瑚',
      },
      showInFuture30Chart: true,
      relatedDimensions: ['preview-posts', 'preview-leads', 'preview-conversion'],
    });

    const seededRecords = [
      {
        taskTitle: '完成3条春季穿搭选题与封面',
        durationMinutes: 150,
        note: '集中完成选题库搭建，并同步产出 3 条可发布内容。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        dimensionResults: [
          { dimensionId: 'preview-posts', dimensionName: '内容发布', unit: '条', value: 3 },
          { dimensionId: 'preview-leads', dimensionName: '私信线索', unit: '个', value: 6 },
        ],
      },
      {
        taskTitle: '梳理拍摄脚本并安排模特试穿',
        durationMinutes: 95,
        note: '提前确定脚本结构，减少正式拍摄返工。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        dimensionResults: [
          { dimensionId: 'preview-posts', dimensionName: '内容发布', unit: '条', value: 1 },
          { dimensionId: 'preview-leads', dimensionName: '私信线索', unit: '个', value: 4 },
        ],
      },
      {
        taskTitle: '直播复盘并优化私信成交话术',
        durationMinutes: 110,
        note: '优化开场钩子和成交问答，转化效率明显提升。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        dimensionResults: [
          { dimensionId: 'preview-leads', dimensionName: '私信线索', unit: '个', value: 8 },
          { dimensionId: 'preview-conversion', dimensionName: '成交转化', unit: '单', value: 2 },
        ],
      },
      {
        taskTitle: '剪出两条短视频并测试新标题模板',
        durationMinutes: 130,
        note: '同一主题测试不同封面和标题，观察点击率。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        dimensionResults: [
          { dimensionId: 'preview-posts', dimensionName: '内容发布', unit: '条', value: 2 },
          { dimensionId: 'preview-leads', dimensionName: '私信线索', unit: '个', value: 5 },
        ],
      },
      {
        taskTitle: '连发2条爆款模版并跟进高意向用户',
        durationMinutes: 180,
        note: '发布节奏稳定，单日新增咨询显著上升。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        dimensionResults: [
          { dimensionId: 'preview-posts', dimensionName: '内容发布', unit: '条', value: 2 },
          { dimensionId: 'preview-leads', dimensionName: '私信线索', unit: '个', value: 12 },
          { dimensionId: 'preview-conversion', dimensionName: '成交转化', unit: '单', value: 1 },
        ],
      },
    ];

    seededRecords.forEach((record) => {
      const inserted = addContributionRecord({
        goalId: previewGoal.id,
        taskTitle: record.taskTitle,
        durationMinutes: record.durationMinutes,
        note: record.note,
        source: 'manual',
        startTime: record.createdAt,
        endTime: new Date(record.createdAt.getTime() + record.durationMinutes * 60000),
        dimensionResults: record.dimensionResults,
      });

      useGoalContributionStore.getState().updateRecord(inserted.id, {
        createdAt: record.createdAt,
        updatedAt: record.createdAt,
      });
    });

    setSegment('active');
    setSelectedGoal(previewGoal);
  };

  const renderGoals = () => (
    <>
      <div className="rounded-[30px] p-4" style={{ backgroundColor: pageSurface, boxShadow: cardShadow }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium" style={{ color: mutedText }}>目标工作台</p>
            <h1 className="mt-1 text-[28px] font-bold tracking-[-0.04em]" style={{ color: pageText }}>目标</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInjectPreviewGoal}
              className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
            >
              <Sparkles className="h-4 w-4" />
              预览
            </button>
            <button
              onClick={() => {
                setEditingGoal(null);
                setShowForm(true);
              }}
              className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: accentBlue, boxShadow: '0 8px 18px rgba(10,132,255,0.22)' }}
              aria-label="新建目标"
            >
              <Plus className="h-5 w-5" />
              新建
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[22px] p-1.5" style={{ backgroundColor: softSurface }}>
          {[
            { key: 'active' as const, label: '目标' },
            { key: 'habit' as const, label: '习惯' },
            { key: 'expired' as const, label: '已过' },
          ].map((item) => {
            const active = segment === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSegment(item.key)}
                className="rounded-[18px] px-3 py-2.5 text-sm font-semibold transition"
                style={{
                  backgroundColor: active ? accentPink : 'transparent',
                  color: active ? '#FFFFFF' : '#8E8E93',
                  boxShadow: active ? activeTabShadow : 'none',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-[22px] p-3" style={{ backgroundColor: softSurface }}>
            <div className="text-xs" style={{ color: mutedText }}>进行中</div>
            <div className="mt-2 text-xl font-semibold" style={{ color: pageText }}>{activeGoals.length}</div>
          </div>
          <div className="rounded-[22px] p-3" style={{ backgroundColor: softSurface }}>
            <div className="text-xs" style={{ color: mutedText }}>总目标数</div>
            <div className="mt-2 text-xl font-semibold" style={{ color: pageText }}>{goals.length}</div>
          </div>
          <div className="rounded-[22px] p-3" style={{ backgroundColor: softSurface }}>
            <div className="text-xs" style={{ color: mutedText }}>预计投入</div>
            <div className="mt-2 text-xl font-semibold" style={{ color: pageText }}>{totalHours}h</div>
          </div>
        </div>

        {linkedGoalId && (
          <div className="mt-4 rounded-[22px] px-4 py-3 text-sm font-medium" style={{ backgroundColor: 'rgba(221,97,124,0.12)', color: accentPink }}>
            当前是跨模块联动打开：已自动高亮对应目标。你可以直接点“去时间轴”为这个目标创建执行任务。
          </div>
        )}
      </div>

      {segment === 'habit' ? (
        <div className="space-y-4">
          <div className="rounded-[30px] p-4" style={{ backgroundColor: pageSurface, boxShadow: cardShadow }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: mutedText }}>目标工作台</p>
                <h2 className="mt-1 text-[28px] font-bold tracking-[-0.04em]" style={{ color: pageText }}>习惯</h2>
                <p className="text-sm mt-1" style={{ color: mutedText }}>
                  {filteredHabits.length} 个习惯
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRuleSettings(true)}
                  className="p-2 rounded-xl transition-all active:scale-95"
                  style={{ backgroundColor: softSurface, color: 'rgba(60, 60, 67, 0.6)' }}
                >
                  <Settings className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowAddHabitModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm shadow-lg transition-all active:scale-95"
                  style={{ backgroundColor: accentGreen, color: '#FFFFFF' }}
                >
                  <Plus className="w-5 h-5" />
                  <span>添加习惯</span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-[22px] p-3" style={{ backgroundColor: softSurface, border: '1px solid rgba(0,0,0,0.04)' }}>
                <div className="text-xs" style={{ color: mutedText }}>进行中</div>
                <div className="mt-2 text-xl font-semibold" style={{ color: pageText }}>{activeHabits.length}</div>
              </div>
              <div className="rounded-[22px] p-3" style={{ backgroundColor: softSurface, border: '1px solid rgba(0,0,0,0.04)' }}>
                <div className="text-xs" style={{ color: mutedText }}>AI 候选</div>
                <div className="mt-2 text-xl font-semibold" style={{ color: pageText }}>{candidates.length}</div>
              </div>
              <div className="rounded-[22px] p-3" style={{ backgroundColor: softSurface, border: '1px solid rgba(0,0,0,0.04)' }}>
                <div className="text-xs" style={{ color: mutedText }}>当前筛选</div>
                <div className="mt-2 text-xl font-semibold" style={{ color: pageText }}>
                  {habitTab === 'all' ? '全部' : habitTab === 'daily' ? '日' : habitTab === 'weekly' ? '周' : '月'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHabitTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all active:scale-95"
                  style={{
                    backgroundColor: habitTab === tab.id ? accentPink : softSurface,
                    color: habitTab === tab.id ? '#FFFFFF' : '#8E8E93',
                    fontWeight: habitTab === tab.id ? 600 : 500,
                    boxShadow: habitTab === tab.id ? activeTabShadow : 'none',
                  }}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {candidates.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="px-1">
                <div className="text-sm font-semibold" style={{ color: mutedText }}>AI 候选</div>
              </div>
              <div className="rounded-[30px] p-4" style={{ backgroundColor: '#FFF5E5', boxShadow: cardShadow }}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5" style={{ color: '#AC0327' }} />
                  <h2 className="font-semibold" style={{ color: pageText }}>AI 发现的习惯候选</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#E8C259', color: '#000000' }}>
                    {candidates.length}
                  </span>
                </div>
                <HabitCandidateList candidates={candidates} />
              </div>
            </motion.div>
          )}

          {filteredHabits.length > 0 ? (
            <div className="space-y-3">
              <div className="px-1">
                <div className="text-sm font-semibold" style={{ color: mutedText }}>习惯列表</div>
              </div>
              <div className="rounded-[30px] p-3" style={{ backgroundColor: pageSurface, boxShadow: cardShadow }}>
                <HabitList
                  habits={filteredHabits}
                  onHabitClick={(habitId) => setSelectedHabitId(habitId)}
                />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[30px] text-center py-20"
              style={{ backgroundColor: pageSurface, boxShadow: cardShadow }}
            >
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: pageText }}>
                还没有习惯
              </h3>
              <p className="mb-6" style={{ color: mutedText }}>
                开始添加你的第一个习惯吧
              </p>
              <button
                onClick={() => setShowAddHabitModal(true)}
                className="px-6 py-3 rounded-full font-semibold text-sm shadow-lg transition-all active:scale-95"
                style={{ backgroundColor: accentGreen, color: '#FFFFFF' }}
              >
                添加习惯
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <div className="px-1">
              <div className="text-sm font-semibold" style={{ color: mutedText }}>{currentGroup.title}</div>
            </div>

            {currentGroup.goals.length === 0 ? (
              <div className="rounded-[30px] px-5 py-8 text-center" style={{ backgroundColor: pageSurface, boxShadow: cardShadow }}>
                <p className="text-base font-medium" style={{ color: pageText }}>{currentGroup.emptyText}</p>
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setShowForm(true);
                  }}
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition active:scale-95"
                  style={{ backgroundColor: accentBlue, boxShadow: '0 8px 18px rgba(10,132,255,0.22)' }}
                >
                  <Plus className="h-4 w-4" /> 创建目标
                </button>
              </div>
            ) : (
              currentGroup.goals.map((goal) => {
                const progress = getGoalProgress(goal);
                return (
                  <div
                    key={goal.id}
                    className="rounded-[30px] px-4 py-4 cursor-pointer"
                    style={{ backgroundColor: pageSurface, boxShadow: cardShadow }}
                    onClick={() => setSelectedGoal(goal)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full"
                        style={{ background: `conic-gradient(${goal.theme.color} ${progress * 3.6}deg, #f1f2f6 0deg)` }}
                      >
                        {linkedGoalId === goal.id && (
                          <div
                            className="absolute -right-1 -top-1 rounded-full px-2 py-1 text-[10px] font-black tracking-[0.14em] text-white"
                            style={{ backgroundColor: '#111827' }}
                          >
                            联动焦点
                          </div>
                        )}
                        <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-white text-xs font-semibold text-[#111827]">
                          {progress}%
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="line-clamp-2 text-[20px] font-semibold leading-[1.2] tracking-[-0.03em]" style={{ color: pageText }}>
                              {goal.name}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: mutedText }}>
                              <CalendarDays className="h-4 w-4" />
                              <span>{getDateRangeLabel(goal)}</span>
                            </div>
                          </div>
                          <div className="rounded-full px-3 py-1 text-right text-xs font-semibold" style={{
                            color: progress >= 100 ? '#34C759' : progress >= 60 ? accentBlue : '#FF9500',
                            backgroundColor: progress >= 100 ? 'rgba(52,199,89,0.12)' : progress >= 60 ? 'rgba(10,132,255,0.12)' : 'rgba(255,149,0,0.12)',
                          }}>
                            {getDeadlineLabel(goal)}
                          </div>
                        </div>

                        <div className="mt-3 rounded-[22px] px-3 py-3" style={{ backgroundColor: softSurface, border: '1px solid rgba(0,0,0,0.04)' }}>
                          {linkedGoalId === goal.id && (
                            <div
                              className="mb-3 rounded-[16px] px-3 py-2 text-xs font-semibold"
                              style={{ backgroundColor: `${goal.theme.color}14`, color: goal.theme.color }}
                            >
                              这是总部刚刚点名的目标，建议先点进去看分析，再回时间轴执行。
                            </div>
                          )}
                          {linkedGoalId === goal.id && accountabilitySummary.length > 0 && (
                            <div className="mb-3 rounded-[16px] border border-[#fecaca] bg-[#fff1f2] px-3 py-3 text-xs text-[#9f1239]">
                              <div className="font-semibold">总部最近捕捉到的追责信息</div>
                              <div className="mt-2 space-y-1.5">
                                {accountabilitySummary.map((item, idx) => (
                                  <div key={`${goal.id}-reflection-${idx}`}>• {item}</div>
                                ))}
                              </div>
                              {activeLoop?.taskTitle && (
                                <div className="mt-2 rounded-[12px] bg-white/70 px-3 py-2 text-[11px] font-semibold text-[#7f1d1d]">
                                  当前联动任务：{activeLoop.taskTitle}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ color: mutedText }}>当前进度</span>
                            <span style={{ color: pageText }}>
                              {goal.dimensions.length > 0
                                ? `${goal.dimensions.filter((item) => item.currentValue > 0).length}/${goal.dimensions.length} 个维度推进中`
                                : `${goal.currentValue} / ${goal.targetValue || 0} ${goal.unit || ''}`}
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: goal.theme.color }} />
                          </div>
                          {goal.projectBindings.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {goal.projectBindings.slice(0, 2).map((project) => (
                                <span
                                  key={project.id}
                                  className="rounded-full px-2 py-1 text-xs font-medium"
                                  style={{ backgroundColor: `${project.color || goal.theme.color}18`, color: project.color || goal.theme.color }}
                                >
                                  {project.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          eventBus.emit('dashboard:navigate-module', {
                            module: 'timeline',
                            goalId: goal.id,
                            openComposer: 'task',
                            taskDraft: {
                              title: `${goal.name} · `,
                              taskType: 'work',
                              durationMinutes: 60,
                              longTermGoals: { [goal.id]: 100 },
                              tags: [goal.name],
                            },
                          });
                        }}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white transition active:scale-95"
                        style={{ backgroundColor: '#111827', boxShadow: '0 8px 18px rgba(17,24,39,0.22)' }}
                        aria-label="去时间轴创建任务"
                      >
                        <Plus className="h-4 w-4" />
                        去时间轴
                      </button>
                      {linkedGoalId === goal.id && activeLoop?.taskId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            eventBus.emit('dashboard:navigate-module', {
                              module: 'timeline',
                              goalId: goal.id,
                              taskId: activeLoop.taskId,
                              openComposer: 'goalContribution',
                            });
                          }}
                          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white transition active:scale-95"
                          style={{ backgroundColor: '#9f1239', boxShadow: '0 8px 18px rgba(159,18,57,0.22)' }}
                          aria-label="填写目标贡献"
                        >
                          <TrendingUp className="h-4 w-4" />
                          填写贡献
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGoal(goal);
                        }}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white transition active:scale-95"
                        style={{ backgroundColor: accentBlue, boxShadow: '0 8px 18px rgba(10,132,255,0.22)' }}
                        aria-label="编辑目标"
                      >
                        <Pencil className="h-4 w-4" />
                        编辑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateGoal(goal);
                        }}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white transition active:scale-95"
                        style={{ backgroundColor: accentPurple, boxShadow: '0 8px 18px rgba(139,92,246,0.22)' }}
                        aria-label="复制目标"
                      >
                        <Copy className="h-4 w-4" />
                        复制
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGoal(goal.id);
                        }}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white transition active:scale-95"
                        style={{ backgroundColor: accentDanger, boxShadow: '0 8px 18px rgba(255,90,122,0.22)' }}
                        aria-label="删除目标"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-[30px] p-4" style={{ backgroundColor: pageSurface, boxShadow: cardShadow }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: pageText }}>目标分析入口</div>
                <div className="mt-1 text-sm" style={{ color: mutedText }}>
                  已接入时间轴关键结果与目标分析图表，可继续补强整改推进面板。
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111827] text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {activeLoop?.goalId && accountabilitySummary.length > 0 && (
              <div className="mt-4 rounded-[22px] border border-[#fecaca] bg-[#fff1f2] p-4">
                <div className="text-sm font-semibold" style={{ color: '#9f1239' }}>总部联动摘要已回流到目标侧</div>
                <div className="mt-2 space-y-2 text-sm" style={{ color: '#7f1d1d' }}>
                  {accountabilitySummary.slice(0, 2).map((item, idx) => (
                    <div key={`goal-home-loop-summary-${idx}`}>• {item}</div>
                  ))}
                </div>
                <div className="mt-3 text-xs" style={{ color: '#9f1239' }}>
                  进入某个目标后，可以继续看该任务的 KR、追责记录、趋势图和收入映射。
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeLoop.taskId ? (
                    <button
                      type="button"
                      onClick={() => {
                        eventBus.emit('dashboard:navigate-module', {
                          module: 'timeline',
                          goalId: activeLoop.goalId,
                          taskId: activeLoop.taskId,
                          openComposer: 'goalContribution',
                        });
                      }}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white transition active:scale-95"
                      style={{ backgroundColor: '#9f1239', boxShadow: '0 8px 18px rgba(159,18,57,0.22)' }}
                    >
                      <TrendingUp className="h-4 w-4" />
                      去填写这次贡献
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        eventBus.emit('dashboard:navigate-module', {
                          module: 'timeline',
                          goalId: activeLoop.goalId,
                          openComposer: 'task',
                          taskDraft: {
                            title: `${activeLoop.goalName || 'HQ整改'} · 整改任务`,
                            taskType: 'work',
                            durationMinutes: 60,
                            longTermGoals: activeLoop.goalId ? { [activeLoop.goalId]: 100 } : {},
                            tags: Array.from(new Set([activeLoop.goalName || '', '总部整改'].filter(Boolean))),
                          },
                        });
                      }}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white transition active:scale-95"
                      style={{ backgroundColor: '#111827', boxShadow: '0 8px 18px rgba(17,24,39,0.22)' }}
                    >
                      <Plus className="h-4 w-4" />
                      去建整改任务
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-[22px] p-4" style={{ backgroundColor: softSurface }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: mutedText }}>当前可用能力</span>
                <span style={{ color: '#34C759' }}>已接入时间轴贡献分析</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: pageText }}>
                <li className="flex items-center justify-between"><span>总部点名目标自动聚焦</span><ChevronRight className="h-4 w-4" /></li>
                <li className="flex items-center justify-between"><span>时间轴 KR 自动沉淀到目标分析</span><ChevronRight className="h-4 w-4" /></li>
                <li className="flex items-center justify-between"><span>趋势图 / 投产比 / 关键结果编辑</span><ChevronRight className="h-4 w-4" /></li>
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );

  if (showForm) {
    return (
      <GoalForm
        initialData={normalizeFormData(editingGoal)}
        dimensions={[
          { id: 'growth', name: '成长', icon: '🌱', color: '#34C759' },
          { id: 'career', name: '事业', icon: '💼', color: '#0A84FF' },
          { id: 'health', name: '健康', icon: '💪', color: '#FF9F0A' },
          { id: 'creation', name: '创作', icon: '🎨', color: '#BF5AF2' },
        ]}
        onSave={handleSaveGoal}
        onCancel={() => {
          setEditingGoal(null);
          setShowForm(false);
        }}
        bgColor={bgColor}
      />
    );
  }

  if (selectedGoal) {
    return (
      <GoalAnalyticsView
        goal={selectedGoal}
        onBack={() => setSelectedGoal(null)}
      />
    );
  }

  return (
    <div
      className="min-h-full px-4 pb-8 pt-5"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #121315 0%, #18191d 38%, #1d1f24 100%)'
          : 'linear-gradient(180deg, #f5f5f7 0%, #efeff4 48%, #ececf2 100%)',
      }}
    >
      <div className="mx-auto max-w-xl space-y-4">
        {renderGoals()}
      </div>

      <AddHabitModal
        open={showAddHabitModal}
        onClose={() => setShowAddHabitModal(false)}
      />

      {selectedHabitId && (
        <HabitDetailModal
          habitId={selectedHabitId}
          open={!!selectedHabitId}
          onClose={() => setSelectedHabitId(null)}
        />
      )}

      <HabitRuleSettingsModal
        open={showRuleSettings}
        onClose={() => setShowRuleSettings(false)}
      />
    </div>
  );
}
