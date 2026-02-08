import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const fullWidthClass = fullWidth ? 'btn--full-width' : '';
  const loadingClass = loading ? 'btn--loading' : '';
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    onClick?.(e);
  };

  return (
    <motion.button
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {loading && (
        <span className="btn__spinner">
          <svg className="btn__spinner-icon" viewBox="0 0 24 24">
            <circle
              className="btn__spinner-circle"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="btn__icon btn__icon--left">{icon}</span>
      )}
      
      {!loading && <span className="btn__text">{children}</span>}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="btn__icon btn__icon--right">{icon}</span>
      )}
    </motion.button>
  );
};
