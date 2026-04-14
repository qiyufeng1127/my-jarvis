import type { GoalFormData } from '@/components/growth/GoalForm';
import type { LongTermGoal } from '@/types';

export interface GoalSavePayload extends Partial<LongTermGoal> {
  name: string;
  description: string;
  goalType: LongTermGoal['goalType'];
  targetValue: number;
  currentValue: number;
  unit: string;
}

export function buildGoalPayloadFromForm(formData: GoalFormData): GoalSavePayload {
  return {
    name: formData.name,
    description: formData.description,
    goalType: formData.type,
    startDate: formData.startDate ? new Date(formData.startDate) : undefined,
    endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    deadline: formData.endDate ? new Date(formData.endDate) : undefined,
    estimatedTotalHours: formData.estimatedTotalHours,
    targetIncome: formData.targetIncome,
    dimensions: formData.dimensions,
    targetValue: formData.dimensions.reduce((sum, item) => sum + item.targetValue, 0),
    currentValue: formData.dimensions.reduce((sum, item) => sum + item.currentValue, 0),
    unit: formData.dimensions[0]?.unit || '',
    theme: formData.theme,
  };
}

export function buildQuickGoalFormData(name = ''): GoalFormData {
  return {
    name,
    description: '',
    type: 'numeric',
    startDate: '',
    endDate: '',
    estimatedTotalHours: 0,
    targetIncome: 0,
    dimensions: [
      {
        id: `metric-${Date.now()}-0`,
        name: name || '',
        unit: '次',
        targetValue: 1,
        currentValue: 0,
        weight: 100,
      },
    ],
    theme: {
      color: '#0A84FF',
      label: '海蓝',
    },
  };
}









