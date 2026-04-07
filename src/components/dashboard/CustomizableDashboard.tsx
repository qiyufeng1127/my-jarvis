import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  Coins, 
  AlertTriangle, 
  TrendingUp, 
  Settings, 
  Mic,
  X,
  Palette,
  GripVertical,
  Calendar
} from 'lucide-react';
import {
  GoalsModule,
  GoldModule,
  HabitsModule,
  ReportsModule,
  SettingsModule,
  KikiModule,
  AISmartModule,
  TimelineModule,
  MoneyModule,
  MoodWeeklyModule,
} from './ModuleComponents';
import JournalModule from '@/components/journal/JournalModule';
import PanoramaMemory from '@/components/memory/PanoramaMemory';
import TaskInbox from '@/components/inbox/TaskInbox';
import { TagManagerV2 } from '@/components/tags';
import SOPLibrary from '@/components/sop/SOPLibrary';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { useGoldStore } from '@/stores/goldStore';
import GitHubCommitBadge from '@/components/ui/GitHubCommitBadge';
import VersionInfo from '@/components/VersionInfo';
import DailyReceipt from '@/components/receipt/DailyReceipt';
import UserProfileModal from '@/components/profile/UserProfileModal';
import DailyReviewModal from '@/components/review/DailyReviewModal';
import { PetWidget } from '@/components/pet/PetWidget';
import { PetShop } from '@/components/pet/PetShop';
import { FocusTimer } from '@/components/focus/FocusTimer';
import { FocusStatsPanel } from '@/components/focus/FocusStatsPanel';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';

interface Module {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  color: string;
  isVisible: boolean;
  customSize?: { width: number; height: number };
  imageUrl?: string; // 用于图片组件
  customIcon?: string; // 用于自定义图标
}

interface ModuleDefinition {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  defaultColor: string;
  component: React.ComponentType<any>;
}

// 可用的功能模块定义
const availableModules: ModuleDefinition[] = [
  {
    id: 'goals',
    type: 'goals',
    title: '长期目标',
    icon: <span className="text-2xl">🎯</span>,
    defaultColor: '#3B82F6',
    component: GoalsModule,
  },
  {
    id: 'timeline',
    type: 'timeline',
    title: '时间轴',
    icon: <span className="text-2xl">📅</span>,
    defaultColor: '#0891b2',
    component: TimelineModule,
  },
  {
    id: 'gold',
    type: 'gold',
    title: '金币经济',
    icon: <span className="text-2xl">💰</span>,
    defaultColor: '#E8C259',
    component: GoldModule,
  },
  {
    id: 'habits',
    type: 'habits',
    title: '坏习惯',
    icon: <span className="text-2xl">⚠️</span>,
    defaultColor: '#AC0327',
    component: HabitsModule,
  },
  {
    id: 'reports',
    type: 'reports',
    title: '数据报告',
    icon: <span className="text-2xl">📈</span>,
    defaultColor: '#6D9978',
    component: ReportsModule,
  },
  {
    id: 'settings',
    type: 'settings',
    title: '设置',
    icon: <span className="text-2xl">⚙️</span>,
    defaultColor: '#9CA3AF',
    component: SettingsModule,
  },
  {
    id: 'kiki',
    type: 'kiki',
    title: 'Kiki宝宝',
    icon: <span className="text-2xl">🎤</span>,
    defaultColor: '#DD617C',
    component: KikiModule,
  },
  {
    id: 'ai-smart',
    type: 'ai-smart',
    title: 'AI智能输入',
    icon: <span className="text-2xl">🤖</span>,
    defaultColor: '#7C3AED',
    component: AISmartModule,
  },
  {
    id: 'money',
    type: 'money',
    title: '副业追踪',
    icon: <span className="text-2xl">💰</span>,
    defaultColor: '#10b981',
    component: MoneyModule,
  },
  {
    id: 'journal',
    type: 'journal',
    title: '成功&感恩日记',
    icon: <span className="text-2xl">📔</span>,
    defaultColor: '#F59E0B',
    component: JournalModule,
  },
  {
    id: 'mood-weekly',
    type: 'mood-weekly',
    title: '心情周报',
    icon: <span className="text-2xl">😊</span>,
    defaultColor: '#EC4899',
    component: MoodWeeklyModule,
  },
  {
    id: 'memory',
    type: 'memory',
    title: 'AI总部述职',
    icon: <span className="text-2xl">🧠</span>,
    defaultColor: '#8B5CF6',
    component: PanoramaMemory,
  },
  {
    id: 'inbox',
    type: 'inbox',
    title: '收集箱',
    icon: <span className="text-2xl">📥</span>,
    defaultColor: '#06B6D4',
    component: TaskInbox,
  },
  {
    id: 'sop',
    type: 'sop',
    title: 'SOP任务库',
    icon: <span className="text-2xl">📋</span>,
    defaultColor: '#8B5CF6',
    component: SOPLibrary,
  },
  {
    id: 'tags',
    type: 'tags',
    title: '标签管理',
    icon: <span className="text-2xl">🏷️</span>,
    defaultColor: '#F59E0B',
    component: () => null, // 标签管理使用弹窗，不需要内容组件
  },
  {
    id: 'pet',
    type: 'pet',
    title: '虚拟宠物',
    icon: <span className="text-2xl">🐾</span>,
    defaultColor: '#ffecd2',
    component: () => null, // 使用自定义组件
  },
  {
    id: 'focus',
    type: 'focus',
    title: '专注模式',
    icon: <span className="text-2xl">🎯</span>,
    defaultColor: '#667eea',
    component: () => null, // 使用自定义组件
  },
  {
    id: 'leaderboard',
    type: 'leaderboard',
    title: '排行榜',
    icon: <span className="text-2xl">🏆</span>,
    defaultColor: '#ffd700',
    component: () => null, // 使用自定义组件
  },
  {
    id: 'image-widget',
    type: 'image-widget',
    title: '图片组件',
    icon: <span className="text-2xl">🖼️</span>,
    defaultColor: 'transparent',
    component: () => null, // 图片组件不需要内容组件
  },
];

