import { useState, useEffect } from 'react';
import { Plus, Settings, X, Save, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import type { Task, TaskType } from '@/types';
import ImportExportButton from './ImportExportButton';

interface QuickStartItem {
  id: string;
  emoji: string;
  label: string;
  taskType: TaskType;
  tags?: string[]; // 自定义标签
  defaultDuration?: number; // 默认时长（分钟），用于预估
  folderId?: string; // 所属文件夹ID
}

interface QuickStartFolder {
  id: string;
  name: string;
  emoji: string;
  collapsed: boolean;
}

interface QuickStartViewProps {
  tasks: Task[]; // 新增：接收任务列表
  onTaskCreate: (task: Partial<Task>) => Promise<Task> | void; // 修改：支持返回Promise
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void; // 新增：更新任务
  onTaskDelete?: (taskId: string) => void; // 兼容现有调用
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
  isDark?: boolean;
}

interface ActiveTimer {
  itemId: string;
  startTime: Date;
  emoji: string;
  label: string;
  taskType: TaskType;
  taskId: string; // 关联的任务ID
}

export default function QuickStartView({
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete: _onTaskDelete,
  bgColor = '#ffffff',
  textColor = '#000000',
  accentColor = '#666666',
  borderColor = 'rgba(0, 0, 0, 0.1)',
  isDark = false,
}: QuickStartViewProps) {
  const [activeTimers, setActiveTimers] = useState<Map<string, ActiveTimer>>(new Map());
  const [elapsedTimes, setElapsedTimes] = useState<Map<string, number>>(new Map());
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSettingItemId, setSelectedSettingItemId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<QuickStartItem | null>(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState<QuickStartFolder | null>(null);

  // 文件夹管理
  const [folders, setFolders] = useState<QuickStartFolder[]>(() => {
    const saved = localStorage.getItem('quickStartFolders');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 'daily', name: '日常', emoji: '🌅', collapsed: false },
      { id: 'work', name: '工作', emoji: '💼', collapsed: false },
      { id: 'study', name: '学习', emoji: '📚', collapsed: false },
    ];
  });

  // 预设的快捷任务（从 localStorage 加载）
  const [quickStartItems, setQuickStartItems] = useState<QuickStartItem[]>(() => {
    const saved = localStorage.getItem('quickStartItems');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 'work', emoji: '💻', label: '工作', taskType: 'work', tags: ['工作'], defaultDuration: 120, folderId: 'work' },
      { id: 'reading', emoji: '😌', label: '看小说', taskType: 'rest', tags: ['休闲', '阅读'], defaultDuration: 30, folderId: 'daily' },
      { id: 'exercise', emoji: '🚶', label: '散步、运动', taskType: 'health', tags: ['运动', '健康'], defaultDuration: 30, folderId: 'daily' },
      { id: 'fishing', emoji: '🐟', label: '钓鱼', taskType: 'rest', tags: ['休闲'], defaultDuration: 60, folderId: 'daily' },
      { id: 'study', emoji: '📖', label: '阅读', taskType: 'study', tags: ['学习', '阅读'], defaultDuration: 60, folderId: 'study' },
      { id: 'phone', emoji: '📱', label: '刷小红书', taskType: 'rest', tags: ['休闲', '社交'], defaultDuration: 30, folderId: 'daily' },
      { id: 'wash', emoji: '🚿', label: '洗漱', taskType: 'life', tags: ['生活'], defaultDuration: 20, folderId: 'daily' },
      { id: 'writing', emoji: '🖊️', label: '写手账', taskType: 'creative', tags: ['创作', '记录'], defaultDuration: 30, folderId: 'daily' },
      { id: 'listen', emoji: '🪐', label: '听播客', taskType: 'rest', tags: ['休闲', '学习'], defaultDuration: 30, folderId: 'study' },
      { id: 'shopping', emoji: '🛍️', label: '购物', taskType: 'life', tags: ['生活', '购物'], defaultDuration: 60, folderId: 'daily' },
      { id: 'social', emoji: '🐱', label: '社交', taskType: 'social', tags: ['社交'], defaultDuration: 60, folderId: 'daily' },
      { id: 'housework', emoji: '🧽', label: '家务', taskType: 'life', tags: ['生活', '家务'], defaultDuration: 30, folderId: 'daily' },
    ];
  });

  // 新建/编辑表单状态
  const [formData, setFormData] = useState<QuickStartItem>({
    id: '',
    emoji: '⭐',
    label: '',
    taskType: 'life',
    tags: [],
    defaultDuration: 30,
    folderId: undefined,
  });

  const [folderFormData, setFolderFormData] = useState<QuickStartFolder>({
    id: '',
    name: '',
    emoji: '📁',
    collapsed: false,
  });

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('quickStartItems', JSON.stringify(quickStartItems));
  }, [quickStartItems]);

  useEffect(() => {
    localStorage.setItem('quickStartFolders', JSON.stringify(folders));
  }, [folders]);

  // 更新计时器
  useEffect(() => {
    const interval = setInterval(() => {
      const newElapsedTimes = new Map<string, number>();
      activeTimers.forEach((timer, itemId) => {
        const elapsed = Math.floor((Date.now() - timer.startTime.getTime()) / 1000);
        newElapsedTimes.set(itemId, elapsed);
      });
      setElapsedTimes(newElapsedTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers]);

  const handleToggle = async (item: QuickStartItem) => {
    const isActive = activeTimers.has(item.id);

    if (isActive) {
      // 结束计时
      const timer = activeTimers.get(item.id)!;
      const endTime = new Date();
      const durationMinutes = Math.ceil((endTime.getTime() - timer.startTime.getTime()) / 60000);

      // 更新任务为已完成
      onTaskUpdate(timer.taskId, {
        scheduledEnd: endTime,
        actualEnd: endTime,
        durationMinutes: durationMinutes,
        status: 'completed',
      });

      // 移除计时器
      const newTimers = new Map(activeTimers);
      newTimers.delete(item.id);
      setActiveTimers(newTimers);

      const newElapsed = new Map(elapsedTimes);
      newElapsed.delete(item.id);
      setElapsedTimes(newElapsed);
      
      console.log('⏹️ 快捷任务已结束:', item.label, timer.taskId);
    } else {
      // 开始计时 - 立即创建任务
      const startTime = new Date();
      
      // 创建进行中的任务
      const newTask = {
        title: item.label,
        taskType: item.taskType,
        priority: 3 as const,
        durationMinutes: item.defaultDuration || 30,
        scheduledStart: startTime,
        scheduledEnd: new Date(startTime.getTime() + (item.defaultDuration || 30) * 60000),
        actualStart: startTime,
        status: 'in_progress' as const,
        tags: item.tags || [],
        goldEarned: 0,
        penaltyGold: 0,
        growthDimensions: {},
        longTermGoals: {},
        identityTags: [],
        enableProgressCheck: false,
        progressChecks: [],
      };
      
      try {
        console.log('🚀 开始创建快捷任务:', item.label);
        const createdTask = await onTaskCreate(newTask);
        
        console.log('📝 任务创建结果:', createdTask);
        
        if (createdTask && createdTask.id) {
          // 立即添加计时器
          const newTimers = new Map(activeTimers);
          newTimers.set(item.id, {
            itemId: item.id,
            startTime: startTime,
            emoji: item.emoji,
            label: item.label,
            taskType: item.taskType,
            taskId: createdTask.id,
          });
          setActiveTimers(newTimers);
          
          // 初始化计时显示
          const newElapsed = new Map(elapsedTimes);
          newElapsed.set(item.id, 0);
          setElapsedTimes(newElapsed);
          
          console.log('✅ 快捷任务已开始:', item.label, createdTask.id);
        } else {
          console.error('❌ 创建任务失败：没有返回任务ID');
        }
      } catch (error) {
        console.error('❌ 创建快捷任务失败:', error);
      }
    }
  };

  // 监听任务变化，同步计时器状态
  useEffect(() => {
    // 检查是否有任务被外部完成（比如在时间轴上点击完成）
    const newTimers = new Map(activeTimers);
    let hasChanges = false;

    activeTimers.forEach((timer, itemId) => {
      const task = tasks.find(t => t.id === timer.taskId);
      if (!task || task.status === 'completed') {
        // 任务已完成或被删除，移除计时器
        newTimers.delete(itemId);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setActiveTimers(newTimers);
    }
  }, [tasks, activeTimers]);

  const toggleFolder = (folderId: string) => {
    setFolders(folders.map(f => 
      f.id === folderId ? { ...f, collapsed: !f.collapsed } : f
    ));
  };

  const handleSaveFolder = () => {
    if (!folderFormData.name.trim()) {
      alert('请输入文件夹名称');
      return;
    }

    if (editingFolder) {
      setFolders(folders.map(f => 
        f.id === editingFolder.id ? { ...folderFormData, id: editingFolder.id } : f
      ));
    } else {
      const newFolder = {
        ...folderFormData,
        id: `folder_${Date.now()}`,
      };
      setFolders([...folders, newFolder]);
    }

    setFolderFormData({
      id: '',
      name: '',
      emoji: '📁',
      collapsed: false,
    });
    setEditingFolder(null);
    setShowFolderForm(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('确定要删除这个文件夹吗？文件夹内的按钮将移到未分类。')) {
      setFolders(folders.filter(f => f.id !== folderId));
      // 清除该文件夹下所有按钮的 folderId
      setQuickStartItems(quickStartItems.map(item => 
        item.folderId === folderId ? { ...item, folderId: undefined } : item
      ));
    }
  };

  const handleSaveItem = () => {
    if (!formData.label.trim()) {
      alert('请输入标签名称');
      return;
    }

    if (editingItem) {
      // 编辑现有项
      setQuickStartItems(quickStartItems.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      // 添加新项
      const newItem = {
        ...formData,
        id: `custom_${Date.now()}`,
      };
      setQuickStartItems([...quickStartItems, newItem]);
    }

    // 重置表单
    setFormData({
      id: '',
      emoji: '⭐',
      label: '',
      taskType: 'life',
      tags: [],
      defaultDuration: 30,
      folderId: undefined,
    });
    setEditingItem(null);
    setShowAddForm(false);
    setShowSettings(false);
  };

  const handleEditItem = (item: QuickStartItem) => {
    setSelectedSettingItemId(null);
    setFormData(item);
    setEditingItem(item);
    setShowAddForm(true);
    setShowSettings(false);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('确定要删除这个快捷按钮吗？')) {
      setSelectedSettingItemId(null);
      setQuickStartItems(quickStartItems.filter(item => item.id !== itemId));
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !formData.tags?.includes(tag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag.trim()],
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayLabel = (label: string): string => {
    return label.slice(0, 3);
  };

  const renderQuickStartGrid = (items: QuickStartItem[], padded = false) => {
    return (
      <div
        className={`grid gap-2.5 ${padded ? 'pl-1' : ''}`}
        style={{
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
        }}
      >
        {items.map((item) => {
          const isActive = activeTimers.has(item.id);
          const elapsed = elapsedTimes.get(item.id) || 0;
          const isSelectedInSettings = showSettings && selectedSettingItemId === item.id;

          return (
            <div key={item.id} className="relative quick-start-card">
              <button
                data-item-id={item.id}
                onClick={() => {
                  if (showSettings) {
                    setSelectedSettingItemId(prev => prev === item.id ? null : item.id);
                    return;
                  }
                  handleToggle(item);
                }}
                className="quick-start-button w-full relative overflow-hidden transition-all duration-200 active:scale-[0.97]"
                style={{
                  aspectRatio: '0.94',
                  borderRadius: '22px',
                  padding: '0.48rem 0.22rem 0.34rem',
                  background: isDark
                    ? (isActive
                      ? 'linear-gradient(180deg, rgba(255,123,172,0.92) 0%, rgba(255,93,149,0.88) 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 100%)')
                    : (isActive
                      ? 'linear-gradient(180deg, rgba(255,127,176,0.98) 0%, rgba(255,94,151,0.96) 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(248,250,252,0.82) 100%)'),
                  border: isSelectedInSettings
                    ? '1.5px solid rgba(99,102,241,0.40)'
                    : isActive
                      ? '1px solid rgba(255,255,255,0.30)'
                      : isDark
                        ? '1px solid rgba(255,255,255,0.10)'
                        : '1px solid rgba(255,255,255,0.72)',
                  boxShadow: isSelectedInSettings
                    ? '0 0 0 3px rgba(99,102,241,0.10), 0 10px 24px rgba(99,102,241,0.14)'
                    : isActive
                      ? '0 10px 22px rgba(255,93,149,0.18), inset 0 1px 0 rgba(255,255,255,0.24)'
                      : isDark
                        ? '0 10px 24px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.06)'
                        : '0 10px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(18px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                  transform: isSelectedInSettings ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
                }}
              >
                {!isActive && (
                  <div
                    className="absolute inset-x-2.5 top-1.5 h-px"
                    style={{
                      background: isDark
                        ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.96), transparent)',
                    }}
                  />
                )}

                {showSettings && (
                  <div
                    className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full"
                    style={{
                      background: isSelectedInSettings
                        ? 'linear-gradient(180deg, #7C6BE6 0%, #5B53D6 100%)'
                        : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(148,163,184,0.28)'),
                      boxShadow: isSelectedInSettings ? '0 0 0 2px rgba(124,107,230,0.12)' : 'none',
                    }}
                  />
                )}

                {isActive && (
                  <div
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{
                      backgroundColor: '#FFF8FB',
                      boxShadow: '0 0 10px rgba(255,255,255,0.72)',
                    }}
                  />
                )}

                <div className="h-full flex flex-col items-center justify-center">
                  <div
                    className="flex items-center justify-center rounded-[16px] select-none"
                    style={{
                      width: '2rem',
                      height: '2rem',
                      marginBottom: '0.22rem',
                      fontSize: '1.22rem',
                      background: isDark
                        ? (isActive ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)')
                        : (isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.58)'),
                      boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                      filter: isActive ? 'drop-shadow(0 1px 2px rgba(255,255,255,0.12))' : 'none',
                    }}
                  >
                    {item.emoji}
                  </div>

                  <div
                    className="w-full text-center whitespace-nowrap overflow-hidden text-ellipsis leading-none"
                    style={{
                      color: isActive ? '#FFFFFF' : textColor,
                      maxWidth: '100%',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      opacity: isActive ? 0.96 : 0.76,
                    }}
                  >
                    {isActive ? formatTime(elapsed) : getDisplayLabel(item.label)}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="h-full overflow-y-auto px-3 py-4 md:px-4"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, rgba(10,10,14,0.94) 0%, rgba(16,18,24,0.96) 100%)'
          : 'linear-gradient(180deg, #F7F8FC 0%, #F3F5F9 42%, #EEF2F7 100%)',
      }}
    >
      {/* 顶部操作按钮 */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[1.65rem] font-bold tracking-tight" style={{ color: textColor }}>
            快捷开始
          </h2>
          <div
            className="mt-1 text-[11px] font-medium"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(71,85,105,0.58)' }}
          >
            像 iPhone 一样的快捷抽屉
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-[22px] px-2 py-1.5"
          style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.78)',
            boxShadow: isDark ? 'none' : '0 10px 24px rgba(15,23,42,0.06)',
            backdropFilter: 'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          }}
        >
          {/* 导入导出按钮 */}
          <ImportExportButton
            tasks={tasks}
            onImport={(importedTasks) => {
              // 批量创建导入的任务 - 使用 Promise.all 避免循环触发
              Promise.all(
                importedTasks.map(task => onTaskCreate(task))
              ).catch(err => {
                console.error('❌ 批量导入任务失败:', err);
              });
            }}
            bgColor={bgColor}
            textColor={textColor}
            accentColor={accentColor}
            borderColor={borderColor}
            isDark={isDark}
          />

          <button
            onClick={() => {
              setShowFolderForm(true);
              setShowAddForm(false);
              setShowSettings(false);
              setEditingFolder(null);
              setFolderFormData({
                id: '',
                name: '',
                emoji: '📁',
                collapsed: false,
              });
            }}
            className="p-2 rounded-[18px] transition-all active:scale-95"
            style={{
              background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.88)',
              color: textColor,
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.82)',
              boxShadow: isDark ? 'none' : '0 8px 18px rgba(15,23,42,0.06)',
            }}
            title="添加文件夹"
          >
            <Folder className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setShowAddForm(true);
              setShowSettings(false);
              setShowFolderForm(false);
              setEditingItem(null);
              setFormData({
                id: '',
                emoji: '⭐',
                label: '',
                taskType: 'life',
                tags: [],
                defaultDuration: 30,
                folderId: undefined,
              });
            }}
            className="p-2 rounded-[18px] transition-all active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #7E6BFF 0%, #635BFF 100%)',
              color: '#FFFFFF',
              boxShadow: '0 10px 18px rgba(99,91,255,0.22)',
            }}
            title="添加按钮"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setSelectedSettingItemId(null);
              setShowAddForm(false);
              setShowFolderForm(false);
            }}
            className="p-2 rounded-[18px] transition-all active:scale-95"
            style={{
              background: showSettings
                ? 'linear-gradient(180deg, #FF7EA7 0%, #FF5B92 100%)'
                : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.88)'),
              color: showSettings ? '#FFFFFF' : textColor,
              boxShadow: showSettings
                ? '0 10px 18px rgba(255,91,146,0.20)'
                : (isDark ? 'none' : '0 8px 18px rgba(15,23,42,0.06)'),
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.82)',
              backdropFilter: 'blur(14px) saturate(150%)',
              WebkitBackdropFilter: 'blur(14px) saturate(150%)',
            }}
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 添加文件夹表单 */}
      {showFolderForm && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border: `2px solid ${borderColor}`,
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold" style={{ color: textColor }}>
                {editingFolder ? '编辑文件夹' : '添加文件夹'}
              </h3>
              <button
                onClick={() => {
                  setShowFolderForm(false);
                  setEditingFolder(null);
                }}
                className="p-1 rounded-lg"
                style={{ color: accentColor }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>
                  图标
                </label>
                <input
                  type="text"
                  value={folderFormData.emoji}
                  onChange={(e) => setFolderFormData({ ...folderFormData, emoji: e.target.value })}
                  placeholder="📁"
                  className="w-full px-3 py-2 rounded-lg border text-center text-2xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>
                  文件夹名称 *
                </label>
                <input
                  type="text"
                  value={folderFormData.name}
                  onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                  placeholder="输入文件夹名称..."
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveFolder}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md active:scale-95"
              style={{
                backgroundColor: '#8B7FD6',
                color: '#FFFFFF',
              }}
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>
        </div>
      )}

      {/* 添加/编辑表单 */}
      {showAddForm && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border: `2px solid ${borderColor}`,
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold" style={{ color: textColor }}>
                {editingItem ? '编辑快捷按钮' : '添加快捷按钮'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
                className="p-1 rounded-lg"
                style={{ color: accentColor }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Emoji 和标签名称 */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>
                  图标
                </label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="😊"
                  className="w-full px-3 py-2 rounded-lg border text-center text-2xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>
                  标签名称 *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="输入标签名称..."
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
              </div>
            </div>

            {/* 所属文件夹 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>
                所属文件夹
              </label>
              <select
                value={formData.folderId || ''}
                onChange={(e) => setFormData({ ...formData, folderId: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  borderColor: borderColor,
                  color: textColor,
                }}
              >
                <option value="">未分类</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.emoji} {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 任务类型 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>
                任务类型
              </label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value as TaskType })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  borderColor: borderColor,
                  color: textColor,
                }}
              >
                <option value="work">工作</option>
                <option value="study">学习</option>
                <option value="health">健康</option>
                <option value="life">生活</option>
                <option value="social">社交</option>
                <option value="finance">财务</option>
                <option value="creative">创意</option>
                <option value="rest">休息</option>
              </select>
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>
                关联标签（用于统计）
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="输入标签后按回车"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                      style={{
                        backgroundColor: '#C85A7C20',
                        color: '#C85A7C',
                      }}
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 保存按钮 */}
            <button
              onClick={handleSaveItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md active:scale-95"
              style={{
                backgroundColor: '#6BA56D',
                color: '#FFFFFF',
              }}
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>
        </div>
      )}

      {/* 快捷任务 - 按文件夹分组 */}
      <div className="space-y-5 mb-24">
        {/* 渲染每个文件夹 */}
        {folders.map(folder => {
          const folderItems = quickStartItems.filter(item => item.folderId === folder.id);
          if (folderItems.length === 0 && !showSettings) return null;

          return (
            <div key={folder.id} className="space-y-2.5">
              {/* 文件夹标题 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-[18px] transition-all"
                  style={{
                    background: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.72)',
                    color: textColor,
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.82)',
                    boxShadow: isDark ? 'none' : '0 8px 20px rgba(15,23,42,0.05)',
                    backdropFilter: 'blur(16px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                  }}
                >
                  {folder.collapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  )}
                  <span className="text-[15px] opacity-90">{folder.emoji}</span>
                  <span className="text-[15px] font-semibold tracking-tight">{folder.name}</span>
                  <span className="text-[11px] opacity-50">({folderItems.length})</span>
                </button>

                {showSettings && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingFolder(folder);
                        setFolderFormData(folder);
                        setShowFolderForm(true);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ 
                        background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.96)',
                        color: textColor,
                        boxShadow: isDark ? 'none' : '0 4px 10px rgba(15,23,42,0.08)',
                        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,23,42,0.05)',
                      }}
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ 
                        background: 'linear-gradient(180deg, #FF7A7A 0%, #FF5757 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 10px rgba(255,87,87,0.18)',
                        border: '1px solid rgba(255,255,255,0.28)',
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {!folder.collapsed && renderQuickStartGrid(folderItems, true)}
            </div>
          );
        })}

        {/* 未分类的按钮 */}
        {(() => {
          const uncategorizedItems = quickStartItems.filter(item => !item.folderId);
          if (uncategorizedItems.length === 0) return null;

          return (
            <div className="space-y-2.5">
              <div
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-[18px]"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.82)',
                  boxShadow: isDark ? 'none' : '0 8px 20px rgba(15,23,42,0.05)',
                  backdropFilter: 'blur(16px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                }}
              >
                <span className="text-[15px] opacity-85">🗂️</span>
                <span className="text-[15px] font-semibold tracking-tight" style={{ color: textColor }}>未分类</span>
                <span className="text-[11px] opacity-50" style={{ color: textColor }}>({uncategorizedItems.length})</span>
              </div>

              {renderQuickStartGrid(uncategorizedItems)}
            </div>
          );
        })()}
      </div>

      {/* 进行中列表 */}
      {activeTimers.size > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: textColor }}>
            进行中 ({activeTimers.size})
          </h3>
          <div className="space-y-2">
            {Array.from(activeTimers.values()).map((timer) => {
              const elapsed = elapsedTimes.get(timer.itemId) || 0;
              return (
                <div
                  key={timer.itemId}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{timer.emoji}</div>
                    <div>
                      <div className="font-medium" style={{ color: textColor }}>
                        {timer.label}
                      </div>
                      <div className="text-sm" style={{ color: accentColor }}>
                        开始于 {timer.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: '#C85A7C' }}>
                      {formatTime(elapsed)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

