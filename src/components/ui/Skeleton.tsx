import React from 'react';
import { motion } from 'framer-motion';
import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'pulse',
}) => {
  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <motion.div
      className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
};

// 预设的骨架屏组合
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton variant="circular" width={48} height={48} />
      <div className="skeleton-card__content">
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={16} />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className = '' 
}) => {
  return (
    <div className={`skeleton-list ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index} 
          variant="text" 
          width={index === lines - 1 ? '70%' : '100%'} 
        />
      ))}
    </div>
  );
};

