import { useMemo } from 'react';
import { BarChart3, CalendarClock, ChevronLeft, Clock3, Flame, TrendingUp } from 'lucide-react';
import { useGoalContributionStore } from '@/stores/goalContributionStore';
import { useTaskHistoryStore } from '@/stores/taskHistoryStore';
import type { LongTermGoal } from '@/types';

interface GoalAnalyticsViewProps {
  goal: LongTermGoal;
  onBack: () => void;
}

function formatDateLabel(date: Date) {
  return new Date(date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function getIdealProgress(goal: LongTermGoal) {
  if (!goal.startDate || !goal.endDate) return 0;
  const now = new Date();
  const start = new Date(goal.startDate);
  const end = new Date(goal.endDate);
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 0;
  const elapsed = Math.min(Math.max(now.getTime() - start.getTime(), 0), total);
  return Math.round((elapsed / total) * 100);
}

export default function GoalAnalyticsView({ goal, onBack }: GoalAnalyticsViewProps) {
  const contributionRecords = useGoalContributionStore((state) => state.getRecordsByGoalId(goal.id));
  const taskHistoryRecords = useTaskHistoryStore((state) => state.records);

  const progress = useMemo(() => {
    if (goal.dimensions.length > 0) {
      return Math.round(
        goal.dimensions.reduce((sum, item) => {
          if (!item.targetValue) return sum;
          return sum + Math.min(1, item.currentValue / item.targetValue) * item.weight;
        }, 0)
      );
    }
    if (!goal.targetValue) return 0;
    return Math.round((goal.currentValue / goal.targetValue) * 100);
  }, [goal]);

  const idealProgress = useMemo(() => getIdealProgress(goal), [goal]);

  const totalMinutes = useMemo(
    () => contributionRecords.reduce((sum, item) => sum + item.durationMinutes, 0),
    [contributionRecords]
  );

  const matchedHistory = useMemo(() => {
    const keywords = [goal.name, ...goal.projectBindings.map((item) => item.name)].filter(Boolean);
    return taskHistoryRecords.filter((record) =>
      keywords.some((keyword) => record.taskTitle.includes(keyword) || record.tags.some((tag) => tag.includes(keyword)))
    );
  }, [goal, taskHistoryRecords]);

  const chartPoints = useMemo(() => {
    const source = contributionRecords.length > 0
      ? contributionRecords.map((record) => ({
          date: record.createdAt,
          value: record.dimensionResults.reduce((sum, item) => sum + item.value, 0),
          duration: record.durationMinutes,
        }))
      : matchedHistory.map((record) => ({
          date: record.completedAt,
          value: Math.round((record.actualDuration / Math.max(goal.estimatedTotalHours || 1, 1)) * 10),
          duration: record.actualDuration,
        }));

    const grouped = source.reduce<Record<string, { value: number; duration: number }>>((acc, item) => {
      const key = formatDateLabel(item.date);
      if (!acc[key]) {
        acc[key] = { value: 0, duration: 0 };
      }
      acc[key].value += item.value;
      acc[key].duration += item.duration;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, value]) => ({
      date,
      actual: value.value,
      duration: value.duration,
    }));
  }, [contributionRecords, matchedHistory, goal.estimatedTotalHours]);

  const maxActual = Math.max(...chartPoints.map((item) => item.actual), 1);

  const metricCards = [
    { label: '当前进度', value: `${progress}%`, tone: '#ff3b30' },
    { label: '理想进度', value: `${idealProgress}%`, tone: '#34c759' },
    { label: '总投入时间', value: `${(totalMinutes / 60).toFixed(1)} h`, tone: '#5856d6' },
    {
      label: '当前投产比',
      value: totalMinutes > 0 ? `${(progress / Math.max(totalMinutes / 60, 1)).toFixed(2)}%/h` : '--',
      tone: '#ff9500',
    },
  ];

  return (
    <div className="min-h-full bg-[#efeff4] px-4 pb-10 pt-5">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded-[30px] bg-white px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827]">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-lg font-semibold text-[#111827]">目标分析</div>
            <div className="h-10 w-10 rounded-full" />
          </div>

          <div className="mt-4">
            <div className="text-sm text-[#6b7280]">{goal.name}</div>
            <div className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">当前进度：{progress}%</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold" style={{ color: progress >= idealProgress ? '#34c759' : '#ff9500' }}>
              <Flame className="h-4 w-4" />
              {progress >= idealProgress ? '进度领先' : `进度落后 ${Math.max(0, idealProgress - progress)}%`}
            </div>
          </div>
        </div>

        <div className="rounded-[30px] bg-white px-4 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <TrendingUp className="h-4 w-4" /> 趋势总览
          </div>
          <div className="h-[220px] rounded-[24px] bg-[#f6f7fb] px-4 py-5">
            <div className="flex h-full items-end gap-3">
              {chartPoints.length > 0 ? chartPoints.map((point) => (
                <div key={point.date} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex w-full items-end justify-center gap-1">
                    <div
                      className="w-3 rounded-full bg-[#0A84FF]"
                      style={{ height: `${Math.max(18, (point.actual / maxActual) * 140)}px` }}
                    />
                    <div
                      className="w-3 rounded-full bg-[#5856d6]"
                      style={{ height: `${Math.max(16, (point.duration / Math.max(...chartPoints.map((item) => item.duration), 1)) * 120)}px` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#6b7280]">{point.date}</div>
                </div>
              )) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-[#9ca3af]">
                  暂无历史记录，后续从时间轴填写关键结果后会在这里生成图表。
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#6b7280]">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#0A84FF]" />实际产出</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#5856d6]" />累计时间</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-[24px] bg-white px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="text-sm text-[#6b7280]">{card.label}</div>
              <div className="mt-2 text-[24px] font-semibold" style={{ color: card.tone }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[30px] bg-white px-4 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <BarChart3 className="h-4 w-4" /> 客观量进度
          </div>
          <div className="space-y-4">
            {goal.dimensions.map((dimension) => {
              const progressValue = dimension.targetValue > 0 ? Math.round((dimension.currentValue / dimension.targetValue) * 100) : 0;
              return (
                <div key={dimension.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#111827]">{dimension.name}</span>
                    <span className="text-[#6b7280]">{dimension.currentValue} / {dimension.targetValue} {dimension.unit}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#eef0f6]">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(progressValue, 100)}%`, backgroundColor: goal.theme.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[30px] bg-white px-4 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <CalendarClock className="h-4 w-4" /> 时间轴贡献记录
          </div>
          <div className="space-y-3">
            {contributionRecords.length > 0 ? contributionRecords.map((record) => (
              <div key={record.id} className="rounded-[20px] bg-[#f7f8fb] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#111827]">{record.taskTitle}</div>
                    <div className="mt-1 text-xs text-[#6b7280]">{new Date(record.createdAt).toLocaleString('zh-CN')}</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#111827]">{record.durationMinutes} 分钟</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {record.dimensionResults.map((item) => (
                    <span key={`${record.id}-${item.dimensionId}`} className="rounded-full bg-white px-3 py-1 text-xs text-[#0A84FF] shadow-sm">
                      {item.dimensionName} +{item.value}{item.unit}
                    </span>
                  ))}
                </div>
              </div>
            )) : (
              <div className="rounded-[20px] bg-[#f7f8fb] px-4 py-6 text-center text-sm text-[#9ca3af]">
                还没有关键结果记录。后续接入时间轴后，点击某个任务即可填写并体现在这里。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[30px] bg-white px-4 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <Clock3 className="h-4 w-4" /> 历史任务参考
          </div>
          <div className="space-y-3">
            {matchedHistory.length > 0 ? matchedHistory.slice(0, 8).map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-[18px] bg-[#f7f8fb] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[#111827]">{record.taskTitle}</div>
                  <div className="mt-1 text-xs text-[#6b7280]">{new Date(record.completedAt).toLocaleDateString('zh-CN')}</div>
                </div>
                <div className="text-sm font-semibold text-[#5856d6]">{record.actualDuration} min</div>
              </div>
            )) : (
              <div className="rounded-[20px] bg-[#f7f8fb] px-4 py-6 text-center text-sm text-[#9ca3af]">
                暂未检索到相关历史任务，后续会继续接入时间轴原始记录。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

