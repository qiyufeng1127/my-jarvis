# AI 助手集成 - 快速开始

## 已完成的工作

✅ 创建了完整的 AI 助手服务（`aiAssistantService.ts`）
✅ 创建了集成服务（`aiIntegrationService.ts`）
✅ 创建了 React Hook（`useAIAssistant.ts`）
✅ 创建了示例聊天组件（`AIAssistantChat.tsx`）
✅ 更新了性格 Store（`aiPersonalityStore.ts`）
✅ 创建了测试页面（`AIAssistantTestPage.tsx`）

## 如何使用

### 1. 在现有的 FloatingAIChat 中集成

打开 `src/components/ai/FloatingAIChat.tsx`，添加以下代码：

```tsx
import { useAIAssistant } from '@/hooks/useAIAssistant';

// 在组件内部
const { sendMessage, personality, chatHistory } = useAIAssistant();

// 替换原有的消息处理逻辑
const handleSendMessage = async (input: string) => {
  const result = await sendMessage(input);
  
  if (result?.success) {
    // 显示 AI 回复
    console.log('AI 回复:', result.response);
    
    // 如果有执行的操作
    if (result.actions) {
      result.actions.forEach(action => {
        console.log('执行操作:', action.description);
      });
    }
  }
};
```

### 2. 或者使用新的 AIAssistantChat 组件

在你的路由或页面中：

```tsx
import AIAssistantChat from '@/components/ai/AIAssistantChat';

function MyPage() {
  return (
    <div style={{ height: '600px' }}>
      <AIAssistantChat />
    </div>
  );
}
```

### 3. 访问测试页面

在路由中添加测试页面：

```tsx
import AIAssistantTestPage from '@/pages/AIAssistantTestPage';

// 在路由配置中
<Route path="/ai-test" element={<AIAssistantTestPage />} />
```

然后访问 `http://localhost:5173/ai-test`

## 性格设置如何生效

### 自动生效的部分

1. **系统提示词动态生成**
   - 每次调用 AI 时，会根据当前性格设置生成对应的系统提示词
   - 包含性格类型、参数、示例等

2. **回复风格自动调整**
   - AI 会根据性格参数调整回复的语气、用词、emoji 使用等
   - 例如：严格型会更直接，温柔型会更体贴

3. **监督力度动态变化**
   - 根据 strictness 参数，AI 的监督力度会变化
   - 高严格度：会严厉指出问题
   - 低严格度：更多理解和支持

### 测试性格变化

```tsx
import { aiIntegrationService } from '@/services/aiIntegrationService';

// 切换到严格模式
aiIntegrationService.applyPersonalityPreset('strict');

// 发送同样的消息，观察回复差异
await aiIntegrationService.handleUserInput('今天任务没完成');

// 切换到温柔模式
aiIntegrationService.applyPersonalityPreset('gentle');

// 再次发送，对比回复
await aiIntegrationService.handleUserInput('今天任务没完成');
```

## 核心特性

### 1. 语义理解（不是关键词匹配）

```
用户："今天不小心把代码都删了，好烦"
❌ 错误：识别为删除任务（因为有"删"字）
✅ 正确：识别为碎碎念（因为是过去时+情绪表达）
```

### 2. 多意图识别

系统可以识别 12 种意图：
- task_create, task_delete, task_update, task_complete
- finance_record, thought_record, event_record
- habit_checkin, query_stats, goal_manage
- conversation, mixed

### 3. 性格系统

6 种预设性格 + 5 个可调参数：
- gentle, strict, humorous, analytical, bestie, chill
- strictness, humor, formality, emoji, verbosity

### 4. 用户行为监控

自动监控并影响 AI 回复：
- 今日任务完成率
- 连续完成天数
- 上次吃饭/睡觉时间

## 调试技巧

### 1. 查看生成的系统提示词

```tsx
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';

const { getSystemPrompt } = useAIPersonalityStore.getState();
console.log(getSystemPrompt());
```

### 2. 查看对话历史

```tsx
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';

const { chatHistory } = useAIPersonalityStore.getState();
console.log(chatHistory);
```

### 3. 查看 AI 返回的原始 JSON

在 `aiAssistantService.ts` 的 `processUserInput` 方法中添加：

```tsx
console.log('AI 原始响应:', result);
```

## 常见问题

### Q: AI 没有按照性格回复？
A: 检查 AI API 配置，确保使用的模型支持系统提示词（如 GPT-3.5/4, Claude 等）

### Q: 性格切换后没有立即生效？
A: 性格设置会在下一次发送消息时生效，因为系统提示词是在每次调用时动态生成的

### Q: 如何添加自定义性格？
A: 在 `aiPersonalityStore.ts` 的 `PERSONALITY_PRESETS` 中添加新的预设

### Q: 如何调整性格参数？
A: 使用 `customizePersonality` 方法：
```tsx
customizePersonality({
  strictness: 0.8,
  humor: 0.3,
  emoji: 0.9,
});
```

## 下一步

1. 在 FloatingAIChat 中集成新的 AI 系统
2. 测试不同性格的回复差异
3. 测试语义理解的准确性
4. 根据需要调整系统提示词
5. 添加更多意图类型和操作

## 技术支持

如有问题，请查看：
- `AI_INTEGRATION_GUIDE.md` - 详细集成指南
- `AI_ASSISTANT_SYSTEM_PROMPT.md` - 完整系统提示词
- 代码注释 - 每个文件都有详细注释

