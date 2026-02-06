import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTutorialStore } from '@/stores/tutorialStore';
import { X, GripVertical, Settings } from 'lucide-react';
import NotificationContainer from '@/components/ui/NotificationContainer';
import AISmartInput from '@/components/ai/AISmartInput';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
import GitHubCommitBadge from '@/components/ui/GitHubCommitBadge';
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

type TabType = 'timeline' | 'goals' | 'journal' | 'memory' | 'gold' | 'habits' | 'reports' | 'settings' | 'inbox' | 'ai' | 'more' | 'money' | 'tags';

interface NavItem {
  id: TabType;
  label: string;
  icon: string;
  component?: React.ComponentType<any>;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'timeline', label: '时间轴', icon: '📅', component: TimelineModule },
  { id: 'goals', label: '目标', icon: '🎯', component: GoalsModule },
  { id: 'money', label: '副业', icon: '💰', component: MoneyModule },
  { id: 'inbox', label: '收集箱', icon: '📥', component: TaskInbox },
  { id: 'tags', label: '标签', icon: '🏷️' }, // 标签管理（特殊处理，不是模块）
  { id: 'journal', label: '日记', icon: '📔', component: JournalModule },
  // AI助手已移除，改为浮动按钮
  { id: 'memory', label: '记忆', icon: '🧠', component: PanoramaMemory },
  { id: 'gold', label: '金币', icon: '💎', component: GoldModule },
  { id: 'habits', label: '习惯', icon: '⚠️', component: HabitsModule },
  { id: 'reports', label: '报告', icon: '📈', component: ReportsModule },
  { id: 'settings', label: '设置', icon: '⚙️', component: SettingsModule },
];

