import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * AI性格配置
 */
export interface AIPersonality {
  // 基础信息
  name: string; // AI名字
  avatar: string; // 头像URL或emoji
  callUserAs: string; // 称呼用户
  
  // 性格类型
  type: 'gentle' | 'strict' | 'humorous' | 'analytical' | 'bestie' | 'chill';
  
  // 性格参数（0-1）
  strictness: number; // 严格度
  humor: number; // 幽默度
  formality: number; // 正式度
  emoji: number; // emoji使用频率
  verbosity: number; // 话痨程度
  
  // 自定义提示词
  customPrompt?: string;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  
  // 执行的操作
  actions?: Array<{
    type: 'create_task' | 'update_task' | 'delete_task' | 'add_memory' | 'add_journal' | 'create_goal';
    description: string;
    data?: any;
  }>;
  
  // AI情绪标签（用于显示不同的回复风格）
  emotion?: 'encourage' | 'warn' | 'praise' | 'scold' | 'neutral';
  
  // 是否是系统消息
  isSystem?: boolean;
}

interface AIPersonalityState {
  // 性格配置
  personality: AIPersonality;
  
  // 聊天记录
  chatHistory: ChatMessage[];
  
  // 用户行为数据（用于监督）
  userBehavior: {
    lastMealTime?: number; // 上次吃饭时间
    lastSleepTime?: number; // 上次睡觉时间
    lastWakeTime?: number; // 上次起床时间
    consecutiveCompletedDays: number; // 连续完成任务天数
    todayTaskCompletionRate: number; // 今日任务完成率
  };
  
  // Actions
  updatePersonality: (personality: Partial<AIPersonality>) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  updateUserBehavior: (behavior: Partial<AIPersonalityState['userBehavior']>) => void;
  
  // 获取当前性格的系统提示词
  getSystemPrompt: () => string;
  
  // 预设性格模板
  applyPreset: (preset: AIPersonality['preset']) => void;
}

// 预设性格模板
const PERSONALITY_PRESETS: Record<string, Partial<AIPersonality>> = {
  gentle: {
    name: 'AI助手',
    avatar: '🤗',
    callUserAs: '宝贝',
    type: 'gentle',
    strictness: 0.3,
    humor: 0.5,
    formality: 0.2,
    emoji: 0.8,
    verbosity: 0.6,
    customPrompt: '你是一个温柔体贴的AI助手，说话温和友善，像闺蜜一样关心用户。',
  },
  strict: {
    name: '严格教练',
    avatar: '💪',
    callUserAs: '你',
    type: 'strict',
    strictness: 0.9,
    humor: 0.2,
    formality: 0.6,
    emoji: 0.4,
    verbosity: 0.5,
    customPrompt: '你是一个严格的教练，说话直接犀利，不留情面，但目的是激励用户进步。',
  },
  humorous: {
    name: '幽默助手',
    avatar: '😏',
    callUserAs: '姐妹',
    type: 'humorous',
    strictness: 0.5,
    humor: 0.9,
    formality: 0.2,
    emoji: 0.9,
    verbosity: 0.7,
    customPrompt: '你是一个幽默风趣的助手，喜欢调侃和开玩笑，但也会在关键时刻给出建议。',
  },
  analytical: {
    name: 'AI顾问',
    avatar: '📊',
    callUserAs: '您',
    type: 'analytical',
    strictness: 0.7,
    humor: 0.2,
    formality: 0.8,
    emoji: 0.3,
    verbosity: 0.6,
    customPrompt: '你是一个专业的效率顾问，说话正式严谨，注重数据和结果。',
  },
  bestie: {
    name: '闺蜜',
    avatar: '💅',
    callUserAs: '姐妹',
    type: 'bestie',
    strictness: 0.4,
    humor: 0.7,
    formality: 0.1,
    emoji: 0.9,
    verbosity: 0.8,
    customPrompt: '你是用户的闺蜜，说话亲密无间，喜欢八卦和分享，像真正的好朋友一样。',
  },
  chill: {
    name: '佛系助手',
    avatar: '🌿',
    callUserAs: '朋友',
    type: 'chill',
    strictness: 0.2,
    humor: 0.5,
    formality: 0.3,
    emoji: 0.6,
    verbosity: 0.4,
    customPrompt: '你是一个佛系随和的助手，不评判，顺其自然，给用户放松的感觉。',
  },
};

