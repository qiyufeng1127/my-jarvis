# AI 提示词统一管理 - 使用说明

## 📁 文件结构

```
src/services/
├── aiPrompts.ts          # ✅ 所有提示词配置（在这里修改提示词）
├── aiUnifiedService.ts   # ✅ 统一调用服务（推荐使用）
├── aiSmartService.ts     # ⚠️ 旧服务（保留兼容，内部仍使用分散的提示词）
├── aiService.ts          # ⚠️ 旧服务（保留兼容）
└── moneyAIService.ts     # ⚠️ 旧服务（保留兼容）
```

---

## 🎯 核心理念

**所有 AI 提示词都集中在 `aiPrompts.ts` 文件中，方便统一修改和维护。**

## ⚠️ 当前状态说明

### 已完成 ✅
1. ✅ 创建了 `aiPrompts.ts` - 集中管理所有提示词
2. ✅ 创建了 `aiUnifiedService.ts` - 提供统一的调用接口
3. ✅ 修改了 `TaskInbox.tsx` - 使用新的统一服务

### 保留的旧文件 ⚠️
为了确保网站稳定运行，以下文件暂时保留：
- `aiSmartService.ts` - 被 `AISmartInput.tsx` 使用
- `aiService.ts` - 被一些组件使用
- `moneyAIService.ts` - 被副业追踪功能使用

**这些文件内部的提示词仍然是分散的，但功能正常。**

### 如何修改提示词？

#### 方案 1：修改新的统一文件（推荐）
如果您的组件使用了新的 `aiUnified` 服务，直接修改 `aiPrompts.ts` 即可。

#### 方案 2：修改旧文件中的提示词
如果组件还在使用旧服务（如 `AISmartProcessor`），需要：
1. 打开对应的旧服务文件（如 `aiSmartService.ts`）
2. 找到提示词字符串（搜索 "你是一个"）
3. 直接修改提示词内容

### 未来计划 🚀
逐步将所有组件迁移到新的统一服务，最终删除旧文件。

---

## 📝 如何修改提示词

### 1. 打开 `src/services/aiPrompts.ts`

### 2. 找到你要修改的提示词

例如，修改"任务分析助手"的提示词：

```typescript
TASK_ANALYZER: {
  description: '分析单个任务，返回标签、位置、时长、类型等信息',
  system: '你是一个任务分析助手...',  // ← 修改这里
  userTemplate: `你是一个任务分析助手...`,  // ← 修改这里
  temperature: 0.7,  // ← 调整温度参数
  maxTokens: 500,    // ← 调整最大 token 数
}
```

### 3. 保存文件，刷新页面即可生效

---

## 🔧 如何使用统一服务

### 旧的调用方式（分散在各个文件）

```typescript
// ❌ 旧方式：提示词写在代码里
const response = await fetch(apiEndpoint, {
  method: 'POST',
  body: JSON.stringify({
    messages: [
      { role: 'system', content: '你是一个任务分析助手...' },
      { role: 'user', content: `分析任务：${taskTitle}` }
    ]
  })
});
```

### 新的调用方式（统一管理）

```typescript
// ✅ 新方式：使用统一服务
import { aiUnified } from '@/services/aiUnifiedService';

const result = await aiUnified.analyzeTask(taskTitle, duration);

if (result.success) {
  console.log('分析结果:', result.data);
} else {
  console.error('错误:', result.error);
}
```

---

## 📚 所有可用的 AI 方法

### 1. 任务分析

```typescript
const result = await aiUnified.analyzeTask(
  '去煮稀饭',  // 任务标题
  30           // 时长（可选）
);

// 返回：
// {
//   success: true,
//   data: {
//     tags: ['饮食', '做饭'],
//     location: '厨房',
//     duration: 30,
//     taskType: 'life',
//     category: '生活事务'
//   }
// }
```

### 2. 任务分解