export default function MobileLayout() {
  const { loadTasks } = useTaskStore();
  const { loadGrowthData } = useGrowthStore();
  const { balance } = useGoldStore();
  const { 
    activeOnboarding, 
    setActiveOnboarding,
    completeOnboarding,
    shouldShowOnboarding 
  } = useTutorialStore();
  
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
        return ALL_NAV_ITEMS.slice(0, 4); // 默认显示前4个
      }
    }
    return ALL_NAV_ITEMS.slice(0, 4); // 默认显示前4个
  });
  
  const [activeTab, setActiveTab] = useState<TabType>(navItems[0]?.id || 'timeline');
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItems, setEditingItems] = useState<NavItem[]>([]);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [navColor, setNavColor] = useState(() => localStorage.getItem('mobile_nav_color') || '#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAISmartInput, setShowAISmartInput] = useState(false); // AI 智能输入状态
  const [showTagManager, setShowTagManager] = useState(false); // 标签管理状态

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

    const activeItem = ALL_NAV_ITEMS.find(item => item.id === activeTab);
    if (!activeItem || !activeItem.component) return null;

    const Component = activeItem.component;
    return <Component {...moduleProps} />;
  };

  // 显示的导航项（最多4个）
  const visibleNavItems = navItems.slice(0, 4);
  const hasMore = navItems.length > 4 || navItems.length < ALL_NAV_ITEMS.length;

  // 长按开始编辑
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const timer = setTimeout(() => {
      setEditingItems([...navItems]);
      setShowEditModal(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

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
    <div className="h-screen flex flex-col bg-white dark:bg-black">
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

      {/* 顶部状态栏 - 增加顶部间距避免与系统时间重叠 */}
      <div className="bg-white dark:bg-black border-b border-neutral-200 dark:border-gray-800 px-3 pt-12 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          {/* 左侧：身份等级 */}
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50">
              <div className="text-base">👑</div>
              <div className="text-[10px]">
                <div className="font-semibold text-black">萌芽新手 Lv.1</div>
              </div>
            </div>
            
            {/* 成长值 */}
            <div className="flex items-center space-x-1 px-1.5 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50">
              <div className="text-xs">📊</div>
              <div className="text-[10px] font-semibold text-black">0/200</div>
            </div>
          </div>

          {/* 右侧：GitHub推送次数、金币余额和帮助按钮 */}
          <div className="flex items-center space-x-2">
            {/* GitHub推送次数 */}
            <GitHubCommitBadge className="scale-90" />
            
            <div 
              className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100/50"
              data-tour="coins"
            >
              <div className="text-base">💰</div>
              <div className="text-xs font-bold text-black">{balance}</div>
            </div>
            
            {/* 生成小票按钮 - 替换原来的帮助按钮 */}
            <button
              onClick={() => setShowReceipt(true)}
              className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 active:bg-blue-300 transition-colors flex items-center justify-center animate-bounce"
              title="生成每日小票"
              style={{
                animation: 'bounce 2s infinite',
              }}
            >
              <span className="text-base">🧾</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 - 可滚动，底部留出导航栏空间 */}
      <div className="flex-1 overflow-y-auto pb-20 relative">
        {renderActiveModule()}
        
        {/* 浮动 AI 按钮 - 只在时间轴页面显示，调整位置避免被导航栏遮挡 */}
        {activeTab === 'timeline' && (
          <button
            onClick={() => setShowAISmartInput(true)}
            className="fixed right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform"
            style={{
              bottom: '88px', // 导航栏高度约72px + 16px间距
              backgroundColor: '#FFD700',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
            }}
            data-tour="ai-button"
          >
            <span className="text-white text-3xl font-bold">+</span>
          </button>
        )}
      </div>

      {/* AI 智能输入 - 使用电脑版相同的组件 */}
      <AISmartInput 
        isOpen={showAISmartInput} 
        onClose={() => setShowAISmartInput(false)} 
      />
      
      {/* 标签管理弹窗 - V2 优化版 */}
      <TagManagerV2
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
        isDark={false}
      />

      {/* 底部导航栏 - 固定在底部 */}
      <div 
        className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 dark:border-gray-800 px-2 py-2 safe-area-bottom z-40 bg-white dark:bg-black"
      >
        <div className="flex items-center justify-around">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                // 标签管理特殊处理：打开弹窗而不是切换标签页
                if (item.id === 'tags') {
                  setShowTagManager(true);
                } else {
                  setActiveTab(item.id);
                }
              }}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all min-w-[60px] ${
                activeTab === item.id
                  ? 'bg-blue-500 text-white'
                  : 'text-neutral-600 dark:text-gray-300 active:bg-neutral-100 dark:active:bg-gray-800'
              }`}
              data-tour={item.id === 'timeline' ? 'timeline' : item.id === 'inbox' ? 'inbox' : undefined}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}

          {/* 更多按钮 */}
          {hasMore && (
            <button
              onClick={() => setShowMoreModal(true)}
              className="flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all min-w-[60px] text-neutral-600 dark:text-gray-300 active:bg-neutral-100 dark:active:bg-gray-800"
            >
              <span className="text-2xl mb-1">⋯</span>
              <span className="text-xs font-medium">更多</span>
            </button>
          )}
        </div>
      </div>

      {/* 更多功能弹窗 */}
      {showMoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-h-[70vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">更多功能</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowMoreModal(false);
                    setEditingItems([...navItems]);
                    setShowEditModal(true);
                  }}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                >
                  <Settings className="w-5 h-5 text-gray-900 dark:text-white" />
                </button>
                <button
                  onClick={() => setShowMoreModal(false)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                >
                  <X className="w-5 h-5 text-gray-900 dark:text-white" />
                </button>
              </div>
            </div>

            {/* 功能列表 - 只显示不在导航栏的功能 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 gap-4">
                {ALL_NAV_ITEMS.filter(item => !visibleNavItems.find(v => v.id === item.id)).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      // 标签管理特殊处理：打开弹窗
                      if (item.id === 'tags') {
                        setShowTagManager(true);
                        setShowMoreModal(false);
                      } else {
                        setActiveTab(item.id);
                        setShowMoreModal(false);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all shadow-sm ${
                      activeTab === item.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white active:bg-gray-50 dark:active:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className="text-3xl mb-2">{item.icon}</span>
                    <span className="text-xs font-semibold text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑导航栏弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <p className="text-sm text-blue-900 font-medium">
                💡 拖拽调整顺序，最多显示4个在底部导航栏
              </p>
            </div>

            {/* 颜色选择器 */}
            {showColorPicker && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold mb-3 text-gray-900">🎨 导航栏颜色</h4>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {[
                    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
                    '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24',
                    '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa',
                    '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6',
                    '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
                    '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8',
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
                        borderColor: navColor === color ? '#3b82f6' : '#e5e7eb',
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
                      {index < 4 && (
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
                className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold active:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移除浮动按钮，集成到导航栏 */}
    </div>
  );
}
