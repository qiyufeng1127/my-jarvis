# AI助手修复清单

## 问题列表

### 1. ❌ 时间计算错误
**问题**：用户说"5分钟后"，当前时间1:17，应该是1:22开始，但显示1:52
**原因**：AI可能理解错误或时间解析有问题
**修复**：
- 在 `aiService.ts` 的 `decomposeTask` 方法中已经添加了当前时间参数
- 需要确保AI正确理解"X分钟后"的含义
- 已在系统提示词中明确说明时间计算规则

### 2. ❌ 消息发送延迟
**问题**：点击发送后要等10秒才显示消息，体验不好
**原因**：消息在等待AI响应后才显示
**修复方案**：
```typescript
// 在 FloatingAIChat.tsx 的 handleSend 方法中
// 1. 立即显示用户消息
const userMessage: Message = {
  id: `user-${Date.now()}`,
  role: 'user',
  content: message,
  timestamp: new Date(),
};
setMessages(prev => [...prev, userMessage]);
setInputValue(''); // 立即清空输入框

// 2. 然后再异步处理AI响应
setIsProcessing(true);
// ... AI处理逻辑
```

### 3. ❌ 标签是英文
**问题**：标签显示为 "health"、"life" 等英文
**原因**：AI返回的标签是英文ID，需要映射为中文
**修复方案**：
```typescript
// 创建标签映射
const TAG_LABELS: Record<string, string> = {
  // 情绪标签
  'happy': '开心',
  'excited': '兴奋',
  'calm': '平静',
  'grateful': '感恩',
  'proud': '自豪',
  'anxious': '焦虑',
  'sad': '难过',
  'angry': '生气',
  'frustrated': '沮丧',
  'tired': '疲惫',
  
  // 分类标签
  'work': '工作',
  'study': '学习',
  'life': '生活',
  'housework': '家务',
  'health': '健康',
  'social': '社交',
  'hobby': '爱好',
  'startup': '创业',
  'finance': '理财',
  'family': '家庭',
};

// 在显示标签时使用中文
const tagLabel = TAG_LABELS[tag.id] || tag.label;
```

### 4. ❌ 标签数量不足
**问题**：每个任务至少需要2个标签
**修复方案**：
- 在AI提示词中明确要求至少返回2个标签
- 如果AI返回的标签少于2个，自动补充默认标签

### 5. ❌ 完成任务后标签统计未更新
**问题**：完成任务后，标签管理中的统计没有自动更新
**修复方案**：
- 在任务完成时，提取任务的标签
- 更新标签store中的统计数据
- 触发标签列表刷新

### 6. ❌ 自定义标签优先级
**问题**：AI应该优先使用用户自定义的标签
**修复方案**：
- 在标签store中维护用户自定义标签列表
- 在AI提示词中传入用户的自定义标签
- AI优先从自定义标签中选择

## 实施步骤

### Step 1: 修复消息发送延迟（最重要）
立即显示用户消息，AI在后台处理

### Step 2: 修复标签显示为中文
添加标签ID到中文的映射

### Step 3: 确保至少2个标签
自动补充默认标签

### Step 4: 修复时间计算
确保AI正确理解"X分钟后"

### Step 5: 标签统计更新
完成任务时更新标签统计

### Step 6: 自定义标签优先
AI优先使用用户自定义标签

## 优先级

1. 🔴 **P0 - 立即修复**：消息发送延迟（影响体验最大）
2. 🟠 **P1 - 重要**：标签显示中文、时间计算错误
3. 🟡 **P2 - 中等**：至少2个标签、标签统计更新
4. 🟢 **P3 - 优化**：自定义标签优先

