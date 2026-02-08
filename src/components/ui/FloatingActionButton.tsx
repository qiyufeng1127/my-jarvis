import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import './FloatingActionButton.css';

interface FABAction {
  id: string;
  label: string;
  icon: string | React.ReactNode;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  onClick: () => void;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  mainIcon?: React.ReactNode;
  mainColor?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  onClick?: () => void;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  mainIcon = <Plus className="w-6 h-6" />,
  mainColor = 'pink',
  onClick,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleMainClick = () => {
    if (actions && actions.length > 0) {
      setIsOpen(!isOpen);
    } else if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (action: FABAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`fab-container ${className}`}>
      {/* 遮罩层 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fab-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 子按钮 */}
      <AnimatePresence>
        {isOpen && actions && actions.length > 0 && (
          <div className="fab-actions">
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                className={`fab-action fab-action--${action.color || 'pink'}`}
                onClick={() => handleActionClick(action)}
                initial={{ scale: 0, y: 0 }}
                animate={{ 
                  scale: 1, 
                  y: -(index + 1) * 64 
                }}
                exit={{ scale: 0, y: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 260, 
                  damping: 20,
                  delay: index * 0.05 
                }}
              >
                <span className="fab-action__icon">
                  {typeof action.icon === 'string' ? action.icon : action.icon}
                </span>
                <span className="fab-action__label">{action.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 主按钮 */}
      <motion.button
        className={`fab-main fab-main--${mainColor}`}
        onClick={handleMainClick}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {isOpen && actions && actions.length > 0 ? (
          <X className="w-6 h-6" />
        ) : (
          mainIcon
        )}
      </motion.button>
    </div>
  );
};

// 简单版本 - 单个操作
export const SimpleFAB: React.FC<{
  icon?: React.ReactNode;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  onClick: () => void;
  className?: string;
}> = ({ 
  icon = <Plus className="w-6 h-6" />, 
  color = 'pink', 
  onClick,
  className = '' 
}) => {
  return (
    <motion.button
      className={`fab-main fab-main--${color} ${className}`}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
    >
      {icon}
    </motion.button>
  );
};

