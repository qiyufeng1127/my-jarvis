import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/utils/animations';
import './ModuleContainer.css';

interface ModuleContainerProps {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  headerAction?: React.ReactNode;
  className?: string;
}

export const ModuleContainer: React.FC<ModuleContainerProps> = ({
  children,
  title,
  icon,
  headerAction,
  className = '',
}) => {
  return (
    <motion.div
      className={`module-container ${className}`}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      {(title || icon || headerAction) && (
        <div className="module-container__header">
          {(icon || title) && (
            <div className="module-container__title">
              {icon && <span className="module-container__icon">{icon}</span>}
              {title && <h2 className="module-container__title-text">{title}</h2>}
            </div>
          )}
          {headerAction && (
            <div className="module-container__action">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="module-container__content">
        {children}
      </div>
    </motion.div>
  );
};

