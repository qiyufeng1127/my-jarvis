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

function getComparisonTone(current: number, target: number) {
  if (current >= target) return '#34c759';
  if (target - current >= 5) return '#ff3b30';
  return '#ff9500';
}

interface ContributionEditorDraft {
  durationMinutes: number;
  note: string;
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
    if (liveGoal.dimensions.length > 0) {
      return Math.round(
        liveGoal.dimensions.reduce((sum, item) => {
          if (!item.targetValue) return sum;
          return sum + Math.min(1, item.currentValue / item.targetValue) * item.weight;
        }, 0)
      );
    }
    if (!liveGoal.targetValue) return 0;
    return Math.round((liveGoal.currentValue / liveGoal.targetValue) * 100);
  }, [liveGoal]);

  const idealProgress = useMemo(() => getIdealProgress(liveGoal), [liveGoal]);

  const totalMinutes = useMemo(
    () => contributionRecords.reduce((sum, item) => sum + item.durationMinutes, 0),
    [contributionRecords]
  );

  const matchedHistory = useMemo(() => {
    const keywords = [liveGoal.name, ...liveGoal.projectBindings.map((item) => item.name)].filter(Boolean);
    return taskHistoryRecords.filter((record) =>
      keywords.some((keyword) => record.taskTitle.includes(keyword) || record.tags.some((tag) => tag.includes(keyword)))
    );
  }, [liveGoal, taskHistoryRecords]);

  const totalContributionValue = useMemo(
    () => contributionRecords.reduce((sum, record) => sum + record.dimensionResults.reduce((acc, item) => acc + item.value, 0), 0),
    [contributionRecords]
  );

  const totalIncome = useMemo(() => {
    if (!liveGoal.targetIncome || !liveGoal.targetValue) return liveGoal.currentIncome || 0;
    const income = contributionRecords.reduce((sum, record) => {
      const contributionValue = record.dimensionResults.reduce((acc, item) => acc + item.value, 0);
      return sum + (contributionValue / Math.max(liveGoal.targetValue || 1, 1)) * liveGoal.targetIncome!;
    }, 0);
    return Math.round(income);
  }, [contributionRecords, liveGoal.currentIncome, liveGoal.targetIncome, liveGoal.targetValue]);

  const openRecordEditor = (record: GoalContributionRecord) => {
    setSelectedRecord(record);
    setEditorDraft({
      durationMinutes: record.durationMinutes,
      note: record.note || '',
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

    const nextDimensionResults = liveGoal.dimensions.map((dimension) => ({
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      unit: dimension.unit,
      value: Math.max(0, Number(editorDraft.values[dimension.id] || 0)),
    }));

    updateContributionRecord(selectedRecord.id, {
      durationMinutes: Math.max(0, Number(editorDraft.durationMinutes || 0)),
      note: editorDraft.note,
      dimensionResults: nextDimensionResults,
    });

    const recordsAfterUpdate = contributionRecords.map((record) =>
      record.id === selectedRecord.id
        ? {
            ...record,
            durationMinutes: Math.max(0, Number(editorDraft.durationMinutes || 0)),
            note: editorDraft.note,
            dimensionResults: nextDimensionResults,
          }
        : record
    );

    const nextDimensions = liveGoal.dimensions.map((dimension) => ({
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
      currentIncome: Math.round(recordsAfterUpdate.reduce((sum, record) => {
        const contributionValue = record.dimensionResults.reduce((acc, item) => acc + item.value, 0);
        return sum + ((liveGoal.targetIncome || 0) * contributionValue) / Math.max(liveGoal.targetValue || 1, 1);
      }, 0)),
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
    let runningIncome = 0;
    const finalCumulative = filledEntries.reduce((sum, item) => sum + item.actual, 0);

    return filledEntries.map((entry, index) => {
      runningActual += entry.actual;
      const incomeIncrement = liveGoal.targetIncome && liveGoal.targetValue
        ? (entry.actual / Math.max(liveGoal.targetValue, 1)) * liveGoal.targetIncome
        : 0;
      runningIncome += incomeIncrement;

      return {
        date: formatDateLabel(entry.date),
        actual: entry.actual,
        duration: entry.duration,
        incomeIncrement: Number(incomeIncrement.toFixed(2)),
        cumulativeActual: runningActual,
        cumulativeIncome: Number(runningIncome.toFixed(2)),
        idealCumulative: filledEntries.length > 1 ? Number((((index + 1) / filledEntries.length) * finalCumulative).toFixed(2)) : finalCumulative,
      };
    });
  }, [contributionRecords, matchedHistory, liveGoal.estimatedTotalHours, liveGoal.targetIncome, liveGoal.targetValue]);

  const maxActual = Math.max(...chartPoints.map((item) => item.actual), 1);
  const maxDuration = Math.max(...chartPoints.map((item) => item.duration), 1);
  const maxCumulative = Math.max(...chartPoints.map((item) => Math.max(item.cumulativeActual, item.idealCumulative, item.cumulativeIncome)), 1);

  const chartGeometry = useMemo(() => {
    const chartWidth = 320;
    const chartHeight = 160;

    if (chartPoints.length === 0) {
      return {
        actualLine: '',
        idealLine: '',
        incomeLine: '',
        areaPath: '',
      };
    }

    const getX = (index: number) => (chartPoints.length === 1 ? chartWidth / 2 : (index / (chartPoints.length - 1)) * chartWidth);
    const getY = (value: number) => chartHeight - (value / maxCumulative) * chartHeight;

    const actualCoordinates = chartPoints.map((point, index) => `${getX(index)},${getY(point.cumulativeActual)}`);
    const idealCoordinates = chartPoints.map((point, index) => `${getX(index)},${getY(point.idealCumulative)}`);
    const incomeCoordinates = chartPoints.map((point, index) => `${getX(index)},${getY(point.cumulativeIncome)}`);
    const actualLinePoints = actualCoordinates.length > 0 ? [`0,${chartHeight}`, ...actualCoordinates].join(' ') : '';
    const idealLinePoints = idealCoordinates.length > 0 ? [`0,${chartHeight}`, ...idealCoordinates].join(' ') : '';
    const incomeLinePoints = incomeCoordinates.length > 0 ? [`0,${chartHeight}`, ...incomeCoordinates].join(' ') : '';

    const areaPath = actualCoordinates.length > 0
      ? `M 0 ${chartHeight} L ${actualCoordinates.join(' L ')} L ${getX(chartPoints.length - 1)} ${chartHeight} Z`
      : '';

    return {
      actualLine: actualLinePoints,
      idealLine: idealLinePoints,
      incomeLine: incomeLinePoints,
      areaPath,
    };
  }, [chartPoints, maxCumulative]);

  const progressTone = getComparisonTone(progress, idealProgress);
  const currentEfficiency = totalMinutes > 0 ? Number((progress / Math.max(totalMinutes / 60, 1)).toFixed(2)) : 0;
  const idealEfficiency = totalMinutes > 0 ? Number((idealProgress / Math.max(totalMinutes / 60, 1)).toFixed(2)) : 0;
  const efficiencyTone = getComparisonTone(currentEfficiency, idealEfficiency);

  const metricCards = [
    { label: '当前进度', value: `${progress}%`, tone: progressTone },
    { label: '理想进度', value: `${idealProgress}%`, tone: progressTone },
    { label: '当前投产比', value: totalMinutes > 0 ? `${currentEfficiency.toFixed(2)}%/h` : '--', tone: efficiencyTone },
    { label: '理想投产比', value: totalMinutes > 0 ? `${idealEfficiency.toFixed(2)}%/h` : '--', tone: efficiencyTone },
  ];

  if (selectedRecord && editorDraft) {
    const originalDuration = Math.max(selectedRecord.durationMinutes || 0, 1);
    const durationMax = Math.max(originalDuration * 2, 240);
    const durationPercent = Math.round((editorDraft.durationMinutes / originalDuration) * 100);
    const sliderFillPercent = Math.min(100, (editorDraft.durationMinutes / Math.max(durationMax, 1)) * 100);
    const originalMarkerPercent = Math.min(100, (originalDuration / Math.max(durationMax, 1)) * 100);

    return (
      <div className="min-h-full bg-[#efeff4] px-4 pb-10 pt-5">
        <div className="mx-auto max-w-xl space-y-4 pb-[148px]">
          <div className="rounded-[32px] bg-white px-5 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <button onClick={closeRecordEditor} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f4f6] text-[#111827]">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-lg font-semibold text-[#111827]">关键结果编辑</div>
              <div className="h-10 w-10 rounded-full" />
            </div>

            <div className="mt-5 rounded-[24px] bg-[linear-gradient(180deg,rgba(244,249,255,0.98),rgba(247,248,252,0.95))] px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[radial-gradient(circle_at_30%_20%,#d7ebff,#9fd0ff_58%,#5aa9ff)] text-3xl shadow-[0_10px_24px_rgba(10,132,255,0.18)]">
                  ⏱️
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7aa7d9]">历史记录编辑态</div>
                      <div className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">{selectedRecord.taskTitle}</div>
                    </div>
                    <div className="rounded-full bg-[#edf5ff] px-3 py-1 text-[22px] font-semibold tracking-[-0.04em] text-[#0A84FF]">
                      {durationPercent}%
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-[#6b7280]">在这里直接调整有效时间和本次实际关键结果，风格与时间轴弹窗保持一致。</div>
                  <div className="mt-3 inline-flex rounded-full border border-[#d9ecff] bg-white px-3 py-1 text-xs font-semibold text-[#111827] shadow-sm">
                    {liveGoal.projectBindings[0]?.name || '目标关联任务'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] bg-[#f7f8fb] p-3">
              <div className="mb-2 text-sm font-medium text-[#111827]">有效时间</div>
              <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#9ca3af]">当前换算</div>
                    <div className="mt-2 text-[18px] font-medium text-[#6b7280]">{formatHours(editorDraft.durationMinutes)}</div>
                  </div>
                  <div className="rounded-full bg-[#edf5ff] px-3 py-1 text-[24px] font-semibold tracking-[-0.04em] text-[#0A84FF]">
                    {durationPercent}%
                  </div>
                </div>

                <div className="relative mt-5 px-1">
                  <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#dbeafe]" />
                  <div
                    className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#0A84FF] shadow-[0_0_18px_rgba(10,132,255,0.35)]"
                    style={{ width: `${sliderFillPercent}%` }}
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 z-[1] h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#111827]/30"
                    style={{ left: `${originalMarkerPercent}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={durationMax}
                    step={5}
                    value={editorDraft.durationMinutes}
                    onChange={(event) => setEditorDraft((draft) => draft ? { ...draft, durationMinutes: Number(event.target.value) } : draft)}
                    className="relative z-[2] h-8 w-full cursor-pointer appearance-none bg-transparent accent-[#0A84FF]"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-[#9ca3af]">
                  <span>0 分钟</span>
                  <span>原记录 {selectedRecord.durationMinutes} 分钟</span>
                  <span>{durationMax} 分钟</span>
                </div>
              </div>

              <div className="mt-4 rounded-[20px] border border-[#d9ecff] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-[#6b7280]">有效时间</div>
                    <input
                      type="number"
                      min={0}
                      value={editorDraft.durationMinutes}
                      onChange={(event) => setEditorDraft((draft) => draft ? { ...draft, durationMinutes: Number(event.target.value) } : draft)}
                      className="mt-2 w-full border-none bg-transparent p-0 text-[42px] font-semibold tracking-[-0.06em] text-[#111827] outline-none"
                    />
                    <div className="text-base text-[#6b7280]">分钟</div>
                  </div>
                  <div className="rounded-[18px] bg-[#f5f9ff] px-3 py-2 text-right">
                    <div className="text-xs uppercase tracking-[0.16em] text-[#9ca3af]">默认值</div>
                    <div className="mt-1 text-sm font-semibold text-[#111827]">{selectedRecord.durationMinutes} 分钟</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] bg-[#f7f8fb] p-3">
              <div className="mb-3 text-sm font-medium text-[#111827]">填写本次产出</div>
              <div className="space-y-3">
                {liveGoal.dimensions.map((dimension, index) => (
                  <div key={dimension.id} className="flex items-center gap-3 rounded-[18px] bg-white px-3 py-3 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#111827]">{dimension.name}</div>
                      <div className="mt-1 text-xs text-[#9ca3af]">目标 {dimension.targetValue}{dimension.unit} · 当前累计 {dimension.currentValue}{dimension.unit}</div>
                    </div>
                    <div className="flex w-[128px] items-center rounded-[16px] bg-[#f8fafc] px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={editorDraft.values[dimension.id] || 0}
                        onChange={(event) => setEditorDraft((draft) => draft ? {
                          ...draft,
                          values: {
                            ...draft.values,
                            [dimension.id]: Number(event.target.value),
                          },
                        } : draft)}
                        className="w-full bg-transparent text-right text-sm font-semibold text-[#111827] outline-none"
                      />
                      <span className="ml-2 text-xs text-[#6b7280]">{dimension.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditorDraft((draft) => draft ? {
                          ...draft,
                          values: {
                            ...draft.values,
                            [dimension.id]: Math.max(0, (draft.values[dimension.id] || 0) - 1),
                          },
                        } : draft)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf3ff] text-xl leading-none text-[#0A84FF]"
                      >
                        −
                      </button>
                      <button
                        onClick={() => setEditorDraft((draft) => draft ? {
                          ...draft,
                          values: {
                            ...draft.values,
                            [dimension.id]: (draft.values[dimension.id] || 0) + (index === 0 ? 1 : 1),
                          },
                        } : draft)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A84FF] text-xl leading-none text-white shadow-[0_10px_20px_rgba(10,132,255,0.2)]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">关键结果说明</div>
              <textarea
                value={editorDraft.note}
                onChange={(event) => setEditorDraft((draft) => draft ? { ...draft, note: event.target.value } : draft)}
                rows={3}
                className="w-full rounded-[18px] border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#111827] outline-none"
                placeholder="例如：今天完成 2 条脚本、1 次复盘，推进了目标数据。"
              />
            </div>
          </div>

          <div
            className="fixed left-1/2 z-[60] flex w-[calc(100%-24px)] max-w-xl -translate-x-1/2 gap-3 rounded-t-[24px] bg-white/96 px-4 pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur"
            style={{
              bottom: 'calc(88px + env(safe-area-inset-bottom))',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            }}
          >
            <button
              onClick={closeRecordEditor}
              className="flex-1 rounded-full bg-[#eef0f6] px-4 py-3 text-sm font-medium text-[#111827]"
            >
              取消
            </button>
            <button
              onClick={saveRecordEditor}
              className="flex-1 rounded-full bg-[#0A84FF] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(10,132,255,0.18)]"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="text-sm text-[#6b7280]">{liveGoal.name}</div>
            <div className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">当前进度：{progress}%</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-[#f7f8fb] px-3 py-3">
                <div className="text-xs uppercase tracking-[0.14em] text-[#9ca3af]">目标收入</div>
                <div className="mt-1 text-[20px] font-semibold text-[#111827]">¥{liveGoal.targetIncome || 0}</div>
              </div>
              <div className="rounded-[18px] bg-[#f5fbf7] px-3 py-3">
                <div className="text-xs uppercase tracking-[0.14em] text-[#9ca3af]">累计收入</div>
                <div className="mt-1 text-[20px] font-semibold text-[#34c759]">¥{totalIncome}</div>
              </div>
            </div>
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
                          className="w-3 rounded-full bg-[#8b5cf6]/70"
                          style={{ height: `${Math.max(16, (point.duration / maxDuration) * 92)}px` }}
                        />
                        <div
                          className="w-3 rounded-full bg-[#34c759]/85"
                          style={{ height: `${Math.max(18, (point.actual / maxActual) * 110)}px` }}
                        />
                      </div>
                      <div className="text-center text-[11px] text-[#6b7280]">{point.date}</div>
                    </div>
                  ))}
                </div>

                <svg
                  viewBox="0 0 320 160"
                  className="pointer-events-none absolute bottom-6 left-0 right-0 mx-auto h-[calc(100%-24px)] w-[calc(100%-8px)] overflow-visible"
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
                    points={chartGeometry.incomeLine}
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                    strokeDasharray="0"
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
                    const incomeY = 160 - (point.cumulativeIncome / maxCumulative) * 160;
                    const idealY = 160 - (point.idealCumulative / maxCumulative) * 160;
                    return (
                      <g key={`${point.date}-node`}>
                        {point.incomeIncrement > 0 && (
                          <text
                            x={x}
                            y={Math.max(14, incomeY - 10)}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="700"
                            fill="#0f766e"
                          >
                            +¥{Math.round(point.incomeIncrement)}
                          </text>
                        )}
                        <circle cx={x} cy={incomeY} r="4.5" fill="#ffffff" stroke="#14b8a6" strokeWidth="2.5" />
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
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />投入时间柱</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#34c759]" />实际产出柱</div>
            <div className="flex items-center gap-2"><span className="h-[2px] w-4 bg-[#ff5a5f]" />累计实际折线</div>
            <div className="flex items-center gap-2"><span className="h-[2px] w-4 bg-[#14b8a6]" />累计收入线</div>
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
            {liveGoal.dimensions.map((dimension) => {
              const progressValue = dimension.targetValue > 0 ? Math.round((dimension.currentValue / dimension.targetValue) * 100) : 0;
              return (
                <div key={dimension.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#111827]">{dimension.name}</span>
                    <span className="text-[#6b7280]">{dimension.currentValue} / {dimension.targetValue} {dimension.unit}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#eef0f6]">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(progressValue, 100)}%`, backgroundColor: liveGoal.theme.color }} />
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
              <button
                key={record.id}
                type="button"
                onClick={() => openRecordEditor(record)}
                className="w-full rounded-[22px] border border-[#d9ecff] bg-[linear-gradient(180deg,#f9fbff_0%,#f4f8ff_100%)] px-4 py-4 text-left shadow-[0_12px_30px_rgba(10,132,255,0.06)] transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A84FF] shadow-sm">
                        可编辑
                      </div>
                      <div className="text-xs text-[#9ca3af]">点击进入编辑态</div>
                    </div>
                    <div className="mt-2 font-medium text-[#111827]">{record.taskTitle}</div>
                    <div className="mt-1 text-xs text-[#6b7280]">{new Date(record.createdAt).toLocaleString('zh-CN')}</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#111827] shadow-sm">{record.durationMinutes} 分钟</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {record.dimensionResults.map((item) => (
                    <span key={`${record.id}-${item.dimensionId}`} className="rounded-full bg-white px-3 py-1 text-xs text-[#0A84FF] shadow-sm">
                      {item.dimensionName} +{item.value}{item.unit}
                    </span>
                  ))}
                </div>
              </button>
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

