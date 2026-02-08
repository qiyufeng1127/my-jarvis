import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  hover = false,
  className = '',
  onClick,
}) => {
  const baseClass = 'card';
  const variantClass = `card--${variant}`;
  const paddingClass = `card--padding-${padding}`;
  const shadowClass = `card--shadow-${shadow}`;
  const hoverClass = hover ? 'card--hover' : '';
  const clickableClass = onClick ? 'card--clickable' : '';
  
  const classes = [
    baseClass,
    variantClass,
    paddingClass,
    shadowClass,
    hoverClass,
    clickableClass,
    className
  ].filter(Boolean).join(' ');

  const cardContent = (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );

  if (hover || onClick) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return <div className={`card__header ${className}`}>{children}</div>;
};

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={`card__body ${className}`}>{children}</div>;
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={`card__footer ${className}`}>{children}</div>;
};
