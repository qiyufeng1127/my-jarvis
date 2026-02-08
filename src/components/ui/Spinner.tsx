import React from 'react';
import { motion } from 'framer-motion';
import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'pink',
  className = '',
}) => {
  return (
    <div className={`spinner spinner--${size} spinner--${color} ${className}`}>
      <motion.div
        className="spinner__circle"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export const SpinnerDots: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'pink',
  className = '',
}) => {
  return (
    <div className={`spinner-dots spinner-dots--${size} ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`spinner-dots__dot spinner-dots__dot--${color}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
};

export const SpinnerPulse: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'pink',
  className = '',
}) => {
  return (
    <div className={`spinner-pulse spinner-pulse--${size} ${className}`}>
      <motion.div
        className={`spinner-pulse__ring spinner-pulse__ring--${color}`}
        animate={{
          scale: [1, 1.5],
          opacity: [1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      <motion.div
        className={`spinner-pulse__ring spinner-pulse__ring--${color}`}
        animate={{
          scale: [1, 1.5],
          opacity: [1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
          delay: 0.5,
        }}
      />
    </div>
  );
};

// 全屏加载器
export const LoadingOverlay: React.FC<{
  visible: boolean;
  message?: string;
}> = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <motion.div
      className="loading-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-overlay__content">
        <SpinnerPulse size="lg" color="pink" />
        {message && <p className="loading-overlay__message">{message}</p>}
      </div>
    </motion.div>
  );
};

