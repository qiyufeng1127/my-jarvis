# 任务状态标记显示功能 - 修复完成

## 修复内容

已成功修复任务完成后超时和低效率标记消失的问题。

## 修改的文件

### 1. 新建文件：`src/components/calendar/TaskStatusBadge.tsx`
创建了一个专门的组件来显示任务状态标记：
- ⚠️ 黄色三角感叹号 = 启动超时
- 🔴 红色三角感叹号 = 完成超时
- 🐢 乌龟图标 = 低效率（效率 < 60%）

支持两种显示位置：
- `top-right`: 右上角显示（折叠状态）
- `inline`: 内联显示（展开状态，金币旁边）

### 2. 修改文件：`src/components/calendar/NewTimelineView.tsx`

#### 修改1：添加导入
```typescript
import TaskStatusBadge from './TaskStatusBadge';
```

#### 修改2：在任务卡片中显示状态标记
在任务卡片主体的开头添加了 `TaskStatusBadge` 组件，会在右上角显示超时和低效率标记。

#### 修改3：保存超时状态到任务对象
在任务完成时，将超时状态保存到任务对象中：
```typescript
onTaskUpdate(efficiencyModalTask.id, {
  // ... 其他字段
  completionEfficiency: efficiency,
  efficiencyLevel: efficiency >= 80 ? 'excellent' : efficiency >= 60 ? 'good' : efficiency >= 40 ? 'average' : 'poor',
  // 保存超时状态
  startVerificationTimeout: taskStartTimeouts[efficiencyModalTask.id],
  completionTimeout: taskFinishTimeouts[efficiencyModalTask.id],
});
```

#### 修改4：从任务对象恢复超时状态
在 useEffect 中添加了恢复超时状态的逻辑，确保页面刷新后仍能显示标记：
```typescript
// 恢复超时状态（即使任务已完成也要显示）
if (task.startVerificationTimeout) {
  newStartTimeouts[task.id] = true;
}
if (task.completionTimeout) {
  newFinishTimeouts[task.id] = true;
}
```

### 3. 修改文件：`src/types/index.ts`
需要确保 Task 类型中包含以下字段（已存在）：
- `startVerificationTimeout?: boolean`
- `completionTimeout?: boolean`
- `completionEfficiency?: number`
- `efficiencyLevel?: 'excellent' | 'good' | 'average' | 'poor'`

## 功能效果

### 任务进行中
- 右上角显示超时/低效率标记
- 标记会实时更新

### 任务完成后
- 标记仍然保留在右上角
- 可以清晰地看到哪些任务存在坏习惯
- 即使刷新页面，标记也不会消失

### 标记说明
1. **黄色三角感叹号** - 启动超时
   - 任务到达预设时间后，超过2分钟才启动
   
2. **红色三角感叹号** - 完成超时
   - 任务超过预计时长才完成
   
3. **🐢 乌龟图标** - 低效率
   - 完成效率低于60%
   - 或效率等级为 'poor' 或 'average'

## 测试建议

1. 创建一个新任务并设置验证
2. 故意延迟启动（超过2分钟）
3. 完成任务后，检查右上角是否显示黄色三角感叹号
4. 刷新页面，确认标记仍然存在
5. 测试低效率任务（上传照片数量少于计划）

## 注意事项

- 标记只在有超时或低效率时才显示
- 标记会随任务数据持久化保存
- 支持移动端和桌面端不同尺寸显示