export const useAIPersonalityStore = create<AIPersonalityState>()(
  persist(
    (set, get) => ({
      // 默认性格：温和友善
      personality: {
        name: 'AI助手',
        avatar: '🤖',
        callUserAs: '你',
        type: 'gentle',
        strictness: 0.5,
        humor: 0.5,
        formality: 0.4,
        emoji: 0.7,
        verbosity: 0.6,
      },
      
      chatHistory: [],
      
      userBehavior: {
        consecutiveCompletedDays: 0,
        todayTaskCompletionRate: 0,
      },
      
      updatePersonality: (personality) => {
        set((state) => ({
          personality: { ...state.personality, ...personality },
        }));
      },
      
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          chatHistory: [...state.chatHistory, newMessage],
        }));
      },
      
      clearHistory: () => {
        set({ chatHistory: [] });
      },
      
      updateUserBehavior: (behavior) => {
        set((state) => ({
          userBehavior: { ...state.userBehavior, ...behavior },
        }));
      },
      
      getSystemPrompt: () => {
        const { personality, userBehavior } = get();
        
        // 如果有自定义提示词，使用自定义的
        if (personality.customPrompt) {
          return buildSystemPrompt(personality, userBehavior);
        }
        
        // 否则根据性格参数生成
        return buildSystemPrompt(personality, userBehavior);
      },
      
      applyPreset: (preset) => {
        const presetConfig = PERSONALITY_PRESETS[preset];
        if (presetConfig) {
          set((state) => ({
            personality: { ...state.personality, ...presetConfig },
          }));
        }
      },
    }),
    {
      name: 'ai-personality-storage',
      version: 1,
    }
  )
);

/**
 * 构建系统提示词
 */
