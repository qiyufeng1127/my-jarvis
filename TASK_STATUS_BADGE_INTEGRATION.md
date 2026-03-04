# 任务状态标记显示修复说明

## 问题描述
任务完成后，启动超时和低效率的标记（黄色三角感叹号、乌龟图标）会消失，无法回顾哪些任务存在坏习惯。

## 解决方案
已创建 `TaskStatusBadge.tsx` 组件来显示这些标记，现在需要在 `NewTimelineView.tsx` 中集成。

## 需要修改的位置

### 1. 在文件顶部添加导入
在 `NewTimelineView.tsx` 的导入部分添加：

```typescript
import TaskStatusBadge from './TaskStatusBadge';
```

### 2. 在任务卡片中添加标记显示

找到任务卡片的渲染部分（大约在第 2000-3000 行之间），在任务卡片的主体 div 中添加：

#### 位置1：折叠状态的任务卡片（右上角显示）
在折叠状态的任务卡片中，找到类似这样的结构：
```tsx
<div 
  data-task-id={block.id}
  className={`flex-1 ${isMobile ? 'rounded-xl' : 'rounded-2xl'} shadow-lg overflow-hidden relative`}
  style={{ 
    backgroundColor: block.color,
    opacity: block.isCompleted ? 0.6 : 1,
    filter: block.isCompleted ? 'saturate(0.5)' : 'none',
  }}
>
```

在这个 div 内部的开头添加：
```tsx
{/* 任务状态标记 - 右上角显示 */}
<TaskStatusBadge
  taskId={block.id}
  isCompleted={block.isCompleted}
  startTimeout={taskStartTimeouts[block.id]}
  finishTimeout={taskFinishTimeouts[block.id]}
  efficiencyLevel={block.efficiencyLevel}
  completionEfficiency={block.completionEfficiency}
  position="top-right"
  size={isMobile ? 'small' : 'medium'}
/>
```

#### 位置2：展开状态的任务卡片（金币旁边显示）
在展开状态的任务卡片中，找到显示金币的部分：
```tsx
<div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.3)' }}>
  <span className="text-base">💰</span>
  <span className="text-xs font-bold">{block.goldReward}</span>
</div>
```

在金币显示的后面添加：
```tsx
{/* 任务状态标记 - 内联显示 */}
<TaskStatusBadge
  taskId={block.id}
  isCompleted={block.isCompleted}
  startTimeout={taskStartTimeouts[block.id]}
  finishTimeout={taskFinishTimeouts[block.id]}
  efficiencyLevel={block.efficiencyLevel}
  completionEfficiency={block.completionEfficiency}
  position="inline"
  size="small"
/>
```

### 3. 确保超时状态被持久化

在任务完成时，需要将超时状态保存到任务对象中。找到 `handleCompleteTask` 函数，确保在更新任务时保存这些状态：

```typescript
onTaskUpdate(taskId, { 
  status: 'completed',
  endTime: now.toISOString(),
  // 保存超时状态
  startVerificationTimeout: taskStartTimeouts[taskId],
  completionTimeout: taskFinishTimeouts[taskId],
  completionEfficiency: efficiency,
  efficiencyLevel: efficiency >= 80 ? 'excellent' : efficiency >= 60 ? 'good' : efficiency >= 40 ? 'average' : 'poor',
});
```

### 4. 从任务对象恢复超时状态

在组件初始化时，需要从任务对象中恢复超时状态。在 `useEffect` 中添加：

```typescript
useEffect(() => {
  // 从任务对象恢复超时状态
  const timeouts: Record<string, boolean> = {};
  const finishTimeouts: Record<string, boolean> = {};
  
  allTasks.forEach(task => {
    if (task.startVerificationTimeout) {
      timeouts[task.id] = true;
    }
    if (task.completionTimeout) {
      finishTimeouts[task.id] = true;
    }
  });
  
  setTaskStartTimeouts(timeouts);
  setTaskFinishTimeouts(finishTimeouts);
}, [allTasks]);
```

## 效果
- 任务进行中：右上角显示超时/低效率标记
- 任务完成后：标记仍然保留，可以在金币旁边或右上角看到
- 黄色三角感叹号 = 启动超时
- 红色三角感叹号 = 完成超时  
- 🐢 乌龟图标 = 低效率（效率 < 60%）

## 注意事项
由于 `NewTimelineView.tsx` 文件非常大（3563行），建议使用编辑器的搜索功能找到对应位置进行修改。

