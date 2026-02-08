import React from 'react';
import { motion } from 'framer-motion';
import { Button, IconBadge, Badge } from '@/components/ui';
import { fadeInDown } from '@/utils/animations';
import { Search, Bell, Settings, User } from 'lucide-react';
import './DesktopTopBar.css';

interface DesktopTopBarProps {
  userName?: string;
  userAvatar?: string;
  level?: number;
  coins?: number;
  notifications?: number;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({
  userName = '用户',
  userAvatar,
  level = 1,
  coins = 0,
  notifications = 0,
  onSearchClick,
  onNotificationClick,
  onSettingsClick,
  onProfileClick,
}) => {
  return (
    <motion.header
      className="desktop-top-bar"
      variants={fadeInDown}
      initial="initial"
      animate="animate"
    >
      <div className="desktop-top-bar__container">
        {/* Left: Search */}
        <div className="desktop-top-bar__left">
          <div className="desktop-top-bar__search">
            <Search className="desktop-top-bar__search-icon" />
            <input
              type="text"
              placeholder="搜索任务、目标、日记..."
              className="desktop-top-bar__search-input"
              onClick={onSearchClick}
            />
            <kbd className="desktop-top-bar__search-kbd">⌘K</kbd>
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="desktop-top-bar__right">
          {/* Coins */}
          <div className="desktop-top-bar__coins">
            <IconBadge icon="💰" color="yellow" size="sm" variant="soft" />
            <span className="desktop-top-bar__coins-amount">{coins}</span>
          </div>

          {/* Notifications */}
          <motion.button
            className="desktop-top-bar__action-btn"
            onClick={onNotificationClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="desktop-top-bar__action-icon" />
            {notifications > 0 && (
              <Badge color="pink" variant="solid" size="sm" className="desktop-top-bar__badge">
                {notifications > 99 ? '99+' : notifications}
              </Badge>
            )}
          </motion.button>

          {/* Settings */}
          <motion.button
            className="desktop-top-bar__action-btn"
            onClick={onSettingsClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="desktop-top-bar__action-icon" />
          </motion.button>

          {/* User Profile */}
          <motion.button
            className="desktop-top-bar__user"
            onClick={onProfileClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="desktop-top-bar__user-avatar"
              />
            ) : (
              <div className="desktop-top-bar__user-avatar desktop-top-bar__user-avatar--default">
                <User className="desktop-top-bar__user-icon" />
              </div>
            )}
            <div className="desktop-top-bar__user-info">
              <span className="desktop-top-bar__user-name">{userName}</span>
              <span className="desktop-top-bar__user-level">Lv.{level}</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

