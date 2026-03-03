import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useLevelStore } from '@/stores/levelStore';
import { X, GripVertical, Settings, MoreHorizontal } from 'lucide-react';
import NotificationContainer from '@/components/ui/NotificationContainer';
// import AISmartInput from '@/components/ai/AISmartInput'; // 临时注释
import FloatingAIChat from '@/components/ai/FloatingAIChat';
import {
  GoalsModule,
  TimelineModule,
  GoldModule,
  HabitsModule,
  ReportsModule,
  SettingsModule,
  MoneyModule,
} from '@/components/dashboard/ModuleComponents';
import JournalModule from '@/components/journal/JournalModule';
import PanoramaMemory from '@/components/memory/PanoramaMemory';
import TaskInbox from '@/components/inbox/TaskInbox';
import DailyReceipt from '@/components/receipt/DailyReceipt';
import MobileWelcome from '@/components/tutorial/MobileWelcome';
import OnboardingTooltip, { ONBOARDING_STEPS } from '@/components/tutorial/OnboardingTooltip';
import { TagManagerV2 } from '@/components/tags';
import UserProfileCardsWrapper from '@/components/profile/UserProfileCardsWrapper';
import DailyReviewModal from '@/components/review/DailyReviewModal';
import LevelCustomizeModal from '@/components/level/LevelCustomizeModal';
import MoodWeeklyCard from '@/components/profile/MoodWeeklyCard';
import { MobileBottomNav, MobileTopBar } from '@/components/layout';
import type { NavItem as BottomNavItem } from '@/components/layout';
import { PetWidget } from '@/components/pet/PetWidget';
import { PetShop } from '@/components/pet/PetShop';
import { FocusTimer } from '@/components/focus/FocusTimer';
import { FocusStatsPanel } from '@/components/focus/FocusStatsPanel';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import SOPLibrary from '@/components/sop/SOPLibrary';
import RPGHomePage from '@/components/rpg/RPGHomePage';

type TabType = 'timeline' | 'goals' | 'journal' | 'memory' | 'gold' | 'habits' | 'reports' | 'settings' | 'inbox' | 'ai' | 'more' | 'money' | 'tags' | 'home' | 'pet' | 'focus' | 'leaderboard' | 'sop';

interface MobileLayoutProps {
  onModuleChange?: (module: string) => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: string;
  color?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'brown';
  component?: React.ComponentType<any>;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'timeline', label: '时间轴', icon: '📅', color: 'pink', component: TimelineModule },
  { id: 'goals', label: '目标', icon: '🎯', color: 'yellow', component: GoalsModule },
  { id: 'money', label: '副业', icon: '💰', color: 'yellow', component: MoneyModule },
  { id: 'inbox', label: '收集箱', icon: '📥', color: 'blue', component: TaskInbox },
  { id: 'sop', label: 'SOP', icon: '📋', color: 'blue', component: SOPLibrary },
  { id: 'tags', label: '标签', icon: '🏷️', color: 'purple' }, // 标签管理（特殊处理，不是模块）
  { id: 'ai', label: 'AI助手', icon: '✨', color: 'pink' }, // AI助手（特殊处理，打开输入框）
  { id: 'journal', label: '日记', icon: '📔', color: 'brown', component: JournalModule },
  { id: 'memory', label: '记忆', icon: '🧠', color: 'purple', component: PanoramaMemory },
  { id: 'gold', label: '金币', icon: '💎', color: 'yellow', component: GoldModule },
  { id: 'habits', label: '习惯', icon: '⚠️', color: 'green', component: HabitsModule },
  { id: 'reports', label: '报告', icon: '📈', color: 'blue', component: ReportsModule },
  { id: 'pet', label: '宠物', icon: '🐾', color: 'pink' }, // 宠物系统（特殊处理）
  { id: 'focus', label: '专注', icon: '🎯', color: 'purple' }, // 专注模式（特殊处理）
  { id: 'leaderboard', label: '排行榜', icon: '🏆', color: 'yellow' }, // 排行榜（特殊处理）
];

