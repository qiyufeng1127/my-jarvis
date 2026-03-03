import { useRPGStore } from '@/stores/rpgStore';
import { X, Gift, Lock, Star, Trophy } from 'lucide-react';

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

interface SeasonPassProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SeasonPass({ isOpen, onClose }: SeasonPassProps) {
  const { seasonPass } = useRPGStore();

  if (!isOpen) return null;

  // 如果没有赛季通行证，创建默认的
  const currentSeasonPass = seasonPass || {
    season: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
    currentExp: 0,
    maxExp: 1000,
    level: 0,
    rewards: [
      { level: 1, title: '新手称号', icon: '🌱', unlocked: false },
      { level: 2, title: '专属头像框', icon: '🖼️', unlocked: false },
      { level: 3, title: '金币加成', icon: '💰', unlocked: false },
      { level: 4, title: '经验加成', icon: '⭐', unlocked: false },
      { level: 5, title: '赛季勋章', icon: '🏆', unlocked: false },
    ],
  };

  const progress = (currentSeasonPass.currentExp / currentSeasonPass.maxExp) * 100;
  const daysLeft = Math.ceil((currentSeasonPass.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: VINTAGE_COLORS.cream }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div 
          className="p-6 relative"
          style={{ backgroundColor: VINTAGE_COLORS.wisteria }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">赛季通行证</h2>
              <p className="text-sm text-white opacity-80">第 {currentSeasonPass.season} 赛季</p>
            </div>
          </div>

          {/* 赛季信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div className="text-xs text-white opacity-80 mb-1">当前等级</div>
              <div className="text-2xl font-bold text-white">Lv.{currentSeasonPass.level}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div className="text-xs text-white opacity-80 mb-1">剩余时间</div>
              <div className="text-2xl font-bold text-white">{daysLeft} 天</div>
            </div>
          </div>

          {/* 经验进度 */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white mb-2">
              <span>赛季经验</span>
              <span className="font-bold">{currentSeasonPass.currentExp}/{currentSeasonPass.maxExp}</span>
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

        {/* 奖励列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {currentSeasonPass.rewards.map((reward, index) => {
              const isUnlocked = reward.unlocked || currentSeasonPass.level >= reward.level;
              const isCurrent = currentSeasonPass.level === reward.level - 1;

              return (
                <div
                  key={index}
                  className="rounded-xl p-4 transition-all relative overflow-hidden"
                  style={{
                    backgroundColor: isUnlocked ? VINTAGE_COLORS.buttermilk : VINTAGE_COLORS.khaki,
                    border: `2px solid ${isCurrent ? VINTAGE_COLORS.tangerine : 'transparent'}`,
                    opacity: isUnlocked ? 1 : 0.7,
                  }}
                >
                  {/* 当前等级标记 */}
                  {isCurrent && (
                    <div 
                      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: VINTAGE_COLORS.tangerine }}
                    >
                      下一级
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {/* 等级 */}
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isUnlocked ? VINTAGE_COLORS.pastelBlue : VINTAGE_COLORS.khaki,
                      }}
                    >
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: VINTAGE_COLORS.burgundy }}>
                          Lv.{reward.level}
                        </div>
                        <div className="text-2xl">
                          {isUnlocked ? reward.icon : <Lock className="w-5 h-5" style={{ color: VINTAGE_COLORS.burgundy }} />}
                        </div>
                      </div>
                    </div>

                    {/* 奖励信息 */}
                    <div className="flex-1">
                      <h3 
                        className="text-lg font-bold mb-1"
                        style={{ color: VINTAGE_COLORS.burgundy }}
                      >
                        {isUnlocked ? reward.title : '???'}
                      </h3>
                      <p 
                        className="text-sm opacity-80"
                        style={{ color: VINTAGE_COLORS.burgundy }}
                      >
                        {isUnlocked ? '已解锁' : `达到 Lv.${reward.level} 解锁`}
                      </p>
                    </div>

                    {/* 解锁状态 */}
                    {isUnlocked && (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: VINTAGE_COLORS.leaves }}
                      >
                        <Star className="w-5 h-5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部提示 */}
        <div 
          className="p-4"
          style={{ backgroundColor: VINTAGE_COLORS.buttermilk }}
        >
          <div 
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: VINTAGE_COLORS.paleGreen }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5" style={{ color: VINTAGE_COLORS.burgundy }} />
              <span className="font-bold" style={{ color: VINTAGE_COLORS.burgundy }}>
                如何获得赛季经验？
              </span>
            </div>
            <div className="text-sm space-y-1" style={{ color: VINTAGE_COLORS.burgundy }}>
              <p>✅ 完成每日任务：+50 经验</p>
              <p>✨ 完成改进任务：+80 经验（额外加成）</p>
              <p>🎯 完成周目标：+200 经验</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

