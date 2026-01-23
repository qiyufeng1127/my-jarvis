# 🕒 时间轴系统与 AI 智能输入完整交互指南

## 📋 目录
1. [系统概述](#系统概述)
2. [组件说明](#组件说明)
3. [完整交互流程](#完整交互流程)
4. [使用示例](#使用示例)
5. [API 接口](#api-接口)

---

## 🎯 系统概述

时间轴系统是一个完整的任务管理和执行系统，与 AI 智能输入完美集成，支持：
- ✅ 智能任务创建和分解
- ✅ 可视化时间轴展示
- ✅ 任务验证和执行追踪
- ✅ 语音和文字双输入
- ✅ 自动金币和成长值计算

---

## 📦 组件说明

### 1️⃣ TimelineCalendar - 时间轴日历
**文件**: `src/components/calendar/TimelineCalendar.tsx`

**核心功能**:
- 📅 日历视图（周视图/月视图）
- ⏰ 时间刻度条（支持 30/15/5 分钟粒度）
- 📌 任务块展示和拖拽
- 🎨 状态颜色区分
- 🖱️ 右键快捷菜单
- 📏 任务时长调整

**状态类型**:
```typescript
type TaskStatus = 
  | 'pending'              // 未开始 - 灰色边框
  | 'in-progress'          // 进行中 - 绿色边框 + 脉动动画
  | 'completed'            // 已完成 - 绿色填充 + ✅
  | 'overdue'              // 已超时 - 红色边框 + ⚠️
  | 'verification-needed'  // 需验证 - 黄色边框 + 🔒
```

**交互操作**:
- 🖱️ **拖拽任务块** → 调整开始时间
- 📏 **拖拽底部手柄** → 调整任务时长
- 🖱️ **右键点击** → 打开快捷菜单
- 👆 **点击时间刻度** → 快速定位
- ⚙️ **点击时钟图标** → 切换时间粒度

---

### 2️⃣ TaskVerification - 任务验证
**文件**: `src/components/calendar/TaskVerification.tsx`

**验证类型**:
- 📷 **拍照验证** - 使用摄像头拍照，AI 识别
- 📍 **位置验证** - GPS 定位验证
- 📤 **上传验证** - 上传文件或截图

**验证流程**:
```
1. 任务开始时间到达
   ↓
2. 弹出全屏验证窗口
   ↓
3. 2分钟倒计时开始
   ↓
4. 用户完成验证操作
   ↓
5. AI 识别验证结果
   ↓
6. 成功 → 开始任务 | 失败 → 扣除金币
```

**惩罚机制**:
- ❌ 验证失败：扣除 20 金币
- ⏱️ 超时未验证：扣除 20 金币
- ⏭️ 跳过验证：扣除 50 金币

---

### 3️⃣ TaskExecutionPanel - 任务执行面板
**文件**: `src/components/calendar/TaskExecutionPanel.tsx`

**核心功能**:
- ⏱️ 实时计时和进度显示
- 📊 成长值和目标贡献展示
- 💰 金币奖励预估
- ⏸️ 暂停/继续/完成/放弃操作
- 📝 长任务进度检查（每60分钟）
- 🖱️ 可拖拽和最小化

**进度检查**:
- 触发条件：任务进行超过 60 分钟
- 检查频率：每 60 分钟一次
- 跳过惩罚：扣除 20 金币

**操作按钮**:
- ⏸️ **暂停** - 暂停计时，任务状态变为"已暂停"
- ▶️ **继续** - 从暂停点继续计时
- ✅ **完成** - 标记任务完成，发放奖励
- 🚫 **放弃** - 放弃任务，扣除 50 金币

---

### 4️⃣ TaskDetailPanel - 任务详情面板
**文件**: `src/components/calendar/TaskDetailPanel.tsx`

**三个标签页**:

#### 📝 基本信息
- 任务描述
- 时间安排
- 当前状态

#### 📈 成长 & 目标
- 关联成长维度
- 目标贡献度

#### 🔒 验证 & 奖励
- 开始验证设置
- 完成验证设置
- 金币奖励计算

**操作按钮**:
- ✏️ **编辑** - 修改任务信息
- 📋 **复制** - 复制到明天
- 🗑️ **删除** - 删除任务

---

### 5️⃣ AISmartInput - AI 智能输入
**文件**: `src/components/ai/AISmartInput.tsx`

**输入方式**:
- 💬 **文字输入** - 直接输入文字指令
- 🎤 **语音输入** - 语音识别转文字

**AI 能力**:
- 📅 智能任务分解
- ⏰ 自动时间安排
- 💰 金币自动计算
- 🏷️ 标签自动生成
- 📝 心情记录

---

## 🔄 完整交互流程

### 流程 1: AI 创建任务 → 时间轴显示

```
用户输入: "5分钟之后去洗漱 然后洗衣服 然后去吃饭"
   ↓
AI 智能解析:
   - 任务1: 洗漱 (5分钟后, 15分钟)
   - 任务2: 洗衣服 (20分钟后, 30分钟)
   - 任务3: 吃饭 (50分钟后, 30分钟)
   ↓
自动创建任务到 taskStore
   ↓
时间轴自动刷新显示
   ↓
任务块出现在对应时间位置
```

**代码示例**:
```typescript
// AI 解析后执行
await createTask({
  title: '洗漱',
  scheduledStart: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  durationMinutes: 15,
  taskType: 'life',
  status: 'pending',
});
```

---

### 流程 2: 任务开始 → 验证 → 执行

```
任务开始时间到达
   ↓
系统检查是否需要验证
   ↓
【需要验证】
   ├─ 弹出 TaskVerification 组件
   ├─ 2分钟倒计时
   ├─ 用户完成验证
   ├─ AI 识别结果
   └─ 成功 → 进入执行
   
【无需验证】
   └─ 直接进入执行
   ↓
显示 TaskExecutionPanel 组件
   ├─ 开始计时
   ├─ 显示进度
   ├─ 实时更新成长值
   └─ 等待用户操作
```

---

### 流程 3: 任务完成 → 奖励发放

```
用户点击"完成"按钮
   ↓
系统检查是否需要完成验证
   ↓
【需要验证】
   ├─ 弹出 TaskVerification 组件
   ├─ 完成验证流程
   └─ 验证成功 → 继续
   
【无需验证】
   └─ 直接继续
   ↓
计算奖励:
   ├─ 基础金币 = 时长 × 2
   ├─ 难度系数 = 1.0 ~ 2.0
   └─ 总金币 = 基础金币 × 难度系数
   ↓
发放奖励:
   ├─ 增加金币
   ├─ 增加成长值
   └─ 更新目标进度
   ↓
显示成功动画
   ├─ ✅ 绿色对勾
   ├─ 🎉 烟花粒子效果
   └─ 语音反馈: "太棒了！任务已完成"
   ↓
任务状态变为"已完成"
时间轴更新显示
```

---

## 💡 使用示例

### 示例 1: 语音创建任务

**用户说**: "明天早上8点开会，持续2小时"

**AI 处理**:
```typescript
{
  type: 'create_task',
  data: {
    title: '开会',
    scheduled_time: '2026-01-24T08:00:00',
    estimated_duration: 120,
    category: 'work',
    priority: 'high',
  }
}
```

**结果**: 
- ✅ 任务自动创建
- ✅ 显示在明天 8:00 的时间轴上
- ✅ 语音反馈: "已为您创建明天早上8点的任务"

---

### 示例 2: 文字分解任务

**用户输入**: "帮我分解任务：完成项目报告"

**AI 回复**:
```
我帮你分解了这个任务：

1. 收集数据 (30分钟)
2. 数据分析 (60分钟)
3. 撰写报告 (90分钟)
4. 审核修改 (30分钟)

总计: 210分钟
预估金币: 420 💰

是否创建到时间轴？
```

**用户点击**: "创建到时间轴"

**结果**:
- ✅ 4个子任务自动创建
- ✅ 按顺序排列在时间轴上
- ✅ 自动计算开始时间

---

### 示例 3: 拖拽调整任务

**操作**: 拖拽"开会"任务块

**效果**:
- 🖱️ 任务块跟随鼠标移动
- ⏰ 实时显示新的开始时间
- 📏 自动对齐到时间刻度（15分钟为单位）
- ✅ 松开鼠标后保存新时间

---

### 示例 4: 任务验证流程

**场景**: 任务"写代码"设置了开始验证

**流程**:
```
9:00 任务开始时间到达
   ↓
弹出验证窗口
   ├─ 要求: 拍摄电脑屏幕
   ├─ 倒计时: 2:00
   └─ 摄像头预览
   ↓
用户点击"拍照"
   ↓
AI 识别中...
   ├─ 检测到电脑屏幕 ✅
   ├─ 检测到代码编辑器 ✅
   └─ 验证成功！
   ↓
显示成功动画
   ├─ ✅ 绿色对勾
   └─ "验证成功！任务即将开始..."
   ↓
进入任务执行面板
```

---

## 🔌 API 接口

### 创建任务
```typescript
createTask({
  title: string;              // 任务标题
  description?: string;       // 任务描述
  scheduledStart: string;     // 开始时间 (ISO 8601)
  durationMinutes: number;    // 持续时长（分钟）
  taskType: string;           // 任务类型
  priority?: 'low' | 'medium' | 'high';  // 优先级
  tags?: string[];            // 标签
  status: 'pending';          // 初始状态
})
```

### 更新任务
```typescript
updateTask(taskId: string, {
  scheduledStart?: string;    // 新的开始时间
  durationMinutes?: number;   // 新的持续时长
  status?: TaskStatus;        // 新的状态
  // ... 其他字段
})
```

### 删除任务
```typescript
deleteTask(taskId: string)
```

---

## 🎨 样式配置

### 任务类型颜色
```typescript
const categoryColors = {
  work: '#3B82F6',      // 蓝色 - 工作类
  study: '#10B981',     // 绿色 - 学习类
  health: '#F59E0B',    // 橙色 - 健康类
  life: '#8B5CF6',      // 紫色 - 生活类
  social: '#EC4899',    // 粉色 - 社交类
  other: '#6B7280',     // 灰色 - 其他
};
```

### 状态样式
```typescript
const statusStyles = {
  'pending': { 
    border: 'border-gray-400', 
    bg: 'bg-gray-50', 
    icon: '⏳' 
  },
  'in-progress': { 
    border: 'border-green-500', 
    bg: 'bg-green-50', 
    icon: '▶️' 
  },
  'completed': { 
    border: 'border-green-600', 
    bg: 'bg-green-100', 
    icon: '✅' 
  },
  'overdue': { 
    border: 'border-red-500', 
    bg: 'bg-red-50', 
    icon: '⚠️' 
  },
  'verification-needed': { 
    border: 'border-yellow-500', 
    bg: 'bg-yellow-50', 
    icon: '🔒' 
  },
};
```

---

## 🚀 快速开始

### 1. 在 Dashboard 中使用

```typescript
import { TimelineCalendar } from '@/components/calendar';
import { AISmartInput } from '@/components/ai';

function Dashboard() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const { tasks, createTask, updateTask, deleteTask } = useTaskStore();

  return (
    <>
      {/* 时间轴 */}
      <TimelineCalendar
        tasks={tasks}
        onTaskCreate={createTask}
        onTaskUpdate={updateTask}
        onTaskDelete={deleteTask}
      />

      {/* AI 输入 */}
      <AISmartInput
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />
    </>
  );
}
```

### 2. 语音创建任务

```typescript
// 用户说: "下午3点写报告2小时"
// AI 自动解析并创建:
{
  title: '写报告',
  scheduledStart: '2026-01-23T15:00:00',
  durationMinutes: 120,
  taskType: 'work',
  status: 'pending',
}
```

### 3. 查看任务详情

```typescript
// 点击任务块
<TaskDetailPanel
  task={selectedTask}
  onClose={() => setSelectedTask(null)}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onCopy={handleCopy}
/>
```

---

## ✅ 功能清单

- [x] 时间轴可视化展示
- [x] 任务拖拽调整时间
- [x] 任务时长调整
- [x] 右键快捷菜单
- [x] 时间刻度切换（30/15/5分钟）
- [x] AI 智能创建任务
- [x] 语音输入支持
- [x] 任务验证系统
- [x] 任务执行追踪
- [x] 进度检查
- [x] 金币奖励计算
- [x] 成长值关联
- [x] 目标贡献度
- [x] 任务详情面板
- [x] 状态颜色区分
- [x] 当前时间指示线

---

## 📝 注意事项

1. **时间对齐**: 拖拽任务时会自动对齐到当前时间粒度
2. **最小时长**: 任务最小时长为当前时间粒度（5/15/30分钟）
3. **验证超时**: 验证窗口2分钟后自动关闭并标记失败
4. **进度检查**: 仅对超过60分钟的任务启用
5. **语音反馈**: 需要浏览器支持 Web Speech API

---

**文档版本**: v1.0  
**更新时间**: 2026-01-23  
**作者**: AI Assistant