// 模块尺寸配置 - 根据内容设置合适的尺寸
const moduleSizes = {
  small: { width: 450, height: 500 },
  medium: { width: 600, height: 700 },
  large: { width: 800, height: 1000 },
};

// 不同模块类型的特定尺寸（宽度和高度）
const moduleSpecificSizes: Record<string, { width?: number; height?: number }> = {
  'goals': { height: 700 },          // 长期目标
  'timeline': { width: 550, height: 2000 },  // 时间轴 - 增加到2000px
  'gold': { height: 700 },           // 金币经济
  'habits': { height: 800 },         // 坏习惯
  'reports': { height: 700 },        // 数据报告
  'settings': { height: 800 },       // 设置
  'kiki': { height: 400 },           // Kiki宝宝 - 内容少
  'ai-smart': { width: 350, height: 500 },  // AI智能输入 - 竖长方形，长宽比约4:3（高:宽）
  'journal': { height: 750 },        // 成功&感恩日记
  'mood-weekly': { width: 500, height: 900 },  // 心情周报 - 可爱的柱状图
  'memory': { height: 800 },         // 全景记忆栏
  'inbox': { width: 700, height: 600 },  // 收集箱 - 需要宽度来显示左右两栏
};

interface CustomizableDashboardProps {
  onOpenAISmart?: () => void;
}

