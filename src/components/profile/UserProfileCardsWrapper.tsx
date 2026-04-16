import { useState, useRef, useEffect } from 'react';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useGoalStore } from '@/stores/goalStore';
import { RefreshCw, Palette, X } from 'lucide-react';

/**
 * 卡片配色方案 - 使用用户提供的配色
 */
const COLOR_SCHEMES = {
  userCustom: {
    name: '温暖治愈',
    colors: ['#D1CBBA', '#6D9978', '#E8C259', '#DD617C', '#AC0327'],
  },
  earthySage: {
    name: '大地鼠尾草',
    colors: ['#b0d7e1', '#f5c7c7', '#5e402e', '#606545'],
  },
  mutedBlush: {
    name: '柔和腮红',
    colors: ['#fec2e0', '#5d4734', '#c6da83', '#535893'],
  },
  softPastels: {
    name: '柔和粉彩',
    colors: ['#DA888C', '#E1BC9B', '#E6D6B4', '#B2B565', '#7AA194', '#504651'],
  },
  autumnHarvest: {
    name: '秋日丰收',
    colors: ['#DBC0A5', '#B9B07B', '#BA7770', '#EDCE91', '#71744F', '#5C2120'],
  },
  cafeRetro: {
    name: '复古咖啡',
    colors: ['#F8E6D2', '#B6BEB1', '#78B7A5', '#704D3B', '#D3A345', '#91222C'],
  },
  mediterraneanSunset: {
    name: '地中海日落',
    colors: ['#95C3BE', '#DA6790', '#ECBAA4', '#AEBE5C'],
  },
  vintageBotanical: {
    name: '复古植物',
    colors: ['#894D5B', '#E1B1C1', '#C4E9F8', '#88A82A', '#21510A'],
  },
};

interface CardData {
  id: string;
  title: string;
  icon: string;
  percentage: number;
  content: string[];
}

interface UserProfileCardsWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileCardsWrapper({ isOpen, onClose }: UserProfileCardsWrapperProps) {
  const { profile, isLoading, updateProfile } = useUserProfileStore();
  const { goals } = useGoalStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<keyof typeof COLOR_SCHEMES>('userCustom');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isSwiping = useRef(false);

  useEffect(() => {
    if (isOpen && !profile) {
      handleUpdate();
    }
  }, [isOpen]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    await updateProfile();
    setIsUpdating(false);
  };

  if (!isOpen) return null;
  
  if (!profile) {
    return (
      <div 
        className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-start justify-center keyboard-aware-modal-shell"
      >
        <div className="text-center keyboard-aware-modal-card" style={{ maxHeight: 'var(--app-modal-max-height)' }}>
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">正在加载你的画像...</p>
        </div>
      </div>
    );
  }

