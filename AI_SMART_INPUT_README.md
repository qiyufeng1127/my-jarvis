# 🤖 AI 智能输入框 - 完整实现文档

## 📋 功能概述

AI 智能输入框是 ManifestOS 的核心交互组件，固定在页面底部中央，提供自然语言交互能力。

### ✨ 核心功能

1. **📅 智能任务分解** - 自然语言转换为结构化任务
2. **💰 自动金币分配** - 根据任务类型智能计算金币
3. **🏷️ 智能标签生成** - 自动分类和打标签
4. **🕒 时间轴操作** - 直接修改时间轴任务
5. **📝 心情记录** - 记录心情和碎碎念

---

## 🎯 组件设计

### 位置和样式
- **位置**: 固定在页面底部中央
- **宽度**: 600px (最大 90vw)
- **高度**: 折叠 64px，展开 500px
- **层级**: z-index: 50

### 两种状态

#### 折叠状态（默认）
```
┌─────────────────────────────────────────────────────────┐
│  ✨ AI智能助手  对我说点什么，或者点击输入...  [🎤] [▼] [✕] │
└─────────────────────────────────────────────────────────┘
```

#### 展开状态
```
┌─────────────────────────────────────────────────────────┐
│  ✨ AI智能助手                              [🎤] [▲] [✕] │
├─────────────────────────────────────────────────────────┤
│  [对话区域 - 显示历史消息]                              │
│                                                         │
│  🤖: 你好！我是你的AI助手...                           │
│  👤: 5分钟之后去洗漱 然后洗衣服 然后去吃饭              │
│  🤖: 好的，我已经为你分解了任务...                     │
│      [添加"洗漱"] [添加"洗衣服"] [添加"吃饭"]           │
├─────────────────────────────────────────────────────────┤
│  快速指令: [📅分解任务] [🕒时间轴] [💰金币] [📝心情]    │
├─────────────────────────────────────────────────────────┤
│  [输入框]                                        [发送] │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 使用示例

### 1. 智能任务分解

**用户输入：**
```
5分钟之后去洗漱 然后洗衣服 然后去吃饭
```

**AI 响应：**
```
好的，我已经为你分解了任务并安排了时间：

1. **洗漱**
   ⏰ 10:05 - 10:20 (15分钟)
   💰 170金币

2. **洗衣服**
   ⏰ 10:25 - 11:10 (45分钟)
   💰 470金币

3. **吃饭**
   ⏰ 11:15 - 11:45 (30分钟)
   💰 320金币

总计：90分钟，960金币

是否将这些任务添加到你的时间轴？
```

**操作按钮：**
- [添加"洗漱"]
- [添加"洗衣服"]
- [添加"吃饭"]

### 2. 时间轴操作

**用户输入：**
```
把今天的任务复制到明天
```

**AI 响应：**
```
我理解你想将今天的8个任务复制到明天。

涉及的任务：
- 晨间规划 (08:30-09:00)
- 创意工作 (09:00-11:00)
- 团队会议 (11:00-12:00)
... 还有 5 个任务

影响分析：
- 影响任务数：8
- 警告：明天已有3个任务，可能产生时间冲突

请确认是否执行此操作？
```

### 3. 心情记录

**用户输入：**
```
今天心情很好，完成了很多事情
```

**AI 响应：**
```
我记录下了你的心情："今天心情很好，完成了很多事情"。继续保持好心情！

[保存到记忆]
```

---

## 🔧 技术实现

### 组件结构

```typescript
AISmartInput
├── 头部 (Header)
│   ├── 标题 + 图标
│   └── 控制按钮 (语音/展开/关闭)
├── 对话区域 (Conversation)
│   ├── 欢迎消息
│   ├── 历史消息列表
│   └── 处理中状态
├── 快速指令 (Quick Commands)
│   └── 预设指令按钮
└── 输入区域 (Input Area)
    ├── 文本输入框
    └── 发送按钮
```

### 核心文件

1. **`AISmartInput.tsx`** - 主组件
   - 状态管理
   - 消息处理
   - UI 渲染

2. **`aiSmartService.ts`** - AI 处理服务
   - 输入类型分析
   - 任务分解
   - 金币计算
   - DeepSeek API 集成

### 状态管理

```typescript
interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  actions?: AIAction[];
  timestamp: Date;
}

