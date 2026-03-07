# AI 助手调试指南

## 问题：AI 只回复不执行操作

### 可能的原因

1. **AI 没有返回正确的 JSON 格式**
2. **AI 识别意图为 conversation（纯对话）而不是 thought_record**
3. **JSON 解析失败**
4. **操作执行失败但没有报错**

## 调试步骤

### 步骤1：打开浏览器控制台

1. 按 F12 打开开发者工具
2. 切换到 Console 标签
3. 清空之前的日志

### 步骤2：发送测试消息

在 AI 助手中输入：
```
今天不小心把代码都删了，好烦
```

### 步骤3：查看控制台日志

你应该看到以下日志：

```
🎯 [AI助手] 用户输入: 今天不小心把代码都删了，好烦
📝 [AI助手] 系统提示词长度: XXXX
🤖 [AI助手] 调用 AI...
✅ [AI助手] AI 返回内容: {...}
🔍 [AI助手] 开始解析 AI 响应...
📦 [AI助手] 从代码块中提取 JSON (或从文本中提取 JSON)
📄 [AI助手] 提取的 JSON: {...}
✅ [AI助手] JSON 解析成功: { intent: "thought_record", ... }
📊 [AI助手] 解析结果: { intent: "thought_record", action: "record_thought", ... }

🎯 [AI集成] 识别意图: thought_record
🎯 [AI集成] 执行操作: record_thought
🎯 [AI集成] 参数: { content: "...", emotionTags: [...] }
✅ [AI集成] 操作执行成功: 已记录你的想法
```

### 步骤4：根据日志判断问题

#### 情况1：AI 返回的不是 JSON

**日志显示**：
```
✅ [AI助手] AI 返回内容: 哎呀，听起来今天遇到了点小麻烦...（纯文本）
❌ [AI助手] 解析 AI 响应失败: ...
```

**原因**：AI 模型没有按照要求返回 JSON 格式

**解决方法**：
1. 检查 AI API 配置（模型是否支持系统提示词）
2. 尝试更换模型（推荐 GPT-4, Claude 3.5）
3. 在系统提示词中强调 JSON 格式

#### 情况2：AI 识别为 conversation 而不是 thought_record

**日志显示**：
```
✅ [AI助手] JSON 解析成功: { intent: "conversation", action: "chat", ... }
```

**原因**：AI 没有正确理解语义

**解决方法**：
1. 在系统提示词中添加更多示例
2. 强调"今天心情不错"这类输入应该记录为 thought_record
3. 调整提示词，明确区分 conversation 和 thought_record

#### 情况3：JSON 解析成功但没有执行操作

**日志显示**：
```
✅ [AI助手] JSON 解析成功: { intent: "thought_record", ... }
📊 [AI助手] 解析结果: { intent: "thought_record", ... }
（但没有后续的 "🎯 [AI集成] 识别意图" 日志）
```

**原因**：aiIntegrationService 没有正确调用 executeAction

**解决方法**：
1. 检查 aiIntegrationService.ts 中的 handleUserInput 方法
2. 确认 result.intent 和 result.action 有值
3. 检查是否有异常被捕获

#### 情况4：操作执行失败

**日志显示**：
```
🎯 [AI集成] 识别意图: thought_record
🎯 [AI集成] 执行操作: record_thought
❌ [AI集成] 操作执行失败: ...
```

**原因**：recordThought 方法执行失败

**解决方法**：
1. 检查 memoryStore 是否正常工作
2. 检查参数格式是否正确
3. 查看详细的错误信息

## 快速测试代码

在浏览器控制台中运行：

```javascript
// 测试 memoryStore
import { useMemoryStore } from '@/stores/memoryStore';
const memoryStore = useMemoryStore.getState();

// 手动添加一条记录
memoryStore.addMemory({
  type: 'thought',
  content: '测试碎碎念',
  emotionTags: ['happy'],
  categoryTags: ['life'],
  rewards: { gold: 5, growth: 2 }
});

// 查看是否添加成功
console.log('记录数量:', memoryStore.memories.length);
console.log('最新记录:', memoryStore.memories[0]);
```

## 临时解决方案

如果 AI 一直不返回正确的 JSON，可以临时修改代码，强制识别某些关键词：

在 `aiAssistantService.ts` 的 `processUserInput` 方法中添加：

```typescript
// 临时：强制识别碎碎念
if (userInput.includes('好烦') || userInput.includes('心情') || userInput.includes('累')) {
  return {
    success: true,
    intent: 'thought_record',
    action: 'record_thought',
    parameters: {
      content: userInput,
      mood: 'frustrated',
      emotionTags: ['frustrated'],
      categoryTags: ['life']
    },
    response: '已经帮你记录下来了~'
  };
}
```

## 检查 AI 配置

确保你的 AI API 配置正确：

1. 打开设置页面
2. 检查 API Key 是否正确
3. 检查 API Endpoint 是否正确
4. 检查模型名称（推荐使用 gpt-4 或 claude-3-5-sonnet）
5. 尝试发送一条简单的消息测试连接

## 推荐的 AI 模型

支持系统提示词和 JSON 输出的模型：

1. **OpenAI**
   - gpt-4-turbo-preview ✅ 推荐
   - gpt-4 ✅ 推荐
   - gpt-3.5-turbo ⚠️ 可能不稳定

2. **Anthropic**
   - claude-3-5-sonnet-20241022 ✅ 推荐
   - claude-3-opus-20240229 ✅ 推荐
   - claude-3-sonnet-20240229 ✅

3. **其他**
   - 本地模型可能不支持复杂的系统提示词

## 下一步

1. 按照上述步骤查看控制台日志
2. 找出具体是哪一步出了问题
3. 根据情况采取对应的解决方法
4. 如果还是不行，把控制台日志截图发给我