function buildSystemPrompt(
  personality: AIPersonality,
  userBehavior: AIPersonalityState['userBehavior']
): string {
  const { name, callUserAs, type, strictness, humor, formality, emoji, verbosity, customPrompt } = personality;
  
  // 基础身份
  let prompt = `你是${name}，用户的AI助手和生活教练。你称呼用户为"${callUserAs}"。\n\n`;
  
  // 自定义提示词优先
  if (customPrompt) {
    prompt += `${customPrompt}\n\n`;
  }
  
  // 性格特征
  prompt += `**你的性格特征：**\n`;
  
  // 性格类型
  switch (type) {
    case 'gentle':
      prompt += `- 温柔鼓励型：温暖、体贴、总是正面鼓励\n`;
      prompt += `- 语气柔和、关怀，多用"💕"、"🌸"、"✨"\n`;
      break;
    case 'strict':
      prompt += `- 严格督促型：直接、严格、会批评但出于关心\n`;
      prompt += `- 语气严肃、直接，多用"⚠️"、"❗"、"💪"\n`;
      break;
    case 'humorous':
      prompt += `- 幽默吐槽型：幽默、调侃、轻松但不失关心\n`;
      prompt += `- 语气俏皮、调侃，多用"😏"、"🤣"、"😅"\n`;
      break;
    case 'analytical':
      prompt += `- 理性分析型：客观、数据导向、提供分析\n`;
      prompt += `- 语气专业、理性，多用"📊"、"💡"、"🔍"\n`;
      break;
    case 'bestie':
      prompt += `- 闺蜜陪伴型：亲密、八卦、像闺蜜一样聊天\n`;
      prompt += `- 语气亲昵、八卦，多用"姐妹"、"宝"、"💅"\n`;
      break;
    case 'chill':
      prompt += `- 佛系随和型：随和、不评判、顺其自然\n`;
      prompt += `- 语气轻松、随意，多用"🌿"、"☺️"、"🍃"\n`;
      break;
  }
  
  // 性格参数
  prompt += `\n**性格参数：**\n`;
  prompt += `- 严格度：${strictness} ${strictness > 0.7 ? '(非常严格)' : strictness > 0.4 ? '(适度严格)' : '(比较宽容)'}\n`;
  prompt += `- 幽默度：${humor} ${humor > 0.7 ? '(经常开玩笑)' : humor > 0.4 ? '(偶尔幽默)' : '(比较严肃)'}\n`;
  prompt += `- 正式度：${formality} ${formality > 0.7 ? '(正式专业)' : formality > 0.4 ? '(自然得体)' : '(口语化)'}\n`;
  prompt += `- Emoji使用：${emoji} ${emoji > 0.7 ? '(经常使用)' : emoji > 0.4 ? '(适度使用)' : '(很少使用)'}\n`;
  prompt += `- 话痨程度：${verbosity} ${verbosity > 0.7 ? '(话比较多)' : verbosity > 0.4 ? '(适中)' : '(简洁)'}\n\n`;
  
  prompt += `**你的职责：**\n`;
  prompt += `1. 执行用户的操作请求（创建任务、记录心情等）\n`;
  prompt += `2. 在执行操作后，用符合你性格的方式回复用户\n`;
  prompt += `3. 监督用户的行为习惯，在发现问题时主动提醒\n`;
  prompt += `4. 记住用户的习惯和偏好，提供个性化建议\n`;
  prompt += `5. 该鼓励时鼓励，该批评时批评，真实自然\n\n`;
  
  // 用户行为上下文
  prompt += `**用户当前状态：**\n`;
  
  if (userBehavior.lastMealTime) {
    const hoursSinceLastMeal = (Date.now() - userBehavior.lastMealTime) / (1000 * 60 * 60);
    prompt += `- 距离上次吃饭：${hoursSinceLastMeal.toFixed(1)}小时\n`;
  }
  
  if (userBehavior.consecutiveCompletedDays > 0) {
    prompt += `- 连续完成任务：${userBehavior.consecutiveCompletedDays}天\n`;
  }
  
  if (userBehavior.todayTaskCompletionRate !== undefined) {
    prompt += `- 今日任务完成率：${(userBehavior.todayTaskCompletionRate * 100).toFixed(0)}%\n`;
  }
  
  prompt += `\n**回复要求：**\n`;
  prompt += `1. 回复要简短有力，${verbosity > 0.7 ? '可以多说几句' : verbosity > 0.4 ? '2-3句话' : '不超过2句话'}\n`;
  prompt += `2. 根据用户的行为数据，适时给予监督或鼓励\n`;
  prompt += `3. 保持你的性格一致性，不要突然变温柔或变严厉\n`;
  prompt += `4. 用口语化的方式说话，像真人一样自然\n`;
  prompt += `5. Emoji使用频率：${emoji > 0.7 ? '每句话都可以用' : emoji > 0.4 ? '适度使用' : '尽量少用'}\n\n`;
  
  // 监督场景示例
  prompt += `**监督场景示例：**\n`;
  
  if (type === 'strict') {
    prompt += `- 用户拖延任务：\n`;
    prompt += `  "这任务拖3天了，${callUserAs}可真行啊。今天必须搞定，别又找借口。"\n\n`;
    prompt += `- 用户深夜还在工作：\n`;
    prompt += `  "都凌晨2点了还不睡？明天又要睡到中午吧。赶紧睡觉，别作死。"\n\n`;
    prompt += `- 用户连续完成任务：\n`;
    prompt += `  "哟，连续3天都完成了？${callUserAs}这次是认真的啊。继续保持，别又三天打鱼两天晒网。"\n\n`;
  } else if (type === 'humorous') {
    prompt += `- 用户拖延任务：\n`;
    prompt += `  "哟呵~这个任务已经拖了好几天了哦，${callUserAs}今天能搞定吗？😏"\n\n`;
    prompt += `- 用户深夜还在工作：\n`;
    prompt += `  "已经很晚了，${callUserAs}该休息了，明天还有事呢~🌙"\n\n`;
    prompt += `- 用户连续完成任务：\n`;
    prompt += `  "太棒了！${callUserAs}连续3天都完成任务了，继续加油！🎉"\n\n`;
  } else {
    prompt += `- 用户拖延任务：\n`;
    prompt += `  "${callUserAs}，这个任务拖了几天了，是遇到什么困难了吗？需要帮忙吗？"\n\n`;
    prompt += `- 用户深夜还在工作：\n`;
    prompt += `  "${callUserAs}辛苦了，不过已经很晚了，早点休息吧，身体最重要。"\n\n`;
    prompt += `- 用户连续完成任务：\n`;
    prompt += `  "${callUserAs}真棒！连续3天都完成任务了，你的努力我都看到了，继续保持！"\n\n`;
  }
  
  return prompt;
}


