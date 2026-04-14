import { useState, useEffect, useRef } from 'react';
import eventBus from '@/utils/eventBus';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useGoldStore } from '@/stores/goldStore';
import { useLevelStore } from '@/stores/levelStore';
import { X, GripVertical, Settings, MoreHorizontal } from 'lucide-react';
// import AISmartInput from '@/components/ai/AISmartInput'; // 临时注释
import FloatingAIChat from '@/components/ai/FloatingAIChat';
import {
  TimelineModule,
  GoldModule,
  ReportsModule,
  SettingsModule,
  MoneyModule,
} from '@/components/dashboard/ModuleComponents';
import GoalHomeView from '@/components/goals/GoalHomeView';
import JournalModule from '@/components/journal/JournalModule';
import PanoramaMemory from '@/components/memory/PanoramaMemory';
import DailyReceipt from '@/components/receipt/DailyReceipt';
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

type TabType = 'timeline' | 'goals' | 'journal' | 'memory' | 'gold' | 'habits' | 'reports' | 'settings' | 'ai' | 'more' | 'money' | 'tags' | 'home' | 'pet' | 'focus' | 'leaderboard';

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

const GOALS_NAV_ITEM_ID: TabType = 'goals';

function ensureGoalsNavItem(items: NavItem[]) {
  const goalsItem = ALL_NAV_ITEMS.find((item) => item.id === GOALS_NAV_ITEM_ID);
  if (!goalsItem) return items.filter((item) => item.id !== 'habits');

  const withoutGoals = items.filter((item) => item.id !== GOALS_NAV_ITEM_ID && item.id !== 'habits');
  return [
    ...withoutGoals.slice(0, 2),
    goalsItem,
    ...withoutGoals.slice(2),
  ];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'timeline', label: '时间轴', icon: '📅', color: 'pink', component: TimelineModule },
  { id: 'tags', label: '标签', icon: '🏷️', color: 'purple' }, // 标签管理（特殊处理，不是模块）
  { id: 'goals', label: '目标', icon: '🎯', color: 'blue', component: GoalHomeView },
  { id: 'memory', label: '总部', icon: '🧠', color: 'purple', component: PanoramaMemory },
  { id: 'money', label: '副业', icon: '💰', color: 'yellow', component: MoneyModule },
  { id: 'journal', label: '日记', icon: '📔', color: 'pink', component: JournalModule },
  { id: 'gold', label: '金币', icon: '🪙', color: 'yellow', component: GoldModule },
  { id: 'reports', label: '报告', icon: '📊', color: 'green', component: ReportsModule },
];

