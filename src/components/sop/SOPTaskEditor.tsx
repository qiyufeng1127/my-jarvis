import { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useSOPStore } from '@/stores/sopStore';
import { useTagStore } from '@/stores/tagStore';
import { useGoalStore } from '@/stores/goalStore';

interface SOPTaskEditorProps {
  taskId: string | null;
  folderId: string | null;
  onClose: () => void;
}

export default function SOPTaskEditor({ taskId, folderId, onClose }: SOPTaskEditorProps) {
  const { getTaskById, createTask, updateTask } = useSOPStore();
  const { getAllTags } = useTagStore();
  const { goals } = useGoalStore();
  
  const task = taskId ? getTaskById(taskId) : null;
  const allTags = getAllTags();
  
  // 基础信息
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(task?.durationMinutes || 30);
  const [goldReward, setGoldReward] = useState(task?.goldReward || 0);
  const [location, setLocation] = useState(task?.location || '');
  
  // 标签
  const [selectedTags, setSelectedTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  // 关联目标
  const [selectedGoals, setSelectedGoals] = useState<Record<string, number>>(task?.longTermGoals || {});
  
  // 子任务
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  
  // 验证配置
  const [hasStartVerification, setHasStartVerification] = useState(!!task?.verificationStart);
  const [startVerificationRequirement, setStartVerificationRequirement] = useState(
    task?.verificationStart?.requirement || ''
  );
  const [hasCompleteVerification, setHasCompleteVerification] = useState(!!task?.verificationComplete);
  const [completeVerificationRequirement, setCompleteVerificationRequirement] = useState(
    task?.verificationComplete?.requirement || ''
  );
  
  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        {
          id: `subtask_${Date.now()}`,
          title: newSubtask.trim(),
          order: subtasks.length,
        },
      ]);
      setNewSubtask('');
    }
  };
  
  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };
  
  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入任务标题');
      return;
    }
    
    if (!folderId && !taskId) {
      alert('无效的文件夹');
      return;
    }
    
    const taskData = {
      title,
      description,
      durationMinutes,
      goldReward: goldReward || undefined,
      location: location || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      longTermGoals: Object.keys(selectedGoals).length > 0 ? selectedGoals : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      verificationStart: hasStartVerification
        ? { type: 'photo' as const, requirement: startVerificationRequirement }
        : undefined,
      verificationComplete: hasCompleteVerification
        ? { type: 'photo' as const, requirement: completeVerificationRequirement }
        : undefined,
    };
    
    if (taskId) {
      updateTask(taskId, taskData);
    } else if (folderId) {
      createTask(folderId, taskData);
    }
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {taskId ? '编辑任务模板' : '新建任务模板'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 表单 */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* 任务标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任务标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：每日站会、周报撰写"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          
          {/* 任务描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任务描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述任务内容..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          
          {/* 时长和金币 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                任务时长（分钟）*
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                金币奖励
              </label>
              <input
                type="number"
                value={goldReward}
                onChange={(e) => setGoldReward(Number(e.target.value))}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* 位置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              位置
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例如：会议室、办公室"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="输入标签名称"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* 子任务 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              子任务
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="输入子任务"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {subtasks.map(subtask => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <GripVertical size={16} className="text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* 验证配置 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="startVerification"
                checked={hasStartVerification}
                onChange={(e) => setHasStartVerification(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="startVerification" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                启动验证（拍照）
              </label>
            </div>
            {hasStartVerification && (
              <input
                type="text"
                value={startVerificationRequirement}
                onChange={(e) => setStartVerificationRequirement(e.target.value)}
                placeholder="例如：拍摄工作环境"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="completeVerification"
                checked={hasCompleteVerification}
                onChange={(e) => setHasCompleteVerification(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="completeVerification" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                完成验证（拍照）
              </label>
            </div>
            {hasCompleteVerification && (
              <input
                type="text"
                value={completeVerificationRequirement}
                onChange={(e) => setCompleteVerificationRequirement(e.target.value)}
                placeholder="例如：拍摄完成成果"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        </div>
        
        {/* 按钮 */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {taskId ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}