interface AIAction {
  type: 'create_task' | 'update_timeline' | 'add_tags' | 'record_memory' | 'calculate_gold';
  data: any;
  label: string;
}
```

---

## 🎨 AI 处理流程

### 1. 输入分析

```typescript
analyzeInputType(input: string) {
  // 任务分解型
  if (input.includes('然后') || input.includes('之后')) {
    return 'task_decomposition';
  }
  
  // 时间轴操作型
  if (input.includes('删除') || input.includes('复制')) {
    return 'timeline_operation';
  }
  
  // 心情记录型
  if (input.includes('心情') || input.includes('感觉')) {
    return 'mood_record';
  }
  
  // ... 其他类型
}
```

### 2. 任务分解处理

```typescript
handleTaskDecomposition(input, context) {
  // 1. 构建提示词
  const prompt = buildPrompt(input, context);
  
  // 2. 调用 DeepSeek API
  const aiResponse = await callDeepSeek(prompt);
  
  // 3. 解析 JSON 响应
  const parsed = JSON.parse(aiResponse);
  
  // 4. 计算金币
  const tasksWithGold = parsed.tasks.map(task => ({
    ...task,
    gold: calculateGold(task)
  }));
  
  // 5. 构建用户消息
  const message = buildMessage(tasksWithGold);
  
  // 6. 构建操作按钮
  const actions = tasksWithGold.map(task => ({
    type: 'create_task',
    data: task,
    label: `添加"${task.title}"`
  }));
  
  return { message, data, actions };
}
```

### 3. 金币计算规则

```typescript
calculateGold(task) {
  const rules = {
    standing: { base: 20, perMinute: 10 },  // 站立任务
    sitting: { base: 10, perMinute: 5 },    // 坐着任务
    sport: { base: 30, perMinute: 15 },     // 运动任务
    creative: { base: 25, perMinute: 8 },   // 创意任务
    learning: { base: 15, perMinute: 6 },   // 学习任务
    social: { base: 12, perMinute: 4 },     // 社交任务
    rest: { base: 5, perMinute: 2 },        // 休息任务
  };
  
  const rule = rules[task.type] || rules.life;
  return rule.base + task.duration * rule.perMinute;
}
```

---

## 🔌 DeepSeek API 集成

### 配置

在 `.env` 文件中添加：
```env
VITE_DEEPSEEK_API_KEY=your_api_key_here
```

### API 调用

```typescript
async callDeepSeek(prompt: string) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的AI助手，专门帮助用户管理时间、任务和生活。请始终以JSON格式回复。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 提示词模板

```typescript
const taskDecompositionPrompt = `
你是一个专业的时间规划师，请将用户的自然语言指令分解为具体的、有时间安排的任务序列。

当前时间：${context.current_time} (${context.current_date})

用户指令："${input}"

请按照以下步骤处理：
1. 识别所有时间参考点（如"5分钟之后"、"明天上午"、"然后"等）
2. 识别每个任务的描述
3. 为每个任务估算合理时长（基于常识和用户历史数据）
4. 安排具体的时间段
5. 考虑任务间的合理间隔

输出JSON格式：
{
  "decomposed_tasks": [
    {
      "sequence": 1,
      "title": "标准化任务标题",
      "description": "任务详细描述",
      "estimated_duration": 15,
      "scheduled_start": "HH:MM",
      "scheduled_end": "HH:MM",
      "task_type": "personal_care/meal/housework/work/study/exercise",
      "category": "生活事务"
    }
  ],
  "total_duration": 120
}
`;
```

---

## 📱 快速指令

预设的快速指令按钮：

| 指令 | 图标 | 功能 |
|------|------|------|
| 分解任务 | 📅 | 自动填充"帮我分解任务：" |
| 时间轴 | 🕒 | 自动填充"修改时间轴：" |
| 金币 | 💰 | 自动填充"计算金币：" |
| 心情 | 📝 | 自动填充"记录心情：" |
| 标签 | 🏷️ | 自动填充"生成标签：" |

---

## 🎯 交互特性

