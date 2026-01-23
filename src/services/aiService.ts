import { useAIStore } from '@/stores/aiStore';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// AI服务类
class AIService {
  // 调用AI API
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const { config, isConfigured } = useAIStore.getState();

    if (!isConfigured()) {
      return {
        success: false,
        error: '请先在设置中配置 API Key',
      };
    }

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || '调用AI服务失败',
        };
      }

      const data = await response.json();
      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
      };
    } catch (error) {
      console.error('AI调用错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 智能分析消息类型和标签
  async analyzeMessage(message: string): Promise<{
    type?: 'mood' | 'thought' | 'todo' | 'success' | 'gratitude';
    emotionTags: string[];
    categoryTags: string[];
    confidence: number;
  }> {
    const systemPrompt = `你是一个智能助手，负责分析用户输入的内容。

请分析以下内容，返回JSON格式：
{
  "type": "类型（mood/thought/todo/success/gratitude之一，如果不确定则不返回）",
  "emotionTags": ["情绪标签数组"],
  "categoryTags": ["分类标签数组"],
  "confidence": 0.0-1.0的置信度
}

可用的情绪标签：
- happy（开心）
- excited（兴奋）
- calm（平静）
- grateful（感恩）
- proud（自豪）
- anxious（焦虑）
- sad（难过）
- angry（生气）
- frustrated（沮丧）
- tired（疲惫）

可用的分类标签：
- work（工作）
- study（学习）
- life（生活）
- housework（家务）
- health（健康）
- social（社交）
- hobby（爱好）
- startup（创业）
- finance（财务）
- family（家庭）

类型说明：
- mood: 表达心情、感受、情绪的内容
- thought: 想法、灵感、碎碎念
- todo: 待办事项、计划、安排
- success: 成功、完成、达成的事情
- gratitude: 感恩、感谢的内容

只返回JSON，不要其他内容。`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    if (!response.success || !response.content) {
      // 如果AI调用失败，返回默认值
      return {
        emotionTags: [],
        categoryTags: [],
        confidence: 0,
      };
    }

    try {
      const result = JSON.parse(response.content);
      return {
        type: result.type,
        emotionTags: result.emotionTags || [],
        categoryTags: result.categoryTags || [],
        confidence: result.confidence || 0,
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return {
        emotionTags: [],
        categoryTags: [],
        confidence: 0,
      };
    }
  }

  // 智能对话
  async chatWithUser(userMessage: string, conversationHistory: AIMessage[] = []): Promise<AIResponse> {
    const systemPrompt = `你是一个温暖、专业的AI助手，帮助用户管理任务、记录心情、实现目标。

你的特点：
1. 温暖友好，像朋友一样交流
2. 专业高效，能准确理解用户需求
3. 积极正面，给予鼓励和支持
4. 简洁明了，不啰嗦

你可以帮助用户：
- 记录心情和想法
- 创建和管理任务
- 分析情绪和行为模式
- 提供个性化建议
- 关联任务到长期目标

请用简洁、温暖的语气回复用户。`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return await this.chat(messages);
  }

  // 智能任务分解
  async decomposeTask(taskDescription: string): Promise<{
    success: boolean;
    tasks?: Array<{
      title: string;
      duration: number;
      startTime?: string;
      category: string;
      priority: 'low' | 'medium' | 'high';
      location?: string;
    }>;
    error?: string;
  }> {
    const systemPrompt = `你是一个任务分解专家。用户会描述一个任务或计划，你需要将其分解为**多个独立的**子任务。

**重要规则：**
1. **必须识别每个独立的动作**，例如：
   - "洗漱" 是一个任务
   - "洗衣服" 是另一个任务
   - "吃饭" 是另一个任务
   - "收拾垃圾" 是另一个任务
   - **绝对不要把多个动作合并成一个任务！**

2. **识别连接词**：
   - "然后"、"接着"、"再"、"之后" 表示不同的任务
   - "，"、"、" 分隔的也是不同任务

3. **每个任务要简洁明确**：
   - ✅ 好的："洗漱"、"洗衣服"、"吃饭"
   - ❌ 不好的："洗漱把衣服洗了然后吃饭"

返回JSON格式：
{
  "tasks": [
    {
      "title": "任务标题（简短、具体）",
      "duration": 分钟数,
      "startTime": "HH:MM格式的开始时间（可选）",
      "category": "work/study/life/health等",
      "priority": "low/medium/high",
      "location": "bathroom/workspace/kitchen/livingroom/bedroom/studio（可选）"
    }
  ]
}

**时长参考：**
- 洗漱：5-10分钟
- 洗衣服：10-15分钟
- 洗碗、倒猫粮：5分钟
- 吃饭（在家）：30分钟
- 吃饭（外出）：120分钟
- 工作：60分钟起步
- 收拾房间：10-15分钟

**位置参考：**
- bathroom: 厕所（洗漱、洗衣服）
- kitchen: 厨房（吃饭、洗碗、倒猫粮）
- livingroom: 客厅（收拾）
- bedroom: 卧室（睡觉、收拾）
- workspace: 工作区（工作、学习）
- studio: 拍摄间（拍摄、录制）

**示例：**
输入："1小时后去洗漱把衣服洗了然后吃完饭之后去把垃圾收拾好了"
输出：
{
  "tasks": [
    {"title": "洗漱", "duration": 10, "category": "life", "priority": "medium", "location": "bathroom"},
    {"title": "洗衣服", "duration": 15, "category": "life", "priority": "medium", "location": "bathroom"},
    {"title": "吃饭", "duration": 30, "category": "life", "priority": "medium", "location": "kitchen"},
    {"title": "收拾垃圾", "duration": 10, "category": "life", "priority": "low", "location": "livingroom"}
  ]
}

**只返回JSON，不要其他内容。一定要把每个独立的动作分解成单独的任务！**`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: taskDescription },
    ]);

    if (!response.success || !response.content) {
      return {
        success: false,
        error: response.error || '任务分解失败',
      };
    }

    try {
      // 尝试提取JSON（有时AI会返回带解释的内容）
      let jsonContent = response.content.trim();
      
      // 如果内容包含```json，提取其中的JSON
      const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      } else {
        // 尝试提取{}之间的内容
        const braceMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          jsonContent = braceMatch[0];
        }
      }
      
      const result = JSON.parse(jsonContent);
      return {
        success: true,
        tasks: result.tasks || [],
      };
    } catch (error) {
      console.error('解析任务分解结果失败:', error);
      console.error('AI返回内容:', response.content);
      return {
        success: false,
        error: '解析结果失败',
      };
    }
  }

  // 生成成长故事
  async generateGrowthStory(data: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    stats: {
      tasksCompleted: number;
      totalTasks: number;
      focusTime: number;
      goldEarned: number;
      growthPoints: number;
      habits: Array<{ name: string; count: number }>;
    };
  }): Promise<AIResponse> {
    const periodNames = {
      daily: '今日',
      weekly: '本周',
      monthly: '本月',
      yearly: '今年',
    };

    const systemPrompt = `你是一个成长故事作家，擅长用温暖、鼓励的语言讲述用户的成长历程。

根据用户的数据，写一段${periodNames[data.period]}成长故事。

要求：
1. 语言温暖、真诚，像朋友一样
2. 突出亮点和进步
3. 对不足给予理解和鼓励
4. 展望未来，给予信心
5. 200-300字左右
6. 分2-3段，每段之间空一行

数据：
- 完成任务：${data.stats.tasksCompleted}/${data.stats.totalTasks}
- 专注时长：${Math.floor(data.stats.focusTime / 60)}小时${data.stats.focusTime % 60}分钟
- 获得金币：${data.stats.goldEarned}
- 成长值：${data.stats.growthPoints}
- 坏习惯：${data.stats.habits.map(h => `${h.name}(${h.count}次)`).join('、')}

请直接返回故事内容，不要标题。`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请生成成长故事' },
    ]);
  }

  // 智能建议
  async getSuggestions(context: {
    recentTasks: string[];
    recentMoods: string[];
    goals: string[];
  }): Promise<AIResponse> {
    const systemPrompt = `你是一个个人成长顾问，根据用户的任务、心情和目标，提供个性化建议。

用户信息：
- 最近任务：${context.recentTasks.join('、')}
- 最近心情：${context.recentMoods.join('、')}
- 长期目标：${context.goals.join('、')}

请提供3-5条简洁的建议，每条建议一行，以"• "开头。

建议要：
1. 具体可行
2. 针对性强
3. 积极正面
4. 简洁明了`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请给我一些建议' },
    ]);
  }
}

export const aiService = new AIService();

