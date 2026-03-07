# 碎碎念功能集成指南

## 需要修改的文件

### 1. FloatingAIChat.tsx

在文件顶部添加导入：

```typescript
import { processMutter } from '@/services/mutterService';
```

### 2. 在 handleSend 函数中添加碎碎念处理逻辑

找到处理消息分析的部分（大约在 1500-1800 行），在检测到 `analysis.type` 为 `mood` 或 `thought` 时，添加以下逻辑：

```typescript
// 如果检测到记录类型，先显示标签分析并保存到store
if (analysis.type && !isTaskCreation) {
  // 🎯 新增：特殊处理碎碎念和心情记录
  if (analysis.type === 'mood' || analysis.type === 'thought') {
    try {
      addThinkingStep('💭 识别为碎碎念/心情记录...');
      
      // 使用碎碎念处理服务
      const mutterResult = await processMutter(message);
      
      addThinkingStep(`${mutterResult.moodEmoji} 心情: ${mutterResult.mood}`);
      addThinkingStep(`📂 分类: ${mutterResult.category}`);
      
      // 保存到记忆库
      addMemory({
        type: analysis.type,
        content: message,
        emotionTags: analysis.emotions,
        categoryTags: analysis.categories,
        rewards: analysis.rewards,
      });
      
      addThinkingStep('💾 已保存到记忆库');
      
      // 在时间轴创建醒目的碎碎念卡片
      const now = new Date();
      await createTask({
        title: mutterResult.cardTitle,
        description: mutterResult.cardDescription,
        taskType: 'life' as TaskType,
        priority: 2,
        durationMinutes: 1,
        scheduledStart: now,
        scheduledEnd: new Date(now.getTime() + 60000),
        tags: mutterResult.tags,
        color: mutterResult.cardColor,
        status: 'completed',
        isRecord: true,
      });
      
      addThinkingStep('📅 已在时间轴标记');
      
      // 显示AI的个性化回复
      const responseContent = `✅ **已记录你的碎碎念**\n\n${mutterResult.moodEmoji} **心情**: ${mutterResult.mood}\n📂 **分类**: ${mutterResult.category}\n🏷️ **标签**: ${mutterResult.tags.join('、')}\n\n---\n\n${mutterResult.aiReply}`;
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        thinkingProcess: [...thinkingSteps],
        isThinkingExpanded: false,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 保存到聊天记录
      addChatMessage({
        role: 'assistant',
        content: responseContent,
        actions: [{
          type: 'add_memory',
          description: '记录碎碎念',
          data: { mood: mutterResult.mood, category: mutterResult.category },
        }],
      });
      
      setIsProcessing(false);
      clearThinkingSteps();
      return;
    } catch (error) {
      console.error('处理碎碎念失败:', error);
      // 继续执行原有逻辑
    }
  }
  
  // 原有的处理逻辑（其他类型）
  // ...
}
```

## 效果说明

### 输入示例
```
我刚才去大姨妈了糟死了都啊啊啊啊
```

### AI处理流程
1. ✅ 识别为碎碎念
2. ✅ 分析心情：不舒服烦躁 😣
3. ✅ 智能打标签：#health #personal
4. ✅ 保存到记忆库
5. ✅ 在时间轴创建粉色/紫色卡片
6. ✅ AI像真人一样回复

### AI回复示例

**毒舌教练模式（毒舌度90）：**
```
✅ 已记录你的碎碎念

😣 心情: 不舒服烦躁
📂 分类: health
🏷️ 标签: 💭碎碎念、#health、#personal

---

大姨妈来了就好好休息，别硬撑。多喝热水，少折腾自己。
这种时候就别想着干活了，身体最重要。
```

**温柔体贴模式（毒舌度10）：**
```
✅ 已记录你的碎碎念

😣 心情: 不舒服烦躁
📂 分类: health
🏷️ 标签: 💭碎碎念、#health、#personal

---

亲爱的，大姨妈来了一定很不舒服吧💕
要好好照顾自己哦，多喝热水，多休息。
如果疼得厉害记得吃止痛药，别硬撑。
我会一直陪着你的，有什么需要随时告诉我~
```

## 时间轴卡片效果

卡片会显示为：

```
标题: 😣 不舒服烦躁
描述: 我刚才去大姨妈了糟死了都啊啊啊啊

😣 心情: 不舒服烦躁
📂 分类: health
🏷️ 标签: 💭碎碎念、#health、#personal

颜色: 薰衣草紫 (#DDA0DD)
状态: 已完成（记录类型）
```

## 测试用例

### 1. 吐槽抱怨
```
输入: "啊啊啊好烦今天什么都不顺"
心情: 😤 烦躁
颜色: 红色
AI回复: 根据性格给出安慰或调侃
```

### 2. 开心分享
```
输入: "今天天气好好啊心情超棒"
心情: 😊 开心
颜色: 金色
AI回复: 根据性格给出鼓励或表扬
```

### 3. 疲惫吐槽
```
输入: "累死了不想动了"
心情: 😴 疲惫
颜色: 浅灰
AI回复: 根据性格提醒休息
```

### 4. 焦虑不安
```
输入: "明天要考试好紧张啊"
心情: 😰 焦虑
颜色: 薰衣草紫
AI回复: 根据性格给出安慰或激励
```

## 注意事项

1. **AI回复降级**：如果AI服务不可用，会使用预设的降级回复
2. **颜色映射**：根据情绪标签自动选择合适的卡片颜色
3. **标签自动生成**：AI会智能识别并打上相关标签
4. **记忆保存**：所有碎碎念都会保存到记忆库，方便后续查看
5. **时间轴展示**：碎碎念会以醒目的卡片形式显示在时间轴上

## 后续优化

1. 支持图片碎碎念（拍照记录心情）
2. 支持语音碎碎念（语音转文字）
3. 碎碎念统计分析（心情趋势图）
4. 碎碎念回顾功能（"一年前的今天"）


