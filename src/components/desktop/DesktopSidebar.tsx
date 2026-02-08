import React from 'react';
import { motion } from 'framer-motion';
import { IconBadge, Badge } from '@/components/ui';
import { fadeInLeft, staggerContainer, staggerItem } from '@/utils/animations';
import './DesktopSidebar.css';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  badge?: number;
  onClick?: () => void;
}

interface DesktopSidebarProps {
  items: SidebarItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  items,
  activeId,
  onItemClick,
  collapsed = false,
  onToggleCollapse,
}) => {
  return (
    <motion.aside
      className={`desktop-sidebar ${collapsed ? 'desktop-sidebar--collapsed' : ''}`}
      variants={fadeInLeft}
      initial="initial"
      animate="animate"
    >
      {/* Logo / Brand */}
      <div className="desktop-sidebar__header">
        <motion.div
          className="desktop-sidebar__logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="desktop-sidebar__logo-icon">✨</span>
          {!collapsed && (
            <span className="desktop-sidebar__logo-text">ManifestOS</span>
          )}
        </motion.div>
      </div>

      {/* Navigation Items */}
      <motion.nav
        className="desktop-sidebar__nav"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {items.map((item, index) => {
          const isActive = activeId === item.id;
          
          return (
            <motion.button
              key={item.id}
              className={`desktop-sidebar__item ${isActive ? 'desktop-sidebar__item--active' : ''}`}
              onClick={() => onItemClick(item.id)}
              variants={staggerItem}
              custom={index}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="desktop-sidebar__item-icon">
                {isActive ? (
                  <IconBadge
                    icon={item.icon}
                    color={item.color || 'pink'}
                    size="md"
                    variant="solid"
                  />
                ) : (
                  <span className="desktop-sidebar__icon-text">{item.icon}</span>
                )}
              </div>
              
              {!collapsed && (
                <>
                  <span className="desktop-sidebar__item-label">{item.label}</span>
                  
                  {item.badge && item.badge > 0 && (
                    <Badge color={item.color || 'pink'} variant="solid" size="sm">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </>
              )}
              
              {isActive && (
                <motion.div
                  className="desktop-sidebar__item-indicator"
                  layoutId="sidebarIndicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.nav>

      {/* Footer / Collapse Button */}
      <div className="desktop-sidebar__footer">
        {onToggleCollapse && (
          <motion.button
            className="desktop-sidebar__collapse-btn"
            onClick={onToggleCollapse}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="desktop-sidebar__collapse-icon">
              {collapsed ? '→' : '←'}
            </span>
            {!collapsed && (
              <span className="desktop-sidebar__collapse-text">收起</span>
            )}
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
};