  // 生成卡片数据 - 根据了解程度动态生成
  const generateCards = (): CardData[] => {
    const cards: CardData[] = [];
    const understandingLevel = profile.understandingLevel || 0;
    
    // 1. 基础信息卡片（总是显示）
    const basicPercentage = profile.usageDays === 0 ? 0 : Math.min(10, profile.usageDays * 2);
    cards.push({
      id: 'basic',
      title: '基础信息',
      icon: '📝',
      percentage: basicPercentage,
      content: profile.usageDays === 0 
        ? ['等待开始了解你...', '期待与你的第一次互动']
        : profile.usageDays <= 1
        ? ['你今天创建了这个系统', '说明你想要改变、想要成长']
        : [
            `已使用 ${profile.usageDays} 天`,
            goals.length > 0 ? `设置了 ${goals.length} 个目标` : '开始记录你的数据',
          ],
    });

    // 2. 初步观察卡片
    const observationPercentage = profile.observations.length === 0 ? 0 : Math.min(20, understandingLevel * 0.5);
    cards.push({
      id: 'observation',
      title: '初步观察',
      icon: '🔍',
      percentage: observationPercentage,
      content: profile.observations.length === 0
        ? ['还没有足够的观察数据', '继续使用系统，我会逐渐了解你']
        : profile.observations.slice(0, 3),
    });

    // 3. 性格特征卡片
    const personalityPercentage = profile.personality.traits.length === 0 ? 0 : Math.min(30, understandingLevel * 0.6);
    cards.push({
      id: 'personality',
      title: '性格特征',
      icon: '🎭',
      percentage: personalityPercentage,
      content: profile.personality.traits.length === 0
        ? ['性格特征分析中...', '需要更多互动来了解你的性格']
        : [
            `性格特点：${profile.personality.traits.slice(0, 3).join('、')}`,
            profile.personality.workStyle !== '观察中...' ? `工作风格：${profile.personality.workStyle}` : '工作风格分析中...',
          ].filter(Boolean),
    });

    // 4. 行为模式卡片
    const patternCount = profile.patterns.timePatterns.length + 
                        profile.patterns.emotionPatterns.length + 
                        profile.patterns.workPatterns.length + 
                        profile.patterns.habitPatterns.length;
    const behaviorPercentage = patternCount === 0 ? 0 : Math.min(40, understandingLevel * 0.7);
    
    const behaviorContent: string[] = [];
    if (profile.patterns.timePatterns.length > 0) {
      behaviorContent.push(profile.patterns.timePatterns[0].description);
    }
    if (profile.patterns.workPatterns.length > 0) {
      behaviorContent.push(profile.patterns.workPatterns[0].description);
    }
    if (profile.patterns.habitPatterns.length > 0) {
      behaviorContent.push(`习惯：${profile.patterns.habitPatterns[0].habit}`);
    }
    
    cards.push({
      id: 'behavior',
      title: '行为模式',
      icon: '🔄',
      percentage: behaviorPercentage,
      content: behaviorContent.length === 0
        ? ['行为模式学习中...', '通过你的日常操作来识别模式']
        : behaviorContent.slice(0, 3),
    });

    // 5. 目标与动机卡片
    const motivationPercentage = profile.goals.motivations.length === 0 ? 0 : Math.min(50, understandingLevel * 0.8);
    cards.push({
      id: 'motivation',
      title: '目标与动机',
      icon: '💭',
      percentage: motivationPercentage,
      content: profile.goals.motivations.length === 0
        ? ['还不了解你的目标', '设置一些目标，让我更好地帮助你']
        : profile.goals.motivations.slice(0, 3),
    });

    // 6. 优势卡片
    const strengthsPercentage = profile.strengths.length === 0 ? 0 : Math.min(60, understandingLevel * 0.85);
    cards.push({
      id: 'strengths',
      title: '你的优势',
      icon: '⭐',
      percentage: strengthsPercentage,
      content: profile.strengths.length === 0
        ? ['优势分析中...', '继续使用，我会发现你的闪光点']
        : profile.strengths.slice(0, 3).map(s => `${s.name}：${s.description}`),
    });

    // 7. 挑战与改进卡片
    const challengesPercentage = profile.challenges.length === 0 ? 0 : Math.min(70, understandingLevel * 0.9);
    cards.push({
      id: 'challenges',
      title: '挑战与改进',
      icon: '🎯',
      percentage: challengesPercentage,
      content: profile.challenges.length === 0
        ? ['挑战识别中...', '我会帮你发现可以改进的地方']
        : profile.challenges.slice(0, 3).map(c => `${c.name}：${c.suggestion}`),
    });

    // 8. AI洞察卡片
    const insightsPercentage = profile.insights.length === 0 ? 0 : Math.min(80, understandingLevel * 0.95);
    cards.push({
      id: 'insights',
      title: 'AI的洞察',
      icon: '💡',
      percentage: insightsPercentage,
      content: profile.insights.length === 0
        ? ['深度洞察生成中...', '随着了解加深，我会给出更多见解']
        : profile.insights.slice(0, 3),
    });

    // 9. 建议与推荐卡片
    const recommendationsPercentage = profile.insights.length === 0 ? 0 : Math.min(90, understandingLevel);
    const recommendationContent: string[] = [];
    
    // 基于挑战生成建议
    if (profile.challenges.length > 0) {
      recommendationContent.push(profile.challenges[0].solution);
    }
    
    // 基于优势生成建议
    if (profile.strengths.length > 0) {
      recommendationContent.push(profile.strengths[0].application);
    }
    
    // 基于洞察生成建议
    if (profile.insights.length > 1) {
      recommendationContent.push(profile.insights[1]);
    }
    
    cards.push({
      id: 'recommendations',
      title: '建议与推荐',
      icon: '🎁',
      percentage: recommendationsPercentage,
      content: recommendationContent.length === 0
        ? ['个性化建议准备中...', '基于你的数据，我会提供定制建议']
        : recommendationContent.slice(0, 3),
    });

    // 10. 期待与展望卡片（总是显示）
    cards.push({
      id: 'expectations',
      title: '期待与展望',
      icon: '🌟',
      percentage: 100,
      content: understandingLevel < 10
        ? ['我们的旅程才刚刚开始', '期待与你一起成长', '让我们一起创造美好的未来']
        : understandingLevel < 50
        ? ['我正在逐渐了解你', '一起面对挑战，一起进步', '相信我们会越来越默契']
        : ['我们已经建立了深厚的了解', '我会继续陪伴你成长', '一起创造更多可能'],
    });

    return cards;
  };

