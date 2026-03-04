import { useState, useEffect, useRef } from 'react';
import { Play, Square, Plus, Settings, X, Save, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import type { Task, TaskType } from '@/types';

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
  onTaskDelete: (taskId: string) => void; // 新增：删除任务
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
  onTaskDelete,
  bgColor = '#ffffff',
  textColor = '#000000',
  accentColor = '#666666',
  borderColor = 'rgba(0, 0, 0, 0.1)',
  isDark = false,
}: QuickStartViewProps) {
  const [activeTimers, setActiveTimers] = useState<Map<string, ActiveTimer>>(new Map());
  const [elapsedTimes, setElapsedTimes] = useState<Map<string, number>>(new Map());
  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<QuickStartItem | null>(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState<QuickStartFolder | null>(null);

  // 拖拽相关状态
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  // 长按拖拽处理
  const handleTouchStart = (itemId: string) => {
    if (showSettings) return;
    
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true);
      setDraggedItem(itemId);
      // 触觉反馈
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms 长按
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDragging && draggedItem && dragOverItem && draggedItem !== dragOverItem) {
      // 执行拖拽排序
      const items = [...quickStartItems];
      const draggedIndex = items.findIndex(item => item.id === draggedItem);
      const targetIndex = items.findIndex(item => item.id === dragOverItem);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, removed);
        setQuickStartItems(items);
      }
    }

    setIsDragging(false);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleTouchMove = (e: React.TouchEvent, itemId: string) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const buttonElement = element?.closest('[data-item-id]');
    
    if (buttonElement) {
      const targetId = buttonElement.getAttribute('data-item-id');
      if (targetId && targetId !== draggedItem) {
        setDragOverItem(targetId);
      }
    }
  };

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
    setFormData(item);
    setEditingItem(item);
    setShowAddForm(true);
    setShowSettings(false);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('确定要删除这个快捷按钮吗？')) {
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

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      {/* 顶部操作按钮 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: textColor }}>
          快捷开始
        </h2>
        <div className="flex items-center gap-2">
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
            className="p-1.5 rounded-lg transition-all hover:shadow-md active:scale-95"
            style={{
              backgroundColor: '#8B7FD6',
              color: '#FFFFFF',
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
            className="p-1.5 rounded-lg transition-all hover:shadow-md active:scale-95"
            style={{
              backgroundColor: '#6BA56D',
              color: '#FFFFFF',
            }}
            title="添加按钮"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowAddForm(false);
              setShowFolderForm(false);
            }}
            className="p-1.5 rounded-lg transition-all hover:shadow-md active:scale-95"
            style={{
              backgroundColor: showSettings ? '#C85A7C' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
              color: showSettings ? '#FFFFFF' : textColor,
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
      <div className="space-y-4 mb-4">
        {/* 渲染每个文件夹 */}
        {folders.map(folder => {
          const folderItems = quickStartItems.filter(item => item.folderId === folder.id);
          if (folderItems.length === 0 && !showSettings) return null;

          return (
            <div key={folder.id} className="space-y-2">
              {/* 文件夹标题 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-opacity-80"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    color: textColor,
                  }}
                >
                  {folder.collapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span className="text-lg">{folder.emoji}</span>
                  <span className="font-semibold">{folder.name}</span>
                  <span className="text-xs opacity-60">({folderItems.length})</span>
                </button>

                {showSettings && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingFolder(folder);
                        setFolderFormData(folder);
                        setShowFolderForm(true);
                      }}
                      className="p-1 rounded-lg"
                      style={{ 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: textColor 
                      }}
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="p-1 rounded-lg"
                      style={{ 
                        backgroundColor: '#FF4444',
                        color: '#FFFFFF'
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 文件夹内的按钮 */}
              {!folder.collapsed && (
                <div className="grid grid-cols-4 gap-3 pl-2">
                  {folderItems.map((item) => {
                    const isActive = activeTimers.has(item.id);
                    const elapsed = elapsedTimes.get(item.id) || 0;

                    return (
                      <div key={item.id} className="relative">
                        <button
                          data-item-id={item.id}
                          onClick={() => !showSettings && !isDragging && handleToggle(item)}
                          onTouchStart={() => handleTouchStart(item.id)}
                          onTouchEnd={handleTouchEnd}
                          onTouchMove={(e) => handleTouchMove(e, item.id)}
                          className="w-full flex flex-col items-center justify-center rounded-2xl p-4 transition-all active:scale-95 relative"
                          style={{
                            backgroundColor: isActive 
                              ? '#FF6B9D' 
                              : isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5',
                            aspectRatio: '1',
                            opacity: showSettings ? 0.7 : (draggedItem === item.id ? 0.5 : (dragOverItem === item.id ? 0.8 : 1)),
                            boxShadow: isActive ? '0 4px 12px rgba(255, 107, 157, 0.4)' : 'none',
                            transform: draggedItem === item.id ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          {/* 活跃指示器 - 红点 */}
                          {isActive && (
                            <div 
                              className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                              style={{ 
                                backgroundColor: '#FF4444',
                                boxShadow: '0 0 8px rgba(255, 68, 68, 0.6)',
                              }}
                            />
                          )}

                          {/* Emoji 图标 */}
                          <div className="text-4xl mb-2">
                            {item.emoji}
                          </div>

                          {/* 标签或计时 */}
                          <div 
                            className="text-xs font-medium text-center"
                            style={{ 
                              color: isActive ? '#FFFFFF' : textColor,
                            }}
                          >
                            {isActive ? formatTime(elapsed) : item.label}
                          </div>
                        </button>

                        {/* 设置模式下的编辑/删除按钮 */}
                        {showSettings && (
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 rounded-2xl">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-1.5 rounded-lg bg-white"
                            >
                              <Settings className="w-3 h-3 text-gray-800" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg bg-red-500"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 未分类的按钮 */}
        {(() => {
          const uncategorizedItems = quickStartItems.filter(item => !item.folderId);
          if (uncategorizedItems.length === 0) return null;

          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="font-semibold" style={{ color: textColor }}>未分类</span>
                <span className="text-xs opacity-60" style={{ color: textColor }}>({uncategorizedItems.length})</span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {uncategorizedItems.map((item) => {
                  const isActive = activeTimers.has(item.id);
                  const elapsed = elapsedTimes.get(item.id) || 0;

                  return (
                    <div key={item.id} className="relative">
                      <button
                        data-item-id={item.id}
                        onClick={() => !showSettings && !isDragging && handleToggle(item)}
                        onTouchStart={() => handleTouchStart(item.id)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={(e) => handleTouchMove(e, item.id)}
                        className="w-full flex flex-col items-center justify-center rounded-2xl p-4 transition-all active:scale-95 relative"
                        style={{
                          backgroundColor: isActive 
                            ? '#FF6B9D' 
                            : isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5',
                          aspectRatio: '1',
                          opacity: showSettings ? 0.7 : (draggedItem === item.id ? 0.5 : (dragOverItem === item.id ? 0.8 : 1)),
                          boxShadow: isActive ? '0 4px 12px rgba(255, 107, 157, 0.4)' : 'none',
                          transform: draggedItem === item.id ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        {isActive && (
                          <div 
                            className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                            style={{ 
                              backgroundColor: '#FF4444',
                              boxShadow: '0 0 8px rgba(255, 68, 68, 0.6)',
                            }}
                          />
                        )}

                        <div className="text-4xl mb-2">
                          {item.emoji}
                        </div>

                        <div 
                          className="text-xs font-medium text-center"
                          style={{ 
                            color: isActive ? '#FFFFFF' : textColor,
                          }}
                        >
                          {isActive ? formatTime(elapsed) : item.label}
                        </div>
                      </button>

                      {showSettings && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 rounded-2xl">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 rounded-lg bg-white"
                          >
                            <Settings className="w-3 h-3 text-gray-800" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg bg-red-500"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