```typescript
const result = await aiUnified.decomposeTask(
  '5分钟后去煮稀饭吃午饭 刷牙洗脸'
);

// 返回：
// {
//   success: true,
//   data: {
//     tasks: [
//       { title: '去煮稀饭', duration: 30, startTime: '13:26', ... },
//       { title: '吃午饭', duration: 30, startTime: '13:56', ... },
//       { title: '刷牙洗脸', duration: 10, startTime: '14:26', ... }
//     ]
//   }
// }
```

### 3. 时间轴操作

```typescript
const result = await aiUnified.parseTimelineOperation(
  '删除今天下午3点以后的任务',
  existingTasks  // 现有任务列表
);

// 返回：
// {
//   success: true,
//   data: {
//     operation: 'delete',
//     filters: {
//       date: 'today',
//       timeRange: { start: '15:00', end: '23:59' }
//     }
//   }
// }
```

### 4. 副业追踪

```typescript
const result = await aiUnified.parseMoneyCommand(
  '今天ins赚了1000块',
  existingSideHustles  // 现有副业列表
);

// 返回：
// {
//   success: true,
//   data: {
//     type: 'income',
//     sideHustleName: 'ins穿搭账号',
//     amount: 1000,
//     description: '今天ins赚了1000块'
//   }
// }
```

### 5. 内容分类

```typescript
const result = await aiUnified.classifyContent(
  '今天心情不错，阳光很好'
);

// 返回：
// {
//   success: true,
//   data: {
//     contentType: 'mood',
//     targetComponent: 'memory',
//     emotionTags: ['happy', 'calm'],
//     categoryTags: ['life'],
//     confidence: 0.9
//   }
// }
```

### 6. 智能对话

```typescript
const result = await aiUnified.chat(
  '我今天完成了3个任务，感觉很有成就感'
);

// 返回：
// {
//   success: true,
//   data: '太棒了！完成3个任务是很了不起的成就...'
// }
```

### 7. 成长故事生成

```typescript
const result = await aiUnified.generateGrowthStory(
  'daily',  // 周期：daily | weekly | monthly | yearly
  {
    tasksCompleted: 8,
    totalTasks: 10,
    focusTime: 180,  // 分钟
    goldEarned: 500,
    growthPoints: 50,
    habits: [{ name: '拖延', count: 2 }]
  }
);

// 返回：
// {
//   success: true,
//   data: '今天你完成了8个任务，专注了3小时...'
// }
```

### 8. 个性化建议

```typescript
const result = await aiUnified.getSuggestions({
  recentTasks: ['学习英语', '健身', '写代码'],
  recentMoods: ['开心', '疲惫', '焦虑'],
  goals: ['提升英语水平', '保持健康']
});

// 返回：
// {
//   success: true,
//   data: '• 建议1...\n• 建议2...\n• 建议3...'
// }
```

### 9. 图片验证

```typescript
const result = await aiUnified.verifyTaskImage(
  imageBase64,
  '拍摄健身房内的照片',
  '去健身房锻炼'
);

// 返回：
// {
//   success: true,
//   data: {
//     isValid: true,
//     confidence: 0.95,
//     reason: '照片显示健身器材和健身房环境'
//   }
// }
```

### 10. 文件验证

```typescript
const result = await aiUnified.verifyTaskFile(
  '项目报告.docx',
  2500000,  // 文件大小（字节）
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '上传项目报告文档',
  '完成项目报告'
);

// 返回：
// {
//   success: true,
//   data: {
//     isValid: true,
//     confidence: 0.9,
//     reason: '文件名相关，大小合理'
//   }
// }
```

---

## 🔄 迁移指南

### 如何将现有代码迁移到统一服务

#### 步骤 1: 找到旧的 AI 调用代码

在 `aiSmartService.ts` 中找到：

```typescript
// 旧代码
const response = await fetch(apiEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: model || 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是一个任务分析助手...' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500,
  }),
});
```

#### 步骤 2: 替换为统一服务

```typescript
// 新代码
import { aiUnified } from '@/services/aiUnifiedService';

const result = await aiUnified.analyzeTask(taskTitle, extractedDuration);

if (result.success) {
  const aiResponse = result.data;
  // 使用 aiResponse
} else {
  console.error('AI 调用失败:', result.error);
}
```

