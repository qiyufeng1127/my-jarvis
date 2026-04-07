import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronRight, Clock3, Copy, Pencil, Plus, Sparkles, Target, Trash2, TrendingUp } from 'lucide-react';
import eventBus from '@/utils/eventBus';
import { useGoalStore } from '@/stores/goalStore';
import { useGoalContributionStore } from '@/stores/goalContributionStore';
import { useHQBridgeStore } from '@/stores/hqBridgeStore';
import { useTaskStore } from '@/stores/taskStore';
import GoalAnalyticsView from '@/components/goals/GoalAnalyticsView';
import GoalForm, { type GoalFormData } from '@/components/growth/GoalForm';
import type { LongTermGoal } from '@/types';

interface GoalHomeViewProps {
  isDark?: boolean;
  bgColor?: string;
}

type GoalSegment = 'active' | 'planned' | 'expired';

type LoopStage = 'locked' | 'goal' | 'task' | 'kr' | 'done';

interface GoalCardGroup {
  key: GoalSegment;
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

function getGoalSegment(goal: LongTermGoal): GoalSegment {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (goal.isCompleted) {
    return 'expired';
  }

  if (goal.startDate) {
    const startDate = new Date(goal.startDate);
    startDate.setHours(0, 0, 0, 0);
    if (startDate > today) {
      return 'planned';
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
    const elapsedDays = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    if (diffDays > 0 && elapsedDays > 0) return `已过 ${elapsedDays} 天`;
  }

  if (diffDays === 0) return '今天结束';
  if (diffDays < 0) return `已经 ${Math.abs(diffDays)} 天`;
  return `剩余 ${diffDays} 天`;
}

function formatLoopDate(value?: string) {
  if (!value) return '刚刚同步';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚同步';
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getLoopStage(goal: LongTermGoal | null, taskStatus?: string, hasContribution?: boolean): LoopStage {
  if (taskStatus === 'completed') return 'done';
  if (hasContribution) return 'kr';
  if (taskStatus) return 'task';
  if (goal) return 'goal';
  return 'locked';
}

function getLoopStageMeta(stage: LoopStage) {
  if (stage === 'done') {
    return { label: '已执行收口', accent: '#34C759', description: '总部整改动作已经完成，这轮闭环已经真正落地。' };
  }
  if (stage === 'kr') {
    return { label: '已补关键结果', accent: '#14b8a6', description: '时间轴产出已经写回目标，当前主要看是否完成最终收口。' };
  }
  if (stage === 'task') {
    return { label: '已排入时间轴', accent: '#8b5cf6', description: '整改动作已经进入时间轴，现在最重要的是按时执行并补 KR。' };
  }
  if (stage === 'goal') {
    return { label: '已挂整改目标', accent: '#0A84FF', description: '总部已经点名并挂上目标，下一步要把整改动作真正排进时间轴。' };
  }
  return { label: '仅总部锁题', accent: '#FF9500', description: '问题已经被总部锁定，但还没有形成完整整改闭环。' };
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
  const { goals, loadGoals, createGoal, updateGoal, deleteGoal } = useGoalStore();
  const addContributionRecord = useGoalContributionStore((state) => state.addRecord);
  const activeLoop = useHQBridgeStore((state) => state.activeLoop);
  const tasks = useTaskStore((state) => state.tasks);
  const [segment, setSegment] = useState<GoalSegment>('active');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LongTermGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<LongTermGoal | null>(null);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    const handleNavigate = (payload?: { module?: string; goalId?: string; action?: 'view' | 'edit' }) => {
      if (payload?.module && payload.module !== 'goals') return;
      if (!payload?.goalId) return;

      setLinkedGoalId(payload.goalId);
      const matchedGoal = useGoalStore.getState().goals.find((goal) => goal.id === payload.goalId)
        || (activeLoop?.goalId === payload.goalId ? goals.find((goal) => goal.id === activeLoop.goalId) : undefined);
      if (!matchedGoal) return;

      if (payload.action === 'edit') {
        setSelectedGoal(null);
        setEditingGoal(matchedGoal);
        setShowForm(true);
        return;
      }

      setSelectedGoal(matchedGoal);
    };

    eventBus.on('dashboard:navigate-module', handleNavigate);
    return () => {
      eventBus.off('dashboard:navigate-module', handleNavigate);
    };
  }, [activeLoop?.goalId, goals]);

  const activeGoals = useMemo(() => goals.filter((goal) => getGoalSegment(goal) === 'active'), [goals]);
  const plannedGoals = useMemo(() => goals.filter((goal) => getGoalSegment(goal) === 'planned'), [goals]);
  const expiredGoals = useMemo(() => goals.filter((goal) => getGoalSegment(goal) === 'expired'), [goals]);
  const loopGoal = useMemo(() => {
    if (!activeLoop?.goalId) return null;
    return goals.find((goal) => goal.id === activeLoop.goalId) || null;
  }, [activeLoop?.goalId, goals]);
  const loopTask = useMemo(() => {
    if (!activeLoop?.taskId) return null;
    return tasks.find((task) => task.id === activeLoop.taskId) || null;
  }, [activeLoop?.taskId, tasks]);
  const loopHasContribution = useMemo(() => {
    if (!activeLoop?.goalId || !activeLoop?.taskId) return false;
    return useGoalContributionStore.getState().records.some((record) => record.goalId === activeLoop.goalId && record.taskId === activeLoop.taskId);
  }, [activeLoop?.goalId, activeLoop?.taskId]);
  const loopStage = getLoopStage(loopGoal, loopTask?.status, loopHasContribution);
  const loopStageMeta = getLoopStageMeta(loopStage);

  const groupedGoals: GoalCardGroup[] = [
    { key: 'active', title: '正在进行', emptyText: '还没有正在推进的目标，先创建一个开始吧。', goals: activeGoals },
    { key: 'planned', title: '尚未开始', emptyText: '暂无待开始目标。', goals: plannedGoals },
    { key: 'expired', title: '已经过去', emptyText: '暂无已过期或已归档目标。', goals: expiredGoals },
  ];

  const currentGroup = groupedGoals.find((group) => group.key === segment) ?? groupedGoals[0];
  const totalHours = Math.round(goals.reduce((sum, goal) => sum + (goal.estimatedTotalHours || 0), 0) * 10) / 10;

  const handleSaveGoal = (formData: GoalFormData) => {
    const payload = {
      name: formData.name,
      description: formData.description,
      goalType: formData.type,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      deadline: formData.endDate ? new Date(formData.endDate) : undefined,
      estimatedTotalHours: formData.estimatedTotalHours,
      targetIncome: formData.targetIncome,
      dimensions: formData.dimensions,
      projectBindings: formData.projectBindings,
      theme: formData.theme,
      showInFuture30Chart: formData.showInFuture30Chart,
      relatedDimensions: formData.relatedDimensions,
      targetValue: formData.dimensions.reduce((sum, item) => sum + item.targetValue, 0),
      currentValue: formData.dimensions.reduce((sum, item) => sum + item.currentValue, 0),
      unit: formData.dimensions[0]?.unit || '',
    };

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

  const handleOpenLoopGoal = () => {
    if (!loopGoal) return;
    setLinkedGoalId(loopGoal.id);
    setSelectedGoal(loopGoal);
  };

  const handleNavigateLoopTask = () => {
    if (!activeLoop?.taskId) return;
    eventBus.emit('dashboard:navigate-module', {
      module: 'timeline',
      taskId: activeLoop.taskId,
    });
  };

  const handleNavigateHQ = () => {
    eventBus.emit('dashboard:navigate-module', {
      module: 'memory',
      goalId: activeLoop?.goalId,
      taskId: activeLoop?.taskId,
    });
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

  const surface = isDark ? 'rgba(28, 28, 30, 0.94)' : 'rgba(255,255,255,0.96)';
  const subSurface = isDark ? 'rgba(44, 44, 46, 0.92)' : 'rgba(244, 244, 248, 0.95)';
  const textPrimary = isDark ? '#f7f7fa' : '#141414';
  const textSecondary = isDark ? 'rgba(247,247,250,0.68)' : 'rgba(20,20,20,0.55)';

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
        <div className="rounded-[30px] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]" style={{ background: surface }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: textSecondary }}>目标工作台</p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.04em]" style={{ color: textPrimary }}>目标</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInjectPreviewGoal}
                className="flex h-10 items-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.22)] transition active:scale-95"
              >
                <Sparkles className="h-4 w-4" /> 预览
              </button>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowForm(true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A84FF] text-white shadow-[0_12px_24px_rgba(10,132,255,0.3)] transition active:scale-95"
                aria-label="新建目标"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {activeLoop && (
            <div
              className="mb-4 overflow-hidden rounded-[28px] border"
              style={{
                background: 'linear-gradient(135deg, rgba(17,24,39,0.98), rgba(37,99,235,0.94) 55%, rgba(20,184,166,0.88))',
                borderColor: 'rgba(255,255,255,0.14)',
                boxShadow: '0 18px 36px rgba(15,23,42,0.16)',
              }}
            >
              <div className="px-4 py-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black tracking-[0.24em] text-white/70">RECTIFICATION LOOP</div>
                    <div className="mt-1 text-[22px] font-semibold tracking-[-0.04em]">整改推进面板</div>
                    <div className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-black"
                      style={{ backgroundColor: `${loopStageMeta.accent}33`, color: '#ffffff' }}
                    >
                      {loopStageMeta.label}
                    </div>
                  </div>
                  <div className="rounded-[18px] border px-3 py-2 text-right" style={{ borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="text-[11px] text-white/65">最近同步</div>
                    <div className="mt-1 text-sm font-semibold text-white">{formatLoopDate(activeLoop.lastUpdatedAt)}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                    <Target className="h-4 w-4" /> 总部锁定问题
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{activeLoop.painLabel || '整改主线待确认'}</div>
                  <div className="mt-2 text-sm leading-6 text-white/72">{loopStageMeta.description}</div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] px-4 py-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="text-xs font-semibold text-white/62">整改目标</div>
                    <div className="mt-2 text-sm font-semibold text-white">{activeLoop.goalName || '尚未挂载目标'}</div>
                    <div className="mt-2 text-xs text-white/65">{loopGoal ? `当前进度 ${getGoalProgress(loopGoal)}%` : '等待总部挂到目标组件'}</div>
                  </div>
                  <div className="rounded-[20px] px-4 py-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="text-xs font-semibold text-white/62">整改任务</div>
                    <div className="mt-2 text-sm font-semibold text-white">{activeLoop.taskTitle || '尚未排入时间轴'}</div>
                    <div className="mt-2 text-xs text-white/65">{loopTask?.scheduledStart ? `计划 ${new Date(loopTask.scheduledStart).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}` : '等待形成动作安排'}</div>
                  </div>
                  <div className="rounded-[20px] px-4 py-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="text-xs font-semibold text-white/62">执行状态</div>
                    <div className="mt-2 text-sm font-semibold text-white">{loopTask?.status === 'completed' ? '已完成' : loopTask?.status === 'in_progress' ? '执行中' : loopHasContribution ? '已补 KR' : loopTask ? '待执行' : '未安排'}</div>
                    <div className="mt-2 text-xs text-white/65">{loopHasContribution ? '关键结果已沉淀到目标分析' : '完成后记得补 KR，避免只做不收口'}</div>
                  </div>
                </div>

                <div className="mt-3 rounded-[22px] px-4 py-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                    <Clock3 className="h-4 w-4" /> 最近承诺
                  </div>
                  <div className="mt-2 text-sm leading-6 text-white/78">
                    {activeLoop.promise || '这轮整改还没有沉淀出明确承诺文案。'}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleOpenLoopGoal}
                    disabled={!loopGoal}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition active:scale-95 disabled:opacity-45"
                  >
                    查看目标分析 <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNavigateLoopTask}
                    disabled={!activeLoop.taskId}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-45"
                    style={{ borderColor: 'rgba(255,255,255,0.24)', backgroundColor: 'rgba(255,255,255,0.06)' }}
                  >
                    去时间轴执行 <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNavigateHQ}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
                    style={{ borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'transparent' }}
                  >
                    回总部复盘 <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 rounded-[22px] p-1" style={{ background: subSurface }}>
            {groupedGoals.map((group) => {
              const active = segment === group.key;
              return (
                <button
                  key={group.key}
                  onClick={() => setSegment(group.key)}
                  className="rounded-[18px] px-3 py-2 text-sm font-medium transition"
                  style={{
                    color: active ? '#111827' : textSecondary,
                    background: active ? '#ffffff' : 'transparent',
                    boxShadow: active ? '0 8px 18px rgba(15,23,42,0.08)' : 'none',
                  }}
                >
                  {group.key === 'active' ? '目标' : group.key === 'planned' ? '习惯' : '已过'}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[22px] p-3" style={{ background: subSurface }}>
              <div className="text-xs" style={{ color: textSecondary }}>进行中</div>
              <div className="mt-2 text-xl font-semibold" style={{ color: textPrimary }}>{activeGoals.length}</div>
            </div>
            <div className="rounded-[22px] p-3" style={{ background: subSurface }}>
              <div className="text-xs" style={{ color: textSecondary }}>总目标数</div>
              <div className="mt-2 text-xl font-semibold" style={{ color: textPrimary }}>{goals.length}</div>
            </div>
            <div className="rounded-[22px] p-3" style={{ background: subSurface }}>
              <div className="text-xs" style={{ color: textSecondary }}>预计投入</div>
              <div className="mt-2 text-xl font-semibold" style={{ color: textPrimary }}>{totalHours}h</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="px-1">
            <div className="text-sm font-semibold" style={{ color: textSecondary }}>{currentGroup.title}</div>
          </div>

          {currentGroup.goals.length === 0 ? (
            <div className="rounded-[28px] px-5 py-8 text-center" style={{ background: surface }}>
              <p className="text-base font-medium" style={{ color: textPrimary }}>{currentGroup.emptyText}</p>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowForm(true);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0A84FF] px-4 py-2 text-sm font-medium text-white transition active:scale-95"
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
                  className="rounded-[30px] px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] cursor-pointer"
                  style={{ background: surface }}
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
                          <h3 className="line-clamp-2 text-[20px] font-semibold leading-[1.2] tracking-[-0.03em]" style={{ color: textPrimary }}>
                            {goal.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: textSecondary }}>
                            <CalendarDays className="h-4 w-4" />
                            <span>{getDateRangeLabel(goal)}</span>
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold" style={{ color: progress >= 100 ? '#34C759' : progress >= 60 ? '#0A84FF' : '#FF9500' }}>
                          {getDeadlineLabel(goal)}
                        </div>
                      </div>

                      <div className="mt-3 rounded-[18px] px-3 py-3" style={{ background: subSurface }}>
                        {linkedGoalId === goal.id && (
                          <div
                            className="mb-3 rounded-[16px] px-3 py-2 text-xs font-semibold"
                            style={{ backgroundColor: `${goal.theme.color}14`, color: goal.theme.color }}
                          >
                            这是总部刚刚点名的目标，建议先点进去看分析，再回时间轴执行。
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: textSecondary }}>当前进度</span>
                          <span style={{ color: textPrimary }}>
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

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGoal(goal);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A84FF] text-white transition active:scale-95"
                      aria-label="编辑目标"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateGoal(goal);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8b5cf6] text-white transition active:scale-95"
                      aria-label="复制目标"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGoal(goal.id);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff2d55] text-white transition active:scale-95"
                      aria-label="删除目标"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-[30px] p-4" style={{ background: surface }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: textPrimary }}>目标分析入口</div>
              <div className="mt-1 text-sm" style={{ color: textSecondary }}>
                已接入时间轴关键结果与目标分析图表，可继续补强整改推进面板。
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111827] text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 rounded-[22px] p-4" style={{ background: subSurface }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: textSecondary }}>当前可用能力</span>
              <span style={{ color: '#34C759' }}>已接入时间轴贡献分析</span>
            </div>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: textPrimary }}>
              <li className="flex items-center justify-between"><span>总部点名目标自动聚焦</span><ChevronRight className="h-4 w-4" /></li>
              <li className="flex items-center justify-between"><span>时间轴 KR 自动沉淀到目标分析</span><ChevronRight className="h-4 w-4" /></li>
              <li className="flex items-center justify-between"><span>趋势图 / 投产比 / 关键结果编辑</span><ChevronRight className="h-4 w-4" /></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
