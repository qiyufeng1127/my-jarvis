import React from 'react';
import './IconBadge.css';

export interface IconBadgeProps {
  icon: React.ReactNode;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'soft' | 'outline';
  className?: string;
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  color = 'pink',
  size = 'md',
  variant = 'soft',
  className = '',
}) => {
  const baseClass = 'icon-badge';
  const colorClass = `icon-badge--${color}`;
  const sizeClass = `icon-badge--${size}`;
  const variantClass = `icon-badge--${variant}`;
  
  const classes = [
    baseClass,
    colorClass,
    sizeClass,
    variantClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {icon}
    </div>
  );
};

