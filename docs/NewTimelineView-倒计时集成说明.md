# NewTimelineView.tsx 倒计时集成说明

## 需要添加的导入

在文件顶部添加：
```typescript
import TaskCountdown from './TaskCountdown';
import { useTaskStore } from '@/stores/taskStore';
```

## 需要添加的功能

### 1. 在组件中获取 taskStore 方法

```typescript
const { startVerificationCountdown, completeStartVerification, completeTask } = useTaskStore();
```

### 2. 在任务卡片中显示倒计时

在任务卡片的标题下方（`block.title` 之后），根据任务状态显示不同的倒计时：

```typescript
{/* 倒计时显示 */}
{(() => {
  const task = allTasks.find(t => t.id === block.id);
  if (!task) return null;
  
  // 启动验证倒计时
  if (task.status === 'verifying_start' && task.startVerificationDeadline) {
    return (
      <div className="mb-2">
        <TaskCountdown 
          deadline={task.startVerificationDeadline}
          type="start"
          onTimeout={() => {
            console.log('⚠️ 启动验证超时');
          }}
        />
        <div className="text-xs mt-1 opacity-80">
          请拍摄包含【{taskVerifications[block.id]?.startKeywords?.join('、')}】的照片完成启动验证
        </div>
      </div>
    );
  }
  
  // 完成验证倒计时
  if (task.status === 'in_progress' && task.completionDeadline) {
    return (
      <div className="mb-2">
        <TaskCountdown 
          deadline={task.completionDeadline}
          type="complete"
        />
        <div className="text-xs mt-1 opacity-80">
          请在时间内完成任务
        </div>
      </div>
    );
  }
  
  return null;
})()}
```

### 3. 修改验证按钮逻辑

在生成启动验证关键词后，调用 `startVerificationCountdown`：

```typescript
const handleEnableVerification = async (taskId: string, taskTitle: string, taskType: string) => {
  // ... 现有的生成关键词逻辑 ...
  
  // 开始启动验证倒计时
  startVerificationCountdown(taskId);
  
  console.log('⏱️ 启动验证倒计时已开始');
};
```

### 4. 添加 Start 按钮

在验证状态为 `verifying_start` 时，显示 Start 按钮：

```typescript
{/* Start 按钮 - 仅在启动验证状态显示 */}
{(() => {
  const task = allTasks.find(t => t.id === block.id);
  if (task?.status === 'verifying_start') {
    return (
      <button
        onClick={() => handleStartVerification(block.id)}
        className="px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
        style={{ 
          backgroundColor: '#10B981',
          color: 'white',
        }}
      >
        Start
      </button>
    );
  }
  return null;
})()}
```

### 5. 添加启动验证处理函数

```typescript
const handleStartVerification = async (taskId: string) => {
  try {
    // 这里应该触发拍照验证
    // 验证成功后调用：
    completeStartVerification(taskId);
    
    console.log('✅ 启动验证完成，任务开始');
  } catch (error) {
    console.error('启动验证失败:', error);
  }
};
```

### 6. 修改完成按钮逻辑

在任务完成时，调用 `completeTask` 而不是直接更新状态：

```typescript
const handleCompleteTask = async (taskId: string) => {
  try {
    await completeTask(taskId);
    console.log('✅ 任务完成，金币已结算');
  } catch (error) {
    console.error('完成任务失败:', error);
  }
};
```

## 集成位置

1. **倒计时显示**：在任务卡片的标题和目标文本之间
2. **Start 按钮**：在任务卡片的右侧按钮组中
3. **完成按钮**：替换现有的完成逻辑

## 样式说明

- 倒计时组件会根据剩余时间自动变色（绿色→橙色→红色）
- Start 按钮使用绿色背景
- 提示文字使用较小字号，透明度 80%

