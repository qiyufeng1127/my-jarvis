import { useMemo, useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useKeyboardAvoidance } from '@/hooks';
import type { GoalMetric, GoalTheme, GoalType } from '@/types';

export interface GoalFormData {
  name: string;
  description: string;
  type: GoalType;
  startDate: string;
  endDate: string;
  estimatedTotalHours: number;
  targetIncome: number;
  dimensions: GoalMetric[];
  theme: GoalTheme;
}

interface GoalFormProps {
  initialData?: GoalFormData & { currentValue?: number };
  dimensions: { id: string; name: string; icon: string; color: string }[];
  onSave: (data: GoalFormData) => void;
  onCancel: () => void;
  bgColor?: string;
}

const themeOptions: GoalTheme[] = [
  { color: '#10B981', label: '青绿' },
  { color: '#0A84FF', label: '海蓝' },
  { color: '#FF2D55', label: '洋红' },
  { color: '#FF9500', label: '琥珀' },
  { color: '#8B5CF6', label: '暮紫' },
];

function createMetric(index = 0): GoalMetric {
  return {
    id: `metric-${Date.now()}-${index}`,
    name: '',
    unit: '',
    targetValue: 1,
    currentValue: 0,
    weight: index === 0 ? 100 : 0,
  };
}

export default function GoalForm({
  initialData,
  dimensions: _dimensions,
  onSave,
  onCancel,
  bgColor = '#efeff4',
}: GoalFormProps) {
  const scrollRef = useRef<HTMLFormElement>(null);
  const { handleFocusCapture, scrollIntoSafeView } = useKeyboardAvoidance(scrollRef);

  const [formData, setFormData] = useState<GoalFormData>(
    initialData || {
      name: '',
      description: '',
      type: 'numeric',
      startDate: '',
      endDate: '',
      estimatedTotalHours: 0,
      targetIncome: 0,
      dimensions: [createMetric(0), createMetric(1)],
      theme: themeOptions[0],
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const durationDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.startDate, formData.endDate]);

  const estimatedDailyHours = useMemo(() => {
    if (!durationDays || !formData.estimatedTotalHours) return 0;
    return Number((formData.estimatedTotalHours / durationDays).toFixed(1));
  }, [durationDays, formData.estimatedTotalHours]);

  const totalWeight = useMemo(
    () => formData.dimensions.reduce((sum, item) => sum + Number(item.weight || 0), 0),
    [formData.dimensions]
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = '请输入目标名称';
    if (!formData.startDate) nextErrors.startDate = '请选择开始日期';
    if (!formData.endDate) nextErrors.endDate = '请选择结束日期';
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      nextErrors.endDate = '结束日期不能早于开始日期';
    }
    if (formData.estimatedTotalHours <= 0) nextErrors.estimatedTotalHours = '请填写预计总时长';
    if (formData.dimensions.length === 0) nextErrors.dimensions = '至少保留一个客观维度';
    if (totalWeight !== 100) nextErrors.weight = '当前权重总和必须等于 100%';

    formData.dimensions.forEach((item, index) => {
      if (!item.name.trim()) nextErrors[`metric-name-${index}`] = '请输入维度名称';
      if (!item.unit.trim()) nextErrors[`metric-unit-${index}`] = '请输入单位';
      if (!item.targetValue || item.targetValue <= 0) nextErrors[`metric-target-${index}`] = '请输入目标总量';
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateMetric = (metricId: string, updates: Partial<GoalMetric>) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((item) => (item.id === metricId ? { ...item, ...updates } : item)),
    }));
  };

  const addMetric = () => {
    setFormData((prev) => ({
      ...prev,
      dimensions: [...prev.dimensions, createMetric(prev.dimensions.length)],
    }));
  };

  const removeMetric = (metricId: string) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: prev.dimensions.length === 1 ? prev.dimensions : prev.dimensions.filter((item) => item.id !== metricId),
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f3f2f7] keyboard-aware-modal-shell">
      <form
        ref={scrollRef}
        onFocusCapture={handleFocusCapture}
        onSubmit={handleSubmit}
        className="min-h-full w-full keyboard-aware-scroll"
      >
        <div className="min-h-full w-full bg-[#f3f2f7] px-3 py-3 pb-24 keyboard-aware-modal-card sm:px-4 sm:py-4 sm:pb-28">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" onClick={onCancel} className="rounded-full border border-[#e8e7ef] bg-white px-4 py-2 text-[15px] font-semibold text-[#4a4658] shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
              取消
            </button>
            <div className="text-[18px] font-semibold tracking-[0.01em] text-[#17151f]">编辑目标</div>
            <button type="submit" className="rounded-full bg-[linear-gradient(135deg,#1a8cff,#0a84ff)] px-4 py-2 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(10,132,255,0.24)]">
              保存
            </button>
          </div>

          <div className="space-y-3">
            <section className="rounded-[22px] border border-[#f0eef5] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:px-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                onFocus={() => scrollIntoSafeView(document.activeElement as HTMLElement | null)}
                placeholder="填写目标名称"
                className="w-full rounded-[16px] bg-[#f7f7fa] px-4 py-2.5 text-[17px] font-semibold text-[#111111] placeholder:text-[#8e8e93] outline-none"
              />
              {errors.name && <p className="mt-2 text-sm text-[#ff3b30]">{errors.name}</p>}
            </section>

            <section className="rounded-[22px] border border-[#f0eef5] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:px-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#ececf1] pb-2.5">
                  <span className="text-[16px] text-[#3a3a3c]">开始日期</span>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="rounded-full bg-[#f3f3f6] px-3 py-1.5 text-[15px] text-[#111111] outline-none [color-scheme:light]"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-[#ececf1] pb-2.5">
                  <span className="text-[16px] text-[#3a3a3c]">结束日期</span>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="rounded-full bg-[#f3f3f6] px-3 py-1.5 text-[15px] text-[#111111] outline-none [color-scheme:light]"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[15px] text-[#8e8e93]">持续天数</span>
                  <span className="text-[17px] font-medium text-[#8e8e93]">{durationDays || 0}</span>
                </div>
              </div>
              {(errors.startDate || errors.endDate) && <p className="mt-2 text-sm text-[#ff3b30]">{errors.startDate || errors.endDate}</p>}
            </section>

            <section className="rounded-[22px] border border-[#f0eef5] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:px-4">
              <div className="mb-2 text-[15px] font-medium text-[#3a3a3c]">预计耗费总时长</div>
              <div className="flex items-end justify-between gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedTotalHours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, estimatedTotalHours: Number(e.target.value || 0) }))}
                  onFocus={() => scrollIntoSafeView(document.activeElement as HTMLElement | null)}
                  className="w-full rounded-[16px] bg-[#f7f7fa] px-4 py-2.5 text-[20px] font-semibold text-[#111111] placeholder:text-[#8e8e93] outline-none"
                />
                <div className="whitespace-nowrap pb-1.5 text-[14px] text-[#8e8e93]">约 {estimatedDailyHours || 0} h / 天</div>
              </div>
              <div className="mt-1 text-[12px] text-[#8e8e93]">可选，单位：小时</div>
              {errors.estimatedTotalHours && <p className="mt-2 text-sm text-[#ff3b30]">{errors.estimatedTotalHours}</p>}
            </section>

            <section className="rounded-[22px] border border-[#f0eef5] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:px-4">
              <div className="mb-2 text-[15px] font-medium text-[#3a3a3c]">目标收入</div>
              <div className="flex items-end justify-between gap-3">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.targetIncome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetIncome: Number(e.target.value || 0) }))}
                  onFocus={() => scrollIntoSafeView(document.activeElement as HTMLElement | null)}
                  className="w-full rounded-[16px] bg-[#f7f7fa] px-4 py-2.5 text-[20px] font-semibold text-[#111111] placeholder:text-[#8e8e93] outline-none"
                />
                <div className="whitespace-nowrap pb-1.5 text-[14px] text-[#8e8e93]">元</div>
              </div>
              <div className="mt-1 text-[12px] text-[#8e8e93]">用于查看该目标的收入完成情况</div>
            </section>

            <section className="rounded-[22px] border border-[#f0eef5] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:px-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[15px] font-medium text-[#3a3a3c]">客观进度</div>
                  <div className="mt-1 text-[12px] leading-5 text-[#8e8e93]">按项目维度量化客观进度，在效率权重里合并成一条总进度。</div>
                </div>
              </div>

              <div className="space-y-3">
                {formData.dimensions.map((item, index) => (
                  <div key={item.id} className="rounded-[18px] border border-[#eceaf1] bg-[#f7f7fa] px-3 py-3">
                    <div className="grid grid-cols-1 gap-2.5">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateMetric(item.id, { name: e.target.value })}
                        onFocus={() => scrollIntoSafeView(document.activeElement as HTMLElement | null)}
                        placeholder="名称"
                        className="w-full rounded-[12px] border border-[#e4e4ea] bg-white px-3 py-2.5 text-[15px] text-[#111111] placeholder:text-[#8e8e93] outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateMetric(item.id, { unit: e.target.value })}
                          onFocus={() => scrollIntoSafeView(document.activeElement as HTMLElement | null)}
                          placeholder="单位"
                          className="w-full rounded-[12px] border border-[#e4e4ea] bg-white px-3 py-2.5 text-[15px] text-[#111111] placeholder:text-[#8e8e93] outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.targetValue}
                          onChange={(e) => updateMetric(item.id, { targetValue: Number(e.target.value || 0) })}
                          placeholder="目标总量"
                          className="w-full rounded-[12px] border border-[#e4e4ea] bg-white px-3 py-2.5 text-[15px] text-[#111111] placeholder:text-[#8e8e93] outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.weight}
                          onChange={(e) => updateMetric(item.id, { weight: Number(e.target.value || 0) })}
                          className="w-20 rounded-[12px] border border-[#e4e4ea] bg-white px-3 py-2.5 text-[15px] text-[#111111] placeholder:text-[#8e8e93] outline-none"
                        />
                        <span className="text-[15px] text-[#3a3a3c]">%</span>
                        <button type="button" onClick={() => removeMetric(item.id)} className="ml-auto rounded-full border border-[#e7e7ee] bg-white p-2 text-[#0A84FF] shadow-sm">
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {(errors[`metric-name-${index}`] || errors[`metric-unit-${index}`] || errors[`metric-target-${index}`]) && (
                      <p className="mt-2 text-sm text-[#ff3b30]">
                        {errors[`metric-name-${index}`] || errors[`metric-unit-${index}`] || errors[`metric-target-${index}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-[#ececf1] pt-3">
                <div className="text-[15px] font-medium text-[#3a3a3c]">当前权重和：{totalWeight}%</div>
                {errors.weight && <p className="mt-2 text-sm text-[#ff3b30]">{errors.weight}</p>}
              </div>

              <button type="button" onClick={addMetric} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#eef6ff] px-3 py-2 text-[15px] font-semibold text-[#007aff]">
                <Plus className="h-4 w-4" /> 添加维度
              </button>
            </section>

            <section className="rounded-[22px] border border-[#f0eef5] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:px-4">
              <div className="text-[15px] font-medium text-[#3a3a3c]">主题颜色</div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {themeOptions.map((theme) => {
                  const active = formData.theme.color === theme.color;
                  return (
                    <button key={theme.color} type="button" onClick={() => setFormData((prev) => ({ ...prev, theme }))} className="flex flex-col items-center gap-1.5">
                      <span
                        className="block h-10 w-10 rounded-full border-[3px] transition"
                        style={{
                          backgroundColor: theme.color,
                          borderColor: active ? '#111111' : 'transparent',
                        }}
                      />
                      <span className="text-[11px] text-[#6b7280]">{theme.label}</span>
                    </button>
                  );
                })}

                <label className="flex cursor-pointer flex-col items-center gap-1.5">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] transition"
                    style={{
                      backgroundColor: formData.theme.color,
                      borderColor: themeOptions.some((theme) => theme.color === formData.theme.color) ? 'transparent' : '#111111',
                    }}
                  >
                    <span className="text-[10px] font-semibold text-white mix-blend-difference">自定义</span>
                  </span>
                  <span className="text-[11px] text-[#6b7280]">自定义</span>
                  <input
                    type="color"
                    value={formData.theme.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        theme: { color: e.target.value, label: '自定义' },
                      }))
                    }
                    className="sr-only"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-[16px] bg-[#f7f7fa] px-4 py-2.5">
                <span className="text-[12px] text-[#8e8e93]">当前主题色</span>
                <span className="text-[14px] font-medium text-[#111111]">{formData.theme.color.toUpperCase()}</span>
              </div>
              <div className="mt-2 text-[12px] leading-5 text-[#8e8e93]">可选预设颜色，也可以使用自定义颜色作为目标展示色</div>
            </section>

          </div>
        </div>
      </form>
    </div>
  );
}
