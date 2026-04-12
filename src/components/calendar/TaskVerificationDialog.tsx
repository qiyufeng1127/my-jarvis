import { useState } from 'react';
import { X, Edit2, Check, ChevronDown, Search } from 'lucide-react';
import type { TaskVerification } from '@/services/taskVerificationService';
import { useKeywordPresetStore } from '@/stores/keywordPresetStore';

interface TaskVerificationDialogProps {
  taskId: string;
  taskTitle: string;
  verification: TaskVerification;
  onClose: () => void;
  onUpdate: (verification: TaskVerification) => void;
  onDisable?: () => void; // 取消验证的回调
  isDark: boolean;
  accentColor: string;
}

export default function TaskVerificationDialog({
  taskId,
  taskTitle,
  verification,
  onClose,
  onUpdate,
  onDisable,
  isDark,
  accentColor,
}: TaskVerificationDialogProps) {
  const [editingStart, setEditingStart] = useState(false);
  const [editingCompletion, setEditingCompletion] = useState(false);
  const [startKeywords, setStartKeywords] = useState(verification.startKeywords.join(', '));
  const [completionKeywords, setCompletionKeywords] = useState(verification.completionKeywords.join(', '));
  const [enableStartVerification, setEnableStartVerification] = useState(verification.startKeywords.length > 0);
  const [enableCompletionVerification, setEnableCompletionVerification] = useState(verification.completionKeywords.length > 0);
  
  // 预设组选择状态
  const [showStartPresetDropdown, setShowStartPresetDropdown] = useState(false);
  const [showCompletePresetDropdown, setShowCompletePresetDropdown] = useState(false);
  const [presetSearchQuery, setPresetSearchQuery] = useState('');
  
  // 获取预设组
  const { searchPresets } = useKeywordPresetStore();
  const filteredPresets = searchPresets(presetSearchQuery);
  
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
  
  // 使用时间轴背景色（从 Dashboard 传入的 bgColor）
  const dialogBgColor = isDark ? '#1f2937' : '#ffffff'; // 跟随时间轴背景
  const dialogTextColor = isDark ? '#ffffff' : '#000000';
  const dialogAccentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const inputBgColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const inputBorderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';

  const handleSaveStart = () => {
    const keywords = enableStartVerification 
      ? startKeywords.split(',').map(k => k.trim()).filter(k => k)
      : [];
    
    // 立即更新并保存到localStorage
    const updatedVerification = {
      ...verification,
      startKeywords: keywords,
    };
    onUpdate(updatedVerification);
    
    // 保存到localStorage确保持久化
    try {
      const storageKey = `task_verification_${taskId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedVerification));
      console.log('✅ 启动关键词已保存:', keywords);
    } catch (error) {
      console.error('❌ 保存启动关键词失败:', error);
    }
    
    setEditingStart(false);
  };

  const handleSaveCompletion = () => {
    const keywords = enableCompletionVerification
      ? completionKeywords.split(',').map(k => k.trim()).filter(k => k)
      : [];
    
    // 立即更新并保存到localStorage
    const updatedVerification = {
      ...verification,
      completionKeywords: keywords,
    };
    onUpdate(updatedVerification);
    
    // 保存到localStorage确保持久化
    try {
      const storageKey = `task_verification_${taskId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedVerification));
      console.log('✅ 完成关键词已保存:', keywords);
    } catch (error) {
      console.error('❌ 保存完成关键词失败:', error);
    }
    
    setEditingCompletion(false);
  };

  // 选择启动验证预设组
  const handleSelectStartPreset = (keywords: string[]) => {
    setStartKeywords(keywords.join(', '));
    setShowStartPresetDropdown(false);
    setPresetSearchQuery('');
    setEditingStart(true);
  };

  // 选择完成验证预设组
  const handleSelectCompletePreset = (keywords: string[]) => {
    setCompletionKeywords(keywords.join(', '));
    setShowCompletePresetDropdown(false);
    setPresetSearchQuery('');
    setEditingCompletion(true);
  };

  // 保存所有设置并关闭
  const handleSaveAndClose = () => {
    const startKws = enableStartVerification 
      ? startKeywords.split(',').map(k => k.trim()).filter(k => k)
      : [];
    const completionKws = enableCompletionVerification
      ? completionKeywords.split(',').map(k => k.trim()).filter(k => k)
      : [];
    
    // 如果两个验证都不启用，则取消验证
    if (!enableStartVerification && !enableCompletionVerification) {
      if (onDisable) {
        onDisable();
      }
      onClose();
      return;
    }
    
    // 更新验证配置并保存到localStorage
    const updatedVerification = {
      ...verification,
      startKeywords: startKws,
      completionKeywords: completionKws,
    };
    
    onUpdate(updatedVerification);
    
    // 保存到localStorage确保持久化
    try {
      const storageKey = `task_verification_${taskId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedVerification));
      console.log('✅ 验证配置已保存:', { startKws, completionKws });
    } catch (error) {
      console.error('❌ 保存验证配置失败:', error);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm keyboard-aware-modal-shell">
      <div 
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl keyboard-aware-modal-card keyboard-aware-modal-content"
        style={{ 
          backgroundColor: dialogBgColor,
          color: dialogTextColor,
          overflowY: 'auto',
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
            <div className="flex items-center gap-2">
              {enableStartVerification && (
                <button
                  onClick={() => setShowStartPresetDropdown(!showStartPresetDropdown)}
                  className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                  style={{ 
                    backgroundColor: inputBgColor,
                    color: dialogTextColor,
                  }}
                >
                  <ChevronDown size={14} />
                  选择预设
                </button>
              )}
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
          </div>
          
          {/* 预设组下拉菜单 */}
          {showStartPresetDropdown && enableStartVerification && (
            <div className="mb-3 p-3 rounded-lg border-2" style={{ 
              backgroundColor: inputBgColor,
              borderColor: inputBorderColor,
            }}>
              {/* 搜索框 */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: dialogAccentColor }} />
                <input
                  type="text"
                  value={presetSearchQuery}
                  onChange={(e) => setPresetSearchQuery(e.target.value)}
                  placeholder="搜索预设组标题或关键词..."
                  className="w-full pl-8 pr-3 py-1.5 rounded text-sm"
                  style={{
                    backgroundColor: dialogBgColor,
                    borderColor: inputBorderColor,
                    color: dialogTextColor,
                  }}
                />
              </div>
              
              {/* 预设组列表 */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredPresets.length > 0 ? (
                  filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectStartPreset(preset.keywords)}
                      className="w-full text-left p-2 rounded hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: dialogBgColor }}
                    >
                      <div className="font-medium text-sm mb-1" style={{ color: dialogTextColor }}>
                        📋 {preset.title}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preset.keywords.slice(0, 5).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: inputBgColor,
                              color: dialogAccentColor,
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                        {preset.keywords.length > 5 && (
                          <span className="text-xs" style={{ color: dialogAccentColor }}>
                            +{preset.keywords.length - 5}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm" style={{ color: dialogAccentColor }}>
                    {presetSearchQuery ? '未找到匹配的预设组' : '暂无预设组，请在SOP照片库中创建'}
                  </div>
                )}
              </div>
            </div>
          )}
          
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
            <div className="flex items-center gap-2">
              {enableCompletionVerification && (
                <button
                  onClick={() => setShowCompletePresetDropdown(!showCompletePresetDropdown)}
                  className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                  style={{ 
                    backgroundColor: inputBgColor,
                    color: dialogTextColor,
                  }}
                >
                  <ChevronDown size={14} />
                  选择预设
                </button>
              )}
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
          </div>
          
          {/* 预设组下拉菜单 */}
          {showCompletePresetDropdown && enableCompletionVerification && (
            <div className="mb-3 p-3 rounded-lg border-2" style={{ 
              backgroundColor: inputBgColor,
              borderColor: inputBorderColor,
            }}>
              {/* 搜索框 */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: dialogAccentColor }} />
                <input
                  type="text"
                  value={presetSearchQuery}
                  onChange={(e) => setPresetSearchQuery(e.target.value)}
                  placeholder="搜索预设组标题或关键词..."
                  className="w-full pl-8 pr-3 py-1.5 rounded text-sm"
                  style={{
                    backgroundColor: dialogBgColor,
                    borderColor: inputBorderColor,
                    color: dialogTextColor,
                  }}
                />
              </div>
              
              {/* 预设组列表 */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredPresets.length > 0 ? (
                  filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectCompletePreset(preset.keywords)}
                      className="w-full text-left p-2 rounded hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: dialogBgColor }}
                    >
                      <div className="font-medium text-sm mb-1" style={{ color: dialogTextColor }}>
                        📋 {preset.title}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preset.keywords.slice(0, 5).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: inputBgColor,
                              color: dialogAccentColor,
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                        {preset.keywords.length > 5 && (
                          <span className="text-xs" style={{ color: dialogAccentColor }}>
                            +{preset.keywords.length - 5}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm" style={{ color: dialogAccentColor }}>
                    {presetSearchQuery ? '未找到匹配的预设组' : '暂无预设组，请在SOP照片库中创建'}
                  </div>
                )}
              </div>
            </div>
          )}
          
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
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: inputBgColor }}>
          <p className="text-sm" style={{ color: dialogTextColor }}>
            💡 提示：验证系统将在任务开始时间自动启动，请准时完成验证！
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: inputBgColor,
              color: dialogTextColor,
            }}
          >
            取消
          </button>
          <button
            onClick={handleSaveAndClose}
            className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium"
            style={{ 
              backgroundColor: accentColor,
              color: getTextColor(accentColor),
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

