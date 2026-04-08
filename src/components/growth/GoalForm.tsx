import { useMemo, useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useKeyboardAvoidance } from '@/hooks';
import type { GoalMetric, GoalProjectBinding, GoalTheme, GoalType } from '@/types';

export interface GoalFormData {
  name: string;
  description: string;
  type: GoalType;
  startDate: string;
  endDate: string;
  estimatedTotalHours: number;
  targetIncome: number;
  dimensions: GoalMetric[];
  projectBindings: GoalProjectBinding[];
  theme: GoalTheme;
  showInFuture30Chart: boolean;
  relatedDimensions: string[];
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

const projectOptions: GoalProjectBinding[] = [
  { id: 'photo-work', name: '照相馆工作', color: '#10B981' },
  { id: 'xiaohongshu', name: '发照相馆小红书', color: '#0A84FF' },
  { id: 'customer-service', name: '接待顾客', color: '#FF9500' },
  { id: 'wechat', name: '工作微信处理', color: '#34C759' },
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
  dimensions,
  onSave,
  onCancel,
  bgColor = '#efeff4',
}: GoalFormProps) {
  const scrollRef = useRef<HTMLFormElement>(null);
  const { handleFocusCapture } = useKeyboardAvoidance(scrollRef);

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
      projectBindings: [projectOptions[0]],
      theme: themeOptions[0],
      showInFuture30Chart: true,
      relatedDimensions: [],
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

  const toggleProjectBinding = (project: GoalProjectBinding) => {
    setFormData((prev) => {
      const exists = prev.projectBindings.some((item) => item.id === project.id);
      return {
        ...prev,
        projectBindings: exists
          ? prev.projectBindings.filter((item) => item.id !== project.id)
          : [...prev.projectBindings, project],
      };
    });
  };

  const toggleRelatedDimension = (dimensionId: string) => {
    setFormData((prev) => ({
      ...prev,
      relatedDimensions: prev.relatedDimensions.includes(dimensionId)
        ? prev.relatedDimensions.filter((id) => id !== dimensionId)
        : [...prev.relatedDimensions, dimensionId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#e9e9ee] keyboard-aware-modal-shell">
      <form
        ref={scrollRef}
        onFocusCapture={handleFocusCapture}
        onSubmit={handleSubmit}
        className="mx-auto min-h-full max-w-xl px-4 pb-16 keyboard-aware-scroll"
      >
        <div className="rounded-[32px] bg-white/85 px-4 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur keyboard-aware-modal-card">
          <div className="mb-5 flex items-center justify-between">
            <button type="button" onClick={onCancel} className="rounded-full bg-[#f5f5f8] px-4 py-2 text-[17px] font-medium text-[#3a3a3c]">
              取消
            </button>
            <div className="text-[20px] font-semibold text-[#111111]">编辑</div>
            <button type="submit" className="rounded-full bg-[#f5f5f8] px-4 py-2 text-[17px] font-semibold text-[#111111]">
              保存
            </button>
          </div>

          <div className="space-y-5">
            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="填写目标名称"
                className="w-full rounded-[18px] bg-[#f7f7fa] px-4 py-3 text-[18px] text-[#111111] outline-none"
              />
              {errors.name && <p className="mt-2 text-sm text-[#ff3b30]">{errors.name}</p>}
            </section>

            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#ececf1] pb-3">
                  <span className="text-[16px] text-[#3a3a3c]">开始日期</span>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="rounded-full bg-[#f3f3f6] px-4 py-2 text-[16px] text-[#111111] outline-none"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-[#ececf1] pb-3">
                  <span className="text-[16px] text-[#3a3a3c]">结束日期</span>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="rounded-full bg-[#f3f3f6] px-4 py-2 text-[16px] text-[#111111] outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[16px] text-[#8e8e93]">持续天数</span>
                  <span className="text-[18px] font-medium text-[#8e8e93]">{durationDays || 0}</span>
                </div>
              </div>
              {(errors.startDate || errors.endDate) && <p className="mt-2 text-sm text-[#ff3b30]">{errors.startDate || errors.endDate}</p>}
            </section>

            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="mb-3 text-[16px] text-[#3a3a3c]">预计耗费总时长</div>
              <div className="flex items-end justify-between gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedTotalHours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, estimatedTotalHours: Number(e.target.value || 0) }))}
                  className="w-full rounded-[18px] bg-[#f7f7fa] px-4 py-3 text-[22px] font-semibold text-[#111111] outline-none"
                />
                <div className="whitespace-nowrap pb-2 text-[16px] text-[#8e8e93]">约 {estimatedDailyHours || 0} h / 天</div>
              </div>
              <div className="mt-2 text-sm text-[#8e8e93]">可选，单位：小时</div>
              {errors.estimatedTotalHours && <p className="mt-2 text-sm text-[#ff3b30]">{errors.estimatedTotalHours}</p>}
            </section>

            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="mb-3 text-[16px] text-[#3a3a3c]">目标收入</div>
              <div className="flex items-end justify-between gap-3">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.targetIncome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetIncome: Number(e.target.value || 0) }))}
                  className="w-full rounded-[18px] bg-[#f7f7fa] px-4 py-3 text-[22px] font-semibold text-[#111111] outline-none"
                />
                <div className="whitespace-nowrap pb-2 text-[16px] text-[#8e8e93]">元</div>
              </div>
              <div className="mt-2 text-sm text-[#8e8e93]">用于查看该目标的收入完成情况</div>
            </section>

            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[16px] text-[#3a3a3c]">客观进度</div>
                  <div className="mt-1 text-sm text-[#8e8e93]">按项目维度量化客观进度，在效率权重里合并成一条总进度。</div>
                </div>
              </div>

              <div className="space-y-4">
                {formData.dimensions.map((item, index) => (
                  <div key={item.id} className="rounded-[22px] bg-[#f4f4f8] px-3 py-3">
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateMetric(item.id, { name: e.target.value })}
                        placeholder="名称"
                        className="w-full rounded-[14px] border border-[#e4e4ea] bg-white px-3 py-3 text-[16px] outline-none"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateMetric(item.id, { unit: e.target.value })}
                          placeholder="单位"
                          className="w-full rounded-[14px] border border-[#e4e4ea] bg-white px-3 py-3 text-[16px] outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.targetValue}
                          onChange={(e) => updateMetric(item.id, { targetValue: Number(e.target.value || 0) })}
                          placeholder="目标总量"
                          className="w-full rounded-[14px] border border-[#e4e4ea] bg-white px-3 py-3 text-[16px] outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.weight}
                          onChange={(e) => updateMetric(item.id, { weight: Number(e.target.value || 0) })}
                          className="w-24 rounded-[14px] border border-[#e4e4ea] bg-white px-3 py-3 text-[16px] outline-none"
                        />
                        <span className="text-[16px] text-[#3a3a3c]">%</span>
                        <button type="button" onClick={() => removeMetric(item.id)} className="ml-auto rounded-full bg-white p-2 text-[#0A84FF] shadow-sm">
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

              <div className="mt-4 border-t border-[#ececf1] pt-4">
                <div className="text-[16px] text-[#3a3a3c]">当前权重和：{totalWeight}%</div>
                {errors.weight && <p className="mt-2 text-sm text-[#ff3b30]">{errors.weight}</p>}
              </div>

              <button type="button" onClick={addMetric} className="mt-4 inline-flex items-center gap-2 text-[17px] font-medium text-[#007aff]">
                <Plus className="h-4 w-4" /> 添加维度
              </button>
            </section>

            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="text-[16px] text-[#3a3a3c]">绑定项目</div>
              <div className="mt-3 space-y-3">
                {projectOptions.map((project) => {
                  const active = formData.projectBindings.some((item) => item.id === project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => toggleProjectBinding(project)}
                      className="flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left transition"
                      style={{
                        borderColor: active ? project.color || '#0A84FF' : '#e7e7ed',
                        background: active ? `${project.color || '#0A84FF'}15` : '#ffffff',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color || '#0A84FF' }} />
                        <span className="text-[16px] text-[#111111]">{project.name}</span>
                      </div>
                      {active && <span className="text-[#007aff]">已绑定</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="text-[16px] text-[#3a3a3c]">主题颜色</div>
              <div className="mt-4 flex flex-wrap gap-4">
                {themeOptions.map((theme) => {
                  const active = formData.theme.color === theme.color;
                  return (
                    <button key={theme.color} type="button" onClick={() => setFormData((prev) => ({ ...prev, theme }))} className="flex flex-col items-center gap-2">
                      <span
                        className="block h-12 w-12 rounded-full border-4 transition"
                        style={{
                          backgroundColor: theme.color,
                          borderColor: active ? '#111111' : 'transparent',
                        }}
                      />
                      <span className="text-xs text-[#6b7280]">{theme.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 text-sm text-[#8e8e93]">从已选项目的颜色中选一个作为展示色</div>
            </section>

            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="text-[16px] text-[#3a3a3c]">关联成长维度</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {dimensions.map((dimension) => {
                  const active = formData.relatedDimensions.includes(dimension.id);
                  return (
                    <button
                      key={dimension.id}
                      type="button"
                      onClick={() => toggleRelatedDimension(dimension.id)}
                      className="flex items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition"
                      style={{
                        borderColor: active ? dimension.color : '#e7e7ed',
                        background: active ? `${dimension.color}18` : '#ffffff',
                      }}
                    >
                      <span className="text-xl">{dimension.icon}</span>
                      <span className="text-[15px] text-[#111111]">{dimension.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[17px] text-[#111111]">在「未来30天每日理想投入」图表中显示</div>
                  <div className="mt-1 text-sm text-[#8e8e93]">关闭后该目标将不出现在首页的未来30天堆叠图表中</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, showInFuture30Chart: !prev.showInFuture30Chart }))}
                  className={`relative h-8 w-14 rounded-full transition ${formData.showInFuture30Chart ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${formData.showInFuture30Chart ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}