export default function MobileLayout({ onModuleChange }: MobileLayoutProps = {}) {
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const loadGrowthData = useGrowthStore((state) => state.loadGrowthData);
  const balance = useGoldStore((state) => state.balance);
  const currentLevel = useLevelStore((state) => state.currentLevel);
  const currentExp = useLevelStore((state) => state.currentExp);
  const getCurrentLevelConfig = useLevelStore((state) => state.getCurrentLevelConfig);
  const getNextLevelConfig = useLevelStore((state) => state.getNextLevelConfig);
  
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 防止整个页面滚动
  useEffect(() => {
    // 仅禁用 body 滚动，避免移动端键盘与 fixed body 冲突
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      // 清理：恢复 body 滚动
      document.body.style.overflow = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  useEffect(() => {
    const syncKeyboardState = () => {
      setIsKeyboardOpen(document.documentElement.dataset.keyboardOpen === 'true');
    };

    syncKeyboardState();

    const observer = new MutationObserver(syncKeyboardState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-keyboard-open'],
    });

    return () => observer.disconnect();
  }, []);
  
  // 小票弹窗状态
  const [showReceipt, setShowReceipt] = useState(false);
  
  // 从 localStorage 加载导航栏配置
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    const saved = localStorage.getItem('mobile_nav_items');
    if (saved) {
      try {
        const savedIds = JSON.parse(saved) as TabType[];
        return ensureGoalsNavItem(savedIds.map(id => ALL_NAV_ITEMS.find(item => item.id === id)!).filter(Boolean));
      } catch {
        // 默认显示：时间轴、标签、目标、记忆、副业
        return ensureGoalsNavItem(ALL_NAV_ITEMS.slice(0, 5));
      }
    }
    // 默认显示：时间轴、标签、目标、记忆、副业
    return ensureGoalsNavItem(ALL_NAV_ITEMS.slice(0, 5));
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('timeline'); // 默认显示时间轴
  const [bridgePulse, setBridgePulse] = useState<{ module: TabType; label: string } | null>(null);
  
  // 当 activeTab 改变时，通知父组件 - 使用 useRef 避免无限循环
  const onModuleChangeRef = useRef(onModuleChange);
  
  useEffect(() => {
    onModuleChangeRef.current = onModuleChange;
  }, [onModuleChange]);
  
  useEffect(() => {
    if (onModuleChangeRef.current) {
      onModuleChangeRef.current(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleNavigate = (payload?: { module?: string }) => {
      if (!payload?.module) return;
      const nextTab = (payload.module === 'habits' ? 'goals' : payload.module) as TabType;
      setActiveTab(nextTab);
      setBridgePulse({
        module: nextTab,
        label: nextTab === 'memory' ? '总部' : nextTab === 'goals' ? '目标' : nextTab === 'timeline' ? '时间轴' : nextTab,
      });

      window.setTimeout(() => {
        setBridgePulse((current) => (current?.module === nextTab ? null : current));
      }, 2200);
    };

    eventBus.on('dashboard:navigate-module', handleNavigate);
    return () => {
      eventBus.off('dashboard:navigate-module', handleNavigate);
    };
  }, []);
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

  // 保存导航栏配置
  useEffect(() => {
    const normalizedNavItems = ensureGoalsNavItem(navItems);
    if (normalizedNavItems.length !== navItems.length || normalizedNavItems.some((item, index) => item.id !== navItems[index]?.id)) {
      setNavItems(normalizedNavItems);
      return;
    }

    localStorage.setItem('mobile_nav_items', JSON.stringify(normalizedNavItems.map(item => item.id)));
  }, [navItems]);

  // 渲染当前激活的模块
  const renderActiveModule = () => {
    // 从 localStorage 读取自定义颜色
    const savedNavColor = localStorage.getItem('mobile_nav_color') || '#ffffff';
    
    const moduleProps = {
      isDark: false,
      bgColor: savedNavColor,
    };

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
    const normalizedItems = ensureGoalsNavItem(editingItems);
    setNavItems(normalizedItems);
    setShowEditModal(false);
    // 如果当前激活的标签被移除了，切换到第一个
    if (!normalizedItems.find(item => item.id === activeTab)) {
      setActiveTab(normalizedItems[0]?.id || 'timeline');
    }
  };

  return (
    <>
    <div 
      className="fixed inset-0 flex flex-col overflow-hidden mobile-app-shell" 
      style={{ 
        paddingTop: '0',
        paddingBottom: '0',
        margin: '0',
        backgroundColor: '#fefaf0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
        overflow: 'hidden',
        height: 'var(--app-visible-viewport-height)',
        minHeight: 'var(--app-visible-viewport-height)',
        width: '100vw',
      }}
    >
      {/* 每日小票 */}
      <DailyReceipt 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
      />

      {/* 主内容区域 - 统一安全区滚动容器 */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden mobile-app-scroll"
      >
        {bridgePulse && ['memory', 'goals', 'timeline'].includes(activeTab) && (
          <div className="sticky top-0 z-20 px-3 pt-3">
            <div
              className="flex items-center justify-between rounded-[20px] px-4 py-3 shadow-[0_10px_25px_rgba(84,41,22,0.12)]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,250,240,0.96), rgba(255,244,231,0.98))',
                border: '1px solid rgba(84, 41, 22, 0.12)',
              }}
            >
              <div>
                <div className="text-[11px] font-black tracking-[0.18em]" style={{ color: '#9a6b37' }}>
                  闭环跳转
                </div>
                <div className="mt-1 text-sm font-semibold" style={{ color: '#542916' }}>
                  已直达{bridgePulse.label}模块，继续处理当前闭环动作
                </div>
              </div>
              <button
                onClick={() => setBridgePulse(null)}
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: 'rgba(84,41,22,0.08)', color: '#542916' }}
              >
                我知道了
              </button>
            </div>
          </div>
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
      
      {/* 宠物商店弹窗 - iOS 风格 */}
      {showPetShop && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onClick={() => setShowPetShop(false)}
        >
          <div 
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setShowPetShop(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{
                  backgroundColor: 'rgba(254, 250, 240, 0.9)',
                  boxShadow: '0 2px 8px rgba(84, 41, 22, 0.2)',
                }}
              >
                <X className="w-6 h-6" style={{ color: '#542916' }} />
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
            // 点击首页按钮，保留入口但暂时回到时间轴
            setActiveTab('timeline');
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

      {/* 编辑导航栏弹窗 - iOS 风格 */}
      {showEditModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div 
            className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col rounded-2xl"
            style={{
              backgroundColor: 'rgba(254, 250, 240, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(84, 41, 22, 0.2)',
            }}
          >
            {/* 头部 */}
            <div 
              className="flex items-center justify-between p-4"
              style={{
                borderBottom: '1px solid rgba(84, 41, 22, 0.1)',
              }}
            >
              <h3 className="text-lg font-bold" style={{ color: '#542916' }}>编辑导航栏</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2 rounded-xl transition-all active:scale-95"
                  style={{
                    backgroundColor: 'rgba(84, 41, 22, 0.1)',
                  }}
                  title="自定义颜色"
                >
                  🎨
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-xl transition-all active:scale-95"
                  style={{
                    backgroundColor: 'rgba(84, 41, 22, 0.1)',
                  }}
                >
                  <X className="w-5 h-5" style={{ color: '#542916' }} />
                </button>
              </div>
            </div>

            {/* 说明 */}
            <div 
              className="p-4"
              style={{ 
                backgroundColor: 'rgba(241, 193, 102, 0.3)',
                borderBottom: '1px solid rgba(84, 41, 22, 0.1)',
              }}
            >
              <p className="text-sm font-medium" style={{ color: '#542916' }}>
                💡 拖拽调整顺序，最多显示8个在底部导航栏
              </p>
            </div>

            {/* 颜色选择器 */}
            {showColorPicker && (
              <div 
                className="p-4"
                style={{
                  backgroundColor: 'rgba(254, 250, 240, 0.5)',
                  borderBottom: '1px solid rgba(84, 41, 22, 0.1)',
                }}
              >
                <h4 className="text-sm font-semibold mb-3" style={{ color: '#542916' }}>🎨 导航栏颜色</h4>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {[
                    '#fefaf0', '#D1CBBA', '#6D9978', '#E8C259', '#DD617C', '#AC0327',
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
                      className="w-full aspect-square rounded-xl transition-all active:scale-95"
                      style={{
                        backgroundColor: color,
                        border: navColor === color ? '2px solid #542916' : '1px solid rgba(84, 41, 22, 0.2)',
                        boxShadow: navColor === color ? '0 2px 8px rgba(84, 41, 22, 0.2)' : 'none',
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
                    className="w-12 h-12 rounded-xl cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={navColor}
                      onChange={(e) => {
                        setNavColor(e.target.value);
                        localStorage.setItem('mobile_nav_color', e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                      style={{
                        border: '1px solid rgba(84, 41, 22, 0.2)',
                        color: '#542916',
                        backgroundColor: '#ffffff',
                      }}
                      placeholder="#fefaf0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 当前导航项 */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#542916' }}>当前导航栏</h4>
              <div className="space-y-2 mb-6">
                {editingItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={handleDragStart(index)}
                    onDragOver={handleDragOver(index)}
                    onDrop={handleDrop(index)}
                    className="flex items-center justify-between p-3 rounded-xl transition-all active:scale-95"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(84, 41, 22, 0.1)',
                      boxShadow: '0 2px 6px rgba(84, 41, 22, 0.08)',
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-5 h-5" style={{ color: '#b79858' }} />
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-semibold" style={{ color: '#542916' }}>{item.label}</span>
                      {index < 8 && (
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: '#007AFF',
                            color: '#ffffff',
                          }}
                        >
                          显示
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveNavItem(item.id)}
                      className="p-1 rounded transition-all active:scale-95"
                      style={{ color: '#FF3B30' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 可添加的项 */}
              {editingItems.length < ALL_NAV_ITEMS.length && (
                <>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#542916' }}>添加功能</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_NAV_ITEMS.filter(item => !editingItems.find(i => i.id === item.id)).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddNavItem(item)}
                        className="flex items-center space-x-2 p-3 rounded-xl transition-all active:scale-95"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(84, 41, 22, 0.1)',
                          boxShadow: '0 2px 6px rgba(84, 41, 22, 0.08)',
                        }}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-sm font-semibold" style={{ color: '#542916' }}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 底部按钮 */}
            <div 
              className="p-4 flex space-x-3"
              style={{
                borderTop: '1px solid rgba(84, 41, 22, 0.1)',
              }}
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: 'rgba(84, 41, 22, 0.1)',
                  color: '#542916',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95"
                style={{ 
                  backgroundColor: '#6D9978',
                  color: '#ffffff',
                }}
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
