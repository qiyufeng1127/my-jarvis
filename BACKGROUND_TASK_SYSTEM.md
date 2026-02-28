# 后台任务系统 - 实现说明

## 问题描述

用户反馈的核心问题：
1. **语音播报问题**：PWA应用在后台或关闭后无法播报
2. **倒计时问题**：只有打开应用时才开始计时，而不是按照计划时间自动开始
3. **提醒失效**：关闭应用后无法收到任务开始、结束等提醒

## 解决方案

### 1. 后台任务调度服务 (`backgroundTaskScheduler.ts`)

创建了一个新的后台任务调度服务，实现以下功能：

#### 核心特性
- **基于计划时间的自动触发**：任务会在计划的开始时间自动触发，无需用户打开应用
- **状态持久化**：任务状态保存在 localStorage，即使关闭应用也不会丢失
- **定期检查**：每10秒检查一次任务状态，确保及时触发
- **Service Worker 集成**：利用 Service Worker 实现真正的后台运行

#### 主要功能
```typescript
// 调度任务
backgroundTaskScheduler.scheduleTask({
  taskId: 'task-123',
  taskTitle: '早起跑步',
  scheduledStart: '2025-02-28T06:00:00',
  scheduledEnd: '2025-02-28T07:00:00',
  goldReward: 100,
  hasVerification: true,
  startKeywords: ['跑鞋', '运动服'],
  completeKeywords: ['汗水', '疲惫']
});

// 更新任务状态
backgroundTaskScheduler.updateTaskStatus(taskId, 'task_countdown', {
  taskDeadline: deadline.toISOString(),
  actualStartTime: now.toISOString()
});

// 取消任务调度
backgroundTaskScheduler.unscheduleTask(taskId);
```

### 2. Service Worker 增强 (`service-worker.js`)

更新了 Service Worker，添加以下功能：

#### 定期检查
- 每30秒检查一次任务状态
- 即使应用关闭，Service Worker 仍在后台运行
- 通过 postMessage 与主线程通信

#### 通知支持
- 使用 `registration.showNotification()` 发送通知
- 支持点击通知打开应用
- 支持振动反馈

### 3. 组件集成 (`TaskVerificationCountdownContent.tsx`)

更新了倒计时组件，集成后台任务调度：

#### 状态同步
```typescript
// 组件挂载时注册任务
useEffect(() => {
  backgroundTaskScheduler.scheduleTask({...});
}, [taskId, ...]);

// 从后台同步状态
const backendState = backgroundTaskScheduler.getTaskStatus(taskId);
if (backendState) {
  setState(backendState);
}

// 状态变化时同步到后台
backgroundTaskScheduler.updateTaskStatus(taskId, 'task_countdown', {
  taskDeadline: deadline.toISOString()
});
```

### 4. 应用初始化 (`App.tsx`)

在应用启动时初始化后台任务调度服务：

```typescript
const { backgroundTaskScheduler } = await import('@/services/backgroundTaskScheduler');
await backgroundTaskScheduler.init();
```

## 工作流程

### 任务生命周期

```
1. 用户创建任务（10:30 起床）
   ↓
2. 组件注册任务到后台调度服务
   ↓
3. 后台服务每10秒检查任务状态
   ↓
4. 到达10:30时，自动触发：
   - 发送浏览器通知："任务开始"
   - 播放提示音
   - 语音播报："起床任务现在已开始"
   - 进入启动倒计时（2分钟）
   ↓
5. 用户在11:00打开应用
   ↓
6. 组件从后台同步状态
   - 显示已拖延多次
   - 显示当前倒计时
   - 显示扣除的金币
```

### 后台运行机制

```
应用关闭状态：
  Service Worker (后台运行)
    ↓ 每30秒
  检查 localStorage 中的任务状态
    ↓ 发现任务到期
  发送浏览器通知
    ↓ 用户点击通知
  打开应用
    ↓
  组件从 localStorage 加载状态
    ↓
  显示正确的倒计时和拖延次数
```

## 技术限制与解决方案

### 限制1：语音播报
**问题**：浏览器不允许后台播放语音

**解决方案**：
- 使用浏览器通知代替语音播报
- 通知可以显示文字和播放系统提示音
- 用户打开应用后，语音播报恢复正常

### 限制2：定时器精度
**问题**：后台标签页的定时器会被延迟

**解决方案**：
- 使用 Service Worker 的定期检查（不受标签页限制）
- 基于时间戳计算，而不是依赖定时器
- 应用重新打开时立即同步状态

### 限制3：iOS Safari 限制
**问题**：iOS Safari 对 PWA 的后台运行有严格限制

**解决方案**：
- 使用 Web Push API（需要用户授权）
- 状态持久化到 localStorage
- 应用重新打开时恢复状态

## 用户体验改进

### 改进前
1. 用户设置10:30起床
2. 用户睡到11:00才打开应用
3. 应用从11:00开始倒计时 ❌
4. 没有任何提醒 ❌

### 改进后
1. 用户设置10:30起床
2. 10:28 收到通知："还有2分钟，起床任务即将开始" ✅
3. 10:30 收到通知："起床任务现在已开始，请进行启动验证" ✅
4. 10:32 收到通知："启动超时，扣除20金币" ✅
5. 用户在11:00打开应用
6. 看到已拖延15次，扣除300金币 ✅
7. 倒计时显示正确的剩余时间 ✅

## 测试建议

### 测试场景1：正常流程
1. 创建一个5分钟后开始的任务
2. 关闭应用
3. 等待5分钟
4. 检查是否收到通知
5. 打开应用，检查倒计时是否正确

### 测试场景2：拖延流程
1. 创建一个1分钟后开始的任务
2. 关闭应用
3. 等待5分钟（不打开应用）
4. 打开应用
5. 检查是否显示拖延次数和扣除金币

### 测试场景3：提前完成
1. 创建一个任务并启动
2. 关闭应用
3. 等待一段时间
4. 打开应用并完成任务
5. 检查是否正确计算奖励

## 注意事项

1. **通知权限**：首次使用需要用户授权通知权限
2. **Service Worker**：需要 HTTPS 或 localhost 才能使用
3. **浏览器兼容性**：建议使用 Chrome、Edge、Firefox 等现代浏览器
4. **iOS 限制**：iOS Safari 的后台运行能力有限，建议添加到主屏幕使用
5. **电池优化**：Android 设备可能需要关闭电池优化才能正常接收通知

## 未来改进方向

1. **原生应用**：使用 Capacitor 或 React Native 打包为原生应用，获得完整的后台能力
2. **推送服务**：集成 Firebase Cloud Messaging 等推送服务
3. **智能提醒**：根据用户习惯调整提醒时间和频率
4. **离线支持**：完善离线功能，确保无网络时也能正常运行