  const cards = generateCards();
  const currentColors = COLOR_SCHEMES[selectedScheme].colors;

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = Math.abs(startY.current - currentY.current);
    if (diff > 5) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (isSwiping.current) {
      const diff = startY.current - currentY.current;
      if (diff > 50) {
        // 向下滑动，切换到下一张
        setCurrentIndex((currentIndex + 1) % cards.length);
      }
    }
    isSwiping.current = false;
  };

  // 鼠标事件处理（桌面端）
  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    isSwiping.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      currentY.current = e.clientY;
      const diff = Math.abs(startY.current - currentY.current);
      if (diff > 5) {
        isSwiping.current = true;
      }
    }
  };

  const handleMouseUp = () => {
    if (isSwiping.current) {
      const diff = startY.current - currentY.current;
      if (diff > 50) {
        // 向下拖拽，切换到下一张
        setCurrentIndex((currentIndex + 1) % cards.length);
      }
    }
    isSwiping.current = false;
  };

  // 切换到下一张卡片
  const nextCard = () => {
    setCurrentIndex((currentIndex + 1) % cards.length);
  };

  // 点击卡片切换
  const handleCardClick = () => {
    nextCard();
  };

  // 滚轮事件
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      nextCard();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden keyboard-aware-modal-shell">
      {/* 应用容器 */}
      <div
        className="w-full h-full bg-white flex flex-col overflow-hidden relative keyboard-aware-modal-card"
        style={{ maxHeight: 'var(--app-modal-max-height)' }}
      >
        
        {/* 顶部栏 */}
        <div className="flex-shrink-0 bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex flex-col gap-1">
            <div className="text-xs text-[#86868b]">AI Profile</div>
            <div className="text-base font-bold text-[#1d1d1f] flex items-center gap-1.5">
              <span className="text-base">💜</span>
              我了解的你
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 rounded-full bg-[#f2f2f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm transition-colors"
              title="配色"
            >
              🎨
            </button>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-8 h-8 rounded-full bg-[#f2f2f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm transition-colors"
              title="刷新"
            >
              {isUpdating ? '⏳' : '🔄'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f2f2f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm transition-colors"
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 配色选择面板 */}
        {showColorPicker && (
          <div className="absolute top-16 left-4 right-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-xs">选择配色</h3>
              <button onClick={() => setShowColorPicker(false)} className="w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <span className="text-gray-600 text-xs">✕</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedScheme(key as keyof typeof COLOR_SCHEMES);
                    setShowColorPicker(false);
                  }}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all ${
                    selectedScheme === key ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-0.5">
                    {scheme.colors.slice(0, 3).map((color, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-gray-700">{scheme.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 信息标签 */}
        <div className="flex-shrink-0 px-4 py-2 flex items-center justify-center gap-2 bg-white">
          <div className="bg-[#f2f2f7] rounded-xl px-3 py-2 text-center flex-1">
            <div className="text-sm font-bold text-[#1d1d1f]">{profile.understandingLevel.toFixed(0)}%</div>
            <div className="text-[9px] text-[#86868b]">了解度</div>
          </div>
          <div className="bg-[#f2f2f7] rounded-xl px-3 py-2 text-center flex-1">
            <div className="text-sm font-bold text-[#1d1d1f]">第{profile.usageDays}天</div>
            <div className="text-[9px] text-[#86868b]">相识天数</div>
          </div>
          <div className="bg-[#f2f2f7] rounded-xl px-3 py-2 text-center flex-1">
            <div className="text-sm font-bold text-[#1d1d1f]">{profile.understandingStage.replace('阶段', '')}</div>
            <div className="text-[9px] text-[#86868b]">当前阶段</div>
          </div>
        </div>

        {/* 卡片层叠区域 - 卡片堆叠效果（主卡片在上，层叠在下露出顶部） */}
        <div 
          className="flex-1 relative overflow-visible px-4 flex items-start justify-center pt-8"
          style={{ perspective: '1000px' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {cards.map((card, index) => {
            // 计算当前卡片的位置
            const position = (index - currentIndex + cards.length) % cards.length;
            const isMainCard = position === 0;
            
            // 卡片堆叠布局计算 - 主卡片在最上面，后面的卡片露出顶部
            let translateY: number;
            let scale: number;
            let opacity: number;
            let zIndex: number;
            
            if (isMainCard) {
              // 主卡片：在最前面，完整显示
              translateY = 0;
              scale = 1;
              opacity = 1;
              zIndex = 100;
            } else if (position <= 5) {
              // 后面的卡片：堆叠在主卡片后面，露出顶部
              translateY = position * 35; // 向下偏移，让顶部露出来
              scale = 1 - position * 0.04; // 每张卡片缩小4%
              opacity = 1 - position * 0.12; // 每张卡片透明度降低12%
              zIndex = 100 - position;
            } else {
              // 隐藏更后面的卡片
              translateY = 200;
              scale = 0.7;
              opacity = 0;
              zIndex = 0;
            }
            
            return (
              <div
                key={card.id}
                onClick={handleCardClick}
                className="absolute rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out cursor-pointer overflow-hidden"
                style={{
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  maxWidth: '400px',
                  height: '340px',
                  transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
                  transformOrigin: 'top center',
                  zIndex: zIndex,
                  opacity: opacity,
                  backgroundColor: currentColors[index % currentColors.length],
                  pointerEvents: isMainCard ? 'auto' : 'none',
                }}
              >
                <div className="p-5 h-full flex flex-col">
                  {/* 卡片头部 - 始终显示 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{card.icon}</span>
                      <h3 className="text-base font-bold text-[#1a1a1a]">{card.title}</h3>
                    </div>
                    <div className="text-sm font-bold text-[#1a1a1a] flex items-center gap-1">
                      {card.percentage}% <span className="text-yellow-500">★</span>
                    </div>
                  </div>

                  {/* 卡片内容 - 只在主卡片显示 */}
                  {isMainCard && (
                    <>
                      <div className="space-y-2 mb-4 flex-1 overflow-y-auto keyboard-aware-scroll">
                        {card.content.map((text, i) => (
                          <p key={i} className="text-[13px] text-[#2a2a2a] leading-relaxed">
                            • {text}
                          </p>
                        ))}
                      </div>

                      {/* 底部指示器 */}
                      <div className="flex items-center justify-center gap-1.5 mt-auto">
                        {cards.map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              i === currentIndex
                                ? 'bg-black w-4'
                                : 'bg-black/20'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 提示文字 */}
        <div className="flex-shrink-0 px-4 py-2 bg-white border-t border-gray-100">
          <p className="text-center text-[10px] text-[#86868b]">
            👆 点击卡片或向下滑动查看更多 · {currentIndex + 1}/{cards.length}
          </p>
        </div>
      </div>
    </div>
  );
}
