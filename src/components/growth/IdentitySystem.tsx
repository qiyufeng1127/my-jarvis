import { useState } from 'react';
import { Crown, Lock, Unlock, ChevronRight, Sparkles } from 'lucide-react';

interface IdentityLevel {
  id: number;
  name: string;
  minGrowth: number;
  maxGrowth: number;
  badge: string;
  color: string;
  privileges: string[];
  theme?: {
    name: string;
    preview: string;
  };
}

interface IdentitySystemProps {
  currentGrowth: number;
  onViewAllLevels: () => void;
}

// 身份层级配置
const IDENTITY_LEVELS: IdentityLevel[] = [
  {
    id: 1,
    name: '新手探索者',
    minGrowth: 0,
    maxGrowth: 100,
    badge: '🌱',
    color: '#9CA3AF',
    privileges: ['基础任务管理', '简单数据统计'],
  },
  {
    id: 2,
    name: '初级实践者',
    minGrowth: 100,
    maxGrowth: 500,
    badge: '🌿',
    color: '#10B981',
    privileges: ['任务验证功能', '成长维度追踪', '每日金币奖励 +10%'],
  },
  {
    id: 3,
    name: '中级行动家',
    minGrowth: 500,
    maxGrowth: 1500,
    badge: '🌳',
    color: '#3B82F6',
    privileges: ['AI 智能助手', '高级数据分析', '自定义主题', '每日金币奖励 +20%'],
    theme: {
      name: '森林绿主题',
      preview: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    },
  },
  {
    id: 4,
    name: '高级成就者',
    minGrowth: 1500,
    maxGrowth: 5000,
    badge: '⭐',
    color: '#F59E0B',
    privileges: ['语音助手', '目标规划系统', '专属徽章', '每日金币奖励 +30%'],
    theme: {
      name: '星空蓝主题',
      preview: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
    },
  },
  {
    id: 5,
    name: '大师级领航者',
    minGrowth: 5000,
    maxGrowth: 15000,
    badge: '👑',
    color: '#8B5CF6',
    privileges: ['全部高级功能', '优先客服支持', '专属动画效果', '每日金币奖励 +50%'],
    theme: {
      name: '皇家紫主题',
      preview: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    },
  },
  {
    id: 6,
    name: '传奇巨匠',
    minGrowth: 15000,
    maxGrowth: Infinity,
    badge: '💎',
    color: '#EC4899',
    privileges: ['所有功能解锁', '终身VIP特权', '定制化服务', '每日金币奖励 +100%'],
    theme: {
      name: '钻石粉主题',
      preview: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    },
  },
];

export default function IdentitySystem({ currentGrowth, onViewAllLevels }: IdentitySystemProps) {
  // 获取当前身份
  const getCurrentLevel = () => {
    return IDENTITY_LEVELS.find(
      level => currentGrowth >= level.minGrowth && currentGrowth < level.maxGrowth
    ) || IDENTITY_LEVELS[0];
  };

  // 获取下一级
  const getNextLevel = () => {
    const currentLevel = getCurrentLevel();
    return IDENTITY_LEVELS.find(level => level.id === currentLevel.id + 1);
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progress = nextLevel
    ? ((currentGrowth - currentLevel.minGrowth) / (nextLevel.minGrowth - currentLevel.minGrowth)) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* 当前身份卡片 */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${currentLevel.color} 0%, ${currentLevel.color}dd 100%)`,
        }}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24" />
        </div>

        <div className="relative z-10 p-8">
          {/* 徽章和名称 */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-5xl">
              {currentLevel.badge}
            </div>
            <div>
              <div className="text-white/80 text-sm mb-1">当前身份</div>
              <h2 className="text-3xl font-bold text-white">{currentLevel.name}</h2>
            </div>
          </div>

          {/* 成长值 */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/90 text-sm">总成长值</span>
              <span className="text-2xl font-bold text-white">{currentGrowth}</span>
            </div>
            
            {nextLevel && (
              <>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-white/80">距离下一级</span>
                  <span className="text-white font-semibold">
                    {nextLevel.minGrowth - currentGrowth} / {nextLevel.minGrowth - currentLevel.minGrowth}
                  </span>
                </div>
                
                {/* 进度条 */}
                <div className="relative w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {Math.round(progress)}%
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 已解锁特权 */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-white/90 text-sm mb-3">
              <Unlock className="w-4 h-4" />
              <span>已解锁特权</span>
            </div>
            <div className="space-y-2">
              {currentLevel.privileges.map((privilege, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-white bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2"
                >
                  <span className="text-green-300">✓</span>
                  <span className="text-sm">{privilege}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 下一级预览 */}
          {nextLevel && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-white/80" />
                  <span className="text-white/90 text-sm">下一级预览</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{nextLevel.badge}</span>
                  <span className="text-white font-semibold">{nextLevel.name}</span>
                </div>
              </div>
              <div className="text-white/70 text-xs">
                解锁 {nextLevel.privileges.length} 项新特权
              </div>
            </div>
          )}

          {/* 查看所有层级按钮 */}
          <button
            onClick={onViewAllLevels}
            className="w-full mt-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-semibold transition-all flex items-center justify-center space-x-2"
          >
            <Crown className="w-5 h-5" />
            <span>查看所有层级</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-neutral-600 text-sm mb-1">当前等级</div>
          <div className="text-2xl font-bold" style={{ color: currentLevel.color }}>
            Lv.{currentLevel.id}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-neutral-600 text-sm mb-1">已解锁特权</div>
          <div className="text-2xl font-bold text-green-600">
            {currentLevel.privileges.length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-neutral-600 text-sm mb-1">升级进度</div>
          <div className="text-2xl font-bold text-blue-600">
            {nextLevel ? `${Math.round(progress)}%` : '满级'}
          </div>
        </div>
      </div>
    </div>
  );
}

