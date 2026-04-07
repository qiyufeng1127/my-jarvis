import { useEffect, useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import eventBus from '@/utils/eventBus';
import { useGoalStore } from '@/stores/goalStore';
import { useTaskStore } from '@/stores/taskStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { useAIStore } from '@/stores/aiStore';
import AIConfigModal from '@/components/ai/AIConfigModal';

interface PanoramaMemoryProps {
  isDark?: boolean;
  bgColor?: string;
}

type SessionStage = 'loading' | 'stage1' | 'stage2' | 'stage3' | 'report';
type AnswerTone = 'excuse' | 'passive' | 'honest' | 'neutral';

type ChatMessage = {
  id: string;
  role: 'ai' | 'user';
  content: string;
  stage?: SessionStage;
};

type SessionState = {
  stage: SessionStage;
  messages: ChatMessage[];
  userAnswers: string[];
  sessionDate: string;
  commitmentSyncResult?: CommitmentSyncResult | null;
};

type HQReportSummary = {
  rootCause: string;
  promise: string;
  issueLevel: string;
  praise: string;
  penalty: string;
};

type RadarDatum = {
  subject: string;
  value: number;
  fullMark: number;
};

type PainFocus = {
  source: 'goal' | 'timeline' | 'mixed';
  label: string;
  detail: string;
  question: string;
};

type CommitmentPlan = {
  goalName: string;
  goalDescription: string;
  taskTitle: string;
  taskDescription: string;
  deadlineDays: number;
  durationMinutes: number;
};

type CommitmentSyncResult = {
  goalId: string;
  taskId: string;
  goalName: string;
  taskTitle: string;
};

type SampleStatus = {
  isEnough: boolean;
  reason: string;
  hint: string;
};

type HQReportData = {
  now: Date;
  yearGoalName: string;
  yearlyGoalValue: number;
  yearlyCurrentValue: number;
  yearlyRate: number;
  monthGoalValue: number;
  monthCurrentValue: number;
  monthRate: number;
  monthGap: number;
  weekTaskCount: number;
  completedWeek: number;
  todayTaskCount: number;
  completedToday: number;
  delayedTasks: any[];
  delayedTaskNames: string[];
  procrastinationCount: number;
  lowEfficiencyCount: number;
  monthIncome: number;
  activeSideHustles: number;
  delaySeverity: 'light' | 'medium' | 'heavy';
  painFocus: PainFocus;
  goalSummary: {
    total: number;
    active: number;
    completed: number;
    weakGoalNames: string[];
  };
  timelineSummary: {
    totalTasks: number;
    completedTasks: number;
    timeoutTaskNames: string[];
    lowEfficiencyTaskNames: string[];
    delayedTaskNames: string[];
    recentCompletedTaskNames: string[];
    upcomingTaskNames: string[];
  };
  painPoints: string[];
  sampleStatus: SampleStatus;
};

type QuickBridgeCard = {
  id: string;
  title: string;
  subtitle: string;
  metric: string;
  detail: string;
  accent: string;
  module: 'memory' | 'goals' | 'timeline';
  event: 'dashboard:navigate-module';
  payload: {
    module: 'memory' | 'goals' | 'timeline';
    goalId?: string;
    taskId?: string;
  };
};

const STORAGE_KEY = 'hq-report-session-v1';

export default function PanoramaMemory({ bgColor = '#ffffff' }: PanoramaMemoryProps) {
  const goals = useGoalStore((state) => state.goals);
  const createGoal = useGoalStore((state) => state.createGoal);
  const tasks = useTaskStore((state) => state.tasks);
  const createTask = useTaskStore((state) => state.createTask);
  const sideHustles = useSideHustleStore((state) => state.sideHustles);
  const incomeRecords = useSideHustleStore((state) => state.incomeRecords);
  const timeRecords = useSideHustleStore((state) => state.timeRecords);
  const { isConfigured, chat } = useAIStore();

  const [stage, setStage] = useState<SessionStage>('loading');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [reportSummary, setReportSummary] = useState<HQReportSummary | null>(null);
  const [commitmentSyncResult, setCommitmentSyncResult] = useState<CommitmentSyncResult | null>(null);

  const reportData = useMemo<HQReportData>(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeGoals = goals.filter((goal) => goal.isActive && !goal.isCompleted);
    const completedGoals = goals.filter((goal) => goal.isCompleted);
    const yearGoal = activeGoals[0];

    const monthGoals = activeGoals.filter((goal) => {
      if (!goal.deadline) return false;
      const deadline = new Date(goal.deadline);
      return deadline.getFullYear() === now.getFullYear() && deadline.getMonth() === now.getMonth();
    });

    const weekTasks = tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      const date = new Date(task.scheduledStart);
      return date >= weekStart;
    });

    const todayTasks = tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      const date = new Date(task.scheduledStart);
      return date >= todayStart;
    });

    const completedTasks = tasks.filter((task) => task.status === 'completed');
    const completedToday = todayTasks.filter((task) => task.status === 'completed').length;
    const completedWeek = weekTasks.filter((task) => task.status === 'completed').length;

    const delayedTasks = tasks.filter((task) => {
      if (!task.scheduledEnd) return false;
      return task.status !== 'completed' && new Date(task.scheduledEnd) < now;
    });

    const lowEfficiencyTasks = tasks.filter(
      (task) => typeof task.completionEfficiency === 'number' && task.completionEfficiency < 60
    );
    const timeoutTasks = tasks.filter(
      (task) => (task.startTimeoutCount || 0) > 0 || (task.completeTimeoutCount || 0) > 0
    );
    const plannedTasks = tasks
      .filter((task) => task.scheduledStart)
      .sort(
        (a, b) =>
          new Date(a.scheduledStart as Date).getTime() - new Date(b.scheduledStart as Date).getTime()
      );

    const procrastinationCount = tasks.reduce(
      (sum, task) => sum + (task.startTimeoutCount || 0) + (task.completeTimeoutCount || 0),
      0
    );

    const lowEfficiencyCount = lowEfficiencyTasks.length;

    const monthIncome = incomeRecords
      .filter((record) => new Date(record.date) >= monthStart)
      .reduce((sum, record) => sum + record.amount, 0);

    const yearlyGoalValue = yearGoal?.targetValue || 0;
    const yearlyCurrentValue = yearGoal?.currentValue || 0;
    const yearlyRate = yearlyGoalValue > 0 ? (yearlyCurrentValue / yearlyGoalValue) * 100 : 0;

    const monthGoalValue = monthGoals.reduce((sum, goal) => sum + (goal.targetValue || 0), 0);
    const monthCurrentValue = monthGoals.reduce((sum, goal) => sum + (goal.currentValue || 0), 0);
    const monthRate = monthGoalValue > 0 ? (monthCurrentValue / monthGoalValue) * 100 : 0;
    const monthGap = Math.max(monthGoalValue - monthCurrentValue, 0);

    const delayedTaskNames = delayedTasks.slice(0, 5).map((task) => task.title);
    const weakGoalNames = monthGoals
      .filter((goal) => {
        const target = goal.targetValue || 0;
        if (target <= 0) return false;
        return ((goal.currentValue || 0) / target) * 100 < 60;
      })
      .slice(0, 5)
      .map((goal) => goal.name);
    const recentCompletedTaskNames = completedTasks.slice(-5).reverse().map((task) => task.title);
    const timeoutTaskNames = timeoutTasks.slice(0, 5).map((task) => task.title);
    const lowEfficiencyTaskNames = lowEfficiencyTasks.slice(0, 5).map((task) => task.title);
    const upcomingTaskNames = plannedTasks
      .filter((task) => new Date(task.scheduledStart as Date) >= now)
      .slice(0, 5)
      .map((task) => task.title);

    const painPoints: string[] = [];
    if (delayedTasks.length > 0) painPoints.push(`有 ${delayedTasks.length} 个滞后任务未收口`);
    if (procrastinationCount > 0) painPoints.push(`累计拖延/超时 ${procrastinationCount} 次`);
    if (lowEfficiencyCount > 0) painPoints.push(`存在 ${lowEfficiencyCount} 个低效率任务`);
    if (monthGap > 0) painPoints.push(`月度目标仍有 ${monthGap} 的进度缺口`);
    if (weakGoalNames.length > 0) painPoints.push(`目标推进偏弱：${weakGoalNames.join('、')}`);
    if (painPoints.length === 0) painPoints.push('当前未发现明显硬伤，但需要继续观察执行稳定性');

    const delaySeverity: 'light' | 'medium' | 'heavy' =
      procrastinationCount >= 5 || delayedTasks.length >= 2
        ? 'heavy'
        : procrastinationCount >= 3 || delayedTasks.length >= 1
          ? 'medium'
          : 'light';

    const goalPainScore = Math.round(monthGap + weakGoalNames.length * 18 + Math.max(0, 60 - monthRate));
    const timelinePainScore = Math.round(
      delayedTasks.length * 30 + procrastinationCount * 12 + lowEfficiencyCount * 15
    );

    const painFocus =
      goalPainScore === 0 && timelinePainScore === 0
        ? {
            source: 'mixed' as const,
            label: '执行稳定性',
            detail: '目标和时间轴暂时没有明显硬伤，但持续性还没有经过足够样本验证。',
            question: '现在数据看起来不算难看，但你最容易在哪个环节开始松掉？',
          }
        : goalPainScore >= timelinePainScore
          ? {
              source: 'goal' as const,
              label: '目标推进失焦',
              detail: `月度目标缺口 ${monthGap}，推进偏弱目标 ${weakGoalNames.join('、') || '暂无'}。`,
              question: `总部现在盯住的是目标推进失焦：月度还差 ${monthGap}，偏弱目标是 ${weakGoalNames.join('、') || '暂无'}。你为什么一直没有把主线目标往前推？`,
            }
          : {
              source: 'timeline' as const,
              label: '时间轴执行失控',
              detail: `滞后任务 ${delayedTaskNames.join('、') || '暂无'}；拖延/超时 ${procrastinationCount} 次；低效率 ${lowEfficiencyCount} 次。`,
              question: `总部现在盯住的是时间轴执行失控：滞后任务 ${delayedTaskNames.join('、') || '暂无'}，拖延/超时 ${procrastinationCount} 次，低效率 ${lowEfficiencyCount} 次。你为什么会连续把任务执行搞成这样？`,
            };

    const sampleStatus = getSampleStatus({
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      scheduledTasks: plannedTasks.length,
      activeGoals: activeGoals.length,
      completedWeek,
    });

    return {
      now,
      yearGoalName: yearGoal?.name || '暂无年度主线目标',
      yearlyGoalValue,
      yearlyCurrentValue,
      yearlyRate,
      monthGoalValue,
      monthCurrentValue,
      monthRate,
      monthGap,
      weekTaskCount: weekTasks.length,
      completedWeek,
      todayTaskCount: todayTasks.length,
      completedToday,
      delayedTasks,
      delayedTaskNames,
      procrastinationCount,
      lowEfficiencyCount,
      monthIncome,
      activeSideHustles: sideHustles.filter((item) => item.status !== 'archived').length,
      delaySeverity,
      painFocus,
      goalSummary: {
        total: goals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        weakGoalNames,
      },
      timelineSummary: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        timeoutTaskNames,
        lowEfficiencyTaskNames,
        delayedTaskNames,
        recentCompletedTaskNames,
        upcomingTaskNames,
      },
      painPoints,
      sampleStatus,
    };
  }, [goals, incomeRecords, sideHustles, tasks]);

  const baseFirstQuestion = useMemo(() => {
    if (!reportData.sampleStatus.isEnough) {
      return `【AI总部】
先停一下，这轮我不准备追着你问。

现在样本还不够，没资格下结论，更不该乱点名任务。
${reportData.sampleStatus.reason}。
${reportData.sampleStatus.hint}`;
    }

    const weakGoalsText = reportData.goalSummary.weakGoalNames.length
      ? reportData.goalSummary.weakGoalNames.join('、')
      : '暂无明显掉队目标';
    const delayedTasksText = reportData.timelineSummary.delayedTaskNames.length
      ? reportData.timelineSummary.delayedTaskNames.join('、')
      : '暂无滞后任务';

    const focusSourceLabel =
      reportData.painFocus.source === 'goal'
        ? '目标组件'
        : reportData.painFocus.source === 'timeline'
          ? '时间轴组件'
          : '目标和时间轴';

    return `【AI总部】
先说结论：这次最严重的问题不在态度口号，在${focusSourceLabel}。

目标：月进度 ${reportData.monthRate.toFixed(2)}%，偏弱目标 ${weakGoalsText}。
时间轴：拖延/超时 ${reportData.procrastinationCount} 次，滞后任务 ${delayedTasksText}。

最刺眼的是：${reportData.painFocus.label}。
${reportData.painFocus.question}`;
  }, [reportData]);

  const radarMetrics = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === 'completed');
    const timedTasks = tasks.filter((task) => task.scheduledStart && task.scheduledEnd);
    const totalGoals = goals.length;
    const completedGoals = goals.filter((goal) => goal.isCompleted).length;
    const activeGoals = goals.filter((goal) => goal.isActive && !goal.isCompleted).length;
    const totalIncomeRecords = incomeRecords.length;
    const totalIncome = incomeRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalSideHustleHours = timeRecords.reduce((sum, record) => sum + record.duration, 0);

    const healthTasks = completedTasks.filter((task) => task.taskType === 'health').length;
    const studyTasks = completedTasks.filter((task) => task.taskType === 'study').length;
    const creativeTasks = completedTasks.filter((task) => task.taskType === 'creative').length;
    const workTasks = completedTasks.filter((task) => task.taskType === 'work' || task.taskType === 'finance').length;
    const lifeTasks = completedTasks.filter((task) => task.taskType === 'life').length;
    const restTasks = completedTasks.filter((task) => task.taskType === 'rest').length;

    const avgEfficiency = completedTasks.length
      ? completedTasks.reduce((sum, task) => sum + (task.completionEfficiency ?? 0), 0) / completedTasks.length
      : 0;

    const onTimeCompleted = completedTasks.filter((task) => {
      if (!task.scheduledEnd || !task.actualEnd) return false;
      return new Date(task.actualEnd) <= new Date(task.scheduledEnd);
    }).length;

    const positiveRadarData: RadarDatum[] = [
      {
        subject: '健康',
        value: clampRadarScore(healthTasks * 12 + restTasks * 4),
        fullMark: 100,
      },
      {
        subject: '学习力',
        value: clampRadarScore(studyTasks * 14 + activeGoals * 6),
        fullMark: 100,
      },
      {
        subject: '赚钱能力',
        value: clampRadarScore(totalIncomeRecords * 18 + totalIncome / 50),
        fullMark: 100,
      },
      {
        subject: '执行力',
        value: clampRadarScore(completedTasks.length * 8 + onTimeCompleted * 6 + avgEfficiency * 0.2),
        fullMark: 100,
      },
      {
        subject: '专注力',
        value: clampRadarScore(timedTasks.length * 6 + avgEfficiency * 0.35),
        fullMark: 100,
      },
      {
        subject: '创造力',
        value: clampRadarScore(creativeTasks * 18),
        fullMark: 100,
      },
      {
        subject: '社交力',
        value: clampRadarScore(lifeTasks * 10 + sideHustles.length * 5),
        fullMark: 100,
      },
      {
        subject: '情绪管理',
        value: clampRadarScore(restTasks * 15 + Math.max(0, 100 - reportData.procrastinationCount * 8 - reportData.lowEfficiencyCount * 6) * 0.3),
        fullMark: 100,
      },
    ];

    const negativeRadarData: RadarDatum[] = [
      {
        subject: '拖延',
        value: clampRadarScore(reportData.procrastinationCount * 15),
        fullMark: 100,
      },
      {
        subject: '焦虑',
        value: clampRadarScore(reportData.delayedTasks.length * 18 + reportData.monthGap / 20),
        fullMark: 100,
      },
      {
        subject: '分心',
        value: clampRadarScore(Math.max(0, timedTasks.length - completedTasks.length) * 10 + reportData.lowEfficiencyCount * 10),
        fullMark: 100,
      },
      {
        subject: '完美主义',
        value: clampRadarScore(activeGoals * 8 + Math.max(0, totalGoals - completedGoals) * 6),
        fullMark: 100,
      },
      {
        subject: '自我怀疑',
        value: clampRadarScore(Math.max(0, totalGoals - completedGoals) * 10),
        fullMark: 100,
      },
      {
        subject: '逃避',
        value: clampRadarScore(reportData.delayedTasks.length * 16 + reportData.procrastinationCount * 6),
        fullMark: 100,
      },
      {
        subject: '冲动',
        value: clampRadarScore(reportData.lowEfficiencyCount * 12),
        fullMark: 100,
      },
      {
        subject: '消极',
        value: clampRadarScore(Math.max(0, totalSideHustleHours === 0 ? 10 : 0) + Math.max(0, completedTasks.length === 0 ? 20 : 0) + Math.max(0, totalIncome === 0 ? 10 : 0)),
        fullMark: 100,
      },
    ];

    return { positiveRadarData, negativeRadarData };
  }, [goals, incomeRecords, reportData, sideHustles.length, tasks, timeRecords]);


  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const todayKey = toDateKey(new Date());

      if (raw) {
        const saved = JSON.parse(raw) as SessionState;
        if (saved.sessionDate === todayKey) {
          setStage(saved.stage);
          setMessages(saved.messages || []);
          setUserAnswers(saved.userAnswers || []);
          setCommitmentSyncResult(saved.commitmentSyncResult || null);
          setIsHydrated(true);
          return;
        }
      }
    } catch (error) {
      console.error('恢复总部述职会话失败:', error);
    }

    setIsHydrated(true);
  }, []);

  const fallbackSummary = useMemo<HQReportSummary>(() => {
    const focusSourceLabel =
      reportData.painFocus.source === 'goal'
        ? '目标组件'
        : reportData.painFocus.source === 'timeline'
          ? '时间轴组件'
          : '目标组件与时间轴组件交叉链路';

    const issueLevel =
      reportData.delaySeverity === 'heavy'
        ? '重点整改'
        : reportData.delaySeverity === 'medium'
          ? '限期修正'
          : '轻提醒';

    return {
      rootCause:
        reportData.painFocus.source === 'goal'
          ? `当前主要问题出在${focusSourceLabel}，主线目标没有被持续顶住，导致推进节奏失焦。`
          : reportData.painFocus.source === 'timeline'
            ? `当前主要问题出在${focusSourceLabel}，任务执行出现拖延、滞后与低效叠加，节奏已经失控。`
            : `当前问题不是单点异常，而是${focusSourceLabel}同时失真：目标没盯紧，时间轴也没守住。`,
      promise:
        reportData.painFocus.source === 'goal'
          ? '重新锁定月度主线目标，每天先推进最关键目标，再处理次要事项。'
          : reportData.painFocus.source === 'timeline'
            ? '先清掉滞后任务，每天只盯最关键执行项，按时间轴收口，不再拖到下一天。'
            : '同时收紧目标与时间轴：先定唯一主线，再按时间块执行并当天复盘。',
      issueLevel,
      praise:
        reportData.painPoints.length === 1
          ? '总部评价：问题集中，说明还有快速收拢的空间。'
          : '总部评价：问题已经暴露，但至少真实数据足够完整，可以直接定位。',
      penalty:
        issueLevel === '重点整改'
          ? '总部处分：本周必须优先处理主抓矛盾，禁止继续分散精力。'
          : issueLevel === '限期修正'
            ? '总部要求：三天内看到改善动作，否则异常等级上调。'
            : '总部提醒：别因为暂时不严重就放松，继续盯执行稳定性。',
    };
  }, [reportData]);

  useEffect(() => {
    if (!isHydrated) return;
    if (messages.length > 0) return;

    const loadingTimer = window.setTimeout(async () => {
      const firstMessage = await generateOpeningMessage(baseFirstQuestion, reportData, isConfigured(), chat);
      setMessages([{ id: 'ai-stage1', role: 'ai', content: firstMessage, stage: 'stage1' }]);
      setStage('stage1');
    }, 1400);

    return () => window.clearTimeout(loadingTimer);
  }, [baseFirstQuestion, chat, isConfigured, isHydrated, messages.length, reportData]);

  useEffect(() => {
    if (!isHydrated) return;

    const session: SessionState = {
      stage,
      messages,
      userAnswers,
      sessionDate: toDateKey(new Date()),
      commitmentSyncResult,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('保存总部述职会话失败:', error);
    }
  }, [isHydrated, messages, stage, userAnswers, commitmentSyncResult]);

  const conversationAssessment = useMemo(() => assessConversation(userAnswers), [userAnswers]);

  useEffect(() => {
    if (stage !== 'report') {
      setReportSummary(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      const summary = await generateReportSummary(reportData, userAnswers, fallbackSummary, isConfigured(), chat);
      if (!cancelled) {
        setReportSummary(summary);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [chat, fallbackSummary, isConfigured, reportData, stage, userAnswers]);

  const answerTone = useMemo(() => {
    const latest = userAnswers[userAnswers.length - 1] || '';
    return analyzeTone(latest);
  }, [userAnswers]);

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStage('loading');
    setInputValue('');
    setMessages([]);
    setUserAnswers([]);
    setReportSummary(null);
    setCommitmentSyncResult(null);
  };

  const handleSubmit = async () => {
    const value = inputValue.trim();
    if (!value || isSubmitting || stage === 'loading' || stage === 'report' || !reportData.sampleStatus.isEnough) return;

    if (!isConfigured()) {
      setShowConfigModal(true);
    }

    setIsSubmitting(true);

    const currentStage = stage;
    const nextAnswers = [...userAnswers, value];

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: value,
      stage: currentStage,
    };

    setUserAnswers(nextAnswers);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    const assessment = assessConversation(nextAnswers);
    const resolved = isConversationResolved(nextAnswers, assessment);

    const aiReply = await generateStageReply({
      currentStage,
      answer: value,
      answers: nextAnswers,
      reportData,
      isAIEnabled: isConfigured(),
      chat,
      resolved,
      assessment,
    });

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: aiReply,
      stage: currentStage,
    };

    setMessages((prev) => [...prev, aiMessage]);

    if (resolved) {
      const syncResult = await syncCommitmentPlan({
        answers: nextAnswers,
        reportData,
        goals,
        createGoal,
        createTask,
      });
      setCommitmentSyncResult(syncResult);
      setStage('report');
    }

    setIsSubmitting(false);
  };

  const currentSummary = reportSummary || fallbackSummary;
  const ringPercent = Math.max(0, Math.min(100, Number(reportData.monthRate.toFixed(0))));
  const reportTitle = `【${reportData.now.getFullYear()}年${reportData.now.getMonth() + 1}月${reportData.now.getDate()}日】AI总部述职报告`;
  const linkedCommitmentTask = useMemo(() => {
    if (commitmentSyncResult?.taskId) {
      return tasks.find((task) => task.id === commitmentSyncResult.taskId) || null;
    }
    return tasks.find((task) => (task.tags || []).includes('总部承诺')) || null;
  }, [commitmentSyncResult, tasks]);
  const isCommitmentTaskCompleted = linkedCommitmentTask?.status === 'completed';
  const quickBridgeCards = useMemo<QuickBridgeCard[]>(() => {
    const topGoal = goals.find((goal) => goal.isActive && !goal.isCompleted) || goals[0];
    const topTask = linkedCommitmentTask || reportData.delayedTasks[0] || tasks.find((task) => task.status !== 'completed') || tasks[0];
    const promiseText = currentSummary.promise || reportData.painFocus.detail;

    return [
      {
        id: 'memory-bridge',
        title: '总部结论',
        subtitle: reportData.painFocus.label,
        metric: conversationAssessment.resolved ? '已形成承诺' : '继续追问中',
        detail: promiseText,
        accent: '#23160d',
        module: 'memory',
        event: 'dashboard:navigate-module',
        payload: { module: 'memory', goalId: commitmentSyncResult?.goalId, taskId: commitmentSyncResult?.taskId },
      },
      {
        id: 'goal-bridge',
        title: '目标落点',
        subtitle: topGoal?.name || '等待导入整改目标',
        metric: topGoal ? `${Math.round(((topGoal.targetValue || 0) > 0 ? ((topGoal.currentValue || 0) / (topGoal.targetValue || 1)) * 100 : 0))}%` : `${reportData.monthRate.toFixed(0)}%`,
        detail: topGoal ? `进度 ${topGoal.currentValue}/${topGoal.targetValue || 0}${topGoal.unit || ''}` : `月度缺口 ${reportData.monthGap}`,
        accent: '#0f766e',
        module: 'goals',
        event: 'dashboard:navigate-module',
        payload: { module: 'goals', goalId: commitmentSyncResult?.goalId || topGoal?.id },
      },
      {
        id: 'timeline-bridge',
        title: '时间轴动作',
        subtitle: topTask?.title || commitmentSyncResult?.taskTitle || '等待生成整改动作',
        metric: isCommitmentTaskCompleted ? '已收口' : topTask?.scheduledStart ? formatDate(new Date(topTask.scheduledStart)) : '待安排',
        detail: isCommitmentTaskCompleted
          ? '总部整改动作已经完成，这一轮闭环已真正落地。'
          : topTask?.scheduledStart
            ? `计划 ${formatTimeLabel(new Date(topTask.scheduledStart))} 开始`
            : '还没有可执行时间块',
        accent: '#8b5cf6',
        module: 'timeline',
        event: 'dashboard:navigate-module',
        payload: { module: 'timeline', taskId: commitmentSyncResult?.taskId || topTask?.id },
      },
    ];
  }, [commitmentSyncResult, conversationAssessment.resolved, currentSummary.promise, goals, isCommitmentTaskCompleted, linkedCommitmentTask, reportData, tasks]);
  const loopStatusCards = useMemo(() => {
    const hasCommitment = userAnswers.length > 0;
    const linkedGoal = commitmentSyncResult?.goalId
      ? goals.find((goal) => goal.id === commitmentSyncResult.goalId)
      : goals.find((goal) => goal.name.includes('总部整改'));
    const hasGoalLinked = Boolean(linkedGoal);
    const hasTaskLinked = Boolean(linkedCommitmentTask);

    return [
      {
        id: 'hq',
        label: '总部锁定问题',
        done: stage !== 'loading',
        hint: reportData.painFocus.label,
      },
      {
        id: 'commitment',
        label: '形成整改承诺',
        done: hasCommitment,
        hint: hasCommitment ? `${userAnswers.length} 轮问答` : '等待问答',
      },
      {
        id: 'goal',
        label: '导入目标组件',
        done: hasGoalLinked,
        hint: hasGoalLinked ? linkedGoal?.name || '已挂到目标' : '尚未挂载',
      },
      {
        id: 'timeline',
        label: '安排时间轴动作',
        done: hasTaskLinked,
        hint: hasTaskLinked
          ? `${linkedCommitmentTask?.title || '已进入时间轴'}${isCommitmentTaskCompleted ? ' · 已完成' : ''}`
          : '尚未安排',
      },
      {
        id: 'done',
        label: '执行并收口',
        done: Boolean(isCommitmentTaskCompleted),
        hint: isCommitmentTaskCompleted ? '总部整改动作已完成' : '等待执行',
      },
    ];
  }, [commitmentSyncResult, goals, isCommitmentTaskCompleted, linkedCommitmentTask, reportData.painFocus.label, stage, userAnswers.length]);
  
  return (
    <>
      <div
        className="h-full overflow-auto"
        style={{
          background: 'linear-gradient(180deg, #f4efe4 0%, #efe7d6 46%, #e8dfcd 100%)',
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-6">
          <div
            className="mb-4 rounded-[28px] border px-5 py-5 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(246,240,229,0.96))',
              borderColor: 'rgba(86, 62, 39, 0.12)',
              boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 text-xs font-bold tracking-[0.28em]" style={{ color: '#8c6a43' }}>
                  AI HEADQUARTERS
                </div>
                <h1 className="text-2xl font-black md:text-3xl" style={{ color: '#23160d' }}>
                  AI总部述职
                </h1>
                <p className="mt-2 text-sm leading-6" style={{ color: '#6b5642' }}>
                  严肃核查、逐项追问、自动出具述职报告。总部只看结果，不听借口。
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div
                  className="rounded-2xl px-4 py-3 text-right"
                  style={{ backgroundColor: '#23160d', color: '#f3eadb' }}
                >
                  <div className="text-[11px] tracking-[0.18em] opacity-70">当前阶段</div>
                  <div className="mt-1 text-sm font-bold">
                    {stage === 'loading' && '数据核查'}
                    {stage === 'stage1' && '阶段一｜数据对齐'}
                    {stage === 'stage2' && '阶段二｜问题深挖'}
                    {stage === 'stage3' && '阶段三｜整改确认'}
                    {stage === 'report' && '述职报告'}
                  </div>
                </div>
        <button
                  onClick={handleReset}
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: '#e9dcc8', color: '#5e4326' }}
                >
                  重开本轮述职
        </button>
              </div>
            </div>
          </div>

          {!isConfigured() && (
            <div
              className="mb-4 flex items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
              style={{ backgroundColor: '#fff4e7', borderColor: '#e7c79d' }}
            >
              <div>
                <div className="text-sm font-black" style={{ color: '#6d4823' }}>
                  当前尚未启用网站 AI Key
                </div>
                <div className="text-xs" style={{ color: '#8a6540' }}>
                  现在会先走本地兜底逻辑；配置后，总部述职会直接接入站内 AI。
                </div>
              </div>
        <button
                onClick={() => setShowConfigModal(true)}
                className="rounded-full px-4 py-2 text-sm font-bold"
                style={{ backgroundColor: '#23160d', color: '#f7efe1' }}
              >
                配置 AI Key
        </button>
      </div>
          )}

          {stage === 'loading' && (
            <div
              className="rounded-[28px] border px-6 py-10 text-center"
              style={{
                background: 'rgba(255,255,255,0.9)',
                borderColor: 'rgba(86, 62, 39, 0.12)',
                boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
              }}
            >
              <div className="mx-auto mb-5 h-14 w-14 animate-pulse rounded-full" style={{ backgroundColor: '#23160d' }} />
              <div className="text-lg font-black" style={{ color: '#23160d' }}>
                总部正在全自动核查你的全量数据，请勿退出...
          </div>
              <div className="mt-3 text-sm" style={{ color: '#7a6654' }}>
                正在遍历目标、时间轴、历史任务与收益数据
              </div>
            </div>
          )}

          {stage !== 'loading' && (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div
                className="rounded-[28px] border p-4 md:p-5"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  borderColor: 'rgba(86, 62, 39, 0.12)',
                  boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-lg" style={{ color: '#23160d' }}>
                    总部问答记录
                  </h2>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: '#ede1cd', color: '#6b4b29' }}>
                    {isConfigured() ? '已接入网站 AI' : '本地兜底'}
                  </span>
      </div>

                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6"
                        style={{
                          backgroundColor: message.role === 'ai' ? '#f0ece3' : '#23160d',
                          color: message.role === 'ai' ? '#23160d' : '#f7efe1',
                          border: message.role === 'ai' ? '1px solid rgba(86, 62, 39, 0.12)' : 'none',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {message.role === 'ai' && (
                          <div className="mb-1 text-[11px] font-black tracking-[0.18em]" style={{ color: '#8b6740' }}>
                            AI总部
    </div>
                        )}
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                {stage !== 'report' && (
                  <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(86, 62, 39, 0.12)' }}>
                    {!reportData.sampleStatus.isEnough && (
                      <div
                        className="mb-3 rounded-[18px] border px-4 py-3 text-sm leading-6"
                        style={{
                          backgroundColor: '#fff4e7',
                          borderColor: '#e7c79d',
                          color: '#6d4823',
                        }}
                      >
                        样本不足，先别汇报。{reportData.sampleStatus.reason}。{reportData.sampleStatus.hint}
                      </div>
                    )}
                    <textarea
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      placeholder={reportData.sampleStatus.isEnough ? '直接回答，不要绕。' : '样本不足时无需作答，先去完成任务。'}
                      disabled={!reportData.sampleStatus.isEnough}
                      className="min-h-[108px] w-full resize-none rounded-[20px] border px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        backgroundColor: '#fcfaf6',
                        borderColor: 'rgba(86, 62, 39, 0.16)',
                        color: '#23160d',
                      }}
                    />
        <button
                      onClick={handleSubmit}
                      disabled={!reportData.sampleStatus.isEnough || !inputValue.trim() || isSubmitting}
                      className="mt-3 w-full rounded-[18px] px-4 py-3 text-sm font-black transition-opacity"
                      style={{
                        backgroundColor: '#23160d',
                        color: '#f7efe1',
                        opacity: !reportData.sampleStatus.isEnough || !inputValue.trim() || isSubmitting ? 0.5 : 1,
                      }}
                    >
                      {reportData.sampleStatus.isEnough ? (isSubmitting ? '总部生成中...' : '提交回答') : '样本不足，先去执行'}
        </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div
                  className="rounded-[28px] border p-4 md:p-5"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    borderColor: 'rgba(86, 62, 39, 0.12)',
                    boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
                  }}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black" style={{ color: '#23160d' }}>
                        闭环进度时间轴
                      </div>
                      <div className="mt-1 text-xs leading-5" style={{ color: '#7a6654' }}>
                        从总部发现问题，到挂目标、排时间、真正执行，当前走到了哪一步，一屏就能看懂。
                      </div>
                    </div>
                    <div className="rounded-full px-3 py-1 text-[11px] font-black tracking-[0.16em]" style={{ backgroundColor: '#f2e8d9', color: '#8b6740' }}>
                      可视化闭环
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {loopStatusCards.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black"
                            style={{
                              backgroundColor: item.done ? '#23160d' : '#eadfcd',
                              color: item.done ? '#f7efe1' : '#8b6740',
                            }}
                          >
                            {index + 1}
                          </div>
                          {index < loopStatusCards.length - 1 && (
                            <div
                              className="mt-2 w-[2px] flex-1 rounded-full"
                              style={{ backgroundColor: item.done ? 'rgba(35,22,13,0.26)' : 'rgba(139,103,64,0.18)', minHeight: 34 }}
                            />
                          )}
                        </div>
                        <div
                          className="flex-1 rounded-[20px] border px-4 py-3"
                          style={{
                            backgroundColor: item.done ? '#fcf8f1' : '#f6efe4',
                            borderColor: item.done ? 'rgba(35,22,13,0.12)' : 'rgba(139,103,64,0.10)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-black" style={{ color: '#23160d' }}>{item.label}</div>
                            <div
                              className="rounded-full px-3 py-1 text-[11px] font-black"
                              style={{
                                backgroundColor: item.done ? 'rgba(35,22,13,0.08)' : 'rgba(139,103,64,0.08)',
                                color: item.done ? '#23160d' : '#8b6740',
                              }}
                            >
                              {item.done ? '已完成' : '待推进'}
                            </div>
                          </div>
                          <div className="mt-2 text-xs leading-5" style={{ color: '#6b5642' }}>
                            {item.hint}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[28px] border p-4 md:p-5"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    borderColor: 'rgba(86, 62, 39, 0.12)',
                    boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
                  }}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black" style={{ color: '#23160d' }}>
                        总部-目标-时间轴联动
                      </div>
                      <div className="mt-1 text-xs leading-5" style={{ color: '#7a6654' }}>
                        一眼看到总部结论、落地目标、执行时间块。点哪张卡，就跳哪一个模块继续处理。
                      </div>
                    </div>
                    <div className="rounded-full px-3 py-1 text-[11px] font-black tracking-[0.16em]" style={{ backgroundColor: '#efe4d3', color: '#6a4a2d' }}>
                      快速闭环
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {quickBridgeCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => eventBus.emit(card.event, card.payload)}
                        className="rounded-[22px] border px-4 py-4 text-left transition-transform duration-150 hover:-translate-y-[2px]"
                        style={{
                          background: `linear-gradient(135deg, ${card.accent}14, rgba(255,255,255,0.94))`,
                          borderColor: `${card.accent}33`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black" style={{ color: '#23160d' }}>{card.title}</div>
                            <div className="mt-1 text-sm" style={{ color: '#6b5642' }}>{card.subtitle}</div>
                          </div>
                          <div
                            className="rounded-full px-3 py-1 text-xs font-black"
                            style={{ backgroundColor: `${card.accent}22`, color: card.accent }}
                          >
                            {card.metric}
                          </div>
                        </div>
                        <div className="mt-3 text-sm leading-6" style={{ color: '#4d3927' }}>
                          {card.detail}
                        </div>
                        <div className="mt-3 text-xs font-bold tracking-[0.16em]" style={{ color: card.accent }}>
                          点击直达 {card.module === 'memory' ? '总部' : card.module === 'goals' ? '目标' : '时间轴'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[28px] border p-4 md:p-5"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    borderColor: 'rgba(86, 62, 39, 0.12)',
                    boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
                  }}
                >
                  <div className="mb-3 text-base font-black" style={{ color: '#23160d' }}>
                    自动核查数据板
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <MetricCard label="年度目标完成率" value={`${reportData.yearlyRate.toFixed(2)}%`} />
                    <MetricCard label="月度目标完成率" value={`${reportData.monthRate.toFixed(2)}%`} />
                    <MetricCard label="拖延次数" value={`${reportData.procrastinationCount}`} warning />
                    <MetricCard label="低效率次数" value={`${reportData.lowEfficiencyCount}`} warning />
                    <MetricCard label="滞后任务" value={`${reportData.delayedTasks.length}`} warning />
                    <MetricCard label="本月收入" value={`${reportData.monthIncome}`} />
                  </div>
                </div>

                <div
                  className="rounded-[28px] border p-4 md:p-5"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    borderColor: 'rgba(86, 62, 39, 0.12)',
                    boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
                  }}
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-base font-black" style={{ color: '#23160d' }}>
                        月度偏离度
                      </div>
                      <div className="mt-1 text-xs" style={{ color: '#7a6654' }}>
                        缺口 {reportData.monthGap} ｜ 滞后任务 {reportData.delayedTaskNames.join('、') || '暂无'}
                      </div>
                    </div>
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-black"
                      style={{
                        background: `conic-gradient(#23160d 0 ${ringPercent}%, #e8dcc8 ${ringPercent}% 100%)`,
                        color: '#23160d',
                      }}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fbf7ef] text-sm">
                        {ringPercent}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm" style={{ color: '#4d3927' }}>
                    <div>年度主线：{reportData.yearGoalName}</div>
                    <div>本周完成：{reportData.completedWeek}/{reportData.weekTaskCount}</div>
                    <div>今日完成：{reportData.completedToday}/{reportData.todayTaskCount}</div>
                    <div>活跃副业：{reportData.activeSideHustles}</div>
                  </div>
                </div>

                <div
                  className="rounded-[28px] border p-4 md:p-5"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    borderColor: 'rgba(86, 62, 39, 0.12)',
                    boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
                  }}
                >
                  <div className="mb-3 text-base font-black" style={{ color: '#23160d' }}>
                    真实数据人格雷达
                  </div>
                  <div className="space-y-5">
                    <RadarPanel
                      title="正向能力"
                      subtitle="所有维度默认从 0 起步，随着真实任务、目标、收益与使用行为累积变化"
                      data={radarMetrics.positiveRadarData}
                      strokeColor="#9aa57c"
                      fillColor="rgba(154, 165, 124, 0.26)"
                      labelColor="#73805b"
                    />
                    <RadarPanel
                      title="待改进行为"
                      subtitle="数值越低越好，持续使用并改善执行习惯后会逐步下降"
                      data={radarMetrics.negativeRadarData}
                      strokeColor="#cf7d69"
                      fillColor="rgba(207, 125, 105, 0.24)"
                      labelColor="#c7654e"
                    />
                  </div>
                </div>

                <div
                  className="rounded-[28px] border p-4 md:p-5"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    borderColor: 'rgba(86, 62, 39, 0.12)',
                    boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
                  }}
                >
                  <div className="mb-3 text-base font-black" style={{ color: '#23160d' }}>
                    述职判断
                  </div>
                  <div className="grid gap-3 text-sm">
                    <JudgeLine label="异常等级" value={severityLabel(reportData.delaySeverity)} />
                    <JudgeLine label="最近回答态度" value={toneLabel(answerTone)} />
                    <JudgeLine label="述职状态" value={reportData.sampleStatus.isEnough ? (conversationAssessment.resolved ? '可以收口' : '继续追问') : '样本不足'} />
                    <JudgeLine label="问答轮次" value={reportData.sampleStatus.isEnough ? `${userAnswers.length} 轮` : '暂不开放'} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === 'report' && (
            <div
              className="mt-4 rounded-[28px] border p-5 md:p-6"
              style={{
                background: 'rgba(255,255,255,0.92)',
                borderColor: 'rgba(86, 62, 39, 0.12)',
                boxShadow: '0 18px 38px rgba(72, 46, 22, 0.08)',
              }}
            >
              <div className="mb-4">
                <div className="text-xs font-bold tracking-[0.2em]" style={{ color: '#8b6740' }}>
                  REPORT GENERATED
                </div>
                <h3 className="mt-2 text-xl font-black md:text-2xl" style={{ color: '#23160d' }}>
                  {reportTitle}
                </h3>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <MetricCard label="月度目标完成率" value={`${reportData.monthRate.toFixed(2)}%`} />
                <MetricCard label="异常总次数" value={`${reportData.procrastinationCount + reportData.lowEfficiencyCount}`} warning />
                <MetricCard label="总部判定" value={currentSummary.issueLevel} warning={currentSummary.issueLevel !== '轻提醒'} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ReportBlock
                  title="核心问题梳理"
                  content={`1. 主要异常：拖延 ${reportData.procrastinationCount} 次，低效率 ${reportData.lowEfficiencyCount} 次。\n2. 滞后任务：${reportData.delayedTaskNames.join('、') || '暂无明显滞后任务'}。\n3. 主观根因：${currentSummary.rootCause}`}
                />
                <ReportBlock
                  title="个人反思与承诺"
                  content={userAnswers.length > 0 ? userAnswers.map((item, index) => `${index + 1}. ${item}`).join('\n') : '本轮尚未形成有效承诺。'}
                />
                <ReportBlock
                  title="后续目标与整改安排"
                  content={`- 月度剩余目标：优先补齐 ${reportData.monthGap} 的进度缺口。\n- 下周核心要求：先清滞后任务，再推进关键目标。\n- 每日执行标准：关键任务优先、当天任务当天清。\n- 本轮整改动作：${currentSummary.promise}${commitmentSyncResult ? `\n- 闭环导入：已自动写入目标「${commitmentSyncResult.goalName}」与时间轴任务「${commitmentSyncResult.taskTitle}」` : ''}`}
                />
                <ReportBlock
                  title="总部评价与奖惩"
                  content={`${currentSummary.praise}\n${currentSummary.penalty}\n奖惩结果：${currentSummary.issueLevel}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <AIConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </>
  );
}

async function generateOpeningMessage(
  fallback: string,
  reportData: HQReportData,
  enabled: boolean,
  chat: ReturnType<typeof useAIStore.getState>['chat']
) {
  if (!reportData.sampleStatus.isEnough) return fallback;
  if (!enabled) return fallback;

  try {
    const response = await chat([
      {
        role: 'system',
        content:
          '你是AI总部督查官。你的话必须像真人，不要像汇报机器人。短句，带情绪，带压迫感，但不能辱骂。开场最多 6 行，每行尽量短。先直接给结论，再点出目标问题和时间轴问题，最后只丢一个最痛的问题。禁止编造业务场景、公司经营数据或不存在的指标。',
      },
      {
        role: 'user',
        content: `请基于以下真实数据生成总部开场述职文案。要求：
1. 必须用【AI总部】开头
2. 总长度控制在 4-6 行，别写成大段汇报
3. 先直接下结论，再各点一句目标组件、时间轴组件
4. 必须明确指出最痛的 1 个问题
5. 末尾只能提 1 个问题
6. 语气要像真人在当场追责，要有情绪和压迫感，但不能辱骂
7. 不要输出 JSON
8. 禁止虚构经营数据、行业数据或企业汇报口径

${buildPromptData(reportData)}`,
      },
    ]);

    if (response.success && response.content) {
      return response.content.trim();
    }
  } catch (error) {
    console.error('生成总部开场失败:', error);
  }

  return fallback;
}

async function generateStageReply({
  currentStage,
  answer,
  answers,
  reportData,
  isAIEnabled,
  chat,
  resolved,
  assessment,
}: {
  currentStage: SessionStage;
  answer: string;
  answers: string[];
  reportData: HQReportData;
  isAIEnabled: boolean;
  chat: ReturnType<typeof useAIStore.getState>['chat'];
  resolved: boolean;
  assessment: ReturnType<typeof assessConversation>;
}) {
  const fallback = getFallbackReply(currentStage, answer, reportData, resolved, assessment);
  if (!reportData.sampleStatus.isEnough) return fallback;
  if (!isAIEnabled) return fallback;

  try {
    const stageInstruction = resolved
      ? '用户已经给出相对完整的根因、动作和时间安排。你现在只做收口：简短确认承诺已经记录，并明确说明总部将把这份承诺写入目标和时间轴。控制在 2 句内，不要再追问。'
      : `用户还没有给出让总部满意的整改闭环。当前评估：根因${assessment.hasRootCause ? '已交代' : '未交代'}，动作${assessment.hasConcreteAction ? '已交代' : '未交代'}，时限${assessment.hasTimeBound ? '已交代' : '未交代'}。你必须继续围绕总部锁定的主抓矛盾追问，直到用户说出明确根因、可执行动作和时间安排。短句，像真人追责。一次只问一个问题，控制在 1-3 句内。`;

    const response = await chat([
      {
        role: 'system',
        content:
          '你是真人式AI总部督查官。必须严格一问一答。禁止一次提多个问题。禁止要求用户计算数据。你可以强硬、失望、压迫，像真人在当场追责，但不能辱骂或做人身攻击。少说废话，少讲总结，优先用短句直接戳痛点。你必须围绕用户真实的目标推进情况、时间轴任务执行情况、拖延/滞后/低效记录来追问，并且必须沿着当前锁定的主抓矛盾连续深挖，禁止跳到不存在的公司经营汇报场景。',
      },
      {
        role: 'user',
        content: `${stageInstruction}\n\n以下是总部从目标组件与时间轴组件提取的真实数据，请严格围绕这些事实追问：\n${buildPromptData(reportData)}\n\n历史回答：\n${answers.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n用户刚刚的新回答：${answer}`,
      },
    ]);

    if (response.success && response.content) {
      return response.content.trim();
    }
  } catch (error) {
    console.error('生成总部追问失败:', error);
  }

  return fallback;
}

async function generateReportSummary(
  reportData: HQReportData,
  userAnswers: string[],
  fallback: HQReportSummary,
  enabled: boolean,
  chat: ReturnType<typeof useAIStore.getState>['chat']
): Promise<HQReportSummary> {
  if (!enabled || userAnswers.length === 0) return fallback;

  try {
    const response = await chat([
      {
        role: 'system',
        content:
          '你是AI总部督查官。请基于目标组件和时间轴组件的真实数据，以及用户述职回答，生成结构化述职报告摘要。必须输出JSON，字段为 rootCause、promise、issueLevel、praise、penalty。禁止编造不存在的业务经营数据。不要输出代码块。',
      },
      {
        role: 'user',
        content: `请根据以下目标组件与时间轴组件的真实数据，以及述职对话生成报告摘要：\n\n数据：\n${buildPromptData(reportData)}\n\n回答：\n${userAnswers.map((item, index) => `${index + 1}. ${item}`).join('\n')}`,
      },
    ]);

    if (response.success && response.content) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          rootCause: parsed.rootCause || fallback.rootCause,
          promise: parsed.promise || fallback.promise,
          issueLevel: parsed.issueLevel || fallback.issueLevel,
          praise: parsed.praise || fallback.praise,
          penalty: parsed.penalty || fallback.penalty,
        };
      }
    }
  } catch (error) {
    console.error('生成总部报告摘要失败:', error);
  }

  return fallback;
}

function getFallbackReply(currentStage: SessionStage, answer: string, reportData: HQReportData, resolved = false, assessment?: ReturnType<typeof assessConversation>) {
  if (!reportData.sampleStatus.isEnough) {
    return `【AI总部】样本还不够，这轮不追问。${reportData.sampleStatus.reason}。${reportData.sampleStatus.hint}`;
  }

  const tone = analyzeTone(answer);
  const focusLabel = reportData.painFocus?.label || '执行异常';

  if (resolved) {
    return '【AI总部】这次答到点上了。你的承诺总部已经记账，接下来会直接写进目标和时间轴，不再只是说说而已。';
  }

  if (assessment && !assessment.hasRootCause) {
    return `【AI总部】你还在绕。问题是“${focusLabel}”，但你没说清根因。别讲结果，直接说你最核心的坏习惯是什么。`;
  }

  if (assessment && !assessment.hasConcreteAction) {
    return `【AI总部】认错没用。现在给动作。你准备怎么改“${focusLabel}”？说能执行的，不要口号。`;
  }

  if (assessment && !assessment.hasTimeBound) {
    return '【AI总部】还差最后一块：时间。你准备从哪天开始、多久内做到、每天什么时候执行？';
  }

  if (currentStage === 'stage1') {
    if (tone === 'excuse') {
      return `【AI总部】别躲。问题已经摆在这了：${focusLabel}。你还在拿环境说事。真正失控的那一下，到底是你哪根弦先松了？`;
    }
    if (tone === 'passive') {
      return `【AI总部】“不知道”最没用。数据都已经砸你脸上了，你还装糊涂？直接说，你是在逃、在懒，还是根本没把这件事当回事？`;
    }
    if (reportData.painFocus?.source === 'goal') {
      return `【AI总部】主线目标都顶不住，你后面再忙都是假忙。${reportData.painFocus.detail} 你到底为什么一直不肯把最重要的事往前推？`;
    }
    if (reportData.painFocus?.source === 'timeline') {
      return `【AI总部】885 次这种级别，已经不是失误，是习惯烂了。${reportData.painFocus.detail} 你到底为什么会把执行放任成这样？`;
    }
    return `【AI总部】目标和时间轴一起失真，这不是一句“状态不好”能带过去的。你就正面回答：你到底为什么会把自己过成这样？`;
  }

  if (currentStage === 'stage2') {
    if (tone === 'excuse') {
      return `【AI总部】还在甩锅？没意义。总部盯的是“${focusLabel}”，不是你的理由。最后问一遍：你最核心的坏习惯，到底是什么？`;
    }
    if (tone === 'passive') {
      return `【AI总部】再敷衍，这轮问答就白做了。现在别讲感受，直接讲动作：接下来七天，你准备怎么把“${focusLabel}”压下去？`;
    }
    if (tone === 'honest') {
      return `【AI总部】这次总算说到点上了。那就别停在认错。接下来七天，你准备用什么硬动作，把这个漏洞堵死？`;
    }
    return `【AI总部】问题已经很清楚了，就是“${focusLabel}”。别再绕。你接下来七天，准备怎么改？`;
  }

  return '【AI总部】行，话记下了。总部开始出报告。';
}

function buildPromptData(reportData: HQReportData) {
  return [
    `日期: ${reportData.now.toISOString()}`,
    `年度主线目标: ${reportData.yearGoalName}`,
    `年度进度: ${reportData.yearlyCurrentValue}/${reportData.yearlyGoalValue}`,
    `月度进度: ${reportData.monthCurrentValue}/${reportData.monthGoalValue}`,
    `月度完成率: ${reportData.monthRate.toFixed(2)}%`,
    `月度缺口: ${reportData.monthGap}`,
    `目标总数: ${reportData.goalSummary.total}`,
    `活跃目标数: ${reportData.goalSummary.active}`,
    `已完成目标数: ${reportData.goalSummary.completed}`,
    `推进偏弱目标: ${reportData.goalSummary.weakGoalNames.join('、') || '无'}`,
    `目标组件痛点评分: ${reportData.painFocus?.source === 'goal' || reportData.painFocus?.source === 'mixed' ? reportData.painFocus.label : '次要矛盾'}`,
    `时间轴总任务数: ${reportData.timelineSummary.totalTasks}`,
    `已完成任务数: ${reportData.timelineSummary.completedTasks}`,
    `本周完成: ${reportData.completedWeek}/${reportData.weekTaskCount}`,
    `今日完成: ${reportData.completedToday}/${reportData.todayTaskCount}`,
    `拖延/超时总次数: ${reportData.procrastinationCount}`,
    `低效率任务数: ${reportData.lowEfficiencyCount}`,
    `滞后任务: ${reportData.timelineSummary.delayedTaskNames.join('、') || '无'}`,
    `超时任务: ${reportData.timelineSummary.timeoutTaskNames.join('、') || '无'}`,
    `低效率任务: ${reportData.timelineSummary.lowEfficiencyTaskNames.join('、') || '无'}`,
    `最近完成任务: ${reportData.timelineSummary.recentCompletedTaskNames.join('、') || '无'}`,
    `接下来任务: ${reportData.timelineSummary.upcomingTaskNames.join('、') || '无'}`,
    `总部判定痛点: ${reportData.painPoints.join('；')}`,
    `当前主抓矛盾来源: ${reportData.painFocus.source}`,
    `当前主抓矛盾标签: ${reportData.painFocus.label}`,
    `当前主抓矛盾说明: ${reportData.painFocus.detail}`,
    `当前主抓问题: ${reportData.painFocus.question}`,
  ].join('\n');
}

function getSampleStatus({
  totalTasks,
  completedTasks,
  scheduledTasks,
  activeGoals,
  completedWeek,
}: {
  totalTasks: number;
  completedTasks: number;
  scheduledTasks: number;
  activeGoals: number;
  completedWeek: number;
}): SampleStatus {
  if (totalTasks < 3) {
    return {
      isEnough: false,
      reason: `当前总任务数只有 ${totalTasks} 条`,
      hint: '先去时间轴补几条真实任务，至少完成 1 条、排好 3 条以上任务，再来总部汇报。',
    };
  }

  if (scheduledTasks < 3) {
    return {
      isEnough: false,
      reason: `当前真正排进时间轴的任务只有 ${scheduledTasks} 条`,
      hint: '先把任务排进时间轴，形成连续样本，再来让总部判断。',
    };
  }

  if (completedTasks < 1 && completedWeek < 1) {
    return {
      isEnough: false,
      reason: '这周还没有足够的已完成任务记录',
      hint: '先完成至少 1 条真实任务，再回来汇报，不然总部只会看到空数据。',
    };
  }

  if (activeGoals < 1) {
    return {
      isEnough: false,
      reason: '当前没有正在推进的目标',
      hint: '先去目标组件挂上主线目标，再回来做总部述职。',
    };
  }

  return {
    isEnough: true,
    reason: '样本充足',
    hint: '可以开始总部问答。',
  };
}

function RadarPanel({
  title,
  subtitle,
  data,
  strokeColor,
  fillColor,
  labelColor,
}: {
  title: string;
  subtitle: string;
  data: RadarDatum[];
  strokeColor: string;
  fillColor: string;
  labelColor: string;
}) {
  return (
    <div className="rounded-[24px] px-3 py-4" style={{ backgroundColor: '#f7f2e8' }}>
      <div className="mb-1 text-sm font-black" style={{ color: '#23160d' }}>
        {title}
      </div>
      <div className="mb-3 text-xs leading-5" style={{ color: '#7a6654' }}>
        {subtitle}
      </div>
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="67%">
            <PolarGrid stroke="rgba(112, 90, 64, 0.16)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#5d4734', fontSize: 12, fontWeight: 700 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke={strokeColor}
              fill={fillColor}
              fillOpacity={1}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {data.map((item) => (
          <div key={item.subject} className="flex items-center justify-between rounded-2xl px-3 py-2" style={{ backgroundColor: '#fcfaf6' }}>
            <span style={{ color: '#7a6654' }}>{item.subject}</span>
            <span className="font-black" style={{ color: labelColor }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div
      className="rounded-[20px] px-4 py-4"
      style={{
        backgroundColor: warning ? '#f6e2d6' : '#f4eee5',
        border: '1px solid rgba(86, 62, 39, 0.08)',
      }}
    >
      <div className="text-xs font-bold" style={{ color: '#8b6740' }}>
        {label}
      </div>
      <div className="mt-2 text-xl font-black" style={{ color: '#23160d' }}>
        {value}
      </div>
    </div>
  );
}

function ReportBlock({ title, content }: { title: string; content: string }) {
  return (
    <div
      className="rounded-[22px] px-4 py-4"
      style={{
        backgroundColor: '#f7f1e8',
        border: '1px solid rgba(86, 62, 39, 0.08)',
      }}
    >
      <div className="mb-2 text-sm font-black" style={{ color: '#23160d' }}>
        {title}
      </div>
      <div className="whitespace-pre-wrap text-sm leading-6" style={{ color: '#4d3927' }}>
        {content}
      </div>
    </div>
  );
}

function JudgeLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: '#f6efe4' }}>
      <span style={{ color: '#7c654d' }}>{label}</span>
      <span className="font-black" style={{ color: '#23160d' }}>{value}</span>
    </div>
  );
}

function clampRadarScore(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function analyzeTone(answer: string): AnswerTone {
  const normalized = answer.trim();
  if (!normalized) return 'neutral';
  if (/太忙|没时间|忘了|不小心|外界|干扰|任务难|事情多/.test(normalized)) return 'excuse';
  if (/不知道|改不了|没办法|就这样|随便|无所谓/.test(normalized)) return 'passive';
  if (/我拖延|我逃避|我自律差|是我的问题|我没执行|我没盯住/.test(normalized)) return 'honest';
  return 'neutral';
}

function assessConversation(answers: string[]) {
  const merged = answers.join(' ');
  const hasRootCause = /因为|根因|问题在于|我就是|我总是|习惯|逃避|拖延|懒|害怕|分心|松懈|自律差/.test(merged);
  const hasConcreteAction = /每天|立刻|先|马上|固定|减少|只做|清掉|安排|执行|闹钟|复盘|记录|限制|关闭|专注/.test(merged);
  const hasTimeBound = /今天|明天|本周|下周|七天|7天|每天|早上|晚上|\\d+天|\\d+点|周一|周二|周三|周四|周五|周六|周日/.test(merged);
  return {
    hasRootCause,
    hasConcreteAction,
    hasTimeBound,
    resolved: hasRootCause && hasConcreteAction && hasTimeBound,
  };
}

function isConversationResolved(answers: string[], assessment = assessConversation(answers)) {
  return answers.length >= 2 && assessment.resolved;
}

async function syncCommitmentPlan({
  answers,
  reportData,
  goals,
  createGoal,
  createTask,
}: {
  answers: string[];
  reportData: HQReportData;
  goals: ReturnType<typeof useGoalStore.getState>['goals'];
  createGoal: ReturnType<typeof useGoalStore.getState>['createGoal'];
  createTask: ReturnType<typeof useTaskStore.getState>['createTask'];
}): Promise<CommitmentSyncResult | null> {
  try {
    const plan = buildCommitmentPlan(answers, reportData);
    const matchedGoal = goals.find((goal) => goal.name === plan.goalName);

    const goal = matchedGoal || createGoal({
      name: plan.goalName,
      description: plan.goalDescription,
      goalType: 'milestone',
      targetValue: 1,
      currentValue: 0,
      unit: '次',
      startDate: new Date(),
      deadline: addDays(new Date(), plan.deadlineDays),
      estimatedTotalHours: Math.max(1, Math.ceil(plan.durationMinutes / 60)),
      estimatedDailyHours: Math.max(0.5, Number((plan.durationMinutes / 60).toFixed(1))),
      dimensions: [],
      projectBindings: [],
      relatedDimensions: [],
      milestones: [
        {
          id: `milestone-${Date.now()}`,
          name: plan.taskTitle,
          targetValue: 1,
          isReached: false,
        },
      ],
    });

    const taskStart = nextMorningAtNine();
    const taskEnd = new Date(taskStart.getTime() + plan.durationMinutes * 60 * 1000);

    const task = await createTask({
      title: plan.taskTitle,
      description: plan.taskDescription,
      taskType: reportData.painFocus.source === 'goal' ? 'study' : 'work',
      priority: 1,
      durationMinutes: plan.durationMinutes,
      scheduledStart: taskStart,
      scheduledEnd: taskEnd,
      longTermGoals: { [goal.id]: 100 },
      tags: ['总部承诺', reportData.painFocus.label],
      status: 'scheduled',
    });

    return {
      goalId: goal.id,
      taskId: task.id,
      goalName: goal.name,
      taskTitle: task.title,
    };
  } catch (error) {
    console.error('同步总部承诺失败:', error);
    return null;
  }
}

function buildCommitmentPlan(answers: string[], reportData: HQReportData): CommitmentPlan {
  const latestAnswer = answers[answers.length - 1] || '';
  const focusLabel = reportData.painFocus?.label || '执行整改';
  return {
    goalName: `总部整改｜${focusLabel}`,
    goalDescription: `来自 AI 总部述职闭环，围绕“${focusLabel}”生成的整改目标。最近承诺：${latestAnswer}`,
    taskTitle: `总部整改动作｜${focusLabel}`,
    taskDescription: latestAnswer || reportData.painFocus?.detail || '按总部要求完成整改动作。',
    deadlineDays: 7,
    durationMinutes: 60,
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function nextMorningAtNine() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next;
}

function toneLabel(tone: AnswerTone) {
  if (tone === 'excuse') return '借口倾向';
  if (tone === 'passive') return '敷衍摆烂';
  if (tone === 'honest') return '坦诚认错';
  return '正常应答';
}

function severityLabel(level: 'light' | 'medium' | 'heavy') {
  if (level === 'heavy') return '重度异常';
  if (level === 'medium') return '中度异常';
  return '轻度异常';
}

function formatDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
