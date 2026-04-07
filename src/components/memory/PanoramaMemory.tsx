import { useEffect, useMemo, useState } from 'react';
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
};

type HQReportSummary = {
  rootCause: string;
  promise: string;
  issueLevel: string;
  praise: string;
  penalty: string;
};

const STORAGE_KEY = 'hq-report-session-v1';

export default function PanoramaMemory({ bgColor = '#ffffff' }: PanoramaMemoryProps) {
  const goals = useGoalStore((state) => state.goals);
  const tasks = useTaskStore((state) => state.tasks);
  const sideHustles = useSideHustleStore((state) => state.sideHustles);
  const incomeRecords = useSideHustleStore((state) => state.incomeRecords);
  const { isConfigured, chat } = useAIStore();

  const [stage, setStage] = useState<SessionStage>('loading');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [reportSummary, setReportSummary] = useState<HQReportSummary | null>(null);

  const reportData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeGoals = goals.filter((goal) => goal.isActive && !goal.isCompleted);
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

    const completedToday = todayTasks.filter((task) => task.status === 'completed').length;
    const completedWeek = weekTasks.filter((task) => task.status === 'completed').length;

    const delayedTasks = tasks.filter((task) => {
      if (!task.scheduledEnd) return false;
      return task.status !== 'completed' && new Date(task.scheduledEnd) < now;
    });

    const procrastinationCount = tasks.reduce(
      (sum, task) => sum + (task.startTimeoutCount || 0) + (task.completeTimeoutCount || 0),
      0
    );

    const lowEfficiencyCount = tasks.filter(
      (task) => typeof task.completionEfficiency === 'number' && task.completionEfficiency < 60
    ).length;

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

    const delaySeverity: 'light' | 'medium' | 'heavy' =
      procrastinationCount >= 5 || delayedTasks.length >= 2
        ? 'heavy'
        : procrastinationCount >= 3 || delayedTasks.length >= 1
          ? 'medium'
          : 'light';

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
      delayedTaskNames: delayedTasks.slice(0, 5).map((task) => task.title),
      procrastinationCount,
      lowEfficiencyCount,
      monthIncome,
      activeSideHustles: sideHustles.filter((item) => item.status !== 'archived').length,
      delaySeverity,
    };
  }, [goals, tasks, sideHustles, incomeRecords]);

  const baseFirstQuestion = useMemo(() => {
    return `【AI总部】\n${formatDate(reportData.now)} 述职数据核查完毕（全自动核算）。\n\n年度主线目标：${reportData.yearGoalName}\n年度进度：${reportData.yearlyCurrentValue}/${reportData.yearlyGoalValue || '未设定'}（${reportData.yearlyRate.toFixed(2)}%）\n月度进度：${reportData.monthCurrentValue}/${reportData.monthGoalValue || '未设定'}（${reportData.monthRate.toFixed(2)}%）\n本周任务完成：${reportData.completedWeek}/${reportData.weekTaskCount}\n今日任务完成：${reportData.completedToday}/${reportData.todayTaskCount}\n异常数据：拖延 ${reportData.procrastinationCount} 次，低效率 ${reportData.lowEfficiencyCount} 次，滞后任务 ${reportData.delayedTasks.length} 项\n目标缺口：${reportData.monthGap}\n\n提问：结合以上数据，你本周最明显的异常行为是什么？`;
  }, [reportData]);

  const fallbackSummary = useMemo<HQReportSummary>(() => {
    const rootCause = userAnswers[1] || '尚未明确主观根因';
    const promise = userAnswers[2] || '尚未形成明确整改承诺';
    const issueLevel =
      reportData.delaySeverity === 'heavy'
        ? '警告'
        : reportData.delaySeverity === 'medium'
          ? '观察'
          : '轻提醒';

    return {
      rootCause,
      promise,
      issueLevel,
      praise:
        reportData.completedWeek > 0
          ? `本周仍完成 ${reportData.completedWeek} 项任务，说明执行力不是没有，只是稳定性不足。`
          : '本周完成量偏弱，当前更需要先恢复基本执行秩序。',
      penalty:
        reportData.delaySeverity === 'heavy'
          ? '总部评价：执行失真明显，借口倾向必须立即切断。'
          : reportData.delaySeverity === 'medium'
            ? '总部评价：中度偏航，继续放任就会滑向失控。'
            : '总部评价：问题已出现苗头，现在不收口，后面一定放大。',
    };
  }, [reportData, userAnswers]);

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
          setIsHydrated(true);
          return;
        }
      }
    } catch (error) {
      console.error('恢复总部述职会话失败:', error);
    }

    setIsHydrated(true);
  }, []);

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
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('保存总部述职会话失败:', error);
    }
  }, [isHydrated, messages, stage, userAnswers]);

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
  };

  const handleSubmit = async () => {
    const value = inputValue.trim();
    if (!value || isSubmitting || stage === 'loading' || stage === 'report') return;

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

    const aiReply = await generateStageReply({
      currentStage,
      answer: value,
      answers: nextAnswers,
      reportData,
      isAIEnabled: isConfigured(),
      chat,
    });

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: aiReply,
      stage: currentStage,
    };

    setMessages((prev) => [...prev, aiMessage]);

    setStage((prev) => {
      if (prev === 'stage1') return 'stage2';
      if (prev === 'stage2') return 'stage3';
      if (prev === 'stage3') return 'report';
      return prev;
    });
    setIsSubmitting(false);
  };

  const currentSummary = reportSummary || fallbackSummary;
  const ringPercent = Math.max(0, Math.min(100, Number(reportData.monthRate.toFixed(0))));
  const reportTitle = `【${reportData.now.getFullYear()}年${reportData.now.getMonth() + 1}月${reportData.now.getDate()}日】AI总部述职报告`;

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
                    <textarea
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      placeholder="直接回答，不要绕。"
                      className="min-h-[108px] w-full resize-none rounded-[20px] border px-4 py-3 text-sm outline-none"
                      style={{
                        backgroundColor: '#fcfaf6',
                        borderColor: 'rgba(86, 62, 39, 0.16)',
                        color: '#23160d',
                      }}
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={!inputValue.trim() || isSubmitting}
                      className="mt-3 w-full rounded-[18px] px-4 py-3 text-sm font-black transition-opacity"
                      style={{
                        backgroundColor: '#23160d',
                        color: '#f7efe1',
                        opacity: !inputValue.trim() || isSubmitting ? 0.5 : 1,
                      }}
                    >
                      {isSubmitting ? '总部生成中...' : '提交回答'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
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
                    述职判断
                  </div>
                  <div className="grid gap-3 text-sm">
                    <JudgeLine label="异常等级" value={severityLabel(reportData.delaySeverity)} />
                    <JudgeLine label="最近回答态度" value={toneLabel(answerTone)} />
                    <JudgeLine label="述职进度" value={`${Math.min(userAnswers.length, 3)}/3`} />
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
                  content={`- 月度剩余目标：优先补齐 ${reportData.monthGap} 的进度缺口。\n- 下周核心要求：先清滞后任务，再推进关键目标。\n- 每日执行标准：关键任务优先、当天任务当天清。\n- 本轮整改动作：${currentSummary.promise}`}
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
  reportData: ReturnType<typeof buildPromptData>,
  enabled: boolean,
  chat: ReturnType<typeof useAIStore.getState>['chat']
) {
  if (!enabled) return fallback;

  try {
    const response = await chat([
      {
        role: 'system',
        content:
          '你是AI总部督查官。你现在只负责第一阶段：严肃、干练、无寒暄、无废话。必须先直给数据，再只提一个问题。禁止要求用户自己计算任何数据。',
      },
      {
        role: 'user',
        content: `请基于以下数据生成总部开场述职文案。要求：\n1. 必须用【AI总部】开头\n2. 直接列数据\n3. 末尾只能提1个问题\n4. 不要输出JSON\n\n${buildPromptData(reportData)}`,
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
}: {
  currentStage: SessionStage;
  answer: string;
  answers: string[];
  reportData: ReturnType<typeof buildPromptData> extends string ? never : any;
  isAIEnabled: boolean;
  chat: ReturnType<typeof useAIStore.getState>['chat'];
}) {
  const fallback = getFallbackReply(currentStage, answer, reportData);
  if (!isAIEnabled) return fallback;

  try {
    const stageInstruction =
      currentStage === 'stage1'
        ? '你现在处于第一阶段末尾，准备进入第二阶段深挖。语气要严肃干练。根据用户刚才回答，只生成下一句追问。只能提一个问题。'
        : currentStage === 'stage2'
          ? '你现在处于第二阶段末尾，准备进入第三阶段整改确认。语气要犀利毒舌但不做人身攻击。根据用户回答态度继续追问或推进。只能提一个问题。'
          : '你现在处于第三阶段。请基于前文要求用户做最后的整改确认，并告知将生成述职报告。只能输出一段短回应。';

    const response = await chat([
      {
        role: 'system',
        content:
          '你是真人式AI总部督查官。必须严格一问一答。禁止一次提多个问题。禁止要求用户计算数据。你可以毒舌，但只针对行为和习惯，不做人身攻击。',
      },
      {
        role: 'user',
        content: `${stageInstruction}\n\n当前数据：\n${buildPromptData(reportData)}\n\n历史回答：\n${answers.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n用户刚刚的新回答：${answer}`,
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
  reportData: any,
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
          '你是AI总部督查官。请基于数据和用户回答，生成结构化述职报告摘要。必须输出JSON，字段为 rootCause、promise、issueLevel、praise、penalty。不要输出代码块。',
      },
      {
        role: 'user',
        content: `请根据以下数据与述职对话生成报告摘要：\n\n数据：\n${buildPromptData(reportData)}\n\n回答：\n${userAnswers.map((item, index) => `${index + 1}. ${item}`).join('\n')}`,
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

function getFallbackReply(currentStage: SessionStage, answer: string, reportData: any) {
  const tone = analyzeTone(answer);

  if (currentStage === 'stage1') {
    if (tone === 'excuse') {
      return '【AI总部】别拿环境当挡箭牌。忙、忘、外界干扰，这些都解释不了你为什么允许执行滑坡。重新说：你主观上到底放纵了什么行为漏洞？';
    }
    if (tone === 'passive') {
      return '【AI总部】“不知道”这种回答没有任何价值。你不是没问题，是不肯承认。直接说：是逃避、贪舒服、怕难，还是根本不想扛责任？';
    }
    if (reportData.delaySeverity === 'heavy') {
      return `【AI总部】记录在案。现在进入深挖：你已经出现 ${reportData.procrastinationCount} 次拖延和 ${reportData.delayedTasks.length} 项滞后，这不是偶发，是习惯性失控。根因到底是什么？`;
    }
    return '【AI总部】收到。别再复述表面现象。下一问：你为什么会连续允许这种异常出现？只说主观根因，不准甩锅。';
  }

  if (currentStage === 'stage2') {
    if (tone === 'excuse') {
      return '【AI总部】你又在往外推责任。总部只认你能控制的部分。最后追问一次：你最核心的习惯性漏洞是什么？说人话，说主观原因。';
    }
    if (tone === 'passive') {
      return '【AI总部】继续摆烂，只会让下周的数据更难看。现在立刻给整改动作：你接下来七天准备怎么改，具体到每天怎么做。';
    }
    if (tone === 'honest') {
      return '【AI总部】这次算你开始面对问题了。进入整改确认：接下来七天，你准备用什么硬动作堵住这个漏洞？只能说可执行动作，不要喊口号。';
    }
    return '【AI总部】根因基本清楚。进入整改确认：接下来七天，你用什么具体动作把问题压住？只要动作，不要空话。';
  }

  return '【AI总部】承诺已记录。述职结束，正在生成你的总部述职报告。';
}

function buildPromptData(reportData: any) {
  return reportData;
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

function analyzeTone(answer: string): AnswerTone {
  const normalized = answer.trim();
  if (!normalized) return 'neutral';
  if (/太忙|没时间|忘了|不小心|外界|干扰|任务难|事情多/.test(normalized)) return 'excuse';
  if (/不知道|改不了|没办法|就这样|随便|无所谓/.test(normalized)) return 'passive';
  if (/我拖延|我逃避|我自律差|是我的问题|我没执行|我没盯住/.test(normalized)) return 'honest';
  return 'neutral';
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

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
