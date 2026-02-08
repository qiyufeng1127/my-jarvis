import React from 'react';
import { motion } from 'framer-motion';
import { Card, IconBadge } from '@/components/ui';
import './StatCard.css';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subValue,
  color = 'blue',
  trend,
  trendValue,
  onClick,
}) => {
  return (
    <Card
      padding="md"
      shadow="md"
      hover={!!onClick}
      onClick={onClick}
      className="stat-card"
    >
      <div className="stat-card__content">
        <div className="stat-card__header">
          <IconBadge icon={icon} color={color} size="md" variant="soft" />
          {trend && trendValue && (
            <div className={`stat-card__trend stat-card__trend--${trend}`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        <div className="stat-card__body">
          <div className="stat-card__label">{label}</div>
          <div className="stat-card__value">{value}</div>
          {subValue && <div className="stat-card__sub-value">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
};

