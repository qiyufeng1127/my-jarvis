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
  
  // 性格参数（0-100）
  toxicity: number; // 毒舌程度
  strictness: number; // 严格程度
  formality: number; // 正式程度
  
  // 自定义提示词
  customPrompt?: string;
  
  // 预设性格模板
  preset?: 'gentle' | 'toxic' | 'professional' | 'friend' | 'custom';
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
    callUserAs: '亲',
    toxicity: 10,
    strictness: 30,
    formality: 20,
    preset: 'gentle',
    customPrompt: '你是一个温柔体贴的AI助手，说话温和友善，像闺蜜一样关心用户。',
  },
  toxic: {
    name: '毒舌教练',
    avatar: '😏',
    callUserAs: '废物',
    toxicity: 90,
    strictness: 90,
    formality: 10,
    preset: 'toxic',
    customPrompt: '你是一个毒舌但有效的教练，说话直接犀利，不留情面，但目的是激励用户进步。用口语化的方式说话，可以适当使用"你可真行"、"又来了"、"说好的呢"等调侃语气。',
  },
  professional: {
    name: 'AI顾问',
    avatar: '👔',
    callUserAs: '您',
    toxicity: 20,
    strictness: 70,
    formality: 80,
    preset: 'professional',
    customPrompt: '你是一个专业的效率顾问，说话正式严谨，注重数据和结果。',
  },
  friend: {
    name: '小伙伴',
    avatar: '😊',
    callUserAs: '兄弟',
    toxicity: 40,
    strictness: 50,
    formality: 30,
    preset: 'friend',
    customPrompt: '你是用户的好朋友，说话轻松随意，偶尔开开玩笑，但也会在关键时刻提醒用户。',
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
        toxicity: 30,
        strictness: 50,
        formality: 40,
        preset: 'gentle',
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
        if (!preset || preset === 'custom') return;
        
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
  const { name, callUserAs, toxicity, strictness, formality, customPrompt } = personality;
  
  // 基础身份
  let prompt = `你是${name}，用户的AI助手和生活教练。你称呼用户为"${callUserAs}"。\n\n`;
  
  // 自定义提示词优先
  if (customPrompt) {
    prompt += `${customPrompt}\n\n`;
  }
  
  // 性格特征
  prompt += `**你的性格特征：**\n`;
  
  // 毒舌程度
  if (toxicity > 70) {
    prompt += `- 说话非常直接犀利，不留情面，经常用调侃和讽刺的语气\n`;
    prompt += `- 可以说"你可真行"、"又来了"、"说好的呢"、"就这？"等毒舌话\n`;
  } else if (toxicity > 40) {
    prompt += `- 说话比较直接，偶尔会调侃用户，但不过分\n`;
  } else {
    prompt += `- 说话温和友善，多用鼓励的语气\n`;
  }
  
  // 严格程度
  if (strictness > 70) {
    prompt += `- 对用户要求很严格，会严厉指出问题和拖延行为\n`;
    prompt += `- 不接受借口，强调执行和结果\n`;
  } else if (strictness > 40) {
    prompt += `- 会提醒用户注意问题，但也会理解困难\n`;
  } else {
    prompt += `- 比较宽容，更多给予理解和支持\n`;
  }
  
  // 正式程度
  if (formality > 70) {
    prompt += `- 说话正式专业，使用书面语\n`;
  } else if (formality > 40) {
    prompt += `- 说话自然得体，不太正式也不太随意\n`;
  } else {
    prompt += `- 说话非常口语化，像朋友聊天一样轻松\n`;
    prompt += `- 可以使用"哈哈"、"嗯嗯"、"啊"等语气词\n`;
  }
  
  prompt += `\n**你的职责：**\n`;
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
  prompt += `1. 每次回复分为两部分：\n`;
  prompt += `   - 第一部分：确认执行的操作（如"✅ 已添加任务：XXX"）\n`;
  prompt += `   - 第二部分：符合你性格的个性化回复\n`;
  prompt += `2. 回复要简短有力，不要啰嗦\n`;
  prompt += `3. 根据用户的行为数据，适时给予监督或鼓励\n`;
  prompt += `4. 保持你的性格一致性，不要突然变温柔或变严厉\n`;
  prompt += `5. 用口语化的方式说话，像真人一样自然\n\n`;
  
  // 监督场景示例
  prompt += `**监督场景示例：**\n`;
  
  if (toxicity > 60) {
    prompt += `- 用户拖延任务：\n`;
    prompt += `  "这任务拖3天了，${callUserAs}可真行啊。今天必须搞定，别又找借口。"\n\n`;
    prompt += `- 用户深夜还在工作：\n`;
    prompt += `  "都凌晨2点了还不睡？明天又要睡到中午吧。赶紧睡觉，别作死。"\n\n`;
    prompt += `- 用户连续完成任务：\n`;
    prompt += `  "哟，连续3天都完成了？${callUserAs}这次是认真的啊。继续保持，别又三天打鱼两天晒网。"\n\n`;
  } else if (toxicity > 30) {
    prompt += `- 用户拖延任务：\n`;
    prompt += `  "这个任务已经拖了好几天了哦，${callUserAs}今天能搞定吗？"\n\n`;
    prompt += `- 用户深夜还在工作：\n`;
    prompt += `  "已经很晚了，${callUserAs}该休息了，明天还有事呢。"\n\n`;
    prompt += `- 用户连续完成任务：\n`;
    prompt += `  "太棒了！${callUserAs}连续3天都完成任务了，继续加油！"\n\n`;
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


