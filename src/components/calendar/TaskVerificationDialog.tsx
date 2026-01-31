import { useState } from 'react';
import { X, Edit2, Check } from 'lucide-react';
import type { TaskVerification } from '@/services/taskVerificationService';

interface TaskVerificationDialogProps {
  taskId: string;
  taskTitle: string;
  verification: TaskVerification;
  onClose: () => void;
  onUpdate: (verification: TaskVerification) => void;
  isDark: boolean;
  accentColor: string;
}

export default function TaskVerificationDialog({
  taskId,
  taskTitle,
  verification,
  onClose,
  onUpdate,
  isDark,
  accentColor,
}: TaskVerificationDialogProps) {
  const [editingStart, setEditingStart] = useState(false);
  const [editingCompletion, setEditingCompletion] = useState(false);
  const [startKeywords, setStartKeywords] = useState(verification.startKeywords.join(', '));
  const [completionKeywords, setCompletionKeywords] = useState(verification.completionKeywords.join(', '));

  const handleSaveStart = () => {
    const keywords = startKeywords.split(',').map(k => k.trim()).filter(k => k);
    onUpdate({
      ...verification,
      startKeywords: keywords,
    });
    setEditingStart(false);
  };

  const handleSaveCompletion = () => {
    const keywords = completionKeywords.split(',').map(k => k.trim()).filter(k => k);
    onUpdate({
      ...verification,
      completionKeywords: keywords,
    });
    setEditingCompletion(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ 
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">验证关键词设置</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 任务标题 */}
        <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">任务</p>
          <p className="font-medium">{taskTitle}</p>
        </div>

        {/* 启动验证关键词 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">启动验证关键词</label>
            {!editingStart ? (
              <button
                onClick={() => setEditingStart(true)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <button
                onClick={handleSaveStart}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                style={{ color: accentColor }}
              >
                <Check size={16} />
              </button>
            )}
          </div>
          {editingStart ? (
            <input
              type="text"
              value={startKeywords}
              onChange={(e) => setStartKeywords(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
              }}
              placeholder="用逗号分隔，例如：书本, 笔记本, 电脑"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {verification.startKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            拍摄照片时需要包含这些内容
          </p>
        </div>

        {/* 完成验证关键词 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">完成验证关键词</label>
            {!editingCompletion ? (
              <button
                onClick={() => setEditingCompletion(true)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <button
                onClick={handleSaveCompletion}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                style={{ color: accentColor }}
              >
                <Check size={16} />
              </button>
            )}
          </div>
          {editingCompletion ? (
            <input
              type="text"
              value={completionKeywords}
              onChange={(e) => setCompletionKeywords(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
              }}
              placeholder="用逗号分隔，例如：完成的作业, 整理好的书桌"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {verification.completionKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            完成任务后拍摄照片需要包含这些内容
          </p>
        </div>

        {/* 状态信息 */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            💡 提示：验证系统将在任务开始时间自动启动，请准时完成验证！
          </p>
        </div>
      </div>
    </div>
  );
}

