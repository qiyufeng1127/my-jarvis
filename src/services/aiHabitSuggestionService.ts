import { useAIStore } from '@/stores/aiStore';
import type { HabitFrequency, HabitType } from '@/types/habit';

interface AIHabitSuggestion {
  emoji: string;
  type: HabitType;
  frequency: HabitFrequency;
  targetValue: number;
  targetMode: 'frequency' | 'duration';
  keywords: string[];
  description: string;
  reverseDetection?: {
    enabled: boolean;
    timeRange: {
      startTime: string;
      endTime: string;
      crossDay: boolean;
    };
    notFoundKeywords: string[];
  };
}

class AIHabitSuggestionService {
  /**
   * 根据习惯标题智能推荐配置
   */
  async suggestHabitConfig(habitName: string): Promise<AIHabitSuggestion> {
    const aiStore = useAIStore.getState();
    
    // 如果启用了 AI，使用 AI 生成建议
    if (aiStore.enabled && aiStore.apiKey) {
      try {
        return await this.getAISuggestion(habitName);
      } catch (error) {
        console.warn('AI 建议失败，使用规则引擎:', error);
      }
    }
    
    // 使用规则引擎作为后备
    return this.getRuleBasedSuggestion(habitName);
  }
  
  /**
   * 使用 AI 生成建议
   */
  private async getAISuggestion(habitName: string): Promise<AIHabitSuggestion> {
    const aiStore = useAIStore.getState();
    
    const prompt = `你是一个习惯追踪助手。用户想要创建一个习惯："${habitName}"。

请分析这个习惯，并返回 JSON 格式的建议配置：

{
  "emoji": "合适的emoji图标",
  "type": "count | duration | boolean",
  "frequency": "daily | weekly | monthly | yearly",
  "targetValue": 数字,
  "targetMode": "frequency | duration",
  "keywords": ["关键词1", "关键词2"],
  "description": "简短描述",
  "reverseDetection": {
    "enabled": true/false,
    "timeRange": {
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "crossDay": true/false
    },
    "notFoundKeywords": ["关键词"]
  }
}

说明：
- type: count=计数型, duration=时长型, boolean=布尔型
- frequency: 建议的频率
- targetValue: 建议的目标值
- targetMode: frequency=按频率, duration=按持续时间
- keywords: 用于自动识别的关键词
- reverseDetection: 反向检测（如"不熬夜"需要检测晚上没有"睡觉"关键词）

只返回 JSON，不要其他内容。`;

    const response = await fetch('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        access_token: aiStore.apiKey,
      }),
    });
    
    const data = await response.json();
    const content = data.result;
    
    // 解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('AI 返回格式错误');
  }
  
  /**
   * 使用规则引擎生成建议
   */
  private getRuleBasedSuggestion(habitName: string): AIHabitSuggestion {
    const name = habitName.toLowerCase();
    
    // 运动类
    if (this.matchAny(name, ['跑步', '跑', 'run', '慢跑', '晨跑'])) {
      return {
        emoji: '🏃',
        type: 'duration',
        frequency: 'daily',
        targetValue: 30,
        targetMode: 'duration',
        keywords: ['跑步', '跑', '晨跑', '夜跑'],
        description: '每天跑步30分钟',
      };
    }
    
    if (this.matchAny(name, ['健身', '锻炼', '运动', 'workout', '撸铁'])) {
      return {
        emoji: '💪',
        type: 'duration',
        frequency: 'daily',
        targetValue: 45,
        targetMode: 'duration',
        keywords: ['健身', '锻炼', '运动', '撸铁', '力量训练'],
        description: '每天锻炼45分钟',
      };
    }
    
    if (this.matchAny(name, ['瑜伽', 'yoga', '冥想', 'meditation'])) {
      return {
        emoji: '🧘',
        type: 'duration',
        frequency: 'daily',
        targetValue: 20,
        targetMode: 'duration',
        keywords: ['瑜伽', '冥想', '打坐'],
        description: '每天瑜伽/冥想20分钟',
      };
    }
    
    // 学习类
    if (this.matchAny(name, ['阅读', '读书', 'read', '看书'])) {
      return {
        emoji: '📚',
        type: 'duration',
        frequency: 'daily',
        targetValue: 30,
        targetMode: 'duration',
        keywords: ['阅读', '读书', '看书'],
        description: '每天阅读30分钟',
      };
    }
    
    if (this.matchAny(name, ['学习', 'study', '复习'])) {
      return {
        emoji: '📖',
        type: 'duration',
        frequency: 'daily',
        targetValue: 60,
        targetMode: 'duration',
        keywords: ['学习', '复习', '做题'],
        description: '每天学习1小时',
      };
    }
    
    if (this.matchAny(name, ['写作', '写', 'write', '日记'])) {
      return {
        emoji: '✍️',
        type: 'duration',
        frequency: 'daily',
        targetValue: 30,
        targetMode: 'duration',
        keywords: ['写作', '写', '日记', '记录'],
        description: '每天写作30分钟',
      };
    }
    
    // 健康类
    if (this.matchAny(name, ['喝水', '饮水', 'water', '补水'])) {
      return {
        emoji: '💧',
        type: 'count',
        frequency: 'daily',
        targetValue: 8,
        targetMode: 'frequency',
        keywords: ['喝水', '饮水', '补水'],
        description: '每天喝8杯水',
      };
    }
    
    if (this.matchAny(name, ['睡眠', '睡觉', 'sleep', '休息'])) {
      return {
        emoji: '😴',
        type: 'duration',
        frequency: 'daily',
        targetValue: 480, // 8小时
        targetMode: 'duration',
        keywords: ['睡觉', '睡眠', '休息', '上床'],
        description: '每天睡眠8小时',
      };
    }
    
    if (this.matchAny(name, ['早起', '早睡', '不熬夜'])) {
      return {
        emoji: '🌅',
        type: 'boolean',
        frequency: 'daily',
        targetValue: 1,
        targetMode: 'frequency',
        keywords: ['早起', '起床'],
        description: '每天早起',
      };
    }
    
    // 熬夜检测（反向规则）
    if (this.matchAny(name, ['不熬夜', '早睡', '按时睡觉'])) {
      return {
        emoji: '🌙',
        type: 'boolean',
        frequency: 'daily',
        targetValue: 1,
        targetMode: 'frequency',
        keywords: [],
        description: '晚上11点到凌晨5点不熬夜',
        reverseDetection: {
          enabled: true,
          timeRange: {
            startTime: '23:00',
            endTime: '05:00',
            crossDay: true,
          },
          notFoundKeywords: ['工作', '学习', '加班', '熬夜', '刷手机', '游戏'],
        },
      };
    }
    
    // 饮食类
    if (this.matchAny(name, ['吃早餐', '早餐', 'breakfast'])) {
      return {
        emoji: '🍳',
        type: 'boolean',
        frequency: 'daily',
        targetValue: 1,
        targetMode: 'frequency',
        keywords: ['早餐', '吃早餐'],
        description: '每天吃早餐',
      };
    }
    
    if (this.matchAny(name, ['吃水果', '水果', 'fruit'])) {
      return {
        emoji: '🍎',
        type: 'count',
        frequency: 'daily',
        targetValue: 2,
        targetMode: 'frequency',
        keywords: ['水果', '苹果', '香蕉', '橙子'],
        description: '每天吃2份水果',
      };
    }
    
    // 工作类
    if (this.matchAny(name, ['编程', '写代码', 'code', 'coding'])) {
      return {
        emoji: '💻',
        type: 'duration',
        frequency: 'daily',
        targetValue: 120,
        targetMode: 'duration',
        keywords: ['编程', '写代码', '开发', 'coding'],
        description: '每天编程2小时',
      };
    }
    
    // 娱乐类
    if (this.matchAny(name, ['画画', '绘画', 'draw', 'paint'])) {
      return {
        emoji: '🎨',
        type: 'duration',
        frequency: 'weekly',
        targetValue: 60,
        targetMode: 'duration',
        keywords: ['画画', '绘画', '素描'],
        description: '每周画画1小时',
      };
    }
    
    if (this.matchAny(name, ['音乐', '练琴', '弹琴', 'music'])) {
      return {
        emoji: '🎵',
        type: 'duration',
        frequency: 'daily',
        targetValue: 30,
        targetMode: 'duration',
        keywords: ['音乐', '练琴', '弹琴', '吉他'],
        description: '每天练琴30分钟',
      };
    }
    
    // 默认建议
    return {
      emoji: '⭐',
      type: 'count',
      frequency: 'daily',
      targetValue: 1,
      targetMode: 'frequency',
      keywords: [habitName],
      description: `每天完成 ${habitName}`,
    };
  }
  
  /**
   * 检查是否匹配任意关键词
   */
  private matchAny(text: string, keywords: string[]): boolean {
    return keywords.some((keyword) => text.includes(keyword));
  }
}

export const aiHabitSuggestionService = new AIHabitSuggestionService();


