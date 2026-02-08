import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { scaleIn } from '@/utils/animations';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <motion.div
      className={`empty-state ${className}`}
      variants={scaleIn}
      initial="initial"
      animate="animate"
    >
      {icon && (
        <div className="empty-state__icon">
          {typeof icon === 'string' ? (
            <span className="empty-state__emoji">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      
      <h3 className="empty-state__title">{title}</h3>
      
      {description && (
        <p className="empty-state__description">{description}</p>
      )}
      
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          className="empty-state__action"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};

// 预设的空状态
export const EmptyTasks: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="📝"
    title="还没有任务"
    description="创建第一个任务，开始你的高效之旅"
    action={onAdd ? { label: '创建任务', onClick: onAdd } : undefined}
  />
);

export const EmptyGoals: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="🎯"
    title="还没有目标"
    description="设定一个目标，让每一天都充满意义"
    action={onAdd ? { label: '创建目标', onClick: onAdd } : undefined}
  />
);

export const EmptySearch: React.FC = () => (
  <EmptyState
    icon="🔍"
    title="没有找到结果"
    description="试试其他关键词或调整筛选条件"
  />
);

export const EmptyData: React.FC = () => (
  <EmptyState
    icon="📊"
    title="暂无数据"
    description="完成一些任务后，这里会显示统计数据"
  />
);

export const EmptyNotifications: React.FC = () => (
  <EmptyState
    icon="🔔"
    title="没有新通知"
    description="所有通知都已查看"
  />
);

