import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { fadeInDown } from '@/utils/animations';
import './MobileTopBar.css';

interface MobileTopBarProps {
  level: number;
  levelName: string;
  exp: number;
  maxExp: number;
  coins: number;
  githubCommits?: number;
  userAvatar?: string;
  onProfileClick?: () => void;
  onReviewClick?: () => void;
  onReceiptClick?: () => void;
  onAvatarUpload?: (file: File) => void;
  onEditLevelName?: () => void; // 新增：编辑等级名称
  onViewBadges?: () => void; // 新增：查看徽章
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  level,
  levelName,
  exp,
  maxExp,
  coins,
  githubCommits = 0,
  userAvatar,
  onProfileClick,
  onReviewClick,
  onReceiptClick,
  onAvatarUpload,
  onEditLevelName,
  onViewBadges,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
  };

  const expPercentage = (exp / maxExp) * 100;
  const nextLevelExp = maxExp - exp;

  return (
    <motion.div
      className="mobile-top-bar-card"
      variants={fadeInDown}
      initial="initial"
      animate="animate"
    >
      <div className="mobile-top-bar-card__container">
        {/* 左侧内容区 */}
        <div className="mobile-top-bar-card__left">
          {/* 标题和等级 */}
          <div className="mobile-top-bar-card__header">
            <div className="flex items-center gap-2">
              <h2 className="mobile-top-bar-card__title" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                {levelName}
              </h2>
              {onEditLevelName && (
                <button
                  onClick={onEditLevelName}
                  className="p-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  title="编辑等级名称"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
            <div className="mobile-top-bar-card__level-badge">
              <span className="mobile-top-bar-card__level-icon">👑</span>
              <span className="mobile-top-bar-card__level-text">Lv.{level}</span>
            </div>
          </div>

          {/* 副标题 */}
          <p className="mobile-top-bar-card__subtitle">
            {levelName} · 距离下一级还需 {nextLevelExp} 经验
          </p>

          {/* 经验进度条 */}
          <div className="mobile-top-bar-card__progress">
            <div className="mobile-top-bar-card__progress-bar">
              <motion.div
                className="mobile-top-bar-card__progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${expPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="mobile-top-bar-card__progress-text">
              {exp}/{maxExp}
            </span>
          </div>

          {/* 底部按钮组 */}
          <div className="mobile-top-bar-card__actions">
            {/* 徽章收集按钮 */}
            {onViewBadges && (
              <motion.button
                className="mobile-top-bar-card__action-btn"
                onClick={onViewBadges}
                whileTap={{ scale: 0.95 }}
                title="我的徽章"
              >
                <span className="mobile-top-bar-card__action-icon">🏆</span>
              </motion.button>
            )}

            {/* 用户画像按钮 */}
            <motion.button
              className="mobile-top-bar-card__action-btn"
              onClick={onProfileClick}
              whileTap={{ scale: 0.95 }}
              title="我了解的你"
            >
              <span className="mobile-top-bar-card__action-icon">💕</span>
            </motion.button>

            {/* 日复盘按钮 */}
            <motion.button
              className="mobile-top-bar-card__action-btn"
              onClick={onReviewClick}
              whileTap={{ scale: 0.95 }}
              title="今日复盘"
            >
              <span className="mobile-top-bar-card__action-icon">📊</span>
            </motion.button>

            {/* 生成小票按钮 */}
            <motion.button
              className="mobile-top-bar-card__action-btn"
              onClick={onReceiptClick}
              whileTap={{ scale: 0.95 }}
              title="生成每日小票"
            >
              <span className="mobile-top-bar-card__action-icon">🧾</span>
            </motion.button>

            {/* 金币显示 */}
            <div className="mobile-top-bar-card__coins">
              <span className="mobile-top-bar-card__coins-icon">💰</span>
              <span className="mobile-top-bar-card__coins-amount">{coins}</span>
            </div>

            {/* GitHub提交数 */}
            {githubCommits > 0 && (
              <Badge color="purple" variant="soft" size="sm">
                🔥 {githubCommits}
              </Badge>
            )}
          </div>
        </div>

        {/* 右侧头像上传区 */}
        <div className="mobile-top-bar-card__right">
          <div
            className={`mobile-top-bar-card__avatar ${isDragging ? 'mobile-top-bar-card__avatar--dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="用户头像"
                className="mobile-top-bar-card__avatar-img"
              />
            ) : (
              <div className="mobile-top-bar-card__avatar-placeholder">
                <Upload className="mobile-top-bar-card__upload-icon" />
                <span className="mobile-top-bar-card__upload-text">上传照片</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </motion.div>
  );
};
