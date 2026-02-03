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
  const [enableStartVerification, setEnableStartVerification] = useState(verification.startKeywords.length > 0);
  const [enableCompletionVerification, setEnableCompletionVerification] = useState(verification.completionKeywords.length > 0);
  
  // 判断颜色是否为深色
  const isColorDark = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };
  
  // 根据背景色获取文字颜色
  const getTextColor = (bgColor: string): string => {
    return isColorDark(bgColor) ? '#ffffff' : '#000000';
  };
  
  const dialogBgColor = accentColor;
  const dialogTextColor = getTextColor(accentColor);
  const dialogAccentColor = isColorDark(accentColor) ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  const inputBgColor = isColorDark(accentColor) ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const inputBorderColor = isColorDark(accentColor) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';

  const handleSaveStart = () => {
    const keywords = enableStartVerification 
      ? startKeywords.split(',').map(k => k.trim()).filter(k => k)
      : [];
    onUpdate({
      ...verification,
      startKeywords: keywords,
    });
    setEditingStart(false);
  };

  const handleSaveCompletion = () => {
    const keywords = enableCompletionVerification
      ? completionKeywords.split(',').map(k => k.trim()).filter(k => k)
      : [];
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
          backgroundColor: dialogBgColor,
          color: dialogTextColor,
        }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: dialogTextColor }}>验证关键词设置</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: inputBgColor,
              color: dialogTextColor,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 任务标题 */}
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: inputBgColor }}>
          <p className="text-sm mb-1" style={{ color: dialogAccentColor }}>任务</p>
          <p className="font-medium" style={{ color: dialogTextColor }}>{taskTitle}</p>
        </div>

        {/* 启动验证关键词 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableStartVerification}
                onChange={(e) => setEnableStartVerification(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label className="text-sm font-medium" style={{ color: dialogTextColor }}>启动验证关键词</label>
            </div>
            {enableStartVerification && !editingStart ? (
              <button
                onClick={() => setEditingStart(true)}
                className="p-1 rounded transition-colors"
                style={{ 
                  backgroundColor: inputBgColor,
                  color: dialogTextColor,
                }}
              >
                <Edit2 size={16} />
              </button>
            ) : enableStartVerification && editingStart ? (
              <button
                onClick={handleSaveStart}
                className="p-1 rounded transition-colors"
                style={{ 
                  backgroundColor: inputBgColor,
                  color: dialogTextColor,
                }}
              >
                <Check size={16} />
              </button>
            ) : null}
          </div>
          {enableStartVerification && (
            <>
              {editingStart ? (
                <input
                  type="text"
                  value={startKeywords}
                  onChange={(e) => setStartKeywords(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: inputBgColor,
                    borderColor: inputBorderColor,
                    color: dialogTextColor,
                  }}
                  placeholder="用逗号分隔，例如：洗漱台, 牙刷, 洗面奶"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {verification.startKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: inputBgColor,
                        color: dialogTextColor,
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs mt-2" style={{ color: dialogAccentColor }}>
                拍摄照片时需要包含这些内容
              </p>
            </>
          )}
          {!enableStartVerification && (
            <p className="text-xs" style={{ color: dialogAccentColor }}>
              不启用启动验证，点击开始即可直接启动任务
            </p>
          )}
        </div>

        {/* 完成验证关键词 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableCompletionVerification}
                onChange={(e) => setEnableCompletionVerification(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label className="text-sm font-medium" style={{ color: dialogTextColor }}>完成验证关键词</label>
            </div>
            {enableCompletionVerification && !editingCompletion ? (
              <button
                onClick={() => setEditingCompletion(true)}
                className="p-1 rounded transition-colors"
                style={{ 
                  backgroundColor: inputBgColor,
                  color: dialogTextColor,
                }}
              >
                <Edit2 size={16} />
              </button>
            ) : enableCompletionVerification && editingCompletion ? (
              <button
                onClick={handleSaveCompletion}
                className="p-1 rounded transition-colors"
                style={{ 
                  backgroundColor: inputBgColor,
                  color: dialogTextColor,
                }}
              >
                <Check size={16} />
              </button>
            ) : null}
          </div>
          {enableCompletionVerification && (
            <>
              {editingCompletion ? (
                <input
                  type="text"
                  value={completionKeywords}
                  onChange={(e) => setCompletionKeywords(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: inputBgColor,
                    borderColor: inputBorderColor,
                    color: dialogTextColor,
                  }}
                  placeholder="用逗号分隔，例如：干净的脸, 整洁的洗漱台"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {verification.completionKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: inputBgColor,
                        color: dialogTextColor,
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs mt-2" style={{ color: dialogAccentColor }}>
                完成任务后拍摄照片需要包含这些内容
              </p>
            </>
          )}
          {!enableCompletionVerification && (
            <p className="text-xs" style={{ color: dialogAccentColor }}>
              不启用完成验证，点击完成即可直接完成任务
            </p>
          )}
        </div>

        {/* 状态信息 */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: inputBgColor }}>
          <p className="text-sm" style={{ color: dialogTextColor }}>
            💡 提示：验证系统将在任务开始时间自动启动，请准时完成验证！
          </p>
        </div>
      </div>
    </div>
  );
}