### 1. 自动滚动
- 新消息添加时自动滚动到底部
- 保持最新消息可见

### 2. 回车发送
- Enter 键发送消息
- Shift + Enter 换行

### 3. 处理状态
- 显示"AI正在思考..."
- 三个跳动的点动画
- 禁用输入和发送按钮

### 4. 操作按钮
- 每个 AI 响应可以包含操作按钮
- 点击按钮执行相应操作
- 操作完成后显示反馈

### 5. 语音输入
- 点击麦克风图标切换语音模式
- 语音识别转文字
- 自动发送识别结果

---

## 🔄 备用方案

如果 DeepSeek API 不可用，系统会自动使用备用的本地处理逻辑：

```typescript
fallbackTaskDecomposition(input, context) {
  // 简单的字符串分割
  const tasks = input.split(/然后|之后/).map(t => t.trim());
  
  // 默认时长和金币
  const decomposedTasks = tasks.map((task, index) => ({
    title: task,
    duration: 30,
    gold: 320,
    // ...
  }));
  
  return { message, data, actions };
}
```

---

## 📊 数据流

```
用户输入
  ↓
输入分析 (analyzeInputType)
  ↓
选择处理器
  ├─ 任务分解 → DeepSeek API → 解析响应 → 计算金币
  ├─ 时间轴操作 → 解析操作 → 验证 → 生成预览
  ├─ 心情记录 → 提取情绪 → 生成标签
  └─ 其他 → 通用处理
  ↓
构建响应
  ├─ 消息文本
  ├─ 结构化数据
  └─ 操作按钮
  ↓
显示给用户
  ↓
用户点击操作按钮
  ↓
执行操作 (executeActions)
  ├─ 创建任务 → taskStore.createTask()
  ├─ 更新时间轴 → 批量操作
  ├─ 添加标签 → 更新任务标签
  └─ 记录记忆 → 保存到数据库
  ↓
显示成功反馈
```

---

## 🎨 样式定制

### 主题适配

组件会自动适配系统主题：
- 明亮模式：白色背景，深色文字
- 暗色模式：深色背景，浅色文字

### 自定义样式

```css
/* 修改输入框宽度 */
.ai-smart-input {
  max-width: 800px; /* 默认 600px */
}

/* 修改展开高度 */
.ai-smart-input.expanded {
  height: 600px; /* 默认 500px */
}

/* 修改主色调 */
.ai-smart-input .primary-color {
  color: #your-color;
}
```

---

## 🚀 未来扩展

### 计划中的功能

1. **多轮对话** - 支持上下文理解和追问
2. **语音输出** - AI 回复语音播报
3. **图片识别** - 上传图片进行任务识别
4. **智能建议** - 主动推荐任务和时间安排
5. **学习能力** - 根据用户习惯优化建议
6. **快捷键** - 键盘快捷键快速唤醒
7. **拖拽调整** - 可拖拽调整位置和大小
8. **历史记录** - 查看和搜索历史对话

---

## 📝 使用建议

### 最佳实践

1. **清晰表达** - 使用简洁明确的语言
2. **包含时间** - 明确指定时间参考点
3. **合理时长** - 任务时长符合实际情况
4. **及时确认** - 检查 AI 分解的任务是否正确

### 示例输入

✅ **好的输入：**
- "5分钟后洗漱然后吃早餐然后去上班"
- "明天上午9点开始学习2小时然后休息30分钟"
- "把今天下午的任务都推迟1小时"

❌ **不好的输入：**
- "做点事" (太模糊)
- "然后然后然后" (缺少任务描述)
- "删除" (缺少操作对象)

---

## 🐛 故障排除

### 常见问题

**Q: AI 没有响应？**
A: 检查 DeepSeek API Key 是否配置正确，网络是否正常。

**Q: 任务分解不准确？**
A: 尝试更清晰地描述任务，包含时间和时长信息。

**Q: 操作按钮点击无效？**
A: 检查浏览器控制台是否有错误，确认 taskStore 正常工作。

**Q: 输入框不显示？**
A: 检查 z-index 是否被其他元素覆盖，确认组件已正确导入。

---

## 📄 许可证

MIT License

---

**享受 AI 智能输入框带来的便捷体验！** 🎉

