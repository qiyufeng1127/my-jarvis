import { useState } from 'react';
import { X, Edit2, Award, Trophy } from 'lucide-react';
import { useLevelStore } from '@/stores/levelStore';

interface LevelCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LevelCustomizeModal({ isOpen, onClose }: LevelCustomizeModalProps) {
  const { 
    levels, 
    badges,
    updateLevelName, 
    updateBadgeName,
    currentLevel, 
    currentExp, 
    getCurrentBadge,
    getCollectedBadges,
    currentBadgeIndex,
  } = useLevelStore();
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [editingBadge, setEditingBadge] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeTab, setActiveTab] = useState<'levels' | 'badges'>('levels');
  
  const currentBadge = getCurrentBadge();
  const collectedBadges = getCollectedBadges();

  if (!isOpen) return null;

  const handleStartEdit = (level: number, currentName: string) => {
    setEditingLevel(level);
    setEditingBadge(null);
    setEditingName(currentName);
  };

  const handleStartEditBadge = (badgeId: number, currentName: string) => {
    setEditingBadge(badgeId);
    setEditingLevel(null);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingLevel !== null && editingName.trim()) {
      updateLevelName(editingLevel, editingName.trim());
      setEditingLevel(null);
      setEditingName('');
    } else if (editingBadge !== null && editingName.trim()) {
      updateBadgeName(editingBadge, editingName.trim());
      setEditingBadge(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingLevel(null);
    setEditingBadge(null);
    setEditingName('');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 keyboard-aware-modal-shell"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col keyboard-aware-modal-card"
        style={{ maxHeight: 'var(--app-modal-max-height)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">等级系统</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        {/* 标签切换 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'levels'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            等级名称
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'badges'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            徽章收集
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 keyboard-aware-scroll">
          {activeTab === 'levels' ? (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  💡 自定义每个等级的名称，让它更有个性！升满5级（5000经验）即可解锁当前徽章。
                </p>
              </div>
              
              {/* 当前收集进度 */}
              {currentBadge && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 mb-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      <span className="font-semibold">正在收集</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      徽章 {currentBadgeIndex + 1}/{badges.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{currentBadge.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{currentBadge.name}</p>
                      <p className="text-sm opacity-90">
                        Lv.{currentLevel} · {currentExp}/5000 经验
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {levels.map((level) => {
                const isCurrentLevel = level.level === currentLevel;
                const isEditing = editingLevel === level.level;

                return (
                  <div
                    key={level.level}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      isCurrentLevel
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-600">
                            Lv.{level.level}
                          </span>
                          {isCurrentLevel && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full font-medium">
                              当前
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-2 py-1 text-sm font-bold border-2 border-blue-500 rounded-lg focus:outline-none"
                            placeholder="输入等级名称"
                            autoFocus
                          />
                        ) : (
                          <p className="text-base font-bold text-gray-900">
                            {level.name}
                          </p>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(level.level, level.name)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-900 text-sm font-semibold hover:bg-gray-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-600">
                      {level.minExp} - {level.maxExp} 经验
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-900">
                  🏆 每次升满5级（5000经验）就能解锁一个徽章！收集所有徽章展示你的成就。
                </p>
              </div>

              {/* 已收集的徽章 */}
              {collectedBadges.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    已收集徽章 ({collectedBadges.length}/{badges.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {collectedBadges.map((badge) => {
                      const isEditing = editingBadge === badge.id;
                      
                      return (
                        <div
                          key={badge.id}
                          className="rounded-xl p-3 bg-gradient-to-br from-yellow-400 to-orange-500 flex flex-col items-center justify-center shadow-lg"
                        >
                          <span className="text-4xl mb-2">{badge.emoji}</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full px-2 py-1 text-xs text-center font-bold border-2 border-white rounded-lg focus:outline-none"
                              placeholder="徽章名称"
                              autoFocus
                            />
                          ) : (
                            <span className="text-xs font-bold text-white text-center">
                              {badge.name}
                            </span>
                          )}
                          {isEditing ? (
                            <div className="flex gap-1 mt-2 w-full">
                              <button
                                onClick={handleSaveEdit}
                                className="flex-1 py-1 rounded text-xs bg-white text-gray-900 font-semibold"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex-1 py-1 rounded text-xs bg-white/50 text-white font-semibold"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditBadge(badge.id, badge.name)}
                              className="mt-2 text-xs text-white/80 hover:text-white"
                            >
                              ✏️ 编辑
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 所有徽章列表 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  所有徽章 ({badges.length}个)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {badges.map((badge, index) => {
                    const isEditing = editingBadge === badge.id;
                    const isCurrent = index === currentBadgeIndex;
                    
                    return (
                      <div
                        key={badge.id}
                        className={`rounded-xl p-3 border-2 flex flex-col items-center justify-center transition-all ${
                          badge.unlocked
                            ? 'border-yellow-500 bg-yellow-50'
                            : isCurrent
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-gray-50 opacity-50'
                        }`}
                      >
                        <span className="text-3xl mb-2">{badge.emoji}</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-center font-bold border-2 border-purple-500 rounded-lg focus:outline-none"
                            placeholder="徽章名称"
                            autoFocus
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-900 text-center">
                            {badge.name}
                          </span>
                        )}
                        {badge.unlocked ? (
                          <span className="text-xs text-green-600 mt-1">✓ 已解锁</span>
                        ) : isCurrent ? (
                          <span className="text-xs text-purple-600 mt-1">🎯 收集中</span>
                        ) : (
                          <span className="text-xs text-gray-500 mt-1">🔒 未解锁</span>
                        )}
                        {isEditing ? (
                          <div className="flex gap-1 mt-2 w-full">
                            <button
                              onClick={handleSaveEdit}
                              className="flex-1 py-1 rounded text-xs bg-purple-600 text-white font-semibold"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 py-1 rounded text-xs bg-gray-200 text-gray-900 font-semibold"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditBadge(badge.id, badge.name)}
                            className="mt-2 text-xs text-gray-600 hover:text-gray-900"
                          >
                            ✏️ 编辑
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

