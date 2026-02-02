# 提示词修改快速指南

> 快速找到并修改系统中的所有 AI 提示词

---

## 📍 提示词位置总览

### ✅ 新系统（推荐）

| 提示词 | 位置 | 使用组件 |
|--------|------|---------|
| 所有提示词 | `src/services/aiPrompts.ts` | `TaskInbox.tsx`（部分） |

### ⚠️ 旧系统（保留兼容）

| 提示词 | 位置 | 使用组件 |
|--------|------|---------|
| 任务分析 | `src/services/aiSmartService.ts` 第 413 行 | `AISmartInput.tsx` |
| 时间轴操作 | `src/services/aiSmartService.ts` 第 827 行 | `AISmartInput.tsx` |
| 副业追踪 | `src/services/moneyAIService.ts` 第 82 行 | `AISmartInput.tsx` |
| 内容分类 | `src/services/aiService.ts` 第 40 行 | 万能收集箱（旧版） |
| 任务分解 | `src/services/aiService.ts` 第 150 行 | 未使用 |
| 智能对话 | `src/services/aiService.ts` 第 300 行 | 未使用 |

---

## 🔧 如何修改提示词

### 场景 1：修改任务分析提示词

**当前使用位置**：AI 智能助手（`AISmartInput.tsx`）

**修改方法**：
1. 打开 `src/services/aiSmartService.ts`
2. 搜索 "你是一个任务分析助手"
3. 找到第 413 行左右的 `analyzeTaskWithAI` 方法
4. 修改 `prompt` 变量中的提示词内容

```typescript
// 在 aiSmartService.ts 中找到这段代码
const prompt = `你是一个任务分析助手。请分析以下任务并返回JSON格式的结果。

任务标题：${taskTitle}
...
`;
```

**或者使用新系统**：
1. 打开 `src/services/aiPrompts.ts`
2. 找到 `TASK_ANALYZER`
3. 修改 `userTemplate` 字段

---

### 场景 2：修改时间轴操作提示词

**当前使用位置**：AI 智能助手（`AISmartInput.tsx`）

**修改方法**：
1. 打开 `src/services/aiSmartService.ts`
2. 搜索 "你是一个时间轴操作助手"
3. 找到第 827 行左右的 `parseTimelineOperationWithAI` 方法
4. 修改 `prompt` 变量中的提示词内容

---

### 场景 3：修改副业追踪提示词

**当前使用位置**：AI 智能助手（`AISmartInput.tsx`）

**修改方法**：
1. 打开 `src/services/moneyAIService.ts`
2. 搜索 "你是一个副业追踪助手"
3. 找到第 82 行左右的 `parseMoneyCommandWithAI` 方法
4. 修改 `prompt` 变量中的提示词内容

---

### 场景 4：修改万能收集箱的内容分类提示词

**当前使用位置**：万能收集箱（`TaskInbox.tsx`）

**修改方法**：
1. 打开 `src/services/aiPrompts.ts`
2. 找到 `CONTENT_CLASSIFIER`
3. 修改 `userTemplate` 字段

✅ 这个已经使用新系统！

---

## 📝 修改示例

### 示例 1：让任务分析更详细

**旧提示词**：
```
你是一个任务分析助手。请分析以下任务并返回JSON格式的结果。
```

**修改为**：
```
你是一个专业的任务分析助手。请仔细分析以下任务，并返回详细的JSON格式结果。
注意：要特别关注任务的紧急程度和重要性。
```

### 示例 2：调整 AI 温度参数

**在 `aiPrompts.ts` 中**：
```typescript
TASK_ANALYZER: {
  temperature: 0.7,  // 改为 0.3 更精确，改为 0.9 更有创意
  maxTokens: 500,    // 改为 1000 获得更详细的回复
}
```

**在旧文件中**：
```typescript
// 在 aiSmartService.ts 中找到 fetch 调用
body: JSON.stringify({
  temperature: 0.7,  // ← 修改这里
  max_tokens: 500,   // ← 修改这里
})
```

---

## 🔍 快速搜索技巧

### 在 VS Code 中搜索提示词

1. 按 `Ctrl + Shift + F`（Windows）或 `Cmd + Shift + F`（Mac）
2. 搜索关键词：
   - `你是一个` - 找到所有 system 消息
   - `role: 'system'` - 找到所有 AI 调用
   - `temperature:` - 找到所有 AI 参数配置

### 按功能搜索

| 功能 | 搜索关键词 |
|------|-----------|
| 任务分析 | `任务分析助手` |
| 时间轴操作 | `时间轴操作助手` |
| 副业追踪 | `副业追踪助手` |
| 内容分类 | `内容分类助手` |
| 任务分解 | `任务分解专家` |

---

## ⚡ 常见修改需求

### 需求 1：让 AI 更严格地识别任务

**修改位置**：`aiSmartService.ts` → `analyzeTaskWithAI` 方法

**修改内容**：
```typescript
const prompt = `你是一个任务分析助手。请分析以下任务并返回JSON格式的结果。

⚠️ 重要：请严格按照以下标准判断：
- 标签必须精确匹配任务内容
- 位置必须是用户家中的实际位置
- 时长必须合理（不能太短或太长）

任务标题：${taskTitle}
...
`;
```

### 需求 2：添加新的任务类型

**修改位置**：`aiPrompts.ts` → `TASK_ANALYZER`

**修改内容**：
```typescript
userTemplate: `...
"taskType": "life",  // 可选：work, study, health, life, finance, creative, rest, hobby, entertainment
...
`
```

### 需求 3：修改金币计算逻辑

**修改位置**：`aiSmartService.ts` → `calculateGold` 方法（第 1000 行左右）

**这不是提示词，是代码逻辑**，直接修改代码即可。

---

## 🎨 提示词优化建议

### 1. 让 AI 更理解中文语境

**添加**：
```
注意：用户使用中文，请理解中文的语言习惯和表达方式。
```

### 2. 让 AI 返回更结构化的数据

**添加**：
```
返回的 JSON 必须严格遵循格式，不要添加任何额外字段。
```

### 3. 让 AI 更有个性

**修改 system 消息**：
```
你是一个温暖、专业、有点幽默的 AI 助手...
```

---

## 📊 提示词效果对比

### 温度参数对比

| 温度 | 效果 | 适用场景 |
|------|------|---------|
| 0.1-0.3 | 非常确定、一致 | 分类、解析、数据提取 |
| 0.5-0.7 | 平衡 | 任务分析、建议生成 |
| 0.8-1.0 | 有创意、多样 | 对话、故事生成 |

### Token 数量对比

| Token | 效果 | 适用场景 |
|-------|------|---------|
| 300-500 | 简短回复 | 分类、验证 |
| 500-1000 | 中等长度 | 任务分解、建议 |
| 1000+ | 详细回复 | 故事生成、详细分析 |

---

## 🚀 下一步

1. ✅ 先测试修改一个提示词，看看效果
2. ✅ 如果满意，再修改其他提示词
3. ✅ 记录修改内容，方便回滚

---

## 💡 提示

- 修改后刷新页面即可生效
- 建议先备份原始提示词
- 可以用 Git 管理提示词版本

---

**最后更新**: 2026-02-02  
**维护者**: 您自己 😊

