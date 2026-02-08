# 网站AI功能完整说明文档

## 📍 目录
1. [右下角黄色按钮 - AI智能助手](#1-右下角黄色按钮)
2. [收集箱功能](#2-收集箱功能)
3. [所有AI提示词汇总](#3-所有ai提示词汇总)

---

## 1. 右下角黄色按钮

### 位置
- **桌面端**：右下角，距离底部8px，距离右侧32px
- **手机端**：右下角，距离底部24px（避免遮挡导航栏），距离右侧4px
- **图标**：🤖 紫色圆形按钮

### 功能说明
这是一个**AI智能助手浮动窗口**，可以帮你：
- 📅 智能分解任务和安排时间
- 💰 自动分配金币和成长值
- 🏷️ 自动打标签分类（AI智能理解）
- 🕒 直接创建和修改时间轴任务
- 🎯 智能关联长期目标
- 📝 记录心情、想法、感恩、成功
- 💡 收集创业想法到副业追踪器
- 🔍 查询任务进度和统计
- 🏠 智能动线优化（根据家里格局排序）

### 使用的AI提示词

#### 1.1 任务分解（最常用）
**触发条件**：用户输入包含多个任务，如"5分钟后洗漱、洗碗、倒猫粮"

**提示词**：
```
你是一个任务分解专家。用户会描述一个任务或计划，你需要将其分解为多个独立的子任务。

当前时间：13:21（今天）

用户输入：5分钟后洗漱、洗碗、倒猫粮

重要规则：
1. 必须识别每个独立的动作（洗漱是一个任务，洗碗是另一个任务）
2. 识别连接词："然后"、"接着"、"再"、"之后"、"，"、"、"
3. 每个任务要简洁明确
4. 时间计算规则：
   - 如果用户说"5分钟之后"，第一个任务的开始时间 = 当前时间 + 5分钟
   - 后续任务的开始时间 = 前一个任务的结束时间
5. 任务排序规则：
   - 按照位置（location）分组排序
   - 排序优先级：工作区 > 厕所 > 厨房 > 客厅 > 卧室

返回JSON格式：
{
  "tasks": [
    {
      "title": "洗漱",
      "duration": 10,
      "startTime": "13:26",
      "category": "life",
      "priority": "medium",
      "location": "厕所"
    }
  ]
}

时长参考：
- 吃药：2分钟
- 洗漱：5-10分钟
- 洗衣服：10-15分钟
- 吃饭（在家）：30分钟
- 工作：60分钟起步
```

**AI模型**：deepseek-chat
**温度**：0.7
**最大Token**：1000

---

#### 1.2 时间轴操作（删除/移动任务）
**触发条件**：用户说"删除今天的任务"、"把明天的任务移动到今天"

**提示词**：
```
你是一个时间轴操作助手。请分析用户的指令并返回JSON格式的操作。

用户指令：删除今天所有的任务

当前时间：2026-02-08 13:21

现有任务列表：
1. 洗漱 (今天 13:26)
2. 洗碗 (今天 13:36)
3. 倒猫粮 (今天 13:41)

请返回以下格式的JSON：
{
  "operation": "delete",  // 操作类型：delete(删除) | move(移动) | delay(顺延)
  "filters": {
    "date": "today",  // 日期过滤：today | yesterday | tomorrow | 具体日期
    "timeRange": { "start": "15:00", "end": "18:00" },  // 时间范围（可选）
    "all": true  // 是否全部（可选）
  },
  "delayMinutes": 60  // 如果是顺延，延迟多少分钟（可选）
}

示例：
1. "删除今天所有的任务" → {"operation": "delete", "filters": {"date": "today", "all": true}}
2. "删除今天下午3点以后的任务" → {"operation": "delete", "filters": {"date": "today", "timeRange": {"start": "15:00", "end": "23:59"}}}
3. "把今天的任务往后推1小时" → {"operation": "delay", "filters": {"date": "today"}, "delayMinutes": 60}
4. "把明天的任务移动到今天" → {"operation": "move", "filters": {"date": "tomorrow"}, "targetDate": "today"}
```

**AI模型**：deepseek-chat
**温度**：0.3
**最大Token**：500

---

#### 1.3 内容分类（心情/想法/任务）
**触发条件**：用户输入任何文字，AI自动判断是心情、想法还是任务

**提示词**：
```
你是一个智能内容分类助手，负责分析用户输入并决定应该分配到哪个组件。

用户输入：今天心情不错，阳光很好

请分析以下内容，返回JSON格式：
{
  "contentType": "mood",  // 内容类型
  "targetComponent": "memory",  // 目标组件
  "emotionTags": ["happy", "calm"],  // 情绪标签
  "categoryTags": ["life"],  // 分类标签
  "confidence": 0.9,  // 置信度
  "reason": "表达心情感受"  // 分类理由
}

内容类型（contentType）：
- task: 待办任务、计划、安排
- mood: 心情记录
- thought: 碎碎念、想法、灵感
- gratitude: 感恩内容
- success: 成功日记
- startup: 创业想法、商业计划
- timeline_control: 时间轴控制指令

目标组件（targetComponent）：
- timeline: 时间轴（用于 task 和 timeline_control）
- memory: 全景记忆栏（用于 mood、thought）
- journal: 成功&感恩日记（用于 gratitude、success）
- sidehustle: 副业追踪（用于 startup）
- none: 不分配

情绪标签（emotionTags）：
happy, excited, calm, grateful, proud, anxious, sad, angry, frustrated, tired

分类标签（categoryTags）：
work, study, life, housework, health, social, hobby, startup, finance, family
```

**AI模型**：deepseek-chat
**温度**：0.7
**最大Token**：500

---

#### 1.4 副业追踪（收入/支出记录）
**触发条件**：用户说"今天ins赚了1000块"、"照相馆买设备花了5000"

**提示词**：
```
你是一个副业追踪助手。请分析用户的输入并返回JSON格式的结果。

用户输入：今天ins赚了1000块

现有副业列表：
1. 💰 ins穿搭账号
2. 📷 照相馆小红书
3. 🎨 抖音美妆账号

请返回以下格式的JSON：
{
  "type": "income",  // 类型：income(收入) | expense(支出) | create_side_hustle(新建副业) | debt(欠债)
  "sideHustleName": "ins穿搭账号",  // 副业名称（从现有列表中匹配）
  "sideHustleId": "xxx-xxx",  // 副业ID（如果匹配到现有副业）
  "amount": 1000,  // 金额（数字）
  "description": "今天ins赚了1000块",  // 描述/备注
  "confidence": 0.95  // 置信度
}

识别规则：
1. 优先从现有副业列表中匹配（模糊匹配，如"ins"可以匹配"ins穿搭账号"）
2. 提取金额数字（支持：1000、1000元、1k、1千等）
3. 提取描述信息
4. 判断是收入还是支出（赚了/收入=income，花了/买了=expense）

示例：
1. "今天ins赚了1000块" → {"type": "income", "sideHustleName": "ins穿搭账号", "amount": 1000}
2. "照相馆买设备花了5000" → {"type": "expense", "sideHustleName": "照相馆小红书", "amount": 5000}
3. "新建副业：抖音美妆账号" → {"type": "create_side_hustle", "sideHustleName": "抖音美妆账号"}
```

**AI模型**：deepseek-chat
**温度**：0.3
**最大Token**：500

---

#### 1.5 单个任务分析（标签/位置/时长）
**触发条件**：用户输入单个任务，如"洗漱"

**提示词**：
```
你是一个任务分析助手。请分析以下任务并返回JSON格式的结果。

任务标题：洗漱
用户指定时长：无

用户家庭布局：
- 楼下：厕所、工作区、厨房（含猫砂和猫相关物品）、客厅
- 楼上：拍摄间、卧室

请返回以下信息（必须是有效的JSON格式）：
{
  "optimizedTitle": "洗漱",  // 优化后的标题（纠正错别字、简化表达）
  "isComplex": false,  // 是否是复杂任务（需要拆分子任务）
  "tags": ["个人护理", "日常"],  // 2-3个标签
  "location": "厕所",  // 位置
  "duration": 10,  // 预估时长（分钟）
  "taskType": "life",  // 任务类型
  "category": "生活事务",  // 分类
  "priority": 2,  // 优先级（1=低, 2=中, 3=高）
  "actionSteps": ["刷牙", "洗脸"],  // 动作步骤
  "subtasks": []  // 子任务列表（仅复杂任务）
}

位置选项：厕所、工作区、客厅、卧室、拍摄间、厨房、全屋、室外
taskType选项：work, study, health, life, finance, creative, rest

priority说明：
- 1（低）：日常琐事、可延期的任务
- 2（中）：常规任务、需按时完成
- 3（高）：紧急重要、有截止日期、考试、寄件等

注意：
- 大部分任务都是简单任务，不需要拆分子任务
- 只有明确包含多个步骤或阶段的任务才拆分
- 如果是简单任务，subtasks 必须返回空数组 []
```

**AI模型**：deepseek-chat（强制使用，不使用deepseek-reasoner）
**温度**：0.3
**最大Token**：300

---

## 2. 收集箱功能

### 位置
收集箱在时间轴模块中，用于临时存放未安排时间的任务。

### 点击收集箱后的AI功能

#### 2.1 AI智能分配（多组件）✨ **新功能**
**触发条件**：点击"AI智能分配（多组件）"按钮

**功能说明**：
收集箱现在**使用AI助手的完整逻辑**，不仅仅是分配到时间轴！

**完整流程**：
1. 📝 **AI智能分析**：调用 `aiService.classifyContent()` 分析每条内容
2. 🎯 **智能分类**：自动识别内容类型（任务/心情/想法/副业想法）
3. 📊 **多组件分配**：
   - **任务** → 时间轴（自动找空闲时间段）
   - **心情/想法** → 记忆库
   - **成功/感恩** → 日记
   - **创业想法** → 副业追踪器
4. ⏰ **智能排期**：对于时间轴任务，自动找空闲时间段，避免冲突

**使用的AI提示词**：
与AI助手完全相同，调用 `CONTENT_CLASSIFIER` 提示词：

```javascript
// 第一步：AI分析每个任务
for (const task of scheduledTasks) {
  // 调用AI助手的内容分类服务（和AI助手使用同一个AI逻辑）
  const classification = await aiService.classifyContent(task.title);
  
  // 返回：
  // {
  //   contentType: 'task' | 'mood' | 'thought' | 'success' | 'gratitude' | 'startup',
  //   targetComponent: 'timeline' | 'memory' | 'journal' | 'sidehustle',
  //   emotionTags: ['happy', 'calm'],
  //   categoryTags: ['life'],
  //   confidence: 0.9
  // }
}

// 第二步：按目标组件分组
const grouped = {
  timeline: [],    // 任务 → 时间轴
  memory: [],      // 心情/想法 → 记忆库
  journal: [],     // 成功/感恩 → 日记
  sidehustle: [],  // 创业想法 → 副业追踪器
};

// 第三步：分配到各个组件
// 1. 时间轴任务：智能找空闲时间段
// 2. 记忆库：保存心情和想法
// 3. 日记：保存成功和感恩记录
// 4. 副业追踪器：保存创业想法
```

**示例**：
```
收集箱中有3条内容：
1. "明天下午3点开会" → AI识别为任务 → 分配到时间轴（15:00）
2. "今天心情不错" → AI识别为心情 → 分配到记忆库
3. "想做一个小红书美食账号" → AI识别为创业想法 → 分配到副业追踪器

点击"AI智能分配"后：
✅ 时间轴: 1 个任务
✅ 记忆库: 1 条记录
✅ 副业追踪器: 1 个想法
```

**与AI助手的关系**：
- ✅ **使用同一套AI逻辑**：调用相同的 `aiService.classifyContent()`
- ✅ **使用同一个提示词**：`CONTENT_CLASSIFIER`
- ✅ **支持多组件分配**：不仅仅是时间轴
- ✅ **智能排期增强**：对于时间轴任务，额外提供空闲时间段查找

---

## 3. 所有AI提示词汇总

### 3.1 提示词文件位置
`src/services/aiPrompts.ts`

### 3.2 提示词列表

| 序号 | 提示词名称 | 用途 | 温度 | Token |
|------|-----------|------|------|-------|
| 1 | TASK_ANALYZER | 分析单个任务（标签/位置/时长） | 0.7 | 500 |
| 2 | TIMELINE_OPERATOR | 解析时间轴操作指令 | 0.3 | 500 |
| 3 | MONEY_TRACKER | 解析副业收入支出记录 | 0.3 | 500 |
| 4 | CONTENT_CLASSIFIER | 智能分类用户输入内容 | 0.7 | 500 |
| 5 | TASK_DECOMPOSER | 将复杂任务分解为多个子任务 | 0.7 | 1000 |
| 6 | CHAT_ASSISTANT | 与用户进行自然对话 | 0.8 | 500 |
| 7 | GROWTH_STORY | 根据数据生成成长故事 | 0.8 | 800 |
| 8 | SUGGESTIONS | 生成个性化建议 | 0.7 | 500 |
| 9 | IMAGE_VERIFIER | 验证任务完成图片 | 0.3 | 300 |
| 10 | FILE_VERIFIER | 验证任务完成文件 | 0.3 | 300 |

### 3.3 AI配置
- **API端点**：存储在 `localStorage` 的 `ai_api_endpoint`
- **API Key**：存储在 `localStorage` 的 `ai_api_key`
- **默认模型**：deepseek-chat
- **配置入口**：点击AI助手右上角的 ⚙️ 图标

---

## 4. 完整交互流程示例

### 示例1：任务分解
```
用户输入：5分钟后洗漱、洗碗、倒猫粮

AI处理流程：
1. 识别输入类型 → task_decomposition
2. 调用 TASK_DECOMPOSER 提示词
3. AI返回3个任务：
   - 洗漱（厕所，10分钟，13:26开始）
   - 洗碗（厨房，5分钟，13:36开始）
   - 倒猫粮（厨房，3分钟，13:41开始）
4. 按位置优化排序（厕所 → 厨房）
5. 显示任务编辑器，用户可调整
6. 点击"推送到时间轴"，创建任务
```

### 示例2：副业收入记录
```
用户输入：今天ins赚了1000块

AI处理流程：
1. 识别输入类型 → money_tracking
2. 调用 MONEY_TRACKER 提示词
3. AI返回：
   - type: income
   - sideHustleName: ins穿搭账号
   - amount: 1000
4. 自动添加收入记录到副业追踪器
5. 显示确认消息："✅ 已记录收入：💰 副业：ins穿搭账号 💵 金额：¥1,000"
```

### 示例3：心情记录
```
用户输入：今天心情不错，阳光很好

AI处理流程：
1. 识别输入类型 → mood
2. 调用 CONTENT_CLASSIFIER 提示词
3. AI返回：
   - contentType: mood
   - emotionTags: [happy, calm]
   - categoryTags: [life]
4. 自动保存到全景记忆栏
5. 显示标签和奖励："🏷️ 情绪标签：😊 开心 😌 平静 | 🎁 获得奖励：💰 20 金币 ⭐ 5 成长值"
```

---

## 5. 总结

### 网站中有AI智能交互的地方：

1. **右下角黄色按钮（AI智能助手）**
   - 任务分解和时间安排
   - 心情/想法/日记记录
   - 副业收入支出记录
   - 时间轴操作（删除/移动任务）
   - 智能目标关联

2. **收集箱** ✨ **已升级为完整AI逻辑**
   - 使用AI助手的完整逻辑（`aiService.classifyContent()`）
   - 智能识别内容类型（任务/心情/想法/副业）
   - 自动分配到多个组件（时间轴/记忆库/日记/副业追踪器）
   - 对于时间轴任务，额外提供智能排期（找空闲时间段）

3. **时间轴事件卡片**
   - 图片验证（使用百度AI图像识别，不是DeepSeek）
   - 文件验证（使用AI分析文件信息）

### 收集箱和AI助手的关系：

**完全统一的AI逻辑！** ✅

| 功能 | AI助手 | 收集箱 | 是否统一 |
|------|--------|--------|----------|
| AI分析服务 | `aiService.classifyContent()` | `aiService.classifyContent()` | ✅ 完全相同 |
| 提示词 | `CONTENT_CLASSIFIER` | `CONTENT_CLASSIFIER` | ✅ 完全相同 |
| 内容分类 | 任务/心情/想法/副业 | 任务/心情/想法/副业 | ✅ 完全相同 |
| 多组件分配 | 支持 | 支持 | ✅ 完全相同 |
| 智能排期 | 不支持 | **额外支持**（找空闲时间段） | ⭐ 收集箱增强 |

**区别**：
- AI助手：更适合**对话式交互**，可以编辑任务后推送
- 收集箱：更适合**批量处理**，一次性分析多条内容并自动分配

**共同点**：
- ✅ 使用同一个AI服务
- ✅ 使用同一个提示词
- ✅ 支持多组件智能分配
- ✅ 自动识别内容类型

### 所有提示词都在哪里？
- **文件位置**：`src/services/aiPrompts.ts`
- **共10个提示词**，涵盖任务分析、内容分类、副业追踪、对话助手等

### 如何修改提示词？
1. 打开 `src/services/aiPrompts.ts`
2. 找到对应的提示词（如 `TASK_DECOMPOSER`）
3. 修改 `userTemplate` 字段
4. 保存后刷新页面即可生效

---

---

## 6. 标签学习系统 ✨ **新功能**

### 6.1 功能说明

AI现在可以**学习您的标签习惯**，从泛化标签逐渐进化到精确标签！

**问题**：
- AI默认分配的标签太泛化（学习、工作、生活）
- 您希望使用更精确的标签（照相馆工作、网站开发、文创插画账号）

**解决方案**：
标签学习系统会记住您的标签修改习惯，下次遇到类似任务时自动使用您常用的精确标签。

### 6.2 工作原理

```
第一次：AI分配泛化标签
任务："优化照相馆网站" → AI分配：[工作, 网站]

您修改标签：
任务："优化照相馆网站" → 您改为：[照相馆工作, 网站开发]
                        ↓
                   系统学习记录

第二次：AI使用学习到的标签
任务："照相馆网站添加新功能" → AI自动分配：[照相馆工作, 网站开发] ✅
```

### 6.3 学习流程

1. **AI分析任务**
   - 首先检查标签学习记录
   - 如果找到相似任务，使用学习到的标签
   - 如果没有记录，使用AI分析

2. **用户修改标签**
   - 双击标签可以编辑
   - 修改后系统自动记录学习

3. **持续优化**
   - 每次修改都会更新学习记录
   - 使用频率越高，置信度越高
   - AI会优先使用高置信度的标签

### 6.4 技术实现

**文件位置**：`src/services/tagLearningService.ts`

**核心方法**：

```typescript
// 1. 记录用户的标签选择（学习）
TagLearningService.learnFromUserChoice(taskTitle, userTags);

// 示例：
TagLearningService.learnFromUserChoice(
  "优化照相馆网站",
  ["照相馆工作", "网站开发"]
);

// 2. 根据任务内容推荐标签
const suggestions = TagLearningService.suggestTags(taskTitle);

// 返回：
// [
//   { tag: "照相馆工作", confidence: 0.85, reason: "与'优化 照相馆 网站'相似 (80%)" },
//   { tag: "网站开发", confidence: 0.82, reason: "与'优化 照相馆 网站'相似 (80%)" }
// ]

// 3. 获取最常用的标签
const mostUsed = TagLearningService.getMostUsedTags(20);

// 返回：
// [
//   { tag: "照相馆工作", count: 15 },
//   { tag: "网站开发", count: 12 },
//   { tag: "文创插画账号", count: 8 }
// ]
```

### 6.5 集成到AI分析

在 `aiSmartService.ts` 中，AI分析任务时会：

```typescript
// 第一步：检查学习记录
const learnedSuggestions = TagLearningService.suggestTags(taskTitle);

if (learnedSuggestions.length > 0) {
  // 使用学习到的标签（置信度 > 0.5）
  learnedTags = learnedSuggestions
    .filter(s => s.confidence > 0.5)
    .map(s => s.tag);
  
  console.log('✅ 找到学习记录，推荐标签:', learnedTags);
}

// 第二步：调用AI分析（作为补充）
// AI会优先使用学习到的标签
const prompt = `
任务：${taskTitle}
用户历史标签偏好：${learnedTags.join('、')} (置信度: ${Math.round(tagConfidence * 100)}%)

标签分配（重要！）：
- **优先使用用户历史标签**：${learnedTags.join('、')}
- 这些是用户过去常用的精确标签，请优先使用
- 如果任务内容与这些标签相关，直接使用，不要改成泛化标签
`;
```

### 6.6 使用示例

**场景1：照相馆工作**

```
第1次：
输入："优化照相馆网站"
AI分配：[工作, 网站]
您修改：[照相馆工作, 网站开发]
→ 系统学习

第2次：
输入："照相馆网站添加支付功能"
AI分配：[照相馆工作, 网站开发] ✅ 自动使用学习到的标签
```

**场景2：文创插画账号**

```
第1次：
输入："文创插画账号发布新作品"
AI分配：[工作, 社交]
您修改：[文创插画账号, 小红书运营]
→ 系统学习

第2次：
输入："文创插画账号回复评论"
AI分配：[文创插画账号, 小红书运营] ✅ 自动使用学习到的标签
```

### 6.7 数据管理

**查看统计**：
```typescript
const stats = TagLearningService.getTagStatistics();

// 返回：
// {
//   totalRecords: 50,        // 总学习记录数
//   totalTags: 25,           // 总标签数
//   mostUsedTags: [...],     // 最常用的10个标签
//   recentTags: [...]        // 最近使用的10个标签
// }
```

**导出备份**：
```typescript
const backup = TagLearningService.exportLearningRecords();
// 返回JSON字符串，可以保存到文件
```

**导入恢复**：
```typescript
TagLearningService.importLearningRecords(jsonData);
```

**清空记录**：
```typescript
TagLearningService.clearLearningRecords();
```

### 6.8 优势

✅ **自动学习**：无需手动配置，系统自动学习您的习惯  
✅ **持续优化**：使用越多，标签越精确  
✅ **智能推荐**：基于关键词匹配和使用频率  
✅ **本地存储**：数据保存在浏览器本地，隐私安全  
✅ **无缝集成**：与AI助手和收集箱完全集成  

---

**文档生成时间**：2026-02-08  
**版本**：v2.0（新增标签学习系统）

