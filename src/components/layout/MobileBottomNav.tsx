import React from 'react';
import { motion } from 'framer-motion';
import { IconBadge } from '@/components/ui';
import './MobileBottomNav.css';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
}

interface MobileBottomNavProps {
  items: NavItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  onLongPress?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  activeId,
  onItemClick,
  onLongPress,
}) => {
  const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null);

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const timer = setTimeout(() => {
      onLongPress?.();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <motion.div
      className="mobile-bottom-nav"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="mobile-bottom-nav__container">
        {items.map((item, index) => {
          const isActive = activeId === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              className={`mobile-bottom-nav__item ${isActive ? 'mobile-bottom-nav__item--active' : ''}`}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="mobile-bottom-nav__icon-wrapper">
                {isActive ? (
                  <IconBadge
                    icon={item.icon}
                    color={item.color || 'pink'}
                    size="md"
                    variant="solid"
                  />
                ) : (
                  <span className="mobile-bottom-nav__icon">{item.icon}</span>
                )}
              </div>
              
              <motion.span
                className="mobile-bottom-nav__label"
                initial={false}
                animate={{
                  scale: isActive ? 1 : 0.9,
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {item.label}
              </motion.span>
              
              {isActive && (
                <motion.div
                  className="mobile-bottom-nav__indicator"
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
