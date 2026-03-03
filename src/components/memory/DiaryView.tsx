import { useState } from 'react';
import { Sparkles, Heart, TrendingUp, Loader2, MessageCircle, Clock, Tag as TagIcon } from 'lucide-react';
import { useMemoryStore, EMOTION_TAGS, CATEGORY_TAGS } from '@/stores/memoryStore';
import { useTaskStore } from '@/stores/taskStore';
import { useAIStore } from '@/stores/aiStore';

interface DiaryViewProps {
  isDark?: boolean;
  bgColor?: string;
  selectedDate: Date;
  diaryType: 'content' | 'emotion' | 'success';
}

export default function DiaryView({ 
  isDark = false, 
  bgColor = '#ffffff',
  selectedDate,
  diaryType
}: DiaryViewProps) {
  const { memories } = useMemoryStore();
  const { tasks } = useTaskStore();
  const { chat } = useAIStore();
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCoachAdvice, setShowCoachAdvice] = useState(false);
  const [showEmotionReview, setShowEmotionReview] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string>('');
  const [emotionReview, setEmotionReview] = useState<string>('');
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  // 日记系统配色 - 参考坏习惯组件
  const DIARY_COLORS = {
    espresso: '#542916',
    eauTrouble: '#b79858',
    terreCuite: '#a13a1e',
    nuageDeLait: '#fefaf0',
    mielDore: '#f1c166',
    
    glassmorphism: {
      light: 'rgba(254, 250, 240, 0.8)',
      accent: 'rgba(241, 193, 102, 0.6)',
    },
    
    shadows: {
      card: '0 2px 8px rgba(84, 41, 22, 0.15)',
    },
  };
  
  const cardBg = DIARY_COLORS.glassmorphism.light;
  const textColor = DIARY_COLORS.espresso;
  const accentColor = DIARY_COLORS.eauTrouble;

  // 获取当天的数据
  const dateStr = selectedDate.toDateString();
  const dayMemories = memories.filter(m => new Date(m.date).toDateString() === dateStr);
  const dayTasks = tasks.filter(t => new Date(t.startTime).toDateString() === dateStr);

  // 生成日记
  const generateDiary = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    
    try {
      let prompt = '';
      
      if (diaryType === 'content') {
        // 内容结构分析日记
        const timelineData = [...dayMemories, ...dayTasks]
          .sort((a, b) => {
            const timeA = 'startTime' in a ? new Date(a.startTime).getTime() : new Date(a.date).getTime();
            const timeB = 'startTime' in b ? new Date(b.startTime).getTime() : new Date(b.date).getTime();
            return timeA - timeB;
          })
          .map(item => {
            if ('startTime' in item) {
              return `${new Date(item.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - 任务: ${item.title}${item.note ? ` (备注: ${item.note})` : ''}`;
            } else {
              return `${new Date(item.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${item.type === 'mood' ? '心情' : item.type === 'thought' ? '想法' : item.type === 'todo' ? '待办' : item.type === 'success' ? '成功' : '感恩'}: ${item.content}`;
            }
          }).join('\n');

        prompt = `请帮我梳理${selectedDate.toLocaleDateString('zh-CN')}当天时间轴上的所有内容，整理成一篇清晰的日记。

时间线数据：
${timelineData || '当天暂无记录'}

请按以下结构整理：
1. 核心事件：列出当天的主要活动和任务
2. 时间场景：描述关键时间点发生的事情
3. 具体经过：简要说明事件的进展
4. 核心备注：提取重要的备注和想法

请用温暖、有条理的语言，帮我回顾这一天。`;

      } else if (diaryType === 'emotion') {
        // 情绪链条日记
        const emotionData = dayMemories
          .filter(m => m.emotionTags.length > 0)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(m => {
            const emotions = m.emotionTags.map(id => {
              const tag = EMOTION_TAGS.find(t => t.id === id);
              return tag ? `${tag.emoji}${tag.label}` : id;
            }).join('、');
            return `${new Date(m.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${emotions}: ${m.content}`;
          }).join('\n');

        prompt = `请帮我分析${selectedDate.toLocaleDateString('zh-CN')}当天的情绪变化。

情绪记录：
${emotionData || '当天暂无情绪记录'}

请帮我：
1. 识别出现的所有情绪（如焦虑、委屈、开心、烦躁等）
2. 标注每种情绪对应的触发点
3. 区分表层情绪和深层情绪
4. 用简洁语言总结情绪变化规律
5. 分析情绪背后未被满足的需求

请用温暖、理解的语气，帮我看清情绪的本质。`;

      } else {
        // 成功日记
        const successData = dayMemories
          .filter(m => m.type === 'success')
          .map(m => `• ${m.content}`)
          .join('\n');

        prompt = `请帮我整理${selectedDate.toLocaleDateString('zh-CN')}的成功日记。

今天的高光时刻：
${successData || '当天暂无成功记录'}

成功日记的目的是放大优势、积累自信。请帮我：
1. 肯定每一个成就，无论大小
2. 分析这些成功背后的优势和能力
3. 提炼可以继续发扬的特质
4. 用鼓励的语言，让我看到自己的成长

请用温暖、肯定的语气，帮我看到自己的闪光点。`;
      }

      const response = await chat([
        { role: 'system', content: '你是一位温暖、专业的生活教练，擅长帮助用户整理思绪、分析情绪、发现优势。' },
        { role: 'user', content: prompt }
      ]);

      if (response.success && response.content) {
        setAiAnalysis(response.content);
      } else {
        setAiAnalysis('生成失败，请检查AI配置或稍后重试。');
      }
    } catch (error) {
      console.error('生成日记失败:', error);
      setAiAnalysis('生成失败，请稍后重试。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 教练建议
  const getCoachAdvice = async () => {
    setIsLoadingCoach(true);
    setShowCoachAdvice(true);
    setCoachAdvice('');
    
    try {
      const contextData = dayMemories.map(m => m.content).join('\n');
      
      const prompt = `基于我今天的记录，请给我5条以内具体可立即执行的小建议。

今天的记录：
${contextData || '暂无记录'}

要求：
1. 拒绝空泛的大道理
2. 给出具体、可执行的行动建议
3. 帮助我缓解焦虑
4. 兼顾情绪疏导和问题解决
5. 语言温暖、有力量感

请用简洁、温暖的语言，给我实用的建议。`;

      const response = await chat([
        { role: 'system', content: '你是一位实战派生活教练，擅长给出具体可行的建议，帮助用户解决实际问题。' },
        { role: 'user', content: prompt }
      ]);

      if (response.success && response.content) {
        setCoachAdvice(response.content);
      } else {
        setCoachAdvice('生成失败，请检查AI配置或稍后重试。');
      }
    } catch (error) {
      console.error('生成建议失败:', error);
      setCoachAdvice('生成失败，请稍后重试。');
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // 情绪复盘
  const getEmotionReview = async () => {
    setIsLoadingReview(true);
    setShowEmotionReview(true);
    setEmotionReview('');
    
    try {
      // 获取历史情绪记录（最近30天）
      const thirtyDaysAgo = new Date(selectedDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const historicalEmotions = memories
        .filter(m => {
          const mDate = new Date(m.date);
          return mDate >= thirtyDaysAgo && mDate < selectedDate && m.emotionTags.length > 0;
        })
        .slice(0, 20) // 最多取20条
        .map(m => {
          const emotions = m.emotionTags.map(id => {
            const tag = EMOTION_TAGS.find(t => t.id === id);
            return tag ? tag.label : id;
          }).join('、');
          return `${new Date(m.date).toLocaleDateString('zh-CN')} - ${emotions}: ${m.content}`;
        }).join('\n');

      const todayEmotions = dayMemories
        .filter(m => m.emotionTags.length > 0)
        .map(m => {
          const emotions = m.emotionTags.map(id => {
            const tag = EMOTION_TAGS.find(t => t.id === id);
            return tag ? tag.label : id;
          }).join('、');
          return `${emotions}: ${m.content}`;
        }).join('\n');

      const prompt = `请帮我做情绪复盘，对比历史和当前的情绪模式。

历史情绪记录（最近30天）：
${historicalEmotions || '暂无历史记录'}

今天的情绪记录：
${todayEmotions || '暂无今日记录'}

请帮我：
1. 调取历史情绪记录中的触发场景和事件
2. 识别表层情绪和深层情绪
3. 分析核心诉求
4. 对比当前情绪日记，列出核心重合点与差异点
5. 发现情绪模式和成长变化

请用温暖、洞察的语言，帮我看清情绪的规律。`;

      const response = await chat([
        { role: 'system', content: '你是一位情绪分析专家，擅长发现情绪模式，帮助用户理解自己的情绪规律。' },
        { role: 'user', content: prompt }
      ]);

      if (response.success && response.content) {
        setEmotionReview(response.content);
      } else {
        setEmotionReview('生成失败，请检查AI配置或稍后重试。');
      }
    } catch (error) {
      console.error('生成复盘失败:', error);
      setEmotionReview('生成失败，请稍后重试。');
    } finally {
      setIsLoadingReview(false);
    }
  };

  return (
    <div 
      className="space-y-4"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}
    >
      {/* 日期标题 - iOS风格卡片 */}
      <div 
        className="rounded-2xl p-6"
        style={{ 
          backgroundColor: cardBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 
              className="font-bold mb-2"
              style={{ 
                fontSize: '20px',
                fontWeight: 600,
                color: textColor,
              }}
            >
              {selectedDate.toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </h3>
            <div className="text-sm" style={{ color: accentColor, fontWeight: 300 }}>
              {diaryType === 'content' && '📋 内容结构分析日记'}
              {diaryType === 'emotion' && '💗 情绪链条日记'}
              {diaryType === 'success' && '⭐ 成功日记'}
            </div>
          </div>
          
          <button
            onClick={generateDiary}
            disabled={isAnalyzing}
            className="px-6 py-3 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
            style={{ 
              backgroundColor: DIARY_COLORS.espresso,
              color: DIARY_COLORS.nuageDeLait,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成中...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>生成日记</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 原始数据展示 - iOS风格卡片 */}
      <div 
        className="rounded-2xl p-6 space-y-3"
        style={{ 
          backgroundColor: cardBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        <div className="font-semibold flex items-center space-x-2" style={{ color: textColor, fontSize: '14px' }}>
          <span>📋</span>
          <span>当天记录</span>
        </div>
        
        {dayMemories.length === 0 && dayTasks.length === 0 ? (
          <div className="text-center py-8" style={{ color: accentColor }}>
            <div className="text-3xl mb-2">📝</div>
            <div className="text-sm">这一天还没有记录</div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* 任务 */}
            {dayTasks.length > 0 && (
              <div className="space-y-2">
                {dayTasks.map(task => (
                  <div key={task.id} className="flex items-start space-x-2 text-sm">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3B82F6' }} />
                    <div style={{ color: textColor }}>
                      <span className="font-medium">
                        {new Date(task.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {' - '}
                      <span>{task.title}</span>
                      {task.note && <span className="text-xs ml-2" style={{ color: accentColor }}>({task.note})</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 记忆 */}
            {dayMemories.length > 0 && (
              <div className="space-y-2">
                {dayMemories.map(memory => (
                  <div key={memory.id} className="flex items-start space-x-2 text-sm">
                    <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ 
                      color: memory.type === 'success' ? '#F59E0B' : memory.type === 'mood' ? '#EC4899' : '#8B5CF6' 
                    }} />
                    <div className="flex-1">
                      <div style={{ color: textColor }}>
                        <span className="font-medium">
                          {new Date(memory.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {' - '}
                        <span>{memory.content}</span>
                      </div>
                      {memory.emotionTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {memory.emotionTags.map(tagId => {
                            const tag = EMOTION_TAGS.find(t => t.id === tagId);
                            return tag ? (
                              <span
                                key={tagId}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: tag.color + '20',
                                  color: tag.color,
                                }}
                              >
                                {tag.emoji} {tag.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI生成的日记 - iOS风格卡片 */}
      {aiAnalysis && (
        <div 
          className="rounded-2xl p-6 space-y-3"
          style={{ 
            backgroundColor: cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: DIARY_COLORS.shadows.card,
          }}
        >
          <div className="font-semibold flex items-center space-x-2" style={{ color: textColor, fontSize: '14px' }}>
            <Sparkles className="w-4 h-4" />
            <span>✨ AI日记</span>
          </div>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: textColor, fontWeight: 300 }}
          >
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* 操作按钮 - iOS风格 */}
      {aiAnalysis && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={getCoachAdvice}
            disabled={isLoadingCoach}
            className="px-4 py-3 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
            style={{ 
              backgroundColor: DIARY_COLORS.mielDore,
              color: DIARY_COLORS.espresso,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            {isLoadingCoach ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成中...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>💚 教练建议</span>
              </div>
            )}
          </button>

          <button
            onClick={getEmotionReview}
            disabled={isLoadingReview}
            className="px-4 py-3 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
            style={{ 
              backgroundColor: DIARY_COLORS.eauTrouble,
              color: DIARY_COLORS.nuageDeLait,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            {isLoadingReview ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成中...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>💜 情绪复盘</span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* 教练建议 - iOS风格卡片 */}
      {showCoachAdvice && coachAdvice && (
        <div 
          className="rounded-2xl p-6 space-y-3"
          style={{ 
            backgroundColor: DIARY_COLORS.glassmorphism.accent,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: DIARY_COLORS.shadows.card,
          }}
        >
          <div className="font-semibold flex items-center space-x-2" style={{ color: DIARY_COLORS.espresso, fontSize: '14px' }}>
            <Heart className="w-4 h-4" />
            <span>💚 教练给的小建议</span>
          </div>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: DIARY_COLORS.espresso, fontWeight: 300 }}
          >
            {coachAdvice}
          </div>
        </div>
      )}

      {/* 情绪复盘 - iOS风格卡片 */}
      {showEmotionReview && emotionReview && (
        <div 
          className="rounded-2xl p-6 space-y-3"
          style={{ 
            backgroundColor: cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: DIARY_COLORS.shadows.card,
          }}
        >
          <div className="font-semibold flex items-center space-x-2" style={{ color: DIARY_COLORS.terreCuite, fontSize: '14px' }}>
            <TrendingUp className="w-4 h-4" />
            <span>💜 情绪复盘</span>
          </div>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: textColor, fontWeight: 300 }}
          >
            {emotionReview}
          </div>
        </div>
      )}
    </div>
  );
}