export default function MobileLayout({ onModuleChange }: MobileLayoutProps = {}) {
  const { loadTasks } = useTaskStore();
  const { loadGrowthData } = useGrowthStore();
  const { balance } = useGoldStore();
  const { 
    activeOnboarding, 
    setActiveOnboarding,
    completeOnboarding,
    shouldShowOnboarding 
  } = useTutorialStore();
  const { currentLevel, currentExp, getCurrentLevelConfig, getNextLevelConfig } = useLevelStore();
  
  // 小票弹窗状态
  const [showReceipt, setShowReceipt] = useState(false);
  
  // 从 localStorage 加载导航栏配置
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    const saved = localStorage.getItem('mobile_nav_items');
    if (saved) {
      try {
        const savedIds = JSON.parse(saved) as TabType[];
        return savedIds.map(id => ALL_NAV_ITEMS.find(item => item.id === id)!).filter(Boolean);
      } catch {
        // 默认显示：时间轴、目标
        return [ALL_NAV_ITEMS[0], ALL_NAV_ITEMS[1]];
      }
    }
    // 默认显示：时间轴、目标
    return [ALL_NAV_ITEMS[0], ALL_NAV_ITEMS[1]];
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('home'); // 默认显示首页
  
  // 当 activeTab 改变时，通知父组件
  useEffect(() => {
    if (onModuleChange) {
      onModuleChange(activeTab);
    }
  }, [activeTab, onModuleChange]);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItems, setEditingItems] = useState<NavItem[]>([]);
  const [navColor, setNavColor] = useState(() => localStorage.getItem('mobile_nav_color') || '#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAISmartInput, setShowAISmartInput] = useState(false); // AI 智能输入状态
  const [showTagManager, setShowTagManager] = useState(false); // 标签管理状态
  const [showUserProfile, setShowUserProfile] = useState(false); // 用户画像状态
  const [showDailyReview, setShowDailyReview] = useState(false); // 日复盘状态
  const [showLevelCustomize, setShowLevelCustomize] = useState(false); // 等级自定义状态
  const [showPetShop, setShowPetShop] = useState(false); // 宠物商店状态
  const [userAvatar, setUserAvatar] = useState<string | undefined>(() => {
    // 从 localStorage 加载头像
    return localStorage.getItem('user_avatar') || undefined;
  });

  useEffect(() => {
    loadTasks();
    loadGrowthData();
  }, [loadTasks, loadGrowthData]);

  // 首次访问时显示引导
  useEffect(() => {
    if (shouldShowOnboarding('home')) {
      setTimeout(() => {
        setActiveOnboarding('home');
      }, 1000);
    }
  }, [shouldShowOnboarding, setActiveOnboarding]);

  // 保存导航栏配置
  useEffect(() => {
    localStorage.setItem('mobile_nav_items', JSON.stringify(navItems.map(item => item.id)));
  }, [navItems]);

  // 渲染当前激活的模块
  const renderActiveModule = () => {
    // 从 localStorage 读取自定义颜色
    const savedNavColor = localStorage.getItem('mobile_nav_color') || '#ffffff';
    
    const moduleProps = {
      isDark: false,
      bgColor: savedNavColor,
    };

    // 首页特殊处理：显示RPG人生系统面板
    if (activeTab === 'home') {
      return <RPGHomePage />;
    }

    // 特殊处理设置模块
    if (activeTab === 'settings') {
      return <SettingsModule {...moduleProps} />;
    }
    
    // 特殊处理游戏系统模块
    if (activeTab === 'focus') {
      return (
        <div className="p-4 space-y-4">
          <FocusTimer />
          <FocusStatsPanel />
        </div>
      );
    }
    
    if (activeTab === 'leaderboard') {
      return (
        <div className="p-4">
          <LeaderboardPanel />
        </div>
      );
    }

    const activeItem = ALL_NAV_ITEMS.find(item => item.id === activeTab);
    if (!activeItem || !activeItem.component) return null;

    const Component = activeItem.component;
    return <Component {...moduleProps} />;
  };

  // 显示的导航项（最多6个 + 首页按钮 + 设置按钮 = 8个）
  const visibleNavItems = navItems.slice(0, 6);
  const hasMore = true; // 始终显示设置按钮

  // 拖拽排序
  const handleDragStart = (index: number) => {
    return (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    };
  };

  const handleDragOver = (index: number) => {
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };
  };

  const handleDrop = (dropIndex: number) => {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
      
      if (dragIndex === dropIndex) return;

      const newItems = [...editingItems];
      const [draggedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);
      
      setEditingItems(newItems);
    };
  };

  // 添加导航项
  const handleAddNavItem = (item: NavItem) => {
    if (!editingItems.find(i => i.id === item.id)) {
      setEditingItems([...editingItems, item]);
    }
  };

  // 移除导航项
  const handleRemoveNavItem = (id: TabType) => {
    setEditingItems(editingItems.filter(item => item.id !== id));
  };

  // 保存编辑
  const handleSaveEdit = () => {
    setNavItems(editingItems);
    setShowEditModal(false);
    // 如果当前激活的标签被移除了，切换到第一个
    if (!editingItems.find(item => item.id === activeTab)) {
      setActiveTab(editingItems[0]?.id || 'timeline');
    }
  };

  return (
    <>
    <div className="h-screen flex flex-col bg-white dark:bg-black" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* 通知容器 */}
      <NotificationContainer />

      {/* 移动端欢迎界面 */}
      <MobileWelcome />

      {/* 每日小票 */}
      <DailyReceipt 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
      />

      {/* 新手引导 */}
      {activeOnboarding && ONBOARDING_STEPS[activeOnboarding as keyof typeof ONBOARDING_STEPS] && (
        <OnboardingTooltip
          steps={ONBOARDING_STEPS[activeOnboarding as keyof typeof ONBOARDING_STEPS]}
          onComplete={() => {
            completeOnboarding(activeOnboarding);
            setActiveOnboarding(null);
          }}
          onSkip={() => {
            completeOnboarding(activeOnboarding);
            setActiveOnboarding(null);
          }}
        />
      )}

      {/* 主内容区域 - 可滚动，底部留出导航栏空间，顶部适配刘海屏 */}
      <div className="flex-1 overflow-y-auto pb-32 relative" style={{ paddingTop: '20px' }}>
        {/* 首页特殊处理：顶部栏和心情周报也放在滚动区域内 */}
        {activeTab === 'home' && (
          <>
            <MobileTopBar
              level={currentLevel}
              levelName={getCurrentLevelConfig().name}
              exp={currentExp}
              maxExp={getCurrentLevelConfig().maxExp}
              coins={balance}
              githubCommits={0}
              userAvatar={userAvatar}
              onProfileClick={() => setShowUserProfile(true)}
              onReviewClick={() => setShowDailyReview(true)}
              onReceiptClick={() => setShowReceipt(true)}
              onEditLevelName={() => setShowLevelCustomize(true)}
              onViewBadges={() => setShowLevelCustomize(true)}
              onAvatarUpload={(file) => {
                // 处理头像上传 - 转换为 base64 并保存
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64String = reader.result as string;
                  setUserAvatar(base64String);
                  localStorage.setItem('user_avatar', base64String);
                  console.log('✅ 头像已上传并保存');
                };
                reader.readAsDataURL(file);
              }}
            />
            
            {/* 心情周报卡片 - 放在萌芽新手卡片下面 */}
            <div className="px-4 pb-4">
              <MoodWeeklyCard />
            </div>
          </>
        )}
        
        {renderActiveModule()}
      </div>

      {/* AI 智能输入 - 临时禁用 */}
      {/* <AISmartInput 
        isOpen={showAISmartInput} 
        onClose={() => setShowAISmartInput(false)} 
      /> */}
      
      {/* 标签管理弹窗 - V2 优化版 */}
      {showTagManager && (
        <TagManagerV2
          isOpen={showTagManager}
          onClose={() => setShowTagManager(false)}
          isDark={false}
        />
      )}
      
      {/* 用户画像弹窗 - 卡片堆叠样式 */}
      {showUserProfile && (
        <UserProfileCardsWrapper
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
      )}
      
      {/* 日复盘弹窗 */}
      <DailyReviewModal
        isOpen={showDailyReview}
        onClose={() => setShowDailyReview(false)}
      />
      
      {/* 等级自定义弹窗 */}
      <LevelCustomizeModal
        isOpen={showLevelCustomize}
        onClose={() => setShowLevelCustomize(false)}
      />
      
      {/* 宠物商店弹窗 */}
      {showPetShop && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowPetShop(false)}
        >
          <div 
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setShowPetShop(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <PetShop />
            </div>
          </div>
        </div>
      )}

      {/* 底部导航栏 - 使用新组件 */}
      <MobileBottomNav
        items={[
          ...visibleNavItems.map(item => ({
            id: item.id,
            label: item.label,
            icon: item.icon,
            color: item.color,
          })),
          // 添加"首页"按钮（中间）
          {
            id: 'home' as TabType,
            label: '首页',
            icon: '🏠',
            color: 'pink' as const,
          },
          // 添加"设置"按钮（最右边）
          {
            id: 'settings' as TabType,
            label: '设置',
            icon: '⚙️',
            color: 'brown' as const,
          }
        ]}
        activeId={activeTab}
        onItemClick={(id) => {
          // 先关闭所有弹窗
          setShowTagManager(false);
          setShowUserProfile(false);
          setShowDailyReview(false);
          setShowLevelCustomize(false);
          
          if (id === 'home') {
            // 点击首页按钮，切换到home页面
            setActiveTab('home');
            return;
          }
          
          if (id === 'settings') {
            // 点击设置按钮，切换到设置页面
            setActiveTab('settings');
            return;
          }
          
          const item = ALL_NAV_ITEMS.find(i => i.id === id);
          if (!item) return;
          
          // 标签管理特殊处理：打开弹窗而不是切换标签页
          if (item.id === 'tags') {
            setShowTagManager(true);
          } else if (item.id === 'ai') {
            // AI助手特殊处理：打开AI输入框
            setShowAISmartInput(true);
          } else if (item.id === 'pet') {
            // 宠物系统特殊处理：打开宠物商店
            setShowPetShop(true);
          } else {
            setActiveTab(item.id);
          }
        }}
        onLongPress={() => {
          setEditingItems([...navItems]);
          setShowEditModal(true);
        }}
      />

      {/* 编辑导航栏弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-gray-900">编辑导航栏</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
                  title="自定义颜色"
                >
                  🎨
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>
            </div>

            {/* 说明 */}
            <div className="p-4 border-b" style={{ backgroundColor: '#E8C259', borderColor: '#d4a93d' }}>
              <p className="text-sm font-medium" style={{ color: '#000000' }}>
                💡 拖拽调整顺序，最多显示8个在底部导航栏
              </p>
            </div>

            {/* 颜色选择器 */}
            {showColorPicker && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold mb-3 text-gray-900">🎨 导航栏颜色</h4>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {[
                    '#D1CBBA', '#6D9978', '#E8C259', '#DD617C', '#AC0327',
                    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
                    '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24',
                    '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa',
                    '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6',
                    '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setNavColor(color);
                        localStorage.setItem('mobile_nav_color', color);
                      }}
                      className="w-full aspect-square rounded-lg border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: navColor === color ? '#DD617C' : '#e5e7eb',
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={navColor}
                    onChange={(e) => {
                      setNavColor(e.target.value);
                      localStorage.setItem('mobile_nav_color', e.target.value);
                    }}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={navColor}
                      onChange={(e) => {
                        setNavColor(e.target.value);
                        localStorage.setItem('mobile_nav_color', e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 text-sm font-mono text-gray-900 bg-white"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 当前导航项 */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-900">当前导航栏</h4>
              <div className="space-y-2 mb-6">
                {editingItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={handleDragStart(index)}
                    onDragOver={handleDragOver(index)}
                    onDrop={handleDrop(index)}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200 active:bg-gray-50 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-5 h-5 text-gray-600" />
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-semibold text-gray-900">{item.label}</span>
                      {index < 8 && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full font-medium">
                          显示
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveNavItem(item.id)}
                      className="p-1 rounded text-red-600 active:bg-red-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 可添加的项 */}
              {editingItems.length < ALL_NAV_ITEMS.length && (
                <>
                  <h4 className="text-sm font-semibold mb-3 text-gray-900">添加功能</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_NAV_ITEMS.filter(item => !editingItems.find(i => i.id === item.id)).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddNavItem(item)}
                        className="flex items-center space-x-2 p-3 bg-white rounded-lg border-2 border-gray-200 active:bg-gray-50 shadow-sm"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="p-4 border-t border-neutral-200 flex space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-900 font-semibold active:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 rounded-lg text-white font-semibold"
                style={{ backgroundColor: '#6D9978' }}
                onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#5a8064'}
                onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#6D9978'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6D9978'}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移除浮动按钮，集成到导航栏 */}
    </div>
    
    {/* FloatingAIChat 已移到 TimelineModule 组件内部 */}
    </>
  );
}
