import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { LongTermGoal } from '@/types';

interface TaskCompletionEfficiencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    effectiveMinutes: number;
    goalId: string;
    values: Record<string, string>;
    note: string;
  }) => boolean | void;
  taskTitle: string;
  actualDurationMinutes: number;
  isDark: boolean;
  accentColor: string;
  goldReward?: number;
  forceMandatoryReflection?: boolean;
  matchedGoals: LongTermGoal[];
  allGoals: LongTermGoal[];
  initialGoalId?: string;
  initialValues?: Record<string, string>;
  initialNote?: string;
  initialEffectiveMinutes?: number;
}

export default function TaskCompletionEfficiencyModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  actualDurationMinutes,
  isDark: _isDark,
  accentColor: _accentColor,
  goldReward = 0,
  forceMandatoryReflection = false,
  matchedGoals,
  allGoals,
  initialGoalId = '',
  initialValues = {},
  initialNote = '',
  initialEffectiveMinutes,
}: TaskCompletionEfficiencyModalProps) {
  const [effectiveMinutes, setEffectiveMinutes] = useState(Math.max(0, initialEffectiveMinutes ?? actualDurationMinutes));
  const [goalId, setGoalId] = useState(initialGoalId);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    setEffectiveMinutes(Math.max(0, initialEffectiveMinutes ?? actualDurationMinutes));
    setGoalId(initialGoalId);
    setValues(initialValues);
    setNote(initialNote);
  }, [initialEffectiveMinutes, actualDurationMinutes, initialGoalId, initialValues, initialNote, isOpen]);

  if (!isOpen) return null;

  const palette = {
    rose: '#8E5F6B',
    sage: '#6F8577',
    amber: '#A07D56',
    plum: '#7B6A8F',
    gold: '#B79B5B',
    brick: '#9B625A',
    ink: '#2F2A26',
    subtext: '#6B625B',
    line: '#D8D0C8',
    panel: '#F4F0EA',
    white: '#FFFFFF',
    softBlue: '#E8F1FF',
    blue: _accentColor || '#3B82F6',
    mist: _isDark ? 'rgba(255,255,255,0.06)' : '#F8F4EE',
  };

  const goalOptions = useMemo(() => {
    const base = matchedGoals.length > 0 ? matchedGoals : allGoals;
    const map = new Map(base.map((goal) => [goal.id, goal]));
    allGoals.forEach((goal) => {
      if (!map.has(goal.id)) map.set(goal.id, goal);
    });
    return Array.from(map.values());
  }, [matchedGoals, allGoals]);

  const selectedGoal = goalOptions.find((goal) => goal.id === goalId) || goalOptions[0] || null;
  const effectiveRatio = actualDurationMinutes > 0 ? Math.round((effectiveMinutes / actualDurationMinutes) * 100) : 0;

  const getEfficiencyLevel = (ratio: number): { label: string; emoji: string; color: string } => {
    if (ratio >= 90) return { label: '超棒', emoji: '🌟', color: palette.gold };
    if (ratio >= 70) return { label: '不错', emoji: '🎈', color: palette.sage };
    if (ratio >= 50) return { label: '还行', emoji: '🍬', color: palette.amber };
    return { label: '加油', emoji: '🌈', color: palette.plum };
  };

  const level = getEfficiencyLevel(effectiveRatio);

  const updateDimensionValue = (dimensionId: string, nextValue: number) => {
    const safeValue = Math.max(0, Number(nextValue.toFixed(1)));
    setValues((prev) => ({
      ...prev,
      [dimensionId]: String(safeValue),
    }));
  };

  const handleGoalChange = (nextGoalId: string) => {
    setGoalId(nextGoalId);
    const nextGoal = goalOptions.find((goal) => goal.id === nextGoalId);
    const nextValues = (nextGoal?.dimensions || []).reduce<Record<string, string>>((acc, dimension) => {
      acc[dimension.id] = values[dimension.id] ?? '0';
      return acc;
    }, {});
    setValues(nextValues);
  };

  const handleConfirm = () => {
    const result = onConfirm({
      effectiveMinutes,
      goalId,
      values,
      note: note.trim(),
    });

    if (result === false) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md max-h-[85vh] rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: palette.panel }}
      >
        <button
          onClick={onClose}
          disabled={forceMandatoryReflection}
          className="absolute top-4 right-4 p-2 rounded-full transition-all z-10 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: palette.rose, color: 'white' }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1 px-5 pt-5 pb-4" style={{ maxHeight: 'calc(85vh - 96px)' }}>
          <div
            className="mb-4 rounded-[28px] border px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
            style={{
              background: goldReward > 0
                ? `linear-gradient(135deg, ${palette.gold} 0%, #C9AA63 100%)`
                : `linear-gradient(135deg, ${palette.white} 0%, ${palette.mist} 100%)`,
              borderColor: goldReward > 0 ? palette.gold + '66' : palette.line,
            }}
          >
            <div className="flex items-start gap-3 pr-10">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
                style={{ backgroundColor: goldReward > 0 ? 'rgba(255,255,255,0.22)' : palette.panel }}
              >
                {goldReward > 0 ? '💰' : '✨'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[24px] leading-none font-black tracking-[-0.04em]" style={{ color: palette.ink }}>
                    {goldReward > 0 ? `+${goldReward} 金币` : '任务完成'}
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.28)', color: palette.ink }}
                  >
                    已完成
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium leading-6" style={{ color: palette.subtext }}>
                  {taskTitle}
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap text-xs font-semibold" style={{ color: palette.subtext }}>
                  <span className="rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.26)' }}>
                    只需填写这一个弹窗
                  </span>
                  <span className="rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.26)' }}>
                    完成后自动写入分析
                  </span>
                </div>
              </div>
            </div>
          </div>

          {forceMandatoryReflection && (
            <div className="mb-6 p-4 rounded-2xl border-2" style={{ backgroundColor: palette.brick + '16', borderColor: palette.brick }}>
              <p className="text-sm font-bold" style={{ color: palette.brick }}>
                该任务已触发强制追责流程。你必须完成当前填写，任务才可以被正式完成。
              </p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: palette.subtext }}>时间评估</div>
                <span className="font-bold text-lg" style={{ color: palette.ink }}>⏱️ 有效时间</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 px-4 py-2 rounded-full shadow-md"
                  style={{ backgroundColor: level.color, color: palette.white }}
                >
                  <span className="text-xl">{level.emoji}</span>
                  <span className="font-black text-lg">{effectiveRatio}%</span>
                </div>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: level.color + '40', color: level.color }}
                >
                  {level.label}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-[24px] mb-3 shadow-sm border" style={{ backgroundColor: palette.white, borderColor: palette.line }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: palette.subtext }}>当前换算</div>
                  <div className="mt-2 text-[18px] font-medium" style={{ color: palette.subtext }}>
                    {(effectiveMinutes / 60).toFixed(1)} 小时
                  </div>
                  <div className="mt-2 text-xs" style={{ color: palette.subtext }}>
                    有效时间 / 总时长：{effectiveMinutes} / {actualDurationMinutes} 分钟
                  </div>
                </div>
                <div className="rounded-[20px] px-3 py-2 text-right" style={{ backgroundColor: palette.softBlue, color: palette.blue }}>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em]">有效率</div>
                  <div className="mt-1 text-[24px] font-semibold tracking-[-0.04em]">
                    {effectiveRatio}%
                  </div>
                </div>
              </div>

              <div className="relative mt-5 px-1">
                <input
                  type="range"
                  min="0"
                  max={actualDurationMinutes}
                  step={1}
                  value={effectiveMinutes}
                  onChange={(e) => setEffectiveMinutes(Number(e.target.value))}
                  className="w-full h-4 rounded-full appearance-none cursor-pointer transition-all"
                  style={{
                    background: `linear-gradient(to right, ${level.color} 0%, ${level.color} ${effectiveRatio}%, ${palette.line} ${effectiveRatio}%, ${palette.line} 100%)`,
                  }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: ${level.color};
                    cursor: pointer;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                    border: 3px solid ${palette.white};
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: ${level.color};
                    cursor: pointer;
                    border: 3px solid ${palette.white};
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                  }
                `}</style>
              </div>

              <div className="flex justify-between mt-2 text-xs font-medium" style={{ color: palette.subtext }}>
                <span>0 分钟</span>
                <span>实际完成 {actualDurationMinutes} 分钟</span>
                <span>{actualDurationMinutes} 分钟</span>
              </div>
            </div>

            <div className="p-4 rounded-[24px] border-2" style={{ backgroundColor: palette.white, borderColor: palette.sage + '55' }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm" style={{ color: palette.subtext }}>有效时间</div>
                  <div className="mt-2 text-[42px] font-semibold tracking-[-0.06em]" style={{ color: palette.ink }}>
                    {effectiveMinutes}
                  </div>
                  <div className="text-base" style={{ color: palette.subtext }}>分钟</div>
                </div>
                <div className="rounded-[18px] px-3 py-2 text-right" style={{ backgroundColor: palette.softBlue }}>
                  <div className="text-xs uppercase tracking-[0.16em]" style={{ color: palette.subtext }}>总时长</div>
                  <div className="mt-1 text-sm font-semibold" style={{ color: palette.ink }}>{actualDurationMinutes} 分钟</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-[24px] border px-4 py-4" style={{ backgroundColor: palette.white, borderColor: palette.line }}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: palette.subtext }}>目标归属</div>
                <div className="mt-1 text-sm font-bold" style={{ color: palette.ink }}>🎯 关联目标</div>
              </div>
              {goalId && (
                <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: palette.panel, color: palette.rose }}>
                  已选择
                </span>
              )}
            </div>
            <select
              value={goalId}
              onChange={(e) => handleGoalChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 text-sm outline-none"
              style={{
                backgroundColor: palette.white,
                borderColor: palette.line,
                color: palette.ink,
              }}
            >
              <option value="">请选择目标</option>
              {goalOptions.map((goal) => (
                <option key={goal.id} value={goal.id}>{goal.name}</option>
              ))}
            </select>
          </div>

          {selectedGoal && goalId && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: palette.white }}>
                  <div className="text-xs uppercase tracking-[0.14em]" style={{ color: palette.subtext }}>目标收入</div>
                  <div className="mt-1 text-[20px] font-semibold" style={{ color: palette.ink }}>¥{selectedGoal.targetIncome || 0}</div>
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#EEF9F2' }}>
                  <div className="text-xs uppercase tracking-[0.14em]" style={{ color: palette.subtext }}>累计收入</div>
                  <div className="mt-1 text-[20px] font-semibold" style={{ color: '#2F855A' }}>¥{selectedGoal.currentIncome || 0}</div>
                </div>
              </div>

              <div className="mb-4 rounded-[24px] border p-4" style={{ backgroundColor: palette.white, borderColor: palette.line }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: palette.subtext }}>关键结果</div>
                    <div className="mt-1 text-sm font-bold" style={{ color: palette.ink }}>📈 填写本次产出</div>
                  </div>
                  <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: palette.panel, color: palette.amber }}>
                    直接写入分析
                  </span>
                </div>
                <div className="space-y-3">
                  {selectedGoal.dimensions.map((dimension) => {
                    const step = Number.isInteger(dimension.targetValue) ? 1 : 0.1;
                    const currentValue = Number(values[dimension.id] || 0);
                    const progressPercent = Math.min(100, (currentValue / Math.max(dimension.targetValue, 1)) * 100);

                    return (
                      <div key={dimension.id} className="rounded-[22px] p-3 border" style={{ backgroundColor: palette.panel, borderColor: palette.line }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium" style={{ color: palette.ink }}>{dimension.name}</div>
                            <div className="mt-1 text-xs" style={{ color: palette.subtext }}>目标 {dimension.targetValue} {dimension.unit}</div>
                          </div>
                          <div className="rounded-full px-3 py-1 text-sm font-semibold shadow-sm" style={{ backgroundColor: palette.softBlue, color: palette.blue }}>
                            本次 {currentValue}/{dimension.targetValue}
                          </div>
                        </div>

                        <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: '#E7E0D7' }}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${palette.amber}, ${palette.gold})` }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: palette.subtext }}>
                          <span>本次 +{currentValue} {dimension.unit}</span>
                          <span>{progressPercent.toFixed(0)}%</span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDimensionValue(dimension.id, Math.max(0, currentValue - step))}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-[24px] font-semibold shadow-sm active:scale-95"
                            style={{ backgroundColor: '#EFE8FF', color: '#6D4AFF' }}
                          >
                            −
                          </button>

                          <div className="flex flex-1 items-center rounded-[18px] border px-3 py-2 shadow-sm" style={{ borderColor: palette.line, backgroundColor: palette.white }}>
                            <input
                              type="number"
                              min={0}
                              step={step}
                              inputMode="decimal"
                              value={values[dimension.id] ?? '0'}
                              onChange={(e) => setValues((prev) => ({ ...prev, [dimension.id]: e.target.value === '' ? '' : e.target.value }))}
                              className="w-full bg-transparent text-center text-[24px] font-semibold tracking-[-0.04em] outline-none"
                              style={{ color: palette.ink }}
                            />
                            <div className="ml-2 shrink-0 text-[11px]" style={{ color: palette.subtext }}>{dimension.unit}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateDimensionValue(dimension.id, currentValue + step)}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-[24px] font-semibold shadow-sm active:scale-95"
                            style={{ backgroundColor: '#E8FFF3', color: '#169B62' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4 rounded-[24px] border p-4" style={{ backgroundColor: palette.white, borderColor: palette.line }}>
                <label className="block text-sm font-bold mb-2" style={{ color: palette.ink }}>
                  📝 关键结果说明
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例如：今天完成 2 条脚本、1 次复盘，推进了目标数据。"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border-2 text-sm resize-none focus:outline-none transition-all shadow-sm"
                  style={{
                    backgroundColor: palette.white,
                    borderColor: palette.line,
                    color: palette.ink
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex-shrink-0 p-5 pt-3 border-t-4" style={{ borderColor: palette.rose + '22' }}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={forceMandatoryReflection}
              className="flex-1 py-3 rounded-2xl font-bold transition-all hover:scale-105 shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: palette.plum + '22', color: palette.plum }}
            >
              <span className="text-lg">👋</span> 取消
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${palette.rose} 0%, ${palette.plum} 100%)` }}
            >
              <span className="text-lg">✨</span> 确认完成并写入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
