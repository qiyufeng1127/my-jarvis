# 金币惩罚和奖励系统实现说明（第2阶段）

## 📋 已完成的改动

### 1. 更新 TaskVerification 接口

```typescript
export interface TaskVerification {
  enabled: boolean;
  startKeywords: string[];
  completionKeywords: string[];
  startDeadline: Date | null;
  completionDeadline: Date | null;
  
  // 启动验证追踪
  startFailedAttempts: number; // 启动失败次数（0-3）
  startTimeoutCount: number; // 启动超时次数
  startRetryDeadline: Date | null; // 启动重试截止时间
  
  // 完成验证追踪
  completionFailedAttempts: number; // 完成失败次数（0-3）
  completionTimeoutCount: number; // 完成超时次数
  completionExtensionCount: number; // 完成延期次数
  
  status: 'pending' | 'waiting_start' | 'start_retry' | 'started' | 
          'waiting_completion' | 'completion_extension' | 'completed' | 'failed';
  actualStartTime: Date | null;
  actualCompletionTime: Date | null;
  
  // 金币追踪
  startGoldEarned: number; // 启动获得的金币（40%）
  completionGoldEarned: number; // 完成获得的金币（60%）
  totalGoldPenalty: number; // 总共扣除的金币
}
```

### 2. 新增 GoldSystem 类

#### 金币奖励计算
- `calculateStartReward(totalGold)` - 启动奖励 = 总金币 × 40%
- `calculateCompletionReward(totalGold)` - 完成奖励 = 总金币 × 60%

#### 金币惩罚计算
- `calculateStartTimeoutPenalty(timeoutCount)` - 启动超时惩罚
  - 第1次：200金币
  - 第2次：300金币
  - 第3次：400金币
  - 连续3次：600金币 + 全屏警报

- `calculateCompletionTimeoutPenalty(timeoutCount)` - 完成超时惩罚
  - 第1次：200金币
  - 第2次：300金币
  - 第3次：400金币
  - 连续3次：600金币 + 全屏警报

- `calculateStartRetryPenalty(retryCount)` - 启动重试惩罚
  - 第1次重试：0金币
  - 第2次重试：400金币
  - 第3次重试：600金币

- `calculateCompletionExtensionPenalty(extensionCount)` - 完成延期惩罚
  - 第1次延期：200金币
  - 第2次延期：300金币
  - 第3次延期：400金币

### 3. 更新 VoiceReminder 类

新增语音提醒：
- `remindStartTimeout(taskTitle, penaltyGold, timeoutCount)` - 启动超时提醒
- `remindStartRetry(taskTitle, retryCount, penaltyGold)` - 启动重试提醒
- `remindCompletionTimeout(taskTitle, penaltyGold, extensionCount)` - 完成超时提醒
- `remindCriticalFailure(taskTitle, totalPenalty)` - 连续失败全屏警报
- `congratulateStartSuccess(taskTitle, goldEarned)` - 启动成功获得金币

### 4. 重构 TaskMonitor 类

#### 新的监控参数
```typescript
startMonitoring(
  taskId: string,
  taskTitle: string,
  scheduledStart: Date,
  scheduledEnd: Date,
  durationMinutes: number,
  totalGold: number, // 新增：任务总金币
  verification: TaskVerification | null,
  onStartRemind: () => void,
  onEndRemind: () => void,
  onStartTimeout: (timeoutCount: number, penalty: number) => void, // 新增
  onCompletionTimeout: (extensionCount: number, penalty: number) => void // 新增
)
```

#### 启动验证重试机制
- 第1次超时（2分钟）：扣200金币，再给2分钟重试（不扣金币）
- 第2次超时（再2分钟）：扣300金币，再给2分钟重试（扣400金币）
- 第3次超时（再2分钟）：扣400金币 + 重试600金币 = 总共600金币 + 全屏警报

#### 完成验证延期机制
- 第1次超时（任务结束时间）：扣200金币，给10分钟延期
- 第2次超时（10分钟后）：扣300金币，再给10分钟延期
- 第3次超时（再10分钟后）：扣400金币 + 全屏警报，总共600金币

## 🔄 待更新的组件

### NewTimelineView.tsx 需要更新：

1. **初始化验证对象时**：
```typescript
const verification: TaskVerification = {
  enabled: true,
  startKeywords,
  completionKeywords,
  startDeadline: new Date(scheduledStart.getTime() + 2 * 60 * 1000),
  completionDeadline: scheduledEnd,
  
  // 新增字段
  startFailedAttempts: 0,
  startTimeoutCount: 0,
  startRetryDeadline: null,
  completionFailedAttempts: 0,
  completionTimeoutCount: 0,
  completionExtensionCount: 0,
  
  status: 'pending',
  actualStartTime: null,
  actualCompletionTime: null,
  
  // 金币追踪
  startGoldEarned: 0,
  completionGoldEarned: 0,
  totalGoldPenalty: 0,
};
```

