import { useState } from 'react';
import { useRPGStore } from '@/stores/rpgStore';
import { X, Lock, Star, Award, TrendingUp, Coins, Target, Zap } from 'lucide-react';

const VINTAGE_COLORS = {
  buttermilk: '#FFF1B5',
  pastelBlue: '#C1DBE8',
  burgundy: '#43302E',
  tangerine: '#EAA239',
  cream: '#FFF4A1',
  leaves: '#8F9E25',
  wisteria: '#C3A5C1',
  mulberry: '#97332C',
  khaki: '#D4C5A0',
  softPink: '#F5D5CB',
  paleGreen: '#C8D5B9',
  dustyRed: '#C97064',
};

interface AchievementWallProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementWall({ isOpen, onClose }: AchievementWallProps) {
  const { achievements } = useRPGStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'growth' | 'wealth' | 'habit' | 'improvement' | 'hidden'>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all' as const, label: '全部', icon: '🏆', color: VINTAGE_COLORS.tangerine },
    { id: 'growth' as const, label: '成长', icon: '📈', color: VINTAGE_COLORS.leaves },
    { id: 'wealth' as const, label: '财富', icon: '💰', color: VINTAGE_COLORS.tangerine },
    { id: 'habit' as const, label: '习惯', icon: '⚡', color: VINTAGE_COLORS.pastelBlue },
    { id: 'improvement' as const, label: '改进', icon: '✨', color: VINTAGE_COLORS.wisteria },
    { id: 'hidden' as const, label: '隐藏', icon: '🎁', color: VINTAGE_COLORS.dustyRed },
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: VINTAGE_COLORS.cream }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div 
          className="p-6 relative"
          style={{ backgroundColor: VINTAGE_COLORS.tangerine }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">成就勋章墙</h2>
          </div>

          {/* 进度统计 */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
            <div className="flex justify-between text-sm text-white mb-2">
              <span>解锁进度</span>
              <span className="font-bold">{unlockedCount}/{totalCount}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: '#fff'
                }}
              />
            </div>
          </div>
        </div>

        {/* 分类标签 */}
        <div 
          className="px-6 py-4 border-b"
          style={{ 
            backgroundColor: VINTAGE_COLORS.buttermilk,
            borderColor: VINTAGE_COLORS.khaki
          }}
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : VINTAGE_COLORS.khaki,
                  color: selectedCategory === category.id ? '#fff' : VINTAGE_COLORS.burgundy,
                }}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-semibold">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 成就列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="rounded-xl p-4 transition-all"
                style={{
                  backgroundColor: achievement.unlocked ? VINTAGE_COLORS.buttermilk : VINTAGE_COLORS.khaki,
                  opacity: achievement.unlocked ? 1 : 0.6,
                  border: `2px solid ${achievement.unlocked ? VINTAGE_COLORS.tangerine : VINTAGE_COLORS.khaki}`,
                }}
              >
                {/* 图标 */}
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-3 mx-auto"
                  style={{
                    backgroundColor: achievement.unlocked ? VINTAGE_COLORS.pastelBlue : VINTAGE_COLORS.khaki,
                  }}
                >
                  {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6" style={{ color: VINTAGE_COLORS.burgundy }} />}
                </div>

                {/* 标题 */}
                <h3 
                  className="text-sm font-bold text-center mb-1"
                  style={{ color: VINTAGE_COLORS.burgundy }}
                >
                  {achievement.unlocked ? achievement.title : '???'}
                </h3>

                {/* 描述 */}
                <p 
                  className="text-xs text-center opacity-80"
                  style={{ color: VINTAGE_COLORS.burgundy }}
                >
                  {achievement.unlocked ? achievement.description : '完成特定条件解锁'}
                </p>

                {/* 解锁时间 */}
                {achievement.unlocked && achievement.unlockedAt && (
                  <div 
                    className="text-xs text-center mt-2 pt-2 border-t"
                    style={{ 
                      color: VINTAGE_COLORS.burgundy,
                      borderColor: VINTAGE_COLORS.khaki
                    }}
                  >
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 空状态 */}
          {filteredAchievements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-lg font-semibold" style={{ color: VINTAGE_COLORS.burgundy }}>
                暂无成就
              </p>
              <p className="text-sm opacity-70 mt-2" style={{ color: VINTAGE_COLORS.burgundy }}>
                完成任务和目标即可解锁成就
              </p>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div 
          className="p-4 text-center text-sm"
          style={{ 
            backgroundColor: VINTAGE_COLORS.buttermilk,
            color: VINTAGE_COLORS.burgundy
          }}
        >
          💡 提示：完成改进任务可以解锁特殊成就
        </div>
      </div>
    </div>
  );
}

