import { useState, useMemo } from 'react';
import { Plus, Folder, ChevronRight, ChevronDown, Edit2, Trash2, GripVertical, Search, X, Camera } from 'lucide-react';
import { useSOPStore } from '@/stores/sopStore';
import SOPTaskEditor from './SOPTaskEditor';
import SOPFolderEditor from './SOPFolderEditor';
import PhotoRecognitionTest from './PhotoRecognitionTest';

export default function SOPLibrary() {
  const { folders, tasks, getTasksByFolder, deleteFolder, deleteTask, pushToTimeline } = useSOPStore();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingTaskInFolder, setCreatingTaskInFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPhotoTest, setShowPhotoTest] = useState(false);
  
  // 🔍 实时搜索过滤
  const filteredFoldersAndTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      // 没有搜索词，返回所有文件夹和任务
      return folders.map(folder => ({
        folder,
        tasks: getTasksByFolder(folder.id),
      }));
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // 搜索匹配的任务
    const matchedTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      task.location?.toLowerCase().includes(query)
    );
    
    // 按文件夹分组匹配的任务
    const folderTaskMap = new Map<string, typeof tasks>();
    matchedTasks.forEach(task => {
      if (!folderTaskMap.has(task.folderId)) {
        folderTaskMap.set(task.folderId, []);
      }
      folderTaskMap.get(task.folderId)!.push(task);
    });
    
    // 只返回有匹配任务的文件夹
    return folders
      .filter(folder => folderTaskMap.has(folder.id))
      .map(folder => ({
        folder,
        tasks: folderTaskMap.get(folder.id) || [],
      }));
  }, [folders, tasks, searchQuery, getTasksByFolder]);
  
  // 🔍 搜索时自动展开所有文件夹
  useState(() => {
    if (searchQuery.trim()) {
      const allFolderIds = new Set(filteredFoldersAndTasks.map(item => item.folder.id));
      setExpandedFolders(allFolderIds);
    }
  });
  
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };
  
  const handlePushToTimeline = (taskId: string) => {
    pushToTimeline(taskId);
    // 显示成功提示
    alert('✅ 任务已推送到时间轴！');
  };
  
  // 🔍 高亮搜索关键词
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-white">{part}</mark>
        : part
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📋 SOP 任务库
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                管理重复性任务模板，一键推送到时间轴
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPhotoTest(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <Camera size={20} />
                <span>照片识别测试</span>
              </button>
              
              <button
                onClick={() => setCreatingFolder(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                <span>新建文件夹</span>
              </button>
            </div>
          </div>
          {/* 🔍 搜索框 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务模板... (支持标题、描述、标签、位置)"
              className="w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
          
          {/* 搜索结果提示 */}
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              找到 {filteredFoldersAndTasks.reduce((sum, item) => sum + item.tasks.length, 0)} 个匹配的任务模板
            </div>
          )}
        </div>
        
        {/* 文件夹列表 */}
        <div className="space-y-4">
          {filteredFoldersAndTasks.length === 0 ? (
            <div className="text-center py-20">
              {searchQuery ? (
                <>
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    没有找到匹配"{searchQuery}"的任务模板
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    清除搜索
                  </button>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    还没有文件夹，创建一个开始吧
                  </p>
                  <button
                    onClick={() => setCreatingFolder(true)}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    创建第一个文件夹
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredFoldersAndTasks.map(({ folder, tasks: folderTasks }) => {
              const isExpanded = expandedFolders.has(folder.id);
              
              return (
                <div
                  key={folder.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* 文件夹头部 */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                      
                      <span className="text-2xl">{folder.emoji}</span>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {folder.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {folderTasks.length} 个任务模板
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCreatingTaskInFolder(folder.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Plus size={16} />
                        <span>新建任务</span>
                      </button>
                      
                      <button
                        onClick={() => setEditingFolder(folder.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm(`确定要删除文件夹"${folder.name}"及其所有任务吗？`)) {
                            deleteFolder(folder.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 任务列表 */}
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {folderTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <p className="mb-2">暂无任务模板</p>
                          <button
                            onClick={() => setCreatingTaskInFolder(folder.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            创建第一个任务
                          </button>
                        </div>
                      ) : (
                        folderTasks.map(task => (
                          <div
                            key={task.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                  {highlightText(task.title, searchQuery)}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {highlightText(task.description, searchQuery)}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                    ⏱️ {task.durationMinutes} 分钟
                                  </span>
                                  
                                  {task.goldReward && (
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                                      💰 {task.goldReward} 金币
                                    </span>
                                  )}
                                  
                                  {task.tags && task.tags.length > 0 && (
                                    task.tags.map(tag => (
                                      <span
                                        key={tag}
                                        className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
                                      >
                                        #{tag}
                                      </span>
                                    ))
                                  )}
                                  
                                  {task.location && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                      📍 {task.location}
                                    </span>
                                  )}
                                </div>
                                
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div className="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      子任务 ({task.subtasks.length})
                                    </p>
                                    {task.subtasks.slice(0, 3).map(subtask => (
                                      <p key={subtask.id} className="text-xs text-gray-600 dark:text-gray-400">
                                        • {subtask.title}
                                      </p>
                                    ))}
                                    {task.subtasks.length > 3 && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        ... 还有 {task.subtasks.length - 3} 个
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => setEditingTask(task.id)}
                                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                >
                                  <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    if (confirm(`确定要删除任务"${task.title}"吗？`)) {
                                      deleteTask(task.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                  <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                </button>
                              </div>
                            </div>
                            
                            {/* 推送到时间轴按钮 */}
                            <button
                              onClick={() => handlePushToTimeline(task.id)}
                              className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                              <span>📅</span>
                              <span>推送到时间轴</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* 文件夹编辑器 */}
      {(creatingFolder || editingFolder) && (
        <SOPFolderEditor
          folderId={editingFolder}
          onClose={() => {
            setCreatingFolder(false);
            setEditingFolder(null);
          }}
        />
      )}
      
      {/* 任务编辑器 */}
      {(creatingTaskInFolder || editingTask) && (
        <SOPTaskEditor
          taskId={editingTask}
          folderId={creatingTaskInFolder}
          onClose={() => {
            setCreatingTaskInFolder(null);
            setEditingTask(null);
          }}
        />
      )}
      
      {/* 照片识别测试 */}
      {showPhotoTest && (
        <PhotoRecognitionTest
          isOpen={showPhotoTest}
          onClose={() => setShowPhotoTest(false)}
        />
      )}
    </div>
  );
}

