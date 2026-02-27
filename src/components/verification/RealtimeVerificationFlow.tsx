import { useState } from 'react';
import ObjectSelector from './ObjectSelector';
import RealtimeObjectVerification from './RealtimeObjectVerification';

interface RealtimeVerificationFlowProps {
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
  preSelectedObjects?: string[]; // 预选物品
  maxSelection?: number;
  requireAll?: boolean; // 是否需要识别到所有物品
  minConfidence?: number;
}

export default function RealtimeVerificationFlow({
  onSuccess,
  onFail,
  onClose,
  preSelectedObjects = [],
  maxSelection = 10,
  requireAll = false,
  minConfidence = 0.5,
}: RealtimeVerificationFlowProps) {
  const [step, setStep] = useState<'select' | 'verify'>('select');
  const [selectedObjects, setSelectedObjects] = useState<string[]>(preSelectedObjects);

  // 确认选择物品后，进入验证环节
  const handleObjectsSelected = (objects: string[]) => {
    setSelectedObjects(objects);
    setStep('verify');
  };

  // 返回物品选择
  const handleBackToSelect = () => {
    setStep('select');
  };

  if (step === 'select') {
    return (
      <ObjectSelector
        onConfirm={handleObjectsSelected}
        onCancel={onClose}
        maxSelection={maxSelection}
        preSelected={selectedObjects}
      />
    );
  }

  return (
    <RealtimeObjectVerification
      targetObjects={selectedObjects}
      onSuccess={onSuccess}
      onFail={onFail}
      onClose={handleBackToSelect}
      minConfidence={minConfidence}
      requireAll={requireAll}
    />
  );
}

