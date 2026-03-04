# 任务完成后保留超时标记 - 最终修复方案

## 问题分析

你看到的右上角坏习惯按钮（🐢）是在 `TaskVerificationCountdownContent` 组件中显示的，但这个组件在任务完成后就不再渲染了。超时数据存储在组件的 localStorage 中（`countdown_${taskId}`），任务完成后这些数据会被删除。

## 解决方案

需要在任务完成时，将超时数据从倒计时组件同步到任务对象中，这样 `TaskStatusBadge` 组件就能显示这些标记了。

## 需要修改的代码

### 在 NewTimelineView.tsx 中找到 TaskVerificationCountdownContent 组件的调用

大约在第 2385 行，找到这段代码：

```tsx
<TaskVerificationCountdownContent
  key={block.id}
  taskId={block.id}
  taskTitle={block.title}
  scheduledStart={block.startTime}
  scheduledEnd={block.endTime}
  goldReward={block.goldReward || 0}
  onStart={(actualStartTime, calculatedEndTime) => {
    // ... 现有代码
  }}
  onComplete={(actualEndTime) => {
    // ... 现有代码
  }}
  hasVerification={!!taskVerifications[block.id]?.enabled}
  startKeywords={taskVerifications[block.id]?.startKeywords || ['启动', '开始']}
  completeKeywords={taskVerifications[block.id]?.completionKeywords || ['完成', '结束']}
/>
```

### 添加 onTimeoutUpdate 回调

在上面的代码中添加 `onTimeoutUpdate` 属性：

```tsx
<TaskVerificationCountdownContent
  key={block.id}
  taskId={block.id}
  taskTitle={block.title}
  scheduledStart={block.startTime}
  scheduledEnd={block.endTime}
  goldReward={block.goldReward || 0}
  onStart={(actualStartTime, calculatedEndTime) => {
    // ... 现有代码保持不变
  }}
  onComplete={(actualEndTime) => {
    // ... 现有代码保持不变
  }}
  onTimeoutUpdate={(startTimeoutCount, completeTimeoutCount) => {
    // 🔧 新增：保存超时数据到任务对象
    console.log(`💾 保存超时数据: 启动超时${startTimeoutCount}次, 完成超时${completeTimeoutCount}次`);
    
    // 更新任务对象，保存超时标记
    onTaskUpdate(block.id, {
      startVerificationTimeout: startTimeoutCount > 0,
      completionTimeout: completeTimeoutCount > 0,
    });
    
    // 同时更新本地状态
    if (startTimeoutCount > 0) {
      setTaskStartTimeouts(prev => ({ ...prev, [block.id]: true }));
    }
    if (completeTimeoutCount > 0) {
      setTaskFinishTimeouts(prev => ({ ...prev, [block.id]: true }));
    }
  }}
  hasVerification={!!taskVerifications[block.id]?.enabled}
  startKeywords={taskVerifications[block.id]?.startKeywords || ['启动', '开始']}
  completeKeywords={taskVerifications[block.id]?.completionKeywords || ['完成', '结束']}
/>
```

## 完成后的效果

1. **任务进行中**：右上角显示坏习惯历史按钮（🐢），点击可查看详情
2. **任务完成后**：
   - 倒计时组件消失
   - 但是 `TaskStatusBadge` 组件会在任务卡片右上角显示：
     - ⚠️ 黄色三角（启动超时）
     - ⚠️ 红色三角（完成超时）
     - 🐢 乌龟（低效率）
3. **刷新页面**：标记仍然保留

## 测试方法

1. 创建一个新任务并启用验证
2. 故意延迟启动（超过2分钟）
3. 完成任务
4. 检查任务卡片右上角是否显示黄色三角⚠️
5. 刷新页面，确认标记仍然存在

## 如果还是看不到标记

打开浏览器控制台（F12），运行以下代码检查：

```javascript
// 检查任务数据
const taskStore = JSON.parse(localStorage.getItem('task-storage'));
const task = taskStore.state.tasks.find(t => t.status === 'completed');
console.log('任务数据:', {
  title: task.title,
  startVerificationTimeout: task.startVerificationTimeout,
  completionTimeout: task.completionTimeout,
  completionEfficiency: task.completionEfficiency
});

// 如果字段不存在，手动添加测试
task.startVerificationTimeout = true;
localStorage.setItem('task-storage', JSON.stringify(taskStore));
location.reload();
```

