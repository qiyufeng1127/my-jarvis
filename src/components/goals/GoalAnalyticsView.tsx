import { useMemo, useState } from 'react';
import { BarChart3, CalendarClock, ChevronLeft, Clock3, Flame, TrendingUp } from 'lucide-react';
import { useGoalContributionStore, type GoalContributionRecord } from '@/stores/goalContributionStore';
import { useTaskHistoryStore } from '@/stores/taskHistoryStore';
import { useGoalStore } from '@/stores/goalStore';
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

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)} h`;
}

interface ContributionEditorDraft {
  durationMinutes: number;
  values: Record<string, number>;
}

export default function GoalAnalyticsView({ goal, onBack }: GoalAnalyticsViewProps) {
  const liveGoal = useGoalStore((state) => state.getGoalById(goal.id) ?? goal);
  const contributionRecords = useGoalContributionStore((state) => state.getRecordsByGoalId(goal.id));
  const updateContributionRecord = useGoalContributionStore((state) => state.updateRecord);
  const taskHistoryRecords = useTaskHistoryStore((state) => state.records);
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const [selectedRecord, setSelectedRecord] = useState<GoalContributionRecord | null>(null);
  const [editorDraft, setEditorDraft] = useState<ContributionEditorDraft | null>(null);

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

  const totalContributionValue = useMemo(
    () => contributionRecords.reduce((sum, record) => sum + record.dimensionResults.reduce((acc, item) => acc + item.value, 0), 0),
    [contributionRecords]
  );

  const openRecordEditor = (record: GoalContributionRecord) => {
    setSelectedRecord(record);
    setEditorDraft({
      durationMinutes: record.durationMinutes,
      values: liveGoal.dimensions.reduce<Record<string, number>>((acc, dimension) => {
        const matched = record.dimensionResults.find((item) => item.dimensionId === dimension.id);
        acc[dimension.id] = matched?.value || 0;
        return acc;
      }, {}),
    });
  };

  const closeRecordEditor = () => {
    setSelectedRecord(null);
    setEditorDraft(null);
  };

  const saveRecordEditor = () => {
    if (!selectedRecord || !editorDraft) return;

    const nextDimensionResults = goal.dimensions.map((dimension) => ({
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      unit: dimension.unit,
      value: Math.max(0, Number(editorDraft.values[dimension.id] || 0)),
    }));

    updateContributionRecord(selectedRecord.id, {
      durationMinutes: Math.max(0, Number(editorDraft.durationMinutes || 0)),
      dimensionResults: nextDimensionResults,
    });

    const recordsAfterUpdate = contributionRecords.map((record) =>
      record.id === selectedRecord.id
        ? {
            ...record,
            durationMinutes: Math.max(0, Number(editorDraft.durationMinutes || 0)),
            dimensionResults: nextDimensionResults,
          }
        : record
    );

    const nextDimensions = goal.dimensions.map((dimension) => ({
      ...dimension,
      currentValue: recordsAfterUpdate.reduce((sum, record) => {
        const matched = record.dimensionResults.find((item) => item.dimensionId === dimension.id);
        return sum + (matched?.value || 0);
      }, 0),
    }));

    updateGoal(goal.id, {
      dimensions: nextDimensions,
      currentValue: nextDimensions.reduce((sum, item) => sum + item.currentValue, 0),
      targetValue: nextDimensions.reduce((sum, item) => sum + item.targetValue, 0),
    });

    closeRecordEditor();
  };

  const chartPoints = useMemo(() => {
    const source = contributionRecords.length > 0
      ? contributionRecords.map((record) => ({
          date: new Date(record.createdAt),
          value: record.dimensionResults.reduce((sum, item) => sum + item.value, 0),
          duration: record.durationMinutes,
        }))
      : matchedHistory.map((record) => ({
          date: new Date(record.completedAt),
          value: Math.round((record.actualDuration / Math.max(goal.estimatedTotalHours || 1, 1)) * 10),
          duration: record.actualDuration,
        }));

    if (source.length === 0) return [];

    const grouped = source.reduce<Record<string, { date: Date; value: number; duration: number }>>((acc, item) => {
      const normalizedDate = new Date(item.date);
      normalizedDate.setHours(0, 0, 0, 0);
      const key = normalizedDate.toISOString().slice(0, 10);
      if (!acc[key]) {
        acc[key] = { date: normalizedDate, value: 0, duration: 0 };
      }
      acc[key].value += item.value;
      acc[key].duration += item.duration;
      return acc;
    }, {});

    const sortedEntries = Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
    const startDate = new Date(sortedEntries[0].date);
    const endDate = new Date(sortedEntries[sortedEntries.length - 1].date);
    const filledEntries: Array<{ date: Date; actual: number; duration: number }> = [];

    for (let cursor = new Date(startDate); cursor.getTime() <= endDate.getTime(); cursor.setDate(cursor.getDate() + 1)) {
      const currentDate = new Date(cursor);
      const key = currentDate.toISOString().slice(0, 10);
      const matched = grouped[key];
      filledEntries.push({
        date: currentDate,
        actual: matched?.value || 0,
        duration: matched?.duration || 0,
      });
    }

    let runningActual = 0;
    const finalCumulative = filledEntries.reduce((sum, item) => sum + item.actual, 0);

    return filledEntries.map((entry, index) => {
      runningActual += entry.actual;
      return {
        date: formatDateLabel(entry.date),
        actual: entry.actual,
        duration: entry.duration,
        cumulativeActual: runningActual,
        idealCumulative: filledEntries.length > 1 ? Number((((index + 1) / filledEntries.length) * finalCumulative).toFixed(2)) : finalCumulative,
      };
    });
  }, [contributionRecords, matchedHistory, goal.estimatedTotalHours]);

  const maxActual = Math.max(...chartPoints.map((item) => item.actual), 1);
  const maxDuration = Math.max(...chartPoints.map((item) => item.duration), 1);
  const maxCumulative = Math.max(...chartPoints.map((item) => Math.max(item.cumulativeActual, item.idealCumulative)), 1);

  const chartGeometry = useMemo(() => {
    const chartWidth = 320;
    const chartHeight = 160;

    if (chartPoints.length === 0) {
      return {
        actualLine: '',
        idealLine: '',
        areaPath: '',
      };
    }

    const getX = (index: number) => (chartPoints.length === 1 ? chartWidth / 2 : (index / (chartPoints.length - 1)) * chartWidth);
    const getY = (value: number) => chartHeight - (value / maxCumulative) * chartHeight;

    const actualCoordinates = chartPoints.map((point, index) => `${getX(index)},${getY(point.cumulativeActual)}`);
    const idealCoordinates = chartPoints.map((point, index) => `${getX(index)},${getY(point.idealCumulative)}`);

    const areaPath = actualCoordinates.length > 0
      ? `M 0 ${chartHeight} L ${actualCoordinates.join(' L ')} L ${getX(chartPoints.length - 1)} ${chartHeight} Z`
      : '';

    return {
      actualLine: actualCoordinates.join(' '),
      idealLine: idealCoordinates.join(' '),
      areaPath,
    };
  }, [chartPoints, maxCumulative]);

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
          <div className="h-[260px] rounded-[24px] bg-[#f6f7fb] px-4 py-5">
            {chartPoints.length > 0 ? (
              <div className="relative h-full">
                <div className="absolute inset-0 flex items-end gap-3">
                  {chartPoints.map((point) => (
                    <div key={point.date} className="flex h-full flex-1 flex-col justify-end gap-2">
                      <div className="flex flex-1 items-end justify-center gap-1">
                        <div
                          className="w-3 rounded-full bg-[#0A84FF]/85"
                          style={{ height: `${Math.max(18, (point.actual / maxActual) * 110)}px` }}
                        />
                        <div
                          className="w-3 rounded-full bg-[#5856d6]/65"
                          style={{ height: `${Math.max(16, (point.duration / maxDuration) * 92)}px` }}
                        />
                      </div>
                      <div className="text-center text-[11px] text-[#6b7280]">{point.date}</div>
                    </div>
                  ))}
                </div>

                <svg
                  viewBox="0 0 320 160"
                  className="pointer-events-none absolute left-0 right-0 top-1 mx-auto h-[160px] w-[calc(100%-8px)] overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="goalActualArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  <path d={chartGeometry.areaPath} fill="url(#goalActualArea)" />
                  <polyline
                    points={chartGeometry.idealLine}
                    fill="none"
                    stroke="#34c759"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points={chartGeometry.actualLine}
                    fill="none"
                    stroke="#ff5a5f"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartPoints.map((point, index) => {
                    const x = chartPoints.length === 1 ? 160 : (index / (chartPoints.length - 1)) * 320;
                    const y = 160 - (point.cumulativeActual / maxCumulative) * 160;
                    return (
                      <g key={`${point.date}-node`}>
                        <circle cx={x} cy={y} r="5.5" fill="#ffffff" stroke="#ff5a5f" strokeWidth="3" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[#9ca3af]">
                暂无历史记录，后续从时间轴填写关键结果后会在这里生成图表。
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#6b7280]">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#0A84FF]" />实际产出柱</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#5856d6]" />投入时间柱</div>
            <div className="flex items-center gap-2"><span className="h-[2px] w-4 bg-[#ff5a5f]" />累计实际折线</div>
            <div className="flex items-center gap-2"><span className="h-[2px] w-4 border-t-2 border-dashed border-[#34c759]" />理想进度线</div>
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

