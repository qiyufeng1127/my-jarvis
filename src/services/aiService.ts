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

  // 智能识别内容类型并决定分配目标
  async classifyContent(message: string): Promise<{
    contentType: 'task' | 'mood' | 'thought' | 'gratitude' | 'success' | 'startup' | 'timeline_control';
    targetComponent: 'timeline' | 'memory' | 'journal' | 'sidehustle' | 'none';
    emotionTags: string[];
    categoryTags: string[];
    confidence: number;
    reason: string;
  }> {
    const systemPrompt = `你是一个智能内容分类助手，负责分析用户输入并决定应该分配到哪个组件。

请分析以下内容，返回JSON格式：
{
  "contentType": "内容类型",
  "targetComponent": "目标组件",
  "emotionTags": ["情绪标签数组"],
  "categoryTags": ["分类标签数组"],
  "confidence": 0.0-1.0的置信度,
  "reason": "分类理由（简短说明）"
}

**内容类型（contentType）：**
- task: 待办任务、计划、安排（例如："明天要开会"、"学习英语1小时"、"去健身房"）
- mood: 心情记录（例如："今天很开心"、"感觉有点累"、"心情不错"）
- thought: 碎碎念、想法、灵感（例如："突然想到一个点子"、"今天的天气真好"）
- gratitude: 感恩内容（例如："感谢朋友的帮助"、"很庆幸遇到你"）
- success: 成功日记（例如："今天完成了项目"、"成功减肥5斤"）
- startup: 创业想法、商业计划（例如："想做一个APP"、"新的商业模式"、"产品创意"）
- timeline_control: 时间轴控制指令（例如："删除今天的任务"、"修改任务时间"、"查看明天的安排"）

**目标组件（targetComponent）：**
- timeline: 时间轴（用于 task 和 timeline_control）
- memory: 全景记忆栏（用于 mood、thought）
- journal: 成功&感恩日记（用于 gratitude、success）
- sidehustle: 副业追踪（用于 startup）
- none: 不分配（无法识别或不适合任何组件）

**情绪标签（emotionTags）：**
happy, excited, calm, grateful, proud, anxious, sad, angry, frustrated, tired

**分类标签（categoryTags）：**
work, study, life, housework, health, social, hobby, startup, finance, family

**分类规则：**
1. 如果包含明确的时间、地点、动作 → task → timeline
2. 如果表达心情、感受 → mood → memory
3. 如果是随意的想法、碎碎念 → thought → memory
4. 如果表达感恩、感谢 → gratitude → journal
5. 如果记录成功、成就 → success → journal
6. 如果是创业想法、商业计划、产品创意 → startup → sidehustle
7. 如果是控制时间轴的指令 → timeline_control → timeline

**示例：**
输入："明天下午2点开会"
输出：{"contentType": "task", "targetComponent": "timeline", "emotionTags": [], "categoryTags": ["work"], "confidence": 0.95, "reason": "明确的任务安排"}

输入："今天心情不错，阳光很好"
输出：{"contentType": "mood", "targetComponent": "memory", "emotionTags": ["happy", "calm"], "categoryTags": ["life"], "confidence": 0.9, "reason": "表达心情感受"}

输入："突然想到可以做一个帮助用户管理时间的APP"
输出：{"contentType": "startup", "targetComponent": "sidehustle", "emotionTags": [], "categoryTags": ["startup"], "confidence": 0.92, "reason": "创业产品想法"}

输入："感谢朋友今天的帮助"
输出：{"contentType": "gratitude", "targetComponent": "journal", "emotionTags": ["grateful"], "categoryTags": ["social"], "confidence": 0.95, "reason": "表达感恩"}

输入："今天成功完成了项目，很有成就感"
输出：{"contentType": "success", "targetComponent": "journal", "emotionTags": ["proud", "happy"], "categoryTags": ["work"], "confidence": 0.93, "reason": "记录成功成就"}

**只返回JSON，不要其他内容。**`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    if (!response.success || !response.content) {
      // 如果AI调用失败，返回默认值
      return {
        contentType: 'thought',
        targetComponent: 'memory',
        emotionTags: [],
        categoryTags: [],
        confidence: 0,
        reason: 'AI分析失败，默认分类为碎碎念',
      };
    }

    try {
      let jsonContent = response.content.trim();
      
      // 提取JSON
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
        }
      }
      
      const result = JSON.parse(jsonContent);
      return {
        contentType: result.contentType || 'thought',
        targetComponent: result.targetComponent || 'memory',
        emotionTags: result.emotionTags || [],
        categoryTags: result.categoryTags || [],
        confidence: result.confidence || 0,
        reason: result.reason || '',
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return {
        contentType: 'thought',
        targetComponent: 'memory',
        emotionTags: [],
        categoryTags: [],
        confidence: 0,
        reason: '解析失败，默认分类为碎碎念',
      };
    }
  }

  // 智能分析消息类型和标签（保留旧方法以兼容）
  async analyzeMessage(message: string): Promise<{
    type?: 'mood' | 'thought' | 'todo' | 'success' | 'gratitude';
    emotionTags: string[];
    categoryTags: string[];
    confidence: number;
  }> {
    // 使用新的 classifyContent 方法
    const result = await this.classifyContent(message);
    
    // 转换为旧格式
    let type: 'mood' | 'thought' | 'todo' | 'success' | 'gratitude' | undefined;
    if (result.contentType === 'task') type = 'todo';
    else if (result.contentType === 'mood') type = 'mood';
    else if (result.contentType === 'thought') type = 'thought';
    else if (result.contentType === 'success') type = 'success';
    else if (result.contentType === 'gratitude') type = 'gratitude';
    
    return {
      type,
      emotionTags: result.emotionTags,
      categoryTags: result.categoryTags,
      confidence: result.confidence,
    };
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
  async decomposeTask(taskDescription: string, currentTime?: Date): Promise<{
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
    const now = currentTime || new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const systemPrompt = `你是一个任务分解专家。用户会描述一个任务或计划，你需要将其分解为**多个独立的**子任务。

**当前时间：${currentTimeStr}**

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

4. **时间计算规则（非常重要）**：
   - 如果用户说"5分钟之后"、"1小时后"等，**必须从当前时间开始计算**
   - 例如：当前时间13:21，用户说"5分钟之后吃药"，则吃药任务的startTime应该是"13:26"
   - 如果用户说"然后洗漱"，则洗漱任务应该在吃药任务之后，startTime应该是"13:28"（假设吃药2分钟）
   - **第一个任务的开始时间 = 当前时间 + 用户指定的延迟时间**
   - **后续任务的开始时间 = 前一个任务的结束时间**

5. **任务排序规则（非常重要）**：
   - **必须按照位置（location）分组排序**
   - **先执行同一位置的所有任务，再切换到下一个位置**
   - 排序优先级：workspace（工作区）> bathroom（厕所）> kitchen（厨房）> livingroom（客厅）> bedroom（卧室）
   - 例如：如果有"吃药（workspace）"和"洗漱（bathroom）"，应该先执行"吃药"，再执行"洗漱"

返回JSON格式：
{
  "tasks": [
    {
      "title": "任务标题（简短、具体）",
      "duration": 分钟数,
      "startTime": "HH:MM格式的开始时间（必须提供）",
      "category": "work/study/life/health等",
      "priority": "low/medium/high",
      "location": "厕所/工作区/厨房/客厅/卧室/拍摄间（必须用中文）"
    }
  ]
}

**时长参考：**
- 吃药：2分钟
- 洗漱：5-10分钟
- 洗衣服、拿衣服：10-15分钟
- 洗碗、倒猫粮：5分钟
- 吃饭（在家）：30分钟
- 吃饭（外出）：120分钟
- 工作：60分钟起步
- 收拾房间：10-15分钟

**位置参考（必须用中文）：**
- 厕所：洗漱、洗衣服、拿衣服
- 厨房：吃饭、洗碗、倒猫粮
- 客厅：收拾垃圾
- 卧室：睡觉、收拾
- 工作区：工作、学习、吃药
- 拍摄间：拍摄、录制

**示例1：**
输入："5分钟之后吃艾司唑仑，然后去洗漱，把衣服洗了"
当前时间：13:21
输出：
{
  "tasks": [
    {"title": "吃艾司唑仑", "duration": 2, "startTime": "13:26", "category": "life", "priority": "high", "location": "工作区"},
    {"title": "洗漱", "duration": 10, "startTime": "13:28", "category": "life", "priority": "medium", "location": "厕所"},
    {"title": "洗衣服", "duration": 15, "startTime": "13:38", "category": "life", "priority": "medium", "location": "厕所"}
  ]
}

**示例2：**
输入："1小时后去洗漱把衣服洗了然后吃完饭之后去把垃圾收拾好了"
当前时间：13:21
输出：
{
  "tasks": [
    {"title": "洗漱", "duration": 10, "startTime": "14:21", "category": "life", "priority": "medium", "location": "厕所"},
    {"title": "洗衣服", "duration": 15, "startTime": "14:31", "category": "life", "priority": "medium", "location": "厕所"},
    {"title": "吃饭", "duration": 30, "startTime": "14:46", "category": "life", "priority": "medium", "location": "厨房"},
    {"title": "收拾垃圾", "duration": 10, "startTime": "15:16", "category": "life", "priority": "low", "location": "客厅"}
  ]
}

**只返回JSON，不要其他内容。一定要：**
1. 把每个独立的动作分解成单独的任务
2. 正确计算每个任务的开始时间
3. 按位置分组排序任务
4. 使用中文位置名称`;

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
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        // 尝试提取{}之间的内容
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
        }
      }
      
      const result = JSON.parse(jsonContent);
      
      // 验证返回的任务数组
      if (!result.tasks || !Array.isArray(result.tasks)) {
        console.error('AI返回的数据格式不正确:', result);
        return {
          success: false,
          error: 'AI返回的数据格式不正确',
        };
      }
      
      // 验证每个任务是否有必要的字段
      let validTasks = result.tasks.filter((task: any) => 
        task.title && typeof task.duration === 'number'
      );
      
      if (validTasks.length === 0) {
        console.error('没有有效的任务');
        return {
          success: false,
          error: '没有有效的任务',
        };
      }
      
      // 位置优先级映射
      const locationPriority: Record<string, number> = {
        '工作区': 1,
        'workspace': 1,
        '厕所': 2,
        'bathroom': 2,
        '厨房': 3,
        'kitchen': 3,
        '客厅': 4,
        'livingroom': 4,
        '卧室': 5,
        'bedroom': 5,
        '拍摄间': 6,
        'studio': 6,
      };
      
      // 按位置排序任务
      validTasks.sort((a: any, b: any) => {
        const priorityA = locationPriority[a.location || ''] || 999;
        const priorityB = locationPriority[b.location || ''] || 999;
        return priorityA - priorityB;
      });
      
      // 重新计算所有任务的开始时间（确保时间连续）
      let currentTime = now;
      validTasks = validTasks.map((task: any, index: number) => {
        let startTime: string;
        
        if (index === 0 && task.startTime) {
          // 第一个任务使用AI返回的时间
          startTime = task.startTime;
          const [hours, minutes] = startTime.split(':').map(Number);
          currentTime = new Date(now);
          currentTime.setHours(hours, minutes, 0, 0);
        } else {
          // 后续任务基于前一个任务的结束时间
          startTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 更新当前时间为下一个任务的开始时间
        currentTime = new Date(currentTime.getTime() + task.duration * 60000);
        
        return {
          ...task,
          startTime,
        };
      });
      
      return {
        success: true,
        tasks: validTasks,
      };
    } catch (error) {
      console.error('解析任务分解结果失败:', error);
      console.error('AI返回内容:', response.content);
      return {
        success: false,
        error: `解析结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
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

  // 任务验证 - 图片验证
  async verifyTaskImage(imageBase64: string, requirement: string, taskTitle: string): Promise<{
    success: boolean;
    isValid: boolean;
    confidence: number;
    reason?: string;
    error?: string;
  }> {
    const systemPrompt = `你是一个任务验证专家，负责通过图片验证用户是否真实执行了任务。

**任务信息：**
- 任务标题：${taskTitle}
- 验证要求：${requirement}

**你的职责：**
1. 仔细分析图片内容
2. 判断图片是否符合验证要求
3. 给出验证结果和置信度
4. 如果不通过，说明原因

**验证标准：**
- 图片内容必须与任务相关
- 图片必须清晰可辨认
- 图片不能是网络图片或截图（除非任务要求）
- 图片必须符合验证要求的描述

**返回JSON格式：**
{
  "isValid": true/false,
  "confidence": 0.0-1.0的置信度,
  "reason": "验证结果说明（简短，50字以内）"
}

**示例：**
任务：去健身房锻炼
要求：拍摄健身房内的照片
- ✅ 通过：照片显示健身器材、健身房环境
- ❌ 不通过：照片是家里、户外、或与健身无关的场景

任务：完成作业
要求：上传作业完成截图
- ✅ 通过：截图显示作业内容、完成状态
- ❌ 不通过：截图模糊、内容不相关、或明显是网络图片

**只返回JSON，不要其他内容。**`;

    try {
      // 注意：这里需要使用支持视觉的模型（如 GPT-4 Vision）
      // 如果当前模型不支持图片，可以先用文字描述代替
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `请验证这张图片是否符合任务要求。\n\n图片数据：${imageBase64.substring(0, 100)}...\n\n注意：由于当前模型限制，如果无法直接分析图片，请返回一个基于任务描述的合理判断。` 
        },
      ]);

      if (!response.success || !response.content) {
        return {
          success: false,
          isValid: false,
          confidence: 0,
          error: response.error || '验证失败',
        };
      }

      // 解析AI返回的JSON
      let jsonContent = response.content.trim();
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
        }
      }

      const result = JSON.parse(jsonContent);

      return {
        success: true,
        isValid: result.isValid || false,
        confidence: result.confidence || 0,
        reason: result.reason || '',
      };
    } catch (error) {
      console.error('AI验证图片失败:', error);
      return {
        success: false,
        isValid: false,
        confidence: 0,
        error: error instanceof Error ? error.message : '验证失败',
      };
    }
  }

  // 任务验证 - 文件验证
  async verifyTaskFile(fileName: string, fileSize: number, fileType: string, requirement: string, taskTitle: string): Promise<{
    success: boolean;
    isValid: boolean;
    confidence: number;
    reason?: string;
    error?: string;
  }> {
    const systemPrompt = `你是一个任务验证专家，负责通过文件信息验证用户是否真实执行了任务。

**任务信息：**
- 任务标题：${taskTitle}
- 验证要求：${requirement}

**文件信息：**
- 文件名：${fileName}
- 文件大小：${(fileSize / 1024 / 1024).toFixed(2)} MB
- 文件类型：${fileType}

**你的职责：**
1. 分析文件名是否与任务相关
2. 判断文件类型是否符合要求
3. 评估文件大小是否合理
4. 给出验证结果和置信度

**验证标准：**
- 文件名应该与任务内容相关
- 文件类型必须符合验证要求
- 文件大小应该合理（不能太小，说明可能是空文件）
- 文件不能是明显的测试文件（如 test.txt, 111.docx 等）

**返回JSON格式：**
{
  "isValid": true/false,
  "confidence": 0.0-1.0的置信度,
  "reason": "验证结果说明（简短，50字以内）"
}

**示例：**
任务：完成项目报告
要求：上传报告文档
- ✅ 通过：项目报告.docx (2.5MB, Word文档)
- ❌ 不通过：test.txt (1KB, 文本文件) - 文件太小且名称不相关

任务：制作视频
要求：上传视频文件
- ✅ 通过：产品介绍视频.mp4 (50MB, 视频文件)
- ❌ 不通过：111.mp4 (100KB, 视频文件) - 文件太小，可能不是真实视频

**只返回JSON，不要其他内容。**`;

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请验证这个文件是否符合任务要求。' },
      ]);

      if (!response.success || !response.content) {
        return {
          success: false,
          isValid: false,
          confidence: 0,
          error: response.error || '验证失败',
        };
      }

      // 解析AI返回的JSON
      let jsonContent = response.content.trim();
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
        }
      }

      const result = JSON.parse(jsonContent);

      return {
        success: true,
        isValid: result.isValid || false,
        confidence: result.confidence || 0,
        reason: result.reason || '',
      };
    } catch (error) {
      console.error('AI验证文件失败:', error);
      return {
        success: false,
        isValid: false,
        confidence: 0,
        error: error instanceof Error ? error.message : '验证失败',
      };
    }
  }
}

export const aiService = new AIService();

