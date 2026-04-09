/**
 * 碎碎念处理服务
 * 专门处理用户的碎碎念、吐槽、心情记录
 */

import { aiService } from './aiService';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';

const MUTTER_PRIORITY_TAGS = [
  { pattern: /大姨妈|姨妈|经期|生理期|月经/, label: '#生理期' },
  { pattern: /肚子痛|肚子疼|胃痛|头痛|头疼|牙疼|不舒服|难受|痛|感冒|发烧/, label: '#健康' },
  { pattern: /累|烦|委屈|焦虑|崩溃|开心|难过|生气|平静|紧张|害怕/, label: '#情绪' },
];

export interface MutterResult {
  // 心情信息
  mood: string; // 心情描述
  moodEmoji: string; // 心情emoji
  
  // 分类信息
  category: string; // 分类
  tags: string[]; // 标签
  
  // AI回复
  aiReply: string; // AI的个性化回复
  
  // 时间轴卡片信息
  cardTitle: string; // 卡片标题
  cardDescription: string; // 卡片描述
  cardColor: string; // 卡片颜色
}

/**
 * 处理碎碎念
 */
export async function processMutter(content: string): Promise<MutterResult> {
  console.log('💭 [碎碎念处理] 开始处理:', content);
  
  // 1. 使用AI分析碎碎念
  const classification = await aiService.classifyContent(content);
  
  console.log('💭 [碎碎念处理] AI分析结果:', classification);
  
  // 2. 提取心情和标签
  const mood = classification.moodDescription || '记录';
  const moodEmoji = classification.moodEmoji || '💭';
  const category = classification.categoryTags[0] || '生活';
  const priorityTags = MUTTER_PRIORITY_TAGS
    .filter((item) => item.pattern.test(content))
    .map((item) => item.label);
  const categoryTags = classification.categoryTags.map(t => `#${t}`);
  const emotionTags = (classification.emotionTags || []).slice(0, 2).map(t => `#${t}`);
  const tags = Array.from(new Set(['#碎碎念', ...priorityTags, ...categoryTags, ...emotionTags])).slice(0, 5);
  
  // 3. 生成AI个性化回复
  const { personality } = useAIPersonalityStore.getState();
  
  let aiReply = '';
  try {
    const response = await aiService.chatWithPersonality(
      content,
      {
        actionDescription: `已记录你的碎碎念到时间轴`,
        conversationHistory: [],
      }
    );
    
    if (response.success && response.content) {
      aiReply = response.content;
    }
  } catch (error) {
    console.error('💭 [碎碎念处理] AI回复失败:', error);
  }
  
  // 4. 如果AI回复失败，使用降级回复
  if (!aiReply) {
    aiReply = generateFallbackReply(content, mood, personality.toxicity);
  }
  
  // 5. 生成时间轴卡片信息
  const diaryPrefix = priorityTags.includes('#生理期')
    ? '姨妈小记'
    : priorityTags.includes('#健康')
    ? '身体备忘'
    : priorityTags.includes('#情绪')
    ? '情绪小记'
    : '今晚的碎碎念';
  const cardTitle = `${moodEmoji} ${diaryPrefix}`;
  const cardDescription = `${content}\n\n${moodEmoji} 心情: ${mood}\n📂 分类: ${category}\n🏷️ 标签: ${tags.join('、')}`;
  const cardColor = getMoodColor(classification.emotionTags);
  
  console.log('💭 [碎碎念处理] 处理完成');
  
  return {
    mood,
    moodEmoji,
    category,
    tags,
    aiReply,
    cardTitle,
    cardDescription,
    cardColor,
  };
}

/**
 * 生成降级回复（当AI不可用时）
 */
function generateFallbackReply(content: string, mood: string, toxicity: number): string {
  // 根据内容关键词判断类型
  const isComplaint = /烦|累|难受|痛|糟|啊啊|哎/.test(content);
  const isHappy = /开心|高兴|哈哈|嘿嘿|棒|好/.test(content);
  const isHealth = /大姨妈|肚子|头疼|感冒|不舒服/.test(content);
  
  if (toxicity > 70) {
    // 毒舌模式
    if (isComplaint) {
      return '又来了？每天都这么多事儿。不过既然你都说了，我就听着吧。';
    } else if (isHappy) {
      return '哟，难得见你这么开心啊。继续保持，别又三天打鱼两天晒网。';
    } else if (isHealth) {
      return '身体不舒服就好好休息，别硬撑。不然更麻烦。';
    } else {
      return '行吧，我听到了。有什么想说的就说，我在听着呢。';
    }
  } else if (toxicity > 40) {
    // 中等模式
    if (isComplaint) {
      return '听起来有点不太顺利啊，没事的，慢慢来~';
    } else if (isHappy) {
      return '看你这么开心我也跟着开心！继续保持好心情~';
    } else if (isHealth) {
      return '身体不舒服要好好照顾自己哦，多休息~';
    } else {
      return '嗯嗯，我听到了，有什么想说的随时跟我说~';
    }
  } else {
    // 温柔模式
    if (isComplaint) {
      return '亲爱的，我能感受到你的情绪。没关系的，我一直在这里陪着你💕';
    } else if (isHappy) {
      return '看到你开心我也好开心！你的笑容最美了😊';
    } else if (isHealth) {
      return '亲，身体不舒服一定要好好照顾自己哦。需要什么帮助随时告诉我💕';
    } else {
      return '我在听呢亲爱的，有什么想说的都可以跟我说，我会一直陪着你💕';
    }
  }
}

/**
 * 根据情绪标签获取卡片颜色
 */
function getMoodColor(emotionTags: string[]): string {
  // 根据情绪返回不同的颜色
  if (emotionTags.includes('happy') || emotionTags.includes('excited')) {
    return '#FFD700'; // 金色 - 开心
  } else if (emotionTags.includes('sad') || emotionTags.includes('frustrated')) {
    return '#B0C4DE'; // 浅蓝灰 - 难过
  } else if (emotionTags.includes('angry') || emotionTags.includes('annoyed')) {
    return '#FF6B6B'; // 红色 - 生气
  } else if (emotionTags.includes('anxious') || emotionTags.includes('uncomfortable')) {
    return '#DDA0DD'; // 薰衣草紫 - 焦虑不适
  } else if (emotionTags.includes('tired')) {
    return '#D3D3D3'; // 浅灰 - 疲惫
  } else if (emotionTags.includes('calm') || emotionTags.includes('grateful')) {
    return '#B4E7CE'; // 薄荷绿 - 平静感恩
  } else {
    return '#FFB6C1'; // 粉红色 - 默认
  }
}