2. **调用 TaskMonitor.startMonitoring 时**：
```typescript
TaskMonitor.startMonitoring(
  taskId,
  taskTitle,
  scheduledStart,
  scheduledEnd,
  task.durationMinutes || 30,
  task.goldReward || 100, // 传入任务总金币
  verification,
  () => {
    // 任务开始提醒回调
    setTaskVerifications(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        status: 'waiting_start',
      },
    }));
  },
  () => {
    // 任务结束提醒回调
    setTaskVerifications(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        status: 'waiting_completion',
      },
    }));
  },
  (timeoutCount, penalty) => {
    // 启动超时回调
    setTaskVerifications(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        startTimeoutCount: timeoutCount,
        totalGoldPenalty: prev[taskId].totalGoldPenalty + penalty,
        status: timeoutCount < 3 ? 'start_retry' : 'failed',
        startRetryDeadline: timeoutCount < 3 
          ? new Date(Date.now() + 2 * 60 * 1000) 
          : null,
      },
    }));
  },
  (extensionCount, penalty) => {
    // 完成超时回调
    setTaskVerifications(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        completionExtensionCount: extensionCount,
        totalGoldPenalty: prev[taskId].totalGoldPenalty + penalty,
        status: extensionCount < 3 ? 'completion_extension' : 'failed',
        completionDeadline: extensionCount < 3
          ? new Date(Date.now() + 10 * 60 * 1000)
          : null,
      },
    }));
  }
);
```

3. **启动成功时**：
```typescript
const totalGold = task.goldReward || 100;
const startGold = GoldSystem.calculateStartReward(totalGold);

setTaskVerifications(prev => ({
  ...prev,
  [taskId]: {
    ...prev[taskId],
    status: 'started',
    actualStartTime: now,
    startFailedAttempts: 0,
    startGoldEarned: startGold,
  },
}));

VoiceReminder.congratulateStartSuccess(task.title, startGold);
```

4. **完成成功时**：
```typescript
const totalGold = task.goldReward || 100;
const completionGold = GoldSystem.calculateCompletionReward(totalGold);

setTaskVerifications(prev => ({
  ...prev,
  [taskId]: {
    ...prev[taskId],
    status: 'completed',
    actualCompletionTime: now,
    completionFailedAttempts: 0,
    completionGoldEarned: completionGold,
  },
}));

VoiceReminder.congratulateCompletion(task.title, completionGold);
```

## 📊 金币流程示例

### 正常完成流程
```
任务总金币：100
├─ 启动成功：+40金币（40%）
└─ 完成成功：+60金币（60%）
总获得：100金币
```

### 启动超时1次流程
```
任务总金币：100
├─ 第1次超时：-200金币
├─ 第1次重试成功：+40金币（启动奖励）
└─ 完成成功：+60金币
总获得：-100金币（亏损）
```

### 连续3次启动超时流程
```
任务总金币：100
├─ 第1次超时：-200金币
├─ 第2次超时：-300金币 + 重试-400金币 = -700金币
├─ 第3次超时：-400金币 + 重试-600金币 = -1000金币
└─ 全屏警报 + 任务失败
总损失：-1900金币
```

### 完成延期2次流程
```
任务总金币：100
├─ 启动成功：+40金币
├─ 第1次延期：-200金币
├─ 第2次延期：-300金币
└─ 延期后完成：+60金币
总获得：-400金币（亏损）
```

## 🎯 系统特点

1. **严格的惩罚机制** - 鼓励用户准时完成任务
2. **梯度惩罚** - 越拖延惩罚越重
3. **重试机会** - 给用户改正的机会，但有代价
4. **延期机制** - 低效率也有惩罚
5. **金币分配** - 启动和完成都有奖励，鼓励全程参与
6. **全屏警报** - 连续失败会触发强烈提醒

## ⚠️ 注意事项

1. 所有旧的 `failedAttempts` 字段需要替换为 `startFailedAttempts` 或 `completionFailedAttempts`
2. 需要在UI中显示当前的惩罚金币和获得金币
3. 需要添加金币历史记录功能
4. 建议添加金币统计面板

## 🚀 下一步

1. 更新 NewTimelineView.tsx 组件
2. 测试所有惩罚和奖励流程
3. 添加金币显示UI
4. 添加全屏警报UI
5. 完善文档和用户指南

