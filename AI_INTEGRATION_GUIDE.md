# AI 助手完整系统集成说明

## 概述

已成功将完整的 AI 系统提示词（`AI_ASSISTANT_SYSTEM_PROMPT.md`）集成到 AI 助手中，并实现了性格设置的动态变化。

## 新增文件

### 1. `src/services/aiAssistantService.ts`
完整的 AI 助手服务，包含：
- 完整的系统提示词（基于语义理解）
- 意图识别（12种意图类型）
- 操作执行（任务、记账、碎碎念等）
- 性格系统集成

### 2. `src/services/aiIntegrationService.ts`
AI 集成服务，提供：
- 统一的用户输入处理接口
- 对话历史管理
- 用户行为监控
- 性格设置管理

### 3. `src/hooks/useAIAssistant.ts`
React Hook，简化组件中的 AI 使用：
- `sendMessage()` - 发送消息
- `changePersonality()` - 切换性格
- `customizePersonality()` - 自定义性格参数
- `clearHistory()` - 清空对话历史

### 4. `src/components/ai/AIAssistantChat.tsx`
示例聊天界面组件，展示如何使用新的 AI 系统

## 使用方法

### 方法1：使用 React Hook（推荐）

```tsx
import { useAIAssistant } from '@/hooks/useAIAssistant';

function MyComponent() {
  const {
    isProcessing,
    personality,
    chatHistory,
    sendMessage,
    changePersonality,
  } = useAIAssistant();
  
  const handleSend = async () => {
    const result = await sendMessage('5分钟后洗漱');
    if (result?.actions) {
      console.log('执行的操作:', result.actions);
    }
  };
  
  return (
    <div>
      <button onClick={() => changePersonality('strict')}>
        切换到严格模式
      </button>
      <button onClick={handleSend}>发送消息</button>
    </div>
  );
}
```

### 方法2：直接使用服务

```tsx
import { aiIntegrationService } from '@/services/aiIntegrationService';

// 发送消息
const result = await aiIntegrationService.handleUserInput('今天心情不错');

// 切换性格
aiIntegrationService.applyPersonalityPreset('humorous');

// 自定义性格
aiIntegrationService.updatePersonality({
  strictness: 0.8,
  humor: 0.6,
  emoji: 0.9,
});
```

## 性格类型

系统支持 6 种预设性格：

1. **gentle** - 温柔鼓励型
   - 温暖、体贴、总是正面鼓励
   - 适合需要情感支持的用户

2. **strict** - 严格督促型
   - 直接、严格、会批评但出于关心
   - 适合需要强力监督的用户

3. **humorous** - 幽默吐槽型
   - 幽默、调侃、轻松但不失关心
   - 适合喜欢轻松氛围的用户

4. **analytical** - 理性分析型
   - 客观、数据导向、提供分析
   - 适合注重效率和数据的用户

5. **bestie** - 闺蜜陪伴型
   - 亲密、八卦、像闺蜜一样聊天
   - 适合需要陪伴和倾诉的用户

6. **chill** - 佛系随和型
   - 随和、不评判、顺其自然
   - 适合不喜欢压力的用户

## 性格参数

每个性格都有 5 个可调参数（0-1）：

- **strictness** - 严格度
- **humor** - 幽默度
- **formality** - 正式度
- **emoji** - emoji使用频率
- **verbosity** - 话痨程度

## AI 意图识别

系统可以识别 12 种用户意图：

1. **task_create** - 创建任务
2. **task_delete** - 删除任务
3. **task_update** - 修改任务
4. **task_complete** - 完成任务
5. **finance_record** - 记账
6. **thought_record** - 碎碎念
7. **event_record** - 事件记录
8. **habit_checkin** - 习惯打卡
9. **query_stats** - 数据查询
10. **goal_manage** - 目标管理
11. **conversation** - 纯对话
12. **mixed** - 混合意图

## 语义理解示例

### 示例1：区分操作和表达

❌ 错误：
```
用户："今天不小心把代码都删了，好烦"
识别：task_delete（因为有"删"字）
```

✅ 正确：
```
用户："今天不小心把代码都删了，好烦"
识别：thought_record（碎碎念）
原因：过去时 + 情绪表达 + 对象是外部事物
```

### 示例2：创建任务

```
用户："5分钟后洗漱，然后洗衣服"
识别：task_create
操作：创建2个任务
- 洗漱（5分钟后开始，10分钟）
- 洗衣服（洗漱结束后开始，15分钟）
```

### 示例3：记账

```
用户："午餐花了50块"
识别：finance_record
操作：记录支出50元（餐饮）
```

## 集成到现有组件

### 更新 FloatingAIChat

在 `FloatingAIChat.tsx` 中添加：

```tsx
import { useAIAssistant } from '@/hooks/useAIAssistant';

// 在组件中使用
const { sendMessage, personality } = useAIAssistant();

// 替换原有的 AI 调用
const handleUserInput = async (input: string) => {
  const result = await sendMessage(input);
  // 处理结果...
};
```

## 性格设置界面

使用现有的 `AIPersonalitySettings` 组件，它会自动读取和更新性格设置。

## 用户行为监控

系统会自动监控：
- 今日任务完成率
- 连续完成天数
- 上次吃饭时间
- 上次睡觉时间

这些数据会影响 AI 的回复风格和监督力度。

## 测试建议

1. 测试不同性格类型的回复差异
2. 测试语义理解（如"删除"的不同含义）
3. 测试混合意图识别
4. 测试性格参数的动态变化
5. 测试用户行为监控的影响

## 注意事项

1. 确保 AI API 已配置（在设置中）
2. 性格设置会持久化到 localStorage
3. 对话历史默认保留最近 10 条
4. 系统提示词会根据性格动态生成

## 下一步优化

1. 添加更多意图类型
2. 优化语义理解算法
3. 添加上下文记忆
4. 实现多轮对话
5. 添加语音交互

