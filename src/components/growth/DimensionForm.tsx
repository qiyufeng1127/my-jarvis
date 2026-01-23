import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface DimensionFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  weight: number;
  relatedTaskTypes: string[];
}

interface DimensionFormProps {
  initialData?: DimensionFormData;
  onSave: (data: DimensionFormData) => void;
  onCancel: () => void;
}

// 预设图标库
const PRESET_ICONS = [
  '⚡', '🎯', '💪', '🧠', '❤️', '💰', '🎨', '📚',
  '🏃', '🎵', '🌟', '🔥', '💎', '🚀', '🌈', '⭐',
  '🎓', '💼', '🏆', '🎪', '🎭', '🎬', '📱', '💻',
  '🌍', '🌺', '🌸', '🍀', '🌙', '☀️', '⚽', '🎮',
];

// 预设颜色
const PRESET_COLORS = [
  '#3B82F6', // 蓝色
  '#10B981', // 绿色
  '#F59E0B', // 橙色
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#EF4444', // 红色
  '#14B8A6', // 青色
  '#F97316', // 深橙
  '#6366F1', // 靛蓝
  '#84CC16', // 黄绿
  '#A855F7', // 紫罗兰
  '#06B6D4', // 天蓝
];

// 任务类型
const TASK_TYPES = [
  { value: 'work', label: '工作类', emoji: '💼' },
  { value: 'study', label: '学习类', emoji: '📚' },
  { value: 'health', label: '健康类', emoji: '💪' },
  { value: 'life', label: '生活类', emoji: '🏠' },
  { value: 'social', label: '社交类', emoji: '👥' },
  { value: 'other', label: '其他', emoji: '📌' },
];

export default function DimensionForm({
  initialData,
  onSave,
  onCancel,
}: DimensionFormProps) {
  const [formData, setFormData] = useState<DimensionFormData>(
    initialData || {
      name: '',
      description: '',
      icon: '⚡',
      color: '#3B82F6',
      weight: 1.0,
      relatedTaskTypes: [],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 验证表单
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入维度名称';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入维度描述';
    }

    if (formData.weight < 0.5 || formData.weight > 2.0) {
      newErrors.weight = '权重必须在 0.5 到 2.0 之间';
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

  // 切换任务类型
  const toggleTaskType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      relatedTaskTypes: prev.relatedTaskTypes.includes(type)
        ? prev.relatedTaskTypes.filter(t => t !== type)
        : [...prev.relatedTaskTypes, type],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">
            {initialData ? '编辑维度' : '添加新维度'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              维度名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：执行力、专注力、财富力..."
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-neutral-200'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              维度描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这个维度的含义和目标..."
              rows={3}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-neutral-200'
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* 图标选择 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              选择图标
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                    formData.icon === icon
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              选择颜色
            </label>
            <div className="grid grid-cols-6 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full h-12 rounded-lg transition-all hover:scale-105 ${
                    formData.color === color ? 'ring-4 ring-offset-2' : ''
                  }`}
                  style={{ 
                    backgroundColor: color,
                    ringColor: color,
                  }}
                >
                  {formData.color === color && (
                    <span className="text-white text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>
            
            {/* 自定义颜色 */}
            <div className="mt-3 flex items-center space-x-3">
              <label className="text-sm text-neutral-600">自定义颜色：</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <span className="text-sm font-mono text-neutral-600">{formData.color}</span>
            </div>
          </div>

          {/* 权重滑块 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              权重系数
              <span className="ml-2 text-sm font-normal text-neutral-600">
                (影响成长值计算，范围 0.5 - 2.0)
              </span>
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${formData.color} 0%, ${formData.color} ${((formData.weight - 0.5) / 1.5) * 100}%, #e5e7eb ${((formData.weight - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">0.5×</span>
                <span className="text-2xl font-bold" style={{ color: formData.color }}>
                  {formData.weight.toFixed(1)}×
                </span>
                <span className="text-neutral-600">2.0×</span>
              </div>
            </div>
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
            )}
          </div>

          {/* 关联任务类型 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              关联任务类型
              <span className="ml-2 text-sm font-normal text-neutral-600">
                (完成这些类型的任务会增加该维度的成长值)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TASK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleTaskType(type.value)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.relatedTaskTypes.includes(type.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-2xl">{type.emoji}</span>
                  <span className="font-medium text-neutral-900">{type.label}</span>
                  {formData.relatedTaskTypes.includes(type.value) && (
                    <span className="ml-auto text-blue-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 预览 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              预览效果
            </label>
            <div className="bg-neutral-50 rounded-xl p-6">
              <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-sm">
                <div className="h-2" style={{ backgroundColor: formData.color }} />
                <div className="p-5">
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      {formData.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900">
                        {formData.name || '维度名称'}
                      </h3>
                      <p className="text-xs text-neutral-600">
                        权重 ×{formData.weight.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 line-clamp-2">
                    {formData.description || '维度描述...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  );
}

