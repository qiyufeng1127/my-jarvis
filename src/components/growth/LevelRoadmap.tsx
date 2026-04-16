import { X, Lock, Unlock, Crown, Check } from 'lucide-react';

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

interface LevelRoadmapProps {
  currentGrowth: number;
  levels: IdentityLevel[];
  onClose: () => void;
}

export default function LevelRoadmap({ currentGrowth, levels, onClose }: LevelRoadmapProps) {
  // 判断层级是否已解锁
  const isUnlocked = (level: IdentityLevel) => {
    return currentGrowth >= level.minGrowth;
  };

  // 判断是否是当前层级
  const isCurrent = (level: IdentityLevel) => {
    return currentGrowth >= level.minGrowth && currentGrowth < level.maxGrowth;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 keyboard-aware-modal-shell">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col keyboard-aware-modal-card">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold flex items-center">
              <Crown className="w-7 h-7 mr-3" />
              身份层级路线图
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/90">探索你的成长之路，解锁更多特权</p>
        </div>

        {/* 路线图内容 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="relative">
            {/* 垂直时间线 */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-300 via-purple-300 to-pink-300" />

            {/* 层级列表 */}
            <div className="space-y-8">
              {levels.map((level, index) => {
                const unlocked = isUnlocked(level);
                const current = isCurrent(level);

                return (
                  <div
                    key={level.id}
                    className={`relative pl-20 transition-all ${
                      current ? 'scale-105' : ''
                    }`}
                  >
                    {/* 时间线节点 */}
                    <div
                      className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all ${
                        current
                          ? 'ring-4 ring-offset-4 scale-110 animate-pulse'
                          : unlocked
                          ? 'ring-2 ring-offset-2'
                          : 'opacity-50'
                      }`}
                      style={{
                        backgroundColor: unlocked ? level.color : '#E5E7EB',
                        ringColor: level.color,
                      }}
                    >
                      {unlocked ? level.badge : '🔒'}
                    </div>

                    {/* 层级卡片 */}
                    <div
                      className={`rounded-xl shadow-lg overflow-hidden transition-all ${
                        current
                          ? 'ring-4 shadow-2xl'
                          : unlocked
                          ? 'shadow-md'
                          : 'opacity-60'
                      }`}
                      style={{
                        ringColor: current ? level.color : 'transparent',
                      }}
                    >
                      {/* 卡片头部 */}
                      <div
                        className="p-6 text-white relative overflow-hidden"
                        style={{
                          background: unlocked
                            ? `linear-gradient(135deg, ${level.color} 0%, ${level.color}dd 100%)`
                            : 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
                        }}
                      >
                        {/* 背景装饰 */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full transform translate-x-16 -translate-y-16" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-4xl">{level.badge}</span>
                              <div>
                                <div className="text-white/80 text-xs mb-1">
                                  {unlocked ? (current ? '当前身份' : '已解锁') : '未解锁'}
                                </div>
                                <h3 className="text-2xl font-bold">{level.name}</h3>
                              </div>
                            </div>
                            {current && (
                              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                                当前
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-white/90">
                            <span>等级 {level.id}</span>
                            <span>•</span>
                            <span>
                              {level.minGrowth} - {level.maxGrowth === Infinity ? '∞' : level.maxGrowth} 成长值
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 卡片内容 */}
                      <div className="p-6 bg-white">
                        {/* 特权列表 */}
                        <div className="mb-4">
                          <div className="flex items-center space-x-2 text-neutral-700 text-sm font-semibold mb-3">
                            {unlocked ? (
                              <Unlock className="w-4 h-4 text-green-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-neutral-400" />
                            )}
                            <span>专属特权 ({level.privileges.length}项)</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {level.privileges.map((privilege, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                                  unlocked
                                    ? 'bg-green-50 text-green-900'
                                    : 'bg-neutral-50 text-neutral-500'
                                }`}
                              >
                                {unlocked ? (
                                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Lock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                )}
                                <span className="text-sm">{privilege}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 专属主题 */}
                        {level.theme && (
                          <div>
                            <div className="text-neutral-700 text-sm font-semibold mb-2">
                              专属主题
                            </div>
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-16 h-16 rounded-lg shadow-md"
                                style={{ background: level.theme.preview }}
                              />
                              <div>
                                <div className="font-semibold text-neutral-900">
                                  {level.theme.name}
                                </div>
                                <div className="text-sm text-neutral-600">
                                  {unlocked ? '已解锁' : '达到该等级后解锁'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm">
            <div className="text-neutral-600">
              💡 完成任务获得成长值，解锁更高层级
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-neutral-600">已解锁</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <span className="text-neutral-600">未解锁</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

