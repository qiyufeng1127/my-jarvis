import React from 'react';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown' | 'gray';
  variant?: 'solid' | 'soft' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'gray',
  variant = 'soft',
  size = 'md',
  rounded = true,
  className = '',
}) => {
  const baseClass = 'badge';
  const colorClass = `badge--${color}`;
  const variantClass = `badge--${variant}`;
  const sizeClass = `badge--${size}`;
  const roundedClass = rounded ? 'badge--rounded' : '';
  
  const classes = [
    baseClass,
    colorClass,
    variantClass,
    sizeClass,
    roundedClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
};