export default function CustomizableDashboard({ onOpenAISmart }: CustomizableDashboardProps = {}) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggingModule, setDraggingModule] = useState<string | null>(null);
  const [resizingModule, setResizingModule] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null); // 'gold' | 'growth' | 'identity' | 'habits'
  const [contextMenuModule, setContextMenuModule] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressModule, setLongPressModule] = useState<string | null>(null);

  // 坏习惯百分比（模拟数据）
  const [habitScore, setHabitScore] = useState(0); // 0-100，越高越差
  
  // 每日小票状态
  const [showDailyReceipt, setShowDailyReceipt] = useState(false);
  
  // 标签管理状态
  const [showTagManager, setShowTagManager] = useState(false);
  
  // 用户画像状态
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // 日复盘状态
  const [showDailyReview, setShowDailyReview] = useState(false);
  
  // 宠物商店状态
  const [showPetShop, setShowPetShop] = useState(false);

  // 从副业追踪器获取余额数据
  const { getTotalProfit, loadSideHustles } = useSideHustleStore();
  const assetBalance = getTotalProfit(); // 总利润作为余额
  
  // 从金币Store获取余额
  const { balance: goldBalance } = useGoldStore();

  // 顶部状态栏元素的位置和拖动状态
  const [topBarItems, setTopBarItems] = useState<Array<{
    id: string;
    type: 'identity' | 'growth' | 'habits' | 'gold' | 'balance' | 'image' | 'github' | 'version' | 'receipt' | 'profile' | 'review';
    position: { x: number; y: number };
    imageUrl?: string;
    customSize?: { width: number; height: number };
  }>>([
    { id: 'identity', type: 'identity', position: { x: 0, y: 0 } },
    { id: 'growth', type: 'growth', position: { x: 220, y: 0 } },
    { id: 'balance', type: 'balance', position: { x: 440, y: 0 } },
    { id: 'habits', type: 'habits', position: { x: 680, y: 0 } },
    { id: 'gold', type: 'gold', position: { x: 900, y: 0 } },
    { id: 'profile', type: 'profile', position: { x: 1120, y: 0 } },
    { id: 'review', type: 'review', position: { x: 1300, y: 0 } },
    { id: 'receipt', type: 'receipt', position: { x: 1480, y: 0 } },
    { id: 'github', type: 'github', position: { x: 1660, y: 0 } },
    { id: 'version', type: 'version', position: { x: 1860, y: 0 } },
  ]);
  const [draggingTopBarItem, setDraggingTopBarItem] = useState<string | null>(null);
  const [topBarDragOffset, setTopBarDragOffset] = useState({ x: 0, y: 0 });

  // 加载副业数据（只在组件挂载时执行一次）
  useEffect(() => {
    loadSideHustles();
  }, []); // 移除 loadSideHustles 依赖，避免无限循环

  // 从 Supabase 加载模块配置
  useEffect(() => {
    const loadModules = async () => {
      // 检查 Supabase 是否配置
      const isConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
      if (!isConfigured) {
        console.error('❌ Supabase 未配置！');
        console.error('请检查以下配置：');
        console.error('1. .env 文件是否存在');
        console.error('2. VITE_SUPABASE_URL 是否配置');
        console.error('3. VITE_SUPABASE_ANON_KEY 是否配置');
        console.error('当前配置：', {
          url: import.meta.env.VITE_SUPABASE_URL,
          hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        });
        setIsLoading(false);
        return;
      }

      try {
        const userId = getCurrentUserId();
        console.log('📡 正在从 Supabase 加载模块配置...', { userId });

        const { data, error } = await supabase
          .from('dashboard_modules')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // 没有数据，这是正常的（首次使用）
            console.log('ℹ️ 首次使用，暂无保存的模块配置');
          } else {
            console.error('❌ 加载模块配置失败：', error);
            console.error('错误详情：', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            });
          }
        } else if (data && data.modules) {
          console.log('✅ 成功加载模块配置', data);
          
          // 恢复模块数据：重新添加 icon 字段
          const restoredModules = data.modules.map((m: any) => {
            const moduleDef = availableModules.find(def => def.type === m.type);
            return {
              ...m,
              icon: moduleDef?.icon || <span className="text-2xl">📦</span>, // 恢复 icon
            };
          });
          
          setModules(restoredModules);
        }
      } catch (error) {
        console.error('❌ 加载模块配置时发生异常：', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModules();
  }, []);

  // 保存模块配置到 Supabase（防抖）
  useEffect(() => {
    if (isLoading) return; // 初始加载时不保存

    const saveModules = async () => {
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase 未配置，无法保存模块配置');
        return;
      }

      try {
        const userId = getCurrentUserId();
        
        // 序列化模块数据：移除 React 元素（icon）
        const serializableModules = modules.map(m => ({
          id: m.id,
          type: m.type,
          title: m.title,
          position: m.position,
          size: m.size,
          color: m.color,
          isVisible: m.isVisible,
          customSize: m.customSize,
          imageUrl: m.imageUrl,
          customIcon: m.customIcon,
          // 不保存 icon 字段（React 元素无法序列化）
        }));
        
        console.log('💾 正在保存模块配置到 Supabase...', { userId, modulesCount: serializableModules.length });

        const { error } = await supabase
          .from('dashboard_modules')
          .upsert({
            user_id: userId,
            modules: serializableModules,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('❌ 保存模块配置失败：', error);
          console.error('错误详情：', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
        } else {
          console.log('✅ 模块配置已保存到云端');
        }
      } catch (error) {
        console.error('❌ 保存模块配置时发生异常：', error);
      }
    };

    // 防抖：延迟 1 秒保存，避免频繁写入
    const timer = setTimeout(saveModules, 1000);
    return () => clearTimeout(timer);
  }, [modules, isLoading]);

  // 加载保存的头像
  useEffect(() => {
    const savedImage = localStorage.getItem('profile_image');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  // 处理头像上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
        localStorage.setItem('profile_image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 判断颜色是否为深色
  const isColorDark = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  // 添加模块到主页
  const addModule = (moduleDefinition: ModuleDefinition) => {
    // 标签管理特殊处理：打开弹窗
    if (moduleDefinition.type === 'tags') {
      setShowTagManager(true);
      return;
    }
    
    // 宠物系统特殊处理：打开宠物商店
    if (moduleDefinition.type === 'pet') {
      setShowPetShop(true);
      return;
    }
    
    // 图片组件特殊处理：每次点击都添加新的
    if (moduleDefinition.type === 'image-widget') {
      const newModule: Module = {
        id: `${moduleDefinition.type}-${Date.now()}`,
        type: moduleDefinition.type,
        title: moduleDefinition.title,
        icon: moduleDefinition.icon,
        position: { x: 100 + modules.length * 20, y: 100 + modules.length * 20 },
        size: 'small',
        color: 'transparent',
        isVisible: true,
        customSize: { width: 300, height: 300 }, // 默认正方形
      };
      setModules([...modules, newModule]);
      return;
    }
    
    const existingModule = modules.find((m) => m.type === moduleDefinition.type);
    
    if (existingModule) {
      // 如果已存在，切换可见性
      setModules(
        modules.map((m) =>
          m.type === moduleDefinition.type ? { ...m, isVisible: !m.isVisible } : m
        )
      );
    } else {
      // 添加新模块
      const newModule: Module = {
        id: `${moduleDefinition.type}-${Date.now()}`,
        type: moduleDefinition.type,
        title: moduleDefinition.title,
        icon: moduleDefinition.icon,
        position: { x: 100, y: 100 },
        size: 'medium',
        color: moduleDefinition.defaultColor,
        isVisible: true,
      };
      setModules([...modules, newModule]);
    }
  };

  // 开始拖拽
  const handleDragStart = (moduleId: string, e: React.MouseEvent) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    setDraggingModule(moduleId);
    setDragOffset({
      x: e.clientX - module.position.x,
      y: e.clientY - module.position.y,
    });
  };

  // 拖拽中
  const handleDrag = (e: React.MouseEvent) => {
    if (!draggingModule) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // 检查是否拖动到顶部状态栏区域（y < 80）
    const module = modules.find(m => m.id === draggingModule);
    if (module && module.type === 'image-widget' && newY < 80) {
      // 图片组件拖动到顶部，转换为顶部状态栏元素
      const imageUrl = module.imageUrl;
      const newTopBarItem = {
        id: `topbar-image-${Date.now()}`,
        type: 'image' as const,
        position: { x: newX, y: 0 },
        customSize: { width: 60, height: 60 },
        imageUrl: imageUrl,
      };
      
      // 添加到顶部状态栏
      setTopBarItems([...topBarItems, newTopBarItem]);
      
      // 从模块中移除
      setModules(modules.filter(m => m.id !== draggingModule));
      setDraggingModule(null);
      return;
    }

    setModules(
      modules.map((m) =>
        m.id === draggingModule
          ? { ...m, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
          : m
      )
    );
  };

  // 结束拖拽
  const handleDragEnd = () => {
    setDraggingModule(null);
  };

  // 开始调整大小（缩放）
  const handleResizeStart = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡到拖拽事件
    e.preventDefault(); // 阻止默认行为
    
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    const currentSize = module.customSize || moduleSizes[module.size];
    setResizingModule(moduleId);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: currentSize.width,
      height: currentSize.height,
    });
  };

  // 调整大小（缩放） - 使用 scale 实现整体缩放
  const handleResize = (e: React.MouseEvent) => {
    if (!resizingModule) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    // 计算新的宽高
    const newWidth = Math.max(300, resizeStart.width + deltaX);
    const newHeight = Math.max(250, resizeStart.height + deltaY);

    setModules(
      modules.map((m) => {
        if (m.id === resizingModule) {
          // 更新尺寸，用于计算缩放比例
          return { 
            ...m, 
            customSize: { width: newWidth, height: newHeight }
          };
        }
        return m;
      })
    );
  };

  // 结束调整大小
  const handleResizeEnd = () => {
    setResizingModule(null);
  };

  // 切换模块尺寸
  const toggleModuleSize = (moduleId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
          const currentIndex = sizes.indexOf(m.size);
          const nextSize = sizes[(currentIndex + 1) % sizes.length];
          return { ...m, size: nextSize };
        }
        return m;
      })
    );
  };

  // 改变模块颜色
  const changeModuleColor = (moduleId: string, color: string) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, color } : m)));
    // 不自动关闭颜色选择器，让用户可以继续选择
  };

  // 移除模块
  const removeModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    // 图片组件直接删除，其他模块只是隐藏
    if (module?.type === 'image-widget') {
      setModules(modules.filter((m) => m.id !== moduleId));
    } else {
      setModules(modules.map((m) => (m.id === moduleId ? { ...m, isVisible: false } : m)));
    }
  };

  // 上传图片到模块
  const handleModuleImageUpload = (moduleId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setModules(modules.map((m) => 
        m.id === moduleId ? { ...m, imageUrl: result } : m
      ));
    };
    reader.readAsDataURL(file);
  };

  // 顶部状态栏拖动处理
  const handleTopBarDragStart = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = topBarItems.find((i) => i.id === itemId);
    if (!item) return;

    setDraggingTopBarItem(itemId);
    setTopBarDragOffset({
      x: e.clientX - item.position.x,
      y: e.clientY - item.position.y,
    });
  };

  const handleTopBarDrag = (e: React.MouseEvent) => {
    if (!draggingTopBarItem) return;

    const newX = e.clientX - topBarDragOffset.x;
    const newY = e.clientY - topBarDragOffset.y;

    // 限制只能在顶部状态栏区域移动（y 坐标限制在 -20 到 20 之间）
    const constrainedY = Math.max(-20, Math.min(20, newY));

    setTopBarItems(
      topBarItems.map((item) =>
        item.id === draggingTopBarItem
          ? { ...item, position: { x: newX, y: constrainedY } } // 移除 Math.max(0, newX)，允许负值
          : item
      )
    );
  };

  const handleTopBarDragEnd = () => {
    setDraggingTopBarItem(null);
  };

  // 添加图片组件到顶部状态栏
  const addImageToTopBar = () => {
    const newImageItem = {
      id: `topbar-image-${Date.now()}`,
      type: 'image' as const,
      position: { x: 700, y: 0 },
      customSize: { width: 60, height: 60 },
    };
    setTopBarItems([...topBarItems, newImageItem]);
  };

  // 上传图片到顶部状态栏
  const handleTopBarImageUpload = (itemId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setTopBarItems(topBarItems.map((item) => 
        item.id === itemId ? { ...item, imageUrl: result } : item
      ));
    };
    reader.readAsDataURL(file);
  };

  // 删除顶部状态栏元素
  const removeTopBarItem = (itemId: string) => {
    setTopBarItems(topBarItems.filter((item) => item.id !== itemId));
  };

  // 上传自定义图标
  const handleIconUpload = (moduleType: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setModules(modules.map((m) => 
        m.type === moduleType ? { ...m, customIcon: result } : m
      ));
      // 保存到 localStorage
      localStorage.setItem(`icon_${moduleType}`, result);
    };
    reader.readAsDataURL(file);
  };

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent, moduleType: string) => {
    e.preventDefault();
    setContextMenuModule(moduleType);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // 长按处理（移动端）
  const handleLongPressStart = (moduleId: string) => {
    const timer = setTimeout(() => {
      setLongPressModule(moduleId);
    }, 500); // 500ms 长按
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 复古背景色（每个图标不同）- 使用图片中的颜色
  const vintageColors = [
    '#FFF1B5', // Buttermilk - 奶油黄
    '#C1DBE8', // Pastel Blue - 粉蓝
    '#43302E', // Old Burgundy - 深酒红
    '#3B82F6', // Blue - 蓝色（长期目标）
    '#0891b2', // Cyan - 青色（时间轴）
    '#EAA239', // Tangerine - 橘色
    '#FFF4A1', // Cream - 奶油色
    '#8F9E25', // Leaves - 叶绿
    '#C3A5C1', // Wisteria - 紫藤
    '#97332C', // Mulberry - 桑葚红
  ];

  // 预设颜色
  const presetColors = [
    '#3B82F6', // 蓝色
    '#10B981', // 绿色
    '#F59E0B', // 黄色
    '#EF4444', // 红色
    '#8B5CF6', // 紫色
    '#EC4899', // 粉色
  ];

  return (
    <div
      className="flex h-screen"
      style={{ 
        backgroundColor: '#fefaf0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      }}
      onMouseMove={draggingModule ? handleDrag : resizingModule ? handleResize : undefined}
      onMouseUp={draggingModule ? handleDragEnd : resizingModule ? handleResizeEnd : undefined}
      onClick={() => {
        setShowColorPicker(null);
        setContextMenuModule(null);
      }}
    >
      {/* 左侧功能模块栏 - iOS 风格 */}
      <div 
        className="w-24 flex flex-col items-center py-8 space-y-4"
        style={{ 
          backgroundColor: 'rgba(254, 250, 240, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(84, 41, 22, 0.1)',
        }}
      >
        {/* 头像上传 - iOS 风格 */}
        <div className="relative mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="profile-upload"
          />
          <label
            htmlFor="profile-upload"
            className="block w-20 h-20 rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-95"
            style={{ 
              backgroundColor: 'rgba(254, 250, 240, 0.9)',
              boxShadow: '0 2px 8px rgba(84, 41, 22, 0.15)',
              border: '2px solid rgba(84, 41, 22, 0.1)',
            }}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                📷
              </div>
            )}
          </label>
        </div>
        
        {availableModules.map((moduleDef, index) => {
          const isActive = modules.some(
            (m) => m.type === moduleDef.type && m.isVisible
          );
          
          // 获取当前模块的颜色（如果存在且可见）
          const activeModule = modules.find(
            (m) => m.type === moduleDef.type && m.isVisible
          );
          const iconBgColor = activeModule ? activeModule.color : vintageColors[index];
          
          // 获取自定义图标
          const customIcon = activeModule?.customIcon || localStorage.getItem(`icon_${moduleDef.type}`);
          
          return (
            <div key={moduleDef.id} className="relative">
              <button
                onClick={() => addModule(moduleDef)}
                onContextMenu={(e) => handleContextMenu(e, moduleDef.type)}
                onTouchStart={() => handleLongPressStart(moduleDef.type)}
                onTouchEnd={handleLongPressEnd}
                onMouseDown={() => handleLongPressStart(moduleDef.type)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden active:scale-95
                  ${
                    isActive
                      ? 'scale-110'
                      : ''
                  }
                `}
                style={{
                  backgroundColor: iconBgColor,
                  boxShadow: isActive 
                    ? '0 4px 12px rgba(84, 41, 22, 0.25)' 
                    : '0 2px 6px rgba(84, 41, 22, 0.1)',
                }}
                title={moduleDef.title}
              >
                {customIcon ? (
                  <img src={customIcon} alt={moduleDef.title} className="w-full h-full object-cover" />
                ) : (
                  moduleDef.icon
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 主内容区域 */}
      <div 
        className="flex-1 relative overflow-hidden flex flex-col"
        onMouseMove={(e) => {
          if (draggingModule) {
            handleDrag(e);
          } else if (resizingModule) {
            handleResize(e);
          }
        }}
        onMouseUp={() => {
          handleDragEnd();
          handleResizeEnd();
        }}
      >
        {/* 顶部状态栏 - iOS 风格毛玻璃效果 */}
        <div 
          className="relative z-10 px-8 py-4"
          style={{
            backgroundColor: 'rgba(254, 250, 240, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(84, 41, 22, 0.1)',
            height: '80px',
          }}
          onMouseMove={handleTopBarDrag}
          onMouseUp={handleTopBarDragEnd}
        >
          <div className="relative max-w-7xl mx-auto h-full">
            {/* 可拖动的状态栏元素 */}
            {topBarItems.map((item) => {
              if (item.type === 'identity') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <button
                      onClick={() => setShowHistoryModal('identity')}
                      className="flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 241, 181, 0.9), rgba(255, 228, 181, 0.9))',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(234, 179, 8, 0.2)',
                        boxShadow: '0 2px 8px rgba(84, 41, 22, 0.1)',
                      }}
                    >
                      <div className="text-2xl">👑</div>
                      <div>
                        <div className="text-sm text-black font-semibold tracking-wide">IDENTITY</div>
                        <div className="text-base font-bold text-black">萌芽新手 Lv.1</div>
                      </div>
                    </button>
                  </div>
                );
              }

              if (item.type === 'growth') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <button
                      onClick={() => setShowHistoryModal('growth')}
                      className="flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.9), rgba(191, 219, 254, 0.9))',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        boxShadow: '0 2px 8px rgba(84, 41, 22, 0.1)',
                      }}
                    >
                      <div className="text-2xl">📊</div>
                      <div>
                        <div className="text-sm text-black font-semibold tracking-wide">GROWTH</div>
                        <div className="flex items-center space-x-2">
                          <div className="text-base font-bold text-black">0/200</div>
                          <div className="text-sm text-black">(0%)</div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              }

              if (item.type === 'balance') {
                const isNegative = assetBalance < 0;
                const displayAmount = Math.abs(assetBalance);
                
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <button
                      className="flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all active:scale-95"
                      style={{
                        backgroundColor: isNegative ? 'rgba(139, 0, 0, 0.9)' : 'rgba(212, 237, 218, 0.9)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: isNegative ? '1px solid rgba(102, 0, 0, 0.3)' : '1px solid rgba(195, 230, 203, 0.5)',
                        boxShadow: '0 2px 8px rgba(84, 41, 22, 0.1)',
                        color: isNegative ? '#ffffff' : '#000000',
                      }}
                    >
                      <div className="text-2xl">💴</div>
                      <div>
                        <div 
                          className="text-sm font-semibold tracking-wide"
                          style={{ color: isNegative ? '#ffffff' : '#000000' }}
                        >
                          {isNegative ? '负债' : '余额'}
                        </div>
                        <div 
                          className="text-base font-bold"
                          style={{ color: isNegative ? '#ffffff' : '#000000' }}
                        >
                          {displayAmount.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              }

              if (item.type === 'habits') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <button
                      onClick={() => setShowHistoryModal('habits')}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl transition-all active:scale-95"
                      style={{
                        backgroundColor: 'rgba(254, 249, 195, 0.9)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(254, 240, 138, 0.5)',
                        boxShadow: '0 2px 8px rgba(84, 41, 22, 0.1)',
                      }}
                    >
                      <div className="relative">
                        <div className="text-lg">⚠️</div>
                      </div>
                      <div className="text-sm text-black font-semibold">{habitScore}%</div>
                    </button>
                  </div>
                );
              }

              if (item.type === 'gold') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <button
                      onClick={() => setShowHistoryModal('gold')}
                      className="flex items-center space-x-3 px-5 py-2.5 rounded-2xl transition-all active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, rgba(254, 249, 195, 0.9), rgba(252, 211, 77, 0.9))',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        boxShadow: '0 2px 8px rgba(84, 41, 22, 0.1)',
                      }}
                    >
                      <div className="text-2xl">💰</div>
                      <div>
                        <div className="text-sm text-black font-semibold tracking-wide">BALANCE</div>
                        <div className="text-xl font-bold text-black">{goldBalance}</div>
                      </div>
                    </button>
                  </div>
                );
              }

              if (item.type === 'profile') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <button
                      onClick={() => setShowUserProfile(true)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all active:scale-95 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(243, 232, 255, 0.9), rgba(251, 207, 232, 0.9))',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(192, 132, 252, 0.2)',
                        boxShadow: '0 2px 8px rgba(84, 41, 22, 0.1)',
                      }}
                    >
                      <div className="text-2xl">💕</div>
                      <div>
                        <div className="text-sm text-black font-semibold tracking-wide">我了解的你</div>
                        <div className="text-xs text-purple-600 font-medium">动态画像</div>
                      </div>
                    </button>
                  </div>
                );
              }

              if (item.type === 'review') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <button
                      onClick={() => setShowDailyReview(true)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all active:scale-95 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(237, 233, 254, 0.9), rgba(224, 231, 255, 0.9))',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        boxShadow: '0 2px 8px rgba(84, 41, 22, 0.1)',
                      }}
                    >
                      <div className="text-2xl">📊</div>
                      <div>
                        <div className="text-sm text-black font-semibold tracking-wide">今日复盘</div>
                        <div className="text-xs text-purple-600 font-medium">深度分析</div>
                      </div>
                    </button>
                  </div>
                );
              }

              if (item.type === 'receipt') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <button
                      onClick={() => setShowDailyReceipt(true)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all active:scale-95 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(252, 231, 243, 0.9), rgba(254, 226, 226, 0.9))',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(236, 72, 153, 0.2)',
                        boxShadow: '0 2px 8px rgba(84, 41, 22, 0.1)',
                      }}
                    >
                      <div className="text-2xl animate-bounce">🧾</div>
                      <div>
                        <div className="text-sm text-black font-semibold tracking-wide">每日小票</div>
                        <div className="text-xs text-pink-600 font-medium">点击生成</div>
                      </div>
                    </button>
                  </div>
                );
              }

              if (item.type === 'github') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <GitHubCommitBadge />
                  </div>
                );
              }
              
              if (item.type === 'version') {
                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    <VersionInfo isDark={false} />
                  </div>
                );
              }

              if (item.type === 'image') {
                const size = item.customSize || { width: 60, height: 60 };
                return (
                  <div
                    key={item.id}
                    className="absolute group"
                    style={{
                      left: item.position.x,
                      top: item.position.y,
                      width: size.width,
                      height: size.height,
                      cursor: draggingTopBarItem === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleTopBarDragStart(item.id, e)}
                  >
                    {item.imageUrl ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={item.imageUrl} 
                          alt="Top bar widget" 
                          className="w-full h-full object-cover rounded-lg shadow-sm"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTopBarItem(item.id);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label 
                        htmlFor={`topbar-image-upload-${item.id}`}
                        className="w-full h-full flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95"
                        style={{
                          backgroundColor: 'rgba(254, 250, 240, 0.9)',
                          border: '1px solid rgba(84, 41, 22, 0.1)',
                          boxShadow: '0 2px 6px rgba(84, 41, 22, 0.1)',
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl">🖼️</div>
                        </div>
                        <input
                          id={`topbar-image-upload-${item.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleTopBarImageUpload(item.id, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* 模块容器区域 - 可滚动 */}
        <div className="flex-1 relative overflow-y-auto overflow-x-hidden">
        {/* 模块容器 - 设置最小高度以支持向下拖动 */}
        <div className="relative" style={{ minHeight: '200vh' }}>
        {modules
          .filter((m) => m.isVisible)
          .map((module) => {
            // 图片组件特殊处理
            if (module.type === 'image-widget') {
              const currentSize = module.customSize || { width: 300, height: 300 };
              
              return (
                <div
                  key={module.id}
                  className="absolute rounded-2xl shadow-lg overflow-hidden"
                  style={{
                    left: module.position.x,
                    top: module.position.y,
                    width: currentSize.width,
                    height: currentSize.height,
                    cursor: draggingModule === module.id ? 'grabbing' : 'grab',
                    zIndex: draggingModule === module.id ? 1000 : 1,
                    boxShadow: '0 4px 16px rgba(84, 41, 22, 0.15)',
                  }}
                  onMouseDown={(e) => handleDragStart(module.id, e)}
                  onTouchStart={() => handleLongPressStart(module.id)}
                  onTouchEnd={handleLongPressEnd}
                >
                  {module.imageUrl ? (
                    <img 
                      src={module.imageUrl} 
                      alt="Widget" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <label 
                      htmlFor={`image-upload-${module.id}`}
                      className="w-full h-full flex items-center justify-center cursor-pointer transition-all active:scale-95"
                      style={{
                        backgroundColor: 'rgba(254, 250, 240, 0.9)',
                        border: '1px solid rgba(84, 41, 22, 0.1)',
                      }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <div className="text-sm" style={{ color: '#542916' }}>点击上传图片</div>
                      </div>
                      <input
                        id={`image-upload-${module.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleModuleImageUpload(module.id, file);
                        }}
                      />
                    </label>
                  )}
                  
                  {/* 图片组件：隐藏的调整大小区域（右下角 20% 区域） */}
                  <div
                    className="absolute bottom-0 right-0 w-1/5 h-1/5 cursor-se-resize"
                    style={{ minWidth: '40px', minHeight: '40px' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(module.id, e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title="拖拽缩放"
                  />
                </div>
              );
            }
            
            // 其他模块的原有逻辑
            const baseSize = moduleSizes[module.size];
            // 使用模块特定尺寸，如果没有则使用默认尺寸
            const specificSize = moduleSpecificSizes[module.type] || {};
            const actualBaseSize = { 
              width: specificSize.width || baseSize.width, 
              height: specificSize.height || baseSize.height 
            };
            const currentSize = module.customSize || actualBaseSize;
            
            // 计算缩放比例 - 使用较大的缩放比例，保持等比例缩放
            const scaleX = currentSize.width / actualBaseSize.width;
            const scaleY = currentSize.height / actualBaseSize.height;
            const scale = Math.max(scaleX, scaleY); // 使用较大的比例，确保内容填充
            
            const moduleDefinition = availableModules.find((m) => m.type === module.type);

            return (
              <div
                key={module.id}
                className="absolute rounded-lg shadow-lg"
                style={{
                  left: module.position.x,
                  top: module.position.y,
                  width: currentSize.width,
                  height: currentSize.height,
                  backgroundColor: module.color,
                  cursor: draggingModule === module.id ? 'grabbing' : 'default',
                  zIndex: draggingModule === module.id ? 1000 : 1,
                  overflow: 'hidden',
                }}
              >
                {/* 模块头部 - 不缩放 */}
                  <div
                    className="flex items-center justify-between p-4 cursor-move"
                    onMouseDown={(e) => handleDragStart(module.id, e)}
                    style={{ 
                      backgroundColor: module.color,
                      color: isColorDark(module.color) ? '#ffffff' : '#000000',
                      height: '60px',
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <GripVertical 
                        className="w-4 h-4" 
                        style={{ color: isColorDark(module.color) ? '#ffffff' : '#000000' }}
                      />
                      {/* 显示自定义图标或默认图标 */}
                      <div className="w-8 h-8 flex items-center justify-center">
                        {module.customIcon ? (
                          <img 
                            src={module.customIcon} 
                            alt={module.title} 
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div>{module.icon}</div>
                        )}
                      </div>
                      <h3 
                        className="font-semibold"
                        style={{ color: isColorDark(module.color) ? '#ffffff' : '#000000' }}
                      >
                        {module.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* 颜色选择器 */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(
                              showColorPicker === module.id ? null : module.id
                            );
                          }}
                          className="p-1 rounded transition-colors"
                          style={{ 
                            backgroundColor: isColorDark(module.color) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                          }}
                          title="修改颜色"
                        >
                          <Palette 
                            className="w-4 h-4" 
                            style={{ color: isColorDark(module.color) ? '#ffffff' : '#000000' }}
                          />
                        </button>

                        {showColorPicker === module.id && (
                          <div 
                            className="absolute right-0 top-8 bg-white rounded-lg shadow-xl p-4 z-50 border border-neutral-200"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          style={{ minWidth: '280px' }}
                          >
                            {/* 复古颜色 - 第一排 */}
                            <div className="mb-2">
                              <div className="text-xs text-neutral-500 mb-2">复古配色</div>
                              <div className="grid grid-cols-7 gap-2">
                                {vintageColors.map((color) => (
                                  <button
                                    key={color}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeModuleColor(module.id, color);
                                    }}
                                    className="w-8 h-8 rounded-lg border-2 border-neutral-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* 预设颜色 - 第二排 */}
                            <div className="mb-3">
                              <div className="text-xs text-neutral-500 mb-2">预设颜色</div>
                              <div className="grid grid-cols-7 gap-2">
                                {presetColors.map((color) => (
                                  <button
                                    key={color}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeModuleColor(module.id, color);
                                    }}
                                    className="w-8 h-8 rounded-lg border-2 border-neutral-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* 自定义颜色选择器 */}
                            <div>
                              <div className="text-xs text-neutral-500 mb-2">自定义颜色</div>
                              <input
                                type="color"
                                value={module.color}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  changeModuleColor(module.id, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-10 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 关闭按钮 */}
                      <button
                        onClick={() => removeModule(module.id)}
                        className="p-1 rounded transition-colors"
                        style={{ 
                          backgroundColor: isColorDark(module.color) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                        }}
                        title="隐藏模块"
                      >
                        <X 
                          className="w-4 h-4" 
                          style={{ color: isColorDark(module.color) ? '#ffffff' : '#000000' }}
                        />
                      </button>
                    </div>
                  </div>

                {/* 模块内容 - 可滚动，不缩放 */}
                  <div 
                    style={{ 
                      backgroundColor: module.color,
                      color: isColorDark(module.color) ? '#ffffff' : '#000000',
                    height: `${currentSize.height - 60}px`,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    }}
                  >
                    {/* 渲染新的游戏系统组件 */}
                    {module.type === 'pet' && <PetWidget />}
                    {module.type === 'focus' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                        <FocusTimer />
                        <FocusStatsPanel />
                      </div>
                    )}
                    {module.type === 'leaderboard' && <LeaderboardPanel />}
                    
                    {/* 原有模块 */}
                    {moduleDefinition?.component && !['pet', 'focus', 'leaderboard'].includes(module.type) &&
                      React.createElement(moduleDefinition.component, { 
                        isDark: isColorDark(module.color),
                        bgColor: module.color,
                      onOpen: module.type === 'ai-smart' ? onOpenAISmart : undefined,
                      moduleSize: currentSize, // 传递模块尺寸给子组件
                      })
                    }
                  </div>

                {/* 调整大小手柄 - 放在缩放包装器外面，紧贴容器底部 */}
                  <div
                  className="absolute right-2 bottom-2 cursor-se-resize flex items-center justify-center"
                  style={{
                    width: '24px',
                    height: '24px',
                    zIndex: 10,
                  }}
                    onMouseDown={(e) => handleResizeStart(module.id, e)}
                    title="拖拽缩放"
                  >
                    <div 
                    className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: isColorDark(module.color) ? '#ffffff' : '#000000',
                      opacity: 0.5
                      }}
                    />
                </div>
              </div>
            );
          })}

        {/* 空状态提示 */}
        {modules.filter((m) => m.isVisible).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                欢迎来到 ManifestOS
              </h2>
              <p className="text-neutral-600 mb-6">
                点击左侧图标添加功能模块到主页
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-neutral-500">
                <div>💡 单击添加模块</div>
                <div>🎨 修改颜色</div>
                <div>↔️ 拖拽移动</div>
                <div>↘️ 调整大小</div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

        {/* 历史记录弹窗 - iOS 风格 */}
        {showHistoryModal && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onClick={() => setShowHistoryModal(null)}
          >
            <div 
              className="max-w-2xl w-full max-h-[80vh] overflow-hidden rounded-2xl"
              style={{
                backgroundColor: 'rgba(254, 250, 240, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(84, 41, 22, 0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div 
                className="p-6"
                style={{
                  background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                  color: '#ffffff',
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {showHistoryModal === 'gold' && '💰 金币历史记录'}
                    {showHistoryModal === 'growth' && '📊 成长值历史'}
                    {showHistoryModal === 'identity' && '👑 升级历史'}
                    {showHistoryModal === 'habits' && '⚠️ 坏习惯记录'}
                  </h2>
                  <button
                    onClick={() => setShowHistoryModal(null)}
                    className="p-2 rounded-xl transition-all active:scale-95"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {showHistoryModal === 'gold' && (
                  <div className="space-y-3">
                    <div className="text-center py-8" style={{ color: '#b79858' }}>
                      <div className="text-4xl mb-2">💰</div>
                      <p>暂无金币交易记录</p>
                      <p className="text-sm mt-2">完成任务即可获得金币奖励</p>
                    </div>
                  </div>
                )}

                {showHistoryModal === 'growth' && (
                  <div className="space-y-3">
                    <div className="text-center py-8" style={{ color: '#b79858' }}>
                      <div className="text-4xl mb-2">📊</div>
                      <p>暂无成长值记录</p>
                      <p className="text-sm mt-2">完成任务和目标即可获得成长值</p>
                    </div>
                  </div>
                )}

                {showHistoryModal === 'identity' && (
                  <div className="space-y-3">
                    <div className="text-center py-8" style={{ color: '#b79858' }}>
                      <div className="text-4xl mb-2">👑</div>
                      <p>暂无升级记录</p>
                      <p className="text-sm mt-2">当前等级：萌芽新手 Lv.1</p>
                      <p className="text-sm">下一等级需要：200 成长值</p>
                    </div>
                  </div>
                )}

                {showHistoryModal === 'habits' && (
                  <div className="space-y-3">
                    <div className="text-center py-8" style={{ color: '#b79858' }}>
                      <div className="text-4xl mb-2">⚠️</div>
                      <p>暂无坏习惯记录</p>
                      <p className="text-sm mt-2">当前坏习惯分数：{habitScore}%</p>
                      <p className="text-sm">每2小时无坏习惯自动-1%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 右键菜单 - iOS 风格 */}
        {contextMenuModule && (
          <>
            <div 
              className="fixed inset-0 z-[90]"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuModule(null);
              }}
            />
            <div
              className="fixed z-[100] rounded-2xl py-2 min-w-[180px]"
              style={{
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
                backgroundColor: 'rgba(254, 250, 240, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 4px 16px rgba(84, 41, 22, 0.2)',
                border: '1px solid rgba(84, 41, 22, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <label
                htmlFor={`icon-upload-${contextMenuModule}`}
                className="flex items-center space-x-3 px-4 py-2 cursor-pointer transition-all active:scale-95 block rounded-xl"
                style={{
                  backgroundColor: 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <span className="text-lg">📷</span>
                <span className="text-sm font-medium" style={{ color: '#542916' }}>上传自定义图标</span>
              </label>
              <input
                id={`icon-upload-${contextMenuModule}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  e.stopPropagation();
                  const file = e.target.files?.[0];
                  if (file && contextMenuModule) {
                    handleIconUpload(contextMenuModule, file);
                    setContextMenuModule(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (contextMenuModule) {
                    localStorage.removeItem(`icon_${contextMenuModule}`);
                    setModules(modules.map((m) => 
                      m.type === contextMenuModule ? { ...m, customIcon: undefined } : m
                    ));
                    setContextMenuModule(null);
                  }
                }}
                className="flex items-center space-x-3 px-4 py-2 cursor-pointer transition-all active:scale-95 w-full text-left rounded-xl"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                <span className="text-lg">🔄</span>
                <span className="text-sm font-medium" style={{ color: '#542916' }}>恢复默认图标</span>
              </button>
            </div>
          </>
        )}

        {/* 长按删除确认弹窗 - iOS 风格 */}
        {longPressModule && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onClick={() => setLongPressModule(null)}
          >
            <div 
              className="p-6 max-w-sm w-full rounded-2xl"
              style={{
                backgroundColor: 'rgba(254, 250, 240, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(84, 41, 22, 0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🗑️</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#542916' }}>删除图片</h3>
                <p style={{ color: '#b79858' }}>确定要删除这张图片吗？</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setLongPressModule(null)}
                  className="flex-1 px-4 py-2 rounded-xl font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: 'rgba(84, 41, 22, 0.1)',
                    color: '#542916',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (longPressModule) {
                      removeModule(longPressModule);
                      setLongPressModule(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: '#FF3B30',
                    color: '#ffffff',
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 每日小票弹窗 */}
        <DailyReceipt
          show={showDailyReceipt}
          onClose={() => setShowDailyReceipt(false)}
          date={new Date()}
          tasks={[]} // TODO: 传入实际任务数据
          totalGold={goldBalance}
          isDark={false}
        />
        
        {/* 标签管理弹窗 */}
        <TagManagerV2
          isOpen={showTagManager}
          onClose={() => setShowTagManager(false)}
          isDark={false}
        />
        
        {/* 用户画像弹窗 */}
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
        
        {/* 日复盘弹窗 */}
        <DailyReviewModal
          isOpen={showDailyReview}
          onClose={() => setShowDailyReview(false)}
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
      </div>
    </div>
  );
}
