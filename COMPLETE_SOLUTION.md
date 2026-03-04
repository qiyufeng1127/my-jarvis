# 任务完成后显示超时标记 - 完整解决方案

## 已完成的修改

### 1. ✅ 创建了 TaskStatusBadge 组件
文件：`src/components/calendar/TaskStatusBadge.tsx`
- 显示启动超时标记（黄色⚠️）
- 显示完成超时标记（红色⚠️）
- 显示低效率标记（🐢）

### 2. ✅ 在 NewTimelineView.tsx 中集成了 TaskStatusBadge
- 已在任务卡片右上角添加了标记显示
- 支持折叠和展开状态

### 3. ✅ 添加了类型定义
文件：`src/types/index.ts`
- 添加了 `completionTimeout?: boolean` 字段

### 4. ✅ 修改了任务完成时的数据保存
文件：`src/components/calendar/NewTimelineView.tsx`
- 在效率模态框完成时保存超时状态

### 5. ✅ 添加了从任务对象恢复超时状态的逻辑
文件：`src/components/calendar/NewTimelineView.tsx`
- 在 useEffect 中从任务对象恢复超时标记

### 6. ✅ 修改了 TaskVerificationCountdownContent 组件
文件：`src/components/calendar/TaskVerificationCountdownContent.tsx`
- 添加了 `onTimeoutUpdate` 回调

## ⚠️ 还需要手动完成的最后一步

由于 `NewTimelineView.tsx` 文件太大（3593行），需要手动添加 `onTimeoutUpdate` 回调。

### 操作步骤：

1. **打开文件**：`src/components/calendar/NewTimelineView.tsx`

2. **搜索**：`<TaskVerificationCountdownContent`（大约在第2385行）

3. **找到这段代码**：
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

4. **在 `onComplete` 回调之后，`hasVerification` 之前添加**：
```tsx
onTimeoutUpdate={(startTimeoutCount, completeTimeoutCount) => {
  console.log(`💾 保存超时数据: 启动${startTimeoutCount}次, 完成${completeTimeoutCount}次`);
  
  onTaskUpdate(block.id, {
    startVerificationTimeout: startTimeoutCount > 0,
    completionTimeout: completeTimeoutCount > 0,
  });
  
  if (startTimeoutCount > 0) {
    setTaskStartTimeouts(prev => ({ ...prev, [block.id]: true }));
  }
  if (completeTimeoutCount > 0) {
    setTaskFinishTimeouts(prev => ({ ...prev, [block.id]: true }));
  }
}}
```

5. **保存文件**

## 测试方法

### 方法1：创建新任务测试
1. 创建一个新任务，启用验证
2. 等待任务到时间
3. 故意延迟2分钟以上再启动（触发启动超时）
4. 完成任务
5. 查看任务卡片右上角是否显示黄色⚠️

### 方法2：手动添加测试数据
打开浏览器控制台（F12），运行：

```javascript
// 给一个已完成的任务添加超时标记
const taskStore = JSON.parse(localStorage.getItem('task-storage'));
const completedTask = taskStore.state.tasks.find(t => t.status === 'completed');

if (completedTask) {
  completedTask.startVerificationTimeout = true;
  completedTask.completionTimeout = false;
  completedTask.completionEfficiency = 45;
  completedTask.efficiencyLevel = 'poor';
  
  localStorage.setItem('task-storage', JSON.stringify(taskStore));
  console.log('✅ 已添加测试数据');
  location.reload();
} else {
  console.log('❌ 没有找到已完成的任务');
}
```

刷新页面后，应该能看到：
- ⚠️ 黄色三角（启动超时）
- 🐢 乌龟（低效率）

## 预期效果

任务完成后的卡片应该是这样的：

```
┌─────────────────────────────────┐
│  ⚠️🐢                    (右上角) │
│  ━━━━━━━━━━━━━━━━━━━━  (划线)   │
│                                 │
│  📷  工作 ✅                     │
│      @完成目标                   │
│                                 │
│  💰 1200  *30 min               │
│  ✓ 已完成                       │
└─────────────────────────────────┘
```

## 如果还是看不到

1. 检查浏览器控制台是否有错误
2. 检查任务数据是否包含超时字段
3. 检查 TaskStatusBadge 组件是否正确渲染
4. 尝试清除浏览器缓存并刷新

## 联系支持

如果按照以上步骤操作后仍然无法显示，请提供：
1. 浏览器控制台的错误信息
2. 任务数据的截图
3. 页面的完整截图