#### 步骤 3: 删除旧的提示词代码

删除原来写在代码里的提示词字符串，因为现在都在 `aiPrompts.ts` 中统一管理了。

---

## 🎨 提示词模板变量

在 `aiPrompts.ts` 中，使用 `${变量名}` 作为占位符：

```typescript
userTemplate: `分析任务：\${taskTitle}
用户指定时长：\${extractedDuration}分钟`
```

调用时传入变量：

```typescript
await aiUnified.analyzeTask('去煮稀饭', 30);
// 会自动替换为：
// "分析任务：去煮稀饭
//  用户指定时长：30分钟"
```

---

## ⚙️ 调整 AI 参数

### 温度（temperature）

- **0.0 - 0.3**: 更确定、更一致（适合分类、解析等任务）
- **0.7 - 0.9**: 更有创意、更多样（适合对话、故事生成等）

```typescript
TASK_ANALYZER: {
  temperature: 0.7,  // ← 修改这里
  // ...
}
```

### 最大 Token 数（maxTokens）

- **300 - 500**: 简短回复（分类、验证）
- **500 - 1000**: 中等长度（任务分解、建议）
- **1000+**: 长文本（故事生成、详细分析）

```typescript
GROWTH_STORY: {
  maxTokens: 800,  // ← 修改这里
  // ...
}
```

---

## 🐛 调试技巧

### 1. 查看实际发送的提示词

```typescript
import { AI_PROMPTS } from '@/services/aiPrompts';

console.log('提示词配置:', AI_PROMPTS.TASK_ANALYZER);
```

### 2. 查看 AI 返回的原始数据

```typescript
const result = await aiUnified.analyzeTask('去煮稀饭');
console.log('AI 返回:', result);
```

### 3. 测试单个提示词

```typescript
import { AIUnifiedService } from '@/services/aiUnifiedService';

const result = await AIUnifiedService['callAI']('TASK_ANALYZER', {
  taskTitle: '测试任务',
  extractedDuration: 30
});
console.log('测试结果:', result);
```

---

## 📊 提示词列表总览

| 提示词名称 | 用途 | 调用方法 |
|-----------|------|---------|
| TASK_ANALYZER | 分析单个任务属性 | `aiUnified.analyzeTask()` |
| TIMELINE_OPERATOR | 解析时间轴操作 | `aiUnified.parseTimelineOperation()` |
| MONEY_TRACKER | 解析副业收支 | `aiUnified.parseMoneyCommand()` |
| CONTENT_CLASSIFIER | 智能内容分类 | `aiUnified.classifyContent()` |
| TASK_DECOMPOSER | 任务分解 | `aiUnified.decomposeTask()` |
| CHAT_ASSISTANT | 智能对话 | `aiUnified.chat()` |
| GROWTH_STORY | 成长故事生成 | `aiUnified.generateGrowthStory()` |
| SUGGESTIONS | 个性化建议 | `aiUnified.getSuggestions()` |
| IMAGE_VERIFIER | 图片验证 | `aiUnified.verifyTaskImage()` |
| FILE_VERIFIER | 文件验证 | `aiUnified.verifyTaskFile()` |

---

## ✅ 优势

1. **集中管理**: 所有提示词在一个文件中，方便查找和修改
2. **类型安全**: TypeScript 类型检查，避免参数错误
3. **统一接口**: 所有 AI 调用使用相同的模式
4. **易于维护**: 修改提示词不需要改动业务代码
5. **便于测试**: 可以单独测试每个提示词

---

## 🚀 下一步

1. ✅ 已创建 `aiPrompts.ts` 和 `aiUnifiedService.ts`
2. ⏳ 将现有代码迁移到统一服务
3. ⏳ 测试所有功能是否正常
4. ⏳ 根据实际使用情况优化提示词

---

**最后更新**: 2026-02-02  
**维护者**: 您自己 😊

