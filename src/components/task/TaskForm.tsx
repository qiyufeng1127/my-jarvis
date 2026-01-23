import { useState } from 'react';
import { X, Calendar, Clock, Target, Zap } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { TASK_TYPE_CONFIG } from '@/constants';
import type { Task, TaskType } from '@/types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  initialData?: Partial<Task>;
}

export default function TaskForm({ isOpen, onClose, onSubmit, initialData }: TaskFormProps) {
  const [formData, setFormData] = useState<Partial<Task>>(
    initialData || {
      title: '',
      description: '',
      taskType: 'work',
      priority: 2,
      durationMinutes: 30,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (field: keyof Task, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建新任务" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 任务标题 */}
        <Input
          label="任务标题"
          placeholder="输入任务名称..."
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />

        {/* 任务描述 */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            任务描述（可选）
          </label>
          <textarea
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="详细描述这个任务..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        {/* 任务类型 */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            任务类型
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(TASK_TYPE_CONFIG).map(([type, config]) => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('taskType', type as TaskType)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.taskType === type
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="text-2xl mb-1">{config.icon}</div>
                <div className="text-xs font-medium">{config.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 优先级 */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            优先级
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => handleChange('priority', priority)}
                className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                  formData.priority === priority
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Zap className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs font-medium">
                  {priority === 1 ? '最高' : priority === 2 ? '高' : priority === 3 ? '中' : '低'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 时长 */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            预计时长（分钟）
          </label>
          <div className="flex space-x-2">
            {[15, 30, 45, 60, 90, 120].map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => handleChange('durationMinutes', duration)}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                  formData.durationMinutes === duration
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Clock className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs font-medium">{duration}分</div>
              </button>
            ))}
          </div>
          <Input
            type="number"
            placeholder="自定义时长"
            value={formData.durationMinutes}
            onChange={(e) => handleChange('durationMinutes', parseInt(e.target.value))}
            className="mt-2"
            min={5}
            max={480}
          />
        </div>

        {/* 计划时间 */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            label="开始时间"
            value={
              formData.scheduledStart
                ? new Date(formData.scheduledStart).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) =>
              handleChange('scheduledStart', e.target.value ? new Date(e.target.value) : undefined)
            }
          />
          <Input
            type="datetime-local"
            label="结束时间"
            value={
              formData.scheduledEnd
                ? new Date(formData.scheduledEnd).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) =>
              handleChange('scheduledEnd', e.target.value ? new Date(e.target.value) : undefined)
            }
          />
        </div>

        {/* 按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" variant="primary">
            创建任务
          </Button>
        </div>
      </form>
    </Modal>
  );
}

