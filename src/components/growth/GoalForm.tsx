import { useState } from 'react';
import { X, Save, Target } from 'lucide-react';

interface GoalFormData {
  name: string;
  type: 'numeric' | 'milestone' | 'habit';
  targetValue: number;
  unit?: string;
  deadline?: string;
  relatedDimensions: string[];
  description: string;
}

interface GoalFormProps {
  initialData?: GoalFormData & { currentValue?: number };
  dimensions: { id: string; name: string; icon: string; color: string }[];
  onSave: (data: GoalFormData) => void;
  onCancel: () => void;
  bgColor?: string;
}

export default function GoalForm({
  initialData,
  dimensions,
  onSave,
  onCancel,
  bgColor = '#e2d9bc',
}: GoalFormProps) {
  const [formData, setFormData] = useState<GoalFormData>(
    initialData || {
      name: '',
      type: 'numeric',
      targetValue: 100,
      unit: '',
      deadline: '',
      relatedDimensions: [],
      description: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 验证表单
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入目标名称';
    }

    if (formData.targetValue <= 0) {
      newErrors.targetValue = '目标值必须大于0';
    }

    if (formData.type === 'numeric' && !formData.unit?.trim()) {
      newErrors.unit = '数值型目标需要指定单位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  // 切换维度
  const toggleDimension = (dimensionId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedDimensions: prev.relatedDimensions.includes(dimensionId)
        ? prev.relatedDimensions.filter(id => id !== dimensionId)
        : [...prev.relatedDimensions, dimensionId],
    }));
  };

  // 目标类型配置
  const goalTypes = [
    {
      value: 'numeric' as const,
      label: '数值型',
      emoji: '📊',
      description: '追踪可量化的数值目标',
      example: '例如：阅读50本书、跑步500公里',
    },
    {
      value: 'milestone' as const,
      label: '里程碑',
      emoji: '🏁',
      description: '达成特定的里程碑事件',
      example: '例如：完成项目、获得证书',
    },
    {
      value: 'habit' as const,
      label: '习惯型',
      emoji: '🔄',
      description: '养成持续的好习惯',
      example: '例如：每天运动、每周学习',
    },
  ];

  const selectedType = goalTypes.find(t => t.value === formData.type)!;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: bgColor }}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.1)', backgroundColor: bgColor }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DD617C' }}>
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                {initialData ? '编辑目标' : '创建新目标'}
              </h2>
              <p className="text-sm text-neutral-600">设定目标，追踪进展</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(221, 97, 124, 0.2)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: bgColor }}>
          {/* 目标名称 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              目标名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：今年阅读50本书"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                errors.name ? 'border-red-500' : 'border-neutral-300'
              }`}
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px'
              }}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* 目标类型 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              目标类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {goalTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.type === type.value
                      ? 'border-pink-500'
                      : 'border-neutral-300 hover:border-pink-300'
                  }`}
                  style={{
                    backgroundColor: formData.type === type.value ? 'rgba(221, 97, 124, 0.15)' : 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <div className="text-3xl mb-2">{type.emoji}</div>
                  <div className="font-semibold text-neutral-900 mb-1">{type.label}</div>
                  <div className="text-xs text-neutral-600">{type.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(221, 97, 124, 0.15)' }}>
              <p className="text-sm text-neutral-900">
                💡 {selectedType.example}
              </p>
            </div>
          </div>

          {/* 目标值和单位 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                目标值 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                min="0"
                step={formData.type === 'milestone' ? '1' : '0.1'}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                  errors.targetValue ? 'border-red-500' : 'border-neutral-300'
                }`}
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '16px'
                }}
              />
              {errors.targetValue && (
                <p className="text-red-500 text-sm mt-1">{errors.targetValue}</p>
              )}
            </div>

            {formData.type === 'numeric' && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  单位 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="例如：本、公里、小时"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                    errors.unit ? 'border-red-500' : 'border-neutral-300'
                  }`}
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '16px'
                  }}
                />
                {errors.unit && (
                  <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
                )}
              </div>
            )}
          </div>

          {/* 截止日期 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              截止日期 <span className="text-neutral-500 text-xs font-normal">(可选)</span>
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 关联维度 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              关联成长维度
              <span className="ml-2 text-sm font-normal text-neutral-600">
                (完成相关任务会增加目标进度)
              </span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dimensions.map((dimension) => (
                <button
                  key={dimension.id}
                  type="button"
                  onClick={() => toggleDimension(dimension.id)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.relatedDimensions.includes(dimension.id)
                      ? 'border-pink-500'
                      : 'border-neutral-300 hover:border-pink-300'
                  }`}
                  style={{
                    backgroundColor: formData.relatedDimensions.includes(dimension.id) 
                      ? 'rgba(221, 97, 124, 0.15)' 
                      : 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${dimension.color}20` }}
                  >
                    {dimension.icon}
                  </div>
                  <span className="font-medium text-neutral-900 text-sm">{dimension.name}</span>
                  {formData.relatedDimensions.includes(dimension.id) && (
                    <span className="ml-auto" style={{ color: '#DD617C' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 目标描述 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              目标描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这个目标的意义和计划..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none resize-none"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 预览 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              预览效果
            </label>
            <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
              <div className="rounded-xl shadow-md overflow-hidden max-w-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                <div className="h-2" style={{ backgroundColor: '#DD617C' }} />
                <div className="p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(221, 97, 124, 0.2)', color: '#DD617C' }}>
                      {selectedType.emoji} {selectedType.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-neutral-900 mb-4">
                    {formData.name || '目标名称'}
                  </h3>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-600">目标进度</span>
                      <span className="text-lg font-bold" style={{ color: '#DD617C' }}>
                        0 / {formData.targetValue} {formData.unit || ''}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '0%', backgroundColor: '#DD617C' }} />
                    </div>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {formData.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)', backgroundColor: bgColor }}>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg transition-colors font-medium"
            style={{ backgroundColor: 'rgba(221, 97, 124, 0.2)', color: '#DD617C' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg transition-colors font-medium"
            style={{ backgroundColor: '#DD617C', color: 'white' }}
          >
            <Save className="w-4 h-4" />
            <span>保存目标</span>
          </button>
        </div>
      </div>
    </div>
  );
}

