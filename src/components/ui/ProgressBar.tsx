import React from 'react';
import { motion } from 'framer-motion';
import './ProgressBar.css';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'pink',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`progress-bar progress-bar--${size} ${className}`}>
      {(showLabel || label) && (
        <div className="progress-bar__header">
          {label && <span className="progress-bar__label">{label}</span>}
          {showLabel && (
            <span className="progress-bar__value">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`progress-bar__track progress-bar__track--${color}`}>
        <motion.div
          className={`progress-bar__fill progress-bar__fill--${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.5 : 0,
            ease: 'easeOut',
          }}
        />
      </div>
    </div>
  );
};

// 圆形进度条
export const CircularProgress: React.FC<{
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  showLabel?: boolean;
  className?: string;
}> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = 'pink',
  showLabel = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`circular-progress ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          className="circular-progress__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          className={`circular-progress__fill circular-progress__fill--${color}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      
      {showLabel && (
        <div className="circular-progress__label">
          <span className="circular-progress__value">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
};

// 步骤进度条
export const StepProgress: React.FC<{
  steps: string[];
  currentStep: number;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  className?: string;
}> = ({
  steps,
  currentStep,
  color = 'pink',
  className = '',
}) => {
  return (
    <div className={`step-progress ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="step-progress__item">
          <div
            className={`step-progress__circle ${
              index <= currentStep ? `step-progress__circle--active step-progress__circle--${color}` : ''
            }`}
          >
            {index < currentStep ? '✓' : index + 1}
          </div>
          <span className="step-progress__label">{step}</span>
          {index < steps.length - 1 && (
            <div
              className={`step-progress__line ${
                index < currentStep ? `step-progress__line--active step-progress__line--${color}` : ''
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

