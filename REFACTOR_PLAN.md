# 代码重构计划

## 已完成的优化

### 1. 统一语音/音频系统 ✅
扩展了 `unified-voice-system.js`，添加了三个新模块：

- **UnifiedAudioSystem**: 统一音频播放
  - `playSound(type)`: 支持 chime, warning, alarm, success, coin, click, notification
  - `setVolume(vol)`: 设置音量
  - 自动管理 AudioContext 生命周期

- **UnifiedSpeech**: 统一语音播报
  - `speak(text, options)`: 语音播报
  - `stop()`: 停止播报
  - 自动选择中文语音

- **UnifiedScheduler**: 统一定时器调度
  - `onEverySecond(name, callback)`: 注册每秒回调
  - `onEveryMinute(name, callback)`: 注册每分钟回调
  - `onEveryHour(name, callback)`: 注册每小时回调
  - 减少多个 setInterval 的系统开销

### 2. 更新各模块使用统一系统 ✅
- `procrastination.js`: playSound() 和 speakText() 已更新
- `inefficiency.js`: speakText() 已更新
- `procrastination-enhanced.js`: speak(), playAlarmSound(), playSuccessSound() 已更新

---

## 待完成的优化

### 3. app.js 拆分方案

app.js 当前有 5466 行，建议拆分为以下模块：

#### 3.1 app-core.js (~500行)
- App 对象基础定义
- init() 初始化方法
- 全局状态管理
- 工具函数 (formatDate, addMinutes, etc.)

#### 3.2 app-chat.js (~600行)
- loadSmartInput()
- addChatMessage()
- aiParseInput()
- 聊天相关功能

#### 3.3 app-timeline.js (~1200行)
- loadTimeline()
- renderEventCard()
- generateCalendarHtml()
- 日历和时间轴相关功能
- 任务拖拽功能

#### 3.4 app-tasks.js (~800行)
- addTaskToTimeline()
- editTask()
- deleteTask()
- completeTask()
- 任务CRUD操作

#### 3.5 app-memory.js (~500行)
- loadMemoryBank()
- applyMemoryFilters()
- 记忆库相关功能

#### 3.6 app-game.js (~400行)
- loadGameSystem()
- updateGameStatus()
- showCoinAnimation()
- 游戏化系统

#### 3.7 app-monitor.js (~800行)
- loadMonitorPanel()
- renderProcrastinationMonitor()
- renderInefficiencyMonitor()
- 监控面板渲染

#### 3.8 app-modals.js (~600行)
- showAddEventForm()
- showTaskContextMenu()
- showTimeEditor()
- 各种弹窗和模态框

### 4. 定时器整合方案

当前定时器使用情况：
- `procrastination.js`: monitorTimer (每秒), countdownTimer (每秒)
- `inefficiency.js`: monitorTimer (每秒)
- `unified-voice-system.js`: taskCheckTimer (每秒), hourlyCheckTimer (每分钟)
- `app.js`: _timeIndicatorTimer (每秒)

整合方案：使用 UnifiedScheduler 统一管理
```javascript
// 示例：将 procrastination.js 的监控改为使用统一调度器
UnifiedScheduler.onEverySecond('procrastination-monitor', () => {
    ProcrastinationMonitor.checkForDueTasks();
});
```

---

## 实施优先级

1. ✅ 统一语音/音频系统 - 已完成
2. ✅ 更新各模块使用统一系统 - 已完成
3. 🔄 app.js 拆分 - 建议分阶段进行
4. ⏳ 定时器整合 - 可选优化

## 注意事项

- 拆分 app.js 需要确保加载顺序正确
- 需要在 index.html 中按正确顺序引入拆分后的文件
- 建议先在测试环境验证后再部署

## 风险评估

- **低风险**: 统一语音/音频系统（已完成，有降级方案）
- **中风险**: app.js 拆分（需要仔细处理依赖关系）
- **低风险**: 定时器整合（可选优化）

