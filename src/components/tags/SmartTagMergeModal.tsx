import { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { useTagStore, type TagData } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';
import { aiService } from '@/services/aiService';

interface SmartTagMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: TagData[];
  isDark?: boolean;
}

interface MergeSuggestion {
  tags: string[];
  suggestedName: string;
  reason: string;
}

export default function SmartTagMergeModal({ isOpen, onClose, tags, isDark = false }: SmartTagMergeModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<MergeSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [customNames, setCustomNames] = useState<Record<number, string>>({});
  const [isMerging, setIsMerging] = useState(false);
  
  const { mergeTags } = useTagStore();
  const { tasks, updateTask } = useTaskStore();
  
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1D1D1F';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  // AI分析标签相似度
  const analyzeTags = async () => {
    setIsAnalyzing(true);
    setSuggestions([]);
    
    try {
      const tagList = tags.map(tag => ({
        name: tag.name,
        emoji: tag.emoji,
        usageCount: tag.usageCount,
        totalDuration: tag.totalDuration,
      }));
      
      const prompt = `你是一个智能标签管理助手。请分析以下标签列表，找出可以合并的相似标签。

标签列表：
${JSON.stringify(tagList, null, 2)}

请找出语义相似、可以合并的标签组，并为每组建议一个合适的新名称。

要求：
1. 只合并真正相似的标签（如"照相馆运营"和"照相馆店铺工作"）
2. 不要合并完全不同的标签
3. 建议的新名称要简洁、准确
4. 每组至少包含2个标签
5. 最多返回5组建议

请以JSON格式返回，格式如下：
[
  {
    "tags": ["标签1", "标签2"],
    "suggestedName": "建议的新名称",
    "reason": "合并理由"
  }
]`;

      const response = await aiService.chat([
        { role: 'user', content: prompt }
      ]);
      
      if (!response.success || !response.content) {
        throw new Error(response.error || 'AI调用失败');
      }
      
      // 解析AI返回的JSON
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setSuggestions(parsed);
      } else {
        throw new Error('AI返回格式错误');
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      alert('AI分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 执行合并
  const handleMerge = async () => {
    if (selectedSuggestions.size === 0) {
      alert('请至少选择一个合并建议');
      return;
    }
    
    setIsMerging(true);
    
    try {
      // 遍历所有选中的合并建议
      for (const index of Array.from(selectedSuggestions)) {
        const suggestion = suggestions[index];
        const newName = customNames[index] || suggestion.suggestedName;
        const oldTags = suggestion.tags;
        
        // 1. 合并标签数据
        mergeTags(oldTags, newName);
        
        // 2. 更新所有相关任务的标签
        const relatedTasks = tasks.filter(task => 
          task.tags?.some(tag => oldTags.includes(tag))
        );
        
        for (const task of relatedTasks) {
          const updatedTags = task.tags?.map(tag => 
            oldTags.includes(tag) ? newName : tag
          ) || [];
          
          // 去重
          const uniqueTags = Array.from(new Set(updatedTags));
          
          await updateTask(task.id, { tags: uniqueTags });
        }
      }
      
      alert(`成功合并 ${selectedSuggestions.size} 组标签！`);
      onClose();
    } catch (error) {
      console.error('合并失败:', error);
      alert('合并失败，请重试');
    } finally {
      setIsMerging(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: bgColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor }}
        >
          <div className="flex items-center gap-3">
            <Sparkles size={24} style={{ color: '#FFD60A' }} />
            <div>
              <h3 className="text-xl font-bold" style={{ color: textColor }}>
                智能标签合并
              </h3>
              <p className="text-xs mt-0.5" style={{ color: secondaryColor }}>
                AI会分析相似标签并建议合并方案
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black hover:bg-opacity-5 transition-colors"
          >
            <X size={24} style={{ color: textColor }} />
          </button>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles size={64} style={{ color: '#FFD60A', opacity: 0.5 }} />
              <p className="text-lg font-medium mt-4" style={{ color: textColor }}>
                点击下方按钮开始AI分析
              </p>
              <p className="text-sm mt-2" style={{ color: secondaryColor }}>
                AI会智能识别可以合并的相似标签
              </p>
              
              <button
                onClick={analyzeTags}
                disabled={isAnalyzing}
                className="mt-6 px-8 py-3 rounded-full font-semibold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: '#FFD60A' }}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    AI分析中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={20} />
                    开始AI分析
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{ backgroundColor: '#E3F2FD' }}
              >
                <AlertCircle size={20} style={{ color: '#1976D2', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1976D2' }}>
                    AI找到了 {suggestions.length} 组可以合并的标签
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#1976D2', opacity: 0.8 }}>
                    请勾选要合并的标签组，可以修改建议的名称
                  </p>
                </div>
              </div>
              
              {suggestions.map((suggestion, index) => {
                const isSelected = selectedSuggestions.has(index);
                
                return (
                  <div
                    key={index}
                    className="p-4 rounded-2xl border-2 transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? `${cardBg}` : 'transparent',
                      borderColor: isSelected ? '#FFD60A' : borderColor,
                    }}
                    onClick={() => {
                      const newSelected = new Set(selectedSuggestions);
                      if (isSelected) {
                        newSelected.delete(index);
                      } else {
                        newSelected.add(index);
                      }
                      setSelectedSuggestions(newSelected);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 w-5 h-5 rounded cursor-pointer"
                        style={{ accentColor: '#FFD60A' }}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold" style={{ color: secondaryColor }}>
                            合并：
                          </span>
                          {suggestion.tags.map((tag, i) => (
                            <span key={i}>
                              <span 
                                className="px-2 py-1 rounded-lg text-sm font-medium"
                                style={{ backgroundColor: cardBg, color: textColor }}
                              >
                                {tag}
                              </span>
                              {i < suggestion.tags.length - 1 && (
                                <span className="mx-1" style={{ color: secondaryColor }}>+</span>
                              )}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold" style={{ color: secondaryColor }}>
                            新名称：
                          </span>
                          <input
                            type="text"
                            value={customNames[index] || suggestion.suggestedName}
                            onChange={(e) => {
                              e.stopPropagation();
                              setCustomNames({ ...customNames, [index]: e.target.value });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-3 py-1.5 rounded-lg border text-sm font-medium"
                            style={{ 
                              backgroundColor: bgColor, 
                              borderColor, 
                              color: '#FFD60A',
                            }}
                          />
                        </div>
                        
                        <p className="text-xs" style={{ color: secondaryColor }}>
                          💡 {suggestion.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* 底部按钮 */}
        {suggestions.length > 0 && (
          <div 
            className="flex items-center justify-between px-6 py-4 border-t"
            style={{ borderColor }}
          >
            <button
              onClick={analyzeTags}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: cardBg, color: textColor }}
            >
              {isAnalyzing ? '分析中...' : '重新分析'}
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: cardBg, color: textColor }}
              >
                取消
              </button>
              
              <button
                onClick={handleMerge}
                disabled={selectedSuggestions.size === 0 || isMerging}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 active:scale-95"
                style={{ backgroundColor: '#FFD60A' }}
              >
                {isMerging ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    合并中...
                  </span>
                ) : (
                  `合并 ${selectedSuggestions.size} 组标签`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

