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
} from './ModuleComponents';
import JournalModule from '@/components/journal/JournalModule';
import PanoramaMemory from '@/components/memory/PanoramaMemory';
import { supabase, isSupabaseConfigured, getCurrentUserId } from '@/lib/supabase';

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
    id: 'journal',
    type: 'journal',
    title: '成功&感恩日记',
    icon: <span className="text-2xl">📔</span>,
    defaultColor: '#F59E0B',
    component: JournalModule,
  },
  {
    id: 'memory',
    type: 'memory',
    title: '全景记忆栏',
    icon: <span className="text-2xl">🧠</span>,
    defaultColor: '#8B5CF6',
    component: PanoramaMemory,
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
  small: { width: 450, height: 650 },
  medium: { width: 600, height: 900 },
  large: { width: 800, height: 1200 },
};

// 不同模块类型的特定高度（根据实际内容）
const moduleSpecificHeights: Record<string, number> = {
  'goals': 700,          // 长期目标
  'timeline': 600,       // 时间轴
  'gold': 700,           // 金币经济
  'habits': 800,         // 坏习惯
  'reports': 700,        // 数据报告
  'settings': 800,       // 设置
  'kiki': 400,           // Kiki宝宝 - 内容少
  'journal': 750,        // 成功&感恩日记
  'memory': 800,         // 全景记忆栏
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

  // 从 Supabase 加载模块配置
  useEffect(() => {
    const loadModules = async () => {
      if (!isSupabaseConfigured()) {
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
      style={{ backgroundColor: '#e2d9bc' }}
      onMouseMove={draggingModule ? handleDrag : resizingModule ? handleResize : undefined}
      onMouseUp={draggingModule ? handleDragEnd : resizingModule ? handleResizeEnd : undefined}
      onClick={() => {
        setShowColorPicker(null);
        setContextMenuModule(null);
      }}
    >
      {/* 左侧功能模块栏 */}
      <div className="w-24 flex flex-col items-center py-8 space-y-4" style={{ backgroundColor: '#e2d9bc' }}>
        {/* 头像上传 */}
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
            className="block w-20 h-20 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-neutral-300 shadow-lg"
            style={{ backgroundColor: '#D1CBBA' }}
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
                  w-12 h-12 rounded-lg flex items-center justify-center transition-all overflow-hidden
                  ${
                    isActive
                      ? 'shadow-lg scale-110'
                      : 'hover:scale-105'
                  }
                `}
                style={{
                  backgroundColor: iconBgColor,
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
        {/* 顶部状态栏 - 透明背景，与主页一致 */}
        <div 
          className="relative z-10 px-8 py-4"
          style={{
            backgroundColor: 'transparent', // 透明背景
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* 左侧：身份等级 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowHistoryModal('identity')}
                className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 shadow-sm hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="text-2xl">👑</div>
                <div>
                  <div className="text-sm text-black font-semibold tracking-wide">IDENTITY</div>
                  <div className="text-base font-bold text-black">萌芽新手 Lv.1</div>
                </div>
              </button>
              
              {/* 成长值进度 */}
              <button
                onClick={() => setShowHistoryModal('growth')}
                className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 shadow-sm hover:scale-105 transition-transform cursor-pointer"
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
              
              {/* 本周成长 */}
              <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100/50">
                <div className="text-lg">⚡</div>
                <div className="text-sm text-black font-semibold">+0 本周</div>
              </div>

              {/* 坏习惯指示器 */}
              <button
                onClick={() => setShowHistoryModal('habits')}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-100/50 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="relative">
                  <div className="text-lg">⚠️</div>
                </div>
                <div className="text-sm text-black font-semibold">{habitScore}%</div>
              </button>
            </div>

            {/* 右侧：金币余额 */}
            <button
              onClick={() => setShowHistoryModal('gold')}
              className="flex items-center space-x-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100/50 shadow-sm hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="text-2xl">💰</div>
              <div>
                <div className="text-sm text-black font-semibold tracking-wide">BALANCE</div>
                <div className="text-xl font-bold text-black">0</div>
              </div>
            </button>
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
                  className="absolute rounded-xl shadow-lg overflow-hidden"
                  style={{
                    left: module.position.x,
                    top: module.position.y,
                    width: currentSize.width,
                    height: currentSize.height,
                    cursor: draggingModule === module.id ? 'grabbing' : 'grab',
                    zIndex: draggingModule === module.id ? 1000 : 1,
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
                      className="w-full h-full flex items-center justify-center bg-neutral-100 cursor-pointer hover:bg-neutral-200 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <div className="text-sm text-neutral-600">点击上传图片</div>
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
            // 使用模块特定高度，如果没有则使用默认高度
            const specificHeight = moduleSpecificHeights[module.type] || baseSize.height;
            const actualBaseSize = { width: baseSize.width, height: specificHeight };
            const currentSize = module.customSize || actualBaseSize;
            
            // 计算缩放比例
            const scale = Math.min(
              currentSize.width / actualBaseSize.width,
              currentSize.height / actualBaseSize.height
            );
            
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
                {/* 缩放包装器 - 整体缩放 */}
                <div
                  style={{
                    width: actualBaseSize.width,
                    height: actualBaseSize.height,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'relative',
                  }}
                >
                  {/* 模块头部 */}
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
                      <div>{module.icon}</div>
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
                            style={{ minWidth: '280px', transform: `scale(${1/scale})`, transformOrigin: 'top right' }}
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

                  {/* 模块内容 - 自动高度，显示所有内容，不要滚动条 */}
                  <div 
                    style={{ 
                      backgroundColor: module.color,
                      color: isColorDark(module.color) ? '#ffffff' : '#000000',
                      minHeight: `${actualBaseSize.height - 60}px`,
                      overflow: 'visible', // 让内容可见，不裁剪
                    }}
                  >
                    {moduleDefinition?.component && 
                      React.createElement(moduleDefinition.component, { 
                        isDark: isColorDark(module.color),
                        bgColor: module.color,
                        onOpen: module.type === 'ai-smart' ? onOpenAISmart : undefined
                      })
                    }
                  </div>

                  {/* 调整大小手柄 - 简洁的小圆点 */}
                  <div
                    className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(module.id, e)}
                    title="拖拽缩放"
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ 
                        backgroundColor: isColorDark(module.color) ? '#ffffff' : '#000000',
                        opacity: 0.3
                      }}
                    />
                  </div>
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

        {/* 历史记录弹窗 */}
        {showHistoryModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowHistoryModal(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {showHistoryModal === 'gold' && '💰 金币历史记录'}
                    {showHistoryModal === 'growth' && '📊 成长值历史'}
                    {showHistoryModal === 'identity' && '👑 升级历史'}
                    {showHistoryModal === 'habits' && '⚠️ 坏习惯记录'}
                  </h2>
                  <button
                    onClick={() => setShowHistoryModal(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {showHistoryModal === 'gold' && (
                  <div className="space-y-3">
                    <div className="text-center text-neutral-500 py-8">
                      <div className="text-4xl mb-2">💰</div>
                      <p>暂无金币交易记录</p>
                      <p className="text-sm mt-2">完成任务即可获得金币奖励</p>
                    </div>
                  </div>
                )}

                {showHistoryModal === 'growth' && (
                  <div className="space-y-3">
                    <div className="text-center text-neutral-500 py-8">
                      <div className="text-4xl mb-2">📊</div>
                      <p>暂无成长值记录</p>
                      <p className="text-sm mt-2">完成任务和目标即可获得成长值</p>
                    </div>
                  </div>
                )}

                {showHistoryModal === 'identity' && (
                  <div className="space-y-3">
                    <div className="text-center text-neutral-500 py-8">
                      <div className="text-4xl mb-2">👑</div>
                      <p>暂无升级记录</p>
                      <p className="text-sm mt-2">当前等级：萌芽新手 Lv.1</p>
                      <p className="text-sm">下一等级需要：200 成长值</p>
                    </div>
                  </div>
                )}

                {showHistoryModal === 'habits' && (
                  <div className="space-y-3">
                    <div className="text-center text-neutral-500 py-8">
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

        {/* 右键菜单 - 上传自定义图标 */}
        {contextMenuModule && (
          <>
            <div 
              className="fixed inset-0 z-[90]"
              onClick={() => setContextMenuModule(null)}
            />
            <div
              className="fixed z-[100] bg-white rounded-lg shadow-xl border border-neutral-200 py-2 min-w-[180px]"
              style={{
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
              }}
            >
              <label
                htmlFor={`icon-upload-${contextMenuModule}`}
                className="flex items-center space-x-3 px-4 py-2 hover:bg-neutral-100 cursor-pointer transition-colors"
              >
                <span className="text-lg">📷</span>
                <span className="text-sm font-medium text-neutral-700">上传自定义图标</span>
                <input
                  id={`icon-upload-${contextMenuModule}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && contextMenuModule) {
                      handleIconUpload(contextMenuModule, file);
                      setContextMenuModule(null);
                    }
                  }}
                />
              </label>
              <button
                onClick={() => {
                  if (contextMenuModule) {
                    localStorage.removeItem(`icon_${contextMenuModule}`);
                    setModules(modules.map((m) => 
                      m.type === contextMenuModule ? { ...m, customIcon: undefined } : m
                    ));
                    setContextMenuModule(null);
                  }
                }}
                className="flex items-center space-x-3 px-4 py-2 hover:bg-neutral-100 cursor-pointer transition-colors w-full text-left"
              >
                <span className="text-lg">🔄</span>
                <span className="text-sm font-medium text-neutral-700">恢复默认图标</span>
              </button>
            </div>
          </>
        )}

        {/* 长按删除确认弹窗 */}
        {longPressModule && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setLongPressModule(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🗑️</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">删除图片</h3>
                <p className="text-neutral-600">确定要删除这张图片吗？</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setLongPressModule(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors"
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
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
